// external-debt.mjs — parse "India External Debt - Rupees.xlsx" into the
// frontend-consumable JSON, replicating backend/internal/parser/external_debt_parser.go.
//
// Go reads cells via excelize GetRows(), which returns each cell's *displayed*
// (number-format-applied) string, then runs parseFloat() on it (strips commas,
// treats ""/"-"/"N/A" as 0). The two number formats present in the data region are
//   "##,##,###;\-##,##,###;0"  -> 0 decimal places (rounds to integer)
//   "#,##0.0;\-#,##0.0;0.0"    -> 1 decimal place
// so the effective transform is: round the raw value to the format's decimal count.
// (SheetJS can't render the Indian-lakh grouping format, so we round explicitly.)
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../sources/India External Debt - Rupees.xlsx');
const OUT = path.join(__dirname, 'out');

// Number of decimal places implied by an Excel number-format code (positive section).
function decimalsFromFormat(z) {
  if (!z) return 0;
  const pos = String(z).split(';')[0]; // positive section
  const dot = pos.indexOf('.');
  if (dot === -1) return 0;
  let n = 0;
  for (let i = dot + 1; i < pos.length; i++) {
    const ch = pos[i];
    if (ch === '0' || ch === '#' || ch === '?') n++;
    else break;
  }
  return n;
}

// Mirror excelize's rendered string -> Go parseFloat(). We render by rounding the
// raw numeric value to the format's decimal count (grouping commas are irrelevant:
// parseFloat strips them). Empty/dash/N-A -> 0.
function parseCell(cell) {
  if (!cell) return 0;
  if (cell.t === 'n' && typeof cell.v === 'number') {
    const dp = decimalsFromFormat(cell.z);
    // toFixed on the raw value == excelize's displayed value, then Number() re-parses.
    return Number(cell.v.toFixed(dp));
  }
  // string / other cells: mimic parseFloat on the (comma-stripped) text
  const s = String(cell.v ?? '').trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const val = Number.parseFloat(s);
  return Number.isNaN(val) ? 0 : val;
}

function parseExternalDebt() {
  const buf = fs.readFileSync(SRC);
  const wb = XLSX.read(buf, { type: 'buffer', cellNF: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // cell(r,c) accessor over raw addresses (reads beyond declared !ref, as excelize does)
  const cell = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
  const rawStr = (r, c) => {
    const cl = cell(r, c);
    if (!cl) return '';
    return String(cl.v ?? '').trim();
  };

  // Report title: row 2, col 2 -> index [1][1]
  const reportTitle = rawStr(1, 1);

  // Determine last data row: scan until year column is empty / non-numeric.
  const range = XLSX.utils.decode_range(ws['!ref']);
  const lastRow = range.e.r;

  const data = [];
  // Data starts at row index 7. Year in column index 1.
  for (let r = 7; r <= lastRow; r++) {
    const year = rawStr(r, 1);
    if (year === '') continue;
    // skip if not a numeric year (Go: strconv.Atoi)
    if (!/^[+-]?\d+$/.test(year)) continue;

    const p = (c) => parseCell(cell(r, c));

    data.push({
      year,

      // I. Multilateral
      multilateralTotal: p(2),
      multilateralGovtTotal: p(3),
      multilateralGovtConcessional: p(4),
      multilateralGovtConcessionalIDA: p(5),
      multilateralGovtConcessionalOthers: p(6),
      multilateralGovtNonConcessional: p(7),
      multilateralGovtNonConcessionalIBRD: p(8),
      multilateralGovtNonConcessionalOthers: p(9),
      multilateralNonGovtTotal: p(10),
      multilateralNonGovtConcessional: p(11),
      multilateralNonGovtNonConcessionalTotal: p(12),
      multilateralNonGovtPublicIBRD: p(13),
      multilateralNonGovtPublicOthers: p(14),
      multilateralNonGovtFinInstIBRD: p(15),
      multilateralNonGovtFinInstOthers: p(16),
      multilateralNonGovtPrivateIBRD: p(17),
      multilateralNonGovtPrivateOthers: p(18),

      // II. Bilateral
      bilateralTotal: p(22),
      bilateralGovtTotal: p(23),
      bilateralGovtConcessional: p(24),
      bilateralGovtNonConcessional: p(25),
      bilateralNonGovtTotal: p(26),
      bilateralNonGovtConcessionalPublic: p(27),
      bilateralNonGovtConcessionalFinInst: p(28),
      bilateralNonGovtConcessionalPrivate: p(29),
      bilateralNonGovtNonConcessionalPublic: p(30),
      bilateralNonGovtNonConcessionalFinInst: p(31),
      bilateralNonGovtNonConcessionalPrivate: p(32),

      // III. IMF
      imf: p(35),

      // IV. Trade Credit
      tradeCredit: p(36),
      tradeCreditBuyers: p(37),
      tradeCreditSuppliers: p(38),
      tradeCreditExportBilateral: p(39),
      tradeCreditExportDefence: p(40),

      // V. Commercial Borrowing
      commercialBorrowing: p(41),
      commercialBankLoans: p(42),
      securitizedBorrowings: p(43),
      loansWithGuarantee: p(44),
      selfLiquidatingLoans: p(45),

      // VI. Non-resident Deposits
      nonResidentDeposits: p(46),

      // VII. Rupee Debt
      rupeeDebt: p(47),
      rupeeDebtDefence: p(48),
      rupeeDebtCivilian: p(49),

      // VIII. Total Long-term Debt
      totalLongTermDebt: p(50),

      // IX. Short-term Debt
      shortTermDebt: p(51),
      shortTermNRD: p(52),
      shortTermTradeCredit: p(53),
      shortTermTradeAbove180: p(54),
      shortTermTradeUpTo180: p(55),
      shortTermFIITBills: p(56),
      shortTermForeignCentralBanks: p(57),
      shortTermExtDebtLiabilities: p(58),
      shortTermCentralBank: p(59),
      shortTermCommercialBanks: p(60),

      // X. Gross External Debt and Ratios
      grossExternalDebt: p(61),
      concessionalDebtPercent: p(62),
      shortTermDebtPercent: p(63),
      debtToGDPRatio: p(64),
      debtServiceRatio: p(65),
    });
  }

  return { data, reportTitle };
}

const full = parseExternalDebt();

// GetExternalDebtRecent: first 10 records, preserving reportTitle.
const recentCount = Math.min(10, full.data.length);
const recent = { data: full.data.slice(0, recentCount), reportTitle: full.reportTitle };

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'external-debt.json'), JSON.stringify(full, null, 2));
fs.writeFileSync(path.join(OUT, 'external-debt-recent.json'), JSON.stringify(recent, null, 2));

console.log(`external-debt: ${full.data.length} records; recent: ${recent.data.length}`);
