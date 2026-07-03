// Processor: index-numbers-of-industrial-production-use-based-classification (annual) — RBI Handbook.
//
// Source xlsx carries one sheet ("Report 1") with four stacked series, each under a different base year:
//   Base 1: 2011-12 = 100 (rows 4–22,  covers 2024-25 → 2012-13, 13 data rows)
//   Base 2: 2004-05 = 100 (rows 23–41, covers 2016-17 → 2004-05, 13 data rows)
//   Base 3: 1993-94 = 100 (rows 42–58, covers 2004-05 → 1994-95, 11 data rows)
//   Base 4: 1980-81 = 100 (rows 59–78, covers 1993-94 → 1981-82, 13 data rows)
//
// Each series block begins with a "Base Year : XXXX-YY = 100" row, then a blank row,
// then a header row (Year | goods…), then a column-numbers row ("1","2",…),
// then a Weight row, then the actual data rows (newest-first), then a blank row.
//
// Column sets differ between series:
//   2011-12: Primary goods | Capital goods | Intermediate goods |
//            Infrastructure/ construction goods | Consumer durables | Consumer non-durables
//   2004-05/1993-94/1980-81: Basic goods | Capital goods | Consumer durables |
//                             Consumer goods | Consumer non-durables | Intermediate goods
//
// Each series has 6 data columns (columns 2–7 in the sheet, 0-based col indices).
//
// Emits:
//   out/index-numbers-of-industrial-production-use-based-classification.json
//     {
//       reportTitle,
//       series: [
//         {
//           baseYear, columns, weights,
//           data: [{ year, values }…]   // newest-first
//         }
//       ]
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Index Numbers of Industrial Production – Use-Based Classification.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// Parse a numeric string; return null for blank, dash, or non-finite values.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Normalise a column label: strip leading/trailing whitespace and collapse internal runs of spaces.
function normaliseCol(raw) {
  return String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
}

// Strip trailing whitespace from a year label such as "2024-25   ".
function normaliseYear(raw) {
  return String(raw == null ? '' : raw).trim();
}

// Extract the base year string from a "Base Year : 2011-12 = 100" cell.
// Returns e.g. "2011-12" or null.
function extractBaseYear(cell) {
  const m = cell.match(/(\d{4}-\d{2})\s*=\s*100/i);
  return m ? m[1] : null;
}

// Return the 4-digit start year of a financial-year label ("2024-25" → 2024).
function startYear(y) {
  const m = y.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : NaN;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sheetName = 'Report 1';
  if (!wb.Sheets[sheetName]) {
    throw new Error(`sheet "Report 1" not found; available: ${wb.SheetNames.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  // Row 2 (0-based index 1) carries the report title.
  const reportTitle = cellStr(rows[1] || [], 1).trim()
    || 'Index Numbers of Industrial Production – Use-Based Classification';

  // Walk all rows, detecting series blocks.
  const series   = [];
  let currentBase   = null;
  let currentCols   = null;
  let awaitingCols  = false; // true after base row, waiting for header row
  let awaitingNums  = false; // true after header row, waiting for column-numbers row
  let awaitingWts   = false; // true after col-numbers row, waiting for Weights row
  let parsingData   = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1  = cellStr(row, 1).trim();

    // Detect base-year announcement row.
    const base = extractBaseYear(c1);
    if (base) {
      currentBase  = base;
      currentCols  = null;
      awaitingCols = true;
      awaitingNums = false;
      awaitingWts  = false;
      parsingData  = false;
      series.push({ baseYear: base, columns: [], weights: [], data: [] });
      continue;
    }

    if (currentBase === null) continue;

    const current = series[series.length - 1];

    // Blank row ends data parsing for this block.
    if (c1 === '') {
      parsingData = false;
      continue;
    }

    // Skip source / note footer lines.
    if (/^Note/i.test(c1) || /^Source/i.test(c1) || /^See Notes/i.test(c1)) continue;

    // Header row (Year | goods…): detected when awaitingCols = true and c1 matches "Year".
    if (awaitingCols && /^Year$/i.test(c1)) {
      // Columns are in positions 2–7 (0-based).
      currentCols = [];
      for (let ci = 2; ci <= 7; ci++) {
        currentCols.push(normaliseCol(cellStr(row, ci)));
      }
      current.columns = currentCols;
      awaitingCols = false;
      awaitingNums = true;
      continue;
    }

    // Column-numbers row ("1","2",…,"7"): skip it, move to weight expectation.
    if (awaitingNums && /^1$/.test(c1)) {
      awaitingNums = false;
      awaitingWts  = true;
      continue;
    }

    // Weights row.
    if (awaitingWts && /^Weight/i.test(c1)) {
      current.weights = [];
      for (let ci = 2; ci <= 7; ci++) {
        current.weights.push(parseNum(row[ci]));
      }
      awaitingWts = false;
      parsingData = true;
      continue;
    }

    // Data rows: must begin with a 4-digit year.
    if (parsingData && /^\d{4}/.test(c1)) {
      const values = [];
      for (let ci = 2; ci <= 7; ci++) {
        values.push(parseNum(row[ci]));
      }
      current.data.push({ year: normaliseYear(c1), values });
    }
  }

  if (series.length === 0) throw new Error('no series found in the sheet');

  return { reportTitle, series };
}

// --- self-check -----------------------------------------------------------
function selfCheck(out) {
  const { series } = out;
  const errors = [];

  if (!Array.isArray(series) || series.length < 4) {
    errors.push(`expected ≥4 series, got ${series ? series.length : 'n/a'}`);
  }

  // Helper: find a row in a specific series by baseYear and year label.
  const findRow = (baseYear, year) => {
    const s = series.find(x => x.baseYear === baseYear);
    if (!s) return null;
    return s.data.find(r => r.year === year) || null;
  };

  // Helper: find a column index within a series by (partial) name match.
  const colIdx = (baseYear, name) => {
    const s = series.find(x => x.baseYear === baseYear);
    if (!s) return -1;
    return s.columns.findIndex(c => c.toLowerCase().includes(name.toLowerCase()));
  };

  // Known cell assertions (verified against the source sheet).
  const knownCells = [
    // Series 2011-12
    { baseYear: '2011-12', year: '2024-25', colName: 'Primary goods',       expect: 153.5 },
    { baseYear: '2011-12', year: '2024-25', colName: 'Capital goods',        expect: 112.6 },
    { baseYear: '2011-12', year: '2024-25', colName: 'Consumer non-durables', expect: 151.4 },
    { baseYear: '2011-12', year: '2012-13', colName: 'Primary goods',        expect: 100.5 },
    { baseYear: '2011-12', year: '2012-13', colName: 'Capital goods',        expect: 100.3 },
    // Series 1980-81
    { baseYear: '1980-81', year: '1981-82', colName: 'Basic goods',          expect: 110.9 },
    { baseYear: '1980-81', year: '1981-82', colName: 'Capital goods',        expect: 106.7 },
  ];

  for (const { baseYear, year, colName, expect } of knownCells) {
    const row = findRow(baseYear, year);
    if (!row) { errors.push(`${baseYear} year missing: ${year}`); continue; }
    const ci = colIdx(baseYear, colName);
    if (ci < 0) { errors.push(`${baseYear}: column not found for "${colName}"`); continue; }
    const got = row.values[ci];
    if (Math.abs((got ?? NaN) - expect) > 0.005) {
      errors.push(`${baseYear} ${year} "${colName}": expected ${expect}, got ${got}`);
    }
  }

  // Within each series: years unique and strictly newest-first.
  for (const s of series) {
    const years = s.data.map(r => r.year);
    const uniq  = new Set(years);
    if (uniq.size !== years.length) errors.push(`${s.baseYear}: years not unique`);

    for (let i = 1; i < s.data.length; i++) {
      const a = startYear(s.data[i - 1].year);
      const b = startYear(s.data[i].year);
      if (!isNaN(a) && !isNaN(b) && a <= b) {
        errors.push(`${s.baseYear}: not strictly newest-first at row ${i}: ${s.data[i - 1].year} → ${s.data[i].year}`);
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
    console.error('index-numbers-of-industrial-production-use-based-classification self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index-numbers-of-industrial-production-use-based-classification.json'),
    JSON.stringify(out),
  );

  const summary = out.series
    .map(s => `${s.baseYear}: ${s.data.length} rows (${s.data[s.data.length - 1].year}…${s.data[0].year})`)
    .join('  |  ');
  console.log(
    `wrote ${out.series.length} series → out/index-numbers-of-industrial-production-use-based-classification.json\n` +
    `  ${summary}\n  self-check passed`,
  );
}

main();
