// Processor: index-numbers-of-infrastructure-industries (annual) — RBI Handbook.
//
// Source xlsx has one sheet ("Report 1") with three stacked series:
//   Base 2011-12 = 100  (rows 5-21, 0-based indices 4-20)
//   Base 2004-05 = 100  (rows 24-38, 0-based indices 23-37)
//   Base 1993-94 = 100  (rows 41-55, 0-based indices 40-54)
//
// Each series block:
//   col[1] = "Base Year :  YYYY-YY = 100"  (announcement row)
//   next row = header (Year | column names…)
//   next row = column numbers "1","2",…
//   next row = weights ("Weight", w1, w2,…)
//   then data rows until blank
//
// All data values live in cols 1..10 (col 0 is always null in this sheet).
//
// Emits:
//   out/index-numbers-of-infrastructure-industries.json
//     {
//       reportTitle,
//       series: [
//         {
//           baseYear,
//           columns,    // ["Overall index", "Electricity", …] — trimmed, non-null only
//           weights,    // [40.27, 7.99, …]
//           data: [{ year, values: [164.9, 208.6, …] }, …]  // newest-first
//         },
//         …
//       ]
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Index Numbers of Infrastructure Industries.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "75,841.87" → 75841.87. Returns null for blank/dash.
function parseNum(v) {
  const s = String(v == null ? '' : v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Returns "YYYY-YY" if the string is a financial-year label, else null.
function yearKey(label) {
  const m = String(label || '').trim().match(/^(\d{4})-(\d{2,4})$/);
  return m ? `${m[1]}-${m[2].slice(-2)}` : null;
}

// Normalise a column header string (trim whitespace, sentence-case first word).
function normaliseHeader(s) {
  const t = String(s || '').trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    .replace(/\b(index|oil|gas)\b/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// Identify a "Base Year : YYYY-YY = 100" announcement string.
function extractBaseYear(s) {
  const m = String(s || '').match(/Base\s+Year\s*:.*?(\d{4}-\d{2,4})/i);
  return m ? m[1].replace(/-(\d{4})$/, (_, y) => `-${y.slice(-2)}`) : null;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames.find((n) => n === 'Report 1') ?? wb.SheetNames[0];
  if (!sheetName) throw new Error('no sheet found in workbook');

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header  : 1,
    raw     : false,
    defval  : null,
    blankrows: true,
  });

  // Report title is in row index 1, col 1.
  const reportTitle = cellStr(rows[1] || [], 1) || 'Index Numbers of Infrastructure Industries';

  const series = [];

  let i = 0;
  while (i < rows.length) {
    const row = rows[i] || [];

    // Look for a "Base Year" announcement row.
    const baseYear = extractBaseYear(cellStr(row, 1));
    if (!baseYear) { i++; continue; }

    // Next row = headers (Year | col1 | col2 | …)
    const headerRow = rows[i + 1] || [];
    // After that, column numbers ("1","2",…), then weights.
    const weightRow = rows[i + 3] || [];

    // Read non-null header columns starting from col index 1.
    // Col 1 is "Year"; the data columns start at col 2.
    const columns = [];
    const colIndices = [];   // which column indices (2-based in the array) hold data
    const weights = [];

    for (let c = 2; c < headerRow.length; c++) {
      const hdr = cellStr(headerRow, c);
      if (!hdr) continue;         // null cols (e.g. 1993-94 series cols 9-10)
      columns.push(hdr.trim());
      colIndices.push(c);
      weights.push(parseNum(weightRow[c]));
    }

    // Collect data rows (from i+4 onward) until a blank year or end of block.
    const data = [];
    let j = i + 4;
    while (j < rows.length) {
      const r = rows[j] || [];
      const rawYear = cellStr(r, 1);
      const yk = yearKey(rawYear);
      if (!yk) {
        // Blank row or next-block announcement — stop if we already have data.
        if (data.length > 0) break;
        j++;
        continue;
      }
      const values = colIndices.map((c) => parseNum(r[c]));
      data.push({ year: yk, values });
      j++;
    }

    series.push({ baseYear, columns, weights, data });
    i = j;
  }

  if (series.length === 0) throw new Error('no series found in sheet');

  return { reportTitle, series };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const errors = [];

  if (!Array.isArray(out.series) || out.series.length < 3) {
    errors.push(`expected ≥3 series, got ${out.series ? out.series.length : 'n/a'}`);
    return errors;
  }

  const [s1, s2, s3] = out.series;

  // --- Series 1: base 2011-12 ---
  if (s1.baseYear !== '2011-12') errors.push(`series[0].baseYear: expected 2011-12, got ${s1.baseYear}`);
  if (!Array.isArray(s1.data) || s1.data.length < 10) {
    errors.push(`series[0]: expected ≥10 data rows, got ${s1.data ? s1.data.length : 'n/a'}`);
  }

  const check = (seriesLabel, data, year, colIdx, expected) => {
    const row = data.find((r) => r.year === year);
    if (!row) { errors.push(`${seriesLabel} year ${year} missing`); return; }
    const got = row.values[colIdx];
    if (got == null || Math.abs(got - expected) > 0.005) {
      errors.push(`${seriesLabel} ${year} col[${colIdx}]: expected ${expected}, got ${got}`);
    }
  };

  // Known cells — series 1 (2011-12)
  check('s1', s1.data, '2024-25', 0, 164.9);       // Overall index
  check('s1', s1.data, '2024-25', 1, 208.6);       // Electricity
  check('s1', s1.data, '2024-25', 8, 133.5);       // Fertilisers
  check('s1', s1.data, '2012-13', 0, 103.816045);  // Overall index
  check('s1', s1.data, '2012-13', 2, 103.188498);  // Coal

  // --- Series 2: base 2004-05 ---
  if (s2.baseYear !== '2004-05') errors.push(`series[1].baseYear: expected 2004-05, got ${s2.baseYear}`);
  if (!Array.isArray(s2.data) || s2.data.length < 8) {
    errors.push(`series[1]: expected ≥8 data rows, got ${s2.data ? s2.data.length : 'n/a'}`);
  }
  check('s2', s2.data, '2005-06', 0, 103.8687);   // Overall index

  // --- Series 3: base 1993-94 (only 7 data columns) ---
  if (s3.baseYear !== '1993-94') errors.push(`series[2].baseYear: expected 1993-94, got ${s3.baseYear}`);
  if (!Array.isArray(s3.data) || s3.data.length < 8) {
    errors.push(`series[2]: expected ≥8 data rows, got ${s3.data ? s3.data.length : 'n/a'}`);
  }
  if (s3.columns.length !== 7) {
    errors.push(`series[2]: expected 7 columns (null cols stripped), got ${s3.columns.length}`);
  }

  // Per-series: years must be unique and newest-first.
  for (const [si, s] of out.series.entries()) {
    if (!Array.isArray(s.data)) continue;
    const keys = s.data.map((r) => r.year);
    const uniq = new Set(keys);
    if (uniq.size !== keys.length) {
      errors.push(`series[${si}] years not unique: ${keys.length} rows, ${uniq.size} distinct`);
    }
    for (let k = 1; k < keys.length; k++) {
      const prev = parseInt(keys[k - 1], 10);
      const curr = parseInt(keys[k], 10);
      if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev <= curr) {
        errors.push(`series[${si}] not newest-first at row ${k}: ${keys[k - 1]} then ${keys[k]}`);
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
    console.error('index-numbers-of-infrastructure-industries self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index-numbers-of-infrastructure-industries.json'),
    JSON.stringify(out),
  );

  const totals = out.series.map((s) => `${s.baseYear}: ${s.data.length} rows`).join(', ');
  console.log(`wrote ${out.series.length} series (${totals}); self-check passed`);
}

main();
