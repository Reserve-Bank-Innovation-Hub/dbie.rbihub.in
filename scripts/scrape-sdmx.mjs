// DBIE SDMX scraper — pure HTTP, no browser.
//
// For each element in data/sdmx-tree.json the gateway is driven exactly as the
// portal's Data Query wizard drives it, minus the UI:
//   1. dbie_getElementDetailsActionEnhanced  → fact table, frequency, flow type
//   2. dbie_getCodeListActionEnhanced        → dimension codes (no value filter is
//                                              sent, so every value is selected)
//   3. dbie_insertPolicyActionEnhanced       → save a query "policy": GROUP BY every
//                                              dimension + unit, date window
//   4. dbie_createDDLActionEnhanced          → materialise the query
//   5. download/dbie_getSDMXExcelData        → the SDMX CSV (despite the name)
// The Output-tab render (dbie_getImpalaDQActionEnhanced) is not needed for the
// download; it is only used as a fallback when the CSV export fails server-side
// (a few alphanumeric series), in which case the rows are saved as JSON.
//
// Output:  data/sdmx-raw/<Sector>/<SubSector>/<DSD>.csv   (gitignored staging;
//          `node scripts/ingest-sdmx.mjs` files them into data/sdmx/)
//          data/scrape-manifest.json                       (per-element status)
//
// Usage:
//   node scripts/scrape-sdmx.mjs                     # every element not yet OK in the manifest
//   node scripts/scrape-sdmx.mjs --force             # re-scrape everything
//   node scripts/scrape-sdmx.mjs --retry-failures    # only elements whose last status is not OK
//   node scripts/scrape-sdmx.mjs --dsd A,B [--from YYYY-MM-DD] [--to YYYY-MM-DD]
//   node scripts/scrape-sdmx.mjs --sector "External Sector" [--sub "External Debt"] [--limit N]
//   --concurrency N     parallel elements (default 2 — be polite, this is a public service)
//   --delay MS          pause between elements per worker (default 1500)
//   --daily-from DATE   window start for Daily series without a start date (default 2011-01-01)
//   --dry-run           print the plan and the date windows only
//   --verbose           per-call timings

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gateway, GatewayError, enc, encObject } from './lib/dbie-gateway.mjs';

const REPO      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TREE_FILE = path.join(REPO, 'data', 'sdmx-tree.json');
const RAW_DIR   = path.join(REPO, 'data', 'sdmx-raw');
const JSON_DIR  = path.join(RAW_DIR, 'json');
const MANIFEST  = path.join(REPO, 'data', 'scrape-manifest.json');

// --------- CLI
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const has  = n => argv.includes(n);
const opts = {
    dsd         : flag('--dsd') ? flag('--dsd').split(',').map(s => s.trim()).filter(Boolean) : null,
    sector      : flag('--sector'),
    sub         : flag('--sub'),
    limit       : flag('--limit') ? parseInt(flag('--limit'), 10) : null,
    from        : flag('--from'),
    to          : flag('--to'),
    dailyFrom   : flag('--daily-from') || '2011-01-01',
    concurrency : Math.max(1, parseInt(flag('--concurrency') || '2', 10)),
    delayMs     : parseInt(flag('--delay') || '1500', 10),   // pause between elements per worker
    force       : has('--force'),
    retry       : has('--retry-failures'),
    dryRun      : has('--dry-run'),
    verbose     : has('--verbose'),
    budgetMs    : parseInt(flag('--budget') || '900000', 10),   // 15 min per element
};
for (const d of [opts.from, opts.to, opts.dailyFrom]) if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) { console.error(`bad date: ${d} (want YYYY-MM-DD)`); process.exit(2); }

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const slug = s => (s || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 120);
const isoToday = () => new Date().toISOString().slice(0, 10);
const ddmmyyyy = iso => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;

// --------- Manifest
function loadManifest() {
    if (fs.existsSync(MANIFEST)) return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return { started: new Date().toISOString(), method: 'http', results: {} };
}
function saveManifest(m) {
    const tmp = MANIFEST + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(m, null, 2));
    fs.renameSync(tmp, MANIFEST);
}

// --------- Date window per element
// The portal filters on TIME_PERIOD_SK >= from and <= to; observations are dated
// at period end, so the element's declared start date works as-is for all but
// annual series, which the wizard aligns to the financial / calendar year.
function windowFor(el) {
    const today = new Date();
    // ELE_START_DATE is null for Daily elements and the literal string "null" for a few others.
    const declared = el.startDate && el.startDate !== 'null' ? el.startDate : null;
    // No declared start: ask for everything (the gateway returns only what exists); Daily uses --daily-from.
    let from = opts.from || declared || (el.frequency === 'Daily' ? opts.dailyFrom : '1950-01-01');
    let to   = opts.to   || isoToday();
    if (el.frequency === 'Annual - Financial Year') {
        if (!opts.from) { const y = +from.slice(0, 4) - (from.slice(5) <= '03-31' ? 1 : 0); from = `${y}-04-01`; }
        if (!opts.to)   { const ty = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear(); to = `${ty}-03-31`; }
    } else if (el.frequency === 'Annual - Calendar Year') {
        if (!opts.from) from = `${from.slice(0, 4)}-01-01`;
        if (!opts.to)   to   = `${today.getFullYear()}-12-31`;
    }
    return { from, to };
}
// Frequency word the policy service expects.
const freqWord = f => ({ Annual: 'YEARLY' })[f.split(' ')[0]] || f.split(' ')[0].toUpperCase();

// --------- CSV validation
const CORE = new Set(['DATAFLOW', 'AUDST', 'FREQ', 'REPYEAREND', 'REPYEARSTART', 'UNIT_MULT', 'TIME_PERIOD', 'UNIT_MEASURE', 'OBS_VALUE']);
function inspectCsv(buf) {
    const text = buf.toString('utf8');
    if (!text.startsWith('DATAFLOW')) return { ok: false, reason: `not a CSV: ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}` };
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(',');
    const tp = header.indexOf('TIME_PERIOD'), ov = header.indexOf('OBS_VALUE');
    if (tp < 0 || ov < 0) return { ok: false, reason: 'header lacks TIME_PERIOD/OBS_VALUE' };
    if (lines.length < 2) return { ok: false, reason: 'no observations' };
    const dimCols = header.map((h, i) => [h, i]).filter(([h]) => !CORE.has(h));
    const dims = Object.fromEntries(dimCols.map(([h]) => [h, new Set()]));
    const periods = new Set();
    let malformed = 0, badDates = 0;
    for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(',');
        if (c.length !== header.length) { malformed++; continue; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(c[tp])) badDates++;
        periods.add(c[tp]);
        for (const [h, j] of dimCols) dims[h].add(c[j]);
    }
    const sorted = [...periods].sort();
    const warnings = [];
    if (malformed) warnings.push(`${malformed} rows with unexpected column count`);
    if (badDates) warnings.push(`${badDates} rows with non-ISO TIME_PERIOD`);
    return { ok: true, rows: lines.length - 1, periods: periods.size, first: sorted[0], last: sorted[sorted.length - 1],
             dims: Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, v.size])), warnings };
}

// --------- One element
const countLeaves = n => (n.children || []).reduce((s, c) => s + countLeaves(c), 0) + (n.element ? 1 : 0);

async function scrapeElement(gw, el) {
    const t0 = Date.now();
    const v = (m) => { if (opts.verbose) log(`      ${el.dsdCode}: ${m} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); };
    const { from, to } = windowFor(el);
    const fw = freqWord(el.frequency);

    const det = (await gw.post('dbie_getElementDetailsActionEnhanced', { body: { dimData: { elementCodes: enc(el.dsdCode) } } })).result?.[0];
    if (!det?.table_name) return { status: 'no-details', from, to };
    v(`table ${det.table_name}`);

    const labelDetails = [encObject({ dsdCode: el.dsdCode, elementName: el.label, elementId: el.elementId, elementType: el.flowType, elementFrequency: el.frequency })];
    const cl = await gw.post('dbie_getCodeListActionEnhanced', { body: { dimData: { elementCodes: enc(el.dsdCode), elementIds: enc(el.elementId), elementLableDetails: labelDetails } } });
    const dims = (cl.result?.[0]?.data || []).map(d => ({ code: d.dim_code, name: d.dim_name, values: countLeaves({ children: d.dim_code_list_values }) }));
    v(`dims ${dims.map(d => `${d.code}(${d.values})`).join(' ')}`);

    const policy = 'dq' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const rule = o => encObject(o);
    const rules = [
        // One GROUP_BY per code-list dimension (UNIT_MEASURE is a dimension where the element has one; adding it
        // unconditionally breaks elements without it, e.g. IND_CNTRY_FDI_RN).
        ...dims.map(d => rule({ database_name: '<ALL_FACT>', rule_category: 'AGGREGATION', column_name: `${d.code.toLowerCase()}_description`, rule_function: 'GROUP_BY', table_name: '<ALL_FACT>', elementName: el.label, dsdList: el.dsdCode })),
        rule({ database_name: (det.database_name || 'ebr_public_elements').toUpperCase(), rule_category: 'AGGREGATION', column_name: 'OBS_VALUE', rule_function: el.isAlphaNumeric ? 'ALPHANUMERIC' : 'Not Applicable', table_name: det.table_name, elementName: 'COMMON', dsdList: el.dsdCode }),
        rule({ database_name: '<ALL_FACT>', rule_category: 'TIME_BARRING', column_name: 'TIME_PERIOD_SK', rule_function: 'FROM_DATE', table_name: '<ALL_FACT>', attribute_value: `'${from}'`, elementName: 'COMMON', dsdList: 'COMMON' }),
        rule({ database_name: '<ALL_FACT>', rule_category: 'TIME_BARRING', column_name: 'TIME_PERIOD_SK', rule_function: 'TO_DATE',   table_name: '<ALL_FACT>', attribute_value: `'${to}'`,   elementName: 'COMMON', dsdList: 'COMMON' }),
    ];
    await gw.post('dbie_insertPolicyActionEnhanced', { body: { policyData: {
        policyName: enc(policy), username: enc('test_user'), polFreq: enc(fw), department: enc('test_dept'), rules,
        elementDetails: { [enc(det.table_name)]: { Element_Frequency: enc((det.Element_Frequency || el.frequency).toUpperCase()), Element_Code: enc(el.dsdCode), Element_Flow_Type: enc((det.Element_Flow_Type || el.flowType || 'Not Applicable').toUpperCase()) } },
    } } });
    const ddl = await gw.post('dbie_createDDLActionEnhanced', { body: { selection: enc('1'), policyName: enc(policy), scrapId: enc('4'), dsdList: enc(el.dsdCode) } });
    if (!/created/i.test(String(ddl.result))) throw new GatewayError(`createDDL: ${JSON.stringify(ddl).slice(0, 200)}`);
    v('query created');

    // Download; the servlet returns HTTP 200 + an HTML error page when the export fails.
    let inspect = null, buf = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await gw.download('download/dbie_getSDMXExcelData', `{"body":{"dsdCode":"${enc(el.dsdCode.toLowerCase())}", "policyName":"${enc(policy)}"}}`);
        buf = r.buf; inspect = inspectCsv(buf);
        if (inspect.ok) break;
        v(`download attempt ${attempt} failed: ${inspect.reason}`);
        await new Promise(res => setTimeout(res, 3000 * attempt));
    }
    if (!inspect.ok) {
        // Fallback: the query result as JSON, so the observations are not lost.
        const q = await gw.post('dbie_getImpalaDQActionEnhanced', { body: { dimData: {
            dsdCode: enc(el.dsdCode.toLowerCase()), advanceOptions: enc(''), unitMultiplier: enc('actuals'), policyName: enc(policy),
            isFinancialYear: enc('false'), fromDate: enc(ddmmyyyy(from)), toDate: enc(ddmmyyyy(to)), freqSelected: enc(fw),
            entitySelection: [{ op_level5: enc('') }, { op_level4: enc('') }, { op_level3: enc('') }, { op_level2: enc('') }, { op_level1: enc('') }, { entity_name: enc('') }],
            elementLableDetails: labelDetails, isAlphaNumeric: !!el.isAlphaNumeric,
        } } }, { timeoutMs: 600_000 });
        const rows = q.result?.[0]?.data?.result || [];
        fs.mkdirSync(JSON_DIR, { recursive: true });
        const jf = path.join(JSON_DIR, `${el.dsdCode}.json`);
        fs.writeFileSync(jf, JSON.stringify({ dsdCode: el.dsdCode, from, to, fetched: new Date().toISOString(), rows }));
        return { status: 'export-error', error: inspect.reason, jsonRows: rows.length, jsonFile: path.relative(REPO, jf), from, to };
    }
    const file = path.join(RAW_DIR, slug(el.sector), slug(el.subSector), `${el.dsdCode}.csv`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    return { status: 'ok', file: path.relative(REPO, file), bytes: buf.length, rows: inspect.rows, periods: inspect.periods, first: inspect.first, last: inspect.last,
             dims: inspect.dims, codelist: Object.fromEntries(dims.map(d => [d.code, d.values])), warnings: inspect.warnings, from, to };
}

const throttled = e => /HTTP (418|429|503)/.test(String(e?.message || ''));
async function withRetries(fn, tries = 4) {
    let lastErr;
    for (let i = 1; i <= tries; i++) {
        try { return await fn(); }
        catch (e) {
            lastErr = e;
            if (i < tries) {
                // 418/429/503 come from the portal's firewall or overload: wait well clear of it.
                const wait = throttled(e) ? 120_000 : ([5000, 20000, 60000][i - 1] || 60000);
                if (throttled(e)) log(`      throttled (${e.message}); pausing ${wait / 1000}s`);
                await new Promise(r => setTimeout(r, wait));
            }
        }
    }
    throw lastErr;
}

// --------- Main
async function main() {
    const tree = JSON.parse(fs.readFileSync(TREE_FILE, 'utf8'));
    let tasks = tree.flatMap(g => g.elements.map(e => ({ ...e, sector: g.sector, subSector: g.subSector })));
    if (opts.dsd)    tasks = tasks.filter(e => opts.dsd.includes(e.dsdCode));
    if (opts.sector) tasks = tasks.filter(e => e.sector === opts.sector);
    if (opts.sub)    tasks = tasks.filter(e => e.subSector === opts.sub);
    const manifest = loadManifest();
    if (opts.retry) {
        let n = 0;
        for (const [k, r] of Object.entries(manifest.results)) if (r.status !== 'ok') { delete manifest.results[k]; n++; }
        log(`--retry-failures: cleared ${n} non-OK manifest entries`);
        tasks = tasks.filter(e => !manifest.results[e.dsdCode]);
    } else if (!opts.force) {
        tasks = tasks.filter(e => manifest.results[e.dsdCode]?.status !== 'ok');
    }
    if (opts.limit) tasks = tasks.slice(0, opts.limit);
    log(`Planned: ${tasks.length} element(s) of ${tree.reduce((n, g) => n + g.elements.length, 0)}; concurrency ${opts.concurrency}`);
    if (opts.dryRun) {
        for (const e of tasks) { const w = windowFor(e); console.log(`  ${e.dsdCode.padEnd(28)} ${e.frequency.padEnd(26)} ${w.from} → ${w.to}  ${e.sector} / ${e.subSector}`); }
        return;
    }
    if (!tasks.length) { log('Nothing to do.'); return; }

    // Self-check: one plaintext-in, plaintext-out call that only works if the cipher constants are current.
    const probe = new Gateway();
    await probe.openSession();
    const chk = (await probe.post('dbie_getElementDetailsActionEnhanced', { body: { dimData: { elementCodes: enc('EXT_DBT_RT_RN') } } })).result?.[0];
    if (chk?.table_name !== 'fact_ebr_ext_dbt_rt_rn') {
        console.error('Self-check failed: the gateway did not understand an encrypted request. The cipher constants in scripts/lib/dbie-gateway.mjs have probably rotated; see the note there.');
        process.exit(1);
    }

    manifest.started = new Date().toISOString();
    manifest.method = 'http';
    let idx = 0, ok = 0, failed = 0, exportErr = 0;
    const queue = [...tasks];
    const worker = async (wid) => {
        const gw = new Gateway();
        await gw.openSession();
        while (queue.length) {
            const el = queue.shift();
            const i = ++idx;
            const t0 = Date.now();
            let r;
            try {
                let budgetTimer;
                r = await Promise.race([
                    withRetries(() => scrapeElement(gw, el)).finally(() => clearTimeout(budgetTimer)),
                    new Promise((_, rej) => { budgetTimer = setTimeout(() => rej(new Error(`per-element budget of ${opts.budgetMs / 1000}s exceeded`)), opts.budgetMs); }),
                ]);
            } catch (e) {
                if (e instanceof GatewayError && /session|token|unauthori/i.test(e.message)) { try { await gw.openSession(); } catch {} }
                r = { status: 'error', error: String(e.message || e).slice(0, 300) };
            }
            r.took = Math.round((Date.now() - t0) / 1000);
            r.at = new Date().toISOString();
            manifest.results[el.dsdCode] = r;
            saveManifest(manifest);
            if (queue.length && opts.delayMs) await new Promise(res => setTimeout(res, opts.delayMs));
            if (r.status === 'ok') { ok++; log(`[${i}/${tasks.length}] ${el.dsdCode.padEnd(28)} ok      rows=${String(r.rows).padStart(7)} periods=${String(r.periods).padStart(5)} ${r.first}..${r.last} ${r.took}s${r.warnings?.length ? '  WARN ' + r.warnings.join('; ') : ''}`); }
            else if (r.status === 'export-error') { exportErr++; log(`[${i}/${tasks.length}] ${el.dsdCode.padEnd(28)} EXPORT-ERROR (${r.jsonRows} rows saved as JSON) ${r.took}s`); }
            else { failed++; log(`[${i}/${tasks.length}] ${el.dsdCode.padEnd(28)} ${r.status.toUpperCase()} ${r.error || ''} ${r.took}s`); }
        }
    };
    await Promise.all(Array.from({ length: Math.min(opts.concurrency, tasks.length) }, (_, w) => worker(w)));
    log(`Done — ok=${ok}, export-error=${exportErr}, failed=${failed}. Manifest: ${path.relative(REPO, MANIFEST)}`);
    if (failed) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
