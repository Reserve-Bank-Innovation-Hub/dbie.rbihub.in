// Processor: consumer-price-index-annual-average — Handbook of Statistics on Indian Economy.
//
// Source xlsx carries one sheet with three parallel panels of CPI data:
//   Panel A (cols 1-2): CPI for Agricultural Labourers (CPI-AL), base 1960=100 then 1986-87=100.
//   Panel B (cols 4-6): CPI for Industrial Workers (CPI-IW) + Food & Beverages sub-index,
//                        across four base years (1960=100, 1982=100, 2001=100, 2016=100).
//   Panel C (cols 8-11): New CPI Rural / Urban / Combined, base 2012=100.
//
// Sheet layout (0-indexed rows):
//   row 1  title "Consumer Price Index - Annual Average"
//   row 3  panel labels "Index (Average of months)" at cols 2, 5, 9
//   row 4  header labels: Year | CPI-AL | Year | CPI-IW | CPI-IW Food&Bev | Year | Rural | Urban | Combined
//   row 5  base annotations
//   rows 6… data rows (three panels run in parallel; some rows are base-change marker rows)
//   row 70  notes/sources footer
//
// Emits (newest-first within each series):
//   out/consumer-price-index-annual-average.json
//     {
//       reportTitle,
//       series: {
//         cpi_al : { label, note, data: [{ year, index, base }] },
//         cpi_iw : { label, note, data: [{ year, general, food_beverages, base }] },
//         new_cpi: { label, note, data: [{ year, rural, urban, combined }] },
//       }
//     }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Consumer Price Index - Annual Average.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// ─── helpers ────────────────────────────────────────────────────────────────

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// "-" and "" → null; strips commas, retains decimals.
function parseNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// Returns true when a cell value looks like a base-change annotation (e.g. "Base : 1986-87 = 100 for AL").
function isBaseMarker(s) {
  return /\bbase\b/i.test(s);
}

// ─── parser ─────────────────────────────────────────────────────────────────

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    // Look for the title in row 1 (0-indexed) col 1.
    const reportTitle = cellStr(rows[1] || [], 1) || 'Consumer Price Index - Annual Average';

    // Confirm this is the right sheet by checking row 4 has "Year" in col 1.
    const hdr = rows[4] || [];
    if (!/year/i.test(cellStr(hdr, 1))) continue; // wrong sheet

    // ── Panel A: CPI-AL (cols 1–2, data starts row 6) ──────────────────────
    // Base changes are signalled by the value cell containing "Base : …" text.
    const cpi_al = [];
    let baseAL = '1960=100'; // initial base (rows 6–30 approx)
    for (let i = 6; i < rows.length; i++) {
      const row = rows[i] || [];
      const yearCell = cellStr(row, 1);
      const valCell  = cellStr(row, 2);
      if (yearCell === '' && valCell === '') continue;
      if (/^Source:/i.test(yearCell) || /^Note/i.test(yearCell)) break;

      // Base-change marker: value cell announces the new base.
      if (isBaseMarker(valCell)) {
        // e.g. "Base : 1986-87 = 100 for AL" → keep as short label.
        const m = valCell.match(/(\d{4}(?:[–-]\d{2,4})?)\s*=\s*100/);
        baseAL = m ? `${m[1]}=100` : valCell;
        continue;
      }

      // Year cell must look like "YYYY-YY" (e.g. "2024-25").
      if (!/^\d{4}-\d{2}$/.test(yearCell)) continue;

      const index = parseNum(valCell);
      if (index === null) continue; // blank data row — skip

      cpi_al.push({ year: yearCell, index, base: baseAL });
    }

    // ── Panel B: CPI-IW (cols 4–6, data starts row 6) ──────────────────────
    // Multiple base changes within the same column block.
    const cpi_iw = [];
    let baseIW = '1960=100';
    for (let i = 6; i < rows.length; i++) {
      const row = rows[i] || [];
      const yearCell = cellStr(row, 4);
      const genCell  = cellStr(row, 5);
      const fndCell  = cellStr(row, 6);

      if (yearCell === '' && genCell === '' && fndCell === '') continue;
      if (/^Source:/i.test(yearCell) || /^Note/i.test(yearCell)) break;

      // Base-change marker: either year or general cell may carry it.
      if (isBaseMarker(genCell) || isBaseMarker(yearCell)) {
        const markerText = isBaseMarker(genCell) ? genCell : yearCell;
        const m = markerText.match(/(\d{4}(?:[–-]\d{2,4})?)\s*=\s*100/);
        baseIW = m ? `${m[1]}=100` : markerText;
        continue;
      }

      if (!/^\d{4}-\d{2}$/.test(yearCell)) continue;

      const general        = parseNum(genCell);
      const food_beverages = parseNum(fndCell);
      if (general === null && food_beverages === null) continue;

      cpi_iw.push({ year: yearCell, general, food_beverages, base: baseIW });
    }

    // ── Panel C: New CPI Rural/Urban/Combined (cols 8–11, data starts row 6) ─
    // Single base year 2012=100; no base-change markers expected.
    const new_cpi = [];
    for (let i = 6; i < rows.length; i++) {
      const row = rows[i] || [];
      const yearCell  = cellStr(row, 8);
      const ruralCell = cellStr(row, 9);
      const urbanCell = cellStr(row, 10);
      const combCell  = cellStr(row, 11);

      if (yearCell === '' && ruralCell === '' && urbanCell === '' && combCell === '') continue;
      if (/^Source:/i.test(yearCell) || /^Note/i.test(yearCell)) break;
      if (isBaseMarker(ruralCell) || isBaseMarker(yearCell)) continue;
      if (!/^\d{4}-\d{2}$/.test(yearCell)) continue;

      const rural    = parseNum(ruralCell);
      const urban    = parseNum(urbanCell);
      const combined = parseNum(combCell);
      if (rural === null && urban === null && combined === null) continue;

      new_cpi.push({ year: yearCell, rural, urban, combined });
    }

    if (cpi_al.length === 0 && cpi_iw.length === 0 && new_cpi.length === 0) {
      throw new Error('no valid data rows found in any panel');
    }

    // All three panels are collected oldest-first (as they appear in the sheet).
    // Reverse each to newest-first.
    cpi_al.reverse();
    cpi_iw.reverse();
    new_cpi.reverse();

    return {
      reportTitle,
      series: {
        cpi_al: {
          label : 'CPI - Agricultural labourers',
          note  : 'Base: 1960=100 (pre-1995); 1986-87=100 (1995-96 onwards)',
          data  : cpi_al,
        },
        cpi_iw: {
          label : 'CPI - Industrial workers',
          note  : 'Multiple base years: 1960=100, 1982=100, 2001=100, 2016=100',
          data  : cpi_iw,
        },
        new_cpi: {
          label : 'New CPI (Base: 2012=100)',
          note  : 'Annual average; rural, urban and combined series',
          data  : new_cpi,
        },
      },
    };
  }

  throw new Error('could not locate the CPI header row in any sheet');
}

// ─── self-checks ─────────────────────────────────────────────────────────────

function selfCheck(out) {
  const { series } = out;
  const errors = [];

  // 1. CPI-AL 2024-25 index must be 1299.
  const al2024 = series.cpi_al.data.find(r => r.year === '2024-25');
  if (!al2024) {
    errors.push('CPI-AL row for 2024-25 not found');
  } else if (al2024.index !== 1299) {
    errors.push(`CPI-AL 2024-25 index: expected 1299, got ${al2024.index}`);
  }

  // 2. New CPI 2024-25 combined ≈ 192.616667 (tolerance ±0.001).
  const cpi2024 = series.new_cpi.data.find(r => r.year === '2024-25');
  if (!cpi2024) {
    errors.push('New CPI row for 2024-25 not found');
  } else {
    const tol = 0.001;
    const expected = 192.616667;
    if (Math.abs((cpi2024.combined ?? NaN) - expected) > tol) {
      errors.push(`New CPI 2024-25 combined: expected ${expected}, got ${cpi2024.combined}`);
    }
  }

  // 3. New CPI 2011-12 rural must be 92.8.
  const cpi2011 = series.new_cpi.data.find(r => r.year === '2011-12');
  if (!cpi2011) {
    errors.push('New CPI row for 2011-12 not found');
  } else if (cpi2011.rural !== 92.8) {
    errors.push(`New CPI 2011-12 rural: expected 92.8, got ${cpi2011.rural}`);
  }

  // 4. CPI-IW base 2001=100, year 2012-13, general index must be 215.
  const iw2012 = series.cpi_iw.data.find(r => r.year === '2012-13' && r.base === '2001=100');
  if (!iw2012) {
    errors.push('CPI-IW row for 2012-13 (base 2001=100) not found');
  } else if (iw2012.general !== 215) {
    errors.push(`CPI-IW 2012-13 (base 2001=100) general: expected 215, got ${iw2012.general}`);
  }

  return errors;
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('consumer-price-index-annual-average self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'consumer-price-index-annual-average.json'),
    JSON.stringify(out),
  );

  const { cpi_al, cpi_iw, new_cpi } = out.series;
  console.log(
    `wrote CPI-AL ${cpi_al.data.length} rows ` +
    `(${cpi_al.data[0].year}→${cpi_al.data[cpi_al.data.length - 1].year}), ` +
    `CPI-IW ${cpi_iw.data.length} rows, ` +
    `New CPI ${new_cpi.data.length} rows ` +
    `(${new_cpi.data[0].year}→${new_cpi.data[new_cpi.data.length - 1].year}); ` +
    `self-check passed`,
  );
}

main();
