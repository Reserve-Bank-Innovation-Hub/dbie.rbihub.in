// Credit-classification processor — ports the Go parser
// (backend/internal/parser/credit_classification_parser.go) to a JS build step.
// Reads the "Table No 3.2 …" .xlsx and emits out/credit-classification.json,
// matching the live-API oracle exactly.
//
// Fidelity notes:
//  - The Go backend reads cells via excelize's GetRows, which returns each cell's
//    *displayed* string. For the metric columns (general number format) excelize
//    rounds the value to the nearest integer at these magnitudes, so a raw
//    99094.9548 is read as "99095". We reproduce that with Math.round on numeric
//    cells. The period column is date-formatted, so its display string is e.g.
//    "Jun-2025" (SheetJS's formatted `w`), not the underlying serial.
//  - The rounded/formatted string is then run through the same parseFloat as the
//    Go code (commas stripped; "", "-", "N/A" -> 0; non-numeric -> 0).
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '..', 'sources',
  'Table No 3.2 Organisation-wise classification of outstanding credit of scheduled commercial banks according to occupation.xlsx',
);
const OUT = path.join(__dirname, 'out', 'credit-classification.json');

// Organisation metadata, in column order. StartCol is retained for documentation
// (data starts at column 3, three metrics per organisation) but is not emitted —
// the Go model tags it `json:"-"`.
const organizations = [
  { key: 'publicSector', displayName: 'Public Sector', startCol: 3 },
  { key: 'centralGovtDepartments', displayName: 'Central Government Departments', startCol: 6 },
  { key: 'generalStateGovt', displayName: 'General State Government', startCol: 9 },
  { key: 'stateGovtDepartments', displayName: 'State Government Departments', startCol: 12 },
  { key: 'localAndQuasiGovt', displayName: 'Local and Quasi-Government', startCol: 15 },
  { key: 'publicFinancialCorps', displayName: 'Public Financial Corporations', startCol: 18 },
  { key: 'publicNonFinancialCorps', displayName: 'Public Non-Financial Corporations', startCol: 21 },
  { key: 'cooperativeSector', displayName: 'Co-operative Sector', startCol: 24 },
  { key: 'privateCorporateSector', displayName: 'Private Corporate Sector', startCol: 27 },
  { key: 'privateFinancialCorps', displayName: 'Private Financial Corporations', startCol: 30 },
  { key: 'privateNonFinancialCorps', displayName: 'Private Non-Financial Corporations', startCol: 33 },
  { key: 'householdSector', displayName: 'Household Sector', startCol: 36 },
  { key: 'individuals', displayName: 'Individuals', startCol: 39 },
  { key: 'male', displayName: 'Male', startCol: 42 },
  { key: 'female', displayName: 'Female', startCol: 45 },
  { key: 'householdSectorOthers', displayName: 'Household Sector - Others', startCol: 48 },
  { key: 'proprietaryAndPartnership', displayName: 'Proprietary & Partnership', startCol: 51 },
  { key: 'jointLiabilityGroups', displayName: 'Joint Liability Groups', startCol: 54 },
  { key: 'microFinanceInstitutions', displayName: 'Micro Finance Institutions', startCol: 57 },
  { key: 'nonProfitInstitutions', displayName: 'Non-Profit Institutions', startCol: 60 },
  { key: 'nonResidents', displayName: 'Non Residents', startCol: 63 },
  { key: 'totalCredit', displayName: 'Total Credit', startCol: 66 },
];

// The (startCol - 1) offset the Go parser passes to parseMetrics, per organisation.
// (publicSector reads columns 2,3,4; centralGovtDepartments 5,6,7; …)
const metricStart = organizations.map((o) => o.startCol - 1);

// parseFloat: mirrors the Go helper — strip commas, treat "", "-", "N/A" as 0,
// fall back to 0 for anything non-numeric.
function parseFloatGo(s) {
  s = String(s).trim().replaceAll(',', '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const val = Number(s);
  return Number.isNaN(val) ? 0 : val;
}

// Reproduce excelize's GetRows cell string for one cell address.
// Numeric general-format cells are rounded to the nearest integer (excelize's
// displayed value at these magnitudes); date/otherwise-formatted cells use their
// formatted display string; strings pass through.
function cellString(ws, addr) {
  const c = ws[addr];
  if (!c) return '';
  if (c.t === 'n') {
    // Date-formatted numbers (e.g. the period column) carry a formatted `w`
    // that is not just the number stringified — keep it. Plain general-format
    // numbers round to an integer.
    if (typeof c.w === 'string' && c.w !== String(c.v)) return c.w;
    return String(Math.round(c.v));
  }
  if (c.w != null) return String(c.w);
  if (c.v == null) return '';
  return String(c.v);
}

function colName(n) {
  let s = '';
  n += 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = (n - (m + 1)) / 26;
  }
  return s;
}

function main() {
  const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const lastRow = range.e.r; // 0-based inclusive

  // Report title: row 2 (index 1), column 1.
  const reportTitle = cellString(ws, colName(1) + '2');

  const data = [];
  // Data rows start at row 8 (index 7).
  for (let r = 7; r <= lastRow; r++) {
    const period = cellString(ws, colName(1) + (r + 1)).trim();
    const occupation = cellString(ws, colName(2) + (r + 1)).trim();
    if (occupation === '' || period === '') continue;

    const parseMetrics = (startCol) => ({
      noOfAccounts: parseFloatGo(cellString(ws, colName(startCol) + (r + 1))),
      creditLimit: parseFloatGo(cellString(ws, colName(startCol + 1) + (r + 1))),
      amountOutstanding: parseFloatGo(cellString(ws, colName(startCol + 2) + (r + 1))),
    });

    const row = { period, occupation };
    for (let k = 0; k < organizations.length; k++) {
      row[organizations[k].key] = parseMetrics(metricStart[k]);
    }
    data.push(row);
  }

  const result = {
    data,
    organizations: organizations.map((o) => ({ key: o.key, displayName: o.displayName })),
    reportTitle,
  };

  fs.writeFileSync(OUT, JSON.stringify(result));
  console.log(`wrote ${data.length} rows -> ${OUT}`);
}

main();
