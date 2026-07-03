// Processor: employment-in-public-and-organised-private-sectors (annual) — RBI HSIE.
//
// Source xlsx: single sheet "Emplyoment in The Public and Or"
// Layout:
//   row 1  title "Employment in Public and Organised Private Sectors"
//   row 3  unit "(In Lakhs)"
//   row 5  header: Year | Public Sector (end-March) | Private Sector (end-March)
//   row 6  column numbers "1" | "2" | "3"
//   rows 7–60  data newest-first (2023-24 to 1970-71)
//              Note: 2023-24 to 2012-13 have "-" for both columns
//   row 62 Notes + Source line
//
// Emits (newest-first):
//   out/employment-in-public-and-organised-private-sectors.json
//     { reportTitle, unit, data: [{ year, public_sector, private_sector } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/national-income-saving-employment/Employment in Public and Organised Private Sectors.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// Returns null for blank / dash / N/A; otherwise parses number (strips commas).
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header  : 1,
      raw     : false,
      defval  : null,
      blankrows: true,
    });

    let reportTitle = '';
    let unit = 'In Lakhs';
    let headerRow = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();

      // Pick up the title from row 1
      if (!reportTitle && /Employment/i.test(c1) && /Public/i.test(c1)) {
        reportTitle = c1;
      }

      // Pick up the unit line e.g. "(In Lakhs)"
      if (/In Lakhs/i.test(c1)) {
        const m = c1.match(/In Lakhs/i);
        if (m) unit = 'In Lakhs';
      }

      // Detect header row: col 1 ≈ "Year", col 2 ≈ "Public"
      if (/Year/i.test(c1) && /Public/i.test(cellStr(row, 2))) {
        headerRow = i;
        break;
      }
    }

    if (headerRow < 0) continue; // wrong sheet — try next

    const data = [];
    // Skip the column-number row immediately after the header
    for (let i = headerRow + 2; i < rows.length; i++) {
      const row = rows[i] || [];
      const rawYear = cellStr(row, 1).trim();
      if (rawYear === '') continue;
      if (/^(Source|Note)/i.test(rawYear)) break;

      // Year validation: expect pattern like "2023-24" or "1970-71"
      if (!/^\d{4}-\d{2}/.test(rawYear)) continue;

      data.push({
        year           : rawYear,
        public_sector  : parseNum(row[2]),
        private_sector : parseNum(row[3]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Employment in Public and Organised Private Sectors',
      unit,
      data,
    };
  }

  throw new Error('could not locate the employment header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 40) {
    errors.push(`expected ≥40 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = {
    '2011-12' : { public_sector: 176, private_sector: 120 },
    '1970-71' : { public_sector: 111, private_sector:  67 },
    '1980-81' : { public_sector: 155, private_sector:  74 },
  };
  for (const [year, exp] of Object.entries(known)) {
    const row = data.find((r) => r.year === year);
    if (!row) { errors.push(`known year missing: ${year}`); continue; }
    if (row.public_sector !== exp.public_sector) {
      errors.push(`${year} public_sector: expected ${exp.public_sector}, got ${row.public_sector}`);
    }
    if (row.private_sector !== exp.private_sector) {
      errors.push(`${year} private_sector: expected ${exp.private_sector}, got ${row.private_sector}`);
    }
  }

  // Years must be unique.
  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) {
    errors.push(`years not unique: ${years.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first: first year should sort lexically greater than last year.
  if (data.length >= 2 && data[0].year <= data[data.length - 1].year) {
    errors.push(`not newest-first: first=${data[0].year}, last=${data[data.length - 1].year}`);
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('employment-in-public-and-organised-private-sectors self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'employment-in-public-and-organised-private-sectors.json'),
    JSON.stringify(out),
  );

  const nullCount = out.data.filter((r) => r.public_sector === null).length;
  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}; ` +
    `${nullCount} rows with null values); self-check passed`,
  );
}

main();
