#!/usr/bin/env node
// Builds meta.catalogue: one row per DBIE menu entry (every Statistics and Publications item in
// data/reports-catalogue.json) and one per SDMX dataset (data/sdmx-tree.json), each pointing at the table that
// holds it, with a load status. Items that were not exported carry the coverage verdict from
// data/coverage-report.csv as a note. Replaces the table's contents; run after load-sdmx.mjs and load-reports.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { DATA, psql, tsvRows, copyLine, stamp } from './lib.mjs';
import { catalogueItems, menuPath, coverageByReport } from './placement.mjs';

const reports = new Map(tsvRows(await psql('SELECT report_id, schema_name, table_name, row_count, notes, loaded_at IS NOT NULL FROM meta.report;'))
    .map(r => [Number(r[0]), { schema: r[1] || null, table: r[2] || null, rows: r[3] ? Number(r[3]) : null, notes: r[4] || null, loaded: r[5] === 't' }]));
const datasets = new Map(tsvRows(await psql('SELECT dsd_code, schema_name, table_name, row_count FROM meta.sdmx_dataset;'))
    .map(r => [r[0], { schema: r[1], table: r[2], rows: Number(r[3]) }]));
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'scrape-manifest.json'), 'utf8')).results || {};
const tree = JSON.parse(fs.readFileSync(path.join(DATA, 'sdmx-tree.json'), 'utf8'));
const coverage = coverageByReport();

const lines = [];
for (const it of catalogueItems()) {
    const r = reports.get(it.reportId), c = coverage.get(it.reportId);
    let status, notes = r?.notes || null;
    if (r?.loaded && r.table) status = 'loaded';
    else if (r && !r.table) status = 'exported empty';
    else if (it.kind === 'archive file') status = 'not exported: archive file (pdf or excel)';
    else {
        status = 'not exported';
        if (c?.verdict === 'covered' || c?.verdict === 'possible') notes = `SDMX dataset ${c.dsd} ("${c.sdmxLabel}") is on the same topic by title similarity (${c.verdict}, score ${c.score}); not verified as the same table`;
    }
    lines.push(copyLine([it.section === 'Statistics' ? 'statistics' : 'publications', menuPath(it), it.reportName, it.reportId, null, it.frequency || null, it.from || null, it.to || null, it.kind, r?.table ? r.schema : null, r?.table || null, status, r?.rows ?? null, notes]));
}
for (const g of tree) for (const e of g.elements) {
    const d = datasets.get(e.dsdCode), m = manifest[e.dsdCode];
    const status = d ? 'loaded' : (m?.status ? `not loaded: scrape ${m.status}` : 'not loaded');
    const start = e.startDate && e.startDate !== 'null' ? e.startDate : null;
    lines.push(copyLine(['sdmx', `Data Query > ${g.sector} > ${g.subSector}`, e.label, null, e.dsdCode, e.frequency || null, start, null, 'dataset', d?.schema || null, d?.table || null, status, d?.rows ?? null, null]));
}
await psql(async write => {
    await write('BEGIN;\nTRUNCATE meta.catalogue;\nCOPY meta.catalogue (source, menu_path, title, report_id, dsd_code, frequency, period_from, period_to, kind, schema_name, table_name, status, row_count, notes) FROM STDIN;\n');
    await write(lines.join('') + '\\.\nCOMMIT;\n');
});
console.log(`${stamp()} catalogue: ${lines.length} entries`);
for (const [s, st, n] of tsvRows(await psql('SELECT source, status, count(*) FROM meta.catalogue GROUP BY 1, 2 ORDER BY 1, 2;'))) console.log(`  ${s.padEnd(12)} ${String(n).padStart(5)}  ${st}`);
