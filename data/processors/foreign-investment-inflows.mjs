// Processor: foreign-investment-inflows (monthly) — hybrid xlsx base + fresh SDMX append.
//
// The xlsx (RBIB Table No. 34) is the historical base, kept verbatim. Fresh
// months beyond the base's newest month are appended from the scraped SDMX CSV.
//
// Emits (newest-first):
//   out/foreign-investment-inflows.json         (base + appended SDMX months)
//   out/foreign-investment-inflows-recent.json  (first 12 records)
//
// --- SDMX mapping (validated against the base) ---
// Values are US $ Crores (base unit). SDMX OBS_VALUE is absolute USD, so
// US$ crore = OBS / 1e7. Using the NEW categorisation (INVT_CAT_RN), which is the
// vintage the base itself was built from (the base starts 2011:03, exactly where
// the NEW codes begin; the OLD codes only run up to 2011-02):
//   netFdi                 = INV_CAT_NET_FR_DIR_INV   (A. Net Foreign Direct Investment)
//   netPortfolioInvestment = INV_CAT_NET_PORTF_INV    (B. Net Portfolio Investment)
//   totalInvestmentInflows = (A + B)                  (C. Total Investment Inflows)
// Verified across all 174 overlap months: 168 exact, 169 within ±1. The remaining
// months are the 5 most recent (Apr–Aug 2025), where RBI has since revised its
// provisional figures — a legitimate upstream revision, not a mapping error. Those
// months are older than the base's newest month, so the base rows are retained for
// them anyway (only strictly-newer months are appended).

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_SRC = path.join(__dirname, '..', 'sources',
  'RBIB Table No. 34 _ Foreign Investment Inflows.xlsx');
const SDMX_SRC = path.join(__dirname, '..', 'sdmx',
  'external-sector', 'international-finance', 'foreign-investment-inflows.csv');
const OUT_DIR = path.join(__dirname, 'out');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// excelize renders unformatted numeric cells with round-half-away-from-zero.
function roundInt(x) {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

// Mirror Go's parseFloat: strip commas, empty/"-"/"N/A" -> 0, else parse.
function parseFloat_(v) {
  const s = String(v ?? '').trim().replaceAll(',', '');
  if (s === '' || s === '-' || s === 'N/A') return 0;
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

// excelize GetRows trims trailing empty cells; this returns that trimmed length.
function trimmedLen(row) {
  let last = -1;
  for (let c = 0; c < row.length; c++) {
    if (String(row[c] ?? '') !== '') last = c;
  }
  return last + 1;
}

// "2025:08(AUG)" -> "2025-08" (sortable month key).
function monthLabelToKey(label) {
  return `${label.slice(0, 4)}-${label.slice(5, 7)}`;
}

// SDMX "2025-08-31" (last-of-month) -> month label "2025:08(AUG)".
function isoToMonthLabel(iso) {
  const [y, m] = iso.split('-');
  return `${y}:${m}(${MONTHS[Number(m) - 1]})`;
}

// SDMX "2025-08-31" -> "2025-08".
function isoToMonthKey(iso) {
  return iso.slice(0, 7);
}

// --- xlsx base ---
function parseXlsxBase() {
  const wb = XLSX.read(fs.readFileSync(XLSX_SRC), { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // The file's !ref understates the used range (A1:Y182), dropping column Z
  // which holds "Total Investment Inflows". Widen it so sheet_to_json keeps col Z.
  const range = XLSX.utils.decode_range(ws['!ref']);
  range.e.c = Math.max(range.e.c, 25);
  ws['!ref'] = XLSX.utils.encode_range(range);

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

  const reportTitle = String(rows[1]?.[1] ?? '').trim();
  const unit = String(rows[3]?.[1] ?? '').trim();

  const data = [];
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (trimmedLen(row) < 26) continue;

    const month = String(row[1] ?? '').trim();
    if (month === '') continue;

    data.push({
      month,
      netFdi: roundInt(parseFloat_(row[2])),
      netPortfolioInvestment: roundInt(parseFloat_(row[20])),
      totalInvestmentInflows: roundInt(parseFloat_(row[25])),
    });
  }

  return { data, reportTitle, unit };
}

// --- SDMX ---
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

// Parse SDMX into { [isoDate]: { [NEW cat code]: OBS_VALUE } } (NEW categorisation only).
function parseSdmx(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const hdr = splitCsvLine(lines[0]);
  const iCat = hdr.indexOf('INVT_CAT_RN');
  const iTime = hdr.indexOf('TIME_PERIOD');
  const iVal = hdr.indexOf('OBS_VALUE');
  if ([iCat, iTime, iVal].some((i) => i < 0)) {
    throw new Error('SDMX FII CSV missing expected columns');
  }

  const byDate = {};
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    const cat = c[iCat];
    if (cat === 'N_A') continue;
    const val = Number(c[iVal]);
    if (!Number.isFinite(val)) continue;
    (byDate[c[iTime]] = byDate[c[iTime]] || {})[cat] = val;
  }
  return byDate;
}

// Map one SDMX date's raw obs into a base-shaped row. Returns null if the net
// codes are absent (older months use the OLD categorisation instead).
function sdmxRow(iso, s) {
  const fdi = s['INV_CAT_NET_FR_DIR_INV'];
  const pi = s['INV_CAT_NET_PORTF_INV'];
  if (fdi == null || pi == null) return null;
  return {
    month: isoToMonthLabel(iso),
    netFdi: roundInt(fdi / 1e7),
    netPortfolioInvestment: roundInt(pi / 1e7),
    totalInvestmentInflows: roundInt((fdi + pi) / 1e7),
  };
}

// Reconciliation gate: SDMX-derived rows must reproduce the base rows on the
// overlap (within ±1), allowing recent-month revisions. The mapping is trusted
// only if the overwhelming majority reconcile.
function reconcile(base, byDate) {
  const byMonthKey = {};
  for (const iso of Object.keys(byDate)) byMonthKey[isoToMonthKey(iso)] = iso;

  let checked = 0;
  let within1 = 0;
  const failures = [];
  for (const b of base) {
    const iso = byMonthKey[monthLabelToKey(b.month)];
    if (!iso) continue;
    const m = sdmxRow(iso, byDate[iso]);
    if (!m) continue;
    checked++;
    const ok = Math.abs(m.netFdi - b.netFdi) <= 1
      && Math.abs(m.netPortfolioInvestment - b.netPortfolioInvestment) <= 1
      && Math.abs(m.totalInvestmentInflows - b.totalInvestmentInflows) <= 1;
    if (ok) within1++;
    else failures.push(
      `${b.month}: base[${b.netFdi},${b.netPortfolioInvestment},${b.totalInvestmentInflows}] ` +
      `sdmx[${m.netFdi},${m.netPortfolioInvestment},${m.totalInvestmentInflows}]`,
    );
  }
  return { checked, within1, failures };
}

function main() {
  const base = parseXlsxBase();
  const byDate = parseSdmx(fs.readFileSync(SDMX_SRC, 'utf8'));

  const { checked, within1, failures } = reconcile(base.data, byDate);
  if (checked < 6) {
    throw new Error(`FII reconciliation: only ${checked} overlap months (<6) — cannot trust SDMX append`);
  }
  // Require the bulk of overlap months to reconcile; a small tail of recent-month
  // revisions is expected and acceptable.
  if (within1 / checked < 0.9) {
    console.error(`FII reconciliation FAILED: only ${within1}/${checked} overlap months within ±1`);
    failures.slice(0, 20).forEach((f) => console.error('  ' + f));
    throw new Error('FII SDMX mapping does not reproduce the base — refusing to append');
  }

  // Append SDMX months strictly newer than the base's newest month.
  const baseNewestKey = monthLabelToKey(base.data[0].month);
  const appended = Object.keys(byDate)
    .filter((iso) => isoToMonthKey(iso) > baseNewestKey)
    .sort()
    .reverse()
    .map((iso) => sdmxRow(iso, byDate[iso]))
    .filter((r) => r !== null);

  const data = [...appended, ...base.data]; // newest-first
  const full = { data, reportTitle: base.reportTitle, unit: base.unit };

  const recent = {
    data: full.data.slice(0, 12),
    reportTitle: full.reportTitle,
    unit: full.unit,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'foreign-investment-inflows.json'), JSON.stringify(full));
  fs.writeFileSync(path.join(OUT_DIR, 'foreign-investment-inflows-recent.json'), JSON.stringify(recent));

  console.log(
    `wrote ${full.data.length} records (base ${base.data.length} + ${appended.length} SDMX; ` +
    `reconciled ${within1}/${checked} overlap months; newest ${full.data[0].month})`,
  );
}

main();
