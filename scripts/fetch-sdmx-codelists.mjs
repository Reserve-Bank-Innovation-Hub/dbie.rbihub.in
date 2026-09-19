// Fetches the code lists (dimension code → label, with hierarchy) of every SDMX dataset from DBIE and writes one
// JSON file per dataset to data/sdmx-codelists/. Metadata only: one gateway call per dataset, paced at 1.5 s.
// Resumable: datasets that already have a file are skipped unless --force. The scraper reads these lists to build
// its query but did not keep them; the database loads them into meta.sdmx_codelist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gateway, enc, encObject } from './lib/dbie-gateway.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'sdmx-codelists');
fs.mkdirSync(OUT, { recursive: true });
const force = process.argv.includes('--force');
const DELAY = 1500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const tree = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sdmx-tree.json'), 'utf8'));
const elements = tree.flatMap(g => g.elements.map(e => ({ ...e, sector: g.sector, subSector: g.subSector })));

// dim_code_list_values is a tree of { element: {CL_VALUE_CODE, CL_VALUE_LABLE, …}, children: [...] }.
function walk(nodes, out) {
    for (const n of nodes || []) {
        const e = n.element;
        if (e) out.push({ id: e.CL_VALUES_ID, code: e.CL_VALUE_CODE, label: e.CL_VALUE_LABLE, parentId: e.PARENT_CL_VALUES_ID_FK, level: e.LEVEL == null ? null : Number(e.LEVEL) });
        walk(n.children, out);
    }
    return out;
}

const gw = new Gateway();
await gw.openSession();
let done = 0, skipped = 0, failed = 0;
for (const el of elements) {
    const file = path.join(OUT, `${el.dsdCode}.json`);
    if (!force && fs.existsSync(file)) { skipped++; continue; }
    for (let attempt = 1; ; attempt++) {
        try {
            const labelDetails = [encObject({ dsdCode: el.dsdCode, elementName: el.label, elementId: el.elementId, elementType: el.flowType, elementFrequency: el.frequency })];
            const cl = await gw.post('dbie_getCodeListActionEnhanced', { body: { dimData: { elementCodes: enc(el.dsdCode), elementIds: enc(el.elementId), elementLableDetails: labelDetails } } });
            const dims = (cl.result?.[0]?.data || []).map(d => ({ code: d.dim_code, name: d.dim_name, column: d.dim_col_name, table: d.table_name, database: d.database_name, values: walk(d.dim_code_list_values, []) }));
            fs.writeFileSync(file, JSON.stringify({ dsdCode: el.dsdCode, label: el.label, sector: el.sector, subSector: el.subSector, fetched: new Date().toISOString(), dims }, null, 1));
            done++;
            console.log(`${new Date().toISOString().slice(11, 19)} ${el.dsdCode}: ${dims.map(d => `${d.code}(${d.values.length})`).join(' ')}`);
            break;
        } catch (err) {
            const msg = String(err?.message || err);
            if (/\b(418|429|503)\b/.test(msg)) { console.log(`throttled on ${el.dsdCode}; waiting 120 s`); await sleep(120000); continue; }
            if (attempt <= 3) { console.log(`retry ${attempt} ${el.dsdCode}: ${msg.slice(0, 120)}`); await sleep(5000); try { await gw.openSession(); } catch {} continue; }
            failed++; console.log(`FAILED ${el.dsdCode}: ${msg.slice(0, 200)}`); break;
        }
    }
    await sleep(DELAY);
}
console.log(`done=${done} skipped=${skipped} failed=${failed} -> ${path.relative(ROOT, OUT)}`);
