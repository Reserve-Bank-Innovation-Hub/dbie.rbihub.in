// Processor: implementation-of-central-sector-projects-status-end-march — RBI HSIE Annual Table.
//
// Source xlsx has sheet "Report 1" with 40 rows:
//   row 1  title
//   row 3  units "(Number of projects)"
//   row 5  sector headers (17 sectors across 85 columns)
//   row 6  sub-column headers per sector: Ahead, On Schedule, Delayed, Without D.O.C., Total
//           (sector 17 only has 4 cols: Ahead, On Schedule, Delayed, Without D.O.C.)
//   row 7  column numbers 1-85
//   rows 8-37  data (year, 84 value cols) — newest-first (2024 to 1995)
//   row 38 blank
//   row 39 notes+source
//
// Output: data/processors/out/implementation-of-central-sector-projects-status-end-march.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Implementation of Central Sector Projects - Status (End -March).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Sector field name prefixes in order
const SECTOR_KEYS = [
  'atomic_energy',
  'civil_aviation',
  'coal',
  'finance',
  'fertilisers',
  'mines',
  'steel',
  'petro_chemicals',
  'petroleum',
  'power',
  'railways',
  'surface_transport',
  'telecommunication',
  'health_family_welfare',
  'urban_development',
  'others',
  'total',
];

// Sector display names
const SECTOR_NAMES = [
  '1. Atomic energy',
  '2. Civil aviation',
  '3. Coal',
  '4. Finance',
  '5. Fertilisers',
  '6. Mines',
  '7. Steel',
  '8. Petro-chemicals',
  '9. Petroleum',
  '10. Power',
  '11. Railways',
  '12. Surface transport',
  '13. Telecommunication',
  '14. Health & family welfare',
  '15. Urban development',
  '16. Others',
  '17. Total',
];

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets['Report 1'];
  if (!sheet) throw new Error('Sheet "Report 1" not found');

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  // Row 0 = title (row 1 in the sheet, 0-indexed)
  const reportTitle = String(rows[0]?.[1] ?? '').trim() ||
    'Implementation of Central Sector Projects - Status (End -March)';
  const units = String(rows[2]?.[1] ?? '').trim().replace(/[()]/g, '') || 'Number of projects';

  const data = [];
  // Data rows start at row index 7 (0-indexed, i.e. row 8 in sheet) through row 36
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i] || [];
    const yearRaw = String(row[1] ?? '').trim();
    if (!yearRaw || /^source/i.test(yearRaw) || /^note/i.test(yearRaw)) continue;
    if (!/^\d{4}$/.test(yearRaw)) continue;

    const entry = { year: yearRaw };

    // Sectors 1-16: each takes 5 columns (ahead, on_schedule, delayed, without_doc, total)
    // Starting col index: sector 1 starts at row[2], sector 2 at row[7], etc. => row[2 + (s*5)]
    for (let s = 0; s < 16; s++) {
      const base = 2 + s * 5;
      const key = SECTOR_KEYS[s];
      entry[`${key}_ahead`]        = parseNum(row[base]);
      entry[`${key}_on_schedule`]  = parseNum(row[base + 1]);
      entry[`${key}_delayed`]      = parseNum(row[base + 2]);
      entry[`${key}_without_doc`]  = parseNum(row[base + 3]);
      entry[`${key}_total`]        = parseNum(row[base + 4]);
    }

    // Sector 17 (total): starts at row[82], 4 cols only (no total_total)
    entry['total_ahead']       = parseNum(row[82]);
    entry['total_on_schedule'] = parseNum(row[83]);
    entry['total_delayed']     = parseNum(row[84]);
    entry['total_without_doc'] = parseNum(row[85]);

    data.push(entry);
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle,
    units,
    sectors: SECTOR_NAMES,
    sectorKeys: SECTOR_KEYS,
    data,
  };
}

function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length !== 30) {
    errors.push(`expected 30 data rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cell assertions
  const row2024 = data.find((r) => r.year === '2024');
  if (!row2024) {
    errors.push('year 2024 not found');
  } else {
    if (row2024.total_ahead !== 55)
      errors.push(`2024 total_ahead: expected 55, got ${row2024.total_ahead}`);
    if (row2024.total_on_schedule !== 646)
      errors.push(`2024 total_on_schedule: expected 646, got ${row2024.total_on_schedule}`);
    if (row2024.total_delayed !== 779)
      errors.push(`2024 total_delayed: expected 779, got ${row2024.total_delayed}`);
    if (row2024.coal_total !== 120)
      errors.push(`2024 coal_total: expected 120, got ${row2024.coal_total}`);
  }

  const row1995 = data.find((r) => r.year === '1995');
  if (!row1995) {
    errors.push('year 1995 not found');
  } else {
    if (row1995.atomic_energy_total !== 7)
      errors.push(`1995 atomic_energy_total: expected 7, got ${row1995.atomic_energy_total}`);
  }

  // Unique years
  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) errors.push('years not unique');

  // Newest-first (numeric descending)
  for (let i = 1; i < years.length; i++) {
    if (Number(years[i - 1]) <= Number(years[i])) {
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
    console.error('implementation-of-central-sector-projects self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'implementation-of-central-sector-projects-status-end-march.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
