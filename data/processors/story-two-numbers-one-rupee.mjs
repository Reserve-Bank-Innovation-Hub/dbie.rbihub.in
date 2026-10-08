// Processor: story-two-numbers-one-rupee — derives every series for the story from the scrape's SDMX exports
// (data/sdmx/**, restored by `pnpm data:fetch`), read with the parser the database loader uses, so each series is the
// one loaded into Postgres under its DSD code. Nothing is typed by hand, except the basket weights below.
//
// Sources (DBIE SDMX dataset → what the story takes from it):
//   INX_NEER_REER_M_RN   indices of the nominal and real effective exchange rate, monthly, base 2015-16 = 100:
//                        the 40-currency basket with trade weights and with export weights, and the 6-currency
//                        basket with trade weights, April 2004 (the start of the 2015-16 series) to the latest month
//   FOREXRT_AVG_RN       the rupee's monthly average reference rate against the US dollar
//   FOREX_RATE_D_RN      the daily reference rate, averaged for a month the monthly table skips
//   FOREX_RATE_AFY_RN    the rupee's financial-year average against the US dollar
//
// The one input not from DBIE: data/sources/reer-weights-2015-16.json, the 40 currencies' weights as RBI published
// them with the January 2021 revision (the file names its table). The page draws them only as the widths of the
// globe's arcs and names the source beside them.
//
// The real rate is the nominal rate adjusted for prices: REER = NEER × (India's prices ÷ partners' prices), each
// side a weighted geometric average. So REER ÷ NEER × 100 is the relative-price term the two indices imply, and
// log REER = log NEER + log(REER ÷ NEER) holds by construction. The stage uses that identity: a thread whose height
// is log NEER and whose depth is log(REER ÷ NEER) reads as log REER when seen from 45°.
//
// Emits:
//   out/story-two-numbers-one-rupee.json                 the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/two-numbers-one-rupee/data.gen.ts    the module the page imports
//   public/stories/two-numbers-one-rupee/*.csv           the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-two-numbers-one-rupee';
const SLUG      = 'two-numbers-one-rupee';

const INDICES = path.join(REPO, 'data/sdmx/external-sector/external-sector-indices/indices-of-reer-neer-monthly.csv');
const FOREX   = path.join(REPO, 'data/sdmx/financial-markets/forex-market');
const WEIGHTS = path.join(REPO, 'data/sources/reer-weights-2015-16.json');

const fail = msg => { throw new Error(`${NAME}: ${msg}`); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

// ── reading ───────────────────────────────────────────────────────────────────────────────────────────────────────

// An SDMX CSV as objects keyed by header name.
function sdmxObjects(file) {
    const { header, data } = readSdmxCsv(file);
    for (const col of [ 'TIME_PERIOD', 'OBS_VALUE' ]) assert(header.includes(col), `${path.basename(file)} has no ${col} column`);
    return data.map(f => Object.fromEntries(header.map((h, i) => [ h, f[i] ])));
}

const ym   = period => period.slice(0, 7);                                   // '2025-04-30' → '2025-04'
const fyOf = key => { const y = +key.slice(0, 4), m = +key.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
const num  = s => { const v = Number(s); assert(s !== '' && Number.isFinite(v), `not a number: ${JSON.stringify(s)}`); return v; };
const r1   = v => Math.round(v * 10) / 10;
const r2   = v => Math.round(v * 100) / 100;
const r3   = v => Math.round(v * 1000) / 1000;
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
const nextMonth = k => { const y = +k.slice(0, 4), m = +k.slice(5, 7); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; };

// ── the effective exchange rates ──────────────────────────────────────────────────────────────────────────────────

// The 2015-16 series, by basket, weights and rate. DBIE's dimension codes, as they are.
const KEYS = {
    neer40t : [ 'CURR_BASK_40CURR', 'TRD_WTS', 'NEER' ],
    reer40t : [ 'CURR_BASK_40CURR', 'TRD_WTS', 'REER' ],
    neer40e : [ 'CURR_BASK_40CURR', 'EXP_WTS', 'NEER' ],
    reer40e : [ 'CURR_BASK_40CURR', 'EXP_WTS', 'REER' ],
    neer6   : [ 'CURR_BASK_6CURR',  'TRD_WTS', 'NEER' ],
    reer6   : [ 'CURR_BASK_6CURR',  'TRD_WTS', 'REER' ],
};
const idx = sdmxObjects(INDICES).filter(r => r.BASE_PER === 'BY_2015_16');
assert(idx.length > 0, 'no 2015-16 rows in the REER/NEER table');
const SERIES = {};
for (const [ k, [ basket, wts, rate ] ] of Object.entries(KEYS)) {
    const m = new Map();
    for (const r of idx.filter(r => r.CURR_BASK_RN === basket && r.TYP_TRD_WTS_RN === wts && r.TYP_OF_RATE === rate)) {
        assert(r.FREQ === 'M', `${k}: frequency ${r.FREQ}`);
        assert(!m.has(ym(r.TIME_PERIOD)), `${k}: two values for ${ym(r.TIME_PERIOD)}`);
        m.set(ym(r.TIME_PERIOD), num(r.OBS_VALUE));
    }
    SERIES[k] = m;
}

// One run of months, the same for every series: April 2004 to the latest month all six carry.
const FIRST = '2004-04';
const lastOf = m => [ ...m.keys() ].sort().at(-1);
const LAST = Object.values(SERIES).map(lastOf).sort()[0];
for (const [ k, m ] of Object.entries(SERIES)) {
    assert([ ...m.keys() ].sort()[0] === FIRST, `${k} starts at ${[ ...m.keys() ].sort()[0]}, not ${FIRST}`);
    assert(lastOf(m) === LAST, `${k} ends at ${lastOf(m)}, the others at ${LAST}`);
}
const MONTHS = [];
for (let k = FIRST; k <= LAST; k = nextMonth(k)) MONTHS.push(k);
for (const [ k, m ] of Object.entries(SERIES)) assert(m.size === MONTHS.length, `${k} has ${m.size} months, expected ${MONTHS.length} (a gap)`);
const arr = k => MONTHS.map(mo => SERIES[k].get(mo));

// The base year averages a hundred, by construction; RBI rounds the published monthly values, so allow a little.
for (const k of Object.keys(KEYS)) {
    const base = mean(MONTHS.filter(mo => fyOf(mo) === '2015-16').map(mo => SERIES[k].get(mo)));
    assert(Math.abs(base - 100) < 0.05, `${k} averages ${base.toFixed(3)} over 2015-16, not 100`);
}

// ── the rupee against the dollar ──────────────────────────────────────────────────────────────────────────────────

const usdMonthly = new Map();
for (const r of sdmxObjects(path.join(FOREX, 'foreign-exchange-rate-average.csv'))) {
    if (r.CURRENCY !== 'USD' || r.MEASURE_RN !== 'AVG') continue;
    assert(r.FREQ === 'M', `dollar monthly average: frequency ${r.FREQ}`);
    usdMonthly.set(ym(r.TIME_PERIOD), num(r.OBS_VALUE));
}
// DBIE's monthly table skips a month now and then (May 2026 in the scrape of 29-09-2026). Its monthly figure is the
// plain average of the month's daily reference rates, which the daily table carries from January 2011. In the
// years before 2023 a few months differ by up to a few paise, where the daily table lacks a day; from 2023 on, every
// month both tables carry agrees to the fourth decimal. The processor checks exactly that, then fills the gaps from
// the daily table.
const usdDaily = new Map();
for (const r of sdmxObjects(path.join(FOREX, 'exchange-rate-of-the-indian-rupee-daily.csv'))) {
    if (r.CURRENCY !== 'USD') continue;
    const k = ym(r.TIME_PERIOD);
    if (!usdDaily.has(k)) usdDaily.set(k, []);
    usdDaily.get(k).push(num(r.OBS_VALUE));
}
let reproduced = 0, worstOlder = 0;
for (const [ k, days ] of usdDaily) {
    if (!usdMonthly.has(k)) continue;
    const gap = Math.abs(mean(days) - usdMonthly.get(k));
    if (k >= '2023-02') {
        assert(gap < 0.0005, `${k}: the daily rates average ${mean(days).toFixed(4)}, the monthly table says ${usdMonthly.get(k)}`);
        reproduced++;
    } else worstOlder = Math.max(worstOlder, gap);
}
assert(reproduced >= 36, `only ${reproduced} recent months to test the daily average against`);
assert(worstOlder < 0.1, `an older month differs by ${worstOlder.toFixed(4)} rupees between the daily and monthly tables`);
const USD_FILLED = [];
for (const mo of MONTHS) {
    if (usdMonthly.has(mo) || !usdDaily.has(mo)) continue;
    assert(mo >= '2023-02', `${mo}: a gap before the months the daily average is checked against`);
    usdMonthly.set(mo, mean(usdDaily.get(mo)));
    USD_FILLED.push({ month : mo, days : usdDaily.get(mo).length });
}
const USD = MONTHS.map(mo => usdMonthly.has(mo) ? r2(usdMonthly.get(mo)) : null);
assert(USD.every(v => v !== null), 'the dollar series has a gap the daily table cannot fill');
const USD_LAST = LAST;

const usdFy = new Map();
for (const r of sdmxObjects(path.join(FOREX, 'exchange-rate-of-indian-rupees-fy.csv'))) {
    if (r.CURRENCY !== 'USD' || r.MEASURE_RN !== 'AVG') continue;
    const end = +r.TIME_PERIOD.slice(0, 4);                          // a year ending 31 March
    usdFy.set(`${end - 1}-${String(end).slice(2)}`, num(r.OBS_VALUE));
}
// The financial years the indices cover in full.
const FYS = [ ...new Set(MONTHS.map(fyOf)) ].filter(fy => MONTHS.filter(mo => fyOf(mo) === fy).length === 12);
for (const fy of FYS) assert(usdFy.has(fy), `no financial-year dollar average for ${fy}`);
// RBI's yearly average is of the daily rates, the monthly series of the same; the two agree closely.
for (const fy of FYS) {
    const m = mean(MONTHS.filter(mo => fyOf(mo) === fy).map(mo => usdMonthly.get(mo)));
    assert(Math.abs(m / usdFy.get(fy) - 1) < 0.004, `${fy}: the monthly average ${m.toFixed(3)} and the yearly ${usdFy.get(fy)} differ`);
}

// ── what the story says ───────────────────────────────────────────────────────────────────────────────────────────

const REER = arr('reer40t'), NEER = arr('neer40t');
const at = (k, mo) => SERIES[k].get(mo);
const fyAvg = (k, fy) => mean(MONTHS.filter(mo => fyOf(mo) === fy).map(mo => SERIES[k].get(mo)));
const FY0 = FYS[0], FYN = FYS.at(-1);

// The real rate's highest month since April 2023 and its lowest since that peak.
const recent = MONTHS.map((mo, i) => [ mo, REER[i] ]).filter(([ mo ]) => mo >= '2023-04');
const [ peakMonth, peak ] = recent.reduce((b, x) => x[1] > b[1] ? x : b);
const [ troughMonth, trough ] = recent.filter(([ mo ]) => mo > peakMonth).reduce((b, x) => x[1] < b[1] ? x : b);
// The whole run's range, for scale: the real rate's highest and lowest months.
const allPairs = MONTHS.map((mo, i) => [ mo, REER[i] ]);
const [ maxMonth, max ] = allPairs.reduce((b, x) => x[1] > b[1] ? x : b);
const [ minMonth, min ] = allPairs.reduce((b, x) => x[1] < b[1] ? x : b);

const HEADLINE = {
    first : FIRST, last : LAST, usdLast : USD_LAST, usdFilled : USD_FILLED, usdCheckedMonths : reproduced, fy0 : FY0, fyN : FYN,
    months : MONTHS.length,
    neer : { from : r1(at('neer40t', FIRST)), to : r1(at('neer40t', LAST)), change : r1(100 * (at('neer40t', LAST) / at('neer40t', FIRST) - 1)) },
    reer : { from : r1(at('reer40t', FIRST)), to : r1(at('reer40t', LAST)), change : r1(100 * (at('reer40t', LAST) / at('reer40t', FIRST) - 1)) },
    // the price term over the run: how much faster India's prices rose than its partners', as the indices imply
    rel  : { from : r1(100 * at('reer40t', FIRST) / at('neer40t', FIRST)), to : r1(100 * at('reer40t', LAST) / at('neer40t', LAST)) },
    usd  : {
        from : r2(usdMonthly.get(FIRST)), to : r2(usdMonthly.get(USD_LAST)),
        fy0 : r2(usdFy.get(FY0)), fyN : r2(usdFy.get(FYN)),
        // rupees per dollar up by this much; the rupee's dollar value down by this much (two ways to say one move)
        upPct : r1(100 * (usdFy.get(FYN) / usdFy.get(FY0) - 1)), downPct : r1(100 * (1 - usdFy.get(FY0) / usdFy.get(FYN))),
    },
    fyAvg : {
        neer : { fy0 : r1(fyAvg('neer40t', FY0)), fyN : r1(fyAvg('neer40t', FYN)) },
        reer : { fy0 : r1(fyAvg('reer40t', FY0)), fyN : r1(fyAvg('reer40t', FYN)) },
    },
    swing : { peakMonth, peak : r1(peak), troughMonth, trough : r1(trough), fall : r1(100 * (1 - trough / peak)) },
    range : { maxMonth, max : r1(max), minMonth, min : r1(min) },
    // ₹1 lakh in dollars at the two years' average rates
    lakh : { fy0 : Math.round(1e5 / usdFy.get(FY0)), fyN : Math.round(1e5 / usdFy.get(FYN)) },
};

// Every financial year: the dollar's yearly average and the two 40-currency indices' yearly averages.
const YEARLY = FYS.map(fy => ({ fy, usd : r2(usdFy.get(fy)), neer : r1(fyAvg('neer40t', fy)), reer : r1(fyAvg('reer40t', fy)) }));

// ── the basket weights (not on DBIE) ──────────────────────────────────────────────────────────────────────────────

let BASKET = null;
if (fs.existsSync(WEIGHTS)) {
    const w = JSON.parse(fs.readFileSync(WEIGHTS, 'utf8'));
    assert(Array.isArray(w.trade) && w.trade.length === 40, `${path.basename(WEIGHTS)}: expected 40 trade weights`);
    const sum = w.trade.reduce((s, c) => s + c.weight, 0);
    assert(Math.abs(sum - 100) < 0.6, `${path.basename(WEIGHTS)}: trade weights add to ${sum}, not 100`);
    BASKET = { source : w.source, partners : w.trade.map(c => ({ country : c.country, iso : c.iso, weight : c.weight })) };
}

// ── self-check: the identity the stage depends on ─────────────────────────────────────────────────────────────────

for (let i = 0; i < MONTHS.length; i++) {
    const rel = REER[i] / NEER[i];
    assert(Math.abs(Math.log(NEER[i]) + Math.log(rel) - Math.log(REER[i])) < 1e-12, `the identity fails at ${MONTHS[i]}`);
}

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const SERIES_OUT = Object.fromEntries(Object.keys(KEYS).map(k => [ k, arr(k).map(r3) ]));
const out = { HEADLINE, MONTHS, SERIES : SERIES_OUT, USD, YEARLY, BASKET };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 1));

// ── the module ────────────────────────────────────────────────────────────────────────────────────────────────────

const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit. Every number on the page comes from here, and here`,
    '// from the scraped DBIE series (INX_NEER_REER_M_RN, FOREXRT_AVG_RN, FOREX_RATE_D_RN, FOREX_RATE_AFY_RN); the processor\'s header',
    '// says how. Index values are 2015-16 = 100; a lower index is a weaker rupee.',
    '',
    '// What the story says: the first and last months, both 40-currency indices (trade weights) at each end, the price',
    '// term they imply (REER ÷ NEER × 100), the dollar rate at each end, the real rate\'s recent swing and its whole range,',
    '// and ₹1 lakh in dollars at the first and last full years\' average rates.',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    `// The months of every series below, ${FIRST} to ${LAST}.`,
    `export const MONTHS : string[] = ${ts(MONTHS)};`,
    '',
    '// The indices, monthly: 40 currencies with trade weights (the headline pair) and with export weights, and 6 currencies',
    '// with trade weights.',
    `export const SERIES : Record<"neer40t" | "reer40t" | "neer40e" | "reer40e" | "neer6" | "reer6", number[]> = ${ts(SERIES_OUT)};`,
    '',
    `// Rupees per US dollar, monthly average of RBI's reference rate (HEADLINE.usdFilled: months averaged from the daily table).`,
    `export const USD : (number | null)[] = ${ts(USD)};`,
    '',
    '// Each full financial year: the dollar\'s yearly average and the 40-currency indices\' averages.',
    `export const YEARLY : { fy : string; usd : number; neer : number; reer : number }[] = ${ts(YEARLY)};`,
    '',
    '// The 40 currencies\' trade weights from RBI\'s January 2021 revision (not on DBIE), or null until sourced.',
    `export const BASKET : { source : Record<string, string>; partners : { country : string; iso : string; weight : number }[] } | null = ${ts(BASKET)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => v ?? '').join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'effective-exchange-rates-monthly.csv'), '# Reserve Bank of India, indices of the nominal (NEER) and real (REER) effective exchange rate of the rupee, base 2015-16 = 100, as published on DBIE; monthly; a lower index is a weaker rupee; rel_prices_40t is REER ÷ NEER × 100 for the 40-currency trade-weighted pair; usd_inr is the monthly average of RBI\'s reference rate\n' + csv(
    [ 'month', ...Object.keys(KEYS), 'rel_prices_40t', 'usd_inr' ],
    MONTHS.map((mo, i) => [ mo, ...Object.keys(KEYS).map(k => SERIES_OUT[k][i]), r3(100 * REER[i] / NEER[i]), USD[i] ])));
fs.writeFileSync(path.join(pubDir, 'rupee-yearly.csv'), '# Reserve Bank of India, as published on DBIE: rupees per US dollar (financial-year average) and the 40-currency trade-weighted NEER and REER (base 2015-16 = 100, averages of the monthly indices)\n' + csv(
    [ 'financial_year', 'usd_inr', 'neer_40_trade', 'reer_40_trade' ], YEARLY.map(y => [ y.fy, y.usd, y.neer, y.reer ])));

console.log(`${NAME}: ${MONTHS.length} months, ${FIRST} to ${LAST} (dollar months filled from daily rates: ${USD_FILLED.map(f => f.month).join(", ") || "none"}); NEER ${HEADLINE.neer.from} → ${HEADLINE.neer.to} (${HEADLINE.neer.change}%), REER ${HEADLINE.reer.from} → ${HEADLINE.reer.to} (${HEADLINE.reer.change}%); ₹/$ ${HEADLINE.usd.fy0} (${FY0}) → ${HEADLINE.usd.fyN} (${FYN}); REER peak ${HEADLINE.swing.peak} in ${peakMonth}, low ${HEADLINE.swing.trough} in ${troughMonth}; basket weights ${BASKET ? 'loaded' : 'not yet sourced'}; self-check passed`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 2 CSVs under public/stories/${SLUG}/`);
