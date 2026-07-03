// Processor: reer-and-neer (monthly) — RBI Bulletin Table 37.
//
// Source xlsx carries one sheet ("40-Currency(2015-16)") with monthly indices
// of the Nominal Effective Exchange Rate (NEER) and Real Effective Exchange Rate
// (REER) of the Indian rupee, 40-currency basket, base 2015-16 = 100, newest-first.
// Layout:
//   row 1  title
//   row 3  "40-Currency Basket"
//   row 4  header spanning groups: "Trade-Weighted" | "Export-Weighted"
//   row 5  sub-headers: null, null, "NEER", "REER", "NEER", "REER"
//   row 6  "Base: 2015-16 =100"
//   rows 7–269  data (col[1]=month, col[2]=trade_neer, col[3]=trade_reer, col[4]=export_neer, col[5]=export_reer)
//   rows 270–272  blank + source notes (skip)
//
// Emits (newest-first):
//   out/reer-and-neer.json
//     { reportTitle, base, basketSize, data: [{ month, period, trade_neer, trade_reer, export_neer, export_reer } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-37-indices-of-real-effective-exchange-rate-reer-and-nominal-effective-exchange-rate-neer-of-the-indian-rupee.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month abbreviations as they appear in the sheet (no trailing dot, e.g. "Jan 2026").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "82.14" -> 82.14. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Jan 2026" -> "2026-01" (sortable key used for ordering + uniqueness checks).
function monthKey(label) {
  const m = label.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1]);
  if (idx < 0) return null;
  return `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // The data lives on a single sheet; scan all sheets defensively.
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header    : 1,
      raw       : false,
      defval    : null,
      blankrows : true,
    });

    // Detect the sheet by looking for the "NEER" / "REER" sub-header row.
    let dataStartRow = -1;
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i] || [];
      const hasNeer = row.some((c) => c != null && String(c).trim().toUpperCase() === 'NEER');
      const hasReer = row.some((c) => c != null && String(c).trim().toUpperCase() === 'REER');
      if (hasNeer && hasReer) {
        dataStartRow = i + 2; // data begins two rows after the sub-header (skip the "Base:" row)
        break;
      }
    }

    if (dataStartRow < 0) continue; // not the data sheet — try the next one

    const data = [];
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i] || [];
      const month = cellStr(row, 1).trim();
      if (month === '') continue;
      if (/^Source:/i.test(month) || /^Note:/i.test(month)) break;

      const period = monthKey(month);
      if (!period) continue; // skip anything that is not a "Mon YYYY" data row

      data.push({
        month,
        period,
        trade_neer  : parseNum(row[2]),
        trade_reer  : parseNum(row[3]),
        export_neer : parseNum(row[4]),
        export_reer : parseNum(row[5]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle : 'Indices of NEER and REER of the Indian Rupee - Monthly',
      base        : '2015-16=100',
      basketSize  : 40,
      data,
    };
  }

  throw new Error('could not locate the NEER/REER sub-header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 260) {
    errors.push(`expected ≥260 month rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = [
    { month: 'Jan 2026', trade_neer: 82.14, trade_reer: 94.82, export_neer: 84.59, export_reer: 92.71 },
    { month: 'Dec 2025', trade_neer: 82.69, trade_reer: 95.17, export_neer: 84.66, export_reer: 92.50 },
    { month: 'Apr 2004', trade_neer: 138.50, trade_reer: 90.87, export_neer: 134.91, export_reer: 88.82 },
  ];
  for (const exp of known) {
    const row = data.find((r) => r.month === exp.month);
    if (!row) { errors.push(`known month missing: ${exp.month}`); continue; }
    for (const field of ['trade_neer', 'trade_reer', 'export_neer', 'export_reer']) {
      if (row[field] == null) {
        errors.push(`${exp.month} ${field}: expected ${exp[field]}, got null`);
      } else if (Math.abs(row[field] - exp[field]) > 0.01) {
        errors.push(`${exp.month} ${field}: expected ${exp[field]}, got ${row[field]}`);
      }
    }
  }

  // Periods must be unique.
  const periods = data.map((r) => r.period);
  if (periods.some((p) => p == null)) errors.push('some months did not parse to a sortable period key');
  const uniq = new Set(periods);
  if (uniq.size !== periods.length) errors.push(`periods not unique: ${periods.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending periods).
  for (let i = 1; i < periods.length; i++) {
    if (periods[i - 1] != null && periods[i] != null && periods[i - 1] <= periods[i]) {
      errors.push(`not strictly newest-first at row ${i}: ${data[i - 1].month} then ${data[i].month}`);
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('reer-and-neer self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'reer-and-neer.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} month rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}; ` +
    `basket ${out.basketSize}-currency, base ${out.base}); self-check passed`,
  );
}

main();
