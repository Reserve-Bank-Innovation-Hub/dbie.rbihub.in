// Processor: sources-of-money-stock — Table 7 of the Monthly RBI Bulletin
// (money-and-banking section). The workbook carries one sheet ("Report 1")
// with fortnightly observations of the sources of M3 (money stock), newest-first
// from 15-Mar-2026 back to 30-Mar-1951. Layout:
//
//   row 0         blank
//   row 1 (col 1) report title "Sources of Money Stock (M3)"
//   row 2         blank
//   row 3 (col 1) units note "(Rupees Crores)"
//   row 4         blank
//   row 5         header row — col 1 "Date", cols 2-35 item labels
//   rows 6…       data rows (col 1 = "DD-Mon-YY" date, cols 2-35 = values)
//   blank row + "See Notes on Table" footer row (ignored)
//
// Columns with "(Excluding Merger)" suffix are retained alongside their primary
// counterpart and marked with excludingMerger: true. Columns without numeric
// code prefixes (M3 aggregate columns at the end) are handled naturally.
//
// Emits out/sources-of-money-stock.json:
//   { reportTitle, units, columns: [{key, label, excludingMerger}], data: [{date, values: {key: number|null}}] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
    __dirname,
    '../publications/monthly-rbi-bulletin/money-and-banking/table-07-sources-of-money-stock-m3.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'sources-of-money-stock.json');

// Date cells arrive as "DD-Mon-YY" (e.g. "31-Jan-26"). Returns sortable "YYYY-MM-DD" or null.
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

// "8,944,038" -> 8944038. null/"-" -> null.
function parseNum(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/,/g, '');
    if (s === '' || s === '-' || s === 'N/A') return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
}

// Derive a camelCase key from a header label. Strips:
//   - Leading numeric code (e.g. "1.1.2 …" → "…")
//   - Trailing " (Excluding Merger)"
//   - Trailing parenthesised formula notes like " (3.1 + 3.2)" and " (1.1.1-1.1.2)"
function deriveKey(label, excludingMerger) {
    let s = String(label).trim();
    // Strip leading numeric code (e.g. "1.2 " or "2.2.3 " but not "M3 ")
    s = s.replace(/^\d+(\.\d+)*\s+/, '');
    // Strip " (Excluding Merger)" first so next step doesn't eat it twice
    s = s.replace(/\s*\(Excluding Merger\)\s*$/i, '');
    // Strip any remaining trailing parenthesised note (e.g. "(1.1.1-1.1.2)", "(3.1 + 3.2)", "(residual)")
    s = s.replace(/\s*\([^)]+\)\s*$/, '');
    // Normalise
    s = s.replace(/'/g, '').replace(/\s+/g, ' ').trim();
    // camelCase
    s = s
        .split(/[\s_\-\/]+/)
        .map((w, i) => {
            if (!w) return '';
            return i === 0 ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1);
        })
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

    // Build columns list from cols 2…N.
    const columns = [];
    const keyCount = {};
    for (let c = 2; c < hdrRow.length; c++) {
        const raw = hdrRow[c];
        if (raw == null || String(raw).trim() === '') continue;
        const label = String(raw).trim();
        const excl = /\(Excluding Merger\)/i.test(label);
        let key = deriveKey(label, excl);
        // Deduplicate if two labels produce the same key (e.g. duplicate sub-codes)
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
        if (/^see\s+notes/i.test(dateStr) || /^source/i.test(dateStr) || /^note/i.test(dateStr)) continue;
        const date = parseDateCell(dateStr);
        if (!date) continue;

        const values = {};
        for (const col of columns) {
            values[col.key] = parseNum(row[col.col]);
        }
        data.push({ date, values });
    }

    if (data.length === 0) throw new Error('no valid data rows found');

    return {
        reportTitle: 'Sources of money stock (M3) (Table 7)',
        units: 'Rupees crores',
        columns: columns.map(({ col, ...rest }) => rest),
        data,
    };
}

// --- self-check: fail loudly on mismatch ---
function selfCheck(out) {
    const { data, columns } = out;
    const errors = [];

    if (!Array.isArray(data) || data.length < 700) {
        errors.push(`expected ≥700 fortnightly rows, got ${data ? data.length : 'n/a'}`);
    }

    const byDate = new Map(data.map(r => [r.date, r.values]));
    const colKeys = new Set(columns.map(c => c.key));

    // Hard-coded cell assertions read directly from the source workbook.
    // [date, columnKey, expectedValue]
    const KNOWN = [
        // 31-Jan-26: net bank credit to government = 8,944,038; M3 = 29,903,539
        ['2026-01-31', 'netBankCreditToGovernment', 8944038],
        ['2026-01-31', 'm3', 29903539],
        // 31-Jan-26: gross foreign assets = 6,356,068
        ['2026-01-31', 'grossForeignAssets', 6356068],
        // 31-Dec-25: net bank credit to government = 8,750,686; M3 = 29,798,544
        ['2025-12-31', 'netBankCreditToGovernment', 8750686],
        ['2025-12-31', 'm3', 29798544],
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
        console.error('sources-of-money-stock self-check FAILED:');
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
