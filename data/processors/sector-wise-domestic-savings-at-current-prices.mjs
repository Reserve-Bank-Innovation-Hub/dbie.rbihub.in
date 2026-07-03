// Processor: sector-wise-domestic-savings-at-current-prices (annual)
//            — RBI Handbook of Statistics.
//
// Source xlsx carries two sheets: "Old Items" (base 2004-05) and "New Items" (base 2011-12).
// The target is "New Items" (index 1). Layout:
//   row 1   title: "Sector-Wise Domestic Savings (At Current Prices)"
//   row 3   base year label
//   row 5   unit: "(Rupees Crores)"
//   row 7   header: Year | 1 Gross Savings | 1.1 Non-financial corps | … | 1.4.2 Saving in physical assets
//   row 8   column numbers (1, 2, 3 …) — skipped
//   rows 9… data (col 1 = "YYYY-YY   ", values may carry decimal fractions)
//   trailing blank rows + notes
//
// Emits (newest-first):
//   out/sector-wise-domestic-savings-at-current-prices.json
//     { reportTitle, unit, baseYear, data: [{ year, gross_savings, … }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Sector-Wise Domestic Savings (At Current Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "9,259,186" or "-512,622.4198" -> number. Returns null for blank/dash.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function isYearRow(s) {
  return /^\d{4}-\d{2}/.test(s.trim());
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });

  // "New Items" sheet — base year 2011-12 (index 1).
  const sn = wb.SheetNames[1];
  if (!sn) throw new Error('expected at least 2 sheets');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  const reportTitle = 'Sector-wise domestic savings at current prices (base year 2011-12)';
  const unit = 'Rupees Crores';
  const baseYear = '2011-12';

  const data = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();

    // Skip the column-number row (col 1 is "1").
    if (c1 === '1') continue;

    if (!isYearRow(c1)) continue;

    data.push({
      year                               : c1.replace(/\s+$/, ''),
      gross_savings                      : parseNum(row[2]),
      non_financial_corporations         : parseNum(row[3]),
      public_non_financial_corporations  : parseNum(row[4]),
      private_non_financial_corporations : parseNum(row[7]),
      financial_corporations             : parseNum(row[8]),
      public_financial_corporations      : parseNum(row[9]),
      private_financial_corporations     : parseNum(row[12]),
      general_government                 : parseNum(row[13]),
      household_sector                   : parseNum(row[14]),
      gross_financial_saving             : parseNum(row[15]),
      less_financial_liabilities         : parseNum(row[16]),
      saving_in_physical_assets          : parseNum(row[17]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit, baseYear, data };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 10) {
    errors.push(`expected ≥10 year rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  // 2011-12 gross_savings = 3026837.
  const r2011 = data.find((r) => r.year === '2011-12');
  if (!r2011) {
    errors.push('known year missing: 2011-12');
  } else if (Math.round(r2011.gross_savings) !== 3026837) {
    errors.push(`2011-12 gross_savings: expected ~3026837, got ${r2011.gross_savings}`);
  }

  // 2023-24 gross_savings = 9259186.
  const r2023 = data.find((r) => r.year === '2023-24');
  if (!r2023) {
    errors.push('known year missing: 2023-24');
  } else if (Math.round(r2023.gross_savings) !== 9259186) {
    errors.push(`2023-24 gross_savings: expected 9259186, got ${r2023.gross_savings}`);
  }

  // 2021-22 household_sector = 4742333.
  const r2021 = data.find((r) => r.year === '2021-22');
  if (!r2021) {
    errors.push('known year missing: 2021-22');
  } else if (Math.round(r2021.household_sector) !== 4742333) {
    errors.push(`2021-22 household_sector: expected ~4742333, got ${r2021.household_sector}`);
  }

  // Years must be unique.
  const keys = data.map((r) => r.year);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first.
  for (let i = 1; i < data.length; i++) {
    const prev = parseInt(data[i - 1].year, 10);
    const curr = parseInt(data[i].year, 10);
    if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev <= curr) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].year} then ${data[i].year}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('sector-wise-domestic-savings self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'sector-wise-domestic-savings-at-current-prices.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
