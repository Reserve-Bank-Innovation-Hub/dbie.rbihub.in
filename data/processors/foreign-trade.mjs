// Processor: foreign-trade (monthly) — RBI Bulletin Table 32.
//
// Source xlsx layout (sheet "Report 1", A1:T435):
//   row 2  title
//   row 4  item headers (cols D–T)
//   row 5  unit row: alternating "Rupees Crores" / "US $ Millions"
//   rows 6… data: col B = year (number, fills down per year), col C = date serial
//             (first day of month), cols D–T = 17 value columns
//
// Column mapping (0-indexed, col A=0):
//   idx 2  date serial  → YYYY-MM month key
//   idx 3  exports_inr  (₹ crore)
//   idx 4  exports_usd  (US$ mn)
//   idx 5  oil_exports_inr
//   idx 6  oil_exports_usd
//   idx 7  non_oil_exports_inr
//   idx 8  non_oil_exports_usd
//   idx 9  imports_inr
//   idx 10 imports_usd
//   idx 11 oil_imports_inr
//   idx 12 oil_imports_usd
//   idx 13 non_oil_imports_inr
//   idx 14 non_oil_imports_usd
//   idx 15 trade_balance_inr
//   idx 16 trade_balance_usd
//   idx 17 oil_trade_balance_inr
//   idx 18 oil_trade_balance_usd
//   idx 19 non_oil_trade_balance_inr  (last col; no paired USD)
//
// ".." cells are treated as null (data not available for the period).
//
// Emits (newest-first):
//   out/foreign-trade.json
//     { reportTitle, data: [{ month, exports_inr, exports_usd, oil_exports_inr,
//       oil_exports_usd, non_oil_exports_inr, non_oil_exports_usd, imports_inr,
//       imports_usd, oil_imports_inr, oil_imports_usd, non_oil_imports_inr,
//       non_oil_imports_usd, trade_balance_inr, trade_balance_usd,
//       oil_trade_balance_inr, oil_trade_balance_usd,
//       non_oil_trade_balance_inr } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-32-foreign-trade.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Returns null for blank, dash, "..", or non-numeric cells.
function parseNum(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '..' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Column C stores the last day of the calendar month preceding the data month
// (Excel convention: e.g. 2025-12-31 = January 2026 data). When the workbook is
// read with cellDates:true the serial is decoded to a JS Date; adding one day
// gives the correct first-of-data-month, from which we extract "YYYY-MM".
function dateToMonthKey(v) {
  if (v == null) return null;
  let d;
  if (v instanceof Date) {
    d = new Date(v.getTime() + 86_400_000); // add 1 day in ms
  } else if (typeof v === 'string') {
    const base = new Date(v);
    if (Number.isNaN(base.getTime())) return null;
    d = new Date(base.getTime() + 86_400_000);
  } else {
    return null;
  }
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  if (wb.SheetNames.length === 0) throw new Error('no sheets in workbook');

  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header    : 1,
    raw       : true,
    defval    : null,
    blankrows : true,
  });

  // Locate the units row (row 5 in 1-based = index 4), which starts the data
  // right after. Data rows begin at index 5.
  const DATA_START = 5;
  const data = [];

  for (let i = DATA_START; i < rows.length; i++) {
    const row = rows[i] || [];

    // col C (idx 2) holds the date for the month (decoded to a JS Date when
    // the workbook is read with cellDates:true).
    const month = dateToMonthKey(row[2]);
    if (!month) continue;

    data.push({
      month,
      exports_inr              : parseNum(row[3]),
      exports_usd              : parseNum(row[4]),
      oil_exports_inr          : parseNum(row[5]),
      oil_exports_usd          : parseNum(row[6]),
      non_oil_exports_inr      : parseNum(row[7]),
      non_oil_exports_usd      : parseNum(row[8]),
      imports_inr              : parseNum(row[9]),
      imports_usd              : parseNum(row[10]),
      oil_imports_inr          : parseNum(row[11]),
      oil_imports_usd          : parseNum(row[12]),
      non_oil_imports_inr      : parseNum(row[13]),
      non_oil_imports_usd      : parseNum(row[14]),
      trade_balance_inr        : parseNum(row[15]),
      trade_balance_usd        : parseNum(row[16]),
      oil_trade_balance_inr    : parseNum(row[17]),
      oil_trade_balance_usd    : parseNum(row[18]),
      non_oil_trade_balance_inr: parseNum(row[19]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle : 'Foreign Trade',
    data,
  };
}

// --- self-check: hard-coded cell assertions + ordering ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 400) {
    errors.push(`expected ≥400 rows, got ${data?.length ?? 'n/a'}`);
  }

  // Month key must be unique.
  const keys = data.map(r => r.month);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`months not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending keys).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] !== null && keys[i] !== null && keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at index ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  // Hard-coded cell assertions (read directly from source sheet):
  //   Jan 2026: exports_inr = 331262.6074313, exports_usd = 36483.027708, trade_balance_usd = -34741.79066
  //   Dec 2025: exports_usd = 38277.423736
  //   Apr 1990: exports_usd = 1435 (oldest row)
  const assertions = [
    { month: '2026-01', field: 'exports_inr',     expected: 331262.6074313 },
    { month: '2026-01', field: 'exports_usd',     expected: 36483.027708   },
    { month: '2026-01', field: 'trade_balance_usd', expected: -34741.79066 },
    { month: '2025-12', field: 'exports_usd',     expected: 38277.423736   },
    { month: '1990-04', field: 'exports_usd',     expected: 1435           },
  ];

  for (const { month, field, expected } of assertions) {
    const row = data.find(r => r.month === month);
    if (!row) {
      errors.push(`assertion: month ${month} not found`);
      continue;
    }
    const actual = row[field];
    if (actual !== expected) {
      errors.push(`assertion: ${month}.${field} — expected ${expected}, got ${actual}`);
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('foreign-trade self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'foreign-trade.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} month rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}); ` +
    `self-check passed`,
  );
}

main();
