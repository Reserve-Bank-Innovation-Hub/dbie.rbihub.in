// Processor: index-numbers-of-industrial-production — RBI Handbook annual series.
//
// Source xlsx carries one sheet "Report 1" with four stacked series blocks,
// each covering a different base year. Layout (1-indexed rows as seen in the sheet):
//
//   Series 1 — Base 2011-12
//     row 3   "General Index of Industrial Production (Base 2011-12 = 100)"
//     row 5   headers: Year | Mining & Quarrying | Manufacturing | Electricity
//     row 6   col numbers: 1 | 2 | 3 | 4
//     row 7   weights: Weight | 14.37 | 77.63 | 7.99
//     rows 8-20  data (2024-25 down to 2012-13, newest-first)
//     row 21  blank
//
//   Series 2 — Base 2004-05
//     row 22  "... (Base 2004-05 = 100)"
//     rows 24-38 same structure (2016-17 down to 2005-06)
//
//   Series 3 — Base 1993-94
//     row 40  "... (Base 1993-94 = 100)"
//     rows 42-55 same structure (2004-05 down to 1994-95)
//
//   Series 4 — Base 1980-81
//     row 57  "... (Base 1980-81 = 100)"
//     rows 59-74 same structure (1993-94 down to 1981-82)
//     row 76  source note
//
// Data within each block is already newest-first.
//
// Emits:
//   out/index-numbers-of-industrial-production.json
//     {
//       reportTitle : string,
//       series      : [{
//         baseYear : string,
//         columns  : string[],
//         weights  : (number|null)[],
//         data     : [{ year: string, values: (number|null)[] }]
//       }]
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Index Numbers of Industrial Production.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// ─── helpers ────────────────────────────────────────────────────────────────

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "132.8" / "94.733333" → number; '' / '-' → null.
function parseNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '—' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Does this cell look like a "Base Year : YYYY-YY = 100" announcement row?
// e.g. "Base Year : 2011-12 = 100"
function extractBaseYear(s) {
  // Match "Base Year : 2011-12 = 100" or "Base 2011-12 = 100" etc.
  const m = s.match(/Base(?:\s+Year)?\s*[:\s]+(\d{4}-\d{2,4})\s*=/i);
  if (m) return m[1].trim();
  return null;
}

// e.g. "2024-25   " → "2024-25"
function isYearCell(s) {
  return /^\d{4}-\d{2,4}\s*$/.test(s);
}

// ─── parser ─────────────────────────────────────────────────────────────────

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Prefer "Report 1" but fall back to the first sheet.
  const sheetName = wb.SheetNames.includes('Report 1') ? 'Report 1' : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // The report title is in row 2 (0-indexed row 1), col 1.
  let reportTitle = 'Index Numbers of Industrial Production';
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i] || [];
    const s = cellStr(row, 1);
    if (s && /Index Numbers of Industrial Production/i.test(s)) {
      reportTitle = s.trim();
      break;
    }
  }

  // Collect candidate base-year announcement rows and build series blocks.
  const seriesBlocks = []; // [{ baseYear, announcementRow }]

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    // Base-year announcements are in col 1
    for (let c = 1; c <= 3; c++) {
      const s = cellStr(row, c);
      if (!s) continue;
      const by = extractBaseYear(s);
      if (by) {
        seriesBlocks.push({ baseYear: by, announcementRow: i });
        break;
      }
    }
  }

  if (seriesBlocks.length === 0) throw new Error('could not find any "Base Year :" announcement rows');

  const series = [];

  for (let si = 0; si < seriesBlocks.length; si++) {
    const { baseYear, announcementRow } = seriesBlocks[si];
    // The next series starts at the next block's announcement row (or end of sheet).
    const blockEnd = si + 1 < seriesBlocks.length ? seriesBlocks[si + 1].announcementRow : rows.length;

    // Within this block, find the header row (has "Year" in one of the first few cols).
    let headerRowIdx   = -1;
    let weightRowIdx   = -1;
    let colNumbers     = [];
    let colNames       = [];
    let colWeights     = [];

    for (let i = announcementRow + 1; i < blockEnd; i++) {
      const row = rows[i] || [];
      // Header row: first meaningful text cell contains "Year"
      if (headerRowIdx === -1) {
        for (let c = 1; c <= 5; c++) {
          if (/^year$/i.test(cellStr(row, c))) {
            headerRowIdx = i;
            // Collect column names starting at the "Year" col + 1
            for (let j = c + 1; j < row.length; j++) {
              const name = cellStr(row, j);
              if (name) colNames.push(name);
            }
            break;
          }
        }
        continue;
      }

      // Column-number row (immediately after header): starts with "1"
      if (headerRowIdx !== -1 && colNumbers.length === 0) {
        // Find the col that has "1"
        let foundOne = false;
        for (let c = 1; c <= 5; c++) {
          if (cellStr(row, c) === '1') {
            foundOne = true;
            for (let j = c; j < row.length; j++) {
              const n = cellStr(row, j);
              if (n) colNumbers.push(n);
            }
            break;
          }
        }
        if (foundOne) continue;
      }

      // Weight row: first cell is "Weight" (case-insensitive)
      if (weightRowIdx === -1 && colNumbers.length > 0) {
        for (let c = 1; c <= 5; c++) {
          if (/^weight$/i.test(cellStr(row, c))) {
            weightRowIdx = i;
            // Weights start at c+1
            for (let j = c + 1; j < row.length; j++) {
              const w = parseNum(row[j]);
              colWeights.push(w);
            }
            break;
          }
        }
        if (weightRowIdx !== -1) continue;
      }

      // Data rows — only after we've seen header + col-numbers + weights.
      if (headerRowIdx !== -1 && colNumbers.length > 0 && weightRowIdx !== -1) {
        break; // move to data collection loop below
      }
    }

    if (headerRowIdx === -1) {
      throw new Error(`series ${baseYear}: could not find header row`);
    }

    // Find the starting col for "Year" in the header row to know which col offsets data columns are.
    const headerRow = rows[headerRowIdx] || [];
    let yearCol = -1;
    for (let c = 1; c <= 5; c++) {
      if (/^year$/i.test(cellStr(headerRow, c))) {
        yearCol = c;
        break;
      }
    }
    const dataColStart = yearCol + 1;
    const numCols      = colNames.length; // Mining, Manufacturing, Electricity

    // Collect data rows.
    const dataStart = weightRowIdx !== -1 ? weightRowIdx + 1 : headerRowIdx + 3;
    const data = [];

    for (let i = dataStart; i < blockEnd; i++) {
      const row = rows[i] || [];
      const yearRaw = cellStr(row, yearCol);
      if (!isYearCell(yearRaw)) continue;

      const year   = yearRaw.trim();
      const values = [];
      for (let j = 0; j < numCols; j++) {
        values.push(parseNum(row[dataColStart + j]));
      }

      data.push({ year, values });
    }

    if (data.length === 0) throw new Error(`series ${baseYear}: no data rows found`);

    series.push({
      baseYear,
      columns : colNames,
      weights : colWeights,
      data,
    });
  }

  return { reportTitle, series };
}

// ─── self-checks ─────────────────────────────────────────────────────────────

function selfCheck(out) {
  const errors = [];

  if (!Array.isArray(out.series) || out.series.length < 4) {
    errors.push(`expected ≥4 series blocks, got ${out.series ? out.series.length : 'n/a'}`);
  }

  const tol = 0.001;

  // Helper: find a year row in a specific series
  function findRow(baseYear, year) {
    const s = out.series.find(s => s.baseYear === baseYear);
    if (!s) return null;
    return s.data.find(r => r.year === year) || null;
  }

  // Known cell 1: Series 2011-12, year "2024-25" → Mining=132.8, Manufacturing=150.6, Electricity=208.6
  const r1 = findRow('2011-12', '2024-25');
  if (!r1) {
    errors.push('Series 2011-12 row for 2024-25 not found');
  } else {
    if (Math.abs((r1.values[0] ?? NaN) - 132.8) > tol)
      errors.push(`2011-12 / 2024-25 Mining: expected 132.8, got ${r1.values[0]}`);
    if (Math.abs((r1.values[1] ?? NaN) - 150.6) > tol)
      errors.push(`2011-12 / 2024-25 Manufacturing: expected 150.6, got ${r1.values[1]}`);
    if (Math.abs((r1.values[2] ?? NaN) - 208.6) > tol)
      errors.push(`2011-12 / 2024-25 Electricity: expected 208.6, got ${r1.values[2]}`);
  }

  // Known cell 2: Series 2011-12, year "2012-13" → Mining≈94.733333, Manufacturing≈104.833333
  const r2 = findRow('2011-12', '2012-13');
  if (!r2) {
    errors.push('Series 2011-12 row for 2012-13 not found');
  } else {
    if (Math.abs((r2.values[0] ?? NaN) - 94.733333) > 0.0001)
      errors.push(`2011-12 / 2012-13 Mining: expected ≈94.733333, got ${r2.values[0]}`);
    if (Math.abs((r2.values[1] ?? NaN) - 104.833333) > 0.0001)
      errors.push(`2011-12 / 2012-13 Manufacturing: expected ≈104.833333, got ${r2.values[1]}`);
  }

  // Known cell 3: Series 1980-81, year "1981-82" → Manufacturing≈107.9333333
  const r3 = findRow('1980-81', '1981-82');
  if (!r3) {
    errors.push('Series 1980-81 row for 1981-82 not found');
  } else {
    if (Math.abs((r3.values[1] ?? NaN) - 107.9333333) > 0.0001)
      errors.push(`1980-81 / 1981-82 Manufacturing: expected ≈107.9333333, got ${r3.values[1]}`);
  }

  // Per-series checks: years must be unique and newest-first.
  for (const s of out.series) {
    const years = s.data.map(r => r.year);

    // Unique years
    const uniq = new Set(years);
    if (uniq.size !== years.length) {
      errors.push(`series ${s.baseYear}: year values not unique (${years.length} rows, ${uniq.size} distinct)`);
    }

    // Strictly newest-first (descending start year)
    for (let i = 1; i < years.length; i++) {
      const prev = parseInt(years[i - 1].slice(0, 4), 10);
      const curr = parseInt(years[i].slice(0, 4), 10);
      if (prev <= curr) {
        errors.push(`series ${s.baseYear}: not strictly newest-first at index ${i}: ${years[i - 1]} then ${years[i]}`);
        break;
      }
    }
  }

  return errors;
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  const out    = parse(fs.readFileSync(XLSX_SRC));
  const errors = selfCheck(out);

  if (errors.length > 0) {
    console.error('index-numbers-of-industrial-production self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index-numbers-of-industrial-production.json'),
    JSON.stringify(out),
  );

  const s0 = out.series[0];
  console.log(
    `wrote ${out.series.length} series blocks; ` +
    `series[0] (base ${s0.baseYear}): ${s0.data.length} rows ` +
    `(newest ${s0.data[0].year}, oldest ${s0.data[s0.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
