// Processor: macro-economic-aggregates-at-constant-prices (annual) — RBI Handbook of Statistics.
//
// Source xlsx carries four sheets; the target is the "Base Year 2011-12" sheet (index 2),
// which excludes the HBS-format variant. Layout:
//   row 1   title: "MACRO-ECONOMIC AGGREGATES (At Constant Prices)"
//   row 3   base year label
//   row 5   unit: "Rupees Crores"
//   row 7   header: Year | GVA at Basic Prices | Net taxes on products | GDP | ...
//   row 8   column numbers (1, 2, 3 …) — skipped
//   rows 9… data (col 1 = "YYYY-YY   ", cols 2+ = values or "-")
//   trailing blank rows + notes + source footer
//
// Emits (newest-first):
//   out/macro-economic-aggregates-at-constant-prices.json
//     { reportTitle, unit, baseYear, data: [{ year, gva_at_basic_prices, … }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Macro-Economic Aggregates (Base Year_ 2011-12 At Constant Prices).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "18,449,828" or "-245,953" -> number. Returns null for blank/dash/non-numeric.
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

  let reportTitle = 'Macro-economic aggregates at constant prices (base year 2011-12)';
  let unit = 'Rupees Crores';
  let baseYear = '2011-12';

  const data = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();

    // Capture title from row 1.
    if (i === 1 && c1) reportTitle = c1.charAt(0).toUpperCase() + c1.slice(1).toLowerCase()
      .replace('macro-economic aggregates (at constant prices)',
        'Macro-economic aggregates at constant prices (base year 2011-12)');

    // Skip the column-number row (col 1 is "1").
    if (c1 === '1') continue;

    if (!isYearRow(c1)) continue;

    data.push({
      year                         : c1.replace(/\s+$/, ''),
      gva_at_basic_prices          : parseNum(row[2]),
      net_taxes_on_products        : parseNum(row[3]),
      gross_domestic_product       : parseNum(row[4]),
      consumption_of_fixed_capital : parseNum(row[5]),
      net_domestic_product         : parseNum(row[6]),
      primary_income_from_row_net  : parseNum(row[7]),
      gross_national_income        : parseNum(row[8]),
      net_national_income          : parseNum(row[9]),
      gross_capital_formation      : parseNum(row[10]),
      net_capital_formation        : parseNum(row[11]),
      per_capita_gdp               : parseNum(row[12]),
      per_capita_gni               : parseNum(row[13]),
      per_capita_nni               : parseNum(row[14]),
      per_capita_pfce              : parseNum(row[15]),
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
    '2023-24' : 17650591,
    '2025-26' : 20189919,
  };
  for (const [yr, exp] of Object.entries(knownGdp)) {
    const row = data.find((r) => r.year === yr);
    if (!row) { errors.push(`known year missing: ${yr}`); continue; }
    if (row.gross_domestic_product !== exp) {
      errors.push(`${yr} GDP: expected ${exp}, got ${row.gross_domestic_product}`);
    }
  }

  // 2015-16 GNI assertion (col[8]).
  const r2015 = data.find((r) => r.year === '2015-16');
  if (!r2015) {
    errors.push('known year missing: 2015-16');
  } else if (r2015.gross_national_income !== 11234571) {
    errors.push(`2015-16 GNI: expected 11234571, got ${r2015.gross_national_income}`);
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
    console.error('macro-economic-aggregates-at-constant-prices self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'macro-economic-aggregates-at-constant-prices.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
