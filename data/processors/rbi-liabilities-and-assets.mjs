// Processor: rbi-liabilities-and-assets — RBI Monthly Bulletin Table 2.
//
// Source xlsx carries one sheet ("Report 1") with weekly balance-sheet data
// for the Reserve Bank of India — issue department and banking department —
// from 03-Apr-2026 back to 02-Jul-2004, newest-first. Layout:
//   row 1  blank
//   row 2  title "Reserve Bank of India - Liabilities & Assets"
//   row 3  blank
//   row 4  "(Rupees Crores)"
//   row 5  blank
//   row 6  top-level section headers (spans)
//   row 7  sub-section headers (spans)
//   row 8  leaf column headers
//   rows 9–1142  data (weeks, newest-first)
//
// Column mapping (0-indexed within each row array):
//   col[1]  = week-ended date  "DD-Mon-YYYY"
//
//   Issue department:
//   col[2]  = notes_in_circulation
//   col[3]  = notes_in_banking_dept
//   col[4]  = issue_dept_total       (Total Notes Issued / Assets)
//   col[5]  = gold
//   col[6]  = foreign_securities
//   col[7]  = rupee_coin
//   col[8]  = goi_rupee_securities
//
//   Banking department — liabilities:
//   col[9]  = deposits               (total; often null in recent rows)
//   col[10] = dep_central_govt
//   col[11] = dep_mss
//   col[12] = dep_state_govts
//   col[13] = dep_scheduled_commercial_banks
//   col[14] = dep_scheduled_state_coop_banks
//   col[15] = dep_non_scheduled_state_coop_banks
//   col[16] = dep_other_banks
//   col[17] = dep_others
//   col[18] = dep_fi_outside_india
//   col[19] = other_liabilities
//   col[20] = banking_dept_total
//
//   Banking department — assets:
//   col[21] = notes_and_coins
//   col[22] = balances_held_abroad
//   col[23] = loans_and_advances     (total; some values carry commas e.g. "328,211")
//   col[24] = la_central_govt
//   col[25] = la_state_govts
//   col[26] = la_scheduled_commercial_banks
//   col[27] = la_scheduled_state_coop_banks
//   col[28] = la_idbi
//   col[29] = la_nabard
//   col[30] = la_exim_bank
//   col[31] = la_others
//   col[32] = la_fi_outside_india
//   col[33] = bills_purchased_discounted
//   col[34] = bills_internal
//   col[35] = bills_govt_treasury
//   col[36] = investments
//   col[37] = other_assets
//
// Emits (newest-first):
//   out/rbi-liabilities-and-assets.json
//     { reportTitle, unit, data: [{ week, notes_in_circulation, … } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/rbi/table-02-rbi-liabilities-and-assets.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456.78" → 123456.78. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "03-Apr-2026" → true; used to detect data rows.
const DATE_RE = /^\d{2}-[A-Z][a-z]{2}-\d{4}$/;
function isWeekDate(s) {
  return DATE_RE.test(s.trim());
}

// Parse "03-Apr-2026" to a comparable integer YYYYMMDD for ordering checks.
const MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
function dateToInt(s) {
  const [day, mon, year] = s.split('-');
  return parseInt(year, 10) * 10000 + (MONTHS[mon] || 0) * 100 + parseInt(day, 10);
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

  // Extract metadata from fixed header rows (0-indexed).
  const reportTitle = cellStr(rows[1] || [], 1).trim()
    || 'Reserve Bank of India - Liabilities & Assets';
  const unit = cellStr(rows[3] || [], 1).replace(/^\(|\)$/g, '').trim()
    || 'Rupees Crores';

  // Parse data rows — any row whose col[1] matches "DD-Mon-YYYY".
  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const week = cellStr(row, 1).trim();
    if (!isWeekDate(week)) continue;

    data.push({
      week : week,
      // Issue department — liabilities
      notes_in_circulation               : parseNum(row[2]),
      notes_in_banking_dept              : parseNum(row[3]),
      issue_dept_total                   : parseNum(row[4]),
      // Issue department — assets
      gold                               : parseNum(row[5]),
      foreign_securities                 : parseNum(row[6]),
      rupee_coin                         : parseNum(row[7]),
      goi_rupee_securities               : parseNum(row[8]),
      // Banking department — liabilities
      deposits                           : parseNum(row[9]),
      dep_central_govt                   : parseNum(row[10]),
      dep_mss                            : parseNum(row[11]),
      dep_state_govts                    : parseNum(row[12]),
      dep_scheduled_commercial_banks     : parseNum(row[13]),
      dep_scheduled_state_coop_banks     : parseNum(row[14]),
      dep_non_scheduled_state_coop_banks : parseNum(row[15]),
      dep_other_banks                    : parseNum(row[16]),
      dep_others                         : parseNum(row[17]),
      dep_fi_outside_india               : parseNum(row[18]),
      other_liabilities                  : parseNum(row[19]),
      banking_dept_total                 : parseNum(row[20]),
      // Banking department — assets
      notes_and_coins                    : parseNum(row[21]),
      balances_held_abroad               : parseNum(row[22]),
      loans_and_advances                 : parseNum(row[23]),
      la_central_govt                    : parseNum(row[24]),
      la_state_govts                     : parseNum(row[25]),
      la_scheduled_commercial_banks      : parseNum(row[26]),
      la_scheduled_state_coop_banks      : parseNum(row[27]),
      la_idbi                            : parseNum(row[28]),
      la_nabard                          : parseNum(row[29]),
      la_exim_bank                       : parseNum(row[30]),
      la_others                          : parseNum(row[31]),
      la_fi_outside_india                : parseNum(row[32]),
      bills_purchased_discounted         : parseNum(row[33]),
      bills_internal                     : parseNum(row[34]),
      bills_govt_treasury                : parseNum(row[35]),
      investments                        : parseNum(row[36]),
      other_assets                       : parseNum(row[37]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit, data };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  // Expect at least 1100 weekly rows.
  if (!Array.isArray(data) || data.length < 1100) {
    errors.push(`expected ≥1100 weekly rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    {
      week  : '03-Apr-2026',
      check : (r) =>
        r.notes_in_circulation           === 4130874.34 &&
        r.notes_in_banking_dept          === 9.96       &&
        r.issue_dept_total               === 4130884.3  &&
        r.gold                           === 398754.33  &&
        r.dep_scheduled_commercial_banks === 799216.72  &&
        r.banking_dept_total             === 4753704.94 &&
        r.loans_and_advances             === 328211     &&
        r.la_state_govts                 === 41040.39,
      desc : '03-Apr-2026 anchor values',
    },
    {
      week  : '02-Jul-2004',
      check : (r) =>
        r.notes_in_circulation === 333237 &&
        r.issue_dept_total     === 605100 &&
        r.gold                 === 18655,
      desc : '02-Jul-2004 anchor values',
    },
  ];

  for (const spec of known) {
    const row = data.find((r) => r.week === spec.week);
    if (!row) { errors.push(`known week missing: ${spec.week}`); continue; }
    if (!spec.check(row)) {
      errors.push(
        `${spec.week}: self-check failed — ${spec.desc} ` +
        `(notes_in_circulation=${row.notes_in_circulation}, ` +
        `issue_dept_total=${row.issue_dept_total}, ` +
        `banking_dept_total=${row.banking_dept_total}, ` +
        `loans_and_advances=${row.loans_and_advances})`,
      );
    }
  }

  // Weeks must be unique.
  const weeks = data.map((r) => r.week);
  const uniq  = new Set(weeks);
  if (uniq.size !== weeks.length) {
    errors.push(`weeks not unique: ${weeks.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending by parsed date integer).
  for (let i = 1; i < data.length; i++) {
    if (dateToInt(data[i - 1].week) <= dateToInt(data[i].week)) {
      errors.push(
        `not strictly newest-first at row ${i}: ${data[i - 1].week} then ${data[i].week}`,
      );
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('rbi-liabilities-and-assets self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'rbi-liabilities-and-assets.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} weekly rows ` +
    `(newest ${out.data[0].week}, oldest ${out.data[out.data.length - 1].week}); ` +
    `self-check passed`,
  );
}

main();
