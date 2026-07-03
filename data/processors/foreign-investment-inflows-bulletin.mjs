// Processor: foreign-investment-inflows-bulletin — RBI Bulletin Table 35.
//
// Source xlsx carries one sheet ("FII Monthly (New Format)") with India's
// foreign investment inflows (FDI + portfolio) in US $ Millions, monthly,
// newest-first from 2026:01(JAN) back to 2011:03(MAR).
//
// Layout (0-indexed row numbers):
//   row 1   title: "Foreign Investment Inflows - Monthly"
//   row 3   unit note: "Amount in US $ Millions"
//   row 5   column headers (cols 1–24)
//   rows 6… data rows — month label in col[1], 23 value cols (2–24)
//   row 185 blank
//   row 186 source note
//
// Month format: "2026:01(JAN)", "2025:12(DEC)", "2011:05(MAY)" etc.
// Pattern: /^\d{4}:\d{2}\([A-Z]+\)$/
//
// All values are US $Millions as floating-point (e.g. "-1385.98889").
// '-'/blank/null → null. Round to 2 decimal places.
//
// Column mapping (col index → field name):
//   [2]  netFDI                       — A. Net FDI (A.I - A.II)
//   [3]  directInvestmentToIndia      — A.I. Direct investment to India
//   [4]  grossInflows                 — A.I.a. Gross inflows
//   [5]  equityInflows                — A.I.a.i. Equity (total)
//   [6]  equityGovernment             — A.I.a.i.a. Government
//   [7]  equityRBI                    — A.I.a.i.b. RBI
//   [8]  acquisitionOfShares          — A.I.a.i.d. Acquisition of shares
//   [9]  equityUnincorporated         — A.I.a.i.e. Equity capital of unincorporated bodies
//   [10] reinvestedEarnings           — A.I.a.ii. Reinvested earnings
//   [11] otherCapitalInflows          — A.I.a.iii. Other capital
//   [12] repatriationDisinvestment    — A.I.b. Repatriation/disinvestment
//   [13] repatriationEquity           — A.I.b.i. Equity
//   [14] repatriationOther            — A.I.b.ii. Other capital
//   [15] fdiByIndia                   — A.II. FDI by India
//   [16] fdiByIndiaEquity             — A.II.a. Equity capital
//   [17] fdiByIndiaReinvested         — A.II.b. Reinvested earnings
//   [18] fdiByIndiaOther              — A.II.c. Other capital
//   [19] fdiByIndiaRepatriation       — A.II.d. Repatriation/disinvestment
//   [20] netPortfolioInvestment       — B. Net portfolio investment
//   [21] gdrsAdrs                     — B.I.a. GDRs/ADRs
//   [22] fpis                         — B.I.b. FPIs
//   [23] offshoreFunds                — B.I.c. Offshore funds and others
//   [24] portfolioByIndia             — B.I.d. Portfolio investment by India
//
// Emits (newest-first):
//   out/foreign-investment-inflows-bulletin.json
//     { reportTitle, unit, data: [{ month, netFDI, directInvestmentToIndia, … }, …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-35-foreign-investment-inflows.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Month label pattern: "2026:01(JAN)"
const MONTH_RE = /^\d{4}:\d{2}\([A-Z]+\)$/;

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// Strip commas; '-'/blank/N/A → null. Round to 2dp for floating-point precision.
function parseNum(s) {
  const t = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === 'N/A') return null;
  const val = Number(t);
  if (!Number.isFinite(val)) return null;
  return Math.round(val * 100) / 100;
}

// "2026:01(JAN)" → "2026-01" for ordering comparisons.
function monthKey(label) {
  const m = label.match(/^(\d{4}):(\d{2})\(/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sn = 'FII Monthly (New Format)';
  if (!wb.Sheets[sn]) {
    throw new Error(`Sheet "${sn}" not found; sheets: ${wb.SheetNames.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  const reportTitle = cellStr(rows[1] || [], 1) || 'Foreign Investment Inflows - Monthly';
  const unit = 'US $ Millions';

  const data = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const label = cellStr(row, 1);
    if (!MONTH_RE.test(label)) continue;

    data.push({
      month                    : label,
      netFDI                   : parseNum(row[2]),
      directInvestmentToIndia  : parseNum(row[3]),
      grossInflows             : parseNum(row[4]),
      equityInflows            : parseNum(row[5]),
      equityGovernment         : parseNum(row[6]),
      equityRBI                : parseNum(row[7]),
      acquisitionOfShares      : parseNum(row[8]),
      equityUnincorporated     : parseNum(row[9]),
      reinvestedEarnings       : parseNum(row[10]),
      otherCapitalInflows      : parseNum(row[11]),
      repatriationDisinvestment: parseNum(row[12]),
      repatriationEquity       : parseNum(row[13]),
      repatriationOther        : parseNum(row[14]),
      fdiByIndia               : parseNum(row[15]),
      fdiByIndiaEquity         : parseNum(row[16]),
      fdiByIndiaReinvested     : parseNum(row[17]),
      fdiByIndiaOther          : parseNum(row[18]),
      fdiByIndiaRepatriation   : parseNum(row[19]),
      netPortfolioInvestment   : parseNum(row[20]),
      gdrsAdrs                 : parseNum(row[21]),
      fpis                     : parseNum(row[22]),
      offshoreFunds            : parseNum(row[23]),
      portfolioByIndia         : parseNum(row[24]),
    });
  }

  if (data.length === 0) throw new Error('no valid monthly data rows found');

  return { reportTitle, unit, data };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 150) {
    errors.push(`expected ≥150 monthly rows, got ${data ? data.length : 'n/a'}`);
  }

  // Hard-coded cell assertions verified against the source sheet.
  const assertions = [
    {
      label : '2026:01(JAN)',
      checks: [
        ['netFDI',               -1385.99],
        ['netPortfolioInvestment', -1924.4],
      ],
    },
    {
      label : '2025:12(DEC)',
      checks: [
        ['directInvestmentToIndia', 2541.01],
        ['grossInflows',            8516.19],
      ],
    },
    {
      label : '2011:05(MAY)',
      checks: [
        ['netFDI',               3186.07],
        ['netPortfolioInvestment', -1652.87],
      ],
    },
  ];

  for (const { label, checks } of assertions) {
    const row = data.find((r) => r.month === label);
    if (!row) {
      errors.push(`known month missing: ${label}`);
      continue;
    }
    for (const [field, expected] of checks) {
      // Use a small tolerance for floating-point rounding.
      if (row[field] == null || Math.abs(row[field] - expected) > 0.02) {
        errors.push(`${label} ${field}: expected ${expected}, got ${row[field]}`);
      }
    }
  }

  // Months must be unique.
  const keys = data.map((r) => monthKey(r.month));
  if (keys.some((k) => k == null)) errors.push('some month labels did not parse');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`months not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
      errors.push(
        `not strictly newest-first at row ${i}: ${data[i - 1].month} then ${data[i].month}`,
      );
      break;
    }
  }

  return errors;
}

function main() {
  const out = parse(fs.readFileSync(XLSX_SRC));

  const errors = selfCheck(out);
  if (errors.length > 0) {
    console.error('foreign-investment-inflows-bulletin self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'foreign-investment-inflows-bulletin.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} monthly rows ` +
    `(newest ${out.data[0].month}, oldest ${out.data[out.data.length - 1].month}); ` +
    `unit: ${out.unit}; self-check passed`,
  );
}

main();
