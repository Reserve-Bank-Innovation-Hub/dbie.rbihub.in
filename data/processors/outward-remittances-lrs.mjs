// Processor: outward-remittances-lrs (monthly) — RBI Bulletin Table 36.
//
// Source xlsx carries one sheet with monthly outward remittances under the
// Liberalised Remittance Scheme (LRS) for resident individuals, in US$ millions.
// Layout:
//   row 1   blank
//   row 2   title
//   row 3   blank
//   row 4   unit note "(US$ Millions)"
//   row 5   blank
//   row 6   headers: Month | 1 Total LRS | 1.1 Deposit | 1.2 Property | 1.3 Equity/Debt |
//                           1.4 Gift | 1.5 Donations | 1.6 Travel | 1.7 Close Relatives |
//                           1.8 Medical | 1.9 Studies | 1.10 Others
//   row 7   column numbers (1–11)
//   rows 8… data ("Jan 2026" downwards, newest-first)
//   trailing blank row + "Source: …" footer + "** Include items…" note
//
// Emits (newest-first):
//   out/outward-remittances-lrs.json
//     { reportTitle, unit, categories: [{code, label}], data: [{month, values: [...]}] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-36-outward-remittances-under-the-liberalised-remittance-scheme-for-resident-individuals.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,234.56" → 1234.56. Returns null for blank/dash.
function parseNum(s) {
  const str = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (str === '' || str === '-' || str === 'N/A') return null;
  const val = Number(str);
  return Number.isFinite(val) ? val : null;
}

// "Jan 2026" → "2026-01" (sortable key).
function monthKey(label) {
  const m = label.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1]);
  if (idx < 0) return null;
  return `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
}

// Derive a clean code ("1", "1.1", …) and label from the raw header cell.
// E.g. "1 Outward Remittances under the LRS" → code="1", label="Outward remittances under the LRS"
// "1.1 Deposit" → code="1.1", label="Deposit"
function parseHeader(raw) {
  const m = String(raw || '').trim().match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!m) return null;
  return { code: m[1], label: m[2].trim() };
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets in Excel file');

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
    });

    let reportTitle = '';
    let unit = 'US$ Millions';
    let headerRow = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      const c1 = cellStr(row, 1).trim();
      if (!reportTitle && c1 && /remittance/i.test(c1)) {
        reportTitle = c1;
      }
      if (/^\(US\$/i.test(c1)) {
        unit = c1.replace(/[()]/g, '').trim();
      }
      if (/^Month/i.test(c1)) {
        headerRow = i;
        break;
      }
    }

    if (headerRow < 0) continue;

    // Parse categories from the header row (cols 2–12 map to the 11 purpose columns).
    const hdrRow = rows[headerRow] || [];
    const categories = [];
    for (let c = 2; c < hdrRow.length; c++) {
      const raw = cellStr(hdrRow, c).trim();
      if (!raw) continue;
      const parsed = parseHeader(raw);
      if (parsed) categories.push(parsed);
    }

    if (categories.length < 5) throw new Error('fewer than 5 purpose columns found in header');

    const data = [];
    for (let i = headerRow + 2; i < rows.length; i++) { // +2 skips the column-number row
      const row = rows[i] || [];
      const month = cellStr(row, 1).trim();
      if (month === '') continue;
      if (/^Source:/i.test(month) || /^\*\*/.test(month)) continue;
      if (!monthKey(month)) continue;

      // Collect the 11 purpose-category values (cols 2–12).
      const values = [];
      for (let c = 2; c <= 12; c++) {
        values.push(parseNum(row[c]));
      }

      data.push({ month, values });
    }

    if (data.length === 0) throw new Error('no valid data rows found');

    return { reportTitle: reportTitle || 'Outward Remittances Under The LRS', unit, categories, data };
  }

  throw new Error('could not locate the LRS header row in any sheet');
}

// --- self-check: fail loudly (non-zero exit) if known cells drift ---
function selfCheck(out) {
  const { data, categories } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 100) {
    errors.push(`expected ≥100 month rows, got ${data ? data.length : 'n/a'}`);
  }

  if (!Array.isArray(categories) || categories.length < 10) {
    errors.push(`expected ≥10 purpose categories, got ${categories ? categories.length : 'n/a'}`);
  }

  // Known cells read directly off the sheet (col indices are 0-based within values[]).
  // Sheet columns 2–12 map to values[0]–[10]:
  //   [0] = 1 Total LRS remittances
  //   [1] = 1.1 Deposit
  //   [2] = 1.2 Purchase of immovable property
  //   [3] = 1.3 Investment in equity/debt
  //   [4] = 1.4 Gift
  //   [5] = 1.5 Donations
  //   [6] = 1.6 Travel
  //   [7] = 1.7 Maintenance of close relatives
  //   [8] = 1.8 Medical Treatment
  //   [9] = 1.9 Studies Abroad
  //  [10] = 1.10 Others
  const find = (m) => data.find((r) => r.month === m);

  const jan2026 = find('Jan 2026');
  if (!jan2026) {
    errors.push('known month missing: Jan 2026');
  } else {
    // values[0] = 1 Outward Remittances total = 270.97
    if (jan2026.values[0] !== 270.97) errors.push(`Jan 2026 values[0] (total LRS): expected 270.97, got ${jan2026.values[0]}`);
    // values[3] = 1.3 Investment in equity/debt = 178.86
    if (jan2026.values[3] !== 178.86) errors.push(`Jan 2026 values[3] (equity/debt): expected 178.86, got ${jan2026.values[3]}`);
    // values[9] = 1.9 Studies Abroad = 2680.43
    if (jan2026.values[9] !== 2680.43) errors.push(`Jan 2026 values[9] (studies abroad): expected 2680.43, got ${jan2026.values[9]}`);
  }

  const dec2025 = find('Dec 2025');
  if (!dec2025) {
    errors.push('known month missing: Dec 2025');
  } else {
    // values[0] = total = 262.70
    if (dec2025.values[0] !== 262.70) errors.push(`Dec 2025 values[0] (total LRS): expected 262.70, got ${dec2025.values[0]}`);
    // values[6] = 1.6 Travel = 4.20
    if (dec2025.values[6] !== 4.20) errors.push(`Dec 2025 values[6] (travel): expected 4.20, got ${dec2025.values[6]}`);
  }

  const apr2008 = find('Apr 2008');
  if (!apr2008) {
    errors.push('known month missing: Apr 2008');
  } else {
    // values[2] = 1.2 Purchase of immovable property = 7.70
    if (apr2008.values[2] !== 7.70) errors.push(`Apr 2008 values[2] (property): expected 7.70, got ${apr2008.values[2]}`);
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
    console.error('outward-remittances-lrs self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'outward-remittances-lrs.json'), JSON.stringify(out));

  console.log(
    `wrote ${out.data.length} month rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}); ` +
    `${out.categories.length} purpose categories; ` +
    `unit: ${out.unit}; self-check passed`,
  );
}

main();
