// Processor: index-numbers-of-twenty-three-major-industry-groups-of-manufacturing
// Source: Handbook of Statistics on Indian Economy — Annual Series — Output and Prices
//
// The workbook has a single sheet "Report 1" with THREE base-year sections on the
// same sheet, each separated by a blank row containing a "(Base : YYYY-YY)" label:
//
//   Section 1 — Base 2011-12 (23 industry groups, codes "1"–"23"):
//     Rows 8–20 (0-indexed): financial-year data, newest-first (2024-25 down to 2012-13)
//
//   Section 2 — Base 2004-05 (22 industry groups + Manufacturing Index):
//     Rows 27–38 (0-indexed): financial-year data, newest-first (2016-17 down to 2005-06)
//
//   Section 3 — Base 1993-94 (17 industry groups + Manufacturing (Total)):
//     Rows 45–62 (0-indexed): financial-year data, newest-first (2011-12 down to 1994-95)
//
// Strategy: scan raw rows for rows whose col[1] = "Industry Group" to locate each
// section header; collect the industry names, weight row, and data rows for each.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '..', 'publications',
    'handbook-statistics-on-indian-economy',
    'annual-series', 'output-and-prices',
    'Index Numbers of Twenty Three Major Industry Groups of Manufacturing Sector (Base _ 2011-12 = 100).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT     = path.join(OUT_DIR, 'index-numbers-of-twenty-three-major-industry-groups-of-manufacturing.json');

const REPORT_TITLE =
    'Index numbers of twenty-three major industry groups of manufacturing sector (base: 2011-12 = 100)';

// Financial year: "2024-25", "2012-13", "1994-95", etc.
const YEAR_RE = /^\d{4}-\d{2}/;

// Numeric parse: strip commas, treat "", "-", "–" and "N/A" as null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replaceAll(',', '');
    if (s === '' || s === '-' || s === '–' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isNaN(val) ? null : val;
}

// Strip a leading "N. " or "N." prefix from a label and sentence-case what remains.
// E.g. "1. Manufacture of food products" -> "Manufacture of food products"
//      "23.Other manufacturing"           -> "Other manufacturing"
// Preserve "n.e.c." and "(1993-94)" notation as-is.
function cleanLabel(raw) {
    const s = String(raw).trim();
    // Remove leading digit(s) + optional dot + optional space.
    const stripped = s.replace(/^\d+\.\s*/, '');
    if (!stripped) return s;
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// Derive the code from a raw column header like "1. Manufacture of food products",
// "23.Other manufacturing", "Manufacturing Index", "Manufacturing (Total)".
function deriveCode(raw, fallback) {
    const s = String(raw).trim();
    const m = s.match(/^(\d+)[.\s]/);
    if (m) return m[1];
    const low = s.toLowerCase();
    if (low.includes('manufacturing index') || low.includes('manufacturing (total)')) return 'mfgIndex';
    return fallback;
}

// Extract the base year string (e.g. "2011-12") from a sub-label like "(Base : 2011-12)".
function extractBase(raw) {
    const m = String(raw || '').match(/(\d{4}-\d{2})/);
    return m ? m[1] : null;
}

// Parse one section from the raw row array.
// hdrRowIdx: 0-based row index within `rows` where col[1] === "Industry Group".
// nextSectionStart: 0-based row index where the NEXT section starts (or rows.length).
// base, label: pre-determined from the preceding sub-label row.
function parseSection(rows, hdrRowIdx, nextSectionStart, base, label) {
    const hdrRow = rows[hdrRowIdx] || [];

    // Collect industry columns: col[2] onwards in the header row.
    const industries = [];
    for (let c = 2; c < hdrRow.length; c++) {
        const raw = hdrRow[c];
        if (raw == null || String(raw).trim() === '') continue;
        const code = deriveCode(raw, String(industries.length + 1));
        industries.push({ col: c, code, label: cleanLabel(String(raw)), weight: null });
    }

    // Weight row: first row in (hdrRowIdx+1 .. hdrRowIdx+4) whose col[1] contains "Weight".
    let weightRowIdx = -1;
    for (let r = hdrRowIdx + 1; r < Math.min(hdrRowIdx + 5, nextSectionStart); r++) {
        if (String((rows[r] || [])[1] || '').trim().toLowerCase().includes('weight')) {
            weightRowIdx = r;
            break;
        }
    }
    if (weightRowIdx !== -1) {
        const wRow = rows[weightRowIdx];
        for (const ind of industries) ind.weight = parseNum(wRow[ind.col]);
    }

    // Data rows: rows from (weightRowIdx+1 or hdrRowIdx+2) up to nextSectionStart
    // whose col[1] matches the YEAR_RE.
    const dataStart = weightRowIdx >= 0 ? weightRowIdx + 1 : hdrRowIdx + 2;
    const data = [];
    const seenYears = new Set();
    for (let r = dataStart; r < nextSectionStart; r++) {
        const yearRaw = String((rows[r] || [])[1] || '').trim();
        if (!YEAR_RE.test(yearRaw)) continue;
        const year = yearRaw.replace(/\s+$/, '');  // trim trailing whitespace
        if (seenYears.has(year)) continue;          // de-duplicate (shouldn't happen)
        seenYears.add(year);
        const values = {};
        for (const ind of industries) values[ind.code] = parseNum((rows[r] || [])[ind.col]);
        data.push({ year, values });
    }

    // Strip internal col property before returning.
    const cleanIndustries = industries.map(({ col, ...rest }) => rest);
    return { base, label, industries: cleanIndustries, data };
}

function main() {
    if (!fs.existsSync(SRC)) {
        console.error(`Source file not found:\n  ${SRC}`);
        process.exit(1);
    }
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
    const ws = wb.Sheets['Report 1'];
    if (!ws) {
        console.error('Sheet "Report 1" not found. Available sheets:', wb.SheetNames.join(', '));
        process.exit(1);
    }

    // raw: false so financial-year cells ("2024-25   ") come through as display strings.
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null });

    // Locate all "Industry Group" header rows.
    const hdrRowIdxs = [];
    for (let r = 0; r < rows.length; r++) {
        if (String((rows[r] || [])[1] || '').trim() === 'Industry Group') hdrRowIdxs.push(r);
    }
    if (hdrRowIdxs.length < 2) {
        console.error(`Expected at least 2 "Industry Group" header rows, found ${hdrRowIdxs.length}`);
        process.exit(1);
    }

    // For each header row, find the sub-label row immediately above it that contains
    // "(Base : YYYY-YY)" — typically 2 rows above.
    function findBase(hdrIdx) {
        for (let r = hdrIdx - 1; r >= Math.max(0, hdrIdx - 5); r--) {
            const cell = String((rows[r] || [])[1] || '').trim();
            const b = extractBase(cell);
            if (b) return b;
        }
        return null;
    }

    const baseLabels = {
        '2011-12' : 'Base: 2011-12 = 100',
        '2004-05' : 'Base: 2004-05',
        '1993-94' : 'Base: 1993-94',
    };

    const bases = [];
    for (let i = 0; i < hdrRowIdxs.length; i++) {
        const hdrIdx          = hdrRowIdxs[i];
        const nextSectionStart = hdrRowIdxs[i + 1] ?? rows.length;
        const base            = findBase(hdrIdx);
        if (!base) {
            console.warn(`Could not determine base for header row ${hdrIdx}; skipping.`);
            continue;
        }
        const label   = baseLabels[base] ?? `Base: ${base}`;
        const section = parseSection(rows, hdrIdx, nextSectionStart, base, label);
        bases.push(section);
    }

    const result = { reportTitle: REPORT_TITLE, bases };
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`Wrote ${OUT} (${sizeMB} MB)`);
    for (const b of bases) {
        console.log(`  ${b.base}: ${b.industries.length} industries × ${b.data.length} years`);
    }

    selfCheck(result);
    console.log('Self-check passed.');
}

// ---------------------------------------------------------------------------
// Self-check
// ---------------------------------------------------------------------------

// Known cells sampled directly from the workbook at inspection time:
//   [ base, year, code, expected ]
const KNOWN_CELLS = [
    // 2011-12 base
    [ '2011-12', '2024-25', '1',  131.0 ],
    [ '2011-12', '2024-25', '15', 228.4 ],
    [ '2011-12', '2023-24', '12', 233.6 ],
    [ '2011-12', '2012-13', '1',  103.3 ],
    // 2004-05 base
    [ '2004-05', '2016-17', '1',        149.6 ],
    [ '2004-05', '2016-17', 'mfgIndex', 187.0 ],
    [ '2004-05', '2015-16', 'mfgIndex', 189.8 ],
];

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    if (!result.bases || result.bases.length < 2) {
        fail(`expected at least 2 bases, got ${result.bases ? result.bases.length : 0}`);
    }

    const baseMap = new Map(result.bases.map(b => [ b.base, b ]));

    for (const b of result.bases) {
        if (b.data.length < 5) fail(`base ${b.base}: too few data rows (${b.data.length})`);

        // Years must be unique and strictly decreasing newest-first.
        const years = b.data.map(d => d.year);
        const seen  = new Set();
        for (let i = 0; i < years.length; i++) {
            const y = years[i];
            if (seen.has(y)) fail(`base ${b.base}: duplicate year "${y}"`);
            seen.add(y);
            if (i > 0 && y >= years[i - 1]) {
                fail(`base ${b.base}: not strictly newest-first at "${years[i - 1]}" -> "${y}"`);
            }
        }
    }

    // Spot-check known cells.
    for (const [ base, year, code, expected ] of KNOWN_CELLS) {
        const b = baseMap.get(base);
        if (!b) fail(`base "${base}" not found in output`);
        const row = b.data.find(d => d.year === year);
        if (!row) fail(`base ${base}: year "${year}" not found`);
        const got = row.values[code];
        if (got !== expected) {
            fail(`base ${base}: [year=${year}, code=${code}] expected ${expected}, got ${got}`);
        }
    }
}

main();
