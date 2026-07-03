// Processor: certificates-of-deposit (fortnightly) — RBI Bulletin Table 28.
//
// Source xlsx carries one sheet ("Report 1") with fortnightly data on certificates
// of deposit (CDs) issued by banks, newest-first from "Mar 31, 2026" back to
// "Jul 12, 1991". Layout:
//   row 0  blank
//   row 1  title: "Certificates of Deposit"
//   row 2  blank
//   row 3  unit note: "(Rupees Crores ; Rate in per cent)"
//   row 4  blank
//   row 5  header: "Fortnight Ended | Amount Outstanding | Amount Issued during the fortnight | Minimum Rate of Interest"
//   row 6  column numbers: null | null | "1" | "2" | "3"
//   rows 7… data ("MMM D, YYYY" date, amount outstanding, amount issued, min rate)
//   trailing blank row + "Note:" + "See Notes on Tables" footer
//
// Emits (newest-first):
//   out/certificates-of-deposit.json
//     { reportTitle, units, data: [{ fortnightEnded, amountOutstanding, amountIssued, minRate } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/financial-markets/table-28-certificates-of-deposit.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "692,681" -> 692681.  Returns null for blank/dash so gaps stay distinct from zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Mar 31, 2026" -> sortable key "2026-03-31" (used for ordering + uniqueness checks).
function fortnightKey(label) {
  const m = label.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                   Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const mon = MONTHS[m[1]];
  if (!mon) return null;
  return `${m[3]}-${mon}-${String(m[2]).padStart(2, '0')}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header   : 1,
      raw      : false,
      defval   : null,
      blankrows : true,
    });

    let reportTitle = '';
    let units = 'Rupees Crores; Rate in per cent';
    let headerRow = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();
      if (c1 && /Certificates of Deposit/i.test(c1) && !/Fortnight/i.test(c1)) {
        reportTitle = c1;
      }
      // The unit note row
      if (/Rupees Crores/i.test(c1)) {
        // Strip surrounding parens if present
        units = c1.replace(/^\(|\)$/g, '').trim();
      }
      if (/Fortnight Ended/i.test(c1)) {
        headerRow = i;
        break;
      }
    }

    if (headerRow < 0) continue; // not the data sheet

    const data = [];
    for (let i = headerRow + 2; i < rows.length; i++) { // skip the col-number row too
      const row = rows[i] || [];
      const label = cellStr(row, 1).trim();
      if (label === '') continue;
      if (/^Note:/i.test(label) || /^See /i.test(label)) continue;
      if (!fortnightKey(label)) continue; // skip anything not a valid fortnight date

      data.push({
        fortnightEnded    : label,
        amountOutstanding : parseNum(row[2]),
        amountIssued      : parseNum(row[3]),
        minRate           : parseNum(row[4]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Certificates of Deposit',
      units,
      data,
    };
  }

  throw new Error('could not locate the Certificates of Deposit header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 800) {
    errors.push(`expected ≥800 fortnight rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = [
    { fortnightEnded: 'Mar 31, 2026', amountOutstanding: 692681, amountIssued: 107212, minRate: 5.25 },
    { fortnightEnded: 'Feb 28, 2026', amountOutstanding: 663845, amountIssued: 73093,  minRate: 5.24 },
    { fortnightEnded: 'Jul 12, 1991', amountOutstanding: 4846,   amountIssued: null,   minRate: 9.00 },
  ];
  for (const exp of known) {
    const row = data.find((r) => r.fortnightEnded === exp.fortnightEnded);
    if (!row) { errors.push(`known fortnight missing: ${exp.fortnightEnded}`); continue; }
    if (row.amountOutstanding !== exp.amountOutstanding)
      errors.push(`${exp.fortnightEnded} amountOutstanding: expected ${exp.amountOutstanding}, got ${row.amountOutstanding}`);
    if (row.amountIssued !== exp.amountIssued)
      errors.push(`${exp.fortnightEnded} amountIssued: expected ${exp.amountIssued}, got ${row.amountIssued}`);
    if (row.minRate !== exp.minRate)
      errors.push(`${exp.fortnightEnded} minRate: expected ${exp.minRate}, got ${row.minRate}`);
  }

  // Fortnights must be unique.
  const keys = data.map((r) => fortnightKey(r.fortnightEnded));
  if (keys.some((k) => k == null)) errors.push('some fortnightEnded values did not parse to a sortable key');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`fortnights not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending keys).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].fortnightEnded} then ${data[i].fortnightEnded}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('certificates-of-deposit self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'certificates-of-deposit.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} fortnight rows ` +
    `(newest ${out.data[0].fortnightEnded}, oldest ${out.data[out.data.length - 1].fortnightEnded}; ` +
    `units: ${out.units}); self-check passed`,
  );
}

main();
