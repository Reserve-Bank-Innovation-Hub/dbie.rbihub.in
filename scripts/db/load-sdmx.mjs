#!/usr/bin/env node
// Loads every SDMX dataset into Postgres: one typed table per dataset, named by its DBIE DSD code, in the schema of
// its DBIE sector. Sources are data/sdmx/*.csv (the committed scrape) plus the two datasets that only exist as
// JSON fallbacks in data/sdmx-raw/json. Each table is checked against its file before the dataset is recorded in
// meta.sdmx_dataset: row count, exact sum of OBS_VALUE, date range, and a fingerprint over the text columns.
// Re-runs replace tables. Stops at the first dataset that fails verification.
//   node scripts/db/load-sdmx.mjs [--dry-run] [--only DSD[,DSD…]] [--limit n]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, schemaForSector, psql, tsvRows, qi, ql, ident, copyLine, readSdmxCsv, DecimalSum, rowHash, textJoin, rowTextSql, hashSumSql, sha256File, sqlArray, startRun, finishRun, stamp } from './lib.mjs';

const argv = process.argv.slice(2);
const flag = n => argv.includes(n);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const dryRun = flag('--dry-run');
const only = opt('--only')?.split(',') ?? null;
const limit = Number(opt('--limit') ?? Infinity);

const tree = JSON.parse(fs.readFileSync(path.join(DATA, 'sdmx-tree.json'), 'utf8'));
const elements = new Map(tree.flatMap(g => g.elements.map(e => [e.dsdCode, { ...e, sector: g.sector, subSector: g.subSector }])));
const catalogue = JSON.parse(fs.readFileSync(path.join(DATA, 'catalogue.json'), 'utf8')).entries.filter(e => e.source === 'sdmx');
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'scrape-manifest.json'), 'utf8')).results || {};

// Typing: SDMX-CSV structural columns get real types when every value fits; dimension codes stay text.
const INT_COLS = new Set(['REPYEAREND', 'REPYEARSTART', 'UNIT_MULT']);
const NOT_DIMENSION = new Set(['DATAFLOW', 'TIME_PERIOD', 'OBS_VALUE', 'REPYEAREND', 'REPYEARSTART', 'UNIT_MULT', 'FOOTNOTE']);
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isInt = v => /^-?\d{1,9}$/.test(v);
const isNum = v => /^[+-]?(\d+\.?\d*|\.\d+)$/.test(v);

function typeColumns(header, data) {
    const cols = header.map((h, i) => {
        const vals = data.map(r => r[i]).filter(v => v !== '');
        let type = 'text';
        if (h === 'TIME_PERIOD' && vals.length && vals.every(isDate)) type = 'date';
        else if (h === 'OBS_VALUE' && vals.length && vals.every(isNum)) type = 'numeric';
        else if (INT_COLS.has(h) && vals.length && vals.every(isInt)) type = 'integer';
        return { src: h, name: ident(h), type };
    });
    if (new Set(cols.map(c => c.name)).size !== cols.length) throw new Error(`duplicate column names in ${header.join(',')}`);
    return cols;
}

function planCsv(entry) {
    const file = path.join(ROOT, entry.path);
    const { header, data } = readSdmxCsv(file);
    // The file names its own dataset in DATAFLOW ("RBI:BMC_M_RN(1.0)"); that beats the catalogue, which files
    // exchange-rate-of-indian-rupees-fy.csv under FOREX_RATE_A_RN although it holds FOREX_RATE_AFY_RN.
    const flow = /^RBI:([A-Z0-9_]+)\(/.exec(data[0]?.[header.indexOf('DATAFLOW')] || '');
    const dsd = flow ? flow[1] : entry.dsdCode;
    if (dsd !== entry.dsdCode) console.log(`${path.relative(ROOT, file)}: catalogue says ${entry.dsdCode}, file says ${dsd}; using the file`);
    const el = elements.get(dsd);
    if (!el) throw new Error(`${dsd} is not in sdmx-tree.json`);
    const schema = schemaForSector(el.sector);
    if (!schema) throw new Error(`${dsd}: no schema for sector "${el.sector}"`);
    const note = `One row per observation as exported from DBIE's Data Query (SDMX); empty cells are NULL; src_line is the data row number in ${path.relative(ROOT, file)}.`;
    return { dsd, el, schema, table: ident(dsd), file, header, data, cols: typeColumns(header, data), note };
}

// The two datasets whose SDMX export failed on DBIE were captured through the portal's JSON (Impala) route,
// which delivers labels as well as codes; they get the same table shape with the label columns kept.
const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
function isoDate(s) {
    if (isDate(s)) return s;
    const m = /^(\d{2})-([A-Z]{3})-(\d{4})$/i.exec(String(s || '').trim());
    if (m && MONTHS[m[2].toUpperCase()]) return `${m[3]}-${MONTHS[m[2].toUpperCase()]}-${m[1]}`;
    // Epoch milliseconds for midnight IST (the portal's timezone).
    if (/^\d{11,14}$/.test(String(s))) return new Date(Number(s) + 19800000).toISOString().slice(0, 10);
    throw new Error(`unrecognised date: ${s}`);
}
const unescape = s => String(s ?? '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
function planJson(dsd, columns, mapRow) {
    const el = elements.get(dsd);
    const file = path.join(DATA, 'sdmx-raw', 'json', `${dsd}.json`);
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const header = columns;
    const data = json.rows.map(r => mapRow(r).map(v => (v == null ? '' : String(v))));
    const note = `One row per observation. DBIE's SDMX export of this dataset fails on the portal, so the rows come from its JSON (Impala) route (${path.relative(ROOT, file)}, fetched ${json.fetched}), which also carries the labels; empty cells are NULL.`;
    return { dsd, el, schema: schemaForSector(el.sector), table: ident(dsd), file, header, data, cols: typeColumns(header, data), note };
}
const JSON_PLANS = {
    CALL_MONEY_RN: () => planJson('CALL_MONEY_RN',
        ['RATE_CALL_MONEY_RN', 'RATE_CALL_MONEY_RN_LABEL', 'TIME_PERIOD', 'OBS_VALUE', 'UNIT_MEASURE'],
        r => [r.rate_call_money_rn_code, r['Rate call money'], isoDate(r.Time), r.VALUE, r.unit_measure_code]),
    CLEARING_HOU_RN: () => planJson('CLEARING_HOU_RN',
        ['OPERTED_RN', 'OPERTED_RN_LABEL', 'OPERTED_RN_PATH', 'OPERTED_RN_LEVEL1', 'OPERTED_RN_LEVEL2', 'TIME_PERIOD', 'YEAR', 'OBS_VALUE', 'UNIT_MEASURE'],
        r => [r.operted_rn_code, r['Operated By'], unescape(r['Operated By_path']), r['Operated By_Level1'], r['Operated By_Level2'], isoDate(r.Time), r.Year, r.VALUE, r.unit_measure_code]),
};

// What the file says, computed the way the verification query computes it.
function fileStats(p) {
    const ti = p.header.indexOf('TIME_PERIOD'), vi = p.header.indexOf('OBS_VALUE');
    const textIdx = p.cols.map((c, i) => c.type === 'text' ? i : -1).filter(i => i >= 0);
    const numeric = p.cols[vi].type === 'numeric';
    const sum = new DecimalSum(); const dates = new Set();
    let nulls = 0, hash = 0n, min = null, max = null;
    for (const r of p.data) {
        const v = r[vi];
        if (v === '') nulls++; else if (numeric) sum.add(v);
        const t = r[ti];
        if (t !== '') { dates.add(t); if (min === null || t < min) min = t; if (max === null || t > max) max = t; }
        hash += BigInt(rowHash(textJoin(textIdx.map(i => r[i] === '' ? null : r[i]))));
    }
    return { count: p.data.length, dates: dates.size, min: min ?? '', max: max ?? '', sum: numeric ? (nulls === p.data.length ? '' : sum.toString()) : '', nulls, hash: hash.toString(), textIdx, numeric };
}

async function load(p) {
    const T = `${qi(p.schema)}.${qi(p.table)}`;
    const comment = `DBIE SDMX dataset "${p.el.label}" (${p.dsd}); ${p.el.sector} > ${p.el.subSector}; ${p.el.frequency}. ${p.note}`;
    await psql(async write => {
        await write(`BEGIN;\nDROP TABLE IF EXISTS ${T};\nCREATE TABLE ${T} (src_line integer NOT NULL, ${p.cols.map(c => `${qi(c.name)} ${c.type}`).join(', ')});\n`);
        await write(`COPY ${T} (src_line, ${p.cols.map(c => qi(c.name)).join(', ')}) FROM STDIN;\n`);
        let buf = '', n = 0;
        for (const r of p.data) {
            buf += copyLine([++n, ...r.map(v => v === '' ? null : v)]);
            if (buf.length > (1 << 20)) { await write(buf); buf = ''; }
        }
        await write(buf + '\\.\n');
        await write(`CREATE INDEX ON ${T} (${qi('time_period')});\nCOMMENT ON TABLE ${T} IS ${ql(comment)};\nCOMMIT;\n`);
    });
}

async function verify(p, s) {
    const T = `${qi(p.schema)}.${qi(p.table)}`;
    const sumExpr = s.numeric ? `coalesce(sum(obs_value)::text, '')` : `''`;
    const out = await psql(`SELECT count(*), count(DISTINCT time_period), coalesce(min(time_period)::text, ''), coalesce(max(time_period)::text, ''), ${sumExpr}, count(*) FILTER (WHERE obs_value IS NULL), ${hashSumSql(rowTextSql(s.textIdx.map(i => p.cols[i].name)))} FROM ${T};`);
    const [count, dates, min, max, sum, nulls, hash] = tsvRows(out)[0];
    const got = { count: Number(count), dates: Number(dates), min, max, sum, nulls: Number(nulls), hash };
    const diffs = Object.keys(got).filter(k => String(got[k]) !== String(s[k]));
    if (diffs.length) throw new Error(`${p.dsd}: verification failed on ${diffs.map(k => `${k} (file ${s[k]}, db ${got[k]})`).join('; ')}`);
}

async function record(p, s) {
    const m = manifest[p.dsd] || {};
    const dims = p.cols.filter(c => !NOT_DIMENSION.has(c.src)).map(c => c.name);
    await psql(`INSERT INTO meta.sdmx_dataset (dsd_code, element_id, label, sector, sub_sector, frequency, start_date, flow_type, is_alphanumeric, schema_name, table_name, columns, dimension_columns, row_count, first_period, last_period, source_file, source_sha256, scraped_at, loaded_at, notes)
        VALUES (${ql(p.dsd)}, ${ql(p.el.elementId)}, ${ql(p.el.label)}, ${ql(p.el.sector)}, ${ql(p.el.subSector)}, ${ql(p.el.frequency)}, ${isDate(p.el.startDate || '') ? ql(p.el.startDate) : 'NULL'}, ${ql(p.el.flowType)}, ${p.el.isAlphaNumeric ? 'true' : 'false'}, ${ql(p.schema)}, ${ql(p.table)}, ${sqlArray(p.cols.map(c => c.name))}, ${sqlArray(dims)}, ${s.count}, ${ql(s.min || null)}, ${ql(s.max || null)}, ${ql(path.relative(ROOT, p.file))}, ${ql(sha256File(p.file))}, ${ql(m.at || null)}, now(), ${ql(p.note)})
        ON CONFLICT (dsd_code) DO UPDATE SET element_id = EXCLUDED.element_id, label = EXCLUDED.label, sector = EXCLUDED.sector, sub_sector = EXCLUDED.sub_sector, frequency = EXCLUDED.frequency, start_date = EXCLUDED.start_date, flow_type = EXCLUDED.flow_type, is_alphanumeric = EXCLUDED.is_alphanumeric, schema_name = EXCLUDED.schema_name, table_name = EXCLUDED.table_name, columns = EXCLUDED.columns, dimension_columns = EXCLUDED.dimension_columns, row_count = EXCLUDED.row_count, first_period = EXCLUDED.first_period, last_period = EXCLUDED.last_period, source_file = EXCLUDED.source_file, source_sha256 = EXCLUDED.source_sha256, scraped_at = EXCLUDED.scraped_at, loaded_at = now(), notes = EXCLUDED.notes;`);
}

// A dataset captured through the JSON route supersedes any older CSV of it still filed under data/sdmx
// (clearing-house.csv is a 59-row scrape from July 2026; the JSON holds the full 2005–2025 hierarchy).
const superseded = catalogue.filter(e => e.dsdCode in JSON_PLANS);
for (const e of superseded) console.log(`skipping ${e.path}: ${e.dsdCode} loads from its JSON capture instead`);
// --only matches the code the catalogue gives an entry or the code its file turns out to carry.
const wanted = p => !only || only.includes(p.dsd);
const plans = [
    ...catalogue.filter(e => !(e.dsdCode in JSON_PLANS)).map(e => () => planCsv(e)),
    ...Object.entries(JSON_PLANS).filter(([d]) => !only || only.includes(d)).map(([, f]) => f),
].slice(0, limit);

const runId = dryRun ? null : await startRun('load-sdmx');
let ok = 0, rowsLoaded = 0;
const loadedTables = new Set();
const started = Date.now();
for (const make of plans) {
    let p;
    try {
        p = make();
        if (!wanted(p)) continue;
        if (loadedTables.has(p.table)) throw new Error(`${p.dsd}: a second file maps to table ${p.schema}.${p.table}`);
        loadedTables.add(p.table);
        const s = fileStats(p);
        const typed = p.cols.filter(c => c.type !== 'text').map(c => `${c.name}:${c.type}`).join(' ');
        if (dryRun) { console.log(`${p.schema}.${p.table}  rows=${s.count} cols=${p.cols.length} [${typed}] ${s.min}..${s.max} sum=${s.sum || '-'}`); continue; }
        await load(p);
        await verify(p, s);
        await record(p, s);
        ok++; rowsLoaded += s.count;
        console.log(`${stamp()} ${p.schema}.${p.table}  ${s.count} rows verified`);
    } catch (err) {
        console.error(`${stamp()} FAILED ${p?.dsd || '?'}: ${err.message}`);
        if (runId) await finishRun(runId, { ok, rowsLoaded, failed: p?.dsd || null, error: err.message.slice(0, 500) });
        process.exit(1);
    }
}
const summary = { datasets: ok, rows: rowsLoaded, seconds: Math.round((Date.now() - started) / 1000) };
if (runId) await finishRun(runId, summary);
console.log(dryRun ? `dry run: ${plans.length} datasets planned` : `loaded ${ok} datasets, ${rowsLoaded} rows, ${summary.seconds} s`);
