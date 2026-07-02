// Processor: index-of-industrial-production (Table 23, RBI Monthly Bulletin).
//
// The source .xlsx (IIP 2011-12=100) carries two sheets that share the same
// category layout — a two-level column header of nine series across two groups:
//
//   "1 Sectoral Classification": General Index, 1.1 Mining, 1.2 Manufacturing,
//     1.3 Electricity
//   "2 Use-Based Classification": 2.1 Primary Goods, 2.2 Capital Goods,
//     2.3 Intermediate Goods, 2.4 Infrastructure/Construction Goods,
//     2.5 Consumer Durables
//
//   Sheet 1 ("Index of Industrial Production ")  -> the index values (base
//     2011-12=100). A "Weight" row sits just under the sub-labels, then ~169
//     month rows newest-first (e.g. "2026:02 (FEB)").
//   Sheet 2 ("Index of Industrial Produ")        -> the year-on-year growth
//     rate for the same nine series and periods (period label has no space:
//     "2026:02(FEB)").
//
// The filename mentions base 2004-05 AND 2011-12, but both sheets are the single
// 2011-12=100 base (one carries levels, the other growth) — so the model has one
// base, one category list, and per-period rows holding both the index values and
// the growth rates.
//
// Emits (newest-first):
//   out/index-of-industrial-production.json
//     { reportTitle, base, categories:[{group, code, label, weight}],
//       data:[{ period, label, index:{...}, growth:{...} }] }
//
// Fidelity: numeric cells are read via SheetJS's formatted display string and run
// through the same parseFloat helper the other processors use (commas stripped;
// "", "-", "N/A" -> null so a genuinely-missing series stays absent rather than 0).

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '..', 'publications', 'monthly-rbi-bulletin', 'prices-and-production',
  'table-23-index-of-industrial-production-base-2004-05-100-2011-12.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT = path.join(OUT_DIR, 'index-of-industrial-production.json');

const INDEX_SHEET = 'Index of Industrial Production ';
const GROWTH_SHEET = 'Index of Industrial Produ';

const BASE = '2011-12=100';

const MONTHS = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// The nine series in column order (data starts at column index 2). `code` is a
// stable field key; `group`/`label`/rawLabel mirror the two-level sheet header.
const categories = [
  { code: 'generalIndex',     group: 'Sectoral classification', rawLabel: 'General Index',                       label: 'General index' },
  { code: 'mining',           group: 'Sectoral classification', rawLabel: '1.1 Mining',                          label: '1.1 Mining' },
  { code: 'manufacturing',    group: 'Sectoral classification', rawLabel: '1.2 Manufacturing',                   label: '1.2 Manufacturing' },
  { code: 'electricity',      group: 'Sectoral classification', rawLabel: '1.3 Electricity',                     label: '1.3 Electricity' },
  { code: 'primaryGoods',     group: 'Use-based classification', rawLabel: '2.1 Primary Goods',                  label: '2.1 Primary goods' },
  { code: 'capitalGoods',     group: 'Use-based classification', rawLabel: '2.2 Capital Goods',                  label: '2.2 Capital goods' },
  { code: 'intermediateGoods', group: 'Use-based classification', rawLabel: '2.3 Intermediate Goods',           label: '2.3 Intermediate goods' },
  { code: 'infraConstruction', group: 'Use-based classification', rawLabel: '2.4 Infrastructure/ Construction Goods', label: '2.4 Infrastructure/construction goods' },
  { code: 'consumerDurables', group: 'Use-based classification', rawLabel: '2.5 Consumer Durables',             label: '2.5 Consumer durables' },
];

// Column index in the sheet for each series (0 = pad, 1 = Month/Year, 2.. = data).
const SERIES_START_COL = 2;

// parseFloat: strip commas, treat "", "-", "N/A" as missing (null); anything
// non-numeric also -> null so we never invent a 0.
function parseNum(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const val = Number(s);
  return Number.isFinite(val) ? val : null;
}

// "2026:02 (FEB)" / "2026:02(FEB)" -> { period: "2026-02", label: "Feb 2026" }.
// Returns null for non-period rows (Weight, Notes, Source, blanks).
function parsePeriod(raw) {
  const s = String(raw == null ? '' : raw).trim();
  const m = s.match(/^(\d{4}):(\d{2})\s*\(([A-Za-z]{3})\)$/);
  if (!m) return null;
  const [, year, mm, mon] = m;
  const monKey = mon.toUpperCase();
  if (MONTHS[monKey] !== mm) {
    // Numeric month and abbreviation disagree — treat as unusable rather than guess.
    return null;
  }
  const monTitle = monKey.charAt(0) + monKey.slice(1).toLowerCase();
  return { period: `${year}-${mm}`, label: `${monTitle} ${year}` };
}

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// Read a sheet into { title, weights:{code->num|null}, byPeriod:{period->{code->num}} }.
function readSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`sheet "${sheetName}" not found`);
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1, raw: false, defval: null, blankrows: true,
  });

  // Title: first non-empty row's first populated cell.
  let title = '';
  for (const row of rows) {
    const c = cellStr(row, 1).trim();
    if (c) { title = c; break; }
  }

  const weights = {};
  const byPeriod = {};

  for (const row of rows) {
    const firstCol = cellStr(row, 1).trim();
    if (firstCol === '') continue;

    // Weight row: label starts with "Weight" (may be indented).
    if (/^weight/i.test(firstCol)) {
      categories.forEach((cat, k) => {
        weights[cat.code] = parseNum(row[SERIES_START_COL + k]);
      });
      continue;
    }

    const p = parsePeriod(firstCol);
    if (!p) continue; // Notes/Source/header rows

    const values = {};
    categories.forEach((cat, k) => {
      values[cat.code] = parseNum(row[SERIES_START_COL + k]);
    });
    byPeriod[p.period] = { label: p.label, values };
  }

  return { title, weights, byPeriod };
}

function main() {
  const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });

  const idx = readSheet(wb, INDEX_SHEET);
  const grw = readSheet(wb, GROWTH_SHEET);

  // The index sheet is the spine (it defines the periods and weights).
  const periods = Object.keys(idx.byPeriod).sort().reverse(); // newest-first
  if (periods.length === 0) throw new Error('no period rows parsed from index sheet');

  const data = periods.map((period) => {
    const i = idx.byPeriod[period];
    const g = grw.byPeriod[period];
    return {
      period,
      label: i.label,
      index: i.values,
      growth: g ? g.values : Object.fromEntries(categories.map((c) => [c.code, null])),
    };
  });

  const result = {
    reportTitle: idx.title,
    base: BASE,
    categories: categories.map((c) => ({
      code: c.code,
      group: c.group,
      label: c.label,
      weight: idx.weights[c.code] ?? null,
    })),
    data,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result));

  selfCheck(result);

  console.log(
    `wrote ${data.length} periods -> ${OUT} ` +
    `(newest ${data[0].period}, oldest ${data[data.length - 1].period}; ` +
    `${result.categories.length} series, base ${BASE})`,
  );
}

// --- self-check: fail loudly (exit non-zero) if the emitted JSON is wrong ---
function selfCheck(r) {
  const fail = (msg) => { console.error(`SELF-CHECK FAILED: ${msg}`); process.exit(1); };

  // 1) Nine categories, General Index weight 100.
  if (r.categories.length !== 9) fail(`expected 9 categories, got ${r.categories.length}`);
  const gi = r.categories.find((c) => c.code === 'generalIndex');
  if (!gi || Math.abs((gi.weight ?? 0) - 100) > 0.01) {
    fail(`General index weight should be 100, got ${gi && gi.weight}`);
  }

  // 2) Periods unique and strictly ordered (newest-first, descending).
  const periods = r.data.map((d) => d.period);
  if (new Set(periods).size !== periods.length) fail('duplicate periods found');
  for (let i = 1; i < periods.length; i++) {
    if (!(periods[i] < periods[i - 1])) {
      fail(`periods not strictly descending at ${periods[i - 1]} -> ${periods[i]}`);
    }
  }

  // 3) Known cells (from the source sheets) — index values and one growth value.
  const byP = Object.fromEntries(r.data.map((d) => [d.period, d]));
  const expectIndex = [
    ['2026-02', 'generalIndex', 159.0],
    ['2026-02', 'electricity', 198.4],
    ['2026-01', 'generalIndex', 169.9],
    ['2025-12', 'consumerDurables', 139.2],
  ];
  for (const [period, code, want] of expectIndex) {
    const got = byP[period] && byP[period].index[code];
    if (got == null || Math.abs(got - want) > 0.001) {
      fail(`index[${period}][${code}] expected ${want}, got ${got}`);
    }
  }
  // Growth-rate cross-check (sheet 2): 2026-02 General Index ≈ 5.2283.
  const grGI = byP['2026-02'] && byP['2026-02'].growth.generalIndex;
  if (grGI == null || Math.abs(grGI - 5.228325612) > 0.001) {
    fail(`growth[2026-02][generalIndex] expected ~5.2283, got ${grGI}`);
  }

  console.log('self-check passed: 9 series, weights, ordering, and 5 known cells OK');
}

main();
