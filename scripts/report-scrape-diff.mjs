// After `scrape-sdmx.mjs` + `ingest-sdmx.mjs`, compares every data/sdmx CSV in the
// working tree with the committed version (git HEAD) and writes a review report:
// rows added / removed / revised (same key, different OBS_VALUE), period ranges,
// plus the manifest's per-element status. Usage: node scripts/report-scrape-diff.mjs [out.md]

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(REPO, 'data', `scrape-report-${new Date().toISOString().slice(0, 10)}.md`);
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'scrape-manifest.json'), 'utf8'));
const catalogue = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'catalogue.json'), 'utf8')).entries.filter(e => e.source === 'sdmx');
const byPath = new Map(catalogue.map(e => [e.path, e]));

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => { const p = path.join(dir, d.name); return d.isDirectory() ? walk(p) : (d.name.endsWith('.csv') ? [p] : []); });
const files = walk(path.join(REPO, 'data', 'sdmx')).map(p => path.relative(REPO, p)).sort();
const headVersion = rel => { try { return execFileSync('git', ['show', `HEAD:${rel}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
// SDMX-CSV from DBIE is unquoted, and the FOOTNOTE attribute (two series) contains commas, so a row can
// have more fields than the header. Rebuild such rows: fields before FOOTNOTE from the start, fields after
// it from the end, and the footnote text in between. Rows are then re-joined with the footnote re-quoted.
const splitRow = (line, h) => {
    const f = line.split(','); const k = h.indexOf('FOOTNOTE');
    if (k < 0 || f.length === h.length) return f;
    const tail = h.length - k - 1;
    return [...f.slice(0, k), f.slice(k, f.length - tail).join(','), ...f.slice(f.length - tail)];
};
const parse = text => { const L = text.trim().split(/\r?\n/); const h = L[0].split(','); const tp = h.indexOf('TIME_PERIOD'), ov = h.indexOf('OBS_VALUE'); return { header: L[0], tp, ov, rows: L.slice(1).map(l => splitRow(l, h).join('\u0001')) }; };
const keyOf = (row, ov) => { const c = row.split('\u0001'); c[ov] = ''; return c.join('\u0001'); };

const rows = [];
let totals = { files: files.length, newFiles: 0, added: 0, removed: 0, revised: 0, headerChanged: 0, unchanged: 0 };
for (const rel of files) {
    const cur = parse(fs.readFileSync(path.join(REPO, rel), 'utf8'));
    const oldText = headVersion(rel);
    const meta = byPath.get(rel);
    const periods = cur.rows.map(r => r.split('\u0001')[cur.tp]).sort();
    const rec = { path: rel, dsd: meta?.dsdCode || '', rows: cur.rows.length, first: periods[0], last: periods[periods.length - 1] };
    if (oldText == null) { rec.status = 'new file'; totals.newFiles++; rows.push(rec); continue; }
    const old = parse(oldText);
    const oldPeriods = old.rows.map(r => r.split('\u0001')[old.tp]).sort();
    rec.oldRows = old.rows.length; rec.oldFirst = oldPeriods[0]; rec.oldLast = oldPeriods[oldPeriods.length - 1];
    if (old.header !== cur.header) { rec.status = 'HEADER CHANGED'; totals.headerChanged++; rows.push(rec); continue; }
    const curSet = new Set(cur.rows), oldSet = new Set(old.rows);
    const curByKey = new Map(); for (const r of cur.rows) curByKey.set(keyOf(r, cur.ov), r);
    let added = 0, removed = 0, revised = 0;
    for (const r of cur.rows) if (!oldSet.has(r)) added++;
    for (const r of old.rows) { if (curSet.has(r)) continue; if (curByKey.has(keyOf(r, old.ov))) { revised++; added--; } else removed++; }
    Object.assign(rec, { added, removed, revised });
    rec.status = (added || removed || revised) ? (removed ? 'REMOVED ROWS' : 'updated') : 'unchanged';
    if (rec.status === 'unchanged') totals.unchanged++;
    totals.added += added; totals.removed += removed; totals.revised += revised;
    rows.push(rec);
}
const statuses = {};
for (const r of Object.values(manifest.results)) statuses[r.status] = (statuses[r.status] || 0) + 1;
const notOk = Object.entries(manifest.results).filter(([, r]) => r.status !== 'ok');

const dmy = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');
let md = `# SDMX scrape report (${dmy})\n\n`;
md += `Method: ${manifest.method || 'unknown'}; started ${manifest.started}.\n\n`;
md += `## Manifest\n\n${Object.entries(statuses).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n\n`;
if (notOk.length) md += `Elements not OK:\n\n${notOk.map(([k, r]) => `- \`${k}\` — ${r.status}${r.error ? `: ${r.error}` : ''}${r.jsonRows != null ? ` (${r.jsonRows} rows kept as JSON in ${r.jsonFile})` : ''}`).join('\n')}\n\n`;
md += `## Files (data/sdmx)\n\n- files: ${totals.files} (new: ${totals.newFiles}, unchanged: ${totals.unchanged}, header changed: ${totals.headerChanged})\n- observations added: ${totals.added}, revised: ${totals.revised}, removed: ${totals.removed}\n\n`;
md += `| DSD | rows old → new | periods old → new | added | revised | removed | status |\n|---|---|---|---|---|---|---|\n`;
for (const r of rows.sort((a, b) => (b.removed || 0) - (a.removed || 0) || (b.revised || 0) - (a.revised || 0) || a.path.localeCompare(b.path))) {
    md += `| \`${r.dsd || path.basename(r.path)}\` | ${r.oldRows ?? '—'} → ${r.rows} | ${r.oldFirst ?? '—'}..${r.oldLast ?? '—'} → ${r.first}..${r.last} | ${r.added ?? ''} | ${r.revised ?? ''} | ${r.removed ?? ''} | ${r.status} |\n`;
}
fs.writeFileSync(OUT, md);
console.log(`wrote ${path.relative(REPO, OUT)}`);
console.log(JSON.stringify(totals));
console.log('manifest:', JSON.stringify(statuses));
for (const r of rows.filter(r => r.status === 'REMOVED ROWS' || r.status === 'HEADER CHANGED').slice(0, 20)) console.log(`  ${r.status}: ${r.dsd} ${r.path} removed=${r.removed ?? ''}`);
