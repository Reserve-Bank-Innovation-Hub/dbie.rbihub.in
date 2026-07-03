// Processor: select-economic-indicators — Monthly RBI Bulletin Table 1.
//
// Source xlsx carries one sheet ("Monthly") with select economic indicators
// from Jan 2026 (newest) back to Dec 2010 (oldest). Layout:
//   row 2  title "Select Economic Indicators (Monthly)"
//   row 4  7 top-group headers across cols 2–41
//   row 5  main column headers (40 series)
//   row 6  sub-headers for SCB / money-stock / forward-premia columns
//   row 7  year marker "2026" (col 1); subsequent rows alternate
//          between year markers (4-digit year, rest null) and month rows
//   rows 8…205 data (newest-first, year markers interspersed)
//   row 206  blank
//   row 207  "Notes :" row with a long multi-line note string (col 2)
//
// Column mapping (0-indexed within each row array):
//   col[1]  = date label (year marker or month abbreviation)
//   col[2]  = iip                      (IIP % change)
//   col[3]  = scb_deposits             (SCB deposits % change)
//   col[4]  = scb_credit               (SCB credit % change)
//   col[5]  = scb_nonfood_credit       (SCB non-food credit % change)
//   col[6]  = scb_invest_gsec          (SCB investment in G-secs % change)
//   col[7]  = m0                       (Reserve Money % change)
//   col[8]  = m3                       (Broad Money % change)
//   col[9]  = crr                      (Cash Reserve Ratio %)
//   col[10] = slr                      (Statutory Liquidity Ratio %)
//   col[11] = cash_deposit_ratio
//   col[12] = credit_deposit_ratio
//   col[13] = incr_credit_deposit_ratio
//   col[14] = invest_deposit_ratio
//   col[15] = incr_invest_deposit_ratio
//   col[16] = policy_repo_rate
//   col[17] = reverse_repo_rate
//   col[18] = sdf_rate
//   col[19] = msf_rate
//   col[20] = bank_rate
//   col[21] = base_rate                (range string e.g. "8.35/10.00")
//   col[22] = mclr_overnight           (range string e.g. "7.70/7.95")
//   col[23] = term_deposit_rate        (range string e.g. "6.00/6.50")
//   col[24] = savings_deposit_rate     (range or number)
//   col[25] = call_money_rate
//   col[26] = tbill_91d
//   col[27] = tbill_182d
//   col[28] = tbill_364d
//   col[29] = gsec_10y
//   col[30] = inr_usd
//   col[31] = inr_eur
//   col[32] = fwd_premia_1m
//   col[33] = fwd_premia_3m
//   col[34] = fwd_premia_6m
//   col[35] = cpi_inflation
//   col[36] = cpi_iw_inflation
//   col[37] = wpi_inflation
//   col[38] = wpi_primary
//   col[39] = wpi_fuel
//   col[40] = wpi_mfg
//   col[41] = imports_growth
//
// Values are number | string | null:
//   - Clean numeric string → number
//   - "..", "-", "-/-" or blank → null
//   - Range string "8.35/10.00" → kept as string
//
// Emits (newest-first):
//   out/select-economic-indicators.json
//     { reportTitle, notes, data: [{ month, iip, scb_deposits, … }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/rbi/table-01-select-economic-indicators.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// ---- helpers -------------------------------------------------------------------------

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// Parse a cell value:
//   numeric string         → number
//   ".." | "-" | "-/-"    → null
//   empty / whitespace     → null
//   anything else non-empty → string (e.g. range "8.35/10.00")
function parseCell(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '' || s === '..' || s === '-' || s === '-/-') return null;
  // Strip trailing comma-thousands and attempt numeric parse.
  const clean = s.replace(/,/g, '');
  const n = Number(clean);
  if (Number.isFinite(n)) return n;
  // Keep as string (ranges, etc.)
  return s;
}

// Year-marker rows: col[1] is a 4-digit year string, all other cells null.
function isYearMarker(row) {
  return /^\d{4}$/.test(cellStr(row, 1));
}

// Month rows: col[1] is a 3-letter month abbreviation.
const MONTH_ABBREVS = new Set([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]);
function isMonthRow(row) {
  return MONTH_ABBREVS.has(cellStr(row, 1));
}

// ---- column field names (in col-index order, starting at col[2]) --------------------
const FIELD_NAMES = [
  'iip',                        // col[2]
  'scb_deposits',               // col[3]
  'scb_credit',                 // col[4]
  'scb_nonfood_credit',         // col[5]
  'scb_invest_gsec',            // col[6]
  'm0',                         // col[7]
  'm3',                         // col[8]
  'crr',                        // col[9]
  'slr',                        // col[10]
  'cash_deposit_ratio',         // col[11]
  'credit_deposit_ratio',       // col[12]
  'incr_credit_deposit_ratio',  // col[13]
  'invest_deposit_ratio',       // col[14]
  'incr_invest_deposit_ratio',  // col[15]
  'policy_repo_rate',           // col[16]
  'reverse_repo_rate',          // col[17]
  'sdf_rate',                   // col[18]
  'msf_rate',                   // col[19]
  'bank_rate',                  // col[20]
  'base_rate',                  // col[21]
  'mclr_overnight',             // col[22]
  'term_deposit_rate',          // col[23]
  'savings_deposit_rate',       // col[24]
  'call_money_rate',            // col[25]
  'tbill_91d',                  // col[26]
  'tbill_182d',                 // col[27]
  'tbill_364d',                 // col[28]
  'gsec_10y',                   // col[29]
  'inr_usd',                    // col[30]
  'inr_eur',                    // col[31]
  'fwd_premia_1m',              // col[32]
  'fwd_premia_3m',              // col[33]
  'fwd_premia_6m',              // col[34]
  'cpi_inflation',              // col[35]
  'cpi_iw_inflation',           // col[36]
  'wpi_inflation',              // col[37]
  'wpi_primary',                // col[38]
  'wpi_fuel',                   // col[39]
  'wpi_mfg',                    // col[40]
  'imports_growth',             // col[41]
];

// ---- parser --------------------------------------------------------------------------

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sheetName = wb.SheetNames[0]; // "Monthly"
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // ---- title (row 2, col 1) ----------------------------------------------------------
  const reportTitle = cellStr(rows[1] || [], 1) || 'Select Economic Indicators';

  // ---- notes (last non-blank row, col 2) ---------------------------------------------
  let notes = '';
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i] || [];
    const label = cellStr(row, 1);
    if (/^Notes\s*:/i.test(label)) {
      notes = cellStr(row, 2);
      break;
    }
  }

  // ---- data rows (year-marker + month rows) -------------------------------------------
  const data = [];
  let currentYear = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    if (isYearMarker(row)) {
      currentYear = cellStr(row, 1);
      continue;
    }
    if (!isMonthRow(row) || !currentYear) continue;

    const month   = cellStr(row, 1);
    const record  = { month : `${month} ${currentYear}` };

    FIELD_NAMES.forEach((field, fi) => {
      record[field] = parseCell(row[fi + 2]); // col[2] is FIELD_NAMES[0]
    });

    data.push(record);
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, notes, data };
}

// ---- self-check ----------------------------------------------------------------------

function selfCheck(out) {
  const { data } = out;
  const errors   = [];

  // Minimum row count.
  if (!Array.isArray(data) || data.length < 170) {
    errors.push(`expected ≥170 month rows, got ${data ? data.length : 'n/a'}`);
  }

  // Months must be unique.
  const months = data.map((r) => r.month);
  const uniq   = new Set(months);
  if (uniq.size !== months.length) {
    errors.push(`months not unique: ${months.length} rows, ${uniq.size} distinct`);
  }

  // Jan 2026 anchor — first row (newest).
  const jan2026 = data.find((r) => r.month === 'Jan 2026');
  if (!jan2026) {
    errors.push('Jan 2026 row missing');
  } else {
    const checks = [
      [ 'iip',              4.83,         0.01 ],
      [ 'crr',              3.00,         0.01 ],
      [ 'slr',              18.00,        0.01 ],
      [ 'policy_repo_rate', 5.25,         0.01 ],
      [ 'inr_usd',          91.90,        0.01 ],
      [ 'wpi_fuel',         -4.01,        0.01 ],
    ];
    for (const [ field, expected, tol ] of checks) {
      const got = jan2026[field];
      if (typeof got !== 'number' || Math.abs(got - expected) > tol) {
        errors.push(`Jan 2026 ${field}: expected ${expected}, got ${JSON.stringify(got)}`);
      }
    }
    // base_rate should be a range string
    if (jan2026.base_rate !== '8.35/10.00') {
      errors.push(`Jan 2026 base_rate: expected "8.35/10.00", got ${JSON.stringify(jan2026.base_rate)}`);
    }
  }

  // Dec 2010 anchor — last row (oldest).
  const dec2010 = data.find((r) => r.month === 'Dec 2010');
  if (!dec2010) {
    errors.push('Dec 2010 row missing');
  } else {
    const checks = [
      [ 'iip',    8.10,  0.01 ],
      [ 'm3',     18.68, 0.01 ],
      [ 'inr_eur', 45.70, 0.01 ],
    ];
    for (const [ field, expected, tol ] of checks) {
      const got = dec2010[field];
      if (typeof got !== 'number' || Math.abs(got - expected) > tol) {
        errors.push(`Dec 2010 ${field}: expected ${expected}, got ${JSON.stringify(got)}`);
      }
    }
  }

  return errors;
}

// ---- main ----------------------------------------------------------------------------

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('select-economic-indicators self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'select-economic-indicators.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} monthly rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}); ` +
    `self-check passed`,
  );
}

main();
