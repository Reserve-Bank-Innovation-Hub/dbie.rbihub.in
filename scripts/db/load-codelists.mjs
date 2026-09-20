#!/usr/bin/env node
// Loads the DBIE code lists fetched by scripts/fetch-sdmx-codelists.mjs (data/sdmx-codelists/*.json) into
// meta.sdmx_codelist: for every SDMX dataset and dimension, each code with its label, hierarchy level and parent.
// Replaces the table's contents, then reports any code used in the loaded SDMX tables that has no label.
import fs from 'node:fs';
import path from 'node:path';
import { DATA, psql, tsvRows, qi, ql, copyLine, stamp } from './lib.mjs';

const dir = path.join(DATA, 'sdmx-codelists');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
let rows = 0;
await psql(async write => {
    await write('BEGIN;\nTRUNCATE meta.sdmx_codelist;\nCOPY meta.sdmx_codelist (dsd_code, dim_code, dim_name, value_id, code, label, parent_value_id, level) FROM STDIN;\n');
    let buf = '';
    for (const f of files) {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        const seen = new Set();
        for (const d of j.dims) for (const v of d.values) {
            if (/^(<|&lt;)CL_/i.test(String(v.code ?? ''))) continue; // the tree's root template row, not a code
            const key = `${d.code}\u0000${v.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            buf += copyLine([j.dsdCode, d.code, d.name, v.id, v.code, v.label, v.parentId, v.level]);
            rows++;
        }
        if (buf.length > (1 << 20)) { await write(buf); buf = ''; }
    }
    await write(buf + '\\.\nCOMMIT;\n');
});
console.log(`${stamp()} loaded ${rows} code-list entries from ${files.length} datasets`);

// Coverage: every dimension column of every SDMX table, against the code list DBIE publishes for it.
const listed = new Set(tsvRows(await psql('SELECT DISTINCT dsd_code, dim_code FROM meta.sdmx_codelist;')).map(r => `${r[0]}|${r[1]}`));
const datasets = tsvRows(await psql("SELECT dsd_code, schema_name, table_name, array_to_string(dimension_columns, ',') FROM meta.sdmx_dataset ORDER BY 1;"));
let unlabelled = 0, noList = 0, checked = 0;
const examples = [];
for (const [dsd, schema, table, dimsCsv] of datasets) {
    for (const dim of (dimsCsv ? dimsCsv.split(',') : [])) {
        const dimCode = dim.toUpperCase();
        if (!listed.has(`${dsd}|${dimCode}`)) { noList++; continue; }
        checked++;
        const out = await psql(`SELECT count(DISTINCT t.${qi(dim)}) FROM ${qi(schema)}.${qi(table)} t LEFT JOIN meta.sdmx_codelist c ON c.dsd_code = ${ql(dsd)} AND c.dim_code = ${ql(dimCode)} AND c.code = t.${qi(dim)} WHERE t.${qi(dim)} IS NOT NULL AND c.code IS NULL;`);
        const n = Number(out.trim());
        if (n) { unlabelled += n; if (examples.length < 20) examples.push(`${dsd}.${dimCode}: ${n}`); }
    }
}
console.log(`dimension columns checked against a code list: ${checked}; columns with no code list on DBIE (AUDST, FREQ and the like): ${noList}`);
console.log(unlabelled ? `codes without a label: ${unlabelled}\n  ${examples.join('\n  ')}` : 'every code in those columns has a label');
