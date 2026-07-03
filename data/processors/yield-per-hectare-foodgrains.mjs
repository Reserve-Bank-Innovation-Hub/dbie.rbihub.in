// Processor: yield-per-hectare-foodgrains (annual series) — RBI Handbook of Statistics on Indian Economy.
//
// Source xlsx carries one sheet "Agriculture Production - Foodgr" with annual yield
// data (kg/hectare) for foodgrain crops, newest-first from 2025-26 back to 1950-51.
// Layout:
//   row 1  title: "Yield Per Hectare - Foodgrains"
//   row 3  unit:  "Kg / Hectare"
//   row 5  header group 1: "Year | Cereals (Rice/Wheat/Coarse Cereals/Total) | Pulses"
//   row 6  header group 2: sub-column names under Cereals
//   row 7  column numbers (1-6)
//   rows 8… data (col 1 = "YYYY-YY", cols 2-6 = values)
//   trailing blank row + "Note …" / "Source …" footer
//
// Emits:
//   out/yield-per-hectare-foodgrains.json
//     { reportTitle, unit, columns, data: [{ year, rice, wheat, coarseCereals, totalCereals, pulses } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Yield Per Hectare - Foodgrains.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,234.56" → 1234.56. Returns null for blank/dash (genuine gap, not zero).
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2024-25   " → "2024-25" (trim, keep the compact YY suffix form as-is).
function normaliseYear(raw) {
  return String(raw == null ? '' : raw).trim();
}

// "2024-25" → 2024 (start year, used for ordering).
function startYear(y) {
  const m = y.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : NaN;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  const reportTitle = cellStr(rows[1] || [], 1).trim();
  const unit = cellStr(rows[3] || [], 1).trim() || 'Kg / Hectare';

  // Data rows start at index 8 (after title, blank, unit, blank, header×2, column-numbers).
  const data = [];
  for (let i = 8; i < rows.length; i++) {
    const row = rows[i] || [];
    const raw = cellStr(row, 1).trim();
    if (raw === '') continue;
    if (/^Note/i.test(raw) || /^Source/i.test(raw) || /^Also/i.test(raw)) continue;
    if (!/^\d{4}/.test(raw)) continue; // skip anything not starting with a 4-digit year

    data.push({
      year           : normaliseYear(raw),
      rice           : parseNum(row[2]),
      wheat          : parseNum(row[3]),
      coarseCereals  : parseNum(row[4]),
      totalCereals   : parseNum(row[5]),
      pulses         : parseNum(row[6]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle : reportTitle || 'Yield Per Hectare - Foodgrains',
    unit,
    columns     : {
      rice          : 'Rice',
      wheat         : 'Wheat',
      coarseCereals : 'Coarse cereals',
      totalCereals  : 'Total cereals',
      pulses        : 'Pulses',
    },
    data,
  };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 60) {
    errors.push(`expected ≥60 year rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    { year: '2025-26', field: 'rice',         expect: 2819  },
    { year: '2025-26', field: 'wheat',         expect: null  }, // "-" in source
    { year: '2024-25', field: 'totalCereals',  expect: 3023  },
    { year: '1950-51', field: 'pulses',        expect: 441   },
    { year: '1950-51', field: 'rice',          expect: 668   },
  ];
  for (const { year, field, expect } of known) {
    const row = data.find(r => r.year === year);
    if (!row) { errors.push(`known year missing: ${year}`); continue; }
    if (row[field] !== expect) {
      errors.push(`${year}.${field}: expected ${JSON.stringify(expect)}, got ${JSON.stringify(row[field])}`);
    }
  }

  // Years must be unique.
  const years = data.map(r => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) {
    errors.push(`years not unique: ${years.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending start year).
  for (let i = 1; i < data.length; i++) {
    const a = startYear(data[i - 1].year);
    const b = startYear(data[i].year);
    if (!isNaN(a) && !isNaN(b) && a <= b) {
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
    console.error('yield-per-hectare-foodgrains self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'yield-per-hectare-foodgrains.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
