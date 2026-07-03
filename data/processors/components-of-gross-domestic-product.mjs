// Processor: components-of-gross-domestic-product (annual) — RBI Handbook Table.
//
// Source xlsx carries two sheets:
//   "GDP Componets (at Market Price)" — absolute values in Rupees Crores (used)
//   "GDP Componets (at Market "       — growth rates (%) — skipped
//
// Layout of sheet 1:
//   row 0  blank
//   row 1  title "Components of Gross Domestic Product"
//   row 4  "Base Year:2011-12"
//   row 6  "(Rupees Crores)"
//   row 8  top header: Year | PFCE | GFCE | GFCF | Changes in Stocks | Valuables |
//                      Exports | Imports | Discrepancies | GDP
//   row 9  sub-header: alternating "Constant Prices" / "Current Prices" for cols 2–17,
//                      then "Constant Prices" for col 18 (GDP)
//   row 10 column numbers "1"–"17"
//   rows 11–223 data, newest-first (2025-26 → 1950-51)
//   row 225 Notes + Source
//
// Column mapping (0-based):
//   1 = Year, 2 = pfce_const, 3 = pfce_curr, 4 = gfce_const, 5 = gfce_curr,
//   6 = gfcf_const, 7 = gfcf_curr, 8 = changes_in_stocks_const, 9 = changes_in_stocks_curr,
//   10 = valuables_const, 11 = valuables_curr, 12 = exports_const, 13 = exports_curr,
//   14 = imports_const, 15 = imports_curr, 16 = discrepancies_const, 17 = discrepancies_curr,
//   18 = gdp_const
//
// Emits:
//   out/components-of-gross-domestic-product.json
//     { reportTitle, baseYear, unit, data: [{ year, pfce_const, pfce_curr, … gdp_const }…] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Components of Gross Domestic Product.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "11,367,565" -> 11367565. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2025-26   " -> 2025 (sort key, first 4 digits). Returns null if not a fiscal-year label.
function yearSortKey(label) {
  const m = label.trim().match(/^(\d{4})-\d{2}$/);
  return m ? parseInt(m[1], 10) : null;
}

const TARGET_SHEET = 'GDP Componets (at Market Price)';

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Prefer the named sheet; fall back to first sheet.
  const sheetName = wb.SheetNames.includes(TARGET_SHEET) ? TARGET_SHEET : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header  : 1,
    raw     : false,
    defval  : null,
    blankrows: true,
  });

  let reportTitle = '';
  let baseYear    = '';
  let dataStartRow = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];
    const c1  = cellStr(row, 1).trim();

    // Row 1 (0-based): title
    if (i === 1 && c1) {
      reportTitle = c1;
    }

    // Row 4: "Base Year:2011-12" (col 1 or col 0)
    const c0 = cellStr(row, 0).trim();
    const baseYearCell = c1.includes('Base Year') ? c1 : (c0.includes('Base Year') ? c0 : '');
    if (baseYearCell) {
      const m = baseYearCell.match(/(\d{4}-\d{2})/);
      if (m) baseYear = m[1];
    }

    // Column-number row "1","2",…,"17" immediately precedes the data rows.
    // The "1" appears at col index 2 (col 1 = Year is blank in this row).
    const c2 = cellStr(row, 2).trim();
    if (c2 === '1' && cellStr(row, 3).trim() === '2') {
      dataStartRow = i + 1;
      break;
    }
  }

  if (dataStartRow < 0) throw new Error('could not locate the column-number header row');

  const data = [];
  for (let i = dataStartRow; i < rows.length; i++) {
    const row  = rows[i] || [];
    const year = cellStr(row, 1).trim();
    if (year === '') continue;
    // Stop at the next "Base Year:..." section (a second base-year series in the same sheet)
    if (/^Base Year/i.test(year)) break;
    if (/^Note/i.test(year) || /^Source/i.test(year)) continue;
    if (yearSortKey(year) === null) continue; // skip anything that isn't "YYYY-YY"

    data.push({
      year,
      pfce_const              : parseNum(row[2]),
      pfce_curr               : parseNum(row[3]),
      gfce_const              : parseNum(row[4]),
      gfce_curr               : parseNum(row[5]),
      gfcf_const              : parseNum(row[6]),
      gfcf_curr               : parseNum(row[7]),
      changes_in_stocks_const : parseNum(row[8]),
      changes_in_stocks_curr  : parseNum(row[9]),
      valuables_const         : parseNum(row[10]),
      valuables_curr          : parseNum(row[11]),
      exports_const           : parseNum(row[12]),
      exports_curr            : parseNum(row[13]),
      imports_const           : parseNum(row[14]),
      imports_curr            : parseNum(row[15]),
      discrepancies_const     : parseNum(row[16]),
      discrepancies_curr      : parseNum(row[17]),
      gdp_const               : parseNum(row[18]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return {
    reportTitle : reportTitle || 'Components of Gross Domestic Product',
    baseYear    : baseYear    || '2011-12',
    unit        : 'Rupees Crores',
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 70) {
    errors.push(`expected ≥70 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Hard-coded cell assertions (verified against the source sheet, 2011-12 base-year series only).
  const known = [
    {
      year        : '2025-26',
      pfce_const  : 11367565,
      gdp_const   : 20189919,
    },
    {
      year        : '1950-51',
      pfce_const  : 412309,
      gdp_const   : 496848,
    },
    {
      year        : '2000-01',
      pfce_const  : 2658841,
    },
  ];

  for (const exp of known) {
    const row = data.find((r) => r.year === exp.year);
    if (!row) { errors.push(`known year missing: ${exp.year}`); continue; }
    for (const [field, val] of Object.entries(exp)) {
      if (field === 'year') continue;
      if (val == null) continue;
      if (Math.abs((row[field] ?? NaN) - val) > 0.5) {
        errors.push(`${exp.year} ${field}: expected ${val}, got ${row[field]}`);
      }
    }
  }

  // Years must be unique.
  const keys = data.map((r) => r.year);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending by the 4-digit start year).
  for (let i = 1; i < keys.length; i++) {
    const prev = yearSortKey(keys[i - 1]);
    const curr = yearSortKey(keys[i]);
    if (prev !== null && curr !== null && prev <= curr) {
      errors.push(`not strictly newest-first at row ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('components-of-gross-domestic-product self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'components-of-gross-domestic-product.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); self-check passed`,
  );
}

main();
