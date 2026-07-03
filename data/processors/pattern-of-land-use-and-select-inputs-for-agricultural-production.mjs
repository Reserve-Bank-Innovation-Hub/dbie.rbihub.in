// Processor: pattern-of-land-use-and-select-inputs-for-agricultural-production — RBI Handbook annual series.
//
// Source xlsx carries one sheet with annual land use and agricultural input figures for India,
// newest-first from 2023-24 back to 1950-51. Layout:
//   row 1  blank
//   row 2  title: "Pattern of Land Use and Select Inputs for Agricultural Production"
//   row 3  blank
//   row 4  units note: "(Area in Lakhs Hectares)"
//   row 5  blank
//   row 6  header row: Year | Net Sown Area | Gross Sown Area | Net Irrigated Area |
//                       Gross Irrigated Area | Area under High Yielding Varieties |
//                       Consumption of Fertilisers (N+P+K) (lakh tonnes) |
//                       Consumption of Pesticides (Technical Grade Material) ('000 tonnes)
//   row 7  col number row: "1","2","3","4","5","6","7","8"
//   rows 8… data (col[1] = "YYYY-YY", col[2..8] = values)
//   trailing blank + Notes footer
//
// Emits (newest-first):
//   out/pattern-of-land-use-and-select-inputs-for-agricultural-production.json
//     { reportTitle, note, data: [{
//         year, net_sown_area, gross_sown_area, net_irrigated_area, gross_irrigated_area,
//         area_hyv, fertiliser_consumption, pesticide_consumption
//       } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Pattern of Land Use and Select Inputs for Agricultural Production.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,389.9" -> 1389.9; '-'/'—'/'' -> null (gaps stay distinct from zeros).
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '—' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Is this a valid year cell like "2023-24" or "1950-51"?
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
    let dataStart   = -1;

    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const c1  = cellStr(row, 1).trim();

      if (/Pattern of Land Use/i.test(c1)) {
        reportTitle = c1;
      }
      // Data starts on the row after the col-number row (the row where col[1] is "1").
      if (/^\s*1\s*$/.test(c1) && i > 4) {
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
        year                   : raw.trim(),
        net_sown_area          : parseNum(row[2]),
        gross_sown_area        : parseNum(row[3]),
        net_irrigated_area     : parseNum(row[4]),
        gross_irrigated_area   : parseNum(row[5]),
        area_hyv               : parseNum(row[6]),
        fertiliser_consumption : parseNum(row[7]),
        pesticide_consumption  : parseNum(row[8]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Pattern of Land Use and Select Inputs for Agricultural Production',
      note        : "Area in lakh hectares. Fertiliser consumption in lakh tonnes (N+P+K). Pesticide consumption in '000 tonnes (technical grade material).",
      data,
    };
  }

  throw new Error('could not locate data rows in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors   = [];

  if (!Array.isArray(data) || data.length < 70) {
    errors.push(`expected ≥70 year rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    { year: '2023-24', field: 'net_sown_area',          value: 1389.9  },
    { year: '2023-24', field: 'gross_sown_area',        value: 2178.8  },
    { year: '2023-24', field: 'net_irrigated_area',     value: 824.2   },
    { year: '2023-24', field: 'gross_irrigated_area',   value: 1305.5  },
    { year: '2023-24', field: 'fertiliser_consumption', value: 306.42  },
    { year: '2022-23', field: 'fertiliser_consumption', value: 298.44  },
    { year: '2022-23', field: 'pesticide_consumption',  value: 53.63   },
    { year: '1950-51', field: 'net_sown_area',          value: 1187.5  },
    { year: '1950-51', field: 'gross_sown_area',        value: 1318.9  },
    { year: '1950-51', field: 'fertiliser_consumption', value: 0.69    },
    { year: '1952-53', field: 'net_sown_area',          value: 1234.4  },
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

  // Ordered newest-first (strictly descending start year).
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
    console.error('pattern-of-land-use self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'pattern-of-land-use-and-select-inputs-for-agricultural-production.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); self-check passed`,
  );
}

main();
