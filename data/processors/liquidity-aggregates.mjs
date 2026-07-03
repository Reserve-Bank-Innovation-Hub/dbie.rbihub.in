// Processor: liquidity-aggregates — RBI Bulletin Table 09.
//
// Source xlsx carries one sheet ("Report 1") with monthly liquidity aggregate
// data (L1, L2, NM3 and sub-components), newest-first from "2026:01 (JAN)"
// back to "1993:04 (APR)". Layout:
//   row 1  blank
//   row 2  col 1 = report title "LIQUIDITY AGGREGATES"
//   row 4  col 1 = unit "(Rupees  Crores)"
//   row 6  col 1 = "Year / Month", then 12 value columns (cols 2–13)
//   rows 7… data (period = "2026:01 (JAN)" format, newest-first)
//   row 401 blank
//   row 402 long Notes text
//   row 404 "See Notes on Tables"
//
// Emits (newest-first):
//   out/liquidity-aggregates.json
//     {
//       reportTitle : string,
//       unit        : string,
//       columns     : { code, label }[],
//       data        : { period, values: (number|null)[] }[],
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/money-and-banking/table-09-liquidity-aggregates.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Fixed column spec derived from the numeric-prefix codes in the raw headers.
// 12 columns in source order, col 2 through col 13.
const COLUMN_SPEC = [
  { code: '1',         label: 'NM3' },
  { code: '1 (Excl.)', label: 'NM3 excluding merger' },
  { code: '2',         label: 'Postal deposits' },
  { code: '3',         label: 'L1 (1+2)' },
  { code: '3 (Excl.)', label: 'L1 excluding merger' },
  { code: '4',         label: 'Liabilities of financial institutions' },
  { code: '4.1',       label: 'Term money borrowings' },
  { code: '4.2',       label: 'Certificates of deposit' },
  { code: '4.3',       label: 'Term deposits' },
  { code: '5',         label: 'L2 (3+4)' },
  { code: '5 (Excl.)', label: 'L2 excluding merger' },
  { code: '6',         label: 'Public deposits with NBFCs' },
];

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "30,503,867" -> 30503867; blank or '-' -> null.
function parseNum(s) {
  if (s == null) return null;
  const t = String(s).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === 'N/A') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// "2026:01 (JAN)" -> "2026-01" (sortable key for ordering + uniqueness checks).
function periodKey(label) {
  const m = label.match(/^(\d{4}):(\d{2})\s*\(/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // The data sheet is named "Report 1"; try it first, then fall back to scan.
  const targetSheet = wb.Sheets['Report 1'] ?? wb.Sheets[wb.SheetNames[0]];
  if (!targetSheet) throw new Error('could not locate target sheet');

  const rows = XLSX.utils.sheet_to_json(targetSheet, {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  // Row 1 (index 1): report title in col 1
  const rawTitle = cellStr(rows[1] || [], 1);
  const reportTitle = rawTitle
    ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase()
    : 'Liquidity aggregates';

  // Row 3 (index 3): unit label in col 1 — strip parentheses and normalise
  const rawUnit = cellStr(rows[3] || [], 1).replace(/[()]/g, '').trim();
  const unit = rawUnit
    ? rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1).toLowerCase().replace(/\s+/g, ' ')
    : 'Rupees crores';

  // Row 5 (index 5): header row — find it by scanning for "Year / Month" in col 1
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const c1 = cellStr(rows[i] || [], 1);
    if (/year\s*\/\s*month/i.test(c1)) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) throw new Error('could not find "Year / Month" header row');

  // Data rows start immediately after the header row.
  const data = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const period = cellStr(row, 1);
    if (period === '') continue;
    // Stop at notes / non-data rows
    if (/^(Note|Source|See Note)/i.test(period)) break;
    // Confirm it looks like a period ("YYYY:MM ...")
    if (!periodKey(period)) continue;

    // Extract 12 value columns (cols 2–13, 0-indexed)
    const values = [];
    for (let c = 2; c <= 13; c++) {
      values.push(parseNum(row[c]));
    }

    data.push({ period, values });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return {
    reportTitle,
    unit,
    columns : COLUMN_SPEC,
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  // Minimum row count
  if (!Array.isArray(data) || data.length < 390) {
    errors.push(`expected ≥390 data rows, got ${data ? data.length : 'n/a'}`);
  }

  // Every row must have exactly 12 values
  for (let i = 0; i < data.length; i++) {
    if (!Array.isArray(data[i].values) || data[i].values.length !== 12) {
      errors.push(`row ${i} (${data[i].period}) has ${data[i].values?.length} values, expected 12`);
    }
  }

  // Hard-coded cell assertions verified against the source sheet.

  // Assertion 1 — 2026:01 (JAN): values[0] (NM3) = 30503867
  const jan2026 = data.find(r => r.period === '2026:01 (JAN)');
  if (!jan2026) {
    errors.push('known period missing: 2026:01 (JAN)');
  } else {
    if (jan2026.values[0] !== 30503867)
      errors.push(`2026:01 NM3: expected 30503867, got ${jan2026.values[0]}`);
  }

  // Assertion 2 — 2025:12 (DEC): values[3] (L1) = 31130585 and values[9] (L2) = 31263857
  const dec2025 = data.find(r => r.period === '2025:12 (DEC)');
  if (!dec2025) {
    errors.push('known period missing: 2025:12 (DEC)');
  } else {
    if (dec2025.values[3] !== 31130585)
      errors.push(`2025:12 L1: expected 31130585, got ${dec2025.values[3]}`);
    if (dec2025.values[9] !== 31263857)
      errors.push(`2025:12 L2: expected 31263857, got ${dec2025.values[9]}`);
  }

  // Assertion 3 — 1993:04 (APR): values[0] (NM3) = 379014, values[3] (L1) = 389867
  const apr1993 = data.find(r => r.period === '1993:04 (APR)');
  if (!apr1993) {
    errors.push('known period missing: 1993:04 (APR)');
  } else {
    if (apr1993.values[0] !== 379014)
      errors.push(`1993:04 NM3: expected 379014, got ${apr1993.values[0]}`);
    if (apr1993.values[3] !== 389867)
      errors.push(`1993:04 L1: expected 389867, got ${apr1993.values[3]}`);
  }

  // Periods must be unique
  const keys = data.map(r => periodKey(r.period));
  if (keys.some(k => k == null)) errors.push('some periods did not parse to a sortable key');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length)
    errors.push(`periods not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered strictly newest-first (descending keys)
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
      errors.push(
        `not strictly newest-first at row ${i}: ${data[i - 1].period} then ${data[i].period}`,
      );
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('liquidity-aggregates self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'liquidity-aggregates.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} period rows ` +
    `(newest ${out.data[0].period}, oldest ${out.data[out.data.length - 1].period}; ` +
    `unit: ${out.unit}); self-check passed`,
  );
}

main();
