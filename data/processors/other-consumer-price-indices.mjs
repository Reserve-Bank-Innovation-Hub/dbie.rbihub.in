// Other consumer price indices processor — Monthly RBI Bulletin, Table 20.
// Reads the "Other Consumer Price Indices" .xlsx and emits
// out/other-consumer-price-indices.json.
//
// Sheet shape (single sheet, ~699 rows):
//   row 1  : "Other Consumer Price Indices"          (title)
//   row 3  : group headers spanning columns —
//            "1 Consumer Price Index for Industrial Workers"  (cols 2–6)
//            "2 Consumer Price Index for Agricultural Labourers" (cols 7–8)
//            "3 Consumer Price Index for Rural Labourers"        (col 9)
//   row 4  : "Base Year"     per series (2016 = 100, 2001, 1986-87, 1982, 1960,
//                                        2019 = 100, 1986-87, 2019 = 100)
//   row 5  : "Linking Factor" per series
//   rows 6+: month rows, newest-first ("Feb. 2026" … "Aug. 1968"),
//            with "-" for series not published that month
//   tail   : a "Source:" line
//
// Model:
//   series : [{ key, group, baseYear, linkingFactor }]  (8 series, column order)
//   months : ["2026-02", …]                              (newest-first, ISO year-month)
//   data   : [{ month, monthLabel, values: { <seriesKey>: number | null } }]
//
// parseNumber mirrors the house helper used by the other processors: strip commas,
// treat "", "-", "N/A" as unpublished (-> null here), non-numeric -> null.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '..', 'publications', 'monthly-rbi-bulletin', 'prices-and-production',
  'table-20-other-consumer-price-indices.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT = path.join(OUT_DIR, 'other-consumer-price-indices.json');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The 8 data series, in sheet column order. `col` is the 0-based column index in
// the header:1 row array; `group` is the sub-table each belongs to.
const SERIES = [
  { key: 'cpiIW_2016',    col: 2, group: 'Consumer Price Index for Industrial Workers' },
  { key: 'cpiIW_2001',    col: 3, group: 'Consumer Price Index for Industrial Workers' },
  { key: 'cpiIW_1986_87', col: 4, group: 'Consumer Price Index for Industrial Workers' },
  { key: 'cpiIW_1982',    col: 5, group: 'Consumer Price Index for Industrial Workers' },
  { key: 'cpiIW_1960',    col: 6, group: 'Consumer Price Index for Industrial Workers' },
  { key: 'cpiAL_2019',    col: 7, group: 'Consumer Price Index for Agricultural Labourers' },
  { key: 'cpiAL_1986_87', col: 8, group: 'Consumer Price Index for Agricultural Labourers' },
  { key: 'cpiRL_2019',    col: 9, group: 'Consumer Price Index for Rural Labourers' },
];

// Strip commas; "", "-", "N/A" and anything non-numeric become null (unpublished).
function parseNumber(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function cellStr(row, i) {
  const v = row == null ? null : row[i];
  return v == null ? '' : String(v).trim();
}

// "Feb. 2026" -> "2026-02"; returns null if not a recognisable month label.
function monthToISO(label) {
  const m = String(label).match(/([A-Za-z]{3})[a-z]*\.?\s*(\d{4})/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1].slice(0, 3));
  if (idx < 0) return null;
  return `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
}

function build() {
  const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null, blankrows: true });

  const reportTitle = cellStr(rows[1], 1) || 'Other Consumer Price Indices';

  // Base Year / Linking Factor live on rows index 4 and 5.
  const baseYearRow = rows[4] || [];
  const linkingRow = rows[5] || [];
  const series = SERIES.map((s) => ({
    key           : s.key,
    group         : s.group,
    baseYear      : cellStr(baseYearRow, s.col),
    linkingFactor : parseNumber(linkingRow[s.col]),
  }));

  // Month rows start at index 6; stop at the source line / blanks.
  const data = [];
  const seen = new Set();
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const label = cellStr(row, 1);
    if (label === '') continue;
    const iso = monthToISO(label);
    if (!iso) continue; // Source: line and any stray non-month rows
    if (seen.has(iso)) throw new Error(`duplicate month ${iso} (label "${label}") at row ${i}`);
    seen.add(iso);

    const values = {};
    for (const s of SERIES) values[s.key] = parseNumber(row[s.col]);
    data.push({ month: iso, monthLabel: label, values });
  }

  const months = data.map((d) => d.month);
  return { data, series, months, reportTitle };
}

// ---- self-check: fail loudly (non-zero exit) if the shape or known cells drift ----
function selfCheck(result) {
  const errors = [];
  const { data, series, months } = result;

  if (series.length !== 8) errors.push(`expected 8 series, got ${series.length}`);
  if (data.length < 600) errors.push(`expected >=600 month rows, got ${data.length}`);

  // Months must be unique and strictly descending (newest-first).
  if (new Set(months).size !== months.length) errors.push('months are not unique');
  for (let i = 1; i < months.length; i++) {
    if (!(months[i] < months[i - 1])) {
      errors.push(`months not strictly descending at ${months[i - 1]} -> ${months[i]}`);
      break;
    }
  }

  // Base years / linking factors of the headline and CPI-AL series.
  const byKey = Object.fromEntries(series.map((s) => [s.key, s]));
  if (byKey.cpiIW_2016?.baseYear !== '2016 = 100') errors.push(`cpiIW_2016 baseYear = ${byKey.cpiIW_2016?.baseYear}`);
  if (byKey.cpiIW_2016?.linkingFactor !== 2.88) errors.push(`cpiIW_2016 linkingFactor = ${byKey.cpiIW_2016?.linkingFactor}`);
  if (byKey.cpiAL_2019?.linkingFactor !== 9.69) errors.push(`cpiAL_2019 linkingFactor = ${byKey.cpiAL_2019?.linkingFactor}`);

  const byMonth = Object.fromEntries(data.map((d) => [d.month, d]));

  // ≥3 known cells asserted against the source workbook.
  const assertCell = (month, key, want) => {
    const got = byMonth[month]?.values?.[key];
    if (got !== want) errors.push(`${month}/${key}: expected ${want}, got ${got}`);
  };
  assertCell('2026-02', 'cpiIW_2016', 148.5);        // newest CPI-IW (2016=100)
  assertCell('2026-02', 'cpiAL_2019', 136.57);       // newest CPI-AL (2019=100)
  assertCell('2026-02', 'cpiRL_2019', 136.51);       // newest CPI-RL (2019=100)
  assertCell('2025-05', 'cpiAL_1986_87', 1305.0);    // comma-stripped "1,305.0"
  assertCell('1968-08', 'cpiIW_1960', 178.0);        // oldest row, 1960-base series

  // "-" cells must be null, not 0.
  if (byMonth['2026-02']?.values?.cpiIW_2001 !== null) {
    errors.push(`2026-02/cpiIW_2001 should be null (unpublished), got ${byMonth['2026-02']?.values?.cpiIW_2001}`);
  }

  if (errors.length) {
    console.error('self-check FAILED:');
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
}

function main() {
  const result = build();
  selfCheck(result);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result));
  console.log(
    `wrote ${result.data.length} month rows, ${result.series.length} series -> ${OUT} ` +
    `(newest ${result.months[0]}, oldest ${result.months[result.months.length - 1]}); self-check passed`,
  );
}

main();
