// Processor: small-savings — RBI Bulletin Table 46.
//
// Source xlsx has TWO sheets: "Monthly" and "Annual". Both share the same
// column structure (48 data columns, indices 2–49 in each row array):
//
//   row[0]  blank
//   row[1]  title "Small Savings"
//   row[2]  blank
//   row[3]  "(Rupees Crores)"
//   row[4]  blank
//   row[5]  group names (forward-fill manually — each span's first cell has the
//            scheme name, subsequent span cells are null; row 5 col[1] = "Month" / "Year / Month")
//   row[6]  measure: "Receipts" or "Outstanding" (per data column)
//   row[7]  column numbers "1"…"49" — skip
//
// Monthly data rows (row 8 onward):
//   - Fiscal-year-marker row: col[1] like "2025-26   ", all other cells null
//   - Month row: col[1] = full month name, col[2..49] = values
//
// Annual data rows (row 8 onward):
//   - Each row: col[1] = fiscal year "2024-25   ", col[2..49] = values
//
// Emits: out/small-savings.json
//   {
//     reportTitle : "Small Savings",
//     unit        : "Rupees Crores",
//     monthly     : { columns: [{ group, measure }], data: [{ fiscal_year, month, values }] },
//     annual      : { columns: [{ group, measure }], data: [{ fiscal_year, values }] },
//   }
// Newest-first in both sheets.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/occasional-series/table-46-small-savings.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// "1,23,456" → 123456. Returns null for blank / dash.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// Build the columns descriptor from row 5 (group names, with forward-fill)
// and row 6 (measure names). Data columns start at index 2.
function buildColumns(row5, row6) {
  const columns = [];
  let lastGroup = '';
  for (let i = 2; i < row6.length; i++) {
    const measure = cellStr(row6, i);
    if (!measure) continue; // empty cell = not a real data column

    const raw5 = cellStr(row5, i);
    if (raw5) lastGroup = raw5.replace(/\s+/g, ' ');

    columns.push({
      group   : lastGroup,
      measure : measure.replace(/\s+$/, ''), // trim trailing space
      colIdx  : i,
    });
  }
  return columns;
}

// Parse one sheet. Returns { columns, data }.
// Monthly: data rows have fiscal_year + month.
// Annual:  data rows have fiscal_year only.
function parseSheet(rows, isMonthly) {
  const row5 = rows[5] || [];
  const row6 = rows[6] || [];
  const columns = buildColumns(row5, row6);

  const data = [];
  let fiscalYear = '';

  for (let i = 8; i < rows.length; i++) {
    const row = rows[i] || [];
    const first = cellStr(row, 1);
    if (!first) continue;
    if (/^Note\s*:/i.test(first) || /^Source\s*:/i.test(first)) break;

    const isFyMarker = /^\d{4}-\d{2}\s*$/.test(first) || /^\d{4}-\d{2}\s/.test(first);

    if (isMonthly) {
      if (isFyMarker) {
        fiscalYear = first.replace(/\s+$/, '');
      } else {
        // Month row
        const values = columns.map((c) => parseNum(row[c.colIdx]));
        data.push({ fiscal_year : fiscalYear, month : first, values });
      }
    } else {
      // Annual: every data row is a fiscal year
      if (isFyMarker || /^\d{4}-\d{2}/.test(first)) {
        const fyLabel = first.replace(/\s+$/, '');
        const values = columns.map((c) => parseNum(row[c.colIdx]));
        data.push({ fiscal_year : fyLabel, values });
      }
    }
  }

  // Strip colIdx from the exported columns descriptor
  const exportCols = columns.map(({ group, measure }) => ({ group, measure }));
  return { columns : exportCols, data };
}

function parse(buf) {
  const wb = XLSX.read(buf, { type : 'buffer' });
  if (!wb.SheetNames.includes('Monthly') || !wb.SheetNames.includes('Annual')) {
    throw new Error(`expected sheets "Monthly" and "Annual"; got: ${wb.SheetNames.join(', ')}`);
  }

  const opts = { header : 1, raw : false, defval : null, blankrows : true };
  const monthlyRows = XLSX.utils.sheet_to_json(wb.Sheets['Monthly'], opts);
  const annualRows  = XLSX.utils.sheet_to_json(wb.Sheets['Annual'],  opts);

  const monthly = parseSheet(monthlyRows, true);
  const annual  = parseSheet(annualRows,  false);

  return {
    reportTitle : 'Small Savings',
    unit        : 'Rupees Crores',
    monthly,
    annual,
  };
}

// --- self-check ---
function selfCheck(out) {
  const errors = [];
  const { monthly, annual } = out;

  // Monthly: ≥ 350 rows
  if (!Array.isArray(monthly.data) || monthly.data.length < 350) {
    errors.push(`monthly: expected ≥350 rows, got ${monthly.data?.length ?? 'n/a'}`);
  }

  // Monthly: all rows have values.length === columns.length
  for (const row of (monthly.data || [])) {
    if (row.values.length !== monthly.columns.length) {
      errors.push(
        `monthly: row ${row.fiscal_year}/${row.month} has ${row.values.length} values, expected ${monthly.columns.length}`,
      );
      break;
    }
  }

  // Monthly: (fiscal_year, month) pairs must be unique
  const monthlyKeys = new Set((monthly.data || []).map((r) => `${r.fiscal_year}|${r.month}`));
  if (monthlyKeys.size !== (monthly.data || []).length) {
    errors.push('monthly: duplicate (fiscal_year, month) pairs detected');
  }

  // Monthly: anchor check — newest row should be August 2025-26
  const newest = (monthly.data || [])[0];
  if (!newest) {
    errors.push('monthly: no data rows');
  } else {
    if (newest.fiscal_year !== '2025-26' || newest.month !== 'August') {
      errors.push(`monthly: expected newest row 2025-26/August, got ${newest.fiscal_year}/${newest.month}`);
    }
    // values[0] = 8699, values[1] = 2129278, values[2] = 8336, values[3] = 1516403
    const anchors = [
      { idx : 0, expected : 8699 },
      { idx : 1, expected : 2129278 },
      { idx : 2, expected : 8336 },
      { idx : 3, expected : 1516403 },
    ];
    for (const { idx, expected } of anchors) {
      const got = newest.values[idx];
      if (got !== expected) {
        errors.push(`monthly anchor: values[${idx}] expected ${expected}, got ${got}`);
      }
    }
  }

  // Annual: non-empty
  if (!Array.isArray(annual.data) || annual.data.length === 0) {
    errors.push('annual: no data rows');
  }

  // Annual: all rows have values.length === columns.length
  for (const row of (annual.data || [])) {
    if (row.values.length !== annual.columns.length) {
      errors.push(
        `annual: row ${row.fiscal_year} has ${row.values.length} values, expected ${annual.columns.length}`,
      );
      break;
    }
  }

  // Annual: fiscal years must be unique
  const annualKeys = new Set((annual.data || []).map((r) => r.fiscal_year));
  if (annualKeys.size !== (annual.data || []).length) {
    errors.push('annual: duplicate fiscal_year values detected');
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('small-savings self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive : true });
  fs.writeFileSync(path.join(OUT_DIR, 'small-savings.json'), JSON.stringify(out));

  const { monthly, annual } = out;
  console.log(
    `wrote monthly ${monthly.data.length} rows × ${monthly.columns.length} columns ` +
    `(newest ${monthly.data[0].fiscal_year}/${monthly.data[0].month}, ` +
    `oldest ${monthly.data[monthly.data.length - 1].fiscal_year}/${monthly.data[monthly.data.length - 1].month}); ` +
    `annual ${annual.data.length} rows × ${annual.columns.length} columns ` +
    `(newest ${annual.data[0].fiscal_year}, oldest ${annual.data[annual.data.length - 1].fiscal_year}); ` +
    `self-check passed`,
  );
}

main();
