// Port of backend/internal/parser/forex_reserves_parser.go (+ models/forex_reserves.go,
// service.GetForexReserves / GetForexReservesRecent) to a JS processor.
//
// Reads the weekly Foreign Exchange Reserves .xlsx and emits:
//   out/forex-reserves.json         (full parse)
//   out/forex-reserves-recent.json  (first 26 data records, other top-level fields preserved)
//
// The Go parser uses excelize's GetRows, which TRIMS trailing empty cells per row. SheetJS
// pads rows out, so we re-derive the excelize-style trimmed length and use it for the
// `len(row) > N` column guards. This trimming is load-bearing: it drops the year-marker rows
// ("2025-26" etc.) and the footnote row (which contains "August" -> matches the "Aug" date
// heuristic) because they only populate one column -> trimmed length < 3 -> skipped. That is
// why `year` is always "" and why the footnote row is not a bogus record.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '../sources/RBIB Table No. 32 _ Foreign Exchange Reserves - Weekly.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Mirror of the Go parseFloat helper (credit_classification_parser.go).
function parseFloat_(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const val = Number(s);
  if (!Number.isFinite(val)) return 0;
  return val;
}

// excelize GetRows trims trailing empty cells; reproduce that effective length.
function trimmedLen(row) {
  let n = row.length;
  while (n > 0 && (row[n - 1] == null || String(row[n - 1]) === '')) n--;
  return n;
}

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

function parseForexReserves(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheets = wb.SheetNames;
  if (sheets.length === 0) throw new Error('no sheets found in Excel file');
  const ws = wb.Sheets[sheets[0]];

  // raw:false -> formatted strings, matching excelize's rendered cell text ("6,146,082").
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  if (rows.length < 7) throw new Error('insufficient rows in file');

  // Report title: row 2 (index 1), col 1.
  let reportTitle = '';
  if (rows.length > 1 && (rows[1] || []).length > 1) {
    reportTitle = cellStr(rows[1], 1);
  }

  const months = ['Nov', 'Oct', 'Sep', 'Aug', 'Jul', 'Jun', 'May', 'Apr', 'Mar', 'Feb', 'Jan', 'Dec'];
  const data = [];
  let currentYear = '';

  // Data rows start at index 5.
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i] || [];
    const len = trimmedLen(row); // excelize-equivalent row length
    if (len < 3) continue;

    const col1 = cellStr(row, 1).trim();
    if (col1 === '') continue;

    const isDate = months.some((m) => col1.includes(m));
    if (!isDate) {
      currentYear = col1; // year marker (in practice never reached: markers trim to len < 3)
      continue;
    }

    const dataRow = {
      weekEnded: col1,
      year: currentYear,
      totalReservesINR: 0,
      totalReservesUSD: 0,
      foreignCurrencyINR: 0,
      foreignCurrencyUSD: 0,
      goldINR: 0,
      goldUSD: 0,
      goldVolumeMetricTonnes: 0,
      sdrsINR: 0,
      sdrsUSD: 0,
      rtpINR: 0,
      rtpUSD: 0,
    };

    if (len > 2) dataRow.totalReservesINR = parseFloat_(row[2]);
    if (len > 3) dataRow.totalReservesUSD = parseFloat_(row[3]);
    if (len > 4) dataRow.foreignCurrencyINR = parseFloat_(row[4]);
    if (len > 5) dataRow.foreignCurrencyUSD = parseFloat_(row[5]);
    if (len > 6) dataRow.goldINR = parseFloat_(row[6]);
    if (len > 7) dataRow.goldUSD = parseFloat_(row[7]);
    if (len > 8) dataRow.goldVolumeMetricTonnes = parseFloat_(row[8]);
    if (len > 9) dataRow.sdrsINR = parseFloat_(row[9]);
    if (len > 10) dataRow.sdrsUSD = parseFloat_(row[10]);
    if (len > 11) dataRow.rtpINR = parseFloat_(row[11]);
    if (len > 12) dataRow.rtpUSD = parseFloat_(row[12]);

    data.push(dataRow);
  }

  if (data.length === 0) throw new Error('no valid data found in file');

  return { data, reportTitle };
}

function main() {
  const buf = fs.readFileSync(SRC);
  const full = parseForexReserves(buf);

  // GetForexReservesRecent: first 26 records, other top-level fields preserved.
  const recentCount = Math.min(26, full.data.length);
  const recent = { data: full.data.slice(0, recentCount), reportTitle: full.reportTitle };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'forex-reserves.json'), JSON.stringify(full));
  fs.writeFileSync(path.join(OUT_DIR, 'forex-reserves-recent.json'), JSON.stringify(recent));

  console.log(`wrote ${full.data.length} records (recent ${recent.data.length})`);
}

main();
