// Builds data/catalogue.json — a single index over every table in
// data/sdmx/ (SDMX CSVs) and data/publications/ (RBIB xlsx files),
// tagged with theme / frequency / shape so the frontend can query
// by narrative topic rather than DBIE's internal filing.
//
// Usage:
//   node data/build-catalogue.mjs
//
// Output:
//   data/catalogue.json        — machine-readable index
//   data/catalogue-summary.md  — human-readable per-theme breakdown

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = __dirname;
const REPO_ROOT = path.dirname(DATA_DIR);

// SDMX metadata comes from the scraper's sdmx-tree.json. We keep the tree
// co-located with the scraper so re-running the scraper updates both.
const SCRAPER_TREE = path.resolve(REPO_ROOT, 'data/sdmx-tree.json');
const sdmxTree = fs.existsSync(SCRAPER_TREE)
    ? JSON.parse(fs.readFileSync(SCRAPER_TREE, 'utf8'))
    : [];
const sdmxLookup = new Map();      // dsdCode → { label, frequency, sector, subSector }
const sdmxByKebab = new Map();     // kebab(label) → meta — lets us look up after files get renamed
function kebab(s) {
    return (s || '').toLowerCase()
        .replace(/['"`.,]/g, '')
        .replace(/[^a-z0-9\-]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
for (const g of sdmxTree) {
    for (const e of g.elements) {
        const meta = { ...e, sector: g.sector, subSector: g.subSector };
        sdmxLookup.set(e.dsdCode, meta);
        sdmxByKebab.set(kebab(e.label), meta);
    }
}

// =========== Theme assignment ==============================================
// Themes drive the narrative layer. Each file gets one PRIMARY theme (for
// bucketing) and optionally SECONDARY themes (for cross-referencing).
// Rules below are heuristic but transparent — fixing a miscategorised table
// is a one-line edit to this file.
const THEMES = [
    'Prices', 'Growth', 'External', 'Money & Banking',
    'Markets', 'Government', 'Corporate', 'Payments',
];

// --- SDMX: primary theme from (sector, subSector).
function sdmxTheme(sector, subSector) {
    const key = `${sector} / ${subSector}`.toLowerCase();
    if (/corporate sector/.test(key))                            return 'Corporate';
    if (/external sector/.test(key))                             return 'External';
    if (/financial market/.test(key))                            return 'Markets';
    if (/public finance/.test(key))                              return 'Government';
    if (/prices & wages/.test(key))                              return 'Prices';
    if (/national income/.test(key))                             return 'Growth';
    if (/industrial stat|agriculture/.test(key))                 return 'Growth';
    if (/monetary stat/.test(key))                               return 'Money & Banking';
    if (/payment systems?/.test(key))                            return 'Payments';
    // LNA_SCB_SR_OCC_BSR1 — banking data in a sector with no sub-sector label.
    if (/financial sector/.test(key))                            return 'Money & Banking';
    return 'Money & Banking'; // fallback — we should never hit this.
}

// --- RBIB: primary theme from the topic folder + table name.
// Accept both underscored (original) and kebab-cased (post-rename) folder names.
function rbibTheme(topic, label) {
    const k = label.toLowerCase();
    const t = (topic || '').toLowerCase().replace(/[-_]/g, '-');
    if (t === 'prices-and-production') {
        // Table 23 (IIP) is Growth; CPI/WPI/Gold/Silver are Prices.
        return /industrial production/.test(k) ? 'Growth' : 'Prices';
    }
    if (t === 'external-sector')                                 return 'External';
    if (t === 'financial-markets')                               return 'Markets';
    if (t === 'money-and-banking' || t === 'rbi')                return 'Money & Banking';
    if (t === 'government-accounts-and-treasury-bills')          return 'Government';
    if (t === 'payments-and-settlements-systems')                return 'Payments';
    return 'Money & Banking';
}

// =========== Shape inference ===============================================
// Stock  — a level observed at a point in time (debt, reserves, balance sheet)
// Flow   — activity over a period (trade, GDP, receipts, spending)
// Rate   — price of time/risk/currency (yield, call money, forex rate)
// Index  — normalised composite (CPI, IIP, NEER, stock index)
function inferShape(idOrLabel) {
    const k = idOrLabel.toUpperCase();
    // Index first — beats the keyword overlap with stocks/flows (e.g. IIP has "PROD").
    if (/\b(CPI|WPI|IIP|NEER|REER|INDEX|INDC|INX_|NIFTY|SENSEX)\b/.test(k)) return 'index';
    if (/\b(RATE|YIELD|RT_|YLD|BASIS|CALL_MONEY|FOREX_RT|FOREX_RATE|REPO|INTEREST)\b/.test(k)) return 'rate';
    if (/\b(STOCK|OUTS|LIAB|LIABS|ASSET|DEBT|RESV|RESER|POS|POSITION|SHEET|DEPOSIT|DEP|BOR|BORROW|LIQ|AGG|OUTSTAND)\b/.test(k)) return 'stock';
    if (/\b(EXP|IMP|RECPT|RECEIPT|INFLW|INFLOW|OUTFLW|OUTFLOW|PROD|PRODUCTION|TRD|TRADE|SAL|SALE|REMIT|PAYMENT|DISB|DEF|DEFICIT|TURNO|TURNOVER|AUCTION)\b/.test(k)) return 'flow';
    return 'other';
}

// =========== Frequency inference for RBIB ==================================
// RBIB xlsx files are consistently monthly bulletins, but a few are weekly or
// daily. We read the filename; if inconclusive, default to Monthly.
function rbibFrequency(label) {
    const k = label.toLowerCase();
    if (/daily/.test(k))   return 'Daily';
    if (/weekly/.test(k))  return 'Weekly';
    if (/annual/.test(k))  return 'Annual';
    return 'Monthly';
}

// =========== Build ==========================================================
const entries = [];

function walkFiles(dir, prefix, push) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort()) {
        if (name === '.DS_Store') continue;
        const full = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walkFiles(full, rel, push);
        else push(rel, full, stat);
    }
}

// SDMX: walk data/sdmx/
walkFiles(path.join(DATA_DIR, 'sdmx'), '', (rel, full, stat) => {
    if (!rel.endsWith('.csv')) return;
    const filename = path.basename(rel, '.csv');
    // After renaming, the filename is the kebab-cased label. Before that, it was
    // the DSD code. Try both lookups so the builder works in either state.
    let meta = sdmxLookup.get(filename);                          // pre-rename
    if (!meta) meta = sdmxByKebab.get(filename);                  // post-rename
    // Handle disambiguation suffixes like "-fy" / "-cy" (exchange rate collision)
    if (!meta) meta = sdmxByKebab.get(filename.replace(/-(fy|cy)$/, ''));
    if (!meta) {
        console.warn(`  SDMX: no metadata for ${rel} — skipping`);
        return;
    }
    const primary = sdmxTheme(meta.sector, meta.subSector);
    entries.push({
        id: `sdmx:${meta.dsdCode}`,
        source: 'sdmx',
        format: 'sdmx-csv',
        path: `data/sdmx/${rel}`,
        label: meta.label,
        sector: meta.sector,
        subSector: meta.subSector,
        dsdCode: meta.dsdCode,
        frequency: meta.frequency || '',
        startDate: meta.startDate || '',
        themes: [primary],
        shape: inferShape(`${meta.dsdCode} ${meta.label}`),
        bytes: stat.size,
    });
});

// RBIB: walk data/publications/
walkFiles(path.join(DATA_DIR, 'publications'), '', (rel, full, stat) => {
    if (!rel.endsWith('.xlsx')) return;
    const parts = rel.split('/');
    // parts: [publication, topic, filename]
    const publication = parts[0] || '';
    const topic = parts[1] || '';
    const filename = parts[parts.length - 1];
    // Extract table number and clean label. Handle both original and renamed forms:
    //   "RBIB Table No. 33 _ Foreign Exchange Reserves - Weekly.xlsx"
    //   "table-33-foreign-exchange-reserves-weekly.xlsx"
    let match = filename.match(/Table No\.\s*(\d+)\s*_\s*(.+?)\.xlsx$/i);
    let tableNo = null, label = '';
    if (match) {
        tableNo = parseInt(match[1], 10);
        label = match[2].trim();
    } else if ((match = filename.match(/^table-(\d+)-(.+?)\.xlsx$/i))) {
        tableNo = parseInt(match[1], 10);
        // Un-kebab to title-ish form: replace hyphens with spaces, then capitalise words.
        label = match[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    } else {
        label = filename.replace(/\.xlsx$/i, '');
    }
    const primary = rbibTheme(topic, label);
    entries.push({
        id: tableNo != null ? `rbib:${String(tableNo).padStart(2,'0')}` : `rbib:${filename}`,
        source: 'rbib',
        format: 'xlsx',
        path: `data/publications/${rel}`,
        label,
        publication: publication.replace(/_/g, ' '),
        topic: topic.replace(/_/g, ' '),
        tableNo,
        frequency: rbibFrequency(label),
        themes: [primary],
        shape: inferShape(label),
        bytes: stat.size,
    });
});

// =========== Duplicate detection (RBIB ↔ SDMX) ===========================
// A Monthly Bulletin table often corresponds to one or more SDMX series.
// We link on lowercase-label substring overlap. This is intentionally
// permissive — the narrative layer can prefer one or the other.
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
const rbibEntries = entries.filter(e => e.source === 'rbib');
const sdmxEntries = entries.filter(e => e.source === 'sdmx');

for (const r of rbibEntries) {
    const rs = slug(r.label);
    const matches = [];
    for (const s of sdmxEntries) {
        const ss = slug(s.label);
        if (!ss || !rs) continue;
        // strong: one contains the other (both direction)
        if (rs.includes(ss) && ss.length >= 10) matches.push(s.id);
        else if (ss.includes(rs) && rs.length >= 10) matches.push(s.id);
    }
    if (matches.length) r.sdmxDuplicates = matches;
}

// =========== Theme-level summary =========================================
const themeCounts = {};
const themeBySource = {};
for (const t of THEMES) { themeCounts[t] = 0; themeBySource[t] = { sdmx: 0, rbib: 0 }; }
for (const e of entries) {
    for (const t of e.themes) {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
        if (!themeBySource[t]) themeBySource[t] = { sdmx: 0, rbib: 0 };
        themeBySource[t][e.source]++;
    }
}

// =========== Write =======================================================
const catalogue = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    bySource: {
        sdmx: sdmxEntries.length,
        rbib: rbibEntries.length,
    },
    themes: THEMES,
    themeCounts,
    themeBySource,
    entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
};
fs.writeFileSync(path.join(DATA_DIR, 'catalogue.json'), JSON.stringify(catalogue, null, 2));

// Human summary
const lines = [];
lines.push(`# Data catalogue — ${entries.length} tables\n`);
lines.push(`Generated ${catalogue.generatedAt}.\n`);
lines.push(`**Sources**: SDMX CSV ${sdmxEntries.length}; RBIB xlsx ${rbibEntries.length}.\n`);
lines.push('## By theme\n');
lines.push('| Theme | SDMX | RBIB | Total |');
lines.push('|---|---:|---:|---:|');
for (const t of THEMES) {
    const s = themeBySource[t]?.sdmx || 0;
    const r = themeBySource[t]?.rbib || 0;
    lines.push(`| ${t} | ${s} | ${r} | ${s + r} |`);
}
lines.push(`\n## By shape\n`);
const shapes = {};
for (const e of entries) shapes[e.shape] = (shapes[e.shape] || 0) + 1;
lines.push('| Shape | Count |');
lines.push('|---|---:|');
for (const [s, n] of Object.entries(shapes).sort((a,b) => b[1] - a[1])) {
    lines.push(`| ${s} | ${n} |`);
}
lines.push(`\n## By frequency\n`);
const freqs = {};
for (const e of entries) freqs[e.frequency || '(blank)'] = (freqs[e.frequency || '(blank)'] || 0) + 1;
lines.push('| Frequency | Count |');
lines.push('|---|---:|');
for (const [f, n] of Object.entries(freqs).sort((a,b) => b[1] - a[1])) {
    lines.push(`| ${f} | ${n} |`);
}
lines.push(`\n## RBIB ↔ SDMX duplicate links\n`);
const withDups = rbibEntries.filter(e => e.sdmxDuplicates?.length);
lines.push(`${withDups.length} of ${rbibEntries.length} RBIB tables have a likely SDMX duplicate.\n`);
for (const e of withDups) {
    lines.push(`- **${e.id}** — ${e.label}  →  ${e.sdmxDuplicates.join(', ')}`);
}
fs.writeFileSync(path.join(DATA_DIR, 'catalogue-summary.md'), lines.join('\n'));

console.log(`Wrote data/catalogue.json (${entries.length} entries)`);
console.log(`Wrote data/catalogue-summary.md`);
console.log(`\nBy theme:`);
for (const t of THEMES) {
    const s = themeBySource[t]?.sdmx || 0;
    const r = themeBySource[t]?.rbib || 0;
    console.log(`  ${t.padEnd(18)}  SDMX=${String(s).padStart(3)}  RBIB=${String(r).padStart(3)}  total=${s + r}`);
}
console.log(`\nBy shape: ${JSON.stringify(shapes)}`);
