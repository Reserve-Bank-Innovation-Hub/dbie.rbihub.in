// Processor: union-government-accounts — Monthly RBI Bulletin Table 24.
//
// Source xlsx carries TWO sheets forming one continuous monthly series, newest-first:
//   "New Tab" (index 1): Jan 2026 backwards, 81 data rows.
//   "Old Tab" (index 0): Apr 2019 backwards, 154 data rows.
//
// Sheet layout (both):
//   row 0  blank
//   row 1  title "Union Government Accounts at a Glance"
//   row 3  "(Rupees Crores)"
//   row 5  14 group headers (col 1 = Month label)
//   row 6  Actual / Budget Estimates / Revised Estimates sub-headers
//   row 7… data rows (month label in col 1, e.g. "Jan 2026")
//
// Column offsets per group (0-indexed):
//   New Tab — clean, 3 cols per group:
//     rr[2,3,4]  tax[5,6,7]  ntr[8,9,10]  ndcr[11,12,13]  recovery[14,15,16]
//     other[17,18,19]  receipts[20,21,22]  revexp[23,24,25]  interest[26,27,28]
//     capexp[29,30,31]  totalexp[32,33,34]  rd[35,36,37]  fd[38,39,40]  gpd[41,42,?]
//
//   Old Tab — ghost null at col 9 under "1.2 Non-Tax Revenue" → every group at index ≥ 11 is +1:
//     rr[2,3,4]  tax[5,6,7]  ntr[8,10,11]  ndcr[12,13,14]  recovery[15,16,17]
//     other[18,19,20]  receipts[21,22,23]  revexp[24,25,26]  interest[27,28,29]
//     capexp[30,31,32]  totalexp[33,34,35]  rd[36,37,38]  fd[39,40,41]  gpd[42,43,?]
//
// Merge: New Tab rows first (newest), then Old Tab rows; deduplicate on month label.
// Many BE/RE cells are blank or "-" → null (parseNum). Values can be negative.
//
// Emits (newest-first):
//   out/union-government-accounts.json
//     { reportTitle, unit, data: [{ month, rr_actual, rr_be, rr_re, … }] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-24-union-government-accounts-at-a-glance.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,23,456" → 123456. Returns null for blank/dash/N/A so gaps stay distinct from real zeros.
// Handles negative values like "-6,895".
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Jan 2026" → true; used to detect data rows.
function isMonthLabel(s) {
  return /^[A-Z][a-z]{2} \d{4}$/.test(String(s == null ? '' : s).trim());
}

// Convert "Jan 2026" to a sortable integer (YYYYMM) for ordering.
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                 Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function monthToNum(label) {
  const m = label.match(/^([A-Z][a-z]{2}) (\d{4})$/);
  if (!m) return 0;
  return parseInt(m[2], 10) * 100 + (MONTHS[m[1]] || 0);
}

// Extract one row from New Tab (clean layout, 3 cols per group from col 2).
function extractNewTabRow(row) {
  return {
    month          : String(row[1] || '').trim(),
    rr_actual      : parseNum(row[2]),
    rr_be          : parseNum(row[3]),
    rr_re          : parseNum(row[4]),
    tax_actual     : parseNum(row[5]),
    tax_be         : parseNum(row[6]),
    tax_re         : parseNum(row[7]),
    ntr_actual     : parseNum(row[8]),
    ntr_be         : parseNum(row[9]),
    ntr_re         : parseNum(row[10]),
    ndcr_actual    : parseNum(row[11]),
    ndcr_be        : parseNum(row[12]),
    ndcr_re        : parseNum(row[13]),
    recovery_actual: parseNum(row[14]),
    recovery_be    : parseNum(row[15]),
    recovery_re    : parseNum(row[16]),
    other_actual   : parseNum(row[17]),
    other_be       : parseNum(row[18]),
    other_re       : parseNum(row[19]),
    receipts_actual: parseNum(row[20]),
    receipts_be    : parseNum(row[21]),
    receipts_re    : parseNum(row[22]),
    revexp_actual  : parseNum(row[23]),
    revexp_be      : parseNum(row[24]),
    revexp_re      : parseNum(row[25]),
    interest_actual: parseNum(row[26]),
    interest_be    : parseNum(row[27]),
    interest_re    : parseNum(row[28]),
    capexp_actual  : parseNum(row[29]),
    capexp_be      : parseNum(row[30]),
    capexp_re      : parseNum(row[31]),
    totalexp_actual: parseNum(row[32]),
    totalexp_be    : parseNum(row[33]),
    totalexp_re    : parseNum(row[34]),
    rd_actual      : parseNum(row[35]),
    rd_be          : parseNum(row[36]),
    rd_re          : parseNum(row[37]),
    fd_actual      : parseNum(row[38]),
    fd_be          : parseNum(row[39]),
    fd_re          : parseNum(row[40]),
    gpd_actual     : parseNum(row[41]),
    gpd_be         : parseNum(row[42]),
    gpd_re         : parseNum(row[43]),
  };
}

// Extract one row from Old Tab (ghost null at col 9 → "1.2 Non-Tax Revenue" group is [8,10,11]
// and every subsequent group is shifted +1 relative to New Tab).
function extractOldTabRow(row) {
  return {
    month          : String(row[1] || '').trim(),
    rr_actual      : parseNum(row[2]),
    rr_be          : parseNum(row[3]),
    rr_re          : parseNum(row[4]),
    tax_actual     : parseNum(row[5]),
    tax_be         : parseNum(row[6]),
    tax_re         : parseNum(row[7]),
    ntr_actual     : parseNum(row[8]),   // col 9 is ghost null
    ntr_be         : parseNum(row[10]),
    ntr_re         : parseNum(row[11]),
    ndcr_actual    : parseNum(row[12]),
    ndcr_be        : parseNum(row[13]),
    ndcr_re        : parseNum(row[14]),
    recovery_actual: parseNum(row[15]),
    recovery_be    : parseNum(row[16]),
    recovery_re    : parseNum(row[17]),
    other_actual   : parseNum(row[18]),
    other_be       : parseNum(row[19]),
    other_re       : parseNum(row[20]),
    receipts_actual: parseNum(row[21]),
    receipts_be    : parseNum(row[22]),
    receipts_re    : parseNum(row[23]),
    revexp_actual  : parseNum(row[24]),
    revexp_be      : parseNum(row[25]),
    revexp_re      : parseNum(row[26]),
    interest_actual: parseNum(row[27]),
    interest_be    : parseNum(row[28]),
    interest_re    : parseNum(row[29]),
    capexp_actual  : parseNum(row[30]),
    capexp_be      : parseNum(row[31]),
    capexp_re      : parseNum(row[32]),
    totalexp_actual: parseNum(row[33]),
    totalexp_be    : parseNum(row[34]),
    totalexp_re    : parseNum(row[35]),
    rd_actual      : parseNum(row[36]),
    rd_be          : parseNum(row[37]),
    rd_re          : parseNum(row[38]),
    fd_actual      : parseNum(row[39]),
    fd_be          : parseNum(row[40]),
    fd_re          : parseNum(row[41]),
    gpd_actual     : parseNum(row[42]),
    gpd_be         : parseNum(row[43]),
    gpd_re         : null,               // col 44 absent in Old Tab
  };
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length < 2) throw new Error('expected 2 sheets, found ' + wb.SheetNames.length);

  const toRows = (name) =>
    XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header    : 1,
      raw       : false,
      defval    : null,
      blankrows : true,
    });

  // New Tab is newest data; Old Tab is older data.
  const newRows = toRows('New Tab');
  const oldRows = toRows('Old Tab');

  const newData = [];
  for (const row of newRows) {
    if (!row || !isMonthLabel(row[1])) continue;
    newData.push(extractNewTabRow(row));
  }

  const oldData = [];
  for (const row of oldRows) {
    if (!row || !isMonthLabel(row[1])) continue;
    oldData.push(extractOldTabRow(row));
  }

  // Merge: New Tab takes precedence. Build a set of months from New Tab, skip duplicates from Old Tab.
  const seen = new Set(newData.map((r) => r.month));
  const merged = [...newData];
  for (const r of oldData) {
    if (!seen.has(r.month)) {
      seen.add(r.month);
      merged.push(r);
    }
  }

  // Sort newest-first by parsed YYYYMM.
  merged.sort((a, b) => monthToNum(b.month) - monthToNum(a.month));

  if (merged.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle : 'Union Government Accounts at a Glance',
    unit        : 'Rupees Crores',
    data        : merged,
  };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 230) {
    errors.push(`expected ≥230 rows, got ${data ? data.length : 'n/a'}`);
  }

  // Months must be unique.
  const months = data.map((r) => r.month);
  const uniq = new Set(months);
  if (uniq.size !== months.length) {
    errors.push(`months not unique: ${months.length} rows, ${uniq.size} distinct`);
  }

  // Must be newest-first.
  for (let i = 1; i < months.length; i++) {
    if (monthToNum(months[i - 1]) <= monthToNum(months[i])) {
      errors.push(`not strictly newest-first at row ${i}: ${months[i - 1]} then ${months[i]}`);
      break;
    }
  }

  // First row must be "Jan 2026".
  if (months[0] !== 'Jan 2026') {
    errors.push(`expected first row = "Jan 2026", got "${months[0]}"`);
  }

  // Known anchor values (tolerates rounding in source; exact match on integer values).
  const anchors = [
    {
      month : 'Jan 2026',
      checks: [
        ['rr_actual',      2651525],
        ['fd_actual',      981407],
        ['gpd_actual',     -6895],
        ['revexp_actual',  2847780],
        ['interest_actual',988302],
      ],
    },
    {
      month : 'Apr 2019',
      checks: [
        ['rr_actual',  94930],
        ['tax_actual', 71637],
        ['ntr_actual', 23293],
        ['ntr_be',     272647],
        ['ntr_re',     245276],
      ],
    },
  ];

  for (const { month, checks } of anchors) {
    const row = data.find((r) => r.month === month);
    if (!row) { errors.push(`anchor month missing: ${month}`); continue; }
    for (const [field, expected] of checks) {
      const got = row[field];
      if (got !== expected) {
        errors.push(`${month} ${field}: expected ${expected}, got ${got}`);
      }
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('union-government-accounts self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'union-government-accounts.json'),
    JSON.stringify(out),
  );

  const newest = out.data[0].month;
  const oldest = out.data[out.data.length - 1].month;
  console.log(
    `wrote ${out.data.length} monthly rows ` +
    `(newest ${newest}, oldest ${oldest}); self-check passed`,
  );
}

main();
