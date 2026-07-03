// Processor: money-stock-measures — Table 6 of the Monthly RBI Bulletin
// (money-and-banking section). The workbook carries one sheet ("Fortnightly")
// with fortnightly observations of money stock components and aggregates,
// newest-first from 15-Mar-2026 back to 31-Mar-1951. Layout:
//
//   row 0         blank
//   row 1 (col 1) report title "Money Stock : Components and Sources"
//   row 2         blank
//   row 3 (col 1) units note "(Rupees Crores)"
//   row 4         blank
//   row 5         header row — col 1 "Date", cols 2-18 item labels
//   rows 6…       data rows (col 1 = "DD-Mon-YY" date, cols 2-18 = values)
//   trailing blank row + footer rows (ignored)
//
// Columns with "(Excluding Merger)" suffix are retained alongside their primary
// counterpart but marked with excludingMerger: true so the frontend can choose
// which to display.
//
// Emits out/money-stock-measures.json:
//   { reportTitle, units, columns: [{key, label, excludingMerger}], data: [{date, values: {key: number|null}}] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking/table-06-money-stock-measures.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'money-stock-measures.json');

// Date cells arrive as "DD-Mon-YY" (e.g. "15-Mar-26"). Returns a sortable ISO
// string "YYYY-MM-DD" or null for anything that doesn't parse.
function parseDateCell(raw) {
    if (raw == null) return null;
    const s = String(raw).trim();
    const m = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
    if (!m) return null;
    const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                     Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const day = m[1];
    const mon = MONTHS[m[2]];
    if (!mon) return null;
    // Two-digit year: ≤30 → 20xx, else 19xx (covers 1951-2026 range)
    const yy = parseInt(m[3], 10);
    const year = yy <= 30 ? 2000 + yy : 1900 + yy;
    return `${year}-${String(mon).padStart(2, '0')}-${day}`;
}

// "3,906,775" -> 3906775. null/"-" -> null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
}

// Derive a camelCase key from a header label, stripping the numeric code prefix
// and the "(Excluding Merger)" suffix before slugifying.
function deriveKey(label, excludingMerger) {
    let s = String(label).trim();
    // Strip leading "N " numeric code (e.g. "1 Currency...", "1.1 Notes...")
    s = s.replace(/^\d+(\.\d+)*\s+/, '');
    // Strip " (Excluding Merger)" suffix
    s = s.replace(/\s*\(Excluding Merger\)\s*$/, '');
    // Compact spaces + apostrophes
    s = s.replace(/'/g, '').replace(/\s+/g, ' ').trim();
    // CamelCase
    s = s
        .split(/[\s_\-/]+/)
        .map((w, i) => (i === 0 ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1)))
        .join('');
    if (excludingMerger) s += '_excl';
    return s;
}

function parse(buf) {
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header: 1,
        raw: false,
        defval: null,
        blankrows: true,
    });

    // Locate the header row (col 1 === "Date").
    let hdrIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        if (String((rows[i] || [])[1] || '').trim() === 'Date') { hdrIdx = i; break; }
    }
    if (hdrIdx < 0) throw new Error('could not find header row (Date) in sheet');

    const hdrRow = rows[hdrIdx] || [];

    // Build columns list from cols 2…N, preserving all (including Excl Merger).
    const columns = [];
    const keyCount = {};
    for (let c = 2; c < hdrRow.length; c++) {
        const raw = hdrRow[c];
        if (raw == null || String(raw).trim() === '') continue;
        const label = String(raw).trim();
        const excl = /\(Excluding Merger\)/i.test(label);
        let key = deriveKey(label, excl);
        // Deduplicate keys if needed
        if (keyCount[key]) { key += `_${keyCount[key]}`; }
        keyCount[key] = (keyCount[key] || 0) + 1;
        columns.push({ col: c, key, label, excludingMerger: excl });
    }

    // Parse data rows.
    const data = [];
    for (let i = hdrIdx + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const dateRaw = row[1];
        if (dateRaw == null || String(dateRaw).trim() === '') continue;
        const dateStr = String(dateRaw).trim();
        // Skip footer lines
        if (/^see\s+notes/i.test(dateStr) || /^source/i.test(dateStr) || /^note/i.test(dateStr)) continue;
        const date = parseDateCell(dateStr);
        if (!date) continue; // skip anything that isn't a date

        const values = {};
        for (const col of columns) {
            values[col.key] = parseNum(row[col.col]);
        }
        data.push({ date, values });
    }

    if (data.length === 0) throw new Error('no valid data rows found');

    return {
        reportTitle: 'Money stock measures (Table 6)',
        units: 'Rupees crores',
        columns: columns.map(({ col, ...rest }) => rest),
        data,
    };
}

// --- self-check: fail loudly on mismatch ---
function selfCheck(out) {
    const { data, columns } = out;
    const errors = [];

    if (!Array.isArray(data) || data.length < 1000) {
        errors.push(`expected ≥1000 fortnightly rows, got ${data ? data.length : 'n/a'}`);
    }

    // Build lookup by date and column key.
    const byDate = new Map(data.map(r => [r.date, r.values]));
    const colKeys = new Set(columns.map(c => c.key));

    // Hard-coded cell assertions read directly from the source workbook.
    // [date, columnKey, expectedValue]
    const KNOWN = [
        // 15-Mar-26: currency with public = 4,052,659; m3 = 30,193,459
        ['2026-03-15', 'currencyWithThePublic', 4052659],
        ['2026-03-15', 'm3', 30193459],
        // 31-Jan-26: m1 = 7,312,843; m4 = 31,479,408
        ['2026-01-31', 'm1', 7312843],
        ['2026-01-31', 'm4', 31479408],
        // 31-Mar-51 (oldest full row): m3 = 2,352
        ['1951-03-31', 'm3', 2352],
    ];

    for (const [date, key, expected] of KNOWN) {
        if (!byDate.has(date)) { errors.push(`known date missing: ${date}`); continue; }
        if (!colKeys.has(key)) { errors.push(`known column key missing: ${key}`); continue; }
        const got = byDate.get(date)[key];
        if (got !== expected) errors.push(`[${date}, ${key}]: expected ${expected}, got ${got}`);
    }

    // Dates must be unique.
    const dates = data.map(r => r.date);
    const uniq = new Set(dates);
    if (uniq.size !== dates.length) {
        errors.push(`dates not unique: ${dates.length} rows, ${uniq.size} distinct`);
    }

    // Ordered newest-first (strictly descending ISO strings).
    for (let i = 1; i < dates.length; i++) {
        if (dates[i - 1] <= dates[i]) {
            errors.push(`not newest-first at row ${i}: ${dates[i - 1]} then ${dates[i]}`);
            break;
        }
    }

    return errors;
}

function main() {
    const out = parse(fs.readFileSync(XLSX_SRC));

    const errors = selfCheck(out);
    if (errors.length > 0) {
        console.error('money-stock-measures self-check FAILED:');
        errors.forEach(e => console.error('  ' + e));
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(out));

    console.log(
        `wrote ${out.data.length} fortnightly rows ` +
        `(newest ${out.data[0].date}, oldest ${out.data[out.data.length - 1].date}); ` +
        `${out.columns.length} columns; self-check passed`,
    );
}

main();
