// Processor: external-commercial-borrowings (monthly) — RBI Bulletin Table 38.
//
// Source xlsx has two sheets; we use "Monthly (New Format)".
// Layout (Monthly sheet):
//   row 1   blank
//   row 2   title
//   row 3   blank
//   row 4   unit note "(US$ Millions)"
//   row 5   blank
//   row 6   top-level column headers:
//             Month/Year | 1 Automatic Route (×2) | 2 Approval Route (×2) |
//             3 Total (1+2) (×2) | 4 Weighted Average Maturity |
//             5 Interest Rate (×2) | Borrower Category (×21)
//   row 7   sub-level column headers:
//             null | 1.1 Number | 1.2 Amount | 2.1 Number | 2.2 Amount |
//             3.1 Number | 3.2 Amount | null |
//             5.1 Margin over ARR | 5.2 Interest rate range |
//             I. Corporate Manufacturing | II. Corporate-Infrastructure |
//             a.) Transport | b.) Energy | c.) Water | d.) Communication |
//             e.) Social | f.) Exploration | g.) Other Sub-Sectors |
//             III. Corporate Service-Sector | IV. Other Entities |
//             a.) units in SEZ | b.) SIDBI | c.) Exim Bank |
//             V. Banks | VI. FI (Other than NBFC) | VII. NBFCs |
//             a). NBFC-IFC/AFC | b). NBFC-MFI | c). NBFC-Others |
//             VIII. NGO | IX. MFI
//   row 8   FY label "2019-20"
//   row 9… month rows: "Apr","May",…,"Mar"
//   (FY label + 12 month rows, repeating)
//   No source/notes rows at the end.
//
// The 33 columns (cols 1–32, col 0 = null) align to a fixed set of measures;
// col 8 (4 Weighted Average Maturity) is often labelled in row 6 only.
//
// Emits (oldest FY first, Apr-to-Mar within each FY):
//   out/external-commercial-borrowings.json
//     { reportTitle, unit, columns: [{code, label, group}], rows: [{fy, month, values: [...]}] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-38-external-commercial-borrowings-ecbs-registrations.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

const MONTH_ORDER = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

function parseNum(s) {
  const str = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (str === '' || str === '-' || str === 'N/A') return null;
  const val = Number(str);
  return Number.isFinite(val) ? val : null;
}

// Columns are assembled from the two header rows (rows 5 & 6, 0-indexed).
// Row 5 gives group/top-level labels, row 6 gives sub-level labels.
// The final column list (31 data cols, indices 2–32 in the sheet) is built by
// preferring the row-6 sub-label where present, falling back to row-5 group label.
function buildColumns(row5, row6) {
  const cols = [];

  // Build a top-level context for each position.
  let lastTop = '';
  for (let c = 2; c < 33; c++) {
    const top = cellStr(row5, c).trim();
    const sub = cellStr(row6, c).trim();

    if (top) lastTop = top;

    const label = sub || lastTop;
    if (!label) continue;

    // Derive a code: prefer the numeric prefix in the sub-label.
    const subMatch = sub.match(/^(\d+\.\d+|\w+(?:\.\)+)?)\s+(.*)/);
    const topMatch = lastTop.match(/^(\d+(?:\.\d+)?)\s+(.*)/);

    let code, cleanLabel, group;

    if (subMatch) {
      code = subMatch[1];
      cleanLabel = subMatch[2].trim();
      group = topMatch ? topMatch[2].trim() : lastTop;
    } else if (topMatch) {
      code = topMatch[1];
      cleanLabel = topMatch[2].trim();
      group = topMatch[2].trim();
    } else {
      code = String(c - 1);
      cleanLabel = label;
      group = label;
    }

    cols.push({ code, label: cleanLabel, group, colIndex: c });
  }

  return cols;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found in Excel file');

  // Use the "Monthly (New Format)" sheet.
  const sheetName = wb.SheetNames.find((s) => /monthly/i.test(s)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  let reportTitle = '';
  let unit = 'US$ Millions';
  let headerRow1 = -1; // the top-level header row (row 5 in 0-indexed)
  let headerRow2 = -1; // the sub-level header row (row 6)
  let dataStartRow = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();
    if (!reportTitle && /external commercial borrowings/i.test(c1)) {
      reportTitle = c1;
    }
    if (/^\(US\$/i.test(c1)) {
      unit = c1.replace(/[()]/g, '').trim();
    }
    if (/^Month/i.test(c1) && headerRow1 < 0) {
      headerRow1 = i;
      headerRow2 = i + 1;
      dataStartRow = i + 2;
      break;
    }
  }

  if (headerRow1 < 0) throw new Error('could not locate the Month/Year header row');

  const row5 = rows[headerRow1] || [];
  const row6 = rows[headerRow2] || [];
  const columns = buildColumns(row5, row6);

  const dataRows = [];
  let currentFY = '';

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const c1 = cellStr(row, 1).trim();

    if (c1 === '') continue;

    // FY label row e.g. "2019-20   " (all other cols null).
    if (/^\d{4}-\d{2}/.test(c1)) {
      currentFY = c1.trim();
      continue;
    }

    // Month row e.g. "Apr", "May", …
    if (!MONTH_ORDER.includes(c1)) continue;

    const values = columns.map((col) => parseNum(row[col.colIndex]));
    dataRows.push({ fy: currentFY, month: c1, values });
  }

  if (dataRows.length === 0) throw new Error('no valid data rows found');

  return {
    reportTitle: reportTitle || 'External Commercial Borrowings (ECBs) – Registrations',
    unit,
    columns: columns.map(({ colIndex: _ci, ...rest }) => rest), // strip internal colIndex
    rows: dataRows,
  };
}

// --- self-check: fail loudly (non-zero exit) if known cells drift ---
function selfCheck(out) {
  const { rows, columns } = out;
  const errors = [];

  if (!Array.isArray(rows) || rows.length < 60) {
    errors.push(`expected ≥60 month rows, got ${rows ? rows.length : 'n/a'}`);
  }

  if (!Array.isArray(columns) || columns.length < 10) {
    errors.push(`expected ≥10 columns, got ${columns ? columns.length : 'n/a'}`);
  }

  // Helper: find a specific FY+month row.
  const find = (fy, month) => rows.find((r) => r.fy === fy && r.month === month);

  // Known cells read directly off the sheet.
  // Row "2019-20 Apr": col 0=auto No=108, col 1=auto Amt=2658, col 4=total No=109, col 5=total Amt=3158
  const fy1920Apr = find('2019-20', 'Apr');
  if (!fy1920Apr) {
    errors.push('known row missing: 2019-20 Apr');
  } else {
    if (fy1920Apr.values[0] !== 108) errors.push(`2019-20 Apr values[0] (auto no): expected 108, got ${fy1920Apr.values[0]}`);
    if (fy1920Apr.values[1] !== 2658) errors.push(`2019-20 Apr values[1] (auto amt): expected 2658, got ${fy1920Apr.values[1]}`);
    if (fy1920Apr.values[5] !== 3158) errors.push(`2019-20 Apr values[5] (total amt): expected 3158, got ${fy1920Apr.values[5]}`);
  }

  // Row "2025-26 Jan": total No=116, total Amt=5335
  const fy2526Jan = find('2025-26', 'Jan');
  if (!fy2526Jan) {
    errors.push('known row missing: 2025-26 Jan');
  } else {
    if (fy2526Jan.values[4] !== 116) errors.push(`2025-26 Jan values[4] (total no): expected 116, got ${fy2526Jan.values[4]}`);
    if (fy2526Jan.values[5] !== 5335) errors.push(`2025-26 Jan values[5] (total amt): expected 5335, got ${fy2526Jan.values[5]}`);
  }

  // Row "2020-21 Sep": total amt = 5223 (auto No=99, auto Amt=5223, approval=0/0, total=99/5223)
  const fy2021Sep = find('2020-21', 'Sep');
  if (!fy2021Sep) {
    errors.push('known row missing: 2020-21 Sep');
  } else {
    if (fy2021Sep.values[5] !== 5223) errors.push(`2020-21 Sep values[5] (total amt): expected 5223, got ${fy2021Sep.values[5]}`);
  }

  // Rows within each FY should be ordered Apr→Mar.
  const fyGroups = {};
  for (const r of rows) {
    if (!fyGroups[r.fy]) fyGroups[r.fy] = [];
    fyGroups[r.fy].push(r.month);
  }
  for (const [fy, months] of Object.entries(fyGroups)) {
    for (let i = 0; i < months.length; i++) {
      const expected = MONTH_ORDER[i];
      if (expected && months[i] !== expected) {
        errors.push(`FY ${fy}: expected month[${i}]=${expected}, got ${months[i]}`);
        break;
      }
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('external-commercial-borrowings self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'external-commercial-borrowings.json'), JSON.stringify(out));

  const fyList = [...new Set(out.rows.map((r) => r.fy))];
  console.log(
    `wrote ${out.rows.length} month rows across ${fyList.length} FYs ` +
    `(${fyList[0]} → ${fyList[fyList.length - 1]}); ` +
    `${out.columns.length} columns; unit: ${out.unit}; self-check passed`,
  );
}

main();
