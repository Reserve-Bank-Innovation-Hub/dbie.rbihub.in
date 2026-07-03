// Processor: financial-markets-turnover (weekly) — RBI Bulletin Table 30.
//
// Source xlsx carries one sheet ("Report 1") with average daily turnover
// (₹ Crores) in select financial markets, newest-first from "Jan 30, 2026"
// back to "Apr 4, 2008". Layout:
//   row 1   blank
//   row 2   title: "Average Daily Turnover in Select Financial Markets"
//   row 3   blank
//   row 4   unit: "(Rupees Crores)"
//   row 5   blank
//   row 6   two-level header, row 1: group labels (col 1 blank = "Week Ended")
//   row 7   two-level header, row 2: full column labels (col 1 = "Week Ended")
//   row 8   column numbers (1, 2, … 14)
//   rows 9… data ("Mon DD, YYYY", col values)
//   trailing blank row + Note footer
//
// Columns (0-indexed):
//   0  = (blank row index)
//   1  = "Week Ended" / period label
//   2  = 1. Call Money
//   3  = 2. Notice Money
//   4  = 3. Term Money
//   5  = 4. Triparty Repo
//   6  = 5. Market Repo
//   7  = 6. Repo in Corporate Bond
//   8  = 7. Forex (US $ million)
//   9  = 8. Govt. of India Dated Securities
//   10 = 9. State Govt. Securities
//   11 = 10.1  91-Day (Treasury Bills sub-column)
//   12 = 10.2  182-Day
//   13 = 10.3  364-Day
//   14 = 10.4  Cash Management Bills
//   15 = 11. Total Govt. Securities
//
// Emits (newest-first):
//   out/financial-markets-turnover.json
//     { reportTitle, unit, markets: [{key, label}], data: [{period, values:{<key>: number|null}} …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/financial-markets/table-30-average-daily-turnover-in-select-financial-markets.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Market column definitions in sheet order (col index → key/label).
// Treasury Bills are split into four sub-columns; we keep each as a separate market.
const MARKET_COLS = [
  { idx: 2,  key: 'call_money',              label: '1. Call Money' },
  { idx: 3,  key: 'notice_money',            label: '2. Notice Money' },
  { idx: 4,  key: 'term_money',              label: '3. Term Money' },
  { idx: 5,  key: 'triparty_repo',           label: '4. Triparty Repo' },
  { idx: 6,  key: 'market_repo',             label: '5. Market Repo' },
  { idx: 7,  key: 'repo_corporate_bond',     label: '6. Repo in Corporate Bond' },
  { idx: 8,  key: 'forex_usd_mn',            label: '7. Forex (US $ million)' },
  { idx: 9,  key: 'gsec_dated',              label: '8. Govt. of India Dated Securities' },
  { idx: 10, key: 'state_gsec',              label: '9. State Govt. Securities' },
  { idx: 11, key: 'tbill_91d',               label: '10.1 Treasury Bills — 91-Day' },
  { idx: 12, key: 'tbill_182d',              label: '10.2 Treasury Bills — 182-Day' },
  { idx: 13, key: 'tbill_364d',              label: '10.3 Treasury Bills — 364-Day' },
  { idx: 14, key: 'tbill_cmb',               label: '10.4 Treasury Bills — Cash Management Bills' },
  { idx: 15, key: 'total_gsec',              label: '11. Total Govt. Securities' },
];

// "182,645" -> 182645. Returns null for blank / dash / N/A so gaps are distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Jan 30, 2026" -> "2026-01-30" (sortable ISO key; used for ordering + uniqueness checks only).
function periodKey(label) {
  const m = label.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                   Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const month = MONTHS[m[1]];
  if (!month) return null;
  return `${m[3]}-${month}-${String(m[2]).padStart(2, '0')}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sn = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Locate the header row: contains "Week Ended" in col 1.
  let headerRow = -1;
  let reportTitle = '';
  let unit = 'Rupees Crores';

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i] || [];
    const c1 = String(row[1] == null ? '' : row[1]).trim();
    if (/Average Daily Turnover/i.test(c1)) reportTitle = c1;
    if (/Rupees Crores/i.test(c1))          unit        = c1.replace(/[()]/g, '').trim();
    if (/Week Ended/i.test(c1))             { headerRow  = i; break; }
  }

  if (headerRow < 0) throw new Error('could not find "Week Ended" header row');

  const data = [];
  // Data starts two rows after headerRow (row headerRow+1 has column numbers; data from headerRow+2).
  for (let i = headerRow + 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const period = String(row[1] == null ? '' : row[1]).trim();
    if (period === '') continue;
    if (/^Note:/i.test(period) || /^Source:/i.test(period)) continue;
    if (!periodKey(period)) continue; // skip anything that isn't a date data row

    const values = {};
    for (const { idx, key } of MARKET_COLS) {
      values[key] = parseNum(row[idx]);
    }
    data.push({ period, values });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle : reportTitle || 'Average Daily Turnover in Select Financial Markets',
    unit,
    markets     : MARKET_COLS.map(({ key, label }) => ({ key, label })),
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data, markets } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 900) {
    errors.push(`expected ≥900 period rows, got ${data ? data.length : 'n/a'}`);
  }

  if (!Array.isArray(markets) || markets.length !== 14) {
    errors.push(`expected 14 market columns, got ${markets ? markets.length : 'n/a'}`);
  }

  // Hard-coded cell assertions verified against the source sheet.
  const known = [
    { period: 'Jan 30, 2026', key: 'call_money',   expected: 28120.01    },
    { period: 'Jan 30, 2026', key: 'triparty_repo', expected: 1038585.15  },
    { period: 'Jan 30, 2026', key: 'total_gsec',   expected: 115800.1455 },
    { period: 'Dec 26, 2025', key: 'notice_money', expected: 553.864     },
    { period: 'Apr 4, 2008',  key: 'call_money',   expected: 15273.768   },
    { period: 'Apr 4, 2008',  key: 'gsec_dated',   expected: 9257.964205 },
  ];
  for (const { period, key, expected } of known) {
    const row = data.find((r) => r.period === period);
    if (!row) { errors.push(`known period missing: ${period}`); continue; }
    const got = row.values[key];
    // Use a small relative tolerance to absorb floating-point noise.
    if (got == null || Math.abs(got - expected) > Math.abs(expected) * 1e-6 + 1e-9) {
      errors.push(`${period} ${key}: expected ${expected}, got ${got}`);
    }
  }

  // Periods must be unique.
  const keys = data.map((r) => periodKey(r.period));
  if (keys.some((k) => k == null)) errors.push('some periods did not parse to a sortable key');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`periods not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending ISO date keys).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].period} then ${data[i].period}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('financial-markets-turnover self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'financial-markets-turnover.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} period rows ` +
    `(newest ${out.data[0].period}, oldest ${out.data[out.data.length - 1].period}; ` +
    `${out.markets.length} market columns); self-check passed`,
  );
}

main();
