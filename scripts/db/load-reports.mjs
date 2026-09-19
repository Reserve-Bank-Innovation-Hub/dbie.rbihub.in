#!/usr/bin/env node
// Loads the Statistics and Publications report exports (data/reports/**) into Postgres: one table per DBIE report,
// named r<reportId>_<title>, in the schema of its DBIE sector (placement.mjs). A report table is the faithful grid
// of its export files: one row per spreadsheet row, cells c1..cN as text, with src_file, tab and period saying
// which export file the row came from; title and header rows are rows like any other. Every file is verified after
// loading (row count, bytes and a fingerprint per file) before the report is recorded in meta.report.
// Resumable: reports already recorded are skipped unless --force. Stops at the first failure.
//   node scripts/db/load-reports.mjs [--dry-run] [--only id[,id…]] [--skip id[,id…]] [--limit n] [--force]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, psql, tsvRows, qi, ql, slug, fitIdent, copyLine, csvRows, rowHash, textJoin, rowTextSql, hashSumSql, startRun, finishRun, stamp } from './lib.mjs';
import { catalogueItems, menuPath } from './placement.mjs';

const argv = process.argv.slice(2);
const flag = n => argv.includes(n);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const dryRun = flag('--dry-run'), force = flag('--force');
const only = opt('--only')?.split(',').map(Number) ?? null;
const skip = new Set((opt('--skip') || '').split(',').filter(Boolean).map(Number));
const limit = Number(opt('--limit') ?? Infinity);
const MAX_WIDTH = 1500; // Postgres allows 1600 columns; four are ours

const items = new Map(catalogueItems().map(i => [i.reportId, i]));

// One meta.json per exported report, next to its files.
const metas = [];
(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p); else if (p.endsWith('.meta.json')) metas.push(JSON.parse(fs.readFileSync(p, 'utf8')));
    }
})(path.join(DATA, 'reports'));

function planReport(meta) {
    const id = Number(meta.reportId);
    const item = items.get(id);
    if (!item) throw new Error(`report ${id} is not in data/reports-catalogue.json`);
    const tabNames = new Map((meta.tabs || []).map(t => [String(t.id), t.name]));
    const tabName = t => tabNames.get(String(t)) || (t == null ? null : String(t));
    // In a few reports two tabs were exported to the same (truncated) file name, so the later export overwrote the
    // earlier one on disk. One file, several metadata entries: measure() attributes the file to the entry whose
    // recorded row count matches the file and records the other tabs as overwritten (they need re-exporting).
    const byPath = new Map();
    for (const f of (meta.files || []).filter(f => f.format === 'csv')) {
        const p = path.join(ROOT, f.file);
        if (!byPath.has(p)) byPath.set(p, { path: p, name: path.basename(f.file), entries: [], bytes: fs.existsSync(p) ? fs.statSync(p).size : -1 });
        byPath.get(p).entries.push({ tab: tabName(f.tab), period: f.period ?? null, rows: f.rows ?? null });
    }
    const files = [...byPath.values()];
    for (const f of files) if (f.bytes < 0) throw new Error(`report ${id}: missing file ${f.path}`);
    return { id, item, meta, files, schema: item.schema, table: fitIdent(`r${id}_${slug(meta.reportName || item.reportName)}`) };
}

// Pass 1: how wide the table must be, and which files are empty exports.
async function measure(p) {
    for (const f of p.files) {
        let rows = 0, width = 0, nonEmpty = false;
        await csvRows(f.path, { onRow: cells => { rows++; if (cells.length > width) width = cells.length; if (!nonEmpty && cells.some(c => c !== '')) nonEmpty = true; } });
        const entry = f.entries.find(e => e.rows === rows) || f.entries.at(-1);
        const overwritten = f.entries.filter(e => e !== entry).map(e => e.tab);
        Object.assign(f, { rows, width, empty: !nonEmpty, tab: entry.tab, period: entry.period, overwritten });
    }
    p.loadable = p.files.filter(f => !f.empty);
    p.width = Math.max(0, ...p.loadable.map(f => f.width));
    if (p.width > MAX_WIDTH) throw new Error(`report ${p.id}: ${p.width} columns exceed the ${MAX_WIDTH} limit`);
}

// Pass 2: stream every file into one COPY, keeping the per-file fingerprint the verification query recomputes.
// Layout "columns" is one text column per cell (c1..cN). A few reports are so wide that a dense row exceeds
// Postgres's 8 KB inline row limit (hundreds of short values cannot be moved out of line); those fall back to
// layout "array", one text[] column holding the row's cells as they are in the file.
const arrayLiteral = cells => `{${cells.map(c => '"' + c.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',')}}`;
async function load(p) {
    p.layout = 'columns';
    try { await loadAs(p); }
    catch (err) {
        if (!/row is too big/.test(err.message)) throw err;
        console.log(`${stamp()} ${p.schema}.${p.table}: ${p.width} columns, a row exceeds the 8 KB inline limit; loading as text[]`);
        p.layout = 'array';
        await loadAs(p);
    }
}
async function loadAs(p) {
    const T = `${qi(p.schema)}.${qi(p.table)}`;
    const cols = Array.from({ length: p.width }, (_, i) => `c${i + 1}`);
    const array = p.layout === 'array';
    const it = p.item;
    const shape = array
        ? `cells is each row's cells as text[] (cells[1] is the first column, up to ${p.width}; this report is too wide for one column per cell) with title and header rows included; '' is an empty cell.`
        : `cells c1..c${p.width} as text with title and header rows included; '' is an empty cell, NULL a cell beyond that row's width.`;
    const comment = `DBIE ${menuPath(it)}: "${it.reportName}" (report ${p.id}; ${it.frequency || 'frequency n/a'}; ${it.from || '?'} to ${it.to || '?'}). Faithful grid of DBIE's export: one row per spreadsheet row (row_no) of each export file (src_file, tab, period); ${shape} Loaded from ${path.relative(ROOT, path.dirname(p.files[0].path))}/.`;
    await psql(async write => {
        const cellCols = array ? 'cells text[] NOT NULL' : cols.map(c => `${qi(c)} text`).join(', ');
        await write(`BEGIN;\nDROP TABLE IF EXISTS ${T};\nCREATE TABLE ${T} (src_file text NOT NULL, tab text, period text, row_no integer NOT NULL, ${cellCols}, PRIMARY KEY (src_file, row_no));\n`);
        await write(`COPY ${T} (src_file, tab, period, row_no, ${array ? 'cells' : cols.map(qi).join(', ')}) FROM STDIN;\n`);
        let buf = '';
        for (const f of p.loadable) {
            let count = 0, bytes = 0, hash = 0n;
            await csvRows(f.path, {
                onRow: (cells, n) => {
                    const stored = array ? cells : cols.map((_, i) => (i < cells.length ? cells[i] : null));
                    const rt = textJoin(stored);
                    count++; bytes += Buffer.byteLength(rt, 'utf8'); hash += BigInt(rowHash(rt));
                    buf += copyLine(array ? [f.name, f.tab, f.period, n, arrayLiteral(cells)] : [f.name, f.tab, f.period, n, ...stored]);
                },
                afterChunk: async () => { if (buf.length) { const out = buf; buf = ''; await write(out); } },
            });
            Object.assign(f, { count, bytes, hash: hash.toString() });
        }
        await write(buf + '\\.\n');
        await write(`COMMENT ON TABLE ${T} IS ${ql(comment)};\nCOMMIT;\n`);
    });
}

async function verify(p) {
    const T = `${qi(p.schema)}.${qi(p.table)}`;
    const cols = Array.from({ length: p.width }, (_, i) => `c${i + 1}`);
    const rowText = p.layout === 'array' ? `array_to_string(cells, chr(31), '\\N')` : rowTextSql(cols);
    const out = await psql(`SELECT src_file, count(*), sum(octet_length(rt)), ${hashSumSql('rt')} FROM (SELECT src_file, ${rowText} AS rt FROM ${T}) x GROUP BY src_file;`);
    const got = new Map(tsvRows(out).map(([f, c, b, h]) => [f, { count: Number(c), bytes: Number(b), hash: h }]));
    const problems = [];
    for (const f of p.loadable) {
        const g = got.get(f.name);
        if (!g) { problems.push(`${f.name}: no rows in table`); continue; }
        for (const k of ['count', 'bytes', 'hash']) if (String(g[k]) !== String(f[k])) problems.push(`${f.name}: ${k} file ${f[k]} db ${g[k]}`);
    }
    if (got.size !== p.loadable.length) problems.push(`table has ${got.size} files, expected ${p.loadable.length}`);
    if (problems.length) throw new Error(`report ${p.id}: verification failed: ${problems.join('; ')}`);
}

async function record(p, loaded) {
    const it = p.item, m = p.meta;
    const files = p.files.map(f => ({ file: path.relative(ROOT, f.path), tab: f.tab, period: f.period, bytes: f.bytes, rows: f.rows, width: f.width, empty: f.empty, loaded: loaded && !f.empty, overwrittenTabs: f.overwritten }));
    const rowCount = loaded ? p.loadable.reduce((a, f) => a + f.count, 0) : null;
    const notes = [
        ...(p.files.filter(f => f.empty).map(f => `${f.name} is an empty export`)),
        ...(p.files.filter(f => f.overwritten.length).map(f => `tab ${f.overwritten.map(t => JSON.stringify(t)).join(', ')} was exported to the same file name as tab ${JSON.stringify(f.tab)} and overwritten on disk; only ${JSON.stringify(f.tab)} is loaded, the other needs re-exporting`)),
        ...(loaded ? [] : ['no non-empty CSV export; nothing loaded']),
        ...((m.files || []).some(f => f.format === 'xlsx') ? ['the .xlsx exports hold the same grid and are not loaded'] : []),
    ].join('. ') || null;
    await psql(`INSERT INTO meta.report (report_id, report_name, section, category, subsection, group_title, frequency, period_from, period_to, kind, document_id, document_name, exported_at, schema_name, table_name, layout, files, tabs, row_count, width, loaded_at, notes, meta)
        VALUES (${p.id}, ${ql(it.reportName)}, ${ql(it.section)}, ${ql(it.category)}, ${ql(it.subsection)}, ${ql(it.group)}, ${ql(it.frequency)}, ${ql(it.from)}, ${ql(it.to)}, ${ql(it.kind)}, ${ql(m.documentId)}, ${ql(m.documentName)}, ${ql(m.exportedAt || null)}, ${loaded ? ql(p.schema) : 'NULL'}, ${loaded ? ql(p.table) : 'NULL'}, ${loaded ? ql(p.layout) : 'NULL'}, ${ql(JSON.stringify(files))}::jsonb, ${ql(JSON.stringify(m.tabs || []))}::jsonb, ${rowCount ?? 'NULL'}, ${loaded ? p.width : 'NULL'}, ${loaded ? 'now()' : 'NULL'}, ${ql(notes)}, ${ql(JSON.stringify(m))}::jsonb)
        ON CONFLICT (report_id) DO UPDATE SET report_name = EXCLUDED.report_name, section = EXCLUDED.section, category = EXCLUDED.category, subsection = EXCLUDED.subsection, group_title = EXCLUDED.group_title, frequency = EXCLUDED.frequency, period_from = EXCLUDED.period_from, period_to = EXCLUDED.period_to, kind = EXCLUDED.kind, document_id = EXCLUDED.document_id, document_name = EXCLUDED.document_name, exported_at = EXCLUDED.exported_at, schema_name = EXCLUDED.schema_name, table_name = EXCLUDED.table_name, layout = EXCLUDED.layout, files = EXCLUDED.files, tabs = EXCLUDED.tabs, row_count = EXCLUDED.row_count, width = EXCLUDED.width, loaded_at = EXCLUDED.loaded_at, notes = EXCLUDED.notes, meta = EXCLUDED.meta;`);
}

let plans = metas.map(planReport).filter(p => (!only || only.includes(p.id)) && !skip.has(p.id));
plans.sort((a, b) => a.files.reduce((s, f) => s + f.bytes, 0) - b.files.reduce((s, f) => s + f.bytes, 0)); // small first, the district files last
if (!dryRun && !force) {
    const done = new Set(tsvRows(await psql(`SELECT report_id FROM meta.report WHERE loaded_at IS NOT NULL;`)).map(r => Number(r[0])));
    const before = plans.length; plans = plans.filter(p => !done.has(p.id));
    if (before !== plans.length) console.log(`skipping ${before - plans.length} reports already loaded (use --force to reload)`);
}
plans = plans.slice(0, limit);

const runId = dryRun ? null : await startRun('load-reports');
let ok = 0, rowsLoaded = 0, filesLoaded = 0;
const started = Date.now();
for (const p of plans) {
    try {
        await measure(p);
        const loadable = p.loadable.length > 0;
        if (dryRun) { console.log(`${p.schema}.${p.table}  files=${p.loadable.length}/${p.files.length} rows=${p.loadable.reduce((a, f) => a + f.rows, 0)} width=${p.width}`); continue; }
        if (loadable) { await load(p); await verify(p); }
        await record(p, loadable);
        ok++; rowsLoaded += loadable ? p.loadable.reduce((a, f) => a + f.count, 0) : 0; filesLoaded += p.loadable.length;
        console.log(`${stamp()} ${p.schema}.${p.table}  files=${p.loadable.length}/${p.files.length} rows=${loadable ? p.loadable.reduce((a, f) => a + f.count, 0) : 0} width=${p.width} ${loadable ? 'verified' : 'empty, recorded'}`);
    } catch (err) {
        console.error(`${stamp()} FAILED report ${p.id} (${p.schema}.${p.table}): ${err.message}`);
        if (runId) await finishRun(runId, { reports: ok, rows: rowsLoaded, files: filesLoaded, failed: p.id, error: err.message.slice(0, 500) });
        process.exit(1);
    }
}
const summary = { reports: ok, rows: rowsLoaded, files: filesLoaded, seconds: Math.round((Date.now() - started) / 1000) };
if (runId) await finishRun(runId, summary);
console.log(dryRun ? `dry run: ${plans.length} reports planned` : `loaded ${ok} reports, ${filesLoaded} files, ${rowsLoaded} rows, ${summary.seconds} s`);
