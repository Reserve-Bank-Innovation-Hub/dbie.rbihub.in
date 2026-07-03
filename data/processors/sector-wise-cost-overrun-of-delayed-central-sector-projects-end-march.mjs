// Processor: sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march — RBI HSIE Annual Table.
//
// Source xlsx has sheet "Report 1" with 40 rows:
//   row 1  title
//   row 3  units "(Rupees Crores)"
//   row 5  sector headers (15 sectors across 60 columns)
//   row 6  sub-column headers: Number of projects, Original estimate, Now anticipated, Cost overrun
//   row 7  column numbers
//   rows 8-37  data (year, values) — newest-first (2024 to 1995)
//   row 38 blank, row 39 notes+source
//
// Output: data/processors/out/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march.json

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Sector-Wise Cost Overrun of Delayed Central Sector Projects  (End -March).xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

const SECTOR_KEYS = [
  'atomic_energy', 'civil_aviation', 'coal', 'finance', 'fertilisers',
  'mines', 'steel', 'petro_chemicals', 'petroleum', 'power',
  'railways', 'surface_transport', 'telecommunication', 'others', 'total',
];

const SECTOR_NAMES = [
  'Atomic energy', 'Civil aviation', 'Coal', 'Finance', 'Fertilisers',
  'Mines', 'Steel', 'Petro-chemicals', 'Petroleum', 'Power',
  'Railways', 'Surface transport', 'Telecommunication', 'Others', 'Total',
];

const SUB_SUFFIXES = ['num_projects', 'original_estimate', 'now_anticipated', 'cost_overrun'];

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

  const reportTitle = String(rows[0]?.[1] ?? '').trim() ||
    'Sector-Wise Cost Overrun of Delayed Central Sector Projects (End-March)';
  const units = String(rows[2]?.[1] ?? '').trim().replace(/[()]/g, '') || 'Rupees Crores';

  const data = [];
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i] || [];
    const yearRaw = String(row[1] ?? '').trim();
    if (!yearRaw || /^source/i.test(yearRaw) || /^note/i.test(yearRaw)) continue;
    if (!/^\d{4}$/.test(yearRaw)) continue;

    const entry = { year: yearRaw };

    // 15 sectors × 4 sub-cols = 60 columns total, starting at row[2]
    for (let s = 0; s < 15; s++) {
      const base = 2 + s * 4;
      const key = SECTOR_KEYS[s];
      SUB_SUFFIXES.forEach((suf, si) => {
        entry[`${key}_${suf}`] = parseNum(row[base + si]);
      });
    }

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

  const row2024 = data.find((r) => r.year === '2024');
  if (!row2024) {
    errors.push('year 2024 not found');
  } else {
    if (row2024.total_num_projects !== 449)
      errors.push(`2024 total_num_projects: expected 449, got ${row2024.total_num_projects}`);
    if (row2024.total_original_estimate !== 877834.98)
      errors.push(`2024 total_original_estimate: expected 877834.98, got ${row2024.total_original_estimate}`);
    if (row2024.total_now_anticipated !== 1401211.14)
      errors.push(`2024 total_now_anticipated: expected 1401211.14, got ${row2024.total_now_anticipated}`);
    if (row2024.atomic_energy_cost_overrun !== 19995)
      errors.push(`2024 atomic_energy_cost_overrun: expected 19995, got ${row2024.atomic_energy_cost_overrun}`);
  }

  const row2008 = data.find((r) => r.year === '2008');
  if (!row2008) {
    errors.push('year 2008 not found');
  } else {
    if (row2008.atomic_energy_num_projects !== 3)
      errors.push(`2008 atomic_energy_num_projects: expected 3, got ${row2008.atomic_energy_num_projects}`);
  }

  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) errors.push('years not unique');
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
    console.error('sector-wise-cost-overrun self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} year rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
