// Compares the DBIE Reports catalogue (Statistics + Publications menus,
// data/reports-catalogue.json) against the SDMX element list (data/sdmx-tree.json)
// and the scrape manifest, and writes:
//   data/coverage-report.md   — headline, per-menu summary, what only the Reports path carries
//   data/coverage-report.csv  — one row per catalogue table with its verdict and best SDMX candidate
//
// Matching is by table name (normalised tokens, light stemming, a few DBIE spellings),
// against every SDMX element, not just the same sub-sector:
//   score = max(Jaccard, containment)   — containment counts when ≥3 tokens are shared
//                                          or the shorter label is fully contained
//   covered ≥ 0.6, possible ≥ 0.35, otherwise unmatched; "unmatched" is split by whether
//   the table's sub-sector has any SDMX counterpart at all.
// Notes, glossaries, historical PDF volumes etc. are flagged non-table and excluded from counts.
// It is a triage aid, not a proof: one SDMX cube can back several presentation tables.
//
// Usage: node scripts/compare-coverage.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'data');
const catalogue = JSON.parse(fs.readFileSync(path.join(DATA, 'reports-catalogue.json'), 'utf8'));
const tree      = JSON.parse(fs.readFileSync(path.join(DATA, 'sdmx-tree.json'), 'utf8'));
const manifest  = JSON.parse(fs.readFileSync(path.join(DATA, 'scrape-manifest.json'), 'utf8'));

const STOP = new Set('statement table no the of and in on for a an to by from with data indian india select combined all various wise according annual annually quarterly monthly weekly daily fortnightly year yearly rs crore crores per cent percent amount outstanding as at end half'.split(' '));
const SYN  = { inidices: 'index', indices: 'index', govt: 'government', scbs: 'scb', tbills: 'treasury', remittances: 'remittance', liberalised: 'lrs', under: '', quantum: '', unit: '', value: '' };
const stem0 = t => t.endsWith('ies') ? t.slice(0, -3) + 'y' : (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t);
const stem  = t => SYN[t] === undefined ? stem0(t) : SYN[t];
const tokens = s => (s || '').toLowerCase()
    .replace(/table\s*no\.?\s*[\d.]+[a-z]?/g, ' ').replace(/statement\s*\d+[a-z]?\s*:?/g, ' ').replace(/^\s*[\d.]+[a-z]?\s*[.:)-]?\s*/, ' ')
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).map(stem).filter(t => t && t.length > 2 && !STOP.has(t));
const score = (a, b) => { const A = new Set(a), B = new Set(b); if (!A.size || !B.size) return { j: 0, c: 0, n: 0 }; let n = 0; for (const x of A) if (B.has(x)) n++; return { j: n / (A.size + B.size - n), c: n / Math.min(A.size, B.size), n, shorter: Math.min(A.size, B.size) }; };

const sdmx = tree.flatMap(g => g.elements.map(e => ({ ...e, sector: g.sector, subSector: g.subSector, t: tokens(e.label) })));
const subTok = tree.map(g => tokens(g.subSector + ' ' + g.sector));
// Only documentation and archive files are non-tables. Discontinued tables still hold data, and
// "Notes and Coins in Circulation" is a currency table, not notes (both were excluded until 18-09-2026).
const isDocumentation = name => /\bnotes? on tables?\b|explanatory notes|glossary|foreword|methodology|abbreviation|\bmetadata\b/i.test(name);
const isArchiveFile   = (name, group) => /\(in pdf|pdf and\/or excel/i.test(group) || /\bvol(ume)?\.?\s*\d/i.test(name);
const kindOf     = (name, group) => isDocumentation(name) ? 'documentation' : isArchiveFile(name, group) ? 'archive file' : 'table';
const isNonTable = (name, group) => kindOf(name, group) !== 'table';
const downloaded = dsd => manifest.results?.[dsd]?.status === 'ok';

const rows = [];
for (const sub of catalogue) for (const g of sub.groups || []) for (const r of g.reports || []) {
    const t = tokens(r.reportName);
    let best = null;
    for (const e of sdmx) { const s = score(t, e.t); const v = Math.max(s.j, (s.n >= 3 || (s.n >= 2 && s.n === s.shorter)) ? s.c : 0); if (!best || v > best.v) best = { v, el: e }; }
    const st = tokens(sub.subsection + ' ' + sub.category);
    const topicInSdmx = subTok.some(x => score(st, x).j >= 0.3);
    const nonTable = isNonTable(r.reportName, g.title);
    const v = +(best?.v || 0).toFixed(2);
    const verdict = nonTable ? 'non-table' : v >= 0.6 ? 'covered' : v >= 0.35 ? 'possible' : topicInSdmx ? 'unmatched (topic in SDMX)' : 'unmatched (topic absent from SDMX)';
    rows.push({ section: sub.section, category: sub.category, subsection: sub.subsection, group: g.title, reportId: r.reportId, reportName: r.reportName, frequency: r.frequency, from: r.from, to: r.to,
                kind: kindOf(r.reportName, g.title), verdict, score: v, dsd: best?.el.dsdCode || '', sdmxLabel: best?.el.label || '', downloaded: best && v >= 0.35 ? (downloaded(best.el.dsdCode) ? 'yes' : 'no') : '' });
}

// ---------- CSV
const cols = ['section', 'category', 'subsection', 'group', 'reportId', 'reportName', 'frequency', 'from', 'to', 'kind', 'verdict', 'score', 'dsd', 'sdmxLabel', 'downloaded'];
fs.writeFileSync(path.join(DATA, 'coverage-report.csv'), [cols.join(',')].concat(rows.map(r => cols.map(c => '"' + String(r[c] ?? '').replace(/"/g, '""') + '"').join(','))).join('\n') + '\n');

// ---------- Markdown
const tbl = rows.filter(r => r.verdict !== 'non-table');
const unm = r => r.verdict.startsWith('unmatched');
const count = (rs) => ({ total: rs.length, covered: rs.filter(r => r.verdict === 'covered').length, possible: rs.filter(r => r.verdict === 'possible').length, unmatched: rs.filter(unm).length });
const stat = tbl.filter(r => r.section === 'Statistics'), pub = tbl.filter(r => r.section === 'Publication');
const ON_RBI_SITE = new Set(['Monthly RBI Bulletin', 'Handbook of Statistics on the Indian Economy', 'Weekly Statistical Supplement']);
const pubSite = pub.filter(r => ON_RBI_SITE.has(r.subsection)), pubDbie = pub.filter(r => !ON_RBI_SITE.has(r.subsection));
const sdmxOk = Object.values(manifest.results || {}).filter(r => r.status === 'ok').length;

let md = `# DBIE Reports coverage vs SDMX\n\n`;
md += `Generated ${new Date().toISOString().slice(0, 10)} from \`data/reports-catalogue.json\` (${rows.length} catalogue items; ${rows.filter(r => r.kind === 'documentation').length} documentation items and ${rows.filter(r => r.kind === 'archive file').length} archive files excluded) and \`data/sdmx-tree.json\` (${sdmx.length} elements; ${sdmxOk} downloaded per the manifest).\n\n`;
md += `## Headline\n\n`;
const c1 = count(stat), c2 = count(pubSite), c3 = count(pubDbie);
md += `| Menu | Tables | Covered by SDMX | Possible | Not in SDMX |\n|---|---|---|---|---|\n`;
md += `| Statistics | ${c1.total} | ${c1.covered} | ${c1.possible} | ${c1.unmatched} |\n`;
md += `| Publications also on rbi.org.in as spreadsheets (Bulletin, Handbook, WSS) | ${c2.total} | ${c2.covered} | ${c2.possible} | ${c2.unmatched} |\n`;
md += `| Publications only on DBIE (BSR, spatial, branch, STRBI, UCB, IBS, public debt) | ${c3.total} | ${c3.covered} | ${c3.possible} | ${c3.unmatched} |\n\n`;
md += `**${c1.unmatched + c3.unmatched} tables need the Reports/Publications path** (Statistics ${c1.unmatched} + DBIE-only publications ${c3.unmatched}); the ${c2.unmatched} unmatched Bulletin/Handbook/WSS tables can be fetched from rbi.org.in instead.\n\n`;

const groupBy = (rs, key) => { const m = new Map(); for (const r of rs) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };
md += `## Statistics by sub-section\n\n| Category / sub-section | Tables | Covered | Possible | Not in SDMX | Examples not in SDMX |\n|---|---|---|---|---|---|\n`;
for (const [k, rs] of [...groupBy(stat, r => `${r.category} / ${r.subsection}`)].sort((a, b) => count(b[1]).unmatched - count(a[1]).unmatched)) {
    const c = count(rs); md += `| ${k} | ${c.total} | ${c.covered} | ${c.possible} | ${c.unmatched} | ${rs.filter(unm).slice(0, 2).map(r => r.reportName.slice(0, 50)).join('; ')} |\n`;
}
md += `\n## Publications\n\n| Publication | Tables | Covered | Possible | Not in SDMX | On rbi.org.in |\n|---|---|---|---|---|---|\n`;
for (const [k, rs] of groupBy(pub, r => r.subsection)) { const c = count(rs); md += `| ${k} | ${c.total} | ${c.covered} | ${c.possible} | ${c.unmatched} | ${ON_RBI_SITE.has(k) ? 'yes' : ''} |\n`; }

md += `\n## Tables that need the Reports/Publications path\n\n`;
for (const [k, rs] of groupBy([...stat, ...pubDbie].filter(unm), r => r.section === 'Publication' ? `Publication: ${r.subsection}` : `Statistics: ${r.category} / ${r.subsection}`)) {
    md += `### ${k} (${rs.length})\n\n`;
    for (const r of rs) md += `- [${r.reportId}] ${r.reportName} — ${r.frequency}${r.from ? `, ${r.from} → ${r.to}` : ''}\n`;
    md += `\n`;
}
md += `## Possible matches to verify by eye\n\n| Table | Best SDMX candidate | Score |\n|---|---|---|\n`;
for (const r of tbl.filter(r => r.verdict === 'possible').sort((a, b) => b.score - a.score)) md += `| ${r.reportName.slice(0, 70)} (${r.section}) | ${r.sdmxLabel.slice(0, 60)} \`${r.dsd}\` | ${r.score} |\n`;
fs.writeFileSync(path.join(DATA, 'coverage-report.md'), md);
console.log(`Statistics: ${JSON.stringify(c1)} | Publications on rbi.org.in: ${JSON.stringify(c2)} | DBIE-only publications: ${JSON.stringify(c3)}`);
console.log('wrote data/coverage-report.md and data/coverage-report.csv');
