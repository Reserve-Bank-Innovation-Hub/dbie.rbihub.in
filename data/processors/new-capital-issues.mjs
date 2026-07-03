// Processor: new-capital-issues — RBI Bulletin Table 31.
//
// Source xlsx has one sheet ("New Format") with new capital issues by
// non-government public limited companies (monthly, provisional for current FY).
//
// Layout (0-indexed row numbers, 1-indexed column numbers):
//   row 1   title row
//   row 3   unit: "(Rupees Crores)"
//   row 5   section headers:
//             col 1  "Security & Type of Issue"
//             col 3  "1  Equity Shares"
//             col 5  "1.1 Public"
//             col 7  "1.2 Rights"
//             col 9  "2 Public Issue of Bonds/ Debentures"
//             col 11 "3 Total (1+2)"
//             col 13 "3.1 Public"
//             col 15 "3.2 Rights"
//   row 6   sub-headers: Year | Month | [No. of Issues | Amount] ×7
//   rows 7… data rows — "Year" appears only on first month of each FY; "Month"
//             carries "Apr.", "May.", …
//   trailing blank + Note + Source rows
//
// Emits:
//   out/new-capital-issues.json
//     {
//       reportTitle : string,
//       unit        : string,
//       columns     : { code, label, measure }[],
//       rows        : { year, month, values: (number|null)[] }[],
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/financial-markets/table-31-new-capital-issues-by-non-government-public-limited-companies.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Column structure: each section contributes a "No. of Issues" then "Amount" pair,
// except "3.2 Rights" which only has "No. of Issues" in the visible sheet.
// We capture every (code, label, measure) triple in source order.
const COLUMN_SPEC = [
  { code: '1',   label: 'Equity shares',                            measure: 'no_of_issues' },
  { code: '1',   label: 'Equity shares',                            measure: 'amount' },
  { code: '1.1', label: 'Equity shares — public',                   measure: 'no_of_issues' },
  { code: '1.1', label: 'Equity shares — public',                   measure: 'amount' },
  { code: '1.2', label: 'Equity shares — rights',                   measure: 'no_of_issues' },
  { code: '1.2', label: 'Equity shares — rights',                   measure: 'amount' },
  { code: '2',   label: 'Public issue of bonds/debentures',         measure: 'no_of_issues' },
  { code: '2',   label: 'Public issue of bonds/debentures',         measure: 'amount' },
  { code: '3',   label: 'Total (equity + bonds)',                   measure: 'no_of_issues' },
  { code: '3',   label: 'Total (equity + bonds)',                   measure: 'amount' },
  { code: '3.1', label: 'Total — public',                           measure: 'no_of_issues' },
  { code: '3.1', label: 'Total — public',                           measure: 'amount' },
  { code: '3.2', label: 'Total — rights',                           measure: 'no_of_issues' },
];

// "1,277" -> 1277; blank/dash -> null.
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

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sn = 'New Format';
  if (!wb.Sheets[sn]) throw new Error(`Sheet "${sn}" not found; sheets: ${wb.SheetNames.join(', ')}`);

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  // Row 1 (index 1): report title
  const reportTitle = cellStr(rows[1] || [], 1) || 'New Capital Issues By Non-government Public Limited Companies';

  // Row 3 (index 3): unit
  const unit = cellStr(rows[3] || [], 1).replace(/[()]/g, '').trim() || 'Rupees crores';

  // Data starts at row 7 (index 7 — after title, blank, unit, blank, section-hdr, sub-hdr).
  // Data col mapping (0-indexed): year=1, month=2, then 13 values at cols 3–15.
  const dataRows = [];
  let lastYear = '';

  for (let i = 7; i < rows.length; i++) {
    const row = rows[i] || [];
    const month = cellStr(row, 2);
    // Stop at blank month + trailing note/source rows
    if (month === '') continue;
    if (/^(Note|Source)/i.test(month)) continue;

    // Year appears only on first month of each FY; carry forward when blank
    const yearCell = cellStr(row, 1);
    if (yearCell !== '') lastYear = yearCell.trim();

    // Extract the 13 value columns (cols 3 through 15 inclusive)
    const values = [];
    for (let c = 3; c <= 15; c++) {
      values.push(parseNum(row[c]));
    }

    dataRows.push({ year: lastYear, month, values });
  }

  if (dataRows.length === 0) throw new Error('no data rows found in sheet "New Format"');

  return {
    reportTitle,
    unit,
    columns : COLUMN_SPEC,
    rows    : dataRows,
  };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const errors = [];

  if (!Array.isArray(out.rows) || out.rows.length === 0) {
    errors.push('no data rows in output');
  }

  if (!Array.isArray(out.columns) || out.columns.length !== 13) {
    errors.push(`expected 13 columns, got ${out.columns ? out.columns.length : 'n/a'}`);
  }

  // Every row must have exactly 13 values
  for (let i = 0; i < out.rows.length; i++) {
    if (!Array.isArray(out.rows[i].values) || out.rows[i].values.length !== 13) {
      errors.push(`row ${i} (${out.rows[i].year} ${out.rows[i].month}) has ${out.rows[i].values?.length} values, expected 13`);
    }
  }

  // Hard-coded cell assertions verified against the source sheet.
  // Row: FY 2025-26, Apr. — col 0 (equity shares no. of issues) = 14, col 1 (amount) = 435
  const apr26 = out.rows.find(r => /2025-26/.test(r.year) && /^Apr/.test(r.month));
  if (!apr26) {
    errors.push('could not find 2025-26 Apr. row');
  } else {
    if (apr26.values[0] !== 14) errors.push(`2025-26 Apr equity no. of issues: expected 14, got ${apr26.values[0]}`);
    if (apr26.values[1] !== 435) errors.push(`2025-26 Apr equity amount: expected 435, got ${apr26.values[1]}`);
    // Total (col 9 = Total no_of_issues) = 20
    if (apr26.values[8] !== 20) errors.push(`2025-26 Apr total no. of issues: expected 20, got ${apr26.values[8]}`);
    // Total amount (col 10) = 1712
    if (apr26.values[9] !== 1712) errors.push(`2025-26 Apr total amount: expected 1712, got ${apr26.values[9]}`);
  }

  // Row: FY 2025-26, Dec. — equity amount = 50,516 -> 50516
  const dec26 = out.rows.find(r => /2025-26/.test(r.year) && /^Dec/.test(r.month));
  if (!dec26) {
    errors.push('could not find 2025-26 Dec. row');
  } else {
    if (dec26.values[1] !== 50516) errors.push(`2025-26 Dec equity amount: expected 50516, got ${dec26.values[1]}`);
    // Public issue of bonds amount (col 7) = 580
    if (dec26.values[7] !== 580) errors.push(`2025-26 Dec bonds amount: expected 580, got ${dec26.values[7]}`);
  }

  // Row: FY 2024-25, Mar. — total amount (col 9) = 2494
  const mar25 = out.rows.find(r => /2024-25/.test(r.year) && /^Mar/.test(r.month));
  if (!mar25) {
    errors.push('could not find 2024-25 Mar. row');
  } else {
    if (mar25.values[9] !== 2494) errors.push(`2024-25 Mar total amount: expected 2494, got ${mar25.values[9]}`);
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('new-capital-issues self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'new-capital-issues.json'), JSON.stringify(out));

  const fy = [...new Set(out.rows.map(r => r.year))].join(', ');
  console.log(
    `wrote ${out.rows.length} rows across FYs [${fy}]; ` +
    `unit: ${out.unit}; self-check passed`,
  );
}

main();
