// Processor: bank-credit-by-sector — RBI Bulletin Table 15.
//
// Source xlsx has one sheet ("New Format") containing outstanding gross bank
// credit broken down by major sector (Agriculture, Industry, Services, Personal
// Loans) and sub-sector, for 84 fortnightly/end-of-month periods from
// January 2019 to December 2025.
//
// Sheet layout (0-indexed row numbers, 1-indexed column numbers from the xlsx):
//   row 0          blank
//   row 1 (col 2)  report title
//   row 3 (col 2)  unit "(Amount in Rupees Crores)"
//   row 5          section headers ("Serial No" | "Sector" | "Outstanding as on" …)
//   row 6          period labels in cols 4–87 (1-indexed), e.g. "January  18, 2019"
//   rows 7–61      sector rows: col 2 = raw serial code, col 3 = sector label,
//                  cols 4–87 = outstanding amounts as formatted strings
//   row 62         Notes/Source text — skipped
//
// Sector codes are normalised: trailing dots and spaces are stripped ("I." -> "I",
// "2.1 " -> "2.1"). The hierarchy is derived from the dotted code — a code's
// parent is its code with the last segment removed ("3.7.1" -> "3.7"); single-
// segment codes (Roman numerals and bare integers) have no parent.
//
// Emits: out/bank-credit-by-sector.json
//   {
//     reportTitle : string,
//     unit        : string,
//     periods     : string[],        // raw date labels, oldest-first
//     items       : {
//       code   : string,
//       label  : string,
//       parent : string | null,
//       values : (number | null)[],  // aligned to periods[], null for blank/dash
//     }[],
//   }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking',
    'table-15-deployment-of-gross-bank-credit-by-major-sectors.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "9,332,555" -> 9332555; blank/null/dash -> null.
function parseNum(s) {
    if (s == null) return null;
    const t = String(s).trim().replace(/,/g, '');
    if (t === '' || t === '-' || t === 'N/A') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v).trim();
}

// Normalise a raw serial code: strip trailing dots and spaces.
// "I."   -> "I"   "2.1 " -> "2.1"   "3.10 " -> "3.10"
function normaliseCode(raw) {
    return String(raw).trim().replace(/\.?\s*$/, '').trim();
}

// Derive the parent code for a normalised code. Single-segment codes
// (Roman numerals "I", "II", "III" or bare integers "1" … "5") have no
// parent; everything else loses its last dotted segment.
function deriveParent(code) {
    const idx = code.lastIndexOf('.');
    if (idx === -1) return null;
    return code.slice(0, idx);
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sn = 'New Format';
    if (!wb.Sheets[sn]) {
        throw new Error(`Sheet "${sn}" not found; available: ${wb.SheetNames.join(', ')}`);
    }

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
        header   : 1,
        raw      : false,
        defval   : null,
        blankrows: true,
    });

    // Row 1 (0-indexed): report title in col 1.
    const reportTitle = cellStr(rows[1] || [], 1) ||
        'Deployment of gross bank credit by major sectors (Table 15)';

    // Row 3: unit in col 1.
    const unit = cellStr(rows[3] || [], 1).replace(/[()]/g, '').trim() ||
        'Amount in Rupees Crores';

    // Row 6 (0-indexed): period labels starting at col 3 (0-indexed).
    const periodRow = rows[6] || [];
    const periods = [];
    const periodColStart = 3; // first period is col index 3
    for (let c = periodColStart; c < periodRow.length; c++) {
        const v = periodRow[c];
        if (v != null && String(v).trim() !== '') {
            periods.push(String(v).trim());
        }
    }

    if (periods.length === 0) throw new Error('no period labels found in row 6');

    const periodCount = periods.length; // 84

    // Data rows: rows 7–61 (0-indexed), skipping blanks and the trailing notes row.
    const items = [];

    for (let i = 7; i < rows.length; i++) {
        const row = rows[i] || [];
        const rawCode = row[1];
        const rawLabel = row[2];

        // Skip blank rows (both code and label cells are empty).
        if (rawCode == null && rawLabel == null) continue;

        // Skip the trailing Notes/Source row (col 1 starts with "Notes:" or
        // similar non-code text).
        if (rawCode != null && /^Notes/i.test(String(rawCode))) continue;
        if (rawCode == null && rawLabel == null) continue;

        const code = normaliseCode(rawCode || '');
        if (code === '') continue; // defensive: skip rows with no code

        const label = rawLabel != null ? String(rawLabel).trim() : '';

        // Extract values for each period column.
        const values = [];
        for (let c = periodColStart; c < periodColStart + periodCount; c++) {
            values.push(parseNum(row[c]));
        }

        items.push({
            code,
            label,
            parent : deriveParent(code),
            values,
        });
    }

    if (items.length === 0) throw new Error('no sector rows found in sheet "New Format"');

    return {
        reportTitle : 'Deployment of gross bank credit by major sectors (Table 15)',
        unit        : 'Rupees crores',
        periods,
        items,
    };
}

// ---------------------------------------------------------------------------
// Self-check: fail loudly (non-zero exit) if the parse drifts from the source.
// ---------------------------------------------------------------------------

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(out) {
    const { periods, items } = out;

    // Periods are unique.
    const seen = new Set();
    for (const p of periods) {
        if (seen.has(p)) fail(`duplicate period "${p}"`);
        seen.add(p);
    }

    // Periods are in ascending date order (oldest-first).
    // Parse the raw label like "January  18, 2019" -> Date.
    const parseDate = (label) => {
        const m = label.match(/(\w+)\s+\d+,\s+(\d{4})/);
        if (!m) fail(`cannot parse period label "${label}"`);
        const months = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
        const monthIdx = months.indexOf(m[1]);
        if (monthIdx === -1) fail(`unknown month in "${label}"`);
        return Number(m[2]) * 12 + monthIdx;
    };
    for (let i = 1; i < periods.length; i++) {
        if (parseDate(periods[i]) < parseDate(periods[i - 1])) {
            fail(`periods not in ascending order at index ${i}: "${periods[i - 1]}" -> "${periods[i]}"`);
        }
    }

    // Helper to find an item by code.
    const findItem = (code) => {
        const it = items.find(x => x.code === code);
        if (!it) fail(`item with code "${code}" not found`);
        return it;
    };

    // Assert 1: Item "I" (Gross Bank Credit), period index 0 = Jan 18 2019 -> 9332555.
    const itemI = findItem('I');
    if (itemI.values[0] !== 9332555) {
        fail(`item "I" at period 0: expected 9332555, got ${itemI.values[0]}`);
    }

    // Assert 2: Item "4.2" (Housing), period index 0 -> 1141733.
    const item42 = findItem('4.2');
    if (item42.values[0] !== 1141733) {
        fail(`item "4.2" at period 0: expected 1141733, got ${item42.values[0]}`);
    }

    // Assert 3: Item "5.10" (Weaker Sections), period index 83 = Dec 31 2025 -> 2001782.
    const item510 = findItem('5.10');
    if (item510.values[83] !== 2001782) {
        fail(`item "5.10" at period 83: expected 2001782, got ${item510.values[83]}`);
    }

    // Each item must have exactly periodCount values.
    const periodCount = periods.length;
    for (const it of items) {
        if (it.values.length !== periodCount) {
            fail(`item "${it.code}" has ${it.values.length} values, expected ${periodCount}`);
        }
    }
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));

    selfCheck(out);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'bank-credit-by-sector.json');
    fs.writeFileSync(outPath, JSON.stringify(out));

    const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
    console.log(
        `wrote ${out.items.length} sector rows × ${out.periods.length} periods ` +
        `(${out.periods[0]} → ${out.periods[out.periods.length - 1]}) ` +
        `-> ${outPath} (${sizeMB} MB); self-check passed`,
    );
}

main();
