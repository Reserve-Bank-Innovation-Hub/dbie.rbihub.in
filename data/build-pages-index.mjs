// Generates data/pages-index.md — a per-page catalogue mapping each of the
// 8 frontend routes to the tables that should render on it.
//
// Routes mirror frontend/src/app/{prices,growth,external,banking,markets,government,corporate,payments}/
//
// Usage: node data/build-pages-index.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOGUE = path.join(__dirname, 'catalogue.json');
const OUT = path.join(__dirname, 'pages-index.md');

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));

// Map catalogue theme → frontend route slug + page blurb.
const ROUTES = [
    { slug: 'prices',     theme: 'Prices',          title: 'Prices',         blurb: 'What things cost — CPI, WPI, house prices, metal prices, wages.' },
    { slug: 'growth',     theme: 'Growth',          title: 'Growth',         blurb: 'What India produces — GDP, industrial production, agriculture, national income.' },
    { slug: 'external',   theme: 'External',        title: 'External sector',blurb: 'India and the world — balance of payments, forex reserves, the rupee, external debt, foreign investment.' },
    { slug: 'banking',    theme: 'Money & Banking', title: 'Money and banking', blurb: "Money supply, RBI balance sheet, bank credit by sector, monetary aggregates." },
    { slug: 'markets',    theme: 'Markets',         title: 'Markets',        blurb: 'Equity, debt, forex and money markets — indices, yields, rates, turnover.' },
    { slug: 'government', theme: 'Government',      title: 'Government finances', blurb: 'Centre, States, combined — budgets, borrowing, deficits, tax, Treasury Bills.' },
    { slug: 'corporate',  theme: 'Corporate',       title: 'Corporate sector', blurb: 'Balance sheets, P&L, financial ratios for listed, private, public, FDI and NBFI companies.' },
    { slug: 'payments',   theme: 'Payments',        title: 'Payments',       blurb: 'Payment and settlement system volumes and values.' },
];

// Group entries by theme.
const byTheme = {};
for (const e of catalogue.entries) {
    for (const t of e.themes) {
        if (!byTheme[t]) byTheme[t] = [];
        byTheme[t].push(e);
    }
}

// Within a page, sub-group by (source, sector/subSector | topic) so DBIE's
// internal filing is still visible for domain readers.
function subgroup(entries) {
    const groups = new Map();
    for (const e of entries) {
        let key;
        if (e.source === 'sdmx') {
            key = `SDMX · ${e.sector}${e.subSector ? ' / ' + e.subSector : ''}`;
        } else {
            const topic = (e.topic || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            key = `RBIB Monthly Bulletin · ${topic}`;
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
    }
    // Sort: SDMX groups first (alphabetical), then RBIB groups (alphabetical).
    return [...groups.entries()].sort((a, b) => {
        const aIsRbib = a[0].startsWith('RBIB');
        const bIsRbib = b[0].startsWith('RBIB');
        if (aIsRbib !== bIsRbib) return aIsRbib ? 1 : -1;
        return a[0].localeCompare(b[0]);
    });
}

// Friendly shape/frequency/source symbols for tight tables.
const SHAPE_ICON = { stock: '▬', flow: '▲', rate: '%', index: '⟂', other: '·' };
const FREQ_SHORT = {
    'Daily': 'D', 'Weekly': 'W', 'Fortnightly': '2W', 'Monthly': 'M',
    'Quarterly': 'Q', 'Quarterly - Financial Year': 'QFY',
    'Annual - Financial Year': 'AFY', 'Annual - Calendar Year': 'ACY',
    'Annual': 'A',
};

function rowForEntry(e) {
    const freq = FREQ_SHORT[e.frequency] || e.frequency || '—';
    const shape = SHAPE_ICON[e.shape] || '·';
    const src = e.source === 'sdmx' ? 'SDMX' : `RBIB-${String(e.tableNo).padStart(2, '0')}`;
    const rangeBits = [];
    if (e.startDate) rangeBits.push(`from ${e.startDate}`);
    const range = rangeBits.join(' ');
    const dup = e.sdmxDuplicates?.length ? ` ↔ ${e.sdmxDuplicates.join(', ').replaceAll('sdmx:', '')}` : '';
    return `| ${e.label} | ${freq} | ${shape} | ${src} | \`${e.path}\`${dup ? '<br>' + dup : ''} |`;
}

const lines = [];
lines.push('# Pages index\n');
lines.push(`Generated ${new Date().toISOString()}.\n`);
lines.push('Maps each frontend route under `frontend/src/app/` to the 279 tables in `data/`. Use this as the authoritative list for what renders on each page.\n');
lines.push('**Legend:** `D`=Daily · `W`=Weekly · `2W`=Fortnightly · `M`=Monthly · `Q`=Quarterly · `QFY`/`AFY`/`ACY`=FY/CY variants.  Shape: `▬` stock · `▲` flow · `%` rate · `⟂` index · `·` other.\n');

// Overview
lines.push('## Overview\n');
lines.push('| Route | Title | Tables | SDMX | RBIB |');
lines.push('|---|---|---:|---:|---:|');
for (const r of ROUTES) {
    const es = byTheme[r.theme] || [];
    const s = es.filter(e => e.source === 'sdmx').length;
    const b = es.filter(e => e.source === 'rbib').length;
    lines.push(`| [\`/${r.slug}\`](#${r.slug}) | ${r.title} | **${es.length}** | ${s} | ${b} |`);
}
lines.push('');

// Per-page sections
for (const r of ROUTES) {
    const es = byTheme[r.theme] || [];
    lines.push(`---\n`);
    lines.push(`## \`/${r.slug}\` — ${r.title} {#${r.slug}}\n`);
    lines.push(`*${r.blurb}*\n`);
    lines.push(`**${es.length}** tables (${es.filter(e => e.source === 'sdmx').length} SDMX + ${es.filter(e => e.source === 'rbib').length} RBIB).\n`);

    if (!es.length) {
        lines.push('_(no tables currently mapped to this page)_\n');
        continue;
    }

    const groups = subgroup(es);
    for (const [gname, gEntries] of groups) {
        lines.push(`### ${gname} — ${gEntries.length}`);
        lines.push('');
        lines.push('| Table | Freq | Shape | Source | Path |');
        lines.push('|---|---|:-:|---|---|');
        // sort entries within group by label
        gEntries.sort((a, b) => a.label.localeCompare(b.label));
        for (const e of gEntries) lines.push(rowForEntry(e));
        lines.push('');
    }
}

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
console.log();
for (const r of ROUTES) {
    const es = byTheme[r.theme] || [];
    console.log(`  /${r.slug.padEnd(11)}  ${String(es.length).padStart(3)} tables`);
}
console.log(`\nTotal: ${catalogue.entries.length}`);
