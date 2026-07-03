// Processor: usd-sale-purchase — RBI Monthly Bulletin Table 4.
//
// Source xlsx carries three sheets, all monthly with month and year in separate
// columns (col 1 = "January", col 2 = "2026"), newest-first.
//
// Sheet 0 — "Sale/Purchase of USD by RBI" (outright):
//   row 1    : title
//   row 3    : headers
//   row 4    : sub-headers (cumulative columns)
//   rows 5…  : data (newest-first), ~368 rows January 2026 → June 1995
//   last row : footnote text
//   cols (0-indexed): 1=month 2=year 3=net_usd_mn 4=purchase_usd_mn 5=sale_usd_mn
//                     6=inr_crore_equivalent 7=cumulative_usd_mn 8=cumulative_inr_crore
//
// Sheet 1 — "Operations in currency forwards":
//   row 3    : headers
//   rows 4…  : data, ~136 rows
//   cols: 1=month 2=year 3=net_usd_mn 4=purchase_usd_mn 5=sale_usd_mn
//   Values have commas ("2,593").
//
// Sheet 2 — "Maturity Breakdown of Outstanding Forwards":
//   rows 3–4 : two-row headers (group + long/short/net)
//   rows 5…  : data, ~129 rows
//   cols: 1=month 2=year
//         3=m1_long 4=m1_short 5=m1_net (up to 1 month)
//         6=m3_long 7=m3_short 8=m3_net (1–3 months)
//         9=m12_long 10=m12_short 11=m12_net (3 months–1 year)
//         cols 12–16: more-than-1-year bucket and total — excluded per spec
//
// "-" → null throughout.
//
// Emits:
//   out/usd-sale-purchase.json
//     { reportTitle, notes, outright, forwards, forwards_maturity }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC  = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/rbi/table-04-sale-purchase-of-us-dollar-by-the-rbi.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

const MONTHS = new Set([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]);

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456.7" or "-9,475" → number. Returns null for blank/dash/N/A.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function isMonthRow(row) {
  return MONTHS.has(cellStr(row, 1).trim());
}

function monthLabel(row) {
  return `${cellStr(row, 1).trim()} ${cellStr(row, 2).trim()}`;
}

// Sheet 0: outright sale/purchase
function parseOutright(rows) {
  const data  = [];
  let   notes = '';

  for (const row of rows) {
    const first = cellStr(row, 1).trim();
    if (MONTHS.has(first)) {
      data.push({
        month                 : monthLabel(row),
        net_usd_mn            : parseNum(row[3]),
        purchase_usd_mn       : parseNum(row[4]),
        sale_usd_mn           : parseNum(row[5]),
        inr_crore_equivalent  : parseNum(row[6]),
        cumulative_usd_mn     : parseNum(row[7]),
        cumulative_inr_crore  : parseNum(row[8]),
      });
    } else if (first.startsWith('(+)') || /Implies Purchase/i.test(first)) {
      // Footnote row — capture its full text.
      notes = first.trim();
    }
  }

  return { data, notes };
}

// Sheet 1: operations in currency forwards
function parseForwards(rows) {
  const data = [];

  for (const row of rows) {
    if (!isMonthRow(row)) continue;
    data.push({
      month            : monthLabel(row),
      net_usd_mn       : parseNum(row[3]),
      purchase_usd_mn  : parseNum(row[4]),
      sale_usd_mn      : parseNum(row[5]),
    });
  }

  return data;
}

// Sheet 2: maturity breakdown of outstanding forwards
function parseForwardsMaturity(rows) {
  const data = [];

  for (const row of rows) {
    if (!isMonthRow(row)) continue;
    data.push({
      month     : monthLabel(row),
      m1_long   : parseNum(row[3]),
      m1_short  : parseNum(row[4]),
      m1_net    : parseNum(row[5]),
      m3_long   : parseNum(row[6]),
      m3_short  : parseNum(row[7]),
      m3_net    : parseNum(row[8]),
      m12_long  : parseNum(row[9]),
      m12_short : parseNum(row[10]),
      m12_net   : parseNum(row[11]),
    });
  }

  return data;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length < 3) throw new Error(`expected ≥3 sheets, got ${wb.SheetNames.length}`);

  const opts = { header: 1, raw: false, defval: null, blankrows: true };

  const rows0 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], opts);
  const rows1 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], opts);
  const rows2 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[2]], opts);

  // Title from sheet 0 row 1 col 1.
  const reportTitle = cellStr(rows0[1] || [], 1).trim()
    || 'Sale/Purchase of U.S. Dollar by the Reserve Bank of India';

  const { data: outright, notes } = parseOutright(rows0);
  const forwards                  = parseForwards(rows1);
  const forwards_maturity         = parseForwardsMaturity(rows2);

  return { reportTitle, notes, outright, forwards, forwards_maturity };
}

// --- self-check: fail loudly if shape or known cells drift ---
function selfCheck(out) {
  const { outright, forwards, forwards_maturity } = out;
  const errors = [];

  // Row count assertions.
  if (!Array.isArray(outright) || outright.length < 360) {
    errors.push(`outright: expected ≥360 rows, got ${outright ? outright.length : 'n/a'}`);
  }
  if (!Array.isArray(forwards) || forwards.length < 130) {
    errors.push(`forwards: expected ≥130 rows, got ${forwards ? forwards.length : 'n/a'}`);
  }
  if (!Array.isArray(forwards_maturity) || forwards_maturity.length < 120) {
    errors.push(`forwards_maturity: expected ≥120 rows, got ${forwards_maturity ? forwards_maturity.length : 'n/a'}`);
  }

  // Uniqueness checks.
  for (const [arr, name] of [[outright, 'outright'], [forwards, 'forwards'], [forwards_maturity, 'forwards_maturity']]) {
    if (!Array.isArray(arr)) continue;
    const months = arr.map(r => r.month);
    if (new Set(months).size !== months.length) {
      errors.push(`${name}: months not unique`);
    }
  }

  // Outright known anchors.
  const jan26 = outright.find(r => r.month === 'January 2026');
  if (!jan26) {
    errors.push('outright: missing January 2026');
  } else {
    if (jan26.net_usd_mn !== 2526)    errors.push(`outright Jan 2026 net_usd_mn: expected 2526, got ${jan26.net_usd_mn}`);
    if (jan26.purchase_usd_mn !== 27999) errors.push(`outright Jan 2026 purchase_usd_mn: expected 27999, got ${jan26.purchase_usd_mn}`);
    if (jan26.cumulative_usd_mn !== -50783) errors.push(`outright Jan 2026 cumulative_usd_mn: expected -50783, got ${jan26.cumulative_usd_mn}`);
  }

  const jun95 = outright.find(r => r.month === 'June 1995');
  if (!jun95) {
    errors.push('outright: missing June 1995');
  } else {
    if (jun95.net_usd_mn !== 36) errors.push(`outright Jun 1995 net_usd_mn: expected 36, got ${jun95.net_usd_mn}`);
    if (Math.abs((jun95.inr_crore_equivalent || 0) - 112.93) > 0.01) {
      errors.push(`outright Jun 1995 inr_crore_equivalent: expected 112.93, got ${jun95.inr_crore_equivalent}`);
    }
  }

  // Forwards known anchors.
  const fJan26 = forwards.find(r => r.month === 'January 2026');
  if (!fJan26) {
    errors.push('forwards: missing January 2026');
  } else {
    if (fJan26.net_usd_mn !== null)     errors.push(`forwards Jan 2026 net_usd_mn: expected null, got ${fJan26.net_usd_mn}`);
    if (fJan26.purchase_usd_mn !== 2593) errors.push(`forwards Jan 2026 purchase_usd_mn: expected 2593, got ${fJan26.purchase_usd_mn}`);
    if (fJan26.sale_usd_mn !== 2593)     errors.push(`forwards Jan 2026 sale_usd_mn: expected 2593, got ${fJan26.sale_usd_mn}`);
  }

  // Forwards maturity known anchors.
  const mJan26 = forwards_maturity.find(r => r.month === 'January 2026');
  if (!mJan26) {
    errors.push('forwards_maturity: missing January 2026');
  } else {
    if (mJan26.m1_long !== 650)    errors.push(`forwards_maturity Jan 2026 m1_long: expected 650, got ${mJan26.m1_long}`);
    if (mJan26.m1_net !== -9475)   errors.push(`forwards_maturity Jan 2026 m1_net: expected -9475, got ${mJan26.m1_net}`);
    if (mJan26.m12_net !== -10135) errors.push(`forwards_maturity Jan 2026 m12_net: expected -10135, got ${mJan26.m12_net}`);
  }

  // Newest-first ordering (first month label should sort after last).
  for (const [arr, name] of [[outright, 'outright'], [forwards, 'forwards'], [forwards_maturity, 'forwards_maturity']]) {
    if (!Array.isArray(arr) || arr.length < 2) continue;
    // Compare by parsing "Month YYYY" → Date for ordering check.
    const toTs = (m) => new Date(m).getTime();
    if (toTs(arr[0].month) <= toTs(arr[arr.length - 1].month)) {
      errors.push(`${name}: not newest-first (${arr[0].month} ≤ ${arr[arr.length - 1].month})`);
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('usd-sale-purchase self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'usd-sale-purchase.json'),
    JSON.stringify(out),
  );

  const { outright, forwards, forwards_maturity } = out;
  console.log(
    `wrote outright=${outright.length} rows (${outright[0].month} → ${outright[outright.length - 1].month}), ` +
    `forwards=${forwards.length} rows (${forwards[0].month} → ${forwards[forwards.length - 1].month}), ` +
    `forwards_maturity=${forwards_maturity.length} rows (${forwards_maturity[0].month} → ${forwards_maturity[forwards_maturity.length - 1].month}); ` +
    `self-check passed`,
  );
}

main();
