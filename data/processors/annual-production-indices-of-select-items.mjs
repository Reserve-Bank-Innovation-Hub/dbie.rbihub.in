// Processor: annual-production-indices-of-select-items — Handbook of Statistics on Indian Economy.
//
// Source xlsx: Annual Production Indices of Select Items (Base: 2011-12 = 100).
// Uses only the third sheet ("Base 2011-12", index 2). Layout:
//   row 2  title
//   row 4  base year
//   row 6  group headers (merged cells spanning groups of items)
//   row 7  item names (columns 2..81)
//   row 8  column numbers (1..80)
//   rows 9..21  data rows, oldest-first (2012-13 .. 2024-25)
//   row 23  notes/source
//
// Emits (newest-first):
//   out/annual-production-indices-of-select-items.json
//     { reportTitle, baseYear, items: [{ number, name, group }], data: [{ year, indices }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
    __dirname,
    '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/' +
    'Annual Production Indices of Select Items (Base_ 2011-12 = 100).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Strip commas and return a number, or null for blank/dash/missing values.
function parseNum(v) {
    const s = String(v == null ? '' : v).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// "2012-13   " -> "2012-13"
function parseYear(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return /^\d{4}-\d{2}$/.test(s) ? s : null;
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length < 3) throw new Error(`expected at least 3 sheets, got ${wb.SheetNames.length}`);

    const sheetName = wb.SheetNames[2];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header    : 1,
        raw       : false,
        defval    : null,
        blankrows : true,
    });

    // --- title (row 2, index 1) ---
    const reportTitle = String(rows[1]?.[1] ?? '').trim() ||
        'Annual Production Indices of Select Items (Base: 2011-12 = 100)';

    // --- base year (row 4, index 3) ---
    const baseYearRaw = String(rows[3]?.[1] ?? '').trim();
    const baseYear    = baseYearRaw.replace(/^Base Year:\s*/i, '').trim() || '2011-12';

    // --- group boundaries from row 6 (index 5) ---
    // Non-null values in that row mark the start column of each group.
    const groupRow = rows[5] || [];
    const groupStarts = []; // [{ colIdx, name }] sorted by colIdx
    for (let i = 2; i < groupRow.length; i++) {
        if (groupRow[i] != null && String(groupRow[i]).trim() !== '') {
            groupStarts.push({ colIdx: i, name: String(groupRow[i]).trim() });
        }
    }
    // Assign group to each column: a column belongs to the last group whose start <= colIdx.
    function groupForCol(colIdx) {
        let g = groupStarts[0]?.name ?? '';
        for (const gs of groupStarts) {
            if (gs.colIdx <= colIdx) g = gs.name;
            else break;
        }
        return g;
    }

    // --- item metadata from row 7 (index 6) ---
    // Columns 2..81 hold the 80 item names.
    const itemRow = rows[6] || [];
    const items   = [];
    for (let colIdx = 2; colIdx <= 81; colIdx++) {
        const rawName = String(itemRow[colIdx] ?? '').trim();
        // Strip the leading "N. " numbering if present (e.g. "1. Electricity").
        const name    = rawName.replace(/^\d+\.\s*/, '');
        const number  = colIdx - 1; // item 1 is at col 2
        items.push({
            number,
            name  : name || `Item ${number}`,
            group : groupForCol(colIdx),
        });
    }

    // --- data rows (indices 8..20 = rows 9..21) ---
    const data = [];
    for (let i = 8; i <= 20; i++) {
        const row  = rows[i] || [];
        const year = parseYear(row[1]);
        if (!year) continue;

        const indices = [];
        for (let colIdx = 2; colIdx <= 81; colIdx++) {
            indices.push(parseNum(row[colIdx]));
        }
        data.push({ year, indices });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    // Sort newest-first (the sheet is oldest-first; reverse for emission).
    data.sort((a, b) => (b.year > a.year ? 1 : b.year < a.year ? -1 : 0));

    return { reportTitle, baseYear, items, data };
}

// --- self-check: fail loudly on any discrepancy ---
function selfCheck(out) {
    const { data, items } = out;
    const errors = [];

    if (data.length !== 13) {
        errors.push(`expected 13 data rows (2012-13 to 2024-25), got ${data.length}`);
    }

    // Known cell assertions (verified against the source sheet).
    const find = year => data.find(r => r.year === year);

    const r2024 = find('2024-25');
    const r2012 = find('2012-13');
    const r2019 = find('2019-20');

    if (!r2024) {
        errors.push('missing row: 2024-25');
    } else {
        const elec2024 = r2024.indices[0]; // item 1 = index 0
        if (elec2024 !== 208.6)
            errors.push(`2024-25 Electricity: expected 208.6, got ${elec2024}`);
        const sugar2024 = r2024.indices[61]; // item 62 = index 61
        if (sugar2024 !== 94.9)
            errors.push(`2024-25 Sugar: expected 94.9, got ${sugar2024}`);
    }

    if (!r2012) {
        errors.push('missing row: 2012-13');
    } else {
        const elec2012 = r2012.indices[0];
        if (parseFloat(String(elec2012)) !== 104)
            errors.push(`2012-13 Electricity: expected 104, got ${elec2012}`);
    }

    if (!r2019) {
        errors.push('missing row: 2019-20');
    } else {
        const cars2019 = r2019.indices[56]; // item 57 = index 56
        if (parseFloat(String(cars2019)) !== 87.4)
            errors.push(`2019-20 Passenger cars: expected 87.4, got ${cars2019}`);
    }

    // Years must be unique.
    const years = data.map(r => r.year);
    const uniq  = new Set(years);
    if (uniq.size !== years.length) {
        errors.push(`years not unique: ${years.length} rows, ${uniq.size} distinct`);
    }

    // Ordered newest-first (strictly descending).
    for (let i = 1; i < years.length; i++) {
        if (years[i - 1] <= years[i]) {
            errors.push(`not strictly newest-first at row ${i}: ${years[i - 1]} then ${years[i]}`);
            break;
        }
    }

    // Should have exactly 80 items.
    if (items.length !== 80) {
        errors.push(`expected 80 items, got ${items.length}`);
    }

    return errors;
}

function main() {
    const out    = parse(fs.readFileSync(XLSX_SRC));
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('annual-production-indices-of-select-items self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(OUT_DIR, 'annual-production-indices-of-select-items.json'),
        JSON.stringify(out),
    );

    const newest = out.data[0].year;
    const oldest = out.data[out.data.length - 1].year;
    console.log(
        `wrote ${out.data.length} year rows ` +
        `(newest ${newest}, oldest ${oldest}; ${out.items.length} items); self-check passed`,
    );
}

main();
