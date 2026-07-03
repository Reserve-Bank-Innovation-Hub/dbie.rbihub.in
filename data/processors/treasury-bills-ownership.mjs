// Processor: treasury-bills-ownership — RBI Monthly Bulletin Table 25.
//
// Source xlsx carries one sheet ("Report 1") with weekly treasury bill
// outstanding amounts by holder category, from 03-Apr-2026 back to
// 12-May-2006, newest-first. Layout:
//   row 1  blank
//   row 2  title "Government of India : Treasury Bills Outstanding"
//   row 3  blank
//   row 4  "(Rupees Crores)"
//   row 5  blank
//   row 6  tenor group headers (spans)
//   row 7  holder sub-headers (Banks, Primary Dealers, State Governments, Others, [Total])
//   rows 8–1044  data (weeks, newest-first)
//
// Column mapping (0-indexed within each row array):
//   col[1]  = week-ended date  "DD-Mon-YYYY"
//   col[2]  = t91_banks         col[3]  = t91_pds
//   col[4]  = t91_stategov      col[5]  = t91_others    col[6]  = t91_total
//   col[7]  = t182_banks        col[8]  = t182_pds
//   col[9]  = t182_stategov     col[10] = t182_others   col[11] = t182_total
//   col[12] = t364_banks        col[13] = t364_pds
//   col[14] = t364_stategov     col[15] = t364_others   col[16] = t364_total
//   col[17] = t14_banks         col[18] = t14_pds
//   col[19] = t14_stategov      col[20] = t14_others    col[21] = t14_total
//   col[22] = cmb_banks         col[23] = cmb_pds
//   col[24] = cmb_stategov      col[25] = cmb_others    col[26] = cmb_total
//
// Emits (newest-first):
//   out/treasury-bills-ownership.json
//     { reportTitle, unit, data: [{ week, t91_banks, …, cmb_total } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-25-treasury-bills-ownership-pattern.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456" → 123456. Returns null for blank/dash so gaps stay distinct from real zeros.
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
    || 'Government of India : Treasury Bills Outstanding';
  const unit = (cellStr(rows[3] || [], 1).replace(/^\(|\)$/g, '').trim())
    || 'Rupees Crores';

  // Parse data rows — any row whose col[1] matches "DD-Mon-YYYY".
  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const week = cellStr(row, 1).trim();
    if (!isWeekDate(week)) continue;

    data.push({
      week          : week,
      // 91-day
      t91_banks     : parseNum(row[2]),
      t91_pds       : parseNum(row[3]),
      t91_stategov  : parseNum(row[4]),
      t91_others    : parseNum(row[5]),
      t91_total     : parseNum(row[6]),
      // 182-day
      t182_banks    : parseNum(row[7]),
      t182_pds      : parseNum(row[8]),
      t182_stategov : parseNum(row[9]),
      t182_others   : parseNum(row[10]),
      t182_total    : parseNum(row[11]),
      // 364-day
      t364_banks    : parseNum(row[12]),
      t364_pds      : parseNum(row[13]),
      t364_stategov : parseNum(row[14]),
      t364_others   : parseNum(row[15]),
      t364_total    : parseNum(row[16]),
      // 14-day intermediate
      t14_banks     : parseNum(row[17]),
      t14_pds       : parseNum(row[18]),
      t14_stategov  : parseNum(row[19]),
      t14_others    : parseNum(row[20]),
      t14_total     : parseNum(row[21]),
      // Cash management bills
      cmb_banks     : parseNum(row[22]),
      cmb_pds       : parseNum(row[23]),
      cmb_stategov  : parseNum(row[24]),
      cmb_others    : parseNum(row[25]),
      cmb_total     : parseNum(row[26]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit, data };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  // Expect at least 1000 weekly rows.
  if (!Array.isArray(data) || data.length < 1000) {
    errors.push(`expected ≥1000 weekly rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet.
  const known = [
    {
      week  : '03-Apr-2026',
      check : (r) =>
        r.t91_banks  === 21699     &&
        r.t91_total  === 154879    &&
        r.t182_total === 230774    &&
        r.t364_total === 344921    &&
        r.t14_stategov === 182325  &&
        r.cmb_total  === null,
      desc  : '03-Apr-2026 anchor values',
    },
    {
      week  : '12-May-2006',
      check : (r) =>
        r.t91_banks  === 8277  &&
        r.t364_total === 40238,
      desc  : '12-May-2006 anchor values',
    },
  ];

  for (const spec of known) {
    const row = data.find((r) => r.week === spec.week);
    if (!row) { errors.push(`known week missing: ${spec.week}`); continue; }
    if (!spec.check(row)) {
      errors.push(
        `${spec.week}: self-check failed — ${spec.desc} ` +
        `(t91_banks=${row.t91_banks}, t91_total=${row.t91_total}, ` +
        `t182_total=${row.t182_total}, t364_total=${row.t364_total}, ` +
        `t14_stategov=${row.t14_stategov}, cmb_total=${row.cmb_total})`,
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
    console.error('treasury-bills-ownership self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'treasury-bills-ownership.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} weekly rows ` +
    `(newest ${out.data[0].week}, oldest ${out.data[out.data.length - 1].week}); ` +
    `self-check passed`,
  );
}

main();
