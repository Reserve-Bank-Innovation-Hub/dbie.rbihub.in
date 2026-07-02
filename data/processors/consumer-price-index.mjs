// Processor: consumer-price-index (Table No. 19) — monthly CPI, Rural/Urban/Combined.
//
// The source workbook carries THREE sheets, one per base period:
//   "CPI - 2010=100 (All India)"  (Jan-2011 … Dec-2014)
//   "CPI - 2012=100 (All India)"  (Jan-2013 … Dec-2025)
//   "CPI - 2024=100 (All India)"  (Jan-2025 … Mar-2026)
// The three overlap in time but use different commodity taxonomies and different
// index levels, so they are NOT a single continuous series — each base is emitted
// as its own series (newest-first) rather than being spliced together.
//
// Every sheet shares one 10-column layout (0-based):
//   col1 = month ("DEC-2014"), col2 = commodity description,
//   col3 = "Provisional"/"Final", then three group pairs
//   col4/5 = Rural (Index, Inflation %), col6/7 = Urban, col8/9 = Combined.
// Header spans rows 5-6; data starts at row 7. A trailing blank row + a "Note:"
// row (whose text lands in col1) close each sheet.
//
// Cell conventions (mirrors the house parseFloat idiom):
//   "-"  -> null  (e.g. Rural housing index, which RBI does not compile)
//   ""   -> null  (inflation is blank for a base's earliest 12 months — no YoY yet)
//   commas stripped, then parsed as a float; non-numeric -> null.
//
// Provisional/Final: the 2010=100 sheet lists most (month, commodity) pairs twice
// (a Final row followed by a Provisional row). Final is the revised authoritative
// figure, so when both exist we keep Final and drop the Provisional duplicate; the
// kept row records its `status` ("F"/"P"). The newer sheets carry a single row per
// pair (Final for settled months, Provisional for the latest one or two).
//
// Emits out/consumer-price-index.json.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(
  __dirname,
  '../publications/monthly-rbi-bulletin/prices-and-production/table-19-consumer-price-index-base-2010-100.xlsx',
);
const OUT_DIR = path.join(__dirname, 'out');
const OUT = path.join(OUT_DIR, 'consumer-price-index.json');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// "DEC-2014" -> "2014-12" (ISO year-month, sortable + newest-first friendly).
function monthToISO(m) {
  const [mon, year] = m.split('-');
  const idx = MONTHS.indexOf(mon.toUpperCase());
  if (idx < 0 || !/^\d{4}$/.test(year || '')) return null;
  return `${year}-${String(idx + 1).padStart(2, '0')}`;
}

// Base label lifted from the "Base : 2010 = 100" row (row index 3, col 1), squashed
// to a compact "2010=100"; falls back to parsing the sheet name.
function baseLabel(rows, sheetName) {
  const raw = cellStr(rows[3], 1).trim(); // "Base : 2010 = 100"
  const m = raw.match(/([\d]{4})\s*=\s*(\d+)/);
  if (m) return `${m[1]}=${m[2]}`;
  const sm = sheetName.match(/([\d]{4})=(\d+)/);
  return sm ? `${sm[1]}=${sm[2]}` : sheetName;
}

// Mirror of the house parseFloat, but blank/"-" become null (not 0) — CPI genuinely
// omits some cells (rural housing, earliest inflation) and 0 would be a wrong value.
function parseNum(v) {
  const s = String(v == null ? '' : v).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function cellStr(row, i) {
  const v = row && row[i];
  return v == null ? '' : String(v);
}

// Parse one sheet into a series { base, sheetName, months, commodities, rows }.
function parseSheet(ws, sheetName) {
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });
  if (rows.length < 8) throw new Error(`sheet "${sheetName}" too short`);

  const base = baseLabel(rows, sheetName);

  // Commodity descriptions in first-seen order (canonical display order). The status
  // preferences per (month, commodity): keep Final over a later Provisional dupe.
  const commodityOrder = [];
  const commoditySeen = new Set();
  const monthOrder = [];
  const monthSeen = new Set();
  const byKey = new Map(); // "iso|commodity" -> row object

  for (let i = 7; i < rows.length; i++) {
    const row = rows[i] || [];
    const monthCell = cellStr(row, 1).trim();
    const commodity = cellStr(row, 2).trim();

    // Skip the trailing blank spacer and the "Note:" footer (its text lands in col1).
    if (monthCell === '' || monthCell.startsWith('Note:')) continue;
    if (commodity === '') continue;

    const iso = monthToISO(monthCell);
    if (!iso) continue; // guard against any stray non-month text in col1

    const status = cellStr(row, 3).trim().toUpperCase().startsWith('F') ? 'F' : 'P';

    if (!commoditySeen.has(commodity)) {
      commoditySeen.add(commodity);
      commodityOrder.push(commodity);
    }
    if (!monthSeen.has(iso)) {
      monthSeen.add(iso);
      monthOrder.push(iso);
    }

    const key = `${iso}|${commodity}`;
    const existing = byKey.get(key);
    // Prefer Final over Provisional when a pair appears twice; otherwise first wins.
    if (existing && !(existing.status !== 'F' && status === 'F')) continue;

    byKey.set(key, {
      month: iso,
      commodity,
      status,
      ruralIndex: parseNum(row[4]),
      ruralInflation: parseNum(row[5]),
      urbanIndex: parseNum(row[6]),
      urbanInflation: parseNum(row[7]),
      combinedIndex: parseNum(row[8]),
      combinedInflation: parseNum(row[9]),
    });
  }

  // Months newest-first (ISO strings sort lexicographically = chronologically).
  const months = [...monthOrder].sort().reverse();
  const commodities = commodityOrder.map((description) => ({ description }));
  // Emit rows newest-month-first, commodities in canonical order within a month.
  const rowsOut = [];
  for (const iso of months) {
    for (const c of commodityOrder) {
      const r = byKey.get(`${iso}|${c}`);
      if (r) rowsOut.push(r);
    }
  }

  return { base, sheetName, months, commodities, rows: rowsOut };
}

function main() {
  const wb = XLSX.read(fs.readFileSync(SRC), { type: 'buffer' });
  if (wb.SheetNames.length === 0) throw new Error('no sheets in CPI workbook');

  const rows0 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1, raw: false, defval: null, blankrows: true,
  });
  const reportTitle = cellStr(rows0[1], 1).trim(); // "CPI - Rural, Urban, Combined (All India)"

  const series = wb.SheetNames.map((sn) => parseSheet(wb.Sheets[sn], sn));

  // Order series newest-base first (by the base year), so the page defaults to the
  // current base (2024=100), which carries the latest month.
  series.sort((a, b) => Number(b.base.split('=')[0]) - Number(a.base.split('=')[0]));

  const result = { reportTitle, source: 'Reserve Bank of India', series };

  // --- self-checks: assert known cells landed, months unique + ordered ------------
  const find = (s, iso, commodity) =>
    s.rows.find((r) => r.month === iso && r.commodity === commodity);

  const checks = [
    // 2024=100, Mar-2026 General Index (Provisional): Combined 104.84, inflation 3.4
    ['2024=100', '2026-03', 'A) General Index', { combinedIndex: 104.84, combinedInflation: 3.4, status: 'P' }],
    // 2024=100, rural housing group is compiled here (not "-"): Rural 103.07
    ['2024=100', '2026-03', '04 Housing, water, electricity, gas and other fuels', { ruralIndex: 103.07 }],
    // 2012=100, Dec-2025 General Index (Provisional): Combined 198, urban 195.9
    ['2012=100', '2025-12', 'A) General Index', { combinedIndex: 198, urbanIndex: 195.9, status: 'P' }],
    // 2012=100 Dec-2025 Housing: Rural is not compiled -> null
    ['2012=100', '2025-12', 'A.4) Housing', { ruralIndex: null, urbanIndex: 186.9 }],
    // 2010=100, Dec-2014 General Index: Final kept (dedup) -> Rural 146.6, status F
    ['2010=100', '2014-12', 'A) General Index', { ruralIndex: 146.6, urbanIndex: 142.5, status: 'F' }],
  ];

  const failures = [];
  for (const [base, iso, commodity, expect] of checks) {
    const s = series.find((x) => x.base === base);
    if (!s) { failures.push(`series ${base} missing`); continue; }
    const r = find(s, iso, commodity);
    if (!r) { failures.push(`${base} ${iso} "${commodity}" row missing`); continue; }
    for (const [k, v] of Object.entries(expect)) {
      if (r[k] !== v) failures.push(`${base} ${iso} "${commodity}" .${k}: got ${JSON.stringify(r[k])}, expected ${JSON.stringify(v)}`);
    }
  }

  // Months unique + strictly descending within each series.
  for (const s of series) {
    const uniq = new Set(s.months);
    if (uniq.size !== s.months.length) failures.push(`${s.base}: months not unique`);
    for (let i = 1; i < s.months.length; i++) {
      if (!(s.months[i] < s.months[i - 1])) {
        failures.push(`${s.base}: months not strictly newest-first at ${s.months[i - 1]} -> ${s.months[i]}`);
        break;
      }
    }
    // Every row's month must be in the months list, and every row's commodity known.
    const commSet = new Set(s.commodities.map((c) => c.description));
    for (const r of s.rows) {
      if (!uniq.has(r.month)) { failures.push(`${s.base}: row month ${r.month} not in months`); break; }
      if (!commSet.has(r.commodity)) { failures.push(`${s.base}: row commodity "${r.commodity}" not in commodities`); break; }
    }
  }

  if (failures.length > 0) {
    console.error('consumer-price-index self-checks FAILED:');
    failures.forEach((f) => console.error('  ' + f));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result));

  const summary = series
    .map((s) => `${s.base}: ${s.months.length}mo × ${s.commodities.length}comm, ${s.rows.length} rows (${s.months[s.months.length - 1]}…${s.months[0]})`)
    .join('  |  ');
  console.log(`wrote ${series.length} series -> ${OUT}\n  ${summary}\n  self-checks: ${checks.length} cell assertions + ordering all passed`);
}

main();
