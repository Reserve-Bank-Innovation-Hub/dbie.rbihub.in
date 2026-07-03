// Processor: business-of-scheduled-banks — RBI Bulletin Table 14.
//
// Source xlsx carries two sheets, each with identical column structure (33
// numeric item columns + date + bank count) but a different bank-group scope:
//   "ALL Scheduled Banks"               — all scheduled banks in India
//   "All Scheduled Commercial banks"    — scheduled commercial banks only
//
// Sheet layout (same on both sheets):
//   row 0   blank
//   row 1   report title
//   row 2   blank
//   row 3   header: col 1 = "As on Date Final", col 2 = "Number of Reporting Banks",
//            cols 3–35 = hierarchical item labels prefixed with a numeric code
//            ("1 Liabilities to the Banking System", "1.1 …", …)
//   rows 4… data rows, newest-first; col 1 = date ("Jan 31,2026"), col 2 = bank
//            count, cols 3–35 = item values.  Trailing blank rows only (no footer text).
//
// '-' → null; comma-stripped; hierarchical code from the leading numeric prefix.
//
// Emits out/business-of-scheduled-banks.json:
//   { reportTitle, unit, sheets: [ { sheetName, bankGroup, items, periods } ] }
//   where items = column descriptors (code, label, parent) and
//   periods = newest-first array of { date, numBanks, values: (number|null)[] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking',
    'table-14-business-in-india-all-scheduled-banks-and-all-scheduled-commercial-banks.xlsx',
);
const OUT = path.join(__dirname, 'out', 'business-of-scheduled-banks.json');

// Strip a numeric code prefix from an item header like "1.1 Demand and Time
// Deposits from Banks" and "7 a Food Credit" (note the space before 'a').
// The code is the first whitespace-delimited token when it matches /^\d[\d.]*[a-z]?$/i.
function splitItemHeader(raw) {
    const text = String(raw).trim();
    const m = text.match(/^(\d[\d.]*[a-z]?)\s+(.+)$/i);
    if (!m) return { code: text, label: text };
    return { code: m[1], label: m[2].trim() };
}

// Parent code: drop the last dotted segment, or null at the top level.
// "1.1.1" → "1.1", "1.1" → "1", "1" → null, "7a" → null (treat as top-level).
function parentCode(code) {
    const idx = code.lastIndexOf('.');
    return idx === -1 ? null : code.slice(0, idx);
}

// Numeric parse: strip commas, treat blank/"–"/"-"/"N/A" as null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/,/g, '').replace(/–/g, '-');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

// Parse a date string like "Jan 31,2026" into a sortable key "2026-01-31".
function dateKey(label) {
    const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                     Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const m = label.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),(\d{4})$/);
    if (!m) return null;
    const mo = MONTHS[m[1]];
    if (!mo) return null;
    return `${m[3]}-${String(mo).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

function parseSheet(ws, sheetName) {
    const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1, raw: false, defval: null, blankrows: true,
    });

    // Locate the header row: col 1 is "As on Date Final".
    let hdrIdx = -1;
    for (let r = 0; r < Math.min(rows.length, 8); r++) {
        if (/As on Date/i.test(String((rows[r] || [])[1] || ''))) { hdrIdx = r; break; }
    }
    if (hdrIdx === -1) throw new Error(`no header row found in sheet "${sheetName}"`);

    const header = rows[hdrIdx];
    const nCols = header.length;

    // Build item descriptors for columns 3..nCols-1 (0-indexed: 3..nCols-1).
    // Col 1 = date, col 2 = numBanks, cols 3+ = numeric items.
    const items = [];
    for (let c = 3; c < nCols; c++) {
        const raw = header[c];
        if (raw == null || String(raw).trim() === '') continue;
        const { code, label } = splitItemHeader(raw);
        items.push({ col: c, code, label, parent: parentCode(code) });
    }

    // Collect data rows (newest-first in the source).
    const periods = [];
    for (let r = hdrIdx + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const dateLbl = String(row[1] || '').trim();
        if (!dateLbl || !dateKey(dateLbl)) continue; // skip blank + non-date rows
        periods.push({
            date     : dateLbl,
            numBanks : parseNum(row[2]),
            values   : items.map((item) => parseNum(row[item.col])),
        });
    }

    if (periods.length === 0) throw new Error(`no data rows found in sheet "${sheetName}"`);

    // Determine bank group from sheet title row.
    let bankGroup = sheetName;
    for (let r = 0; r < Math.min(rows.length, 3); r++) {
        const cell = String((rows[r] || [])[1] || '').trim();
        if (cell) { bankGroup = cell; break; }
    }

    return {
        sheetName,
        bankGroup,
        items: items.map(({ col, ...rest }) => rest),
        periods,
    };
}

function main() {
    const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });

    const sheets = wb.SheetNames.map((name) => parseSheet(wb.Sheets[name], name));
    const result = {
        reportTitle : 'Business in India — all scheduled banks and all scheduled commercial banks (Table 14)',
        unit        : 'Rupees crore',
        sheets,
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result));

    const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`wrote ${sheets.length} sheets → ${OUT} (${sizeMB} MB)`);
    for (const s of sheets) {
        console.log(`  "${s.sheetName}": ${s.items.length} items × ${s.periods.length} periods`);
    }

    selfCheck(result);
    console.log('self-check passed');
}

// ---------------------------------------------------------------------------
// Self-check: fail loudly on shape drift or known-cell mismatch.
// Values verified directly from the source workbook at inspection time.
// ---------------------------------------------------------------------------
const KNOWN = {
    'ALL Scheduled Banks': [
        // date, colIdx (0-based within items array; items start at spreadsheet col 3)
        // items[0] = "1 Liabilities to the Banking System" (spreadsheet col 3)
        // items[26] = "7 Bank Credit" (spreadsheet col 29)
        { date: 'Jan 31,2026', colIdx: 0,  expected: 468420.3196 }, // item 1 liab banking system
        { date: 'Jan 31,2026', colIdx: 26, expected: 20969154    }, // item 7 bank credit
        { date: 'May 30,1997', colIdx: 0,  expected: 25890.1229  }, // oldest row, item 1
    ],
    'All Scheduled Commercial banks': [
        { date: 'Jan 31,2026', colIdx: 26, expected: 20475236 }, // 7 bank credit, commercial
        { date: 'Jan 31,2026', colIdx: 0,  expected: 459585   }, // item 1 liab banking system
        { date: 'May 30,1997', colIdx: 0,  expected: 25534    }, // oldest row, item 1
    ],
};

function fail(msg) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exit(1);
}

function selfCheck(result) {
    if (!result.sheets || result.sheets.length !== 2) {
        fail(`expected 2 sheets, got ${result.sheets ? result.sheets.length : 0}`);
    }

    for (const s of result.sheets) {
        // Items and periods present.
        if (s.items.length < 30) fail(`"${s.sheetName}": too few items (${s.items.length})`);
        if (s.periods.length < 300) fail(`"${s.sheetName}": too few periods (${s.periods.length})`);

        // Periods are unique.
        const seen = new Set();
        for (const p of s.periods) {
            if (seen.has(p.date)) fail(`"${s.sheetName}": duplicate date "${p.date}"`);
            seen.add(p.date);
        }

        // Periods are strictly newest-first.
        for (let i = 1; i < s.periods.length; i++) {
            const a = dateKey(s.periods[i - 1].date);
            const b = dateKey(s.periods[i].date);
            if (a && b && a <= b) {
                fail(`"${s.sheetName}": not newest-first at "${s.periods[i - 1].date}" → "${s.periods[i].date}"`);
            }
        }

        // Known-cell spot checks.
        const knownCells = KNOWN[s.sheetName] || [];
        for (const { date, colIdx, expected } of knownCells) {
            const period = s.periods.find((p) => p.date === date);
            if (!period) { fail(`"${s.sheetName}": date "${date}" not found`); continue; }
            const got = period.values[colIdx];
            if (got !== expected) {
                fail(`"${s.sheetName}" [${date}, col ${colIdx}]: expected ${expected}, got ${got}`);
            }
        }
    }
}

main();
