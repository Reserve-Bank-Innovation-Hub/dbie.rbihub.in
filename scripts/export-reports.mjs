// DBIE report-table exporter — pure HTTP, no browser.
//
// The SDMX scraper (scripts/scrape-sdmx.mjs) covers the Data Query wizard. This
// one covers the other half of the portal: the *report* pages under Statistics
// and Publication, which are SAP BusinessObjects Web Intelligence documents and
// have no SDMX equivalent. For each report the gateway and the BOE RESTful
// services are driven exactly as the portal's viewer drives them, minus the UI:
//
//   1. security_generateSessionToken   → guest gateway session
//   2. login_getSapToken               → a SAP session (rationed; poll >= 30 s apart)
//   3. dbie_getReportLink              → sapLink carrying the document CUID and,
//                                        in its `token=` parameter, a BOE logon
//                                        token usable as X-SAP-LogonToken
//   4. …/biprwsproxy/biprws/…          → open the document, refresh it, pick the
//                                        periods, export (see scripts/lib/boe-raylight.mjs)
//
// One BOE token serves the whole run; the gateway is touched only to mint it and
// on CUID-cache misses, because it sits behind an F5 WAF that answers HTTP 418
// for ~20 minutes once it decides you are calling too often.
//
// Output:  data/reports/<section>/<category>/<subsection>/<id>--<name>[--<tab>][--<period>].csv
//          …and .xlsx, plus <id>.meta.json beside them
//          data/reports-manifest.json     (per-report status; resumable)
//          data/reports-cuid-cache.json   (reportId → document CUID; avoids gateway calls)
//
// Usage:
//   node scripts/export-reports.mjs                          # every report still needing one
//   node scripts/export-reports.mjs --ids 1200,1302
//   node scripts/export-reports.mjs --select all-tables --subsection "Monthly RBI Bulletin"
//   node scripts/export-reports.mjs --section Publication --select all-tables --limit 20
//   --select needs-reports|possible|all-tables   what to take from data/coverage-report.csv
//                 needs-reports  (default) verdict "unmatched …", minus the three big
//                                Publication menus that the Bulletin/Handbook/WSS
//                                pipelines already cover
//                 possible       verdict "possible"
//                 all-tables     every verdict except "non-table"
//   --section S   Statistics | Publication          (combines with --select / --subsection)
//   --subsection  exact subsection name             (combines with --select / --section)
//   --ids A,B     explicit report ids; overrides --select but not --limit
//   --formats     csv,xlsx (default) — also xls, pdf, html, txt
//   --periods     all (default: whole history in one file) | latest
//   --unit        LAKHS|MILLIONS|CRORES|BILLIONS when the document offers the control
//   --gap MS      minimum gap between BOE requests (default 1000 — one per second)
//   --gateway-gap MS  minimum gap between gateway calls (default 6000)
//   --session-minutes N  also renew the BOE session every N minutes (default 0 = only when a call fails;
//                        a token in active use stays alive, and every renewal spends a scarce guest logon)
//   --max-workbook-rows N  skip the whole-workbook xlsx/pdf export above N CSV data rows (default 500000)
//   --limit N     stop after N reports
//   --force       re-export reports already marked ok in the manifest
//   --dry-run     print the plan only
//   --verbose     per-call timings

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gateway, GatewayError, enc, dec, LOGIN_GATEWAY } from './lib/dbie-gateway.mjs';
import {
    Raylight, ThrottledError, Pacer, sleep,
    discoverBuild, parseSapLink, isPeriodControl, newestValue, EXPORT_MIME,
} from './lib/boe-raylight.mjs';

const REPO       = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOGUE  = path.join(REPO, 'data', 'reports-catalogue.json');
const COVERAGE   = path.join(REPO, 'data', 'coverage-report.csv');
const OUT_DIR    = path.join(REPO, 'data', 'reports');
const MANIFEST   = path.join(REPO, 'data', 'reports-manifest.json');
const CUID_CACHE = path.join(REPO, 'data', 'reports-cuid-cache.json');

// Publication menus with their own pipelines; excluded from the default selection
// but reachable with --select all-tables / --subsection.
const BULK_PUBLICATIONS = new Set([
    'Monthly RBI Bulletin',
    'Handbook of Statistics on the Indian Economy',
    'Weekly Statistical Supplement',
]);

// --------- CLI
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const has  = n => argv.includes(n);
const opts = {
    ids        : flag('--ids') ? flag('--ids').split(',').map(s => s.trim()).filter(Boolean) : null,
    select     : flag('--select') || 'needs-reports',
    section    : flag('--section'),
    subsection : flag('--subsection'),
    formats    : (flag('--formats') || 'csv,xlsx').split(',').map(s => s.trim()).filter(Boolean),
    periods    : flag('--periods') || 'all',
    unit       : flag('--unit'),
    gapMs      : parseInt(flag('--gap') || '1000', 10),
    gatewayGap : parseInt(flag('--gateway-gap') || '6000', 10),
    sessionMs  : parseInt(flag('--session-minutes') || '0', 10) * 60_000,    // 0 = renew only on error (a token in active use stays alive; every renewal costs a scarce guest logon)
    maxWorkbookRows : parseInt(flag('--max-workbook-rows') || '500000', 10),
    limit      : flag('--limit') ? parseInt(flag('--limit'), 10) : null,
    force      : has('--force'),
    dryRun     : has('--dry-run'),
    verbose    : has('--verbose'),
};
if (!['needs-reports', 'possible', 'all-tables'].includes(opts.select)) { console.error(`bad --select: ${opts.select}`); process.exit(2); }
if (!['all', 'latest'].includes(opts.periods)) { console.error(`bad --periods: ${opts.periods}`); process.exit(2); }
for (const f of opts.formats) if (!EXPORT_MIME[f]) { console.error(`bad --formats entry: ${f} (want ${Object.keys(EXPORT_MIME).join(',')})`); process.exit(2); }
if (opts.gapMs < 1000) { console.error('--gap below 1000 ms is not allowed: this is a public service'); process.exit(2); }
if (opts.gatewayGap < 6000) { console.error('--gateway-gap below 6000 ms is not allowed: the gateway WAF bites'); process.exit(2); }

const log  = msg => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const kebab = (s, max = 100) => (s || '')
    .normalize('NFKD').replace(/[^\w\s-]+/g, ' ')
    .trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').slice(0, max).replace(/-$/, '') || 'untitled';
// "2026-03-31T00:00:00.000Z" → "2026-03-31"; "2026-27:Q1" → "2026-27-q1"
const periodTag = v => /^\d{4}-\d{2}-\d{2}T/.test(String(v)) ? String(v).slice(0, 10) : kebab(String(v), 40);

// --------- Manifest / cache (atomic writes; the run is resumable)
const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } };
function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, file);
}

// --------- Selection
function loadTasks() {
    const catalogue = readJson(CATALOGUE, null);
    if (!catalogue) { console.error(`missing ${path.relative(REPO, CATALOGUE)} — run scripts/fetch-reports-catalogue.mjs first`); process.exit(2); }

    // Flatten the catalogue's section > category > subsection > groups > reports tree.
    const byId = new Map();
    for (const page of catalogue) {
        for (const group of page.groups || []) {
            for (const r of group.reports || []) {
                if (r.reportId == null) continue;
                byId.set(String(r.reportId), {
                    reportId   : String(r.reportId),
                    reportName : r.reportName || '',
                    frequency  : r.frequency || '',
                    from       : r.from || '', to: r.to || '',
                    section    : page.section || '', category: page.category || '', subsection: page.subsection || '',
                    group      : group.title || '',
                });
            }
        }
    }

    // Verdicts come from the coverage report; a report absent from it has no verdict.
    const verdicts = new Map();
    if (fs.existsSync(COVERAGE)) for (const row of parseCsv(fs.readFileSync(COVERAGE, 'utf8'), ',')) {
        const id = (row.reportId || '').trim();
        if (id) verdicts.set(id, (row.verdict || '').trim());
    }

    let tasks;
    if (opts.ids) {
        tasks = opts.ids.map(id => byId.get(id) || { reportId: id, reportName: '', section: '', category: '', subsection: '', group: '' });
    } else {
        tasks = [...byId.values()].filter(t => {
            const v = verdicts.get(t.reportId) || '';
            if (opts.select === 'possible')   return v === 'possible';
            if (opts.select === 'all-tables') return v !== 'non-table';
            // needs-reports
            return v.startsWith('unmatched') && (t.section === 'Statistics' || !BULK_PUBLICATIONS.has(t.subsection));
        });
    }
    // --section / --subsection narrow whatever --select or --ids produced.
    if (opts.section)    tasks = tasks.filter(t => t.section === opts.section);
    if (opts.subsection) tasks = tasks.filter(t => t.subsection === opts.subsection);
    for (const t of tasks) t.verdict = verdicts.get(t.reportId) || '';
    return tasks;
}

/** Minimal RFC4180 reader; also used for the `;`-delimited Webi exports. */
function parseCsv(text, delim = ',') {
    const rows = [];
    let row = [], cell = '', quoted = false;
    const s = text.replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (quoted) {
            if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === delim) { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c === '\r') { /* handled by \n */ }
        else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    // The coverage report has a header row; the Webi exports do not.
    if (delim === ',') {
        const head = rows[0].map(h => h.trim());
        return rows.slice(1).filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
    }
    return rows;
}

/**
 * Does an exported CSV actually carry data? A refreshed-but-empty document still
 * exports its title, caption and column headers, so "has rows" is not enough:
 * we look for a row with two or more non-empty cells at least one of which is a
 * number, which is exactly what the caption and header lines lack.
 */
function inspectCsv(buf) {
    const rows = parseCsv(buf.toString('utf8'), ';');
    const nonEmpty = r => r.filter(c => String(c).trim() !== '').length;
    const numeric  = r => r.some(c => /\d/.test(c) && /^[\s(\-–₹]*[\d,.]+[\s)%]*$/.test(String(c).trim()));
    const dataRows = rows.filter(r => nonEmpty(r) >= 2 && numeric(r));
    return {
        rows    : rows.length,
        cols    : rows.reduce((m, r) => Math.max(m, r.length), 0),
        dataRows: dataRows.length,
        hasData : dataRows.length > 0,
    };
}

// --------- Gateway (paced; only touched to mint the token and on cache misses)
const gatewayPacer = new Pacer(opts.gatewayGap);
const gw = new Gateway();

async function gatewayCall(fn) { await gatewayPacer.wait(); return fn(); }

/** Poll the rationed guest SAP session. The portal's own retry modal waits 30 s. */
async function acquireSapSession({ attempts = 12 } = {}) {
    for (let i = 0; i < attempts; i++) {
        if (i) await sleep(30_000);
        try {
            const body = await gatewayCall(() => gw.post('login_getSapToken', { body: { portalCode: 'DBIE', user: '', code: '' } }, { base: LOGIN_GATEWAY }));
            if (body?.status?.status) { log(`SAP session granted (attempt ${i + 1})`); return true; }
            log(`SAP session refused (attempt ${i + 1}/${attempts}) — portal under load, waiting 30 s`);
        } catch (e) {
            log(`login_getSapToken failed (attempt ${i + 1}/${attempts}): ${e.message}`);
        }
    }
    return false;
}

/** dbie_getReportLink → { cuid, token }. One gateway call; mints a BOE session. */
async function fetchReportLink(reportId) {
    const body = await gatewayCall(() => gw.post('dbie_getReportLink', { body: { reportId: enc(String(reportId)), lang: enc('en') } }));
    const link = dec(body?.sapLink);
    if (!link) throw new GatewayError(`dbie_getReportLink returned no sapLink for ${reportId}`);
    const { cuid, token } = parseSapLink(link);
    if (!cuid) throw new GatewayError(`no CUID in the sapLink for ${reportId}`);
    return { link, cuid, token };
}

/**
 * Put the period control into the state that yields the periods we asked for, coping
 * with controls that will not take a list.
 *
 * Most DBIE period controls are multi-select list boxes, so handing them every value
 * of the LOV gives the whole history in one table. A few tabs (report 1354's "Year"
 * and "Month", for instance) use a single-valued control instead, which rejects
 * anything longer than one value with
 *   HTTP 400 WSR 00100  Rule not respected ("Argument "/selection/value/count()" must be equal to "1".")
 * For those the whole history comes from the control's "All values" form, and failing
 * that from leaving the control alone — an untouched control filters nothing.
 *
 * Every attempt is one paced request, and the extra ones only ever happen on documents
 * that would otherwise have failed outright.
 * @returns {{mode: 'values'|'all'|'untouched', count: number, note: string}}
 */
async function applyPeriodSelection(doc, tabId, period, values) {
    const plans = [];
    // A control that is not multi-valued but advertises "All" is better asked that way
    // than handed a doomed list.
    if (values.length > 1 && period.allowAll && period.cardinality !== 'Multiple') plans.push('all');
    plans.push('values');
    if (values.length > 1 && !plans.includes('all')) plans.push('all');

    const tried = [];
    for (const mode of plans) {
        const r = await doc.trySelect(period.id, mode === 'all' ? { all: true } : { values }, tabId);
        if (r.ok) return { mode, count: values.length, note: mode === 'all' ? `all ${values.length} via "All values"` : `${values.length} selected` };
        tried.push(`${mode}: HTTP ${r.status} ${r.message}`);
    }
    // Nothing took. An input control left alone applies no filter, so the export still
    // carries every period the document holds; record it so the file can be audited.
    log(`    period control ${period.id} would not take a selection (${tried.join(' | ')}) — exporting it untouched`);
    return { mode: 'untouched', count: 0, note: 'untouched (no filter applied)', tried };
}

/**
 * Pick a prompt's answer for a whole-history export.
 * Numeric prompts must not be ordered as text — survey round "99" would otherwise beat
 * "101". A prompt naming itself a range bound is answered at that bound, so a
 * From/To pair spans everything the document holds instead of a single point.
 */
function orderedValues(p) {
    const v = p.values.slice();
    return p.type === 'Numeric' ? v.sort((a, b) => Number(a) - Number(b)) : v.sort();
}
function answerFor(p) {
    if (!p.values.length) return p.current;               // no list: send back what the document holds
    const ordered = orderedValues(p);
    if (p.cardinality === 'Multiple') return ordered;     // take the lot
    // The lower bound of a range pair takes the earliest value; "(From)"/"(To)" and "(Start)"/"(End)" both occur.
    return /\b(from|start|begin)\b/i.test(p.name) ? [ordered[0]] : [ordered[ordered.length - 1]];
}

/**
 * Refresh, coping with documents that refuse the answers we can supply.
 *
 * Raylight rejects a prompt answered with an empty list outright —
 *   400 WSR 00100  Rule not respected ("Argument 'parameter[id=1]/answer/values/' must not be null nor empty.")
 * — and an unconstrained prompt (free text, a hand-typed date) has no list of values to
 * draw an answer from. So: answer what we can, omit what we cannot (an omitted prompt
 * keeps the answer stored in the document), and if the document still will not refresh,
 * export what it already holds rather than losing the report altogether.
 *
 * @returns {{mode: 'answers'|'answerable-only'|'no-answers'|'skipped', note: string}}
 */
async function refreshWithFallback(doc, answers, meta) {
    const attempts = [];
    const attempt = async (mode, a) => {
        try {
            const r = await doc.refresh(a);
            if (r.refreshed) return { mode, note: mode === 'answers' ? 'refreshed' : `refreshed after ${mode}` };
            attempts.push(`${mode}: accepted, but the document is still asking for answers`);
        } catch (e) {
            if (e instanceof ThrottledError) throw e;          // a firewall block is not a prompt problem
            attempts.push(`${mode}: ${String(e.message).slice(0, 160)}`);
        }
        return null;
    };

    if (answers?.length) {
        const r = await attempt('answers', answers);
        if (r) return r;
    }

    // Cascading prompts (report 1476): a prompt whose list is derived from an earlier
    // answer — "Select Round Number (To)" depends on "(From)" — has no values at all
    // until that earlier answer is given, and Raylight refuses an answer of []. So
    // answer whatever currently has values, let the server hand back the enlarged
    // parameter list, and go round again until it reports a real refresh.
    for (let round = 1; round <= 5; round++) {
        const prompts = await doc.prompts();
        const answerable = prompts.map(p => ({ id: p.id, values: answerFor(p) })).filter(a => a.values.length);
        if (!answerable.length) break;
        const r = await attempt(`cascade round ${round} (${answerable.length}/${prompts.length} answerable)`, answerable);
        if (r) { log(`    refreshed after ${round} cascade round(s)`); return { ...r, rounds: round }; }
    }

    const r = await attempt('no-answers', null);
    if (r) return r;

    // Every form was refused — report 617's universe answers a database error (IES 10901)
    // no matter what is sent. The document still carries whatever its last scheduled run
    // produced, so export that and say so rather than losing the report entirely.
    meta.refreshSkipped = { reason: 'the document refused every refresh form', attempts };
    log(`  could not refresh — exporting the data the document already holds`);
    for (const a of attempts) log(`      ${a}`);
    return { mode: 'skipped', note: 'not refreshed; stored data only', attempts };
}

// --------- One report
async function exportReport(ray, task, outRoot) {
    const meta = {
        reportId: task.reportId, reportName: task.reportName,
        section: task.section, category: task.category, subsection: task.subsection, group: task.group,
        frequency: task.frequency, from: task.from, to: task.to, verdict: task.verdict,
        cuid: task.cuid, exportedAt: new Date().toISOString(),
        periodsMode: opts.periods, unit: null, files: [],
    };

    const doc = await ray.open(task.cuid);
    meta.documentId = doc.id; meta.documentName = doc.name; meta.kind = doc.kind;
    if (!doc.isWebi) {
        log(`  ${doc.kind} object, not a Web Intelligence document — skipping`);
        return { status: 'not-webi', meta, files: [], rows: 0 };
    }

    const prompts = await doc.prompts();
    meta.prompts = prompts.map(p => ({ id: p.id, name: p.name, cardinality: p.cardinality, values: p.values.length }));

    // A single-cardinality prompt can only be answered one value at a time, so the
    // history costs one refresh per period. Multi-valued prompts take everything.
    let promptSets = [{ tag: null, answers: null }];
    if (prompts.length) {
        // The prompt to iterate must be one that actually offers values; an unconstrained
        // prompt has none and cannot drive the period loop.
        const primary = prompts.find(p => p.values.length) || prompts[0];
        const multi   = prompts.every(p => p.cardinality === 'Multiple');
        // Never answer a prompt with an empty list — Raylight refuses the whole refresh.
        // With no list to choose from, send back the answer the document already carries.
        const newestOf = p => (p.values.length ? [newestValue(p.values)] : p.current);
        if (multi && opts.periods === 'all') {
            promptSets = [{ tag: null, answers: prompts.map(p => ({ id: p.id, values: p.values.length ? p.values : p.current })) }];
        } else if (opts.periods === 'all' && primary.values.length && prompts.length === 1) {
            // One single-valued prompt: the history costs one refresh per value.
            promptSets = primary.values.map(v => ({
                tag    : periodTag(v),
                answers: [{ id: primary.id, values: [v] }],
            }));
        } else if (opts.periods === 'all') {
            // Several interdependent prompts (a From/To range, a cascade): iterating one of
            // them would multiply the passes and still not span the history. Answer each at
            // the bound that reaches furthest and take the lot in a single pass.
            promptSets = [{ tag: null, answers: prompts.map(p => ({ id: p.id, values: answerFor(p) })) }];
        } else {
            promptSets = [{ tag: periodTag(newestValue(primary.values) || 'latest'), answers: prompts.map(p => ({ id: p.id, values: newestOf(p) })) }];
        }
        log(`  ${prompts.length} prompt(s): ${prompts.map(p => `${p.name} [${p.cardinality}, ${p.values.length} values]`).join('; ')} → ${promptSets.length} pass(es)`);
    }

    const files = [];
    let totalRows = 0, tabs = null;

    for (const set of promptSets) {
        const refreshed = await refreshWithFallback(doc, set.answers, meta);
        meta.refresh = refreshed;
        if (!meta.dataproviders) meta.dataproviders = await doc.dataproviders();

        // Document-level controls, e.g. "Amount Unit". Re-applied after every refresh
        // in case the control is declared resetSelectionOnRefresh.
        const docICs = await doc.inputControls();
        if (!meta.documentInputControls) meta.documentInputControls = docICs.map(ic => ({ id: ic.id, name: ic.name, values: ic.custom, selected: ic.selected }));
        if (opts.unit) for (const ic of docICs) if (ic.custom.includes(opts.unit)) { await doc.select(ic.id, [opts.unit]); meta.unit = opts.unit; }
        if (!meta.unit) meta.unit = docICs.find(ic => /amount\s*unit/i.test(ic.name))?.selected?.[0] ?? null;

        if (!tabs) { tabs = await doc.reports(); meta.tabs = tabs; log(`  tabs: ${tabs.map(t => `${t.id}:${t.name}`).join(', ')}`); }
        meta.reportInputControls ??= {};

        for (const tab of tabs) {
            const ics    = await doc.inputControls(tab.id);
            const period = ics.find(isPeriodControl);
            let lov = [];
            if (period) {
                lov = await doc.lov(period.id, tab.id);
                meta.reportInputControls[tab.id] = { id: period.id, name: period.name, dataType: period.dataType, values: lov };
            } else {
                meta.reportInputControls[tab.id] = null;
            }

            // With a period control the whole history goes into one file (the control
            // is usually multi-select over a provider that already holds every period).
            const selection = !period || !lov.length ? null
                : opts.periods === 'latest' ? [newestValue(lov)]
                : lov;
            const applied = selection ? await applyPeriodSelection(doc, tab.id, period, selection) : null;
            if (applied) meta.reportInputControls[tab.id].selection = applied;
            const periodSeg = set.tag ?? (opts.periods === 'latest' && selection ? periodTag(selection[0]) : null);
            if (period) log(`  ${tab.name}: period control "${period.name}" [${period.kind}${period.cardinality ? '/' + period.cardinality : ''}], ${lov.length} value(s) → ${applied ? applied.note : 'no selection'}`);

            for (const fmt of opts.formats) {
                // Multi-tab documents get one CSV (and text-ish format) per tab, but a
                // single workbook for the whole document.
                const perDocument = (fmt === 'xlsx' || fmt === 'xls' || fmt === 'pdf');
                // A whole-workbook export of a multi-million-row document runs past the request timeout
                // (report 1222: 2.2 M rows); the per-tab CSVs already hold the data, so skip it.
                if (perDocument && totalRows > opts.maxWorkbookRows) { log(`    ${fmt} skipped: ${totalRows} data rows exceed --max-workbook-rows ${opts.maxWorkbookRows}`); meta.workbookSkipped = `${totalRows} rows > ${opts.maxWorkbookRows}`; continue; }
                if (perDocument && tabs.length > 1 && tab.id !== tabs[tabs.length - 1].id) continue;

                const buf = perDocument && tabs.length > 1
                    ? await doc.exportDocument(fmt)
                    : await doc.exportReport(tab.id, fmt);

                const parts = [task.reportId, kebab(task.reportName || doc.name)];
                if (tabs.length > 1 && !perDocument) parts.push(kebab(tab.name, 40));
                if (periodSeg) parts.push(periodSeg);
                const file = path.join(outRoot, `${parts.join('--')}.${fmt}`);
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, buf);

                const entry = { file: path.relative(REPO, file), format: fmt, bytes: buf.length, tab: perDocument && tabs.length > 1 ? 'all' : tab.id, period: periodSeg ?? 'full-history' };
                if (fmt === 'csv') { const i = inspectCsv(buf); Object.assign(entry, { rows: i.rows, cols: i.cols, dataRows: i.dataRows }); totalRows += i.dataRows; }
                files.push(entry);
                log(`    wrote ${path.basename(file)} (${buf.length} B${entry.dataRows != null ? `, ${entry.rows}x${entry.cols}, ${entry.dataRows} data rows` : ''})`);
            }
        }
    }

    // Chart-only documents: some tabs are a chart and nothing else (report 771's sole tab
    // is "Chart 2"), so every table export comes back with headings and no rows even
    // though the data providers behind the chart are full. Fall back to the providers'
    // own result sets, which carry the same numbers under the universe's column names.
    if (files.some(f => f.format === 'csv') && files.filter(f => f.format === 'csv').every(f => !f.dataRows)) {
        const providers = (meta.dataproviders || []).filter(dp => dp.rowCount > 0);
        log(`  every tab exported empty — falling back to ${providers.length} data provider(s): ${providers.map(d => `${d.id}(${d.rowCount} rows)`).join(', ') || 'none with rows'}`);
        meta.dataProviderFallback = { reason: 'every tab exported no data rows (chart-only document)', providers: [] };
        for (const dp of providers) {
            // csv is the format of record here: it is what the flow endpoint serves and how
            // the rows are counted. xlsx is attempted only if it was asked for.
            const wanted = ['csv', ...(opts.formats.includes('xlsx') ? ['xlsx'] : [])];
            const got = [];
            for (const fmt of wanted) {
                const r = await doc.exportDataProvider(dp.id, fmt);
                // The endpoint answers text/csv for anything it cannot render, so only keep a
                // workbook that really is one.
                const isWorkbook = r.ok && r.buf.slice(0, 2).toString('latin1') === 'PK';
                if (!r.ok || (fmt !== 'csv' && !isWorkbook)) { log(`    dp ${dp.id} ${fmt}: not available (${r.status} ${r.ct || r.message})`); continue; }

                const file = path.join(outRoot, `${[task.reportId, kebab(task.reportName || doc.name), `dp-${dp.id}`].join('--')}.${fmt}`);
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, r.buf);
                const entry = { file: path.relative(REPO, file), format: fmt, bytes: r.buf.length, tab: null, period: 'full-history', source: 'dataprovider', dataprovider: dp.id };
                if (fmt === 'csv') { const i = inspectCsv(r.buf); Object.assign(entry, { rows: i.rows, cols: i.cols, dataRows: i.dataRows }); totalRows += i.dataRows; }
                files.push(entry); got.push(fmt);
                log(`    wrote ${path.basename(file)} (${r.buf.length} B${entry.dataRows != null ? `, ${entry.rows}x${entry.cols}, ${entry.dataRows} data rows` : ''})`);
            }
            meta.dataProviderFallback.providers.push({ id: dp.id, name: dp.name, rowCount: dp.rowCount, formats: got });
        }
    }

    meta.files = files;
    const csvs = files.filter(f => f.format === 'csv');
    const status = csvs.length && csvs.every(f => !f.dataRows) ? 'empty' : 'ok';
    return { status, meta, files, rows: totalRows };
}

// --------- Main
async function main() {
    const tasks = loadTasks();
    const manifest = readJson(MANIFEST, { started: new Date().toISOString(), results: {} });
    const cuids    = readJson(CUID_CACHE, {});

    const todo = tasks.filter(t => opts.force || manifest.results[t.reportId]?.status !== 'ok');
    const planned = opts.limit ? todo.slice(0, opts.limit) : todo;

    log(`selection ${opts.ids ? `--ids (${opts.ids.length})` : opts.select}${opts.section ? ` section=${opts.section}` : ''}${opts.subsection ? ` subsection="${opts.subsection}"` : ''}`);
    log(`${tasks.length} report(s) selected, ${todo.length} still to do, ${planned.length} in this run; formats ${opts.formats.join(',')}, periods ${opts.periods}`);
    if (!planned.length) { log('nothing to do'); return; }
    if (opts.dryRun) {
        for (const t of planned.slice(0, 50)) log(`  ${t.reportId.padEnd(6)} ${(t.section + '/' + t.subsection).slice(0, 60).padEnd(62)} ${t.reportName.slice(0, 70)}`);
        if (planned.length > 50) log(`  … and ${planned.length - 50} more`);
        const misses = planned.filter(t => !cuids[t.reportId]).length;
        log(`dry run — ${misses} CUID-cache miss(es) would each cost one gateway call at ${opts.gatewayGap / 1000}s apart`);
        return;
    }

    // --- one gateway session, one SAP session, one BOE token for the whole run
    await gatewayCall(() => gw.openSession());
    if (!await acquireSapSession()) { log('no SAP session granted — the portal is under load; try later'); process.exitCode = 1; return; }

    const seed = await fetchReportLink(planned[0].reportId);
    cuids[planned[0].reportId] = seed.cuid; writeJson(CUID_CACHE, cuids);
    const build = await discoverBuild(seed.link);
    log(`BOE build ${build}; logon token acquired`);

    const ray = new Raylight(seed.token, {
        build, gapMs: opts.gapMs, log, verbose: opts.verbose,
        // "One BOE token per run" is the rule; this only fires if the server expires
        // the session mid-run, and costs a single extra gateway call when it does.
        onUnauthorized: async () => {
            const fresh = await fetchReportLink(planned[0].reportId);
            return fresh.token;
        },
    });
    let user = null;
    for (let attempt = 1; attempt <= 6 && !user; attempt++) {
        try { user = await ray.session(); }
        catch (e) {
            if (attempt === 6) { log(`the BOE side keeps rejecting fresh tokens (${e.message.slice(0, 60)}); the guest session pool is probably exhausted — stopping cleanly, retry later`); process.exit(3); }
            log(`fresh token rejected (${e.message.slice(0, 60)}); waiting 120 s for guest sessions to expire (attempt ${attempt}/6)`);
            await sleep(120_000);
            await gatewayCall(() => gw.openSession());
            if (!(await acquireSapSession())) continue;
            const again = await fetchReportLink(planned[0].reportId);
            ray.token = again.token;
        }
    }
    log(`BOE session: ${user?.name || 'unknown'}`);
    let tokenAt = Date.now();
    // Guest BOE sessions expire after roughly a quarter of an hour; a dead one shows up as
    // cmsquery resolving nothing or exports answering 500, not as a 401. Renew via one
    // paced gateway call, which also fills the CUID cache for that report.
    const renewSession = async (task, why) => {
        // A link's token is only valid while the gateway session that minted it holds a live SAP
        // logon, and an ageing gateway session keeps answering "granted" while handing out dead
        // tokens. So renewal means a brand-new gateway session, a new SAP logon, a new link, and a
        // check that the BOE side accepts the token — once more from scratch if it does not.
        // Guest BOE sessions are a finite pool that only drains on logoff or idle timeout:
        // release the current one before minting another.
        try { await ray.logoff(); } catch {}
        let fresh = null;
        for (let attempt = 1; attempt <= 2 && !fresh; attempt++) {
            await gatewayCall(() => gw.openSession());
            if (!(await acquireSapSession())) throw new Error('could not re-acquire a SAP session');
            const cand = await fetchReportLink(task.reportId);
            ray.token = cand.token;
            try { await ray.session(); fresh = cand; }
            catch (e) { log(`  renewed token rejected (${e.message.slice(0, 80)}); ${attempt < 2 ? 'retrying from a new gateway session' : 'giving up'}`); }
        }
        if (!fresh) throw new Error('could not obtain a working BOE token');
        if (task.cuid && fresh.cuid !== task.cuid) log(`  CUID for ${task.reportId} changed: ${task.cuid} -> ${fresh.cuid}`);
        cuids[task.reportId] = fresh.cuid; task.cuid = fresh.cuid; writeJson(CUID_CACHE, cuids);
        ray.token = fresh.token; tokenAt = Date.now();
        log(`  BOE session renewed (${why})`);
    };
    const deadSession = e => !(e instanceof ThrottledError) && /could not resolve CUID|HTTP 5\d\d|session/i.test(String(e?.message || ''));

    manifest.started = new Date().toISOString();
    let ok = 0, empty = 0, skipped = 0, failed = 0, throttled = false;
    let renewalFailures = 0, renewalPauses = 0;   // consecutive reports lost to a session that could not be renewed

    for (const [i, task] of planned.entries()) {
        const t0 = Date.now();
        const label = `[${i + 1}/${planned.length}] ${task.reportId}`;
        log(`${label} ${task.reportName.slice(0, 80) || '(unnamed)'}`);
        let result;
        try {
            if (opts.sessionMs > 0 && Date.now() - tokenAt > opts.sessionMs) await renewSession(task, 'age');
            // A cache miss is the only reason to touch the gateway again.
            if (!cuids[task.reportId]) {
                const link = await fetchReportLink(task.reportId);
                cuids[task.reportId] = link.cuid;
                writeJson(CUID_CACHE, cuids);
            }
            task.cuid = cuids[task.reportId];

            const outRoot = path.join(OUT_DIR, kebab(task.section, 60), kebab(task.category, 60), kebab(task.subsection, 120));
            let r;
            try { r = await exportReport(ray, task, outRoot); }
            catch (e) {
                if (!deadSession(e)) throw e;
                log(`  ${e.message} — renewing the BOE session and retrying once`);
                await renewSession(task, 'error');
                r = await exportReport(ray, task, outRoot);
            }
            if (r.meta) { fs.mkdirSync(outRoot, { recursive: true }); writeJson(path.join(outRoot, `${task.reportId}.meta.json`), r.meta); }
            result = { status: r.status, files: r.files.map(f => f.file), rows: r.rows };
            if (r.status === 'ok') ok++; else if (r.status === 'empty') empty++; else skipped++;
        } catch (e) {
            if (e instanceof ThrottledError) {
                log(`${label} THROTTLED — ${e.message}; stopping the run cleanly`);
                result = { status: 'throttled', files: [], rows: 0, error: e.message };
                throttled = true;
            } else {
                log(`${label} ERROR ${e.message}`);
                result = { status: 'error', files: [], rows: 0, error: String(e.message || e).slice(0, 300) };
                failed++;
                // Circuit breaker: three reports in a row lost to session renewal means the guest key
                // ring is empty. Pause for it to refill; if that keeps happening, stop cleanly.
                if (/working BOE token|re-acquire a SAP session/.test(e.message)) {
                    if (++renewalFailures >= 3) {
                        renewalFailures = 0;
                        if (++renewalPauses > 3) { log('session renewal keeps failing after three pauses — stopping cleanly; rerun later'); throttled = true; }
                        else { log(`three consecutive renewal failures — pausing 10 min for guest sessions to expire (pause ${renewalPauses}/3)`); await sleep(600_000); }
                    }
                }
            }
        }
        if (result.status !== 'error') renewalFailures = 0;
        result.took = Math.round((Date.now() - t0) / 1000);
        result.at = new Date().toISOString();
        manifest.results[task.reportId] = result;
        writeJson(MANIFEST, manifest);
        log(`${label} ${result.status} (${result.took}s)`);
        if (throttled) break;
    }

    const status = await ray.logoff();
    log(`logoff -> ${status}; ${ray.calls} BOE requests this run`);
    log(`Done — ok=${ok}, empty=${empty}, skipped=${skipped}, failed=${failed}${throttled ? ', THROTTLED (re-run to resume)' : ''}. Manifest: ${path.relative(REPO, MANIFEST)}`);
    if (failed || throttled) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
