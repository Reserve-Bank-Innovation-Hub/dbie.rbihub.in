// Processor: nri-deposits (monthly) — RBI Bulletin Table 34.
//
// Source xlsx layout (sheet "Monthly", A1:I384):
//   row 2  title: "NRI Deposits - Outstandings and Inflows(+) / Outflows(-)"
//   row 4  units: "(US$ Millions)"
//   row 6  top-level column groups: "Outstanding" (cols C–F) / "Inflows (+)/ Outflows (-)" (cols G–I)
//   row 7  sub-columns:
//             B  = Month label (e.g. "Jan.", "Feb.")
//             C  = 1 NRI Deposits    (outstanding total)
//             D  = 1.1 FCNR(B)       (outstanding)
//             E  = 1.2 NR(E)RA       (outstanding)
//             F  = 1.3 NRO           (outstanding)
//             G  = 1 NRI Deposits    (flows total)
//             H  = 1.4 FCNR(B)       (flows)
//             I  = 1.5 NR(E)RA       (flows)
//   fiscal-year header rows: e.g. "2025-26   " (col B, cols C–I null)
//   data rows: month abbreviation in col B, values in cols C–I
//   footer notes in last row
//
// Notes:
//   - NRO flows column (would be col J) is absent from the source — only FCNR(B)
//     and NR(E)RA flows are published.
//   - Older rows (pre-FCNR(B) introduction in May 1993) may have nulls in the
//     FCNR(B) column; NRO data is absent before a certain year.
//
// Emits (newest-first):
//   out/nri-deposits.json
//     { reportTitle, unit, data: [{ month, fiscal_year,
//       outstanding_total, outstanding_fcnrb, outstanding_nrera, outstanding_nro,
//       flows_total, flows_fcnrb, flows_nrera } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-34-nri-deposits.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month-name index for building sortable keys.
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Apr." / "Apr" → 0-based month index. Returns -1 if not recognised.
function monthIndex(s) {
  const clean = String(s ?? '').trim().replace(/\.$/, '');
  return MONTH_ABBR.findIndex(m => m.toLowerCase() === clean.toLowerCase());
}

// Build a sortable "YYYY-MM" key from a fiscal-year string and month abbreviation.
// Indian fiscal year runs Apr–Mar. "2025-26" + "Apr." → "2025-04".
// "2025-26" + "Jan." → "2026-01".
function monthKey(fiscalYear, monthAbbr) {
  const mi = monthIndex(monthAbbr);
  if (mi < 0) return null;

  // Parse the starting year of the fiscal year (e.g. "2025" from "2025-26").
  const m = String(fiscalYear).trim().match(/^(\d{4})-\d{2}/);
  if (!m) return null;
  const fyStart = Number(m[1]);

  // Apr (3) through Mar (2): months 0–2 (Jan–Mar) belong to fyStart+1.
  const calYear = mi <= 2 ? fyStart + 1 : fyStart;
  return `${calYear}-${String(mi + 1).padStart(2, '0')}`;
}

function parseNum(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === '..' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Detect whether a row is a fiscal-year header (col B matches "YYYY-YY" pattern,
// cols C–H are all null/empty).
function isFyRow(row) {
  if (row == null) return false;
  const b = String(row[1] ?? '').trim();
  if (!/^\d{4}-\d{2}/.test(b)) return false;
  // All value columns should be null for a header row.
  for (let c = 2; c <= 8; c++) {
    if (row[c] != null) return false;
  }
  return true;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets in workbook');

  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header    : 1,
    raw       : true,
    defval    : null,
    blankrows : true,
  });

  // Derive title from row 2 (index 1) and unit from row 4 (index 3).
  const reportTitle = String(rows[1]?.[1] ?? 'NRI Deposits - Outstandings and Inflows(+) / Outflows(-)').trim();
  const unit        = String(rows[3]?.[1] ?? 'US$ Millions').replace(/[()]/g, '').trim();

  // Data starts at row index 7 (row 8 in 1-based).
  const DATA_START = 7;
  const data = [];
  let currentFy = '';

  for (let i = DATA_START; i < rows.length; i++) {
    const row = rows[i] || [];

    if (isFyRow(row)) {
      currentFy = String(row[1]).trim();
      continue;
    }

    // Detect footer / notes row.
    const b = String(row[1] ?? '').trim();
    if (/^Notes?:/i.test(b) || b === '') continue;

    // Check it looks like a month abbreviation.
    if (monthIndex(b) < 0) continue;

    const key = monthKey(currentFy, b);
    if (!key) continue;

    data.push({
      month               : key,
      fiscal_year         : currentFy,
      outstanding_total   : parseNum(row[2]),
      outstanding_fcnrb   : parseNum(row[3]),
      outstanding_nrera   : parseNum(row[4]),
      outstanding_nro     : parseNum(row[5]),
      flows_total         : parseNum(row[6]),
      flows_fcnrb         : parseNum(row[7]),
      flows_nrera         : parseNum(row[8]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found');

  return { reportTitle, unit, data };
}

// --- self-check ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 300) {
    errors.push(`expected ≥300 rows, got ${data?.length ?? 'n/a'}`);
  }

  // Months must be unique.
  const keys = data.map(r => r.month);
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`months not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] !== null && keys[i] !== null && keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at index ${i}: ${keys[i - 1]} then ${keys[i]}`);
      break;
    }
  }

  // Hard-coded cell assertions (read directly from source sheet):
  //   Jan 2025-26: outstanding_total = 165776.287224921, flows_fcnrb = -1097.517303435
  //   Mar 2024-25: outstanding_total = 164677.084051489, flows_total = 1604.889502576
  //   Apr 2024-25: outstanding_total = 153009.257014981
  const assertions = [
    { month: '2026-01', field: 'outstanding_total', expected: 165776.287224921 },
    { month: '2026-01', field: 'flows_fcnrb',       expected: -1097.517303435  },
    { month: '2025-03', field: 'outstanding_total', expected: 164677.084051489 },
    { month: '2025-03', field: 'flows_total',       expected: 1604.889502576   },
    { month: '2024-04', field: 'outstanding_total', expected: 153009.257014981 },
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
    console.error('nri-deposits self-check FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'nri-deposits.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} month rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}); ` +
    `self-check passed`,
  );
}

main();
