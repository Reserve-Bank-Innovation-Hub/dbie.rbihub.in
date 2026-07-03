// Processor: components-of-gross-value-added-at-basic-prices (annual) — HSIE National Income.
//
// Source xlsx sheet "GDP GVA": absolute values in Rupees Crore, newest-first from
// "2025-26" back to "1951-52". Layout:
//   row 1  title
//   row 4  "Base Year: 2011-12"
//   row 6  "(Rupees Crore)"
//   row 8  header — Year, then 20 column pairs (Const + Curr), then a final GDP col
//   row 9  sub-header alternating "Constant Prices"/"Current Prices"
//   row 10 column numbers
//   rows 11–234 data (newest-first)
//   row 235+ notes + source
//
// Col index → field mapping (indices 2–40):
//   2=agri_const, 3=agri_curr
//   4=industry_const, 5=industry_curr
//   6=mining_quarrying_const, 7=mining_quarrying_curr
//   8=manufacturing_const, 9=manufacturing_curr
//   10=electricity_gas_water_const, 11=electricity_gas_water_curr
//   12=services_const, 13=services_curr
//   14=construction_const, 15=construction_curr
//   16=trade_hotels_transport_const, 17=trade_hotels_transport_curr
//   18=financial_realestate_const, 19=financial_realestate_curr
//   20=public_admin_defence_const, 21=public_admin_defence_curr
//   22=gva_const, 23=gva_curr
//   24=pfce_const, 25=pfce_curr
//   26=gfce_const, 27=gfce_curr
//   28=gfcf_const, 29=gfcf_curr
//   30=changes_in_stocks_const, 31=changes_in_stocks_curr
//   32=valuables_const, 33=valuables_curr
//   34=exports_const, 35=exports_curr
//   36=imports_const, 37=imports_curr
//   38=discrepancies_const, 39=discrepancies_curr
//   40=gdp_const
//
// Emits:
//   out/components-of-gross-value-added-at-basic-prices.json
//     { reportTitle, baseYear, unit, data: [{ year, agri_const, agri_curr, ... } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Components of Gross Value Added At Basic Prices.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Field names for indices 2–40
const FIELD_MAP = {
  2  : 'agri_const',
  3  : 'agri_curr',
  4  : 'industry_const',
  5  : 'industry_curr',
  6  : 'mining_quarrying_const',
  7  : 'mining_quarrying_curr',
  8  : 'manufacturing_const',
  9  : 'manufacturing_curr',
  10 : 'electricity_gas_water_const',
  11 : 'electricity_gas_water_curr',
  12 : 'services_const',
  13 : 'services_curr',
  14 : 'construction_const',
  15 : 'construction_curr',
  16 : 'trade_hotels_transport_const',
  17 : 'trade_hotels_transport_curr',
  18 : 'financial_realestate_const',
  19 : 'financial_realestate_curr',
  20 : 'public_admin_defence_const',
  21 : 'public_admin_defence_curr',
  22 : 'gva_const',
  23 : 'gva_curr',
  24 : 'pfce_const',
  25 : 'pfce_curr',
  26 : 'gfce_const',
  27 : 'gfce_curr',
  28 : 'gfcf_const',
  29 : 'gfcf_curr',
  30 : 'changes_in_stocks_const',
  31 : 'changes_in_stocks_curr',
  32 : 'valuables_const',
  33 : 'valuables_curr',
  34 : 'exports_const',
  35 : 'exports_curr',
  36 : 'imports_const',
  37 : 'imports_curr',
  38 : 'discrepancies_const',
  39 : 'discrepancies_curr',
  40 : 'gdp_const',
};

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456.78" -> 123456.78. Returns null for blank/dash/em-dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '–' || s === '—' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2025-26" is a valid year label. Returns true if the string looks like a fiscal year.
function isFiscalYear(s) {
  return /^\d{4}-\d{2,4}$/.test(s.trim());
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Use the first sheet (sheet name contains special chars)
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows : true,
  });

  let reportTitle = 'Components of Gross Value Added at Basic Prices';
  let baseYear    = '2011-12';
  let unit        = 'Rupees Crore';
  let headerRow   = -1;

  // Scan first 15 rows for metadata
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];

    // Title row
    const c1 = cellStr(row, 1).trim();
    if (/Gross Value Added/i.test(c1) && !/Year/i.test(c1)) {
      reportTitle = c1;
    }

    // Base year
    const rowText = row.map(c => cellStr({0: c}, 0)).join(' ');
    const byMatch = rowText.match(/Base Year\s*[:\-]?\s*(\d{4}-\d{2,4})/i);
    if (byMatch) baseYear = byMatch[1];

    // Unit
    const unitMatch = rowText.match(/Rupees Crore/i);
    if (unitMatch) unit = 'Rupees Crore';

    // Header row: col[1] contains "Year" with many surrounding cols
    if (/^Year\s*$/.test(c1) && row.length > 10) {
      headerRow = i;
      break;
    }
    // Also accept "Year / Items" variant
    if (/Year\s*\/\s*Items/i.test(c1)) {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0) {
    // Fallback: look for row where col[1] has "Year" and many non-null cells
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();
      const nonNull = row.filter(c => c != null).length;
      if (/Year/i.test(c1) && nonNull >= 10) {
        headerRow = i;
        break;
      }
    }
  }

  if (headerRow < 0) throw new Error('could not locate the Year header row in sheet');

  const data = [];
  // Data starts after header row; skip sub-header rows (row 9 = "Constant Prices", row 10 = column numbers).
  // Stop when we encounter a second "Base Year" or "Year / Items" header — those mark supplementary blocks
  // (older base-year series) which repeat the same fiscal years with different values.
  let foundFirstDataRow = false;
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const yearRaw = cellStr(row, 1).trim();
    if (yearRaw === '') continue;

    // Stop at Source/Note footers
    if (/^Source:/i.test(yearRaw) || /^Note/i.test(yearRaw)) break;

    // If we've already collected at least one data row and we see a new "Base Year" or "Year / Items"
    // header, that marks the start of a supplementary block — stop here.
    if (foundFirstDataRow && (/^Base Year/i.test(yearRaw) || /Year\s*\/\s*Items/i.test(yearRaw))) break;

    if (!isFiscalYear(yearRaw)) continue; // skip sub-headers like "Constant Prices", column numbers, etc.

    const entry = { year: yearRaw };
    for (const [idxStr, field] of Object.entries(FIELD_MAP)) {
      const idx = Number(idxStr);
      entry[field] = parseNum(row[idx]);
    }
    data.push(entry);
    foundFirstDataRow = true;
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return { reportTitle, baseYear, unit, data };
}

// --- self-check ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 50) {
    errors.push(`expected ≥50 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known row: 2025-26
  const row2526 = data.find(r => r.year === '2025-26');
  if (!row2526) {
    errors.push('known year missing: 2025-26');
  } else {
    if (Math.round(row2526.agri_const) !== 2554071) {
      errors.push(`2025-26 agri_const: expected ~2554071, got ${row2526.agri_const}`);
    }
    if (Math.round(row2526.gdp_const) !== 20189919) {
      errors.push(`2025-26 gdp_const: expected ~20189919, got ${row2526.gdp_const}`);
    }
    if (Math.round(row2526.gva_const) !== 18449828) {
      errors.push(`2025-26 gva_const: expected ~18449828, got ${row2526.gva_const}`);
    }
  }

  // Known row: 1951-52 should exist and have a numeric agri_const
  const row5152 = data.find(r => r.year === '1951-52');
  if (!row5152) {
    errors.push('known year missing: 1951-52');
  } else if (typeof row5152.agri_const !== 'number' && row5152.agri_const !== null) {
    errors.push(`1951-52 agri_const is not a number: ${row5152.agri_const}`);
  }

  // Years must be unique
  const years = data.map(r => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) {
    errors.push(`years not unique: ${years.length} rows, ${uniq.size} distinct`);
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('components-of-gross-value-added-at-basic-prices self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'components-of-gross-value-added-at-basic-prices.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}; ` +
    `base year ${out.baseYear}, unit: ${out.unit}); self-check passed`,
  );
}

main();
