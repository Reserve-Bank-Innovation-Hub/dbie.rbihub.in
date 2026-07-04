// Processor: home — the home page's markers and chart series, derived from
// other processors' outputs (NOT from raw sources). Must run LAST in build.mjs.
//
// Replaces the hand-maintained src/data/markers.json: every marker is read from
// the committed data and carries its own as-of period, so a data refresh commit
// refreshes the home page automatically.
//
// Emits: out/home.json
//   {
//     markers : [ { label, value, as_of } × 8 ],
//     charts  : { usd_inr | inflation | corridor | upi | trade | reserves :
//                 { dates : ISO[], series : [ { key, label, values } ] } }
//   }
// Chart series are aligned to their chart's dates, oldest-first, ready for
// TimeSeriesChart. Presentation (titles, units, links) lives in the page.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');

const read = (name) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, name + '.json'), 'utf8'));

const sei = read('select-economic-indicators');   // RBIB Table 1, monthly, newest-first
const er = read('exchange-rates');                // daily, oldest-first
const psi = read('payment-system-indicators');    // monthly, newest-first
const ft = read('foreign-trade');                 // monthly, newest-first
const fx = read('forex-reserves');                // weekly, newest-first

// ── date helpers ─────────────────────────────────────────────────────────────
const MONTH = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

// "Jan 2026" | "Jan-2026" -> "2026-01-01"
function monthToISO(m) {
  const [mon, year] = m.split(/[ -]/);
  if (!MONTH[mon] || !/^\d{4}$/.test(year)) throw new Error(`unparseable month "${m}"`);
  return `${year}-${MONTH[mon]}-01`;
}
// "19-Jun-2026" -> "2026-06-19"
function dmyToISO(d) {
  const [day, mon, year] = d.split('-');
  if (!MONTH[mon]) throw new Error(`unparseable date "${d}"`);
  return `${year}-${MONTH[mon]}-${day.padStart(2, '0')}`;
}

const round = (v, dp) => (v == null ? null : Number(v.toFixed(dp)));

// ── markers ──────────────────────────────────────────────────────────────────
// Latest month in Table 1 with a non-null value for the field (rows newest-first).
function latestSei(field) {
  const row = sei.data.find((r) => r[field] != null);
  if (!row) throw new Error(`no non-null ${field} in select-economic-indicators`);
  return { value: row[field], asOf: row.month };
}

const pct = (v) => v.toFixed(2) + '%';

const markerDefs = [
  { label: 'Policy repo rate',          field: 'policy_repo_rate' },
  { label: 'SDF rate',                  field: 'sdf_rate' },
  { label: 'MSF rate',                  field: 'msf_rate' },
  { label: 'Cash reserve ratio',        field: 'crr' },
  { label: 'Statutory liquidity ratio', field: 'slr' },
  { label: 'CPI inflation',             field: 'cpi_inflation' },
  { label: 'Call money rate',           field: 'call_money_rate' },
];

const markers = markerDefs.map(({ label, field }) => {
  const { value, asOf } = latestSei(field);
  return { label, value: pct(value), as_of: asOf };
});

const lastFx = er.data[er.data.length - 1];
markers.push({
  label: 'Exchange rate (USD/INR)',
  value: lastFx.usDollar.toFixed(2),
  as_of: lastFx.dateString,
});

// ── charts ───────────────────────────────────────────────────────────────────
// USD/INR daily, last 10 years of the series.
const fxAll = er.data;                              // oldest-first
const lastISO = fxAll[fxAll.length - 1].date.slice(0, 10);
const cutoff = `${Number(lastISO.slice(0, 4)) - 10}${lastISO.slice(4)}`;
const fxWindow = fxAll.filter((r) => r.date.slice(0, 10) >= cutoff);
const usd_inr = {
  dates  : fxWindow.map((r) => r.date.slice(0, 10)),
  series : [ { key: 'usd', label: 'USD/INR', values: fxWindow.map((r) => r.usDollar ?? null) } ],
};

// Table 1 monthly series (reversed to oldest-first).
const seiRows = [...sei.data].reverse();
const seiDates = seiRows.map((r) => monthToISO(r.month));
const seiSeries = (defs) => ({
  dates  : seiDates,
  series : defs.map(([key, label, field]) => ({
    key, label, values: seiRows.map((r) => r[field] ?? null),
  })),
});

const inflation = seiSeries([
  [ 'cpi', 'CPI inflation (YoY)', 'cpi_inflation' ],
  [ 'wpi', 'WPI inflation (YoY)', 'wpi_inflation' ],
]);

// Short labels — the legend shares the top row with the range buttons.
const corridor = seiSeries([
  [ 'repo', 'Repo',       'policy_repo_rate' ],
  [ 'msf',  'MSF',        'msf_rate' ],
  [ 'sdf',  'SDF',        'sdf_rate' ],
  [ 'call', 'Call money', 'call_money_rate' ],
]);

// UPI from payment system indicators (RBIB Table 43; rows newest-first).
const upiValueIdx = psi.columns.findIndex((c) => /^2\.7 UPI/.test(c.group) && /Value/.test(c.measure));
const upiVolumeIdx = psi.columns.findIndex((c) => /^2\.7 UPI/.test(c.group) && /Volume/.test(c.measure));
if (upiValueIdx < 0 || upiVolumeIdx < 0) throw new Error('UPI columns not found in payment-system-indicators');
const psiRows = [...psi.data].reverse();
const upi = {
  dates  : psiRows.map((r) => monthToISO(r.month)),
  series : [
    { key: 'value',  label: 'Value (₹ lakh crore)',        values: psiRows.map((r) => round(r.values[upiValueIdx] / 1e5, 2)) },
    { key: 'volume', label: 'Volume (crore transactions)', values: psiRows.map((r) => round(r.values[upiVolumeIdx] / 100, 1)) },
  ],
};

// Foreign trade, US$ million -> billion (rows newest-first).
const ftRows = [...ft.data].reverse();
const usdBn = (field) => ftRows.map((r) => round(r[field] / 1000, 2));
const trade = {
  dates  : ftRows.map((r) => r.month + '-01'),
  series : [
    { key: 'exports', label: 'Exports',       values: usdBn('exports_usd') },
    { key: 'imports', label: 'Imports',       values: usdBn('imports_usd') },
    { key: 'balance', label: 'Trade balance', values: usdBn('trade_balance_usd') },
  ],
};

// Forex reserves weekly, US$ million -> billion (rows newest-first).
const fxrRows = [...fx.data].reverse();
const resBn = (field) => fxrRows.map((r) => round(r[field] == null ? null : r[field] / 1000, 2));
const reserves = {
  dates  : fxrRows.map((r) => dmyToISO(r.weekEnded)),
  series : [
    { key: 'total', label: 'Total reserves',          values: resBn('totalReservesUSD') },
    { key: 'fca',   label: 'Foreign currency assets', values: resBn('foreignCurrencyUSD') },
    { key: 'gold',  label: 'Gold',                    values: resBn('goldUSD') },
  ],
};

const out = { markers, charts: { usd_inr, inflation, corridor, upi, trade, reserves } };

// ── self-checks: fail loudly if inputs drift ─────────────────────────────────
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

check(markers.length === 8, `expected 8 markers, got ${markers.length}`);
check(markers.every((m) => m.label && m.value && m.as_of), 'marker with empty label/value/as_of');

for (const [name, c] of Object.entries(out.charts)) {
  check(c.dates.length > 0, `${name}: no dates`);
  for (const s of c.series) {
    check(s.values.length === c.dates.length, `${name}/${s.key}: ${s.values.length} values vs ${c.dates.length} dates`);
    check(s.values.every((v) => v === null || Number.isFinite(v)), `${name}/${s.key}: non-finite value`);
  }
  for (let i = 1; i < c.dates.length; i++) {
    if (c.dates[i] <= c.dates[i - 1]) { errors.push(`${name}: dates not ascending at ${c.dates[i]}`); break; }
  }
}

// Anchors — known values in committed history (update alongside a source revision).
const at = (c, date, key) => c.series.find((s) => s.key === key).values[c.dates.indexOf(date)];
check(at(corridor, '2025-03-01', 'repo') === 6.25, 'anchor: repo rate Mar-2025 should be 6.25');
check(at(inflation, '2025-03-01', 'cpi') === 3.34, 'anchor: CPI inflation Mar-2025 should be 3.34');
check(at(upi, '2019-11-01', 'value') === 1.89, 'anchor: UPI value Nov-2019 should be ₹1.89 lakh crore');
check(at(trade, '1990-04-01', 'exports') === 1.44, 'anchor: exports Apr-1990 should be US$1.44bn');
check(at(usd_inr, '2026-07-01', 'usd') === 94.7323, 'anchor: USD/INR 01-Jul-2026 should be 94.7323');
check(at(reserves, '2026-06-19', 'total') === 672.59, 'anchor: reserves 19-Jun-2026 should be US$672.59bn');

if (errors.length > 0) {
  console.error('home self-check FAILED:');
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'home.json'), JSON.stringify(out));
console.log(`wrote home.json (${markers.length} markers, ${Object.keys(out.charts).length} charts); self-check passed`);
