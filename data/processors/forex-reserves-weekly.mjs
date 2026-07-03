// Processor: forex-reserves-weekly — RBI Bulletin Table 33.
//
// Source xlsx carries one sheet ("Report 1") with India's official foreign
// exchange reserves reported every Friday, newest-first from 03-Apr-2026
// back to 06-Apr-2001. Layout:
//   row 1   title
//   row 3   column-group header row: "1 Total Reserves", "1.1 Foreign Currency Assets", etc.
//   row 4   sub-unit row: "₹ Crores" / "US $Millions" / "Volume (Metric Tonnes)" / "SDRs Millions"
//   row 5   fiscal-year separator: "2026-27   " in col 1, nulls in value cols
//   rows 6… alternating year-separator rows and weekly data rows
//   trailing blank + Notes + Source rows
//
// Year-separator rows: col[1] matches /^\d{4}-\d{2}\s*$/ and value cols are null.
// Data rows: col[1] matches /^\d{2}-[A-Za-z]{3}-\d{4}$/ (e.g. "03-Apr-2026").
//
// Columns (0-indexed within the row array):
//   [2]  totalReservesINR     — ₹ Crores
//   [3]  totalReservesUSD     — US $Millions
//   [4]  foreignCurrencyINR   — ₹ Crores
//   [5]  foreignCurrencyUSD   — US $Millions
//   [6]  goldINR              — ₹ Crores
//   [7]  goldUSD              — US $Millions
//   [8]  goldVolumeMT         — Metric Tonnes (sparse — populated only for recent weeks)
//   [9]  sdrsINR              — ₹ Crores
//   [10] sdrsMillion          — SDRs Millions (sparse)
//   [11] sdrsUSD              — US $Millions
//   [12] reserveTrancheINR    — ₹ Crores
//
// Emits (newest-first):
//   out/forex-reserves-weekly.json
//     { reportTitle, data: [{ weekEnded, totalReservesINR, totalReservesUSD,
//       foreignCurrencyINR, foreignCurrencyUSD, goldINR, goldUSD, goldVolumeMT,
//       sdrsINR, sdrsMillion, sdrsUSD, reserveTrancheINR }, …] }

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/external-sector/table-33-foreign-exchange-reserves-weekly.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');

// Date pattern for weekly data rows: "03-Apr-2026"
const DATE_RE = /^\d{2}-[A-Za-z]{3}-\d{4}$/;

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v).trim();
}

// Strip commas; '-'/blank/N/A → null. Returns null for non-finite results.
function parseNum(s) {
  const t = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === 'N/A') return null;
  const val = Number(t);
  return Number.isFinite(val) ? val : null;
}

// "03-Apr-2026" → "2026-04-03" for ordering comparisons.
const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function dateKey(label) {
  const m = label.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return null;
  const mon = MONTH_MAP[m[2]];
  if (!mon) return null;
  return `${m[3]}-${mon}-${m[1]}`;
}

function parse(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets found');

  const sn = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header   : 1,
    raw      : false,
    defval   : null,
    blankrows: true,
  });

  // Row index 1: title
  const reportTitle = cellStr(rows[1] || [], 1) || 'Foreign Exchange Reserves - Weekly';

  const data = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const label = cellStr(row, 1);
    if (!DATE_RE.test(label)) continue; // skip headers, year separators, notes

    data.push({
      weekEnded          : label,
      totalReservesINR   : parseNum(row[2]),
      totalReservesUSD   : parseNum(row[3]),
      foreignCurrencyINR : parseNum(row[4]),
      foreignCurrencyUSD : parseNum(row[5]),
      goldINR            : parseNum(row[6]),
      goldUSD            : parseNum(row[7]),
      goldVolumeMT       : parseNum(row[8]),
      sdrsINR            : parseNum(row[9]),
      sdrsMillion        : parseNum(row[10]),
      sdrsUSD            : parseNum(row[11]),
      reserveTrancheINR  : parseNum(row[12]),
    });
  }

  if (data.length === 0) throw new Error('no valid weekly data rows found');

  return { reportTitle, data };
}

// --- self-check: fail loudly (non-zero exit) if shape or known cells drift ---
function selfCheck(out) {
  const { data } = out;
  const errors = [];

  if (!Array.isArray(data) || data.length < 1300) {
    errors.push(`expected ≥1300 weekly rows, got ${data ? data.length : 'n/a'}`);
  }

  // Hard-coded cell assertions verified against the source sheet.
  const assertions = [
    {
      label : '03-Apr-2026',
      checks: [
        ['totalReservesINR',   6490854],
        ['totalReservesUSD',   697121],
        ['foreignCurrencyUSD', 552856],
      ],
    },
    {
      label : '27-Mar-2026',
      checks: [
        ['totalReservesUSD', 688058],
        ['goldINR',          1075852],
        ['sdrsUSD',          18649],
      ],
    },
    {
      label : '27-Feb-2026',
      checks: [
        ['goldVolumeMT',       880],
        ['sdrsMillion',        13714],
        ['totalReservesINR',   6627548],
      ],
    },
  ];

  for (const { label, checks } of assertions) {
    const row = data.find((r) => r.weekEnded === label);
    if (!row) {
      errors.push(`known week missing: ${label}`);
      continue;
    }
    for (const [field, expected] of checks) {
      if (row[field] !== expected) {
        errors.push(`${label} ${field}: expected ${expected}, got ${row[field]}`);
      }
    }
  }

  // Dates must be unique.
  const keys = data.map((r) => dateKey(r.weekEnded));
  if (keys.some((k) => k == null)) errors.push('some weekEnded dates did not parse');
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    errors.push(`dates not unique: ${keys.length} rows, ${uniq.size} distinct`);
  }

  // Ordered newest-first (strictly descending).
  for (let i = 1; i < keys.length; i++) {
    if (keys[i - 1] != null && keys[i] != null && keys[i - 1] <= keys[i]) {
      errors.push(
        `not strictly newest-first at row ${i}: ${data[i - 1].weekEnded} then ${data[i].weekEnded}`,
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
    console.error('forex-reserves-weekly self-check FAILED:');
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'forex-reserves-weekly.json'),
    JSON.stringify(out),
  );

  console.log(
    `wrote ${out.data.length} weekly rows ` +
    `(newest ${out.data[0].weekEnded}, oldest ${out.data[out.data.length - 1].weekEnded}); ` +
    `self-check passed`,
  );
}

main();
