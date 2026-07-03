// Processor: commercial-paper (fortnightly) — RBI Bulletin Table 29.
//
// Source xlsx carries one sheet with fortnightly commercial paper data:
//   row 1  blank
//   row 2  title: "Commercial Paper"
//   row 3  blank
//   row 4  subtitle: "(Rupees Crores ; Rate in per cent)"
//   row 5  blank
//   row 6  headers: "Fortnight Ended | Amount Outstanding | Amount Reported during the fortnight | Minimum Rate of Interest"
//   row 7  column numbers: null | null | 1 | 2 | 3
//   rows 8… data (col 1 = "DD-Mon-YY", col 2 = outstanding, col 3 = reported, col 4 = min rate)
//   trailing blank + "Note:" footer rows
//
// Emits (newest-first):
//   out/commercial-paper.json
//     { reportTitle, units, data: [{ fortnightEnded, amountOutstanding, amountReported, minRate } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/financial-markets/table-29-commercial-paper.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "460,152" -> 460152. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "31-Mar-26" -> "2026-03-31" (sortable ISO key used for ordering + uniqueness checks).
// Handles two-digit years: 00–99 mapped to 2000–2099 (the data starts from Jun 2011).
function fortnightKey(label) {
  const m = label.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const MONTH_MAP = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const mm = MONTH_MAP[m[2]];
  if (!mm) return null;
  const dd = String(m[1]).padStart(2, '0');
  const yy = parseInt(m[3], 10);
  const yyyy = 2000 + yy;
  return `${yyyy}-${mm}-${dd}`;
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
    let headerRow   = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      const c1  = cellStr(row, 1).trim();
      if (/Commercial Paper/i.test(c1) && !/Fortnight/i.test(c1)) {
        reportTitle = c1;
      }
      if (/Fortnight Ended/i.test(c1)) {
        headerRow = i;
        break;
      }
    }

    if (headerRow < 0) continue; // not the data sheet — try the next one

    const data = [];
    for (let i = headerRow + 2; i < rows.length; i++) { // +2 to skip the "1 | 2 | 3" row
      const row           = rows[i] || [];
      const fortnightEnded = cellStr(row, 1).trim();
      if (fortnightEnded === '') continue;
      if (/^Note:/i.test(fortnightEnded) || /^Source:/i.test(fortnightEnded) || /^See Notes/i.test(fortnightEnded)) continue;
      if (!fortnightKey(fortnightEnded)) continue; // skip anything that isn't a valid date row

      data.push({
        fortnightEnded,
        amountOutstanding : parseNum(row[2]),
        amountReported    : parseNum(row[3]),
        minRate           : parseNum(row[4]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : reportTitle || 'Commercial Paper',
      units       : 'Rupees Crores; Rate in per cent',
      data,
    };
  }

  throw new Error('could not locate the commercial paper header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 300) {
    errors.push(`expected ≥300 fortnight rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells verified against the source sheet (rows 7, 8, 100 in the xlsx, 0-indexed).
  const known = [
    { fortnightEnded: '31-Mar-26', amountOutstanding: 460152, amountReported: 77688, minRate: 5.92 },
    { fortnightEnded: '15-Mar-26', amountOutstanding: 476151, amountReported: 100795, minRate: 6.27 },
    { fortnightEnded: '15-May-22', amountOutstanding: 384417, amountReported: 44343, minRate: 3.91 },
  ];
  for (const exp of known) {
    const row = data.find((r) => r.fortnightEnded === exp.fortnightEnded);
    if (!row) {
      errors.push(`known row missing: ${exp.fortnightEnded}`);
      continue;
    }
    if (row.amountOutstanding !== exp.amountOutstanding) {
      errors.push(`${exp.fortnightEnded} amountOutstanding: expected ${exp.amountOutstanding}, got ${row.amountOutstanding}`);
    }
    if (row.amountReported !== exp.amountReported) {
      errors.push(`${exp.fortnightEnded} amountReported: expected ${exp.amountReported}, got ${row.amountReported}`);
    }
    if (row.minRate !== exp.minRate) {
      errors.push(`${exp.fortnightEnded} minRate: expected ${exp.minRate}, got ${row.minRate}`);
    }
  }

  // Fortnight dates must be unique.
  const keys = data.map((r) => fortnightKey(r.fortnightEnded));
  if (keys.some((k) => k == null)) errors.push('some fortnightEnded values did not parse to a sortable key');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`fortnightEnded not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending).
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
    console.error('commercial-paper self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'commercial-paper.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} fortnight rows ` +
    `(newest ${out.data[0].fortnightEnded}, oldest ${out.data[out.data.length - 1].fortnightEnded}); self-check passed`,
  );
}

main();
