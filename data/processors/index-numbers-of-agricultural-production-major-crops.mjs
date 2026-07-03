// Processor: index-numbers-of-agricultural-production-major-crops (annual series) — RBI Handbook.
//
// Source xlsx carries one sheet with three stacked series, each under a different base period:
//   Base 1: Triennium ending 1981-82=100  (rows ~8–21, covers 1993-94 → 1980-81)
//   Base 2: Triennium ending 1993-94=100  (rows ~28–42, covers 2007-08 → 1993-94)
//   Base 3: Triennium ending 2007-08=100  (rows ~49–66, covers 2024-25 → 2007-08)
//
// Each series block begins with a base-note row "(Base : Triennium Ending XXXX-YY=100)",
// then a header row (Year | All Crops | …), a column-numbers row, a Weights row,
// then the actual data rows (newest-first within each block).
//
// Column set (0-based, same across all three bases):
//   1=Year, 2=All Crops, 3=Food-grains, 4=Cereals, 5=Rice, 6=Wheat, 7=Coarse cereals,
//   8=Pulses, 9=Non-food-grains, 10=Oil-seeds, 11=Groundnut, 12=Sesamum,
//   13=Rape-seed/Mustard, 14=Coconut, 15=Fibres, 16=Cotton(Lint), 17=Jute,
//   18=Tea, 19=Coffee, 20=Rubber, 21=Fruits and vegetables, 22=Sugarcane,
//   23=Tobacco, 24=Guarseed, 25=Condiments and spices
//
// Emits:
//   out/index-numbers-of-agricultural-production-major-crops.json
//     { reportTitle, series: [{ base, weights, data[] }, …] }
//   Series are ordered newest-base-first.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Index Numbers of Agricultural Production - Major Crops.xlsx',
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

// Extract "(Base : Triennium Ending 1981-82=100)" -> "1981-82=100"
function extractBase(cell) {
  const m = cell.match(/(\d{4}-\d{2})\s*=\s*100/i);
  return m ? `${m[1]}=100` : null;
}

function buildDataRow(row) {
  return {
    allCrops         : parseNum(row[2]),
    foodGrains       : parseNum(row[3]),
    cereals          : parseNum(row[4]),
    rice             : parseNum(row[5]),
    wheat            : parseNum(row[6]),
    coarseCereals    : parseNum(row[7]),
    pulses           : parseNum(row[8]),
    nonFoodGrains    : parseNum(row[9]),
    oilSeeds         : parseNum(row[10]),
    groundnut        : parseNum(row[11]),
    sesamum          : parseNum(row[12]),
    rapeseedMustard  : parseNum(row[13]),
    coconut          : parseNum(row[14]),
    fibres           : parseNum(row[15]),
    cottonLint       : parseNum(row[16]),
    jute             : parseNum(row[17]),
    tea              : parseNum(row[18]),
    coffee           : parseNum(row[19]),
    rubber           : parseNum(row[20]),
    fruitsVegetables : parseNum(row[21]),
    sugarcane        : parseNum(row[22]),
    tobacco          : parseNum(row[23]),
    guarseed         : parseNum(row[24]),
    condimentsSpices : parseNum(row[25]),
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
    allCrops         : 'All crops',
    foodGrains       : 'Food-grains',
    cereals          : 'Cereals',
    rice             : 'Rice',
    wheat            : 'Wheat',
    coarseCereals    : 'Coarse cereals',
    pulses           : 'Pulses',
    nonFoodGrains    : 'Non-food-grains',
    oilSeeds         : 'Oil-seeds',
    groundnut        : 'Groundnut',
    sesamum          : 'Sesamum',
    rapeseedMustard  : 'Rape-seed / mustard',
    coconut          : 'Coconut',
    fibres           : 'Fibres',
    cottonLint       : 'Cotton (lint)',
    jute             : 'Jute',
    tea              : 'Tea',
    coffee           : 'Coffee',
    rubber           : 'Rubber',
    fruitsVegetables : 'Fruits and vegetables',
    sugarcane        : 'Sugarcane',
    tobacco          : 'Tobacco',
    guarseed         : 'Guarseed',
    condimentsSpices : 'Condiments and spices',
  };

  // Walk all rows, splitting on base-note rows.
  // State: currentBase (string|null), parsingData (bool), pendingWeightRow
  const seriesMap = new Map(); // base -> { weights, data }
  let currentBase = null;
  let awaitingWeights = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();

    // Base-note row?
    const base = extractBase(c1);
    if (base) {
      currentBase = base;
      if (!seriesMap.has(base)) seriesMap.set(base, { weights: null, data: [] });
      awaitingWeights = false; // will come after Year header + col-numbers rows
      continue;
    }

    if (currentBase === null) continue;

    // Skip: blank rows, "Year" header rows, column-number rows (col1 is "1"), footer lines.
    if (c1 === '') continue;
    if (/^Year$/i.test(c1)) { awaitingWeights = true; continue; }
    if (/^1$/.test(c1)) continue; // column-numbers row
    if (/^Note/i.test(c1) || /^Source/i.test(c1) || /^Also/i.test(c1)) continue;

    // Weights row?
    if (/^Weights$/i.test(c1)) {
      seriesMap.get(currentBase).weights = buildDataRow(row);
      awaitingWeights = false;
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
      // "2007-08=100" → start year 2007
      const ay = parseInt((a.base.match(/^(\d{4})/) || [])[1] || '0', 10);
      const by = parseInt((b.base.match(/^(\d{4})/) || [])[1] || '0', 10);
      return by - ay; // newest base first
    });

  if (series.length === 0) throw new Error('no series found');

  return { reportTitle : reportTitle || 'Index Numbers of Agricultural Production - Major Crops', columns, series };
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
    { base: '2007-08=100', year: '2024-25', field: 'allCrops',    expect: 167.5 },
    { base: '2007-08=100', year: '2024-25', field: 'sugarcane',   expect: 137.1 },
    { base: '2007-08=100', year: '2007-08', field: 'allCrops',    expect: 107.0 },
    { base: '1993-94=100', year: '2007-08', field: 'allCrops',    expect: 172.9 },
    { base: '1993-94=100', year: '1993-94', field: 'allCrops',    expect: 123.0 },
    { base: '1981-82=100', year: '1993-94', field: 'allCrops',    expect: 157.3 },
    { base: '1981-82=100', year: '1980-81', field: 'allCrops',    expect: 102.1 },
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
    console.error('index-numbers-of-agricultural-production-major-crops self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index-numbers-of-agricultural-production-major-crops.json'),
    JSON.stringify(out),
  );

  const summary = out.series
    .map(s => `${s.base}: ${s.data.length} rows (${s.data[s.data.length-1].year}…${s.data[0].year})`)
    .join('  |  ');
  console.log(`wrote ${out.series.length} series -> out/index-numbers-of-agricultural-production-major-crops.json\n  ${summary}\n  self-check passed`);
}

main();
