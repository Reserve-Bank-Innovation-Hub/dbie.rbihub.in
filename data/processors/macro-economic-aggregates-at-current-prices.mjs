// Processor: macro-economic-aggregates-at-current-prices (annual) — RBI Handbook of Statistics.
//
// Source xlsx carries four sheets; the target is the "Base Year 2011-12" sheet (index 2),
// which excludes the HBS-format variant. Layout:
//   row 1   title: "MACRO-ECONOMIC AGGREGATES (At Current Prices)"
//   row 3   base year label
//   row 5   unit: "Rupees Crores"
//   row 7   header: Year | Population | GVA at Basic Prices | Net taxes | GDP | ...
//   row 8   column numbers (1, 2, 3 …) — skipped
//   rows 9… data (col 1 = "YYYY-YY   ", cols 2+ = values or "-")
//   trailing blank rows + notes + source footer
//
// Emits (newest-first):
//   out/macro-economic-aggregates-at-current-prices.json
//     { reportTitle, unit, baseYear, data: [{ year, population_lakhs, gross_domestic_product, … }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Macro-Economic Aggregates (Base Year_ 2011-12 At Current Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "30,122,956" or "-412,170" -> number. Returns null for blank/dash/non-numeric.
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

  // Target the 2011-12 base year sheet that is NOT the HBS format variant (index 2).
  const sn = wb.SheetNames[2];
  if (!sn) throw new Error('expected at least 3 sheets');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  const reportTitle = 'Macro-economic aggregates at current prices (base year 2011-12)';
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
      year                              : c1.replace(/\s+$/, ''),
      population_lakhs                  : parseNum(row[2]),
      gva_at_basic_prices               : parseNum(row[3]),
      net_taxes_on_products             : parseNum(row[4]),
      gross_domestic_product            : parseNum(row[5]),
      consumption_of_fixed_capital      : parseNum(row[6]),
      net_domestic_product              : parseNum(row[7]),
      primary_income_from_row_net       : parseNum(row[8]),
      gross_national_income             : parseNum(row[9]),
      net_national_income               : parseNum(row[10]),
      gross_national_disposable_income  : parseNum(row[12]),
      gross_saving                      : parseNum(row[14]),
      gross_capital_formation           : parseNum(row[16]),
      net_capital_formation             : parseNum(row[17]),
      per_capita_gdp                    : parseNum(row[18]),
      per_capita_gni                    : parseNum(row[19]),
      per_capita_nni                    : parseNum(row[20]),
      per_capita_pfce                   : parseNum(row[22]),
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
  const knownGdp = {
    '2011-12' : 8736329,
    '2023-24' : 30122956,
    '2025-26' : 35713886,
  };
  for (const [yr, exp] of Object.entries(knownGdp)) {
    const row = data.find((r) => r.year === yr);
    if (!row) { errors.push(`known year missing: ${yr}`); continue; }
    if (row.gross_domestic_product !== exp) {
      errors.push(`${yr} GDP: expected ${exp}, got ${row.gross_domestic_product}`);
    }
  }

  // 2018-19 GNI assertion (col[9]).
  const r2018 = data.find((r) => r.year === '2018-19');
  if (!r2018) {
    errors.push('known year missing: 2018-19');
  } else if (r2018.gross_national_income !== 18697344) {
    errors.push(`2018-19 GNI: expected 18697344, got ${r2018.gross_national_income}`);
  }

  // Years must be unique.
  const keys = data.map((r) => r.year);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending by first four digits).
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
    console.error('macro-economic-aggregates-at-current-prices self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'macro-economic-aggregates-at-current-prices.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
