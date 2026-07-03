// Processor: minimum-support-price-for-non-foodgrains-according-to-crop-year-fair — RBI HSIE Annual Table.
//
// Source xlsx has one sheet with 60 rows:
//   row 1  title
//   row 3  units "(Rupees per Quintal)"
//   row 5  headers: Year, Sugarcane, Cotton, Jute, Groundnut (in shell), Soyabean black,
//                   Soyabean yellow, Sunflower seed, Rapeseed / Mustard, Safflower
//   row 6  column numbers 1-10
//   rows 7-57  data — newest-first (2025-26 to 1975-76), "-" = null
//   row 59 notes
//
// Output: data/processors/out/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Minimum Support Price for Non-Foodgrains According to Crop Year (Fair Average Quality).xlsx',
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
    'Minimum Support Price for Non-Foodgrains According to Crop Year (Fair Average Quality)';
  const units = String(rows[2]?.[1] ?? '').trim().replace(/[()]/g, '') || 'Rupees per Quintal';
  const crops = [
    'Sugarcane', 'Cotton', 'Jute', 'Groundnut (in shell)',
    'Soyabean black', 'Soyabean yellow', 'Sunflower seed',
    'Rapeseed / Mustard', 'Safflower',
  ];

  const data = [];
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const yearRaw = String(row[1] ?? '').trim();
    if (!yearRaw || /^source/i.test(yearRaw) || /^note/i.test(yearRaw)) continue;
    if (!/^\d{4}-\d{2}/.test(yearRaw)) continue;

    const year = yearRaw.replace(/\s+/g, '');

    data.push({
      year,
      sugarcane           : parseNum(row[2]),
      cotton              : parseNum(row[3]),
      jute                : parseNum(row[4]),
      groundnut_in_shell  : parseNum(row[5]),
      soyabean_black      : parseNum(row[6]),
      soyabean_yellow     : parseNum(row[7]),
      sunflower_seed      : parseNum(row[8]),
      rapeseed_mustard    : parseNum(row[9]),
      safflower           : parseNum(row[10]),
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
    if (row202526.sugarcane !== 355)
      errors.push(`2025-26 sugarcane: expected 355, got ${row202526.sugarcane}`);
    if (row202526.cotton !== 8110)
      errors.push(`2025-26 cotton: expected 8110, got ${row202526.cotton}`);
    if (row202526.jute !== 5650)
      errors.push(`2025-26 jute: expected 5650, got ${row202526.jute}`);
  }

  const row202425 = data.find((r) => r.year === '2024-25');
  if (!row202425) {
    errors.push('year 2024-25 not found');
  } else {
    if (row202425.groundnut_in_shell !== 6783)
      errors.push(`2024-25 groundnut_in_shell: expected 6783, got ${row202425.groundnut_in_shell}`);
    if (row202425.sunflower_seed !== 7280)
      errors.push(`2024-25 sunflower_seed: expected 7280, got ${row202425.sunflower_seed}`);
  }

  const row197576 = data.find((r) => r.year === '1975-76');
  if (!row197576) {
    errors.push('year 1975-76 not found');
  } else {
    if (row197576.jute !== 135)
      errors.push(`1975-76 jute: expected 135, got ${row197576.jute}`);
  }

  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) errors.push('years not unique');

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
    console.error('minimum-support-price-for-non-foodgrains self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'minimum-support-price-for-non-foodgrains-according-to-crop-year-fair.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
