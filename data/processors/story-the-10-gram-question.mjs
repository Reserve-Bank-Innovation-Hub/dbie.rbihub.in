// Processor: story-the-10-gram-question — derives every figure for the story from the scrape's SDMX exports
// (data/sdmx/**, restored by `pnpm data:fetch`) and four report tables, read with the parser the database loader
// uses, so each series is the one loaded into Postgres. Nothing is typed by hand except the two import-duty dates,
// which are not on DBIE and are marked as such.
//
// The story follows the Mumbai price of ten grams of gold from April 1990, the first month DBIE carries, to the
// latest month, and takes the rise apart: how much of it is gold getting dearer in dollars, how much the rupee
// getting cheaper, and how much the gap between the London price brought into rupees and the Mumbai price (duty,
// tax and the trade's premium). It then sets gold against the workers' price index from any year, and ends with the
// Reserve Bank's own gold as a share of the reserves, in value and in tonnes.
//
// Sources (DBIE SDMX dataset → table, or report):
//   RBI Bulletin report 17   the monthly average price of standard gold in Mumbai, rupees per 10 grams, April 1990
//                            to the latest month; the story's monthly series (the SDMX table METAL_PRICE_RN carries
//                            the same series unrounded and two months shorter, and is checked against it)
//   Handbook report 197      the same Mumbai price beside the London price in dollars per troy ounce and that price
//                            brought into rupees per 10 grams, monthly from April 1990; the rupee–dollar rate the
//                            report used is read back from the two London columns, and the Mumbai premium is the
//                            Mumbai price over the London price in rupees
//   Handbook report 108      the same four columns as yearly averages by financial year, 1970-71 on, for the windows
//   FOREX_RATE_D_RN          the daily rupee–dollar reference rate, averaged by month, to check the rate read back
//                            from the report where both run
//   CPI_IW_RN                the consumer price index for industrial workers, general index, on its 1982, 2001 and
//                            2016 bases, chained onto 2016 = 100 with the Labour Bureau's linking factors as the
//                            RBI Bulletin's "Other consumer price indices" table (report 46) prints them
//   FR_EXG_RESV_M_RN         the foreign exchange reserves by month, March 1951 on: gold and the total, in dollars
//   Report 574               the weekly reserves, which carry the gold's volume in tonnes for the weeks it is given
//
// Emits:
//   out/story-the-10-gram-question.json                   the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/the-10-gram-question/data.gen.ts      the module the page imports
//   public/stories/the-10-gram-question/*.csv             the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-the-10-gram-question';
const SLUG      = 'the-10-gram-question';

const SDMX     = path.join(REPO, 'data/sdmx');
const REPORTS  = path.join(REPO, 'data/reports');
const BULLETIN_GOLD  = path.join(REPORTS, 'publication/time-series-publications/monthly-rbi-bulletin/17--monthly-average-price-of-gold-and-silver-in-mumbai.csv');
const BULLETIN_CPI   = path.join(REPORTS, 'publication/time-series-publications/monthly-rbi-bulletin/46--other-consumer-price-indices.csv');
const HANDBOOK_MONTH = path.join(REPORTS, 'publication/time-series-publications/handbook-of-statistics-on-the-indian-economy/197--monthly-average-price-of-gold-and-silver-in-domestic-and-foreign-markets.csv');
const HANDBOOK_YEAR  = path.join(REPORTS, 'publication/time-series-publications/handbook-of-statistics-on-the-indian-economy/108--average-price-of-gold-and-silver-in-domestic-and-foreign-markets.csv');
const RESERVES_WEEK  = path.join(REPORTS, 'indicators/external-sector-indicators/foreign-exchange-reserves/574--foreign-exchange-reserves.csv');

const TEN_GRAMS   = 10;
const SUM         = 100_000;                                                  // the lens: what ₹1 lakh buys
const FROM_YEAR   = 1990;                                                     // the first year DBIE's gold price covers
const AGAINST_FROM = 2001;                                                    // the default start of the race against prices
const TROY_OUNCE  = 31.1035;                                                  // grams, so a London price per ounce reads per 10 grams

// The import duty on gold is not on DBIE. The two changes the story marks, from the Union Budget of July 2024 and the
// notification of May 2026, as the slate records them; gate 2 confirms the dates and rates from the notifications.
const DUTY = [
    { month : '2024-07', rate : 6,  note : 'Union Budget: the duty on gold cut to 6%' },
    { month : '2026-05', rate : 15, note : 'the duty raised again to 15%' },
];

const fail = msg => { throw new Error(`${NAME}: ${msg}`); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

// ── reading ───────────────────────────────────────────────────────────────────────────────────────────────────────

function sdmxRows(file) {
    const { header, data } = readSdmxCsv(path.join(SDMX, file));
    const idx = Object.fromEntries(header.map((h, i) => [ h, i ]));
    for (const col of [ 'TIME_PERIOD', 'OBS_VALUE' ]) assert(idx[col] !== undefined, `${file} has no ${col} column`);
    return { rows : data, col : name => { assert(idx[name] !== undefined, `${file} has no ${name} column`); return idx[name]; } };
}
// A report table as DBIE exports it: one row a line, cells quoted and separated by semicolons.
const reportRows = file => fs.readFileSync(file, 'utf8').split(/\r?\n/).map(l => l.split(';').map(c => c.replace(/^"|"$/g, '').trim()));
const ym   = period => period.slice(0, 7);                                   // '2001-01-31' → '2001-01'
const num  = s => { const v = Number(s); assert(s !== '' && Number.isFinite(v), `not a number: ${JSON.stringify(s)}`); return v; };
// A figure as a report prints it, with Indian commas, or nothing where it prints a dash.
const inum = s => { const t = (s ?? '').replace(/,/g, '').trim(); if (t === '' || t === '-') return null; const v = Number(t); assert(Number.isFinite(v), `not a figure: ${JSON.stringify(s)}`); return v; };
const r1   = v => Math.round(v * 10) / 10;
const r2   = v => Math.round(v * 100) / 100;
const r3   = v => Math.round(v * 1000) / 1000;
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
const MONTHS = { JAN : 1, FEB : 2, MAR : 3, APR : 4, MAY : 5, JUN : 6, JUL : 7, AUG : 8, SEP : 9, OCT : 10, NOV : 11, DEC : 12 };
const mm = m => String(m).padStart(2, '0');
const lastKey = series => [ ...series.keys() ].sort().pop();

// A monthly series averaged over a calendar year: the average, how many months it has, and the last of them.
const yearAverage = (series, year) => {
    const keys = [ ...series.keys() ].filter(k => k.startsWith(`${year}-`)).sort();
    return keys.length ? { avg : mean(keys.map(k => series.get(k))), months : keys.length, last : keys[keys.length - 1] } : null;
};

// ── the Mumbai price, month by month ──────────────────────────────────────────────────────────────────────────────

const GOLD = new Map();                                                       // 'YYYY-MM' → rupees per 10 grams
for (const r of reportRows(BULLETIN_GOLD)) {
    const m = /^([A-Z][a-z]{2})\. (\d{4})$/.exec(r[0]);
    if (!m) continue;
    GOLD.set(`${m[2]}-${mm(MONTHS[m[1].toUpperCase()])}`, inum(r[1]));
}
assert(GOLD.has('1990-04'), 'the bulletin table does not start in April 1990');
assert(GOLD.size >= 430, `only ${GOLD.size} months of gold`);
// The SDMX table carries the same series unrounded; where both run, they agree to the rupee.
{
    const metal = sdmxRows('real-sector/prices-wages/metal-price.csv');
    const cCity = metal.col('PICE_REF_CITY_RN'), cMetal = metal.col('PREC_METL_RN'), cT = metal.col('TIME_PERIOD'), cV = metal.col('OBS_VALUE');
    let n = 0;
    for (const r of metal.rows) {
        if (r[cCity] !== 'PRC1' || r[cMetal] !== 'GOLD') continue;
        const k = ym(r[cT]);
        assert(GOLD.has(k), `the bulletin table has no ${k}, which the SDMX table has`);
        assert(Math.abs(GOLD.get(k) - num(r[cV])) <= 1, `gold ${k}: bulletin ${GOLD.get(k)}, SDMX ${r[cV]}`);
        n++;
    }
    assert(n >= 430, `only ${n} months of gold in the SDMX table`);
}
const FIRST_MONTH = '1990-04', LAST_MONTH = lastKey(GOLD);

// ── the London price and the rupee, month by month ────────────────────────────────────────────────────────────────

// The handbook's monthly table lists financial years, each with its months from April, newest first; the London
// columns stop a few months before the Mumbai one.
const LONDON = new Map();                                                     // 'YYYY-MM' → dollars per troy ounce
const LONDON_INR = new Map();                                                 // 'YYYY-MM' → the London price in rupees per 10 grams
{
    let fy = null;
    for (const r of reportRows(HANDBOOK_MONTH)) {
        const h = /^(\d{4})-(\d{2})\s*$/.exec(r[0]);
        if (h) { fy = +h[1]; continue; }
        if (fy === null || !MONTHS[r[0]]) continue;
        const month = MONTHS[r[0]], year = month >= 4 ? fy : fy + 1, k = `${year}-${mm(month)}`;
        const mumbai = inum(r[1]), london = inum(r[2]), londonInr = inum(r[3]);
        assert(mumbai !== null && GOLD.has(k) && Math.abs(mumbai - GOLD.get(k)) <= 1, `handbook gold ${k}: ${mumbai} against the bulletin's ${GOLD.get(k)}`);
        if (london === null || londonInr === null) continue;
        LONDON.set(k, london); LONDON_INR.set(k, londonInr);
    }
}
assert(LONDON.has('1990-04') && LONDON.size >= 400, `only ${LONDON.size} months of the London price`);
// The rate the report brought London into rupees with, read back from its two columns, must be the rupee–dollar
// rate DBIE publishes: checked against the daily reference rate's monthly average, where both run.
const RATE = new Map();                                                       // 'YYYY-MM' → rupees a dollar, implied
for (const k of LONDON.keys()) RATE.set(k, LONDON_INR.get(k) / LONDON.get(k) * TROY_OUNCE / TEN_GRAMS);
{
    const fx = sdmxRows('financial-markets/forex-market/exchange-rate-of-the-indian-rupee-daily.csv');
    const cCur = fx.col('CURRENCY'), cT = fx.col('TIME_PERIOD'), cV = fx.col('OBS_VALUE');
    const byMonth = new Map();
    for (const r of fx.rows) { if (r[cCur] !== 'USD') continue; const k = ym(r[cT]); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(num(r[cV])); }
    // the daily table on DBIE starts in 2011; a few months in the handbook sit off the reference rate (its own
    // source for the rate differs), so the check asks that nearly every month agrees within 1.5%, and lists the rest
    let n = 0; const off = [];
    for (const [ k, days ] of byMonth) {
        if (!RATE.has(k) || days.length < 15) continue;
        const gap = RATE.get(k) / mean(days) - 1; n++;
        if (Math.abs(gap) >= 0.015) off.push(`${k} (${r1(gap * 100)}%)`);
        assert(Math.abs(gap) < 0.07, `the rate read back for ${k}, ${r2(RATE.get(k))}, is ${r1(gap * 100)}% off the reference rate's average ${r2(mean(days))}`);
    }
    assert(n >= 150 && off.length <= n * 0.03, `the rate read back from the handbook is off the reference rate in ${off.length} of ${n} months: ${off.join(', ')}`);
    console.log(`  the rate read back from the handbook agrees with the daily reference rate's monthly average within 1.5% in ${n - off.length} of ${n} months${off.length ? `; off in ${off.join(', ')}` : ''}`);
}
const PREMIUM = new Map();                                                    // 'YYYY-MM' → Mumbai over London-in-rupees, as a ratio
for (const k of LONDON.keys()) PREMIUM.set(k, GOLD.get(k) / LONDON_INR.get(k));

// ── the windows, by financial year ────────────────────────────────────────────────────────────────────────────────

const FY = new Map();                                                         // '2025-26' → { mumbai, london, londonInr }
for (const r of reportRows(HANDBOOK_YEAR)) {
    const h = /^(\d{4}-\d{2})\s*$/.exec(r[0]);
    if (!h) continue;
    const mumbai = inum(r[1]), london = inum(r[2]), londonInr = inum(r[3]);
    if (mumbai === null || london === null || londonInr === null) continue;
    FY.set(h[1], { mumbai, london, londonInr, rate : londonInr / london * TROY_OUNCE / TEN_GRAMS, premium : mumbai / londonInr });
}
const LAST_FY = [ ...FY.keys() ].sort().pop();
assert(FY.has('1990-91') && FY.has('2000-01') && FY.has('2010-11') && FY.has('2020-21') && LAST_FY >= '2025-26', 'the yearly handbook table is short');
// The rise over a window splits exactly into its three engines, because Mumbai = London × rate × premium: in logs
// the parts add to the whole, and each part's share of the log rise is what the chart stacks.
const window = (from, to, label) => {
    const a = FY.get(from), b = FY.get(to);
    const times = { mumbai : b.mumbai / a.mumbai, london : b.london / a.london, rate : b.rate / a.rate, premium : b.premium / a.premium };
    assert(Math.abs(times.london * times.rate * times.premium / times.mumbai - 1) < 1e-9, `the engines do not multiply back for ${label}`);
    const whole = Math.log(times.mumbai);
    return {
        from, to, label,
        mumbai  : { from : r2(a.mumbai), to : r2(b.mumbai), times : r2(times.mumbai) },
        london  : { from : r2(a.london), to : r2(b.london), times : r2(times.london) },
        rate    : { from : r2(a.rate), to : r2(b.rate), times : r2(times.rate) },
        premium : { from : r3(a.premium), to : r3(b.premium), times : r2(times.premium) },
        share   : { london : r3(Math.log(times.london) / whole), rate : r3(Math.log(times.rate) / whole), premium : r3(Math.log(times.premium) / whole) },
    };
};
const WINDOWS = [
    window('1990-91', '2000-01', 'The 1990s'),
    window('2000-01', '2010-11', 'The 2000s'),
    window('2010-11', '2020-21', 'The 2010s'),
    window('2020-21', LAST_FY,   `${LAST_FY.slice(0, 4)}-${LAST_FY.slice(5)} on`),
    window('1990-91', LAST_FY,   'The whole span'),
];

// ── the workers' price index, chained ─────────────────────────────────────────────────────────────────────────────

const FACTORS = (() => {
    const lines = fs.readFileSync(BULLETIN_CPI, 'utf8').split(/\r?\n/);
    const cells = line => line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    const baseRow = cells(lines.find(l => l.startsWith('"Base Year"')) ?? fail('no base-year row in the bulletin table'));
    const linkRow = cells(lines.find(l => l.startsWith('"Linking Factor"')) ?? fail('no linking-factor row in the bulletin table'));
    assert(baseRow[1] === '2016 = 100' && baseRow[2] === '2001', `the bulletin table's columns are ${baseRow.slice(1, 3).join(', ')}`);
    return { to2016 : num(linkRow[1]), to2001 : num(linkRow[2]) };
})();
const CPI = new Map();                                                        // month → general index, 2016 = 100
const CPI_BASE = new Map();
{
    const cpi = sdmxRows('real-sector/prices-wages/consumer-price-index-industrial-worker.csv');
    const cBase = cpi.col('BASE_PER'), cItem = cpi.col('COMD_ITEM'), cT = cpi.col('TIME_PERIOD'), cV = cpi.col('OBS_VALUE');
    const onto2016 = { BY_1982 : v => v / FACTORS.to2001 / FACTORS.to2016, BY_2001 : v => v / FACTORS.to2016, BY_2016 : v => v };
    for (const r of cpi.rows) {
        if (r[cItem] !== 'CO_GIAG' || !onto2016[r[cBase]]) continue;
        const k = ym(r[cT]);
        if (CPI.has(k)) { assert(CPI.get(k) === onto2016[r[cBase]](num(r[cV])), `CPI ${k}: two values`); continue; }
        CPI.set(k, onto2016[r[cBase]](num(r[cV])));
        CPI_BASE.set(k, r[cBase]);
    }
}
for (const [ a, b ] of [ [ '2005-12', '2006-01' ], [ '2020-08', '2020-09' ] ]) {
    assert(CPI.has(a) && CPI.has(b) && CPI_BASE.get(a) !== CPI_BASE.get(b), `the bases do not meet at ${a}/${b}`);
    assert(Math.abs(CPI.get(b) / CPI.get(a) - 1) < 0.03, `the chained index jumps ${r3(CPI.get(b) / CPI.get(a))} at ${a}/${b}`);
}
assert(CPI.has(FIRST_MONTH), `the index does not reach back to ${FIRST_MONTH}`);

// ── the Reserve Bank's gold ───────────────────────────────────────────────────────────────────────────────────────

const GOLD_USD = new Map(), TOTAL_USD = new Map();                            // 'YYYY-MM' → dollars
{
    const res = sdmxRows('external-sector/forex-reserve/foreign-exchange-reserves-monthly.csv');
    const cTyp = res.col('TYP_MAJ_FR_EXC_RES_RN'), cUnit = res.col('UNIT_MEASURE'), cT = res.col('TIME_PERIOD'), cV = res.col('OBS_VALUE');
    for (const r of res.rows) {
        if (r[cUnit] !== 'USD') continue;
        if (r[cTyp] === 'FER_GLD') GOLD_USD.set(ym(r[cT]), num(r[cV]));
        if (r[cTyp] === 'FER_TTL') TOTAL_USD.set(ym(r[cT]), num(r[cV]));
    }
}
assert(GOLD_USD.has('1951-03') && TOTAL_USD.has('1951-03'), 'the monthly reserves do not start in March 1951');
for (const k of GOLD_USD.keys()) assert(TOTAL_USD.has(k) && TOTAL_USD.get(k) >= GOLD_USD.get(k), `reserves ${k}: gold without a total, or more than it`);
const RESERVES = [ ...GOLD_USD.keys() ].sort().map(k => ({ ym : k, goldUsdBn : r2(GOLD_USD.get(k) / 1e9), totalUsdBn : r2(TOTAL_USD.get(k) / 1e9), share : r2(GOLD_USD.get(k) / TOTAL_USD.get(k) * 100) }));
const LAST_RESERVES = RESERVES[RESERVES.length - 1];
assert(LAST_RESERVES.ym >= '2026-06', `the reserves end in ${LAST_RESERVES.ym}`);
// The tonnes, from the weekly report, for the weeks it gives them: kept at the last week of each quarter, and the
// first and last weeks given.
const TONNES = [];
{
    const weeks = [];
    for (const r of reportRows(RESERVES_WEEK)) {
        const m = /^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/.exec(r[0]);
        if (!m) continue;
        const t = inum(r[7]);
        if (t === null) continue;
        weeks.push({ date : `${m[3]}-${mm(MONTHS[m[2].toUpperCase()])}-${m[1]}`, tonnes : t, goldUsdBn : r2(inum(r[6]) / 1000) });
    }
    weeks.sort((a, b) => a.date.localeCompare(b.date));
    assert(weeks.length >= 200, `only ${weeks.length} weeks carry the tonnes`);
    const quarterOf = d => `${d.slice(0, 4)}-Q${Math.ceil(+d.slice(5, 7) / 3)}`;
    const byQuarter = new Map();
    for (const w of weeks) byQuarter.set(quarterOf(w.date), w);               // the last week of each quarter wins
    TONNES.push(...byQuarter.values());
    if (TONNES[0].date !== weeks[0].date) TONNES.unshift(weeks[0]);
}
const RESERVE_LOW  = [ ...RESERVES ].filter(r => r.ym >= '2001-01').reduce((a, b) => b.share < a.share ? b : a);
const RESERVE_HIGH = [ ...RESERVES ].filter(r => r.ym >= `${FROM_YEAR}-04`).reduce((a, b) => b.share > a.share ? b : a);

// ── the years ─────────────────────────────────────────────────────────────────────────────────────────────────────

const TO_YEAR = +LAST_MONTH.slice(0, 4);
const YEARS = [];
for (let year = FROM_YEAR; year <= TO_YEAR; year++) {
    const gold = yearAverage(GOLD, year) ?? fail(`no gold in ${year}`);
    const london = yearAverage(LONDON, year), rate = yearAverage(RATE, year), premium = yearAverage(PREMIUM, year);
    const index = yearAverage(CPI, year) ?? fail(`no index in ${year}`);
    const share = [ ...RESERVES ].reverse().find(r => r.ym.startsWith(`${year}-`)) ?? fail(`no reserves in ${year}`);
    YEARS.push({
        year,
        gold    : { price : r2(gold.avg), months : gold.months, grams : r1(SUM / gold.avg * TEN_GRAMS) },
        london  : london ? { price : r2(london.avg), months : london.months } : null,
        rate    : rate ? r2(rate.avg) : null,
        premium : premium ? r3(premium.avg) : null,
        index   : { value : r2(index.avg), months : index.months },
        reserves : { ym : share.ym, share : share.share, goldUsdBn : share.goldUsdBn },
    });
}
const yearOf = y => YEARS.find(r => r.year === y) ?? fail(`no row for ${y}`);
const NOW = YEARS[YEARS.length - 1];

// ── the headline ──────────────────────────────────────────────────────────────────────────────────────────────────

const spanYears = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) + (+b.slice(5, 7) - +a.slice(5, 7)) / 12;
const times = GOLD.get(LAST_MONTH) / GOLD.get(FIRST_MONTH);
const against = from => ({ fromYear : from, gold : r2(NOW.gold.price / yearOf(from).gold.price), prices : r2(NOW.index.value / yearOf(from).index.value) });
const whole = WINDOWS[WINDOWS.length - 1];
const HEADLINE = {
    tenGrams : TEN_GRAMS, sum : SUM, fromYear : FROM_YEAR, toYear : TO_YEAR, againstFrom : AGAINST_FROM,
    first    : { ym : FIRST_MONTH, price : GOLD.get(FIRST_MONTH) },
    last     : { ym : LAST_MONTH, price : GOLD.get(LAST_MONTH) },
    times    : r1(times),
    yearly   : r1((Math.pow(times, 1 / spanYears(FIRST_MONTH, LAST_MONTH)) - 1) * 100),            // per cent a year
    span     : r1(spanYears(FIRST_MONTH, LAST_MONTH)),
    peak     : (() => { const k = [ ...GOLD.keys() ].reduce((a, b) => GOLD.get(b) > GOLD.get(a) ? b : a); return { ym : k, price : GOLD.get(k) }; })(),
    engines  : { london : whole.london.times, rate : whole.rate.times, premium : whole.premium.times, share : whole.share, from : whole.from, to : whole.to },
    against  : against(AGAINST_FROM),
    reserves : {
        first : RESERVES.find(r => r.ym >= `${FROM_YEAR}-04`),
        high  : RESERVE_HIGH,
        low   : RESERVE_LOW,
        last  : LAST_RESERVES,
        tonnes : { first : TONNES[0], last : TONNES[TONNES.length - 1] },
    },
    duty     : DUTY,
    lastMonth : { gold : LAST_MONTH, london : lastKey(LONDON), index : lastKey(CPI), reserves : LAST_RESERVES.ym, tonnes : TONNES[TONNES.length - 1].date },
};
assert(HEADLINE.times > 30 && HEADLINE.times < 60, `gold rose ${HEADLINE.times} times, which is not the story`);
assert(HEADLINE.reserves.last.share > HEADLINE.reserves.low.share, 'the gold share has not risen from its low');

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const MONTHLY = [ ...GOLD.keys() ].sort().map(k => ({
    ym : k, gold : GOLD.get(k),
    london : LONDON.has(k) ? r2(LONDON.get(k)) : null, rate : RATE.has(k) ? r2(RATE.get(k)) : null, premium : PREMIUM.has(k) ? r3(PREMIUM.get(k)) : null,
    index : CPI.has(k) ? r2(CPI.get(k)) : null,
}));
const out = { headline : HEADLINE, factors : FACTORS, windows : WINDOWS, years : YEARS, months : MONTHLY, reserves : RESERVES, tonnes : TONNES };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 1));

// ── the page's data module ────────────────────────────────────────────────────────────────────────────────────────

const ts = v => JSON.stringify(v);
const GEN = [
    '// GENERATED by data/processors/story-the-10-gram-question.mjs — do not edit. Every number on the page comes from',
    '// here, and here from the scraped DBIE series and reports (the Mumbai gold price, the handbook\'s London price,',
    '// FOREX_RATE_D_RN, CPI_IW_RN with the bulletin\'s linking factors, FR_EXG_RESV_M_RN and the weekly reserves);',
    '// the processor\'s header says how.',
    '',
    '// The first and last months and the rise between them, the three engines over the whole span, gold against prices',
    '// from the default start year, the Reserve Bank\'s gold at its first, highest, lowest and latest points, the duty marks',
    '// (not DBIE figures) and the last period each series reaches.',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    '// The Labour Bureau\'s linking factors, as the RBI Bulletin prints them.',
    `export const FACTORS = ${ts(FACTORS)};`,
    '',
    '// The rise over each window, by financial-year averages, and how it splits: `times` is the ratio of the end to',
    '// the start, and `share` each engine\'s part of the log rise, the three adding to one.',
    'export interface Window {',
    '    from : string; to : string; label : string;',
    '    mumbai : { from : number; to : number; times : number };',
    '    london : { from : number; to : number; times : number };',
    '    rate : { from : number; to : number; times : number };',
    '    premium : { from : number; to : number; times : number };',
    '    share : { london : number; rate : number; premium : number };',
    '}',
    `export const WINDOWS : Window[] = ${ts(WINDOWS)};`,
    '',
    '// One row a year, calendar-year averages over the months DBIE carries (`months`): the Mumbai price per 10 grams',
    '// and the grams ₹1 lakh bought, the London price in dollars an ounce, the rupee–dollar rate the handbook used,',
    '// the Mumbai premium over London-in-rupees as a ratio, the workers\' index chained onto 2016 = 100, and the',
    '// reserves at the year\'s last month. London, the rate and the premium are null where the handbook has not',
    '// reached.',
    'export interface Year {',
    '    year : number;',
    '    gold : { price : number; months : number; grams : number };',
    '    london : { price : number; months : number } | null;',
    '    rate : number | null;',
    '    premium : number | null;',
    '    index : { value : number; months : number };',
    '    reserves : { ym : string; share : number; goldUsdBn : number };',
    '}',
    `export const YEARS : Year[] = ${ts(YEARS)};`,
    '',
    '// Every month from April 1990: the Mumbai price, and where the handbook gives them the London price, the rate',
    '// read back from it and the premium, and the chained index.',
    'export interface Month { ym : string; gold : number; london : number | null; rate : number | null; premium : number | null; index : number | null; }',
    `export const MONTHS : Month[] = ${ts(MONTHLY)};`,
    '',
    '// The reserves by month from March 1951: gold and the total in billions of dollars, and gold\'s share in per cent.',
    'export interface Reserve { ym : string; goldUsdBn : number; totalUsdBn : number; share : number; }',
    `export const RESERVES : Reserve[] = ${ts(RESERVES)};`,
    '',
    '// The gold\'s volume in tonnes, from the weekly report, at the last week of each quarter it gives them.',
    'export interface Tonnes { date : string; tonnes : number; goldUsdBn : number; }',
    `export const TONNES : Tonnes[] = ${ts(TONNES)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => v ?? '').join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'ten-grams-by-month.csv'), `# Ten grams of gold in Mumbai by month, from DBIE: the RBI's monthly average price of standard gold (rupees per 10 grams), the handbook's London price (dollars per troy ounce), the rupee–dollar rate read back from the handbook's London-in-rupees column, the Mumbai premium over the London price in rupees (ratio), and the consumer price index for industrial workers chained onto 2016 = 100 with the Labour Bureau's linking factors ${FACTORS.to2001} and ${FACTORS.to2016}.\n` + csv(
    [ 'month', 'gold_mumbai_rs_per_10g', 'gold_london_usd_per_oz', 'rupees_per_dollar', 'mumbai_premium_ratio', 'cpi_iw_2016_base' ],
    MONTHLY.map(m => [ m.ym, m.gold, m.london, m.rate, m.premium, m.index ])));
fs.writeFileSync(path.join(pubDir, 'reserves-gold-by-month.csv'), `# The Reserve Bank's gold in the foreign exchange reserves by month, from DBIE: gold and total reserves in US dollars and gold's share; the volume in tonnes from the weekly report, at quarter ends, is in reserves-gold-tonnes.csv.\n` + csv(
    [ 'month', 'gold_usd_bn', 'total_reserves_usd_bn', 'gold_share_pct' ],
    RESERVES.map(r => [ r.ym, r.goldUsdBn, r.totalUsdBn, r.share ])));
fs.writeFileSync(path.join(pubDir, 'reserves-gold-tonnes.csv'), `# The Reserve Bank's gold by volume, metric tonnes, from the weekly reserves report on DBIE, at the last week of each quarter it gives the figure for.\n` + csv(
    [ 'week_ended', 'tonnes', 'gold_usd_bn' ], TONNES.map(t => [ t.date, t.tonnes, t.goldUsdBn ])));

console.log(`${NAME}: ten grams ₹${HEADLINE.first.price} in ${FIRST_MONTH} → ₹${HEADLINE.last.price} in ${LAST_MONTH}, ${HEADLINE.times}× (${HEADLINE.yearly}% a year); engines ${whole.from} → ${whole.to}: London ×${whole.london.times}, rupee ×${whole.rate.times}, premium ×${whole.premium.times}; gold ×${HEADLINE.against.gold} against prices ×${HEADLINE.against.prices} from ${AGAINST_FROM}; reserves gold share ${HEADLINE.reserves.low.share}% (${HEADLINE.reserves.low.ym}) → ${LAST_RESERVES.share}% (${LAST_RESERVES.ym}), ${TONNES[0].tonnes} t (${TONNES[0].date}) → ${TONNES[TONNES.length - 1].tonnes} t (${TONNES[TONNES.length - 1].date})`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 3 CSVs under public/stories/${SLUG}/`);
