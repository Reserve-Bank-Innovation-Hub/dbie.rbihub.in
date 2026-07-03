// Processor: combined-receipts-disbursements — Monthly RBI Bulletin.
//
// Source xlsx carries one sheet ("Report 1") with combined receipts and
// disbursements of the Central and State Governments. Layout:
//   row 1  title
//   row 3  unit note "(Rupees Crores)"
//   row 5  column headers: col[1] = "Item", cols[2..N] = fiscal years
//          newest-first, e.g. "2025-26" … "1994-95" (trailing spaces trimmed)
//   rows 6..49  data: col[1] = hierarchical item label, cols[2..N] = values
//   row 50  blank
//   rows 51..  notes and source footer
//
// Data rows are detected as: col[1] non-empty AND at least one of the value
// columns is non-empty AND the row text does not start with "Notes:" or "Source:".
//
// Emits:
//   out/combined-receipts-disbursements.json
//     { reportTitle, unit, years, data: [{ item, values }…] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/occasional-series/table-48-combined-receipts-and-disbursements-of-the-central-and-state-governments.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "1,23,456" → 123456. Returns null for blank/dash/footnote-only cells.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
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

  // Row 1 (index 1) carries the report title.
  const reportTitle = cellStr(rows[1] || [], 1).trim()
    || 'Combined Receipts and Disbursements of the Central and State Governments';

  // Row 3 carries the unit note "(Rupees Crores)".
  let unit = 'Rupees Crores';
  const unitRow = rows[3] || [];
  for (let ci = 0; ci < unitRow.length; ci++) {
    const v = cellStr(unitRow, ci).trim().replace(/^\(|\)$/g, '');
    if (/rupees/i.test(v)) {
      unit = v;
      break;
    }
  }

  // Row 5 (index 5) carries column headers.
  const headerRow = rows[5] || [];
  const years = [];
  for (let ci = 2; ci < headerRow.length; ci++) {
    const v = cellStr(headerRow, ci).trim();
    if (v) years.push(v);
  }
  if (years.length === 0) throw new Error('no year columns found in header row');

  // Capture any trailing footnote text embedded in a notes row.
  let notes = '';
  for (let i = rows.length - 1; i >= 45; i--) {
    const row = rows[i] || [];
    const label = cellStr(row, 1).trim();
    if (/^Notes?:/i.test(label)) {
      notes = label;
      break;
    }
  }

  // Parse data rows — row has non-empty col[1] AND at least one numeric value
  // AND is not a footer/note row.
  const data = [];
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const label = cellStr(row, 1).trim();
    if (!label) continue;
    if (/^Notes?:/i.test(label) || /^Source\s*:/i.test(label)) break;

    // Check at least one of the value columns is non-empty.
    let hasValue = false;
    for (let ci = 2; ci < 2 + years.length; ci++) {
      const v = cellStr(row, ci).trim();
      if (v && v !== '-') { hasValue = true; break; }
    }
    if (!hasValue) continue;

    const values = [];
    for (let ci = 2; ci < 2 + years.length; ci++) {
      values.push(parseNum(row[ci]));
    }

    data.push({ item: label, values });
  }

  if (data.length === 0) throw new Error('no valid data rows found in sheet');

  return { reportTitle, unit, years, data, notes };
}

// --- self-check: fail loudly (non-zero exit) if the shape or known cells drift ---
function selfCheck(out) {
  const { years, data } = out;
  const errors = [];

  if (!Array.isArray(years) || years.length < 9) {
    errors.push(`expected ≥9 year columns, got ${years ? years.length : 'n/a'}`);
  }

  if (!Array.isArray(data) || data.length < 40) {
    errors.push(`expected ≥40 item rows, got ${data ? data.length : 'n/a'}`);
  }

  // Every row must have values.length === years.length.
  for (const row of data) {
    if (row.values.length !== years.length) {
      errors.push(`"${row.item}": expected ${years.length} values, got ${row.values.length}`);
      break;
    }
  }

  // Anchor: "1 Total Disbursements" 2025-26 = 10552103; 2017-18 = 4515946.
  const totalDisbRow = data.find(r => r.item === '1 Total Disbursements');
  if (!totalDisbRow) {
    errors.push('could not find row "1 Total Disbursements"');
  } else {
    const idx2025 = years.indexOf('2025-26');
    const idx2017 = years.indexOf('2017-18');
    if (idx2025 === -1) {
      errors.push('year 2025-26 not found in years array');
    } else if (totalDisbRow.values[idx2025] !== 10552103) {
      errors.push(`"1 Total Disbursements" 2025-26: expected 10552103, got ${totalDisbRow.values[idx2025]}`);
    }
    if (idx2017 === -1) {
      errors.push('year 2017-18 not found in years array');
    } else if (totalDisbRow.values[idx2017] !== 4515946) {
      errors.push(`"1 Total Disbursements" 2017-18: expected 4515946, got ${totalDisbRow.values[idx2017]}`);
    }
  }

  // Anchor: first "1.1.1 Revenue" 2025-26 = 4460702.
  const revenueRow = data.find(r => r.item === '1.1.1 Revenue');
  if (!revenueRow) {
    errors.push('could not find first row "1.1.1 Revenue"');
  } else {
    const idx2025 = years.indexOf('2025-26');
    if (idx2025 !== -1 && revenueRow.values[idx2025] !== 4460702) {
      errors.push(`"1.1.1 Revenue" 2025-26: expected 4460702, got ${revenueRow.values[idx2025]}`);
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('combined-receipts-disbursements self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'combined-receipts-disbursements.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} item rows × ${out.years.length} years ` +
    `(${out.years[0]} to ${out.years[out.years.length - 1]}); self-check passed`,
  );
}

main();
