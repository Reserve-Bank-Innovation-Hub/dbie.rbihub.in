#!/usr/bin/env node
// Independent check of the loaded database against the source files: what is in each schema, and random rows read
// back from Postgres compared cell by cell with the file they came from (SDMX rows by src_line, report rows by
// src_file and row_no). Complements the per-table fingerprints the loaders verify at load time.
//   node scripts/db/check.mjs [--samples n] [--seed n]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, psql, tsvRows, qi, ql, readSdmxCsv, csvRows } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? Number(argv[i + 1]) : d; };
const SAMPLES = opt('--samples', 40), SEED = opt('--seed', Date.now() % 1e9);
// Seeded so a failing run can be repeated.
let seed = SEED >>> 0;
const rand = () => { seed += 0x6D2B79F5; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rand() * a.length)];

console.log('== what is loaded');
for (const [schema, tables, rows] of tsvRows(await psql(`SELECT n.nspname, count(*), coalesce(sum(c.reltuples::bigint) FILTER (WHERE c.reltuples >= 0), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema') GROUP BY 1 ORDER BY 1;`))) console.log(`  ${schema.padEnd(18)} ${String(tables).padStart(5)} tables`);
const [[nSdmx, rSdmx], [nRep, rRep], [nCat], [nCl]] = [
    tsvRows(await psql('SELECT count(*), coalesce(sum(row_count), 0) FROM meta.sdmx_dataset;'))[0],
    tsvRows(await psql('SELECT count(*) FILTER (WHERE table_name IS NOT NULL), coalesce(sum(row_count), 0) FROM meta.report;'))[0],
    tsvRows(await psql('SELECT count(*) FROM meta.catalogue;'))[0],
    tsvRows(await psql('SELECT count(*) FROM meta.sdmx_codelist;'))[0],
];
console.log(`  SDMX datasets ${nSdmx} (${Number(rSdmx).toLocaleString('en-IN')} rows); report tables ${nRep} (${Number(rRep).toLocaleString('en-IN')} rows); catalogue entries ${nCat}; code-list entries ${nCl}`);

// Values as the file has them against values as Postgres prints them.
const normNum = s => { let t = String(s).replace(/^\+/, ''); const neg = t.startsWith('-'); if (neg) t = t.slice(1); let [i, f = ''] = t.split('.'); i = i.replace(/^0+(?=\d)/, '') || '0'; f = f.replace(/0+$/, ''); const out = f ? `${i}.${f}` : i; return out === '0' ? '0' : (neg ? '-' : '') + out; };
const same = (fileVal, dbVal, type) => {
    if (fileVal === '') return dbVal === null;
    if (dbVal === null) return false;
    if (type === 'numeric' || type === 'integer') return normNum(fileVal) === normNum(dbVal);
    return fileVal === dbVal;
};

console.log(`== ${SAMPLES} random SDMX rows (seed ${SEED})`);
const datasets = tsvRows(await psql('SELECT dsd_code, schema_name, table_name, source_file, row_count FROM meta.sdmx_dataset WHERE source_file LIKE \'data/sdmx/%\' ORDER BY 1;'));
let okS = 0, badS = [];
const cache = new Map();
for (let i = 0; i < SAMPLES; i++) {
    const [dsd, schema, table, file, rows] = pick(datasets);
    if (!cache.has(file)) cache.set(file, readSdmxCsv(path.join(ROOT, file)));
    const { header, data } = cache.get(file);
    const line = 1 + Math.floor(rand() * Math.min(data.length, Number(rows)));
    const expect = data[line - 1];
    const cols = tsvRows(await psql(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = ${ql(schema)} AND table_name = ${ql(table)} AND column_name <> 'src_line' ORDER BY ordinal_position;`));
    const got = tsvRows(await psql(`SELECT ${cols.map(([c]) => `coalesce(${qi(c)}::text, E'\\\\N')`).join(', ')} FROM ${qi(schema)}.${qi(table)} WHERE src_line = ${line};`))[0]?.map(v => v === '\\N' ? null : v);
    if (!got) { badS.push(`${dsd} line ${line}: row missing`); continue; }
    const diffs = header.map((h, k) => same(expect[k], got[k], cols[k][1]) ? null : `${h}: file ${JSON.stringify(expect[k])} db ${JSON.stringify(got[k])}`).filter(Boolean);
    if (diffs.length) badS.push(`${dsd} line ${line}: ${diffs.join('; ')}`); else okS++;
}
console.log(badS.length ? `  ${okS} match, ${badS.length} differ:\n    ${badS.join('\n    ')}` : `  all ${okS} match the file`);

console.log(`== ${SAMPLES} random report rows`);
const reports = tsvRows(await psql("SELECT report_id, schema_name, table_name, width, files::text, coalesce(layout, 'columns') FROM meta.report WHERE table_name IS NOT NULL;")).map(r => ({ id: Number(r[0]), schema: r[1], table: r[2], width: Number(r[3]), files: JSON.parse(r[4]).filter(f => f.loaded), layout: r[5] }));
let okR = 0, badR = [];
const wanted = new Map(); // file -> [{report, rowNo}]
for (let i = 0; i < SAMPLES; i++) { const rep = pick(reports); const f = pick(rep.files); const rowNo = 1 + Math.floor(rand() * f.rows); if (!wanted.has(f.file)) wanted.set(f.file, []); wanted.get(f.file).push({ rep, rowNo }); }
for (const [file, picks] of wanted) {
    const rowsWanted = new Map(picks.map(p => [p.rowNo, null]));
    await csvRows(path.join(ROOT, file), { onRow: (cells, n) => { if (rowsWanted.has(n)) rowsWanted.set(n, [...cells]); } });
    for (const { rep, rowNo } of picks) {
        const expect = rowsWanted.get(rowNo);
        const cols = Array.from({ length: rep.layout === 'array' ? (expect?.length ?? 0) : rep.width }, (_, k) => `c${k + 1}`);
        const where = `FROM ${qi(rep.schema)}.${qi(rep.table)} WHERE src_file = ${ql(path.basename(file))} AND row_no = ${rowNo}`;
        const got = rep.layout === 'array'
            ? (await psql(`SELECT array_to_string(cells, chr(31)) ${where};`)).replace(/\n$/, '').split('\x1f')
            : tsvRows(await psql(`SELECT ${cols.map(c => `coalesce(${qi(c)}, E'\\\\N')`).join(', ')} ${where};`))[0]?.map(v => v === '\\N' ? null : v);
        if (!got || !expect) { badR.push(`report ${rep.id} ${path.basename(file)} row ${rowNo}: ${got ? 'not in file' : 'row missing in table'}`); continue; }
        const diffs = cols.map((c, k) => { const e = k < expect.length ? expect[k] : null; return e === got[k] ? null : `${c}: file ${JSON.stringify(e)} db ${JSON.stringify(got[k])}`; }).filter(Boolean);
        if (diffs.length) badR.push(`report ${rep.id} ${path.basename(file)} row ${rowNo}: ${diffs.slice(0, 3).join('; ')}`); else okR++;
    }
}
console.log(badR.length ? `  ${okR} match, ${badR.length} differ:\n    ${badR.join('\n    ')}` : `  all ${okR} match the file`);
if (badS.length || badR.length) process.exit(1);
