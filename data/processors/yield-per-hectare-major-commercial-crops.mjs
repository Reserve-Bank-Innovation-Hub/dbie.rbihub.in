// Processor: yield-per-hectare-major-commercial-crops (annual series) — RBI Handbook of Statistics.
//
// Source xlsx carries one sheet "Report 1" with annual yield data (kg/hectare, except
// sugarcane in kg/hectare) for major commercial crops, newest-first from 2025-26 to 1950-51.
// Layout:
//   row 1  title: "Yield Per Hectare - Major Commercial Crops"
//   row 3  unit:  "Kg / Hectare"
//   row 5  header group 1: oilseeds sub-group + Sugarcane/Tea/Coffee/Cotton(Lint)/Raw Jute & Mesta/Tobacco
//   row 6  header group 2: Oilseeds sub-columns (Groundnut/Rapeseed & Mustard/Soyabean/Total)
//   row 7  column numbers (1-11)
//   rows 8… data (col 1 = "YYYY-YY", cols 2-11 = values)
//   trailing blank row + "Note …" / "Source …" footer
//
// Column mapping (0-based within the sheet row):
//   col 1 = Year
//   col 2 = Groundnut
//   col 3 = Rapeseed & Mustard
//   col 4 = Soyabean
//   col 5 = Total Oilseeds
//   col 6 = Sugarcane
//   col 7 = Tea
//   col 8 = Coffee
//   col 9 = Cotton (Lint)
//   col 10 = Raw Jute & Mesta
//   col 11 = Tobacco
//
// Emits:
//   out/yield-per-hectare-major-commercial-crops.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Yield Per Hectare - Major Commercial Crops.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function normaliseYear(raw) {
  return String(raw == null ? '' : raw).trim();
}

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

  const data = [];
  for (let i = 8; i < rows.length; i++) {
    const row = rows[i] || [];
    const raw = cellStr(row, 1).trim();
    if (raw === '') continue;
    if (/^Note/i.test(raw) || /^Source/i.test(raw) || /^Also/i.test(raw)) continue;
    if (!/^\d{4}/.test(raw)) continue;

    data.push({
      year             : normaliseYear(raw),
      groundnut        : parseNum(row[2]),
      rapeseedMustard  : parseNum(row[3]),
      soyabean         : parseNum(row[4]),
      totalOilseeds    : parseNum(row[5]),
      sugarcane        : parseNum(row[6]),
      tea              : parseNum(row[7]),
      coffee           : parseNum(row[8]),
      cottonLint       : parseNum(row[9]),
      rawJuteMesta     : parseNum(row[10]),
      tobacco          : parseNum(row[11]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle : reportTitle || 'Yield Per Hectare - Major Commercial Crops',
    unit,
    columns     : {
      groundnut       : 'Groundnut',
      rapeseedMustard : 'Rapeseed & mustard',
      soyabean        : 'Soyabean',
      totalOilseeds   : 'Total oilseeds',
      sugarcane       : 'Sugarcane',
      tea             : 'Tea',
      coffee          : 'Coffee',
      cottonLint      : 'Cotton (lint)',
      rawJuteMesta    : 'Raw jute & mesta',
      tobacco         : 'Tobacco',
    },
    data,
  };
}

function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 60) {
    errors.push(`expected ≥60 year rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    { year: '2025-26', field: 'groundnut',    expect: 2350  },
    { year: '2025-26', field: 'soyabean',     expect: 1155  },
    { year: '2024-25', field: 'sugarcane',    expect: 83416 },
    { year: '2024-25', field: 'cottonLint',   expect: 440   },
    { year: '1950-51', field: 'sugarcane',    expect: 33422 },
    { year: '1950-51', field: 'groundnut',    expect: 775   },
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

  // Ordered newest-first.
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
    console.error('yield-per-hectare-major-commercial-crops self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'yield-per-hectare-major-commercial-crops.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
