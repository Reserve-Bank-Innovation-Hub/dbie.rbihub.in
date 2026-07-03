// Processor: household-financial-stocks — RBI Bulletin Table 52(b).
//
// Source xlsx "Report 1" sheet layout (35 rows):
//   row 1   blank
//   row 2   title in col[1]: "Stocks of Financial Assets and Liabilities of Households - Select Indicators"
//   row 3   blank
//   row 4   col[1]: "(Amount in Rupees Crores)"
//   row 5   blank
//   row 6   header row — col[1] = "Item", col[2..] = quarter-end period labels
//           ("JUN-2018", "SEP-2018", … "DEC-2024"; 27 periods)
//   rows 7–33  data — col[1] = item label (leading spaces encode hierarchy), col[2..] = values
//   row 34  blank
//   row 35  notes
//
// The table is PIVOTED: rows are items, columns are quarter-end periods.
// Item labels carry leading spaces for hierarchy — preserved in `indent` (counted in groups
// of 3 leading spaces, capped at 3 levels). "-"/blank → null; commas stripped.
//
// Emits:
//   out/household-financial-stocks.json
//     { reportTitle, unit, notes, columns, data: [{ item, indent, values }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/occasional-series/' +
    'RBIB Table No. 52 (b)_ Stocks of Financial Assets and Liabilities of Households - Select Indicators.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v);
}

// "14,490,526.2" → 14490526.2. Returns null for blank / dash / non-numeric.
function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// Count leading-space indent depth (groups of 3 spaces, capped at 3).
function indentDepth(raw) {
    const leading = raw.match(/^(\s*)/);
    const spaces  = leading ? leading[1].length : 0;
    return Math.min(Math.floor(spaces / 3), 3);
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header    : 1,
        raw       : false,
        defval    : null,
        blankrows : true,
    });

    // --- metadata ---
    const titleRow = rows[1] || [];   // row 2 (0-indexed: 1)
    const unitRow  = rows[3] || [];   // row 4 (0-indexed: 3)

    const reportTitle = cellStr(titleRow, 1).trim()
        || 'Stocks of Financial Assets and Liabilities of Households - Select Indicators';

    let unit = 'Rupees Crores';
    const unitRaw = cellStr(unitRow, 1).trim();
    // "(Amount in Rupees Crores)" → "Rupees Crores"
    const unitMatch = unitRaw.match(/Rupees\s+Crores/i);
    if (unitMatch) unit = 'Rupees Crores';

    // --- column headers (period labels) from row 6 (0-indexed: 5) ---
    const headerRow = rows[5] || [];
    const columns   = [];
    for (let ci = 2; ci < headerRow.length; ci++) {
        const label = cellStr(headerRow, ci).trim();
        if (label) columns.push(label);
    }
    if (columns.length === 0) throw new Error('no period columns found in header row');

    // --- data rows 7–33 (0-indexed: 6–32) ---
    const data  = [];
    let   notes = [];

    for (let ri = 6; ri < rows.length; ri++) {
        const row    = rows[ri] || [];
        const raw    = cellStr(row, 1);
        const label  = raw.trim();

        if (!label) continue;

        // Notes row: col[1] starts with "Notes:" or "Note"
        if (/^Notes?:/i.test(label)) {
            const notesText = cellStr(row, 1).trim();
            // Split multi-line or numbered-list notes into individual strings.
            notes = notesText
                .replace(/^Notes?:\s*/i, '')
                .split(/\n|\d+\.\s+/)
                .map((n) => n.trim())
                .filter(Boolean);
            break;
        }

        const indent = indentDepth(raw);
        const values = columns.map((_, ci) => parseNum(row[ci + 2]));

        data.push({ item: label, indent, values });
    }

    if (data.length === 0) throw new Error('no data rows found');

    return { reportTitle, unit, notes, columns, data };
}

// --- self-check ---
function selfCheck(out) {
    const { columns, data } = out;
    const errors = [];

    // Shape
    if (!Array.isArray(data) || data.length < 24) {
        errors.push(`expected ≥24 item rows, got ${data ? data.length : 'n/a'}`);
    }
    if (!Array.isArray(columns) || columns.length < 25) {
        errors.push(`expected ≥25 period columns, got ${columns ? columns.length : 'n/a'}`);
    }

    // Helper to find row by trimmed item label
    const findRow = (label) => data.find((r) => r.item === label);
    const colIdx  = (label) => columns.indexOf(label);

    // Anchor: "Financial Assets (a+b+c+d+e+f+g+h)" JUN-2018 = 14490526.2
    const fa = findRow('Financial Assets (a+b+c+d+e+f+g+h)');
    if (!fa) {
        errors.push('anchor row "Financial Assets (a+b+c+d+e+f+g+h)" not found');
    } else {
        const junIdx = colIdx('JUN-2018');
        const decIdx = colIdx('DEC-2020');
        if (junIdx < 0) errors.push('JUN-2018 column not found');
        else if (Math.abs((fa.values[junIdx] ?? NaN) - 14490526.2) > 0.5)
            errors.push(`Financial Assets JUN-2018: expected 14490526.2, got ${fa.values[junIdx]}`);
        if (decIdx >= 0 && Math.abs((fa.values[decIdx] ?? NaN) - 19333484.1) > 0.5)
            errors.push(`Financial Assets DEC-2020: expected 19333484.1, got ${fa.values[decIdx]}`);
    }

    // Anchor: second row "Per cent of GDP" JUN-2018 = 82.1
    const pctRows = data.filter((r) => r.item === 'Per cent of GDP');
    if (pctRows.length === 0) {
        errors.push('"Per cent of GDP" row not found');
    } else {
        const junIdx = colIdx('JUN-2018');
        if (junIdx >= 0 && Math.abs((pctRows[0].values[junIdx] ?? NaN) - 82.1) > 0.05)
            errors.push(`Per cent of GDP (first) JUN-2018: expected 82.1, got ${pctRows[0].values[junIdx]}`);
    }

    // Anchor: "(a) Bank Deposits (i+ii)" JUN-2018 = 8000655.6
    const bd = findRow('(a) Bank Deposits (i+ii)');
    if (!bd) {
        errors.push('anchor row "(a) Bank Deposits (i+ii)" not found');
    } else {
        const junIdx = colIdx('JUN-2018');
        if (junIdx >= 0 && Math.abs((bd.values[junIdx] ?? NaN) - 8000655.6) > 0.5)
            errors.push(`Bank Deposits JUN-2018: expected 8000655.6, got ${bd.values[junIdx]}`);
    }

    // Every row must have values aligned to columns
    for (const row of data) {
        if (row.values.length !== columns.length) {
            errors.push(`row "${row.item}" has ${row.values.length} values but ${columns.length} columns`);
            break;
        }
    }

    return errors;
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));

    const errors = selfCheck(out);
    if (errors.length > 0) {
        console.error('household-financial-stocks self-check FAILED:');
        errors.forEach((e) => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(OUT_DIR, 'household-financial-stocks.json'),
        JSON.stringify(out),
    );

    console.log(
        `wrote ${out.data.length} item rows × ${out.columns.length} period columns ` +
        `(oldest ${out.columns[0]}, newest ${out.columns[out.columns.length - 1]}); self-check passed`,
    );
}

main();
