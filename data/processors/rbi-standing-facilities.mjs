// Processor: rbi-standing-facilities — Monthly RBI Bulletin, Table 5.
//
// Source xlsx carries one sheet ("Fortnightly") with fortnightly utilisation
// of the Reserve Bank's standing facilities (Rupees Crores). Layout:
//   row 1  blank
//   row 2  title "RBI's Standing Facilities"
//   row 3  blank
//   row 4  unit note "(Rupees Crores)"
//   row 5  blank
//   row 6  column headers: Date | 1 MSF | 2 Export Credit Refinance … | 3 Liquidity Facility for PDs | 4 Others
//   row 7  sub-headers:  | | | 2.1 Limit | 2.2 Outstanding | 3.1 Limit | 3.2 Outstanding | 4.1 Limit | 4.2 Outstanding
//   row 8  FY marker "2025-26   " — skip
//   rows 9…  alternating FY-marker rows (col[1] looks like "2025-26   ") and date rows
//
// Column mapping (0-indexed within each row array):
//   col[1] = date or FY marker
//   col[2] = msf
//   col[3] = ecr_limit
//   col[4] = ecr_outstanding
//   col[5] = pd_limit
//   col[6] = pd_outstanding
//   col[7] = others_limit
//   col[8] = others_outstanding
//
// Emits (newest-first):
//   out/rbi-standing-facilities.json
//     { reportTitle, unit, data: [{ date, msf, ecr_limit, ecr_outstanding, pd_limit, pd_outstanding, others_limit, others_outstanding } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/rbi/table-05-rbis-standing-facilities.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month name → 0-indexed number, for parsing "MMM d, yyyy".
const MONTH_MAP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

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

// "Feb 28, 2026" → true; used to detect date rows vs FY-marker rows.
function isDateRow(s) {
  return /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/.test(s.trim());
}

// Parse "MMM d, yyyy" → Date, for ordering checks.
function parseDate(s) {
  const m = s.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) throw new Error(`unrecognised date "${s}"`);
  const month = MONTH_MAP[m[1]];
  if (month == null) throw new Error(`unknown month "${m[1]}" in "${s}"`);
  return new Date(Number(m[3]), month, Number(m[2]));
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  const sheetName = wb.SheetNames[0];   // "Fortnightly"
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header    : 1,
    raw       : false,
    defval    : null,
    blankrows : true,
  });

  // Extract report title from row 2 (index 1).
  let reportTitle = cellStr(rows[1] || [], 1).trim() || "RBI's Standing Facilities";

  // Extract unit from row 4 (index 3).
  let unit = 'Rupees Crores';
  const unitRow = rows[3] || [];
  for (let ci = 0; ci < unitRow.length; ci++) {
    const v = cellStr(unitRow, ci).trim();
    if (/Rupees/i.test(v)) {
      unit = v.replace(/^\(|\)$/g, '').trim();
      break;
    }
  }

  // Parse data rows — any row whose col[1] matches "MMM d, yyyy".
  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row  = rows[i] || [];
    const col1 = cellStr(row, 1).trim();
    if (!isDateRow(col1)) continue;

    data.push({
      date              : col1,
      msf               : parseNum(row[2]),
      ecr_limit         : parseNum(row[3]),
      ecr_outstanding   : parseNum(row[4]),
      pd_limit          : parseNum(row[5]),
      pd_outstanding    : parseNum(row[6]),
      others_limit      : parseNum(row[7]),
      others_outstanding: parseNum(row[8]),
    });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit, data };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 175) {
    errors.push(`expected ≥175 rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known anchor cells verified against the source sheet.
  const anchors = [
    {
      date : 'Feb 28, 2026',
      checks : [
        (r) => r.msf               ===  450,
        (r) => r.ecr_limit         === null,
        (r) => r.ecr_outstanding   === null,
        (r) => r.pd_limit          === 14900,
        (r) => r.pd_outstanding    === 7418,
        (r) => r.others_limit      === 76000,
        (r) => r.others_outstanding ===  0,
      ],
      desc : 'Feb 28, 2026: msf=450 ecr_limit=null ecr_outstanding=null pd_limit=14900 pd_outstanding=7418 others_limit=76000 others_outstanding=0',
    },
    {
      date : 'Apr 22, 2011',
      checks : [
        (r) => r.msf               === null,
        (r) => r.ecr_limit         === 9846,
        (r) => r.ecr_outstanding   === 1799,
        (r) => r.pd_limit          === 2600,
        (r) => r.pd_outstanding    === 270,
      ],
      desc : 'Apr 22, 2011: msf=null ecr_limit=9846 ecr_outstanding=1799 pd_limit=2600 pd_outstanding=270',
    },
  ];

  for (const anchor of anchors) {
    const row = data.find((r) => r.date === anchor.date);
    if (!row) {
      errors.push(`anchor date missing: ${anchor.date}`);
      continue;
    }
    const failed = anchor.checks.some((fn) => !fn(row));
    if (failed) {
      errors.push(
        `${anchor.date}: anchor mismatch — ${anchor.desc}\n    actual: ${JSON.stringify(row)}`,
      );
    }
  }

  // Dates must be unique.
  const dates = data.map((r) => r.date);
  const uniq = new Set(dates);
  if (uniq.size !== dates.length) {
    errors.push(`dates not unique: ${dates.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending by calendar date).
  for (let i = 1; i < data.length; i++) {
    const prev = parseDate(data[i - 1].date);
    const curr = parseDate(data[i].date);
    if (prev <= curr) {
      errors.push(`not strictly newest-first at row ${i}: "${data[i - 1].date}" then "${data[i].date}"`);
      break;
    }
  }

  // Row 0 must be the newest date.
  if (data.length > 0 && data[0].date !== 'Feb 28, 2026') {
    errors.push(`expected newest row to be "Feb 28, 2026", got "${data[0].date}"`);
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('rbi-standing-facilities self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'rbi-standing-facilities.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} fortnightly rows ` +
    `(newest ${out.data[0].date}, oldest ${out.data[out.data.length - 1].date}); ` +
    `self-check passed`,
  );
}

main();
