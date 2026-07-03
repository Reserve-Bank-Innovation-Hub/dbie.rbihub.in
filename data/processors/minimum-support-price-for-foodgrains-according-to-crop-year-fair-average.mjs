// Processor: minimum-support-price-for-foodgrains-according-to-crop-year-fair-average — RBI HSIE Annual Table.
//
// Source xlsx has one sheet with 60 rows:
//   row 1  title
//   row 3  units "(Rupees per Quintal)"
//   row 5  headers: Year, Paddy common, Maize, Wheat, Gram, Arhar(Tur), Moong
//   row 6  column numbers 1-7
//   rows 7-57  data — newest-first (2025-26 to 1975-76), "-" = null
//   row 59 notes
//
// Output: data/processors/out/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Minimum Support Price for Foodgrains According to Crop Year (Fair Average Quality).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found');

  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  const reportTitle = String(rows[0]?.[1] ?? '').trim() ||
    'Minimum Support Price for Foodgrains According to Crop Year (Fair Average Quality)';
  const units = String(rows[2]?.[1] ?? '').trim().replace(/[()]/g, '') || 'Rupees per Quintal';
  const crops = ['Paddy common', 'Maize', 'Wheat', 'Gram', 'Arhar (Tur)', 'Moong'];

  const data = [];
  // Data starts at row index 6 (0-indexed, i.e. row 7 in sheet), runs through row 56 (row 57)
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const yearRaw = String(row[1] ?? '').trim();
    if (!yearRaw || /^source/i.test(yearRaw) || /^note/i.test(yearRaw)) continue;
    // Year looks like "2025-26" or "2025-26   "
    if (!/^\d{4}-\d{2}/.test(yearRaw)) continue;

    const year = yearRaw.replace(/\s+/g, '');

    data.push({
      year,
      paddy_common : parseNum(row[2]),
      maize        : parseNum(row[3]),
      wheat        : parseNum(row[4]),
      gram         : parseNum(row[5]),
      arhar_tur    : parseNum(row[6]),
      moong        : parseNum(row[7]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return { reportTitle, units, crops, data };
}

function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length !== 51) {
    errors.push(`expected 51 data rows, got ${data ? data.length : 'n/a'}`);
  }

  const row202526 = data.find((r) => r.year === '2025-26');
  if (!row202526) {
    errors.push('year 2025-26 not found');
  } else {
    if (row202526.paddy_common !== 2369)
      errors.push(`2025-26 paddy_common: expected 2369, got ${row202526.paddy_common}`);
    if (row202526.maize !== 2400)
      errors.push(`2025-26 maize: expected 2400, got ${row202526.maize}`);
    if (row202526.wheat !== null)
      errors.push(`2025-26 wheat: expected null, got ${row202526.wheat}`);
  }

  const row202425 = data.find((r) => r.year === '2024-25');
  if (!row202425) {
    errors.push('year 2024-25 not found');
  } else {
    if (row202425.wheat !== 2425)
      errors.push(`2024-25 wheat: expected 2425, got ${row202425.wheat}`);
    if (row202425.gram !== 5650)
      errors.push(`2024-25 gram: expected 5650, got ${row202425.gram}`);
  }

  const row197576 = data.find((r) => r.year === '1975-76');
  if (!row197576) {
    errors.push('year 1975-76 not found');
  } else {
    if (row197576.paddy_common !== 74)
      errors.push(`1975-76 paddy_common: expected 74, got ${row197576.paddy_common}`);
    if (row197576.wheat !== 105)
      errors.push(`1975-76 wheat: expected 105, got ${row197576.wheat}`);
  }

  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) errors.push('years not unique');

  // Newest-first: "2025-26" > "2024-25" lexicographically (first 4 digits determine order)
  for (let i = 1; i < years.length; i++) {
    if (years[i - 1] <= years[i]) {
      errors.push(`not newest-first at row ${i}: ${years[i - 1]} then ${years[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('minimum-support-price-for-foodgrains self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'minimum-support-price-for-foodgrains-according-to-crop-year-fair-average.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
