// Ingest scraped SDMX CSVs from the staging dir into the committed canonical copy.
//
//   data/sdmx-raw/<Sector_Slug>/<SubSector_Slug>/<DSD_CODE>.csv   (scraper output, gitignored)
//     → data/sdmx/<sector-kebab>/<sub-sector-kebab>/<label-kebab>[-<freq>].csv   (committed)
//
// Naming follows the original rename-kebab convention: files are named by the
// element's human label in lower-kebab-case; when two elements share a label
// (e.g. FOREX_RATE_A_RN vs FOREX_RATE_AFY_RN, both "Exchange Rate Of Indian
// Rupees"), a frequency suffix (-cy/-fy/-m/-w/-d/…) disambiguates.
//
// Idempotent: re-running overwrites the canonical copies with the staged ones.
// Elements are looked up by DSD code from data/sdmx-tree.json — staging folder
// names are ignored.
//
// Usage:  node scripts/ingest-sdmx.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(REPO, 'data', 'sdmx-raw');
const DEST = path.join(REPO, 'data', 'sdmx');
const TREE = path.join(REPO, 'data', 'sdmx-tree.json');

const dryRun = process.argv.includes('--dry-run');

function kebab(s) {
    return (s || '')
        .toLowerCase()
        .replace(/['"`.,]/g, '')
        .replace(/[^a-z0-9\-]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

const freqSuffix = {
    'Annual - Calendar Year': 'cy', 'Annual - Financial Year': 'fy',
    'Quarterly - Financial Year': 'qfy', 'Quarterly': 'q',
    'Monthly': 'm', 'Weekly': 'w', 'Fortnightly': 'f', 'Daily': 'd',
};

// DSD_CODE → { sector, subSector, label, frequency }
const meta = new Map();
const labelCount = new Map(); // kebab(label) → occurrences (for collision suffixes)
const tree = JSON.parse(fs.readFileSync(TREE, 'utf8'));
for (const g of tree) {
    for (const e of g.elements) {
        meta.set(e.dsdCode, { sector: g.sector, subSector: g.subSector, label: e.label, frequency: e.frequency });
        const k = kebab(e.label);
        labelCount.set(k, (labelCount.get(k) || 0) + 1);
    }
}

if (!fs.existsSync(RAW)) {
    console.error(`Nothing to ingest: ${RAW} does not exist. Run \`node scripts/scrape-sdmx.mjs\` first.`);
    process.exit(1);
}

let copied = 0, unknown = 0;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : (d.name.endsWith('.csv') ? [p] : []);
});

for (const src of walk(RAW)) {
    const dsd = path.basename(src, '.csv');
    const m = meta.get(dsd);
    if (!m) {
        console.warn(`  ?  ${dsd}.csv — not in sdmx-tree.json, skipped`);
        unknown++;
        continue;
    }
    const base = kebab(m.label);
    const name = labelCount.get(base) > 1 ? `${base}-${freqSuffix[m.frequency] ?? 'x'}` : base;
    const target = path.join(DEST, kebab(m.sector), kebab(m.subSector), `${name}.csv`);
    if (dryRun) {
        console.log(`  ${dsd}.csv → ${path.relative(REPO, target)}`);
    } else {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(src, target);
    }
    copied++;
}

console.log(`${dryRun ? '[dry-run] would ingest' : 'Ingested'} ${copied} CSVs into ${path.relative(REPO, DEST)}${unknown ? ` (${unknown} unknown skipped)` : ''}`);
