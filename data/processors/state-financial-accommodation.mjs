// Processor: state-financial-accommodation — RBI Bulletin Table 49.
//
// Source xlsx carries one sheet ("Report 1") with state-wise financial
// accommodation data across three facilities: SDF, WMA, and OD.
// Layout:
//   row 1  blank
//   row 2  title "Financial Accommodation Availed by State Governments under various Facilities"
//   row 3  blank
//   row 4  unit "(₹ Crores)"
//   row 5  blank
//   row 6  month span headers (forward-filled): "During January 2026", …
//   row 7  facility span headers (forward-filled): "Special Drawing Facility (SDF)", …
//   row 8  measure headers: "Average amount availed" / "Number of days availed"
//   rows 9…38  data rows (col[1] = state/UT name, values start at col[2])
//   row 39 blank
//   row 40 notes footnote block
//   row 41 source line
//
// Column structure (repeating every 6 cols starting at col[2]):
//   SDF avg | SDF days | WMA avg | WMA days | OD avg | OD days
//
// Each month block occupies 6 columns; months run newest-first (col[2]).
// Total months in current file: 101 (September 2017 → January 2026).
//
// Emits:
//   out/state-financial-accommodation.json
//     { reportTitle, unit, notes, columns, data }
//   columns : [{ month, facility, measure }, …]
//   data    : [{ state, values: (number|null)[] }, …]

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/occasional-series/table-49-financial-accommodation-availed-by-state-governments-under-various-facilities.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,23,456" → 123456. Returns null for blank/dash/nil so gaps stay distinct from real zeros.
function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return null;
    const val = Number(s);
    return Number.isFinite(val) ? val : null;
}

function cellStr(row, i) {
    const v = row[i];
    return v == null ? '' : String(v).replace(/\s+/g, ' ').trim();
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, {
        header    : 1,
        raw       : false,
        defval    : null,
        blankrows : true,
    });

    // ── metadata ─────────────────────────────────────────────────────────────
    const reportTitle = cellStr(rows[1] || [], 1)
        || 'Financial Accommodation Availed by State Governments under various Facilities';
    const unit        = cellStr(rows[3] || [], 1).replace(/^\(|\)$/g, '').trim()
        || '₹ Crores';

    // ── collect notes from row 40 and row 41 ─────────────────────────────────
    const notes = [];
    for (const ri of [39, 40]) {
        const raw = cellStr(rows[ri] || [], 1);
        if (raw) notes.push(raw.replace(/\s+/g, ' ').trim());
    }

    // ── header rows (0-indexed: rows[5], rows[6], rows[7]) ───────────────────
    const monthRow    = rows[5] || [];  // row 6
    const facilityRow = rows[6] || [];  // row 7
    const measureRow  = rows[7] || [];  // row 8

    // Forward-fill month and facility spans across their child columns.
    let curMonth    = '';
    let curFacility = '';
    const columns   = [];

    // Data starts at col[2] and ends at the last non-null measure cell.
    // Find last data column index.
    let lastDataCol = 1;
    for (let ci = 2; ci < measureRow.length; ci++) {
        if (measureRow[ci] != null) lastDataCol = ci;
    }

    for (let ci = 2; ci <= lastDataCol; ci++) {
        const m = cellStr(monthRow, ci);
        const f = cellStr(facilityRow, ci);
        const me = cellStr(measureRow, ci);

        if (m)  curMonth    = m;
        if (f)  curFacility = f;

        if (me) {
            columns.push({
                month    : curMonth,
                facility : curFacility,
                measure  : me,
            });
        }
    }

    if (columns.length === 0) throw new Error('no column definitions found in header rows');

    // ── data rows 9–38 (0-indexed rows[8]–rows[37]) ──────────────────────────
    const data = [];
    for (let ri = 8; ri <= 37; ri++) {
        const row   = rows[ri] || [];
        const state = cellStr(row, 1).replace(/\s+/g, ' ').trim();
        if (!state) continue;

        const values = columns.map((_, colIdx) => parseNum(row[2 + colIdx]));
        data.push({ state, values });
    }

    if (data.length < 25) {
        throw new Error(`expected ≥25 state rows, got ${data.length}`);
    }

    // States must be unique.
    const stateNames = data.map(d => d.state);
    const uniq       = new Set(stateNames);
    if (uniq.size !== stateNames.length) {
        throw new Error(`state names not unique: ${stateNames.length} rows, ${uniq.size} distinct`);
    }

    return { reportTitle, unit, notes, columns, data };
}

// ── self-check: fail loudly if known cells drift from source ─────────────────
function selfCheck(out) {
    const { columns, data } = out;
    const errors = [];

    if (!Array.isArray(data) || data.length < 25) {
        errors.push(`expected ≥25 state rows, got ${data ? data.length : 'n/a'}`);
    }

    // Every row must have values aligned to columns.
    for (const row of (data || [])) {
        if (row.values.length !== columns.length) {
            errors.push(
                `state "${row.state}" has ${row.values.length} values but ${columns.length} columns`,
            );
        }
    }

    // Anchor: Andhra Pradesh — Jan 2026 SDF avg = 5341, days = 25, WMA avg = 2875, days = 6.
    const ap = (data || []).find(r => r.state === 'Andhra Pradesh');
    if (!ap) {
        errors.push('anchor state "Andhra Pradesh" not found');
    } else {
        const checks = [
            { idx: 0, expected: 5341,  desc: 'Jan 2026 SDF avg amount' },
            { idx: 1, expected: 25,    desc: 'Jan 2026 SDF days' },
            { idx: 2, expected: 2875,  desc: 'Jan 2026 WMA avg amount' },
            { idx: 3, expected: 6,     desc: 'Jan 2026 WMA days' },
        ];
        for (const { idx, expected, desc } of checks) {
            const got = ap.values[idx];
            if (got !== expected) {
                errors.push(`Andhra Pradesh ${desc}: expected ${expected}, got ${got}`);
            }
        }
    }

    // Columns length should be a multiple of 6 (3 facilities × 2 measures per month),
    // or within 5 of a multiple if the last month is partially truncated in the source.
    if (columns.length % 6 > 5) {
        errors.push(`columns.length (${columns.length}) is unexpectedly misaligned (remainder ${columns.length % 6})`);
    }

    return errors;
}

function main() {
    const out    = parse(fs.readFileSync(XLSX_SRC));
    const errors = selfCheck(out);

    if (errors.length > 0) {
        console.error('state-financial-accommodation self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(OUT_DIR, 'state-financial-accommodation.json'),
        JSON.stringify(out),
    );

    const months = out.columns.length / 6;
    console.log(
        `wrote ${out.data.length} state rows, ${out.columns.length} columns (${months} months × 6); ` +
        `months ${out.columns[0].month} → ${out.columns[out.columns.length - 1].month}; ` +
        `self-check passed`,
    );
}

main();
