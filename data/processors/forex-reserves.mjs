// Processor: forex-reserves (weekly) — hybrid xlsx base + fresh SDMX append.
//
// The xlsx (RBIB Table No. 32) is the historical base. It carries real
// goldVolumeMetricTonnes and is kept verbatim as the base rows. Fresh weeks
// beyond the base's newest week are appended from the scraped SDMX CSV
// (which has no gold-volume column -> goldVolumeMetricTonnes: null).
//
// Emits (newest-first):
//   out/forex-reserves.json         (base + appended SDMX weeks)
//   out/forex-reserves-recent.json  (first 26 records)
//
// --- xlsx column-label quirk (load-bearing) ---
// The SDRs block in the sheet has THREE sub-columns (₹ Crores, SDRs Millions,
// US $Millions) but the original Go parser assumed two, so its field labels are
// shifted from column 9 onwards and the row is truncated before RTP US$Millions:
//   base.sdrsINR = SDRs ₹ Crores          (col 9)
//   base.sdrsUSD = SDRs "SDRs Millions"   (col 10)  <- NOT US$; often blank -> 0
//   base.rtpINR  = SDRs US $Millions      (col 11)
//   base.rtpUSD  = RTP  ₹ Crores          (col 12)
//   (RTP US$Millions is not stored at all)
// We reproduce that exact stored layout when mapping SDMX so appended weeks stay
// consistent with the base. Verified: over the full overlap the SDMX conversions
// reproduce the base to within ±1 on every column (737 weeks on the SDRs-millions
// column alone), the only gap being recent weeks where the sheet itself leaves the
// "SDRs Millions" cell blank.

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(
  __dirname,
  '../sources/RBIB Table No. 32 _ Foreign Exchange Reserves - Weekly.xlsx',
);
const SDMX_SRC = path.join(
  __dirname,
  '../sdmx/external-sector/forex-reserve/foreign-exchange-reserves.csv',
);
const OUT_DIR = path.join(__dirname, 'out');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Round half away from zero to an integer, matching the display rounding the base uses.
function roundInt(x) {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

// Mirror of the Go parseFloat helper.
function parseFloat_(s) {
  s = String(s == null ? '' : s).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const val = Number(s);
  if (!Number.isFinite(val)) return 0;
  return val;
}

// excelize GetRows trims trailing empty cells; reproduce that effective length.
function trimmedLen(row) {
  let n = row.length;
  while (n > 0 && (row[n - 1] == null || String(row[n - 1]) === '')) n--;
  return n;
}

function cellStr(row, i) {
  const v = row[i];
  return v == null ? '' : String(v);
}

// "14-Nov-2025" -> "2025-11-14" (ISO, for date comparison / SDMX join).
function weekEndedToISO(w) {
  const [d, m, y] = w.split('-');
  const mm = String(MONTHS.indexOf(m) + 1).padStart(2, '0');
  return `${y}-${mm}-${d.padStart(2, '0')}`;
}

// "2025-11-14" -> "14-Nov-2025".
function isoToWeekEnded(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[Number(m) - 1]}-${y}`;
}

// --- xlsx base ---
function parseXlsxBase(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheets = wb.SheetNames;
  if (sheets.length === 0) throw new Error('no sheets found in Excel file');
  const ws = wb.Sheets[sheets[0]];

  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: true,
  });

  if (rows.length < 7) throw new Error('insufficient rows in file');

  let reportTitle = '';
  if (rows.length > 1 && (rows[1] || []).length > 1) {
    reportTitle = cellStr(rows[1], 1);
  }

  const data = [];
  let currentYear = '';

  for (let i = 5; i < rows.length; i++) {
    const row = rows[i] || [];
    const len = trimmedLen(row);
    if (len < 3) continue;

    const col1 = cellStr(row, 1).trim();
    if (col1 === '') continue;

    const isDate = MONTHS.some((m) => col1.includes(m));
    if (!isDate) {
      currentYear = col1;
      continue;
    }

    const dataRow = {
      weekEnded: col1,
      year: currentYear,
      totalReservesINR: 0,
      totalReservesUSD: 0,
      foreignCurrencyINR: 0,
      foreignCurrencyUSD: 0,
      goldINR: 0,
      goldUSD: 0,
      goldVolumeMetricTonnes: 0,
      sdrsINR: 0,
      sdrsUSD: 0,
      rtpINR: 0,
      rtpUSD: 0,
    };

    if (len > 2) dataRow.totalReservesINR = parseFloat_(row[2]);
    if (len > 3) dataRow.totalReservesUSD = parseFloat_(row[3]);
    if (len > 4) dataRow.foreignCurrencyINR = parseFloat_(row[4]);
    if (len > 5) dataRow.foreignCurrencyUSD = parseFloat_(row[5]);
    if (len > 6) dataRow.goldINR = parseFloat_(row[6]);
    if (len > 7) dataRow.goldUSD = parseFloat_(row[7]);
    if (len > 8) dataRow.goldVolumeMetricTonnes = parseFloat_(row[8]);
    if (len > 9) dataRow.sdrsINR = parseFloat_(row[9]);
    if (len > 10) dataRow.sdrsUSD = parseFloat_(row[10]);
    if (len > 11) dataRow.rtpINR = parseFloat_(row[11]);
    if (len > 12) dataRow.rtpUSD = parseFloat_(row[12]);

    data.push(dataRow);
  }

  if (data.length === 0) throw new Error('no valid data found in file');
  return { data, reportTitle };
}

// --- SDMX ---
// Quote-aware split for a single CSV line (the file is simple, but be safe).
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// Parse SDMX into { [isoDate]: { 'FER_SDR_INR': obs, ... } } keyed by type_unit.
function parseSdmx(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const hdr = splitCsvLine(lines[0]);
  const iType = hdr.indexOf('TYP_MAJ_FR_EXC_RES_RN');
  const iUnit = hdr.indexOf('UNIT_MEASURE');
  const iTime = hdr.indexOf('TIME_PERIOD');
  const iVal = hdr.indexOf('OBS_VALUE');
  if ([iType, iUnit, iTime, iVal].some((i) => i < 0)) {
    throw new Error('SDMX forex CSV missing expected columns');
  }

  const byDate = {};
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    const date = c[iTime];
    const key = c[iType] + '_' + c[iUnit];
    const val = Number(c[iVal]);
    if (!Number.isFinite(val)) continue;
    (byDate[date] = byDate[date] || {})[key] = val;
  }
  return byDate;
}

// Map one SDMX date's raw obs into a base-shaped row (see column-quirk note above).
// INR crore = OBS / 1e7; USD million = OBS / 1e6.
function sdmxRow(iso, s) {
  const inr = (k) => (s[k] == null ? 0 : roundInt(s[k] / 1e7));
  const usdM = (k) => (s[k] == null ? 0 : roundInt(s[k] / 1e6));
  return {
    weekEnded: isoToWeekEnded(iso),
    year: '',
    totalReservesINR: inr('FER_TTL_INR'),
    totalReservesUSD: usdM('FER_TTL_USD'),
    foreignCurrencyINR: inr('FER_FR_CURR_ASS_INR'),
    foreignCurrencyUSD: usdM('FER_FR_CURR_ASS_USD'),
    goldINR: inr('FER_GLD_INR'),
    goldUSD: usdM('FER_GLD_USD'),
    goldVolumeMetricTonnes: null, // not carried by SDMX
    sdrsINR: inr('FER_SDR_INR'),
    sdrsUSD: usdM('FER_SDR_SDR'), // "SDRs Millions" column in the base layout
    rtpINR: usdM('FER_SDR_USD'), // SDR "US $Millions" column in the base layout
    rtpUSD: inr('FER_RES_TRN_POS_INR'), // RTP "₹ Crores" column in the base layout
  };
}

// Reconciliation gate: SDMX-derived rows must reproduce the base rows on the
// overlap (within ±1). The base's sdrsUSD column is genuinely blank (0) for some
// recent weeks where the sheet omits the "SDRs Millions" cell — a base-source gap,
// not a mapping error — so exclude components the base itself left at 0.
// Each base column maps to the underlying SDMX type_unit key, so the gate can tell
// "SDMX carries this value and it differs" (a real misalignment -> fail) apart from
// "SDMX lacks this observation for this week" (a source gap -> skip, but counted).
const COL_SDMX_KEY = {
  totalReservesINR: 'FER_TTL_INR',
  totalReservesUSD: 'FER_TTL_USD',
  foreignCurrencyINR: 'FER_FR_CURR_ASS_INR',
  foreignCurrencyUSD: 'FER_FR_CURR_ASS_USD',
  goldINR: 'FER_GLD_INR',
  goldUSD: 'FER_GLD_USD',
  sdrsINR: 'FER_SDR_INR',
  sdrsUSD: 'FER_SDR_SDR',
  rtpINR: 'FER_SDR_USD',
  rtpUSD: 'FER_RES_TRN_POS_INR',
};

function reconcile(base, byDate) {
  const cols = Object.keys(COL_SDMX_KEY);
  let checked = 0;
  let gaps = 0; // components the base has but SDMX omits (source gaps, not errors)
  const failures = [];
  for (const b of base) {
    const iso = weekEndedToISO(b.weekEnded);
    const s = byDate[iso];
    if (!s) continue;
    const m = sdmxRow(iso, s);
    checked++;
    for (const col of cols) {
      if (b[col] === 0) continue; // skip base-blank components
      if (s[COL_SDMX_KEY[col]] == null) { gaps++; continue; } // SDMX omits this obs
      if (Math.abs(m[col] - b[col]) > 1) {
        failures.push(`${b.weekEnded} ${col}: base=${b[col]} sdmx=${m[col]}`);
      }
    }
  }
  return { checked, gaps, failures };
}

function main() {
  const base = parseXlsxBase(fs.readFileSync(XLSX_SRC));
  const byDate = parseSdmx(fs.readFileSync(SDMX_SRC, 'utf8'));

  const { checked, gaps, failures } = reconcile(base.data, byDate);
  if (checked < 5) {
    throw new Error(`forex reconciliation: only ${checked} overlap weeks (<5) — cannot trust SDMX append`);
  }
  if (failures.length > 0) {
    console.error(`forex reconciliation FAILED on ${failures.length} component(s):`);
    failures.slice(0, 20).forEach((f) => console.error('  ' + f));
    throw new Error('forex SDMX values misaligned with base — refusing to append');
  }

  // Append SDMX weeks strictly newer than the base's newest week.
  const baseNewestISO = weekEndedToISO(base.data[0].weekEnded);
  const appended = Object.keys(byDate)
    .filter((iso) => iso > baseNewestISO)
    .sort()
    .reverse()
    .map((iso) => sdmxRow(iso, byDate[iso]));

  const data = [...appended, ...base.data]; // newest-first
  const full = { data, reportTitle: base.reportTitle };

  const recentCount = Math.min(26, full.data.length);
  const recent = { data: full.data.slice(0, recentCount), reportTitle: full.reportTitle };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'forex-reserves.json'), JSON.stringify(full));
  fs.writeFileSync(path.join(OUT_DIR, 'forex-reserves-recent.json'), JSON.stringify(recent));

  console.log(
    `wrote ${full.data.length} records (base ${base.data.length} + ${appended.length} SDMX; ` +
    `reconciled ${checked} overlap weeks, ${gaps} source-gap components skipped; ` +
    `newest ${full.data[0].weekEnded})`,
  );
}

main();
