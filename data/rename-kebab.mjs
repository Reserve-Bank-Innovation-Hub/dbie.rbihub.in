// Renames files and folders under data/ to descriptive lower-kebab-case.
//
// - SDMX CSVs: DSD code → kebab(label) from sdmx-tree.json
//     e.g. FR_LIB_ASSTS_MUT_RN.csv
//        → foreign-liabilities-and-assets-for-mutual-fund-and-assets-management-companies.csv
// - RBIB xlsx: keep table number, kebab the name
//     e.g. RBIB Table No. 33 _ Foreign Exchange Reserves - Weekly.xlsx
//        → table-33-foreign-exchange-reserves-weekly.xlsx
// - Folders: Sector_Name / Topic_Name → sector-name / topic-name
//
// Idempotent: running twice is a no-op (after first run, files already match
// their target names).
//
// Usage:  node data/rename-kebab.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = __dirname;
const REPO_ROOT = path.dirname(DATA_DIR);
const SCRAPER_TREE = path.resolve(REPO_ROOT, 'dbie-scraper/sdmx-tree.json');

const dryRun = process.argv.includes('--dry-run');

function kebab(s) {
    return (s || '')
        .toLowerCase()
        // common punctuation that should not contribute characters
        .replace(/['"`.,]/g, '')
        // anything else that isn't a-z/0-9/dash becomes a space
        .replace(/[^a-z0-9\-]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Load SDMX metadata so we can translate DSD codes → labels.
const sdmxMeta = new Map(); // DSD_CODE → { label, frequency }
if (fs.existsSync(SCRAPER_TREE)) {
    const tree = JSON.parse(fs.readFileSync(SCRAPER_TREE, 'utf8'));
    for (const g of tree) for (const e of g.elements) {
        sdmxMeta.set(e.dsdCode, { label: e.label, frequency: e.frequency });
    }
} else {
    console.error(`sdmx-tree.json not found at ${SCRAPER_TREE}`);
    process.exit(1);
}

// Pre-compute collisions: if two or more elements share the same kebab(label),
// we append a frequency-derived suffix to each file's target name so no name
// collides. Example: FOREX_RATE_A_RN and FOREX_RATE_AFY_RN both have the
// label "Exchange rate of indian rupees"; without a suffix the second rename
// silently clobbers or skips.
const freqSuffix = {
    'Annual - Calendar Year': 'cy', 'Annual - Financial Year': 'fy',
    'Quarterly - Financial Year': 'qfy', 'Quarterly': 'q',
    'Monthly': 'm', 'Weekly': 'w', 'Fortnightly': 'f', 'Daily': 'd',
};
const labelOwners = new Map(); // kebab(label) → [dsdCode, …]
for (const [dsd, meta] of sdmxMeta) {
    const k = kebab(meta.label);
    if (!k) continue;
    if (!labelOwners.has(k)) labelOwners.set(k, []);
    labelOwners.get(k).push(dsd);
}
function sdmxTargetName(dsdCode) {
    const meta = sdmxMeta.get(dsdCode);
    if (!meta) return null;
    const base = kebab(meta.label);
    const owners = labelOwners.get(base) || [];
    if (owners.length > 1) {
        const suffix = freqSuffix[meta.frequency] || kebab(meta.frequency);
        return `${base}-${suffix}.csv`;
    }
    return `${base}.csv`;
}

// Collect every rename (bottom-up) without mutating fs yet.
const ops = []; // { from, to, kind }

function plan(fromAbs, toName) {
    if (!toName) return;
    const toAbs = path.join(path.dirname(fromAbs), toName);
    if (fromAbs === toAbs) return;
    ops.push({ from: fromAbs, to: toAbs, kind: fs.statSync(fromAbs).isDirectory() ? 'dir' : 'file' });
}

function walk(dir, handler) {
    for (const name of fs.readdirSync(dir)) {
        if (name === '.DS_Store') continue;
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            walk(full, handler);
            handler({ full, name, isDir: true });
        } else {
            handler({ full, name, isDir: false });
        }
    }
}

// --- SDMX tree
const sdmxRoot = path.join(DATA_DIR, 'sdmx');
if (fs.existsSync(sdmxRoot)) {
    walk(sdmxRoot, ({ full, name, isDir }) => {
        if (isDir) {
            plan(full, kebab(name));
            return;
        }
        if (!name.endsWith('.csv')) return;
        const dsd = name.replace(/\.csv$/i, '');
        const target = sdmxTargetName(dsd);
        if (!target) {
            // Already kebab'd? Skip quietly. Otherwise warn.
            if (/^[a-z0-9-]+\.csv$/.test(name)) return;
            console.warn(`  SDMX: no label for ${dsd}, keeping name`);
            return;
        }
        plan(full, target);
    });
}

// --- RBIB tree
const pubRoot = path.join(DATA_DIR, 'publications');
if (fs.existsSync(pubRoot)) {
    walk(pubRoot, ({ full, name, isDir }) => {
        if (isDir) {
            plan(full, kebab(name));
            return;
        }
        if (!name.endsWith('.xlsx')) return;
        // Already kebab'd?
        if (/^table-\d+-[a-z0-9-]+\.xlsx$/.test(name)) return;
        const m = name.match(/^RBIB Table No\.\s*(\d+)\s*_\s*(.+?)\.xlsx$/i);
        if (!m) {
            console.warn(`  RBIB: unexpected filename, skipping: ${name}`);
            return;
        }
        const num = String(parseInt(m[1], 10)).padStart(2, '0');
        plan(full, `table-${num}-${kebab(m[2])}.xlsx`);
    });
}

// Execute bottom-up (files first, then dirs deepest-to-shallowest) so parent
// renames don't invalidate child paths.
ops.sort((a, b) => b.from.length - a.from.length);

console.log(`Planned ${ops.length} rename(s):`);
for (const op of ops.slice(0, 20)) {
    const rel = p => path.relative(DATA_DIR, p);
    console.log(`  [${op.kind}] ${rel(op.from)}  →  ${rel(op.to)}`);
}
if (ops.length > 20) console.log(`  ... +${ops.length - 20} more`);

if (dryRun) {
    console.log('\n(dry run — no changes applied)');
    process.exit(0);
}

let done = 0, skipped = 0;
for (const op of ops) {
    // Collision check — target already exists? Could happen if two SDMX labels
    // collide (rare) or if the rename already succeeded in a previous run.
    if (fs.existsSync(op.to)) {
        console.warn(`  SKIP (target exists): ${path.relative(DATA_DIR, op.to)}`);
        skipped++;
        continue;
    }
    fs.renameSync(op.from, op.to);
    done++;
}
console.log(`\nRenamed ${done}, skipped ${skipped}.`);
