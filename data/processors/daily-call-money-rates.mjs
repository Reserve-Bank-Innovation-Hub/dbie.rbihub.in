// Processor: daily-call-money-rates — RBI Bulletin Table 27.
//
// Source xlsx carries one sheet ("Report 1") with daily weighted average
// call/notice money rates. Layout:
//   row 1  blank
//   row 2  title: "DAILY WEIGHTED AVERAGE CALL / NOTICE MONEY RATES"
//   row 3  blank
//   row 4  header: "As on | Minimum Rate Borrowings/Lendings | Maximum Rate Borrowings/Lendings"
//   row 5  column numbers: "1 | 2 | 3" (skip)
//   rows 6…  data — FY section markers (e.g. "2026-27   ") interspersed
//             between date rows (e.g. "6-Apr-26", "4.20", "5.15")
//   no trailing Source:/Note: rows found
//
// Date cells arrive as "D-Mon-YY" strings (e.g. "6-Apr-26", "30-Mar-26").
// Two-digit years: 00–99 mapped to 2000–2099 (all dates in data are ≥ 2005).
//
// Emits (newest-first, matching the sheet order):
//   out/daily-call-money-rates.json
//     { reportTitle, data: [{ date (ISO), fy, minRate, maxRate } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/financial-markets/table-27-daily-call-money-rates.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

const MONTHS_ABBR = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "3.75" -> 3.75. Returns null for blank, dash, or unparseable.
function parseRate(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "6-Apr-26" -> "2026-04-06"  (two-digit year 00–99 → 2000–2099)
function parseDate(raw) {
  const m = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const mon = MONTHS_ABBR[m[2].slice(0, 1).toUpperCase() + m[2].slice(1, 3).toLowerCase()];
  if (!mon) return null;
  const yr = 2000 + Number(m[3]);
  return `${yr}-${mon}-${day}`;
}

// "2026-27   " -> "2026-27"
function parseFY(raw) {
  return raw.trim();
}

// A row is a FY section marker if col-2 is a "YYYY-YY" or "YYYY-YYYY" string
// with only whitespace around it, and cols 2 and 3 are null/empty.
function isFYRow(row) {
  const c1 = cellStr(row, 1);
  return /^\d{4}-\d{2,4}\s*$/.test(c1) && row[2] == null && row[3] == null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sn = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  let reportTitle = '';

  // Title is on row index 1 (second row)
  if (rows[1]) {
    const t = cellStr(rows[1], 1);
    if (t) reportTitle = t;
  }

  // Find the header row (contains "As on")
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || [];
    if (/As on/i.test(cellStr(row, 1))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) throw new Error('could not locate "As on" header row');

  // Skip header + column-number row (row after header is "1 2 3")
  const dataStart = headerRow + 2;

  const data = [];
  let currentFY = '';

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i] || [];

    if (isFYRow(row)) {
      currentFY = parseFY(cellStr(row, 1));
      continue;
    }

    const dateRaw = cellStr(row, 1);
    if (dateRaw === '') continue;
    if (/^Source:/i.test(dateRaw) || /^Note:/i.test(dateRaw)) continue;

    const isoDate = parseDate(dateRaw);
    if (!isoDate) continue; // skip unrecognised rows

    data.push({
      date    : isoDate,
      fy      : currentFY,
      minRate : parseRate(row[2]),
      maxRate : parseRate(row[3]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return {
    reportTitle: reportTitle || 'Daily weighted average call / notice money rates',
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 5000) {
    errors.push(`expected ≥5000 rows, got ${data ? data.length : 'n/a'}`);
  }

  // Hard-coded cell assertions read straight off the sheet.
  const known = [
    // Row 6 in the sheet: "6-Apr-26", min=4.20, max=5.15  (FY 2026-27)
    { date: '2026-04-06', fy: '2026-27', minRate: 4.20, maxRate: 5.15 },
    // Row 7 in the sheet: "4-Apr-26", min=3.00, max=5.10
    { date: '2026-04-04', fy: '2026-27', minRate: 3.00, maxRate: 5.10 },
    // Near the end of the sheet (FY 2005-06): "1-Apr-05", min=3.75, max=4.95
    { date: '2005-04-01', fy: '2005-06', minRate: 3.75, maxRate: 4.95 },
  ];

  for (const exp of known) {
    const row = data.find(r => r.date === exp.date);
    if (!row) {
      errors.push(`known date missing: ${exp.date}`);
      continue;
    }
    if (row.fy !== exp.fy) {
      errors.push(`${exp.date} fy: expected "${exp.fy}", got "${row.fy}"`);
    }
    if (row.minRate !== exp.minRate) {
      errors.push(`${exp.date} minRate: expected ${exp.minRate}, got ${row.minRate}`);
    }
    if (row.maxRate !== exp.maxRate) {
      errors.push(`${exp.date} maxRate: expected ${exp.maxRate}, got ${row.maxRate}`);
    }
  }

  // Dates must be unique ISO strings.
  const dates = data.map(r => r.date);
  const uniq = new Set(dates);
  if (uniq.size !== dates.length) {
    errors.push(`dates not unique: ${dates.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending ISO date strings).
  for (let i = 1; i < dates.length; i++) {
    if (dates[i - 1] <= dates[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].date} then ${data[i].date}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('daily-call-money-rates self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'daily-call-money-rates.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} daily rows ` +
    `(newest ${out.data[0].date} FY ${out.data[0].fy}, ` +
    `oldest ${out.data[out.data.length - 1].date} FY ${out.data[out.data.length - 1].fy}); ` +
    'self-check passed',
  );
}

main();
