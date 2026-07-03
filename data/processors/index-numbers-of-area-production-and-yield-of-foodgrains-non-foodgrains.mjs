// Processor: index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains
// (annual series) — RBI Handbook of Statistics on Indian Economy.
//
// Source xlsx carries one sheet with THREE stacked series, each under a different base:
//   Base 1: Triennium ending 2007-08=100  (covers 2024-25 → 2007-08)
//   Base 2: Triennium ending 1993-94=100  (covers 2007-08 → 1993-94)
//   Base 3: Triennium ending 1981-82=100  (covers 1993-94 → 1949-50)
//
// Each block begins with a base-note row "(Base-Triennium Ending XXXX-YY=100)",
// then a Year header, a column-numbers row, a Weights row, then data rows.
//
// Column mapping (0-based):
//   1=Year
//   For 2007-08=100 (10 data cols):
//     2=Foodgrains-A, 3=Foodgrains-Pr, 4=Foodgrains-Y
//     5=NonFoodgrains-A, 6=NonFoodgrains-Pr, 7=NonFoodgrains-Y
//     8=AllCrops-A, 9=AllCrops-Pr, 10=AllCrops-Y
//   For 1993-94=100 and 1981-82=100 (only Foodgrains A/Pr/Y in 3 cols based on inspection)
//     — actually all three series appear to have the same 9 value columns.
//
// Emits:
//   out/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains.json
//     { reportTitle, series: [{ base, weights, data[] }, …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Index Numbers of Area, Production and Yield of Foodgrains, Non-Foodgrains and All Crops in India.xlsx',
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

// "(Base-Triennium Ending 2007-08=100)" or "(Base : Triennium Ending 2007-08=100)" -> "2007-08=100"
function extractBase(cell) {
  const m = cell.match(/(\d{4}-\d{2})\s*=\s*100/i);
  return m ? `${m[1]}=100` : null;
}

function buildDataRow(row) {
  return {
    foodGrainsArea          : parseNum(row[2]),
    foodGrainsProduction    : parseNum(row[3]),
    foodGrainsYield         : parseNum(row[4]),
    nonFoodGrainsArea       : parseNum(row[5]),
    nonFoodGrainsProduction : parseNum(row[6]),
    nonFoodGrainsYield      : parseNum(row[7]),
    allCropsArea            : parseNum(row[8]),
    allCropsProduction      : parseNum(row[9]),
    allCropsYield           : parseNum(row[10]),
  };
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

  const columns = {
    foodGrainsArea          : 'Foodgrains — area',
    foodGrainsProduction    : 'Foodgrains — production',
    foodGrainsYield         : 'Foodgrains — yield',
    nonFoodGrainsArea       : 'Non-foodgrains — area',
    nonFoodGrainsProduction : 'Non-foodgrains — production',
    nonFoodGrainsYield      : 'Non-foodgrains — yield',
    allCropsArea            : 'All crops — area',
    allCropsProduction      : 'All crops — production',
    allCropsYield           : 'All crops — yield',
  };

  const seriesMap = new Map(); // base -> { weights, data }
  let currentBase = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();

    // Base-note row?
    const base = extractBase(c1);
    if (base) {
      currentBase = base;
      if (!seriesMap.has(base)) seriesMap.set(base, { weights: null, data: [] });
      continue;
    }

    if (currentBase === null) continue;

    // Skip blank rows, Year header, column-numbers, footnote/source/key rows.
    if (c1 === '') continue;
    if (/^Year$/i.test(c1)) continue;
    if (/^1$/.test(c1)) continue;                      // column-numbers row
    if (/^A\s*:/i.test(c1)) continue;                  // "A : Area   Pr : Production…" key
    if (/^Note/i.test(c1) || /^Source/i.test(c1) || /^Also/i.test(c1)) continue;

    // Weights row?
    if (/^Weights$/i.test(c1)) {
      seriesMap.get(currentBase).weights = buildDataRow(row);
      continue;
    }

    // Data row — must start with a 4-digit year.
    if (!/^\d{4}/.test(c1)) continue;
    seriesMap.get(currentBase).data.push({
      year : normaliseYear(c1),
      ...buildDataRow(row),
    });
  }

  // Build ordered series list, newest base first.
  const series = Array.from(seriesMap.entries())
    .map(([base, { weights, data }]) => ({ base, weights, data }))
    .sort((a, b) => {
      const ay = parseInt((a.base.match(/^(\d{4})/) || [])[1] || '0', 10);
      const by = parseInt((b.base.match(/^(\d{4})/) || [])[1] || '0', 10);
      return by - ay;
    });

  if (series.length === 0) throw new Error('no series found');

  return {
    reportTitle : reportTitle || 'Index Numbers of Area, Production and Yield of Foodgrains, Non-Foodgrains and All Crops in India',
    columns,
    series,
  };
}

function selfCheck(out) {
  const { series } = out;
  const errors = [];

  if (!Array.isArray(series) || series.length < 3) {
    errors.push(`expected ≥3 series, got ${series ? series.length : 'n/a'}`);
  }

  const findRow = (base, year) => {
    const s = series.find(x => x.base === base);
    if (!s) return null;
    return s.data.find(r => r.year === year) || null;
  };

  // Known cells verified against the source sheet.
  const known = [
    { base: '2007-08=100', year: '2024-25', field: 'foodGrainsArea',       expect: 116.7 },
    { base: '2007-08=100', year: '2024-25', field: 'allCropsProduction',   expect: 167.5 },
    { base: '2007-08=100', year: '2007-08', field: 'foodGrainsArea',       expect: 101.2 },
    { base: '1993-94=100', year: '2007-08', field: 'foodGrainsArea',       expect: 128.8 },
    { base: '1993-94=100', year: '1993-94', field: 'foodGrainsArea',       expect: 127.4 },
    { base: '1981-82=100', year: '1993-94', field: 'foodGrainsArea',       expect: 96.7  },
    { base: '1981-82=100', year: '1949-50', field: 'foodGrainsArea',       expect: 78.0  },
  ];
  for (const { base, year, field, expect } of known) {
    const s = series.find(x => x.base === base);
    if (!s) { errors.push(`series ${base} missing`); continue; }
    const row = findRow(base, year);
    if (!row) { errors.push(`${base} year missing: ${year}`); continue; }
    if (row[field] !== expect) {
      errors.push(`${base} ${year}.${field}: expected ${JSON.stringify(expect)}, got ${JSON.stringify(row[field])}`);
    }
  }

  // Within each series: years unique + strictly newest-first.
  for (const s of series) {
    const years = s.data.map(r => r.year);
    const uniq = new Set(years);
    if (uniq.size !== years.length) errors.push(`${s.base}: years not unique`);
    for (let i = 1; i < s.data.length; i++) {
      const a = startYear(s.data[i - 1].year);
      const b = startYear(s.data[i].year);
      if (!isNaN(a) && !isNaN(b) && a <= b) {
        errors.push(`${s.base}: not strictly newest-first at row ${i}: ${s.data[i-1].year} → ${s.data[i].year}`);
        break;
      }
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains.json'),
    JSON.stringify(out),
  );

  const summary = out.series
    .map(s => `${s.base}: ${s.data.length} rows (${s.data[s.data.length-1].year}…${s.data[0].year})`)
    .join('  |  ');
  console.log(`wrote ${out.series.length} series -> out/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains.json\n  ${summary}\n  self-check passed`);
}

main();
