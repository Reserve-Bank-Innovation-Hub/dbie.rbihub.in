// Processor: state-cooperative-banks — RBI Bulletin Table 17.
//
// Source xlsx carries one sheet ("Bulletin Table 17") with a three-level merged
// header and fortnightly data for state co-operative banks maintaining accounts
// with the Reserve Bank of India.
//
// Sheet layout:
//   row 0   blank
//   row 1   report title
//   row 2   blank
//   row 3   "Rupees Crores" unit annotation
//   row 4   blank
//   rows 5–7  three header rows (merged cells; read across all three to resolve
//             each column's full label).  Col 1 = "Month", col 2 = "Number of
//             Reporting Banks", cols 3–26 = 24 numeric item columns.
//   rows 8…  data rows, newest-first; col 1 = date ("Dec 31, 2025").
//            No Source/Note footer text — trailing blank rows only.
//
// Column hierarchy is resolved by carrying the last non-null value downwards
// across the three header rows (standard merged-cell forward-fill).
//
// '-'/blank → null; comma-stripped.
//
// Emits out/state-cooperative-banks.json:
//   { reportTitle, unit, columns, periods }
//   columns = [ { col, code, label, parent } ] (code from the leading numeric prefix)
//   periods = newest-first [ { date, numBanks, values: (number|null)[] } ]

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking',
    'table-17-state-co-operative-banks-maintaining-accounts-with-the-reserve-bank-of-india.xlsx',
);
const OUT = path.join(__dirname, 'out', 'state-cooperative-banks.json');

// Parse a numeric code prefix like "1", "2.1", "2.1.1.2", "10.1" from a label
// such as "1   Aggregate Deposits (2.1.1.2+2.2.1.2)" or "4.1 Demand".
// The code may be followed by one or more spaces before the label text.
function splitItemHeader(raw) {
    const text = String(raw).trim();
    const m = text.match(/^(\d[\d.]*)[\s]+(.+)$/);
    if (!m) return { code: text, label: text };
    return { code: m[1], label: m[2].trim() };
}

// Parent code: drop last dotted segment, or null at top level.
function parentCode(code) {
    const idx = code.lastIndexOf('.');
    return idx === -1 ? null : code.slice(0, idx);
}

// Numeric parse: strip commas, treat blank/dash as null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/,/g, '').replace(/–/g, '-');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// "Dec 31, 2025" → sortable key "2025-12-31".
function dateKey(label) {
    const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                     Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const m = String(label).trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s*(\d{4})$/);
    if (!m) return null;
    const mo = MONTHS[m[1]];
    if (!mo) return null;
    return `${m[3]}-${String(mo).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found');
    const sn = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
        header: 1, raw: false, defval: null, blankrows: true,
    });

    // Locate the first header row by finding "Month" in col 1.
    let hdr0 = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
        if (/^Month$/i.test(String((rows[r] || [])[1] || '').trim())) { hdr0 = r; break; }
    }
    if (hdr0 === -1) throw new Error('could not find "Month" header row');

    // Three header rows: hdr0, hdr0+1, hdr0+2.
    // Forward-fill each column across the three rows to resolve merged cells.
    const nCols = (rows[hdr0] || []).length;
    const resolved = [];
    for (let c = 0; c < nCols; c++) {
        let label = null;
        for (let r = hdr0; r <= hdr0 + 2; r++) {
            const cell = (rows[r] || [])[c];
            if (cell != null && String(cell).trim() !== '') label = String(cell).trim();
        }
        resolved.push(label);
    }

    // Columns 3..nCols-1 are numeric items (0-indexed: 3..nCols-1).
    // Col 1 = date ("Month"), col 2 = numBanks, cols 3+ = numeric items.
    const columns = [];
    for (let c = 3; c < nCols; c++) {
        const raw = resolved[c];
        if (!raw) continue;
        const { code, label } = splitItemHeader(raw);
        columns.push({ col: c, code, label, parent: parentCode(code) });
    }

    // Data rows start at hdr0+3.
    const periods = [];
    for (let r = hdr0 + 3; r < rows.length; r++) {
        const row = rows[r] || [];
        const dateLbl = String(row[1] || '').trim();
        if (!dateLbl || !dateKey(dateLbl)) continue;
        periods.push({
            date     : dateLbl,
            numBanks : parseNum(row[2]),
            values   : columns.map((col) => parseNum(row[col.col])),
        });
    }

    if (periods.length === 0) throw new Error('no data rows found');

    return {
        reportTitle : 'State co-operative banks maintaining accounts with the Reserve Bank of India (Table 17)',
        unit        : 'Rupees crore',
        columns     : columns.map(({ col, ...rest }) => rest),
        periods,
    };
}

// ---------------------------------------------------------------------------
// Self-check
// ---------------------------------------------------------------------------
// Known cells read directly from the source workbook at inspection time.
// Column indices are 0-based within the items array (items start at spreadsheet col 3):
//   items[0]  = "1   Aggregate Deposits …"             (spreadsheet col 3)
//   items[11] = "3   Borrowing from Reserve Bank"       (spreadsheet col 14)
//   items[19] = "7   Investments in Government Secs"    (spreadsheet col 22)
const KNOWN = [
    // [ date, colIdx, expected ]
    ['Dec 31, 2025', 0,  158419], // aggregate deposits
    ['Dec 31, 2025', 11, 200   ], // borrowing from RBI
    ['Dec 15, 2025', 0,  155556], // aggregate deposits, fortnight prior
    ['Nov 28, 1997', 0,  6397  ], // oldest row, aggregate deposits
];

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    const { periods, columns } = result;
    if (!Array.isArray(periods) || periods.length < 500) {
        fail(`expected ≥500 periods, got ${periods ? periods.length : 'n/a'}`);
    }
    if (!Array.isArray(columns) || columns.length < 20) {
        fail(`expected ≥20 columns, got ${columns ? columns.length : 'n/a'}`);
    }

    // Periods unique.
    const seen = new Set();
    for (const p of periods) {
        if (seen.has(p.date)) fail(`duplicate date "${p.date}"`);
        seen.add(p.date);
    }

    // Periods newest-first.
    for (let i = 1; i < periods.length; i++) {
        const a = dateKey(periods[i - 1].date);
        const b = dateKey(periods[i].date);
        if (a && b && a <= b) {
            fail(`not newest-first at "${periods[i - 1].date}" → "${periods[i].date}"`);
        }
    }

    // Known-cell spot checks.
    for (const [date, colIdx, expected] of KNOWN) {
        const p = periods.find((r) => r.date === date);
        if (!p) { fail(`date "${date}" not found`); continue; }
        const got = p.values[colIdx];
        if (got !== expected) {
            fail(`[${date}, col ${colIdx}]: expected ${expected}, got ${got}`);
        }
    }
}

function main() {
    const result = parse(fs.readFileSync(SRC));

    selfCheck(result);

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(
        `wrote ${result.columns.length} columns × ${result.periods.length} periods → ${OUT} (${sizeMB} MB); ` +
        `newest "${result.periods[0].date}", oldest "${result.periods[result.periods.length - 1].date}"; ` +
        `self-check passed`,
    );
}

main();
