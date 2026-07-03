// Processor: wholesale-price-index-annual-average — Handbook of Statistics on Indian Economy.
//
// Source xlsx carries one sheet ("Report 1") with the annual-average wholesale
// price index (base 2011-12 = 100) from 2025-26 back to 1952-53. Layout:
//   row 1  title "Wholesale Price Index - Annual Average"
//   row 3  base note "(Base : 2011-12 = 100)"
//   row 5  column headers: Year | AC | PA | "of which" (span for FA/NF) | F&P | MP
//   row 6  sub-header: FA | NF (under "of which")
//   row 7  column numbers 1-7
//   rows 8… data (newest-first)
//   row 129 blank
//   row 130 abbreviation footnote
//
// Column mapping (0-indexed within each row array):
//   col[1] = year  col[2] = AC  col[3] = PA  col[4] = FA
//   col[5] = NF    col[6] = F&P  col[7] = MP
//
// Emits (newest-first):
//   out/wholesale-price-index-annual-average.json
//     { reportTitle, base, note, data: [{ year, ac, pa, fa, nf, fp, mp } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/handbook-statistics-on-indian-economy/annual-series/output-and-prices/Wholesale Price Index - Annual Average.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456.7" → 123456.7. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2024-25" → true; used to detect data rows.
function isYearLabel(s) {
  return /^\d{4}-\d{2}$/.test(s.trim());
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Extract metadata from the fixed header rows.
  let reportTitle = cellStr(rows[1] || [], 1).trim()
    || 'Wholesale Price Index - Annual Average';
  let base = 'Base: 2011-12 = 100';
  let note = '';

  // Row 3 carries the base note (e.g. "(Base : 2011-12 = 100)").
  const baseRow = rows[3] || [];
  for (let ci = 0; ci < baseRow.length; ci++) {
    const v = cellStr(baseRow, ci).trim();
    if (/2011/.test(v)) {
      // Strip surrounding parentheses if present and normalise spaces.
      base = v.replace(/^\(|\)$/g, '').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Scan the last few rows for the abbreviations footnote.
  for (let i = rows.length - 1; i >= Math.max(0, rows.length - 5); i--) {
    const row = rows[i] || [];
    for (let ci = 0; ci < row.length; ci++) {
      const v = cellStr(row, ci).trim();
      if (/AC\s*=|PA\s*=|FA\s*=|MP\s*=/i.test(v)) {
        note = v;
        break;
      }
    }
    if (note) break;
  }

  // Parse data rows — any row whose col[1] matches "YYYY-YY".
  // The sheet stacks older base-year sections below the primary 2011-12 one
  // (a second "(Base : 2004-05 = 100)" header follows the first block) — keep
  // only the primary series, matching the other handbook processors.
  const data = [];
  let seenData = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const first = cellStr(row, 1).trim();
    if (seenData && /^\(?\s*Base\s*:/i.test(first)) break;
    const year = first;
    if (!isYearLabel(year)) continue;
    seenData = true;

    data.push({
      year : year,
      ac   : parseNum(row[2]),
      pa   : parseNum(row[3]),
      fa   : parseNum(row[4]),
      nf   : parseNum(row[5]),
      fp   : parseNum(row[6]),
      mp   : parseNum(row[7]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, base, note, data };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  // Primary (2011-12 base) series only: 2012-13 onwards.
  if (!Array.isArray(data) || data.length < 13) {
    errors.push(`expected ≥13 annual rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    // 2025-26 (partial year — values averaged over available months)
    {
      year : '2025-26',
      ac   : 155.5,
      pa   : null, // accept any value — partial-year average may vary
      fa   : null,
      nf   : null,
      fp   : null,
      mp   : null,
      check: (r) => Math.abs(r.ac - 155.5) < 0.5,
      desc : '2025-26 AC ≈ 155.5',
    },
    // 2024-25
    {
      year : '2024-25',
      check: (r) => r.ac != null && Math.abs(r.ac - 154.858) < 0.5,
      desc : '2024-25 AC ≈ 154.86',
    },
    // 2012-13 — oldest year of the primary (2011-12 base) series
    {
      year : '2012-13',
      check: (r) => r.ac != null && Math.abs(r.ac - 106.9) < 0.05,
      desc : '2012-13 AC = 106.9',
    },
  ];

  for (const spec of known) {
    const row = data.find((r) => r.year === spec.year);
    if (!row) { errors.push(`known year missing: ${spec.year}`); continue; }
    if (spec.check && !spec.check(row)) {
      errors.push(`${spec.year}: self-check failed — ${spec.desc} (got ac=${row.ac}, nf=${row.nf})`);
    }
  }

  // Years must be unique.
  const years = data.map((r) => r.year);
  const uniq = new Set(years);
  if (uniq.size !== years.length) {
    errors.push(`years not unique: ${years.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending — "2025-26" > "2024-25" lexicographically).
  for (let i = 1; i < years.length; i++) {
    if (years[i - 1] <= years[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${years[i - 1]} then ${years[i]}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('wholesale-price-index-annual-average self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'wholesale-price-index-annual-average.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} annual rows ` +
    `(newest ${out.data[0].year}, oldest ${out.data[out.data.length - 1].year}; ` +
    `base ${out.base}); self-check passed`,
  );
}

main();
