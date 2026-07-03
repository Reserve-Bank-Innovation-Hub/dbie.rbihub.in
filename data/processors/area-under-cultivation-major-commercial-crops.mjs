// Processor: area-under-cultivation-major-commercial-crops — RBI Handbook annual series.
//
// Source xlsx carries one sheet with annual area under cultivation figures for major
// commercial crops in India, newest-first from 2025-26 back to 1950-51. Layout:
//   row 1  blank
//   row 2  title: "Area Under Cultivation - Major Commercial Crops"
//   row 3  blank
//   row 4  units: "( Lakhs Hectares )"
//   row 5  blank
//   row 6  header row 1: Year | Oilseeds (Groundnut, Rapeseed & Mustard, Soyabean, Total) | Sugarcane | Tea | Coffee | Cotton | Jute | Tobacco
//   row 7  header row 2: sub-columns
//   row 8  col number row: 1, 2, 3 … 11
//   rows 9… data
//   trailing blank + Note/Source footer
//
// Columns (1-indexed in raw array, offset by 1 for leading null col 0):
//   col[1]  = year
//   col[2]  = groundnut
//   col[3]  = rapeseed_mustard
//   col[4]  = soyabean
//   col[5]  = total_oilseeds
//   col[6]  = sugarcane
//   col[7]  = tea
//   col[8]  = coffee
//   col[9]  = cotton_lint
//   col[10] = raw_jute_mesta
//   col[11] = tobacco
//
// Emits (newest-first):
//   out/area-under-cultivation-major-commercial-crops.json
//     { reportTitle, units, data: [{ year, groundnut, rapeseed_mustard, soyabean,
//         total_oilseeds, sugarcane, tea, coffee, cotton_lint, raw_jute_mesta, tobacco } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Area Under Cultivation - Major Commercial Crops.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '—' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function yearKey(label) {
  return label.trim();
}

function isYearCell(s) {
  return /^\d{4}-\d{2,4}\s*$/.test(s);
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header    : 1,
      raw       : false,
      defval    : null,
      blankrows : true,
    });

    let reportTitle = '';
    let units       = 'Lakhs Hectares';
    let dataStart   = -1;

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const c1  = cellStr(row, 1).trim();

      if (/Area Under Cultivation.*Commercial Crops/i.test(c1)) {
        reportTitle = c1;
      }
      if (/Lakhs/i.test(c1)) {
        units = c1.replace(/[()[\]]/g, '').trim();
      }
      if (/^\s*1\s*$/.test(c1) && i > 5) {
        dataStart = i + 1;
        break;
      }
    }

    if (dataStart < 0) continue;

    const data = [];
    for (let i = dataStart; i < rows.length; i++) {
      const row = rows[i] || [];
      const raw = cellStr(row, 1);
      if (!isYearCell(raw)) continue;

      data.push({
        year             : yearKey(raw),
        groundnut        : parseNum(row[2]),
        rapeseed_mustard : parseNum(row[3]),
        soyabean         : parseNum(row[4]),
        total_oilseeds   : parseNum(row[5]),
        sugarcane        : parseNum(row[6]),
        tea              : parseNum(row[7]),
        coffee           : parseNum(row[8]),
        cotton_lint      : parseNum(row[9]),
        raw_jute_mesta   : parseNum(row[10]),
        tobacco          : parseNum(row[11]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Area Under Cultivation - Major Commercial Crops',
      units,
      data,
    };
  }

  throw new Error('could not locate data rows in any sheet');
}

function selfCheck(out) {
  const { data } = out;
  const errors   = [];

  if (!Array.isArray(data) || data.length < 70) {
    errors.push(`expected ≥70 year rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against source sheet.
  const known = [
    { year: '2025-26', field: 'groundnut',     value: 47  },
    { year: '2025-26', field: 'sugarcane',     value: 57  },
    { year: '2024-25', field: 'total_oilseeds',value: 304 },
    { year: '2024-25', field: 'cotton_lint',   value: 115 },
    { year: '1950-51', field: 'groundnut',     value: 45  },
    { year: '1950-51', field: 'cotton_lint',   value: 59  },
  ];
  for (const { year, field, value } of known) {
    const row = data.find((r) => r.year === year);
    if (!row) { errors.push(`known year missing: ${year}`); continue; }
    if (row[field] !== value) {
      errors.push(`${year} ${field}: expected ${value}, got ${row[field]}`);
    }
  }

  // Years must be unique.
  const keys = data.map((r) => r.year);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`years not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first.
  for (let i = 1; i < keys.length; i++) {
    const prev = parseInt(keys[i - 1].slice(0, 4), 10);
    const curr = parseInt(keys[i].slice(0, 4), 10);
    if (prev <= curr) {
      errors.push(`not strictly newest-first at row ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out    = parse(fs.readFileSync(XLSX_SRC));
  const errors = selfCheck(out);

  if (errors.length > 0) {
    console.error('area-under-cultivation-major-commercial-crops self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'area-under-cultivation-major-commercial-crops.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}; ` +
    `units: ${out.units}); self-check passed`,
  );
}

main();
