// Processor: home — the home page's stat tiles and chart series, derived from
// other processors' outputs (NOT from raw sources). Must run LAST in build.mjs.
//
// Replaces the hand-maintained src/data/markers.json: every tile is read from
// the committed data and carries its own as-of period, so a data refresh commit
// refreshes the home page automatically.
//
// Emits: out/home.json
//   {
//     markers : [ {                       // 8 stat tiles, in display order
//       key, label, unit,
//       value    : formatted string,      // the number only; the unit is a separate field
//       unit     : short form ("%", "% YoY", "US$ bn", "₹/US$") so it fits beside the value
//       as_of    : display period,        // "Jul 2026" | "04-Sep-2026" | "Q2 2025-26"
//       previous : { value, as_of },      // the observation before the latest one
//       delta    : signed number,         // latest − previous, in the unit's own terms
//                                         // (percentage points for a rate)
//       spark    : { dates : ISO[], values : number[] }   // the last 24 observations
//     } ],
//     charts  : {
//       // time series: dates ascending, every series' values aligned to dates
//       gdp | inflation | corridor | yields | transmission | credit | usd_inr |
//       trade | flows | reserves | upi_value | upi_volume | contributions
//                     : { dates : ISO[], series : [ { key, label, values } ] },
//       liquidity     : { dates : ISO[], series : [ { key : 'net', … } ],
//                         monthly : { dates : ISO[], values } },   // month-average of the daily net
//       yield_curve   : { tenors : string[], curves : [ { key, label, values } ] },
//       cpi_heatmap   : { months : string[], rows : [ { key, label, values } ] },
//       credit_by_sector : { as_of, previous_as_of, rows : [ { key, label, growth, previous } ] },
//       payments_mix  : { months : [ two ], instruments : [ { key, label, shares : [ two ] } ] }
//     }
//   }
// Presentation (titles, units, colours, links) lives in the page; this file only
// decides what the numbers are.

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
const gdpq = read('sdmx-quarterly-gross-domestic-product-at-market-price');   // SDMX wide payload, dates ascending
const fii = read('foreign-investment-inflows-bulletin');   // RBIB Table 34, monthly, newest-first, US$ million
const laf = read('liquidity-operations');                  // RBIB Table 3, daily, newest-first, ₹ crore
const cpi = read('consumer-price-index');                  // three base series, months newest-first
const bcs = read('bank-credit-by-sector');                 // fortnightly, periods oldest-first, ₹ crore

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
// "December  31, 2025" (the credit table doubles the space) -> "2025-12-31"
const MONTH_LONG = [ 'January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December' ];
function longDateToISO(s) {
  const m = String(s).trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  const i = m ? MONTH_LONG.indexOf(m[1]) : -1;
  if (i < 0) throw new Error(`unparseable credit period "${s}"`);
  return `${m[3]}-${String(i + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
// A quarter-end ISO date -> the Indian fiscal quarter it closes, "Q2 2025-26".
function quarterLabel(iso) {
  const y = Number(iso.slice(0, 4)), m = iso.slice(5, 7);
  const q = { '06': 1, '09': 2, '12': 3, '03': 4 }[m];
  if (!q) throw new Error(`not a quarter end: ${iso}`);
  const startYear = q === 4 ? y - 1 : y;
  return `Q${q} ${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
// Month-start ISO plus n months, staying on the first.
function addMonths(iso, n) {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)) - 1 + n;
  return `${y + Math.floor(m / 12)}-${String((m % 12 + 12) % 12 + 1).padStart(2, '0')}-01`;
}

const round = (v, dp) => (v == null || !Number.isFinite(v) ? null : Number(v.toFixed(dp)));

// ── stat tiles ───────────────────────────────────────────────────────────────
// A tile is built from observations given oldest-first as { date (ISO), as_of (display), value }.
// The latest observation is the headline, the one before it the comparison, and the
// last 24 make the sparkline.
const SPARK_POINTS = 24;
function tile({ key, label, unit, decimals, observations }) {
  const obs = observations.filter((o) => o.value != null && Number.isFinite(o.value));
  if (obs.length < 2) throw new Error(`tile ${key}: needs at least two observations, got ${obs.length}`);
  const latest = obs[obs.length - 1];
  const prior = obs[obs.length - 2];
  const spark = obs.slice(-SPARK_POINTS);
  return {
    key,
    label,
    unit,
    value    : latest.value.toFixed(decimals),
    as_of    : latest.as_of,
    previous : { value: prior.value.toFixed(decimals), as_of: prior.as_of },
    delta    : round(latest.value - prior.value, decimals),
    spark    : { dates: spark.map((o) => o.date), values: spark.map((o) => round(o.value, decimals)) },
  };
}

// Table 1 rows oldest-first: every monthly series on the page reads from these.
const seiRows = [...sei.data].reverse();
const seiDates = seiRows.map((r) => monthToISO(r.month));
const seiObs = (field) => seiRows.map((r, i) => ({ date: seiDates[i], as_of: r.month, value: r[field] ?? null }));
const seiSeries = (defs) => ({
  dates  : seiDates,
  series : defs.map(([key, label, pick]) => ({
    key, label, values: seiRows.map((r) => (typeof pick === 'function' ? pick(r) : r[pick] ?? null)),
  })),
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

const inflation = seiSeries([
  [ 'cpi', 'CPI inflation', 'cpi_inflation' ],
  [ 'wpi', 'WPI inflation', 'wpi_inflation' ],
]);

// The policy corridor as a band: the floor is the SDF since April 2022 and the
// reverse repo rate before it (the SDF replaced the fixed-rate reverse repo as the
// floor), the ceiling is the MSF. The repo rate sits inside the band and the call
// money rate is where the market actually traded.
const corridor = seiSeries([
  [ 'floor',   'Floor (SDF, earlier reverse repo)', (r) => r.sdf_rate ?? r.reverse_repo_rate ?? null ],
  [ 'ceiling', 'Ceiling (MSF)',                     'msf_rate' ],
  [ 'repo',    'Repo rate',                         'policy_repo_rate' ],
  [ 'call',    'Call money rate',                   'call_money_rate' ],
]);

// UPI from payment system indicators (RBIB Table 43; rows newest-first).
const upiValueIdx = psi.columns.findIndex((c) => /^2\.7 UPI/.test(c.group) && /Value/.test(c.measure));
const upiVolumeIdx = psi.columns.findIndex((c) => /^2\.7 UPI/.test(c.group) && /Volume/.test(c.measure));
if (upiValueIdx < 0 || upiVolumeIdx < 0) throw new Error('UPI columns not found in payment-system-indicators');
const psiRows = [...psi.data].reverse();
const psiDates = psiRows.map((r) => monthToISO(r.month));
const upi_value = {
  dates  : psiDates,
  series : [ { key: 'value', label: 'UPI value', values: psiRows.map((r) => round(r.values[upiValueIdx] / 1e5, 2)) } ],
};
const upi_volume = {
  dates  : psiDates,
  series : [ { key: 'volume', label: 'UPI volume', values: psiRows.map((r) => round(r.values[upiVolumeIdx] / 100, 1)) } ],
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
//
// Component fields carry the xlsx column shift documented in forex-reserves.mjs:
// the field named rtpINR actually holds SDRs in US$ millions, and RTP in US$ is not
// stored at all, so it is the residual. Verified across all 1329 weeks: the residual
// is never negative and total = FCA + gold + SDRs + residual exactly.
const fxrRows = [...fx.data].reverse();
const resBn = (pick) => fxrRows.map((r) => round(pick(r) == null ? null : pick(r) / 1000, 2));
const rtpUSDm = (r) => (r.totalReservesUSD == null ? null
  : r.totalReservesUSD - (r.foreignCurrencyUSD ?? 0) - (r.goldUSD ?? 0) - (r.rtpINR ?? 0));
const reserves = {
  dates  : fxrRows.map((r) => dmyToISO(r.weekEnded)),
  series : [
    { key: 'fca',   label: 'Foreign currency assets',  values: resBn((r) => r.foreignCurrencyUSD) },
    { key: 'gold',  label: 'Gold',                     values: resBn((r) => r.goldUSD) },
    { key: 'sdr',   label: 'SDRs',                     values: resBn((r) => r.rtpINR) },
    { key: 'rtp',   label: 'Reserve tranche position', values: resBn(rtpUSDm) },
    { key: 'total', label: 'Total reserves',           values: resBn((r) => r.totalReservesUSD) },
  ],
};

// ── real GDP growth ──────────────────────────────────────────────────────────
// Year-on-year growth of quarterly GDP at market prices from DBIE's SDMX dataset: constant prices as the headline
// series, current prices as a second one. The dataset carries three base years; a quarter's growth comes from the
// newest base that has both the quarter and the same quarter a year earlier, so the 2011-12 base serves from
// 2012-13 Q1, the 2004-05 base the years before it, and the 1999-2000 base back to 1997-98 Q1.
const GDP_BASES = [ 'BY_2011_12', 'BY_2004_05', 'BY_1999_2000' ];
const gdpColumn = (base, measure, prices) => {
  const idx = gdpq.columns.findIndex((c) => c.key === `${base}|${measure}|MRKT_CST|${prices}`);
  if (idx < 0) throw new Error(`GDP column ${base}/${measure}/${prices} not found in the quarterly GDP payload`);
  return gdpq.values[idx];
};
function gdpLevels(base, prices) {
  const col = gdpColumn(base, 'CEXP_GDP_MARK_CST', prices);
  const byDate = new Map();
  gdpq.dates.forEach((d, i) => { if (col[i] != null) byDate.set(d, col[i]); });
  return byDate;
}
const yearEarlier = (d) => `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`;
function gdpGrowth(prices) {
  const bases = GDP_BASES.map((b) => gdpLevels(b, prices));
  return gdpq.dates.map((d) => {
    for (const levels of bases) {
      const now = levels.get(d), then = levels.get(yearEarlier(d));
      if (now != null && then != null && then !== 0) return round((now / then - 1) * 100, 1);
    }
    return null;
  });
}
const gdpReal = gdpGrowth('CNST_PRC');
const gdpNominal = gdpGrowth('CURR_PRC');
const gdpFrom = gdpq.dates.findIndex((_, i) => gdpReal[i] != null || gdpNominal[i] != null);
const gdp = {
  dates  : gdpq.dates.slice(gdpFrom),
  series : [
    { key: 'real',    label: 'Real GDP (constant prices)',   values: gdpReal.slice(gdpFrom) },
    { key: 'nominal', label: 'Nominal GDP (current prices)', values: gdpNominal.slice(gdpFrom) },
  ],
};

// ── contributions to GDP growth ──────────────────────────────────────────────
// Expenditure-side contributions, 2011-12 base at constant prices only (the older bases
// do not carry the same expenditure breakdown). A component's contribution to the
// year-on-year growth of quarter t is (X_t − X_{t−4}) / GDP_{t−4} × 100, in percentage
// points; the five add up to the quarter's GDP growth because the components add up to
// GDP itself (exports less imports; stocks, valuables and the statistical discrepancy
// carried together as "other"). The 2011-12 base starts in 2011-12 Q1, so the first
// quarter with a year-earlier level is 2012-13 Q1.
const CN = (m) => gdpColumn('BY_2011_12', m, 'CNST_PRC');
const gdpLevel = {
  pfce  : CN('CEXP_PFCE'),
  gfce  : CN('CEXP_GFCE'),
  gfcf  : CN('CEXP_GFCF'),
  exp   : CN('CEXP_EXP_GDS_SER'),
  imp   : CN('CEXP_IMP_GDS_SER'),
  stock : CN('CEXP_CHG_STOCK'),
  val   : CN('CEXP_VAL'),
  discp : CN('CEXP_DISCP'),
  total : CN('CEXP_GDP_MARK_CST'),
};
const gdpIndexOf = new Map(gdpq.dates.map((d, i) => [ d, i ]));
const contribParts = { pfce: [], gfce: [], gfcf: [], netex: [], other: [], total: [] };
const contribDates = [];
for (let i = 0; i < gdpq.dates.length; i++) {
  const d = gdpq.dates[i];
  const j = gdpIndexOf.get(yearEarlier(d));
  if (j === undefined) continue;
  const base = gdpLevel.total[j];
  const complete = Object.values(gdpLevel).every((col) => col[i] != null && col[j] != null);
  if (!complete || !base) continue;
  const share = (now, then) => round(((now - then) / base) * 100, 1);
  contribDates.push(d);
  contribParts.pfce.push(share(gdpLevel.pfce[i], gdpLevel.pfce[j]));
  contribParts.gfce.push(share(gdpLevel.gfce[i], gdpLevel.gfce[j]));
  contribParts.gfcf.push(share(gdpLevel.gfcf[i], gdpLevel.gfcf[j]));
  contribParts.netex.push(share(gdpLevel.exp[i] - gdpLevel.imp[i], gdpLevel.exp[j] - gdpLevel.imp[j]));
  contribParts.other.push(share(
    gdpLevel.stock[i] + gdpLevel.val[i] + gdpLevel.discp[i],
    gdpLevel.stock[j] + gdpLevel.val[j] + gdpLevel.discp[j],
  ));
  contribParts.total.push(round((gdpLevel.total[i] / base - 1) * 100, 1));
}
const contributions = {
  dates  : contribDates,
  series : [
    { key: 'pfce',  label: 'Private consumption',                  values: contribParts.pfce },
    { key: 'gfce',  label: 'Government consumption',               values: contribParts.gfce },
    { key: 'gfcf',  label: 'Fixed investment',                     values: contribParts.gfcf },
    { key: 'netex', label: 'Net exports',                          values: contribParts.netex },
    { key: 'other', label: 'Stocks, valuables and discrepancies',  values: contribParts.other },
    { key: 'total', label: 'GDP growth',                           values: contribParts.total },
  ],
};

// ── credit, deposits and money; yields ───────────────────────────────────────
// Table 1 gives these as year-on-year growth and month-end rates already.
const credit = seiSeries([
  [ 'credit',   'Bank credit',        'scb_credit' ],
  [ 'deposits', 'Aggregate deposits', 'scb_deposits' ],
  [ 'm3',       'M3',                 'm3' ],
]);

const yields = seiSeries([
  [ 'gsec10', '10-year G-sec',  'gsec_10y' ],
  [ 'tb364',  '364-day T-bill', 'tbill_364d' ],
  [ 'tb91',   '91-day T-bill',  'tbill_91d' ],
]);

// ── yield curve snapshot ─────────────────────────────────────────────────────
// Three curves across the money-market and bond tenors Table 1 carries: the newest month
// quoting all four, the same month a year earlier and five years earlier. If a comparison
// month is short a quote, the nearest earlier complete month stands in for it.
const YIELD_TENORS = [ '91-day', '182-day', '364-day', '10-year' ];
const YIELD_FIELDS = [ 'tbill_91d', 'tbill_182d', 'tbill_364d', 'gsec_10y' ];
const curveComplete = seiRows.map((r, i) => (YIELD_FIELDS.every((f) => r[f] != null)
  ? { date: seiDates[i], label: r.month, values: YIELD_FIELDS.map((f) => r[f]) } : null)).filter(Boolean);
function curveAt(iso) {
  for (let i = curveComplete.length - 1; i >= 0; i--) if (curveComplete[i].date <= iso) return curveComplete[i];
  return null;
}
const curveLatest = curveComplete[curveComplete.length - 1];
const yieldCurves = [
  { key: 'latest', at: curveLatest },
  { key: 'year',   at: curveAt(addMonths(curveLatest.date, -12)) },
  { key: 'five',   at: curveAt(addMonths(curveLatest.date, -60)) },
].filter((c) => c.at);
const yield_curve = {
  tenors : YIELD_TENORS,
  curves : yieldCurves.map((c) => ({ key: c.key, label: c.at.label, values: c.at.values.map((v) => round(v, 2)) })),
};

// ── monetary transmission ────────────────────────────────────────────────────
// Table 1 gives the deposit and lending rates of five major banks as a range, "5.85/6.60";
// the chart draws the range as a band, so each rate becomes a low and a high. A plain
// number (the older rows) is both ends of its own range.
function rangeEnds(v) {
  if (v == null) return [ null, null ];
  if (typeof v === 'number') return [ v, v ];
  const m = String(v).trim().match(/^(\d+(?:\.\d+)?)\s*[\/–-]\s*(\d+(?:\.\d+)?)$/);
  if (m) return [ Number(m[1]), Number(m[2]) ];
  const n = Number(v);
  return Number.isFinite(n) ? [ n, n ] : [ null, null ];
}
const transmission = {
  dates  : seiDates,
  series : [
    { key: 'mclr_low',    label: 'MCLR, overnight, five-bank range',      values: seiRows.map((r) => rangeEnds(r.mclr_overnight)[0]) },
    { key: 'mclr_high',   label: 'MCLR, overnight, upper end',            values: seiRows.map((r) => rangeEnds(r.mclr_overnight)[1]) },
    { key: 'deposit_low', label: 'Term deposit >1 year, five-bank range', values: seiRows.map((r) => rangeEnds(r.term_deposit_rate)[0]) },
    { key: 'deposit_high',label: 'Term deposit >1 year, upper end',       values: seiRows.map((r) => rangeEnds(r.term_deposit_rate)[1]) },
    { key: 'repo',        label: 'Repo rate',                             values: seiRows.map((r) => r.policy_repo_rate ?? null) },
  ],
};

// ── foreign investment flows ─────────────────────────────────────────────────
// Net FDI and net portfolio investment, monthly (rows newest-first, US$ million → billion),
// plus the rolling 12-month sum of the two together, which is what the flow actually adds up
// to over a year. Months are written "2026:01(JAN)"; any other row is not a month and is left out.
const fiiRows = [...fii.data].filter((r) => /^\d{4}:\d{2}\(/.test(r.month)).reverse();
const usdBnOf = (v) => round(v == null ? null : v / 1000, 2);
const flowFdi = fiiRows.map((r) => usdBnOf(r.netFDI));
const flowPortfolio = fiiRows.map((r) => usdBnOf(r.netPortfolioInvestment));
const flowRolling = fiiRows.map((_, i) => {
  if (i < 11) return null;
  let sum = 0;
  for (let k = i - 11; k <= i; k++) {
    if (flowFdi[k] == null || flowPortfolio[k] == null) return null;
    sum += flowFdi[k] + flowPortfolio[k];
  }
  return round(sum, 2);
});
const flows = {
  dates  : fiiRows.map((r) => `${r.month.slice(0, 4)}-${r.month.slice(5, 7)}-01`),
  series : [
    { key: 'fdi',       label: 'Net FDI',                  values: flowFdi },
    { key: 'portfolio', label: 'Net portfolio investment', values: flowPortfolio },
    { key: 'rolling12', label: 'Total, 12-month sum',      values: flowRolling },
  ],
};

// ── liquidity operations ─────────────────────────────────────────────────────
// Net liquidity injected by the RBI, daily (rows newest-first, ₹ crore → lakh crore). Table 3 gives each facility's
// amount and no total, so the net is the injections (repo, variable rate repo, MSF, standing liquidity facilities,
// OMO purchases, LTRO, TLTRO, SLTRO, the mutual fund and NBFC schemes) less the absorptions (reverse repo, variable
// rate reverse repo, SDF, OMO sales, MSS, special reverse repo): positive is injection, negative absorption. A day
// with no figure under any facility is null. The monthly block averages each calendar month's daily nets, which is
// what the chart draws as columns; the daily series stays available underneath it.
const INJECT = [ 'repo', 'variable_rate_repo', 'msf', 'standing_liquidity_facilities', 'omo_purchase', 'ltro', 'tltro', 'sltro_sfb', 'slf_mutual_funds', 'sls_nbfc_hfc' ];
const ABSORB = [ 'reverse_repo', 'variable_rate_reverse_repo', 'sdf', 'omo_sale', 'mss', 'special_reverse_repo' ];
const MDY = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/;   // "Apr 5, 2026"
const lafRows = laf.data.map((r) => {
  const m = r.date.match(MDY);
  if (!m || !MONTH[m[1]]) throw new Error(`unparseable liquidity date "${r.date}"`);
  const has = [...INJECT, ...ABSORB].some((f) => r[f] != null);
  const sum = (fields) => fields.reduce((t, f) => t + (r[f] ?? 0), 0);
  return { date: `${m[3]}-${MONTH[m[1]]}-${m[2].padStart(2, '0')}`, net: has ? round((sum(INJECT) - sum(ABSORB)) / 1e5, 2) : null };
}).sort((a, b) => a.date.localeCompare(b.date));
const lafMonths = new Map();
for (const r of lafRows) {
  if (r.net == null) continue;
  const key = r.date.slice(0, 7) + '-01';
  if (!lafMonths.has(key)) lafMonths.set(key, []);
  lafMonths.get(key).push(r.net);
}
const lafMonthKeys = [...lafMonths.keys()].sort();
const liquidity = {
  dates   : lafRows.map((r) => r.date),
  series  : [ { key: 'net', label: 'Daily net', values: lafRows.map((r) => r.net) } ],
  monthly : {
    dates  : lafMonthKeys,
    values : lafMonthKeys.map((k) => {
      const days = lafMonths.get(k);
      return round(days.reduce((t, v) => t + v, 0) / days.length, 2);
    }),
  },
};

// ── CPI inflation heatmap ────────────────────────────────────────────────────
// The 2012=100 series (series[1] of the consumer price index payload) is the one with the
// full group breakdown; it ends in December 2025, which the card says on its face. Cells are
// the combined (rural + urban) year-on-year inflation the table already reports, for the last
// 36 months, rows being the general index, the six top-level groups and four sub-groups that
// drive the headline most often.
const cpiSeries = cpi.series.find((s) => /2012=100/.test(s.base) || /2012=100/.test(s.sheetName));
if (!cpiSeries) throw new Error('2012=100 series not found in consumer-price-index');
const CPI_ROWS = [
  [ 'general',   'A) General Index',                    'General index' ],
  [ 'food',      'A.1) Food and beverages',             'Food and beverages' ],
  [ 'cereals',   'A.1.1) Cereals and products',         'Cereals and products' ],
  [ 'vegetables','A.1.7) Vegetables',                   'Vegetables' ],
  [ 'pulses',    'A.1.8) Pulses and products',          'Pulses and products' ],
  [ 'pan',       'A.2) Pan, tobacco and intoxicants',   'Pan, tobacco and intoxicants' ],
  [ 'clothing',  'A.3) Clothing and footwear',          'Clothing and footwear' ],
  [ 'housing',   'A.4) Housing',                        'Housing' ],
  [ 'fuel',      'A.5) Fuel and light',                 'Fuel and light' ],
  [ 'transport', 'A.6.3) Transport and communication',  'Transport and communication' ],
  [ 'misc',      'A.6) Miscellaneous',                  'Miscellaneous' ],
];
const CPI_MONTHS = 36;
const cpiMonths = cpiSeries.months.slice(0, CPI_MONTHS).reverse();   // months arrive newest-first
const cpiByKey = new Map(cpiSeries.rows.map((r) => [ `${r.month}|${r.commodity}`, r ]));
const cpi_heatmap = {
  months : cpiMonths,
  rows   : CPI_ROWS.map(([ key, commodity, label ]) => ({
    key, label,
    values : cpiMonths.map((m) => {
      const row = cpiByKey.get(`${m}|${commodity}`);
      if (!row) throw new Error(`CPI heatmap: no row for ${commodity} in ${m}`);
      return round(row.combinedInflation, 2);
    }),
  })),
};

// ── bank credit growth by sector ─────────────────────────────────────────────
// Year-on-year growth of outstanding credit at the newest reporting fortnight, against the
// fortnight nearest twelve months earlier, with the same comparison one year back as the
// "a year ago" end of each dumbbell. Four top-level sectors and the six largest sub-sectors,
// ten rows in all; the gross totals (I, II, III) and the priority-sector memo block are
// aggregates of these rows, not sectors, so they are left out.
const CREDIT_ROWS = [
  [ 'agriculture', '1',   'Agriculture and allied activities' ],
  [ 'industry',    '2',   'Industry' ],
  [ 'micro',       '2.1', 'Micro and small industry' ],
  [ 'large',       '2.3', 'Large industry' ],
  [ 'services',    '3',   'Services' ],
  [ 'trade',       '3.7', 'Trade' ],
  [ 'nbfc',        '3.9', 'Non-banking financial companies' ],
  [ 'personal',    '4',   'Personal loans' ],
  [ 'housing',     '4.2', 'Housing' ],
  [ 'vehicle',     '4.7', 'Vehicle loans' ],
];
const bcsDates = bcs.periods.map(longDateToISO);
const bcsItems = new Map(bcs.items.map((it) => [ it.code, it ]));
// The index of the reporting fortnight closest to the same date `months` months before
// period `i` — the fortnights fall on month ends and mid-months, so the nearest one to the
// anniversary is the right comparison rather than a fixed number of rows back.
function periodNearest(i, months) {
  const [ y, m, d ] = bcsDates[i].split('-').map(Number);
  const back = new Date(Date.UTC(y, m - 1 - months, d));
  const target = back.toISOString().slice(0, 10);
  let best = -1, bestGap = Infinity;
  for (let k = 0; k < bcsDates.length; k++) {
    const gap = Math.abs(Date.parse(bcsDates[k]) - Date.parse(target));
    if (gap < bestGap) { bestGap = gap; best = k; }
  }
  return best;
}
const bcsLatest = bcsDates.length - 1;
const bcsYearAgo = periodNearest(bcsLatest, 12);
const bcsTwoYearsAgo = periodNearest(bcsLatest, 24);
const growthAt = (item, now, then) => {
  const a = item.values[now], b = item.values[then];
  return a == null || b == null || !b ? null : round((a / b - 1) * 100, 1);
};
// The table writes "December  31, 2025"; the site writes dates DD-MM-YYYY.
const bcsAsOf = (i) => bcsDates[i].split('-').reverse().join('-');
const credit_by_sector = {
  as_of          : bcsAsOf(bcsLatest),
  previous_as_of : bcsAsOf(bcsYearAgo),
  rows           : CREDIT_ROWS.map(([ key, code, label ]) => {
    const item = bcsItems.get(code);
    if (!item) throw new Error(`credit by sector: no item with code ${code}`);
    return { key, label, growth: growthAt(item, bcsLatest, bcsYearAgo), previous: growthAt(item, bcsYearAgo, bcsTwoYearsAgo) };
  }).sort((a, b) => (b.growth ?? -Infinity) - (a.growth ?? -Infinity)),
};

// ── retail payments mix ──────────────────────────────────────────────────────
// Shares of retail payment volume, November 2019 against the newest month. The instruments are
// the transaction-volume columns that add up to "Total - Retail Payments (2+3+4+5+6)": the seven
// components of retail credit transfers, the debit-transfer block, credit and debit cards,
// prepaid payment instruments and paper-based instruments. The seven largest by their bigger
// share carry their own colour; the rest are folded into "Other", so eight bands at most —
// the palette's ceiling.
const PAYMENT_GROUPS = [
  [ 'aeps',    '2.1 AePS (Fund Transfers) @',                      'AePS' ],
  [ 'apbs',    '2.2 APBS $',                                        'APBS' ],
  [ 'ecs',     '2.3 ECS Cr',                                        'ECS credit' ],
  [ 'imps',    '2.4 IMPS',                                          'IMPS' ],
  [ 'nach',    '2.5 NACH Cr $',                                     'NACH credit' ],
  [ 'neft',    '2.6 NEFT',                                          'NEFT' ],
  [ 'upi',     '2.7 UPI @',                                         'UPI' ],
  [ 'debits',  '3 Debit Transfers and Direct Debits (3.1 to 3.4)',  'Debit transfers' ],
  [ 'credit_card', '4.1 Credit Cards (4.1.1 to 4.1.2)',             'Credit cards' ],
  [ 'debit_card',  '4.2 Debit Cards (4.2.1 to 4.2.1 )',             'Debit cards' ],
  [ 'ppi',     '5 Prepaid Payment Instruments (5.1 to 5.2)',        'Prepaid instruments' ],
  [ 'paper',   '6 Paper-based Instruments (6.1 to 6.2)',            'Paper-based instruments' ],
];
const PAYMENTS_BASE_MONTH = 'Nov-2019';
const PAYMENTS_NAMED = 7;
const volumeIndex = (group) => {
  const i = psi.columns.findIndex((c) => c.group === group && /Volume/.test(c.measure));
  if (i < 0) throw new Error(`payment volume column not found: ${group}`);
  return i;
};
const paymentIdx = PAYMENT_GROUPS.map(([ key, group, label ]) => ({ key, label, idx: volumeIndex(group) }));
const paymentsTotalIdx = volumeIndex('Total - Retail Payments (2+3+4+5+6)');
const paymentMonths = [ PAYMENTS_BASE_MONTH, psi.data[0].month ];
const paymentRows = paymentMonths.map((m) => {
  const row = psi.data.find((r) => r.month === m);
  if (!row) throw new Error(`payment-system-indicators has no month ${m}`);
  return row;
});
const paymentShares = paymentIdx.map((p) => ({
  key   : p.key,
  label : p.label,
  shares: paymentRows.map((row) => {
    const total = paymentIdx.reduce((t, q) => t + (row.values[q.idx] ?? 0), 0);
    return round(((row.values[p.idx] ?? 0) / total) * 100, 2);
  }),
}));
const paymentsRanked = [...paymentShares].sort((a, b) => Math.max(...b.shares) - Math.max(...a.shares));
const paymentsNamed = paymentsRanked.slice(0, PAYMENTS_NAMED);
const paymentsFolded = paymentsRanked.slice(PAYMENTS_NAMED);
const payments_mix = {
  months      : paymentMonths,
  instruments : [
    ...paymentsNamed,
    { key: 'other', label: 'Other', shares: paymentMonths.map((_, i) => round(paymentsFolded.reduce((t, p) => t + p.shares[i], 0), 2)) },
  ],
};

// ── stat tiles ───────────────────────────────────────────────────────────────
const fxrObs = fxrRows.map((r) => ({ date: dmyToISO(r.weekEnded), as_of: r.weekEnded, value: r.totalReservesUSD == null ? null : r.totalReservesUSD / 1000 }));

// Import cover: the newest weekly reserves against average monthly imports over the last twelve
// months of trade data. Trade lags the reserves by several months, so the same twelve-month
// import bill divides every week in the sparkline — the cover moves with the reserves.
const IMPORT_MONTHS = 12;
const importWindow = ft.data.slice(0, IMPORT_MONTHS);
if (importWindow.length < IMPORT_MONTHS) throw new Error('foreign trade has fewer than twelve months');
const monthlyImports = importWindow.reduce((t, r) => t + r.imports_usd, 0) / IMPORT_MONTHS;
const coverObs = fxrObs.map((o) => ({ ...o, value: o.value == null ? null : (o.value * 1000) / monthlyImports }));

const gdpRealObs = gdp.dates.map((d, i) => ({ date: d, as_of: quarterLabel(d), value: gdp.series[0].values[i] }));
const erObs = fxAll.map((r) => ({ date: r.date.slice(0, 10), as_of: r.dateString, value: r.usDollar ?? null }));

// Units are written short because they sit beside the number on a quarter-width card: anything
// longer wraps under the value instead of sitting next to it.
const markers = [
  tile({ key: 'repo',     label: 'Policy repo rate',          unit: '%',          decimals: 2, observations: seiObs('policy_repo_rate') }),
  tile({ key: 'cpi',      label: 'CPI inflation',             unit: '% YoY',      decimals: 2, observations: seiObs('cpi_inflation') }),
  tile({ key: 'gdp',      label: 'Real GDP growth',           unit: '% YoY',      decimals: 1, observations: gdpRealObs }),
  tile({ key: 'gsec10',   label: '10-year G-sec yield',       unit: '%',          decimals: 2, observations: seiObs('gsec_10y') }),
  tile({ key: 'credit',   label: 'Bank credit growth',        unit: '% YoY',      decimals: 1, observations: seiObs('scb_credit') }),
  tile({ key: 'usd_inr',  label: 'USD/INR',                   unit: '₹/US$',      decimals: 2, observations: erObs }),
  tile({ key: 'reserves', label: 'Foreign exchange reserves', unit: 'US$ bn',     decimals: 1, observations: fxrObs }),
  tile({ key: 'cover',    label: 'Import cover',              unit: 'months',     decimals: 1, observations: coverObs }),
];

const out = {
  markers,
  charts : {
    gdp, contributions, inflation, corridor, cpi_heatmap,
    yields, yield_curve, transmission, liquidity, credit, credit_by_sector,
    upi_value, upi_volume, payments_mix,
    usd_inr, trade, flows, reserves,
  },
};

// ── self-checks: fail loudly if inputs drift ─────────────────────────────────
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

check(markers.length === 8, `expected 8 stat tiles, got ${markers.length}`);
for (const m of markers) {
  check(Boolean(m.label && m.value && m.as_of && m.unit), `tile ${m.key}: empty label/value/as_of/unit`);
  check(Number.isFinite(Number(m.value)), `tile ${m.key}: value "${m.value}" is not a number`);
  check(Number.isFinite(m.delta), `tile ${m.key}: delta is not a number`);
  check(m.spark.values.length === m.spark.dates.length, `tile ${m.key}: spark values and dates differ in length`);
  check(m.spark.values.length === SPARK_POINTS, `tile ${m.key}: ${m.spark.values.length} spark points, expected ${SPARK_POINTS}`);
  check(m.spark.values.every((v) => Number.isFinite(v)), `tile ${m.key}: non-finite spark value`);
}

// Shape of every dates/series chart.
const TIME_CHARTS = [ 'gdp', 'contributions', 'inflation', 'corridor', 'yields', 'transmission',
                      'liquidity', 'credit', 'upi_value', 'upi_volume', 'trade', 'flows', 'reserves', 'usd_inr' ];
for (const name of TIME_CHARTS) {
  const c = out.charts[name];
  check(c.dates.length > 0, `${name}: no dates`);
  for (const s of c.series) {
    check(s.values.length === c.dates.length, `${name}/${s.key}: ${s.values.length} values vs ${c.dates.length} dates`);
    check(s.values.every((v) => v === null || Number.isFinite(v)), `${name}/${s.key}: non-finite value`);
  }
  for (let i = 1; i < c.dates.length; i++) {
    if (c.dates[i] <= c.dates[i - 1]) { errors.push(`${name}: dates not ascending at ${c.dates[i]}`); break; }
  }
}

// The four charts that are not time series.
check(liquidity.monthly.dates.length === liquidity.monthly.values.length, 'liquidity: monthly values not aligned to monthly dates');
check(liquidity.monthly.values.every((v) => Number.isFinite(v)), 'liquidity: non-finite monthly average');
for (let i = 1; i < liquidity.monthly.dates.length; i++) {
  if (liquidity.monthly.dates[i] <= liquidity.monthly.dates[i - 1]) { errors.push('liquidity: monthly dates not ascending'); break; }
}
check(yield_curve.curves.length === 3, `yield curve: expected 3 curves, got ${yield_curve.curves.length}`);
for (const c of yield_curve.curves) {
  check(c.values.length === yield_curve.tenors.length, `yield curve/${c.key}: values not aligned to tenors`);
  check(c.values.every((v) => Number.isFinite(v)), `yield curve/${c.key}: non-finite value`);
}
check(cpi_heatmap.months.length === CPI_MONTHS, `CPI heatmap: expected ${CPI_MONTHS} months, got ${cpi_heatmap.months.length}`);
check(cpi_heatmap.rows.length === CPI_ROWS.length, `CPI heatmap: expected ${CPI_ROWS.length} rows`);
for (const r of cpi_heatmap.rows) {
  check(r.values.length === cpi_heatmap.months.length, `CPI heatmap/${r.key}: values not aligned to months`);
  check(r.values.every((v) => Number.isFinite(v)), `CPI heatmap/${r.key}: non-finite value`);
}
for (let i = 1; i < cpi_heatmap.months.length; i++) {
  if (cpi_heatmap.months[i] <= cpi_heatmap.months[i - 1]) { errors.push('CPI heatmap: months not ascending'); break; }
}
check(credit_by_sector.rows.length === CREDIT_ROWS.length, `credit by sector: expected ${CREDIT_ROWS.length} rows`);
check(credit_by_sector.rows.every((r) => Number.isFinite(r.growth) && Number.isFinite(r.previous)), 'credit by sector: non-finite growth');
for (let i = 1; i < credit_by_sector.rows.length; i++) {
  check(credit_by_sector.rows[i].growth <= credit_by_sector.rows[i - 1].growth, 'credit by sector: rows not sorted by latest growth');
}
check(payments_mix.months.length === 2, 'payments mix: expected two months');
check(payments_mix.instruments.length === PAYMENTS_NAMED + 1, `payments mix: expected ${PAYMENTS_NAMED + 1} instruments`);
for (let i = 0; i < 2; i++) {
  const total = payments_mix.instruments.reduce((t, p) => t + p.shares[i], 0);
  check(Math.abs(total - 100) < 0.05, `payments mix: ${payments_mix.months[i]} shares sum to ${total.toFixed(2)}, not 100`);
}

// Anchors — known values in committed history (update alongside a source revision).
const at = (c, date, key) => c.series.find((s) => s.key === key).values[c.dates.indexOf(date)];
check(at(corridor, '2025-03-01', 'repo') === 6.25, 'anchor: repo rate Mar-2025 should be 6.25');
check(at(corridor, '2021-01-01', 'floor') === 3.35, 'anchor: corridor floor Jan-2021 should be the 3.35 reverse repo');
check(at(corridor, '2026-07-01', 'floor') === 5, 'anchor: corridor floor Jul-2026 should be the 5.00 SDF');
check(at(corridor, '2026-07-01', 'ceiling') === 5.5, 'anchor: corridor ceiling Jul-2026 should be the 5.50 MSF');
check(at(inflation, '2025-03-01', 'cpi') === 3.56, 'anchor: CPI inflation Mar-2025 should be 3.56');   // RBI revised it from 3.34 in the 17-09-2026 export
check(at(upi_value, '2019-11-01', 'value') === 1.89, 'anchor: UPI value Nov-2019 should be ₹1.89 lakh crore');
check(at(upi_volume, '2019-11-01', 'volume') === 121.9, 'anchor: UPI volume Nov-2019 should be 121.9 crore transactions');
check(at(trade, '1990-04-01', 'exports') === 1.44, 'anchor: exports Apr-1990 should be US$1.44bn');
check(at(usd_inr, '2026-07-01', 'usd') === 94.7323, 'anchor: USD/INR 01-Jul-2026 should be 94.7323');
check(at(reserves, '2026-06-19', 'total') === 672.59, 'anchor: reserves 19-Jun-2026 should be US$672.59bn');
check(at(reserves, '2026-06-19', 'sdr') === 18.65, 'anchor: SDR holdings 19-Jun-2026 should be US$18.65bn');
check(at(reserves, '2026-06-19', 'rtp') === 4.79, 'anchor: reserve tranche position 19-Jun-2026 should be US$4.79bn');
check(at(gdp, '2020-06-30', 'real') === -23.1, 'anchor: real GDP growth 2020-21 Q1 should be -23.1%');
check(at(gdp, '2025-09-30', 'real') === 8.2, 'anchor: real GDP growth 2025-26 Q2 should be 8.2%');
check(at(gdp, '1997-06-30', 'real') != null, 'anchor: real GDP growth should reach back to 1997-98 Q1 through the older bases');
check(at(credit, '2021-01-01', 'credit') === 5.9, 'anchor: bank credit growth Jan-2021 should be 5.9%');
check(at(yields, '2021-01-01', 'gsec10') === 5.96, 'anchor: 10-year G-sec yield Jan-2021 should be 5.96%');
check(at(transmission, '2021-01-01', 'deposit_low') === 4.9, 'anchor: term deposit rate Jan-2021 should run from 4.90');
check(at(transmission, '2021-01-01', 'deposit_high') === 5.5, 'anchor: term deposit rate Jan-2021 should run to 5.50');
check(at(transmission, '2021-01-01', 'mclr_low') === 6.55, 'anchor: overnight MCLR Jan-2021 should run from 6.55');
check(at(transmission, '2021-01-01', 'mclr_high') === 7.05, 'anchor: overnight MCLR Jan-2021 should run to 7.05');
check(at(flows, '2011-03-01', 'fdi') === 0.24, 'anchor: net FDI Mar-2011 should be US$0.24bn');
check(at(liquidity, '2012-11-01', 'net') === 0.75, 'anchor: net liquidity 01-Nov-2012 should be ₹0.75 lakh crore');

// Contributions: the five components add up to the quarter's GDP growth, within rounding.
check(contributions.dates[0] === '2012-06-30', `anchor: contributions should start at 2012-06-30, not ${contributions.dates[0]}`);
check(at(contributions, '2025-09-30', 'pfce') === 4.5, 'anchor: private consumption contributed 4.5pp in 2025-26 Q2');
check(at(contributions, '2025-09-30', 'gfcf') === 2.5, 'anchor: fixed investment contributed 2.5pp in 2025-26 Q2');
check(at(contributions, '2025-09-30', 'netex') === -2.1, 'anchor: net exports took 2.1pp off growth in 2025-26 Q2');
check(at(contributions, '2025-09-30', 'total') === 8.2, 'anchor: GDP growth in 2025-26 Q2 should be 8.2%');
for (let i = 0; i < contributions.dates.length; i++) {
  const parts = [ 'pfce', 'gfce', 'gfcf', 'netex', 'other' ]
    .reduce((t, k) => t + contributions.series.find((s) => s.key === k).values[i], 0);
  const total = contributions.series.find((s) => s.key === 'total').values[i];
  if (Math.abs(parts - total) > 0.3) {
    errors.push(`contributions ${contributions.dates[i]}: parts sum to ${parts.toFixed(1)} but growth is ${total}`);
    break;
  }
}

// The new non-time-series charts, anchored on values read out of the sources.
check(yield_curve.curves[0].label === 'Jul 2026', `anchor: the newest yield curve should be Jul 2026, not ${yield_curve.curves[0].label}`);
check(yield_curve.curves[0].values[0] === 5.34, 'anchor: the 91-day T-bill was 5.34% in Jul 2026');
check(yield_curve.curves[0].values[3] === 6.84, 'anchor: the 10-year G-sec was 6.84% in Jul 2026');
const cpiRowAt = (key, month) => cpi_heatmap.rows.find((r) => r.key === key).values[cpi_heatmap.months.indexOf(month)];
check(cpi_heatmap.months[cpi_heatmap.months.length - 1] === '2025-12', 'anchor: the CPI heatmap should end at 2025-12');
check(cpiRowAt('general', '2025-12') === 1.33, 'anchor: general CPI inflation was 1.33% in December 2025');
check(cpiRowAt('vegetables', '2025-12') === -18.47, 'anchor: vegetable prices fell 18.47% in the year to December 2025');
check(cpiRowAt('food', '2023-01') === 6.19, 'anchor: food and beverages inflation was 6.19% in January 2023');
check(credit_by_sector.as_of === '31-12-2025', `anchor: credit by sector should report 31-12-2025, not ${credit_by_sector.as_of}`);
check(credit_by_sector.previous_as_of === '27-12-2024', `anchor: the comparison fortnight should be 27-12-2024, the nearest reporting date to the anniversary, not ${credit_by_sector.previous_as_of}`);
check(credit_by_sector.rows.some((r) => r.key === 'nbfc'), 'credit by sector: the NBFC row is missing');
check(payments_mix.months[0] === 'Nov-2019' && payments_mix.months[1] === 'Jun-2026',
  `anchor: the payments mix should compare Nov-2019 with Jun-2026, not ${payments_mix.months.join(' and ')}`);
const shareOf = (key, i) => { const p = payments_mix.instruments.find((x) => x.key === key); return p ? p.shares[i] : null; };
check(shareOf('upi', 0) === 39.69, 'anchor: UPI was 39.69% of retail payment volume in Nov-2019');
check(shareOf('upi', 1) === 86.76, 'anchor: UPI was 86.76% of retail payment volume in Jun-2026');
check(shareOf('debit_card', 0) === 13.61, 'anchor: debit cards were 13.61% of retail payment volume in Nov-2019');

if (errors.length > 0) {
  console.error('home self-check FAILED:');
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'home.json'), JSON.stringify(out));
console.log(`wrote home.json (${markers.length} stat tiles, ${Object.keys(out.charts).length} charts); self-check passed`);
