// Processor: gold-and-silver-prices (monthly) — RBI Bulletin Table 21.
//
// Source xlsx carries one sheet with the monthly average price of standard gold
// (₹ per 10 grams) and silver (₹ per kilogram) in Mumbai, newest-first from
// "Jan. 2026" back to "Apr. 1990". Layout:
//   row 1  title
//   row 3  header: "Month/Year | 1 Standard Gold (Rupees per 10 grams) | 2 Silver (Rupees per kilogram)"
//   rows 4… data (col 1 = "Mon. YYYY", col 2 = gold, col 3 = silver)
//   trailing blank row + "Source: …" footer
//
// Emits (newest-first):
//   out/gold-and-silver-prices.json
//     { reportTitle, units: { gold, silver }, data: [{ month, gold, silver } …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/prices-and-production/table-21-monthly-average-price-of-gold-and-silver-in-mumbai.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month abbreviations as they appear in the sheet (trailing dot, e.g. "Jan.", "May.").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "145,947" -> 145947. Returns null for blank/dash so gaps stay distinct from real zeros.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "Jan. 2026" -> "2026-01" (sortable key; used for ordering + uniqueness checks only).
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

  // The table lives on a single sheet, but scan every sheet defensively and take
  // the one that yields the header row we expect.
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    let reportTitle = '';
    let goldUnit = 'Rupees per 10 grams';
    let silverUnit = 'Rupees per kilogram';
    let headerRow = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();
      if (c1 && /gold/i.test(c1) && /silver/i.test(c1) && !/Month\/Year/i.test(c1)) {
        reportTitle = c1;
      }
      if (/Month\/Year/i.test(c1)) {
        headerRow = i;
        const goldHdr = cellStr(row, 2);
        const silverHdr = cellStr(row, 3);
        const gu = goldHdr.match(/\(([^)]+)\)/);
        const su = silverHdr.match(/\(([^)]+)\)/);
        if (gu) goldUnit = gu[1].trim();
        if (su) silverUnit = su[1].trim();
        break;
      }
    }

    if (headerRow < 0) continue; // not the data sheet — try the next one

    const data = [];
    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const month = cellStr(row, 1).trim();
      if (month === '') continue;
      if (/^Source:/i.test(month) || /^Note:/i.test(month)) continue;
      if (!monthKey(month)) continue; // skip anything that isn't a "Mon. YYYY" data row

      data.push({
        month,
        gold: parseNum(row[2]),
        silver: parseNum(row[3]),
      });
    }

    if (data.length === 0) throw new Error('no valid data rows found in sheet');

    return {
      reportTitle: reportTitle || 'Monthly Average Price of Gold and Silver in Mumbai',
      units: { gold: goldUnit, silver: silverUnit },
      data,
    };
  }

  throw new Error('could not locate the gold/silver header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 400) {
    errors.push(`expected ≥400 month rows, got ${data ? data.length : 'n/a'}`);
  }

  // Known cells (verified against the source sheet).
  const known = {
    'Jan. 2026': { gold: 145947, silver: 285593 },
    'Dec. 2025': { gold: 131172, silver: 198182 },
    'Apr. 1990': { gold: 3417, silver: 6756 },
  };
  for (const [month, exp] of Object.entries(known)) {
    const row = data.find((r) => r.month === month);
    if (!row) { errors.push(`known month missing: ${month}`); continue; }
    if (row.gold !== exp.gold) errors.push(`${month} gold: expected ${exp.gold}, got ${row.gold}`);
    if (row.silver !== exp.silver) errors.push(`${month} silver: expected ${exp.silver}, got ${row.silver}`);
  }

  // Months must be unique.
  const keys = data.map((r) => monthKey(r.month));
  if (keys.some((k) => k == null)) errors.push('some months did not parse to a sortable key');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) errors.push(`months not unique: ${keys.length} rows, ${uniq.size} distinct`);

  // Ordered newest-first (strictly descending keys).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
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
    console.error('gold-and-silver-prices self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'gold-and-silver-prices.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} month rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}; ` +
    `gold in ${out.units.gold}, silver in ${out.units.silver}); self-check passed`,
  );
}

main();
