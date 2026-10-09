// Processor: story-what-one-lakh-bought — derives every figure for the story from the scrape's SDMX exports
// (data/sdmx/**, restored by `pnpm data:fetch`) and one bulletin report, read with the parser the database loader
// uses, so each series is the one loaded into Postgres. Nothing is typed by hand.
//
// The story carries one sum, ₹1 lakh, from 2001 to the latest year on DBIE and prices it each year in six things.
// Each year's figure is the calendar-year average of a monthly series over the months DBIE carries, so "2001" means
// January to December 2001 everywhere except the support price, which is set by marketing year (2001 is the
// 2001-02 crop year). The last year is a part year; `months` says how many months it has.
//
// Sources (DBIE SDMX dataset → table):
//   METAL_PRICE_RN     the RBI's monthly average Mumbai price of gold (rupees per 10 grams) and silver (rupees per
//                      kilogram), PRC1; a bullion price, not a jeweller's: no making charges, no GST
//   WAGE_RATES_RN      the Labour Bureau's daily wage rates in rural India, men, all India, by occupation: the
//                      mason (WR23); the occupation list changed in November 2013 and the series runs through it
//   FOREX_RATE_A_RN    the rupee–dollar rate, calendar-year average (the table DBIE files as "exchange rate of
//                      Indian rupees, CY"), to the last full year
//   FOREX_RATE_D_RN    the daily reference rate, for the part year after the last full one, averaged over its days
//   MIN_SUP_PRICE_RN   the minimum support price of wheat (FG_CE_WH), rupees per quintal, by marketing year
//   CPI_IW_RN          the consumer price index for industrial workers, general index, on its 1982, 2001 and 2016
//                      bases, chained onto 2016 = 100 with the Labour Bureau's linking factors, which the RBI
//                      Bulletin's "Other consumer price indices" table (report 46) prints: 4.63 links the 1982 base
//                      to 2001, 2.88 the 2001 base to 2016. The bases do not overlap on DBIE, so the factors cannot
//                      be recomputed here; gate 2 confirms them from the Labour Bureau.
//
// Emits:
//   out/story-what-one-lakh-bought.json                    the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/what-one-lakh-bought/data.gen.ts       the module the page imports
//   public/stories/what-one-lakh-bought/*.csv              the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-what-one-lakh-bought';
const SLUG      = 'what-one-lakh-bought';

const SDMX     = path.join(REPO, 'data/sdmx');
const BULLETIN = path.join(REPO, 'data/reports/publication/time-series-publications/monthly-rbi-bulletin/46--other-consumer-price-indices.csv');

const SUM       = 100_000;
const FROM_YEAR = 2001;

const fail = msg => { throw new Error(`${NAME}: ${msg}`); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

// ── reading ───────────────────────────────────────────────────────────────────────────────────────────────────────

function sdmxRows(file) {
    const { header, data } = readSdmxCsv(path.join(SDMX, file));
    const idx = Object.fromEntries(header.map((h, i) => [ h, i ]));
    for (const col of [ 'TIME_PERIOD', 'OBS_VALUE' ]) assert(idx[col] !== undefined, `${file} has no ${col} column`);
    return { rows : data, col : name => { assert(idx[name] !== undefined, `${file} has no ${name} column`); return idx[name]; } };
}

const ym   = period => period.slice(0, 7);                                   // '2001-01-31' → '2001-01'
const num  = s => { const v = Number(s); assert(s !== '' && Number.isFinite(v), `not a number: ${JSON.stringify(s)}`); return v; };
const r1   = v => Math.round(v * 10) / 10;
const r2   = v => Math.round(v * 100) / 100;
const r3   = v => Math.round(v * 1000) / 1000;
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

// A monthly series averaged over a calendar year: the average, how many months it has, and the last of them.
const yearAverage = (series, year) => {
    const keys = [ ...series.keys() ].filter(k => k.startsWith(`${year}-`)).sort();
    return keys.length ? { avg : mean(keys.map(k => series.get(k))), months : keys.length, last : keys[keys.length - 1] } : null;
};

// ── bullion: the Mumbai price of gold and silver ──────────────────────────────────────────────────────────────────

const metal = sdmxRows('real-sector/prices-wages/metal-price.csv');
const BULLION = {};
{
    const cCity = metal.col('PICE_REF_CITY_RN'), cMetal = metal.col('PREC_METL_RN'), cUnit = metal.col('UNIT_MEASURE'), cT = metal.col('TIME_PERIOD'), cV = metal.col('OBS_VALUE');
    for (const [ key, code, unit ] of [ [ 'gold', 'GOLD', 'RUP_PER_10_GMS' ], [ 'silver', 'SILVER', 'RUP_PER_KG' ] ]) {
        const series = new Map();
        for (const r of metal.rows) {
            if (r[cCity] !== 'PRC1' || r[cMetal] !== code || r[cUnit] !== unit) continue;
            const k = ym(r[cT]);
            assert(!series.has(k), `${key} ${k}: duplicate month`);
            series.set(k, num(r[cV]));
        }
        assert(series.size > 400, `${key}: ${series.size} months`);
        BULLION[key] = series;
    }
}

// ── the mason's day ───────────────────────────────────────────────────────────────────────────────────────────────

const wages = sdmxRows('real-sector/prices-wages/wage-rates.csv');
const MASON = new Map();
{
    const cState = wages.col('STATE_CODE'), cOcc = wages.col('TYP_AAA_RN'), cG = wages.col('GENDER_RN'), cT = wages.col('TIME_PERIOD'), cV = wages.col('OBS_VALUE');
    for (const r of wages.rows) {
        if (r[cState] !== 'ALL_INDIA' || r[cOcc] !== 'WR23') continue;
        assert(r[cG] === 'MALE', `a wage row for ${r[cG]}: the story assumes DBIE carries men's wages only`);
        const k = ym(r[cT]);
        assert(!MASON.has(k), `mason ${k}: duplicate month`);
        MASON.set(k, num(r[cV]));
    }
}
assert(MASON.size > 300, `mason: ${MASON.size} months`);
// The Labour Bureau's occupation list changed in November 2013; the mason's series runs through the change, and the
// page says so. The step is recorded so the method note can quote it.
const MASON_BREAK = { before : '2013-10', after : '2013-11', from : MASON.get('2013-10'), to : MASON.get('2013-11') };
assert(MASON_BREAK.from && MASON_BREAK.to, 'the mason series does not cover the November 2013 change');

// ── the dollar ────────────────────────────────────────────────────────────────────────────────────────────────────

const fxYear = sdmxRows('financial-markets/forex-market/exchange-rate-of-indian-rupees-cy.csv');
const USD_YEAR = new Map();                                                   // calendar year → average rate
{
    const cCur = fxYear.col('CURRENCY'), cT = fxYear.col('TIME_PERIOD'), cV = fxYear.col('OBS_VALUE');
    for (const r of fxYear.rows) if (r[cCur] === 'USD') { const y = +r[cT].slice(0, 4); assert(r[cT].endsWith('-12-31'), `yearly rate dated ${r[cT]}`); USD_YEAR.set(y, num(r[cV])); }
}
const fxDaily = sdmxRows('financial-markets/forex-market/exchange-rate-of-the-indian-rupee-daily.csv');
const USD_DAILY = new Map();                                                  // date → rate
{
    const cCur = fxDaily.col('CURRENCY'), cT = fxDaily.col('TIME_PERIOD'), cV = fxDaily.col('OBS_VALUE');
    for (const r of fxDaily.rows) if (r[cCur] === 'USD') USD_DAILY.set(r[cT], num(r[cV]));
}
const dailyAverage = year => { const ks = [ ...USD_DAILY.keys() ].filter(k => k.startsWith(`${year}-`)).sort(); return ks.length ? { avg : mean(ks.map(k => USD_DAILY.get(k))), days : ks.length, last : ks[ks.length - 1] } : null; };
const USD_LAST_FULL = Math.max(...USD_YEAR.keys());
// The daily table must agree with the yearly one where both run, or the part year cannot be joined to the full ones.
{
    const d = dailyAverage(USD_LAST_FULL);
    assert(d && Math.abs(d.avg / USD_YEAR.get(USD_LAST_FULL) - 1) < 0.005, `daily and yearly dollar rates differ in ${USD_LAST_FULL}`);
}

// ── wheat at the support price ────────────────────────────────────────────────────────────────────────────────────

const msp = sdmxRows('real-sector/agriculture/minimum-support-price.csv');
const WHEAT = new Map();                                                      // marketing year's first calendar year → ₹/quintal
{
    const cCrop = msp.col('CLS_OF_CRPS'), cT = msp.col('TIME_PERIOD'), cV = msp.col('OBS_VALUE');
    for (const r of msp.rows) if (r[cCrop] === 'FG_CE_WH' && r[cV] !== '') { assert(r[cT].endsWith('-03-31'), `support price dated ${r[cT]}`); WHEAT.set(+r[cT].slice(0, 4) - 1, num(r[cV])); }
}
assert(WHEAT.has(FROM_YEAR), `no wheat support price for ${FROM_YEAR}-${String(FROM_YEAR + 1).slice(2)}`);

// ── the workers' price index, chained ─────────────────────────────────────────────────────────────────────────────

// The linking factors, from the bulletin table the RBI publishes them in: the 2016 column's factor links the 2001
// base onto it, the 2001 column's the 1982 base onto that.
const FACTORS = (() => {
    const lines = fs.readFileSync(BULLETIN, 'utf8').split(/\r?\n/);
    const cells = line => line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    const baseRow = cells(lines.find(l => l.startsWith('"Base Year"')) ?? fail('no base-year row in the bulletin table'));
    const linkRow = cells(lines.find(l => l.startsWith('"Linking Factor"')) ?? fail('no linking-factor row in the bulletin table'));
    assert(baseRow[1] === '2016 = 100' && baseRow[2] === '2001', `the bulletin table's columns are ${baseRow.slice(1, 3).join(', ')}`);
    return { to2016 : num(linkRow[1]), to2001 : num(linkRow[2]) };
})();

const cpi = sdmxRows('real-sector/prices-wages/consumer-price-index-industrial-worker.csv');
const CPI = new Map();                                                        // month → general index, 2016 = 100
const CPI_BASE = new Map();                                                   // month → the base DBIE carries it on
{
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
// The chain must be continuous where the bases meet: December 2005 against January 2006, August against September 2020.
for (const [ a, b ] of [ [ '2005-12', '2006-01' ], [ '2020-08', '2020-09' ] ]) {
    assert(CPI.has(a) && CPI.has(b) && CPI_BASE.get(a) !== CPI_BASE.get(b), `the bases do not meet at ${a}/${b}`);
    assert(Math.abs(CPI.get(b) / CPI.get(a) - 1) < 0.03, `the chained index jumps ${r3(CPI.get(b) / CPI.get(a))} at ${a}/${b}`);
}

// ── the years ─────────────────────────────────────────────────────────────────────────────────────────────────────

const lastMonth = series => [ ...series.keys() ].sort().pop();
const TO_YEAR = +lastMonth(CPI).slice(0, 4);
assert(TO_YEAR >= 2026, `the index ends in ${TO_YEAR}`);
const toYearOf = series => +lastMonth(series).slice(0, 4);
assert(toYearOf(BULLION.gold) === TO_YEAR && toYearOf(BULLION.silver) === TO_YEAR, 'bullion does not reach the last year');

const YEARS = [];
for (let year = FROM_YEAR; year <= TO_YEAR; year++) {
    const gold = yearAverage(BULLION.gold, year), silver = yearAverage(BULLION.silver, year), mason = yearAverage(MASON, year), index = yearAverage(CPI, year);
    assert(gold && silver && index, `${year}: a series is missing`);
    const full = year < TO_YEAR;
    if (full) assert(gold.months === 12 && silver.months === 12 && index.months === 12, `${year}: an incomplete year`);
    const usd = USD_YEAR.has(year) ? { rate : USD_YEAR.get(year), days : null, last : `${year}-12` } : (d => d && { rate : d.avg, days : d.days, last : d.last.slice(0, 7) })(dailyAverage(year));
    assert(usd, `${year}: no dollar rate`);
    const wheat = WHEAT.get(year) ?? null;
    YEARS.push({
        year,
        gold   : { price : r2(gold.avg), months : gold.months, grams : r1(SUM / gold.avg * 10) },
        silver : { price : r2(silver.avg), months : silver.months, kg : r2(SUM / silver.avg) },
        mason  : mason ? { wage : r2(mason.avg), months : mason.months, days : Math.round(SUM / mason.avg) } : null,
        usd    : { rate : r2(usd.rate), days : usd.days, dollars : Math.round(SUM / usd.rate) },
        wheat  : wheat ? { price : wheat, cropYear : `${year}-${String(year + 1).slice(2)}`, quintals : r1(SUM / wheat) } : null,
        index  : { value : r2(index.avg), months : index.months, base : CPI_BASE.get(`${year}-01`) ?? CPI_BASE.get(index.last) },
    });
}
const NOW = YEARS[YEARS.length - 1];
// What each year's sum is worth in the last year's prices, by the workers' index.
for (const y of YEARS) y.worthNow = Math.round(SUM * NOW.index.value / y.index.value);
const yearOf = y => YEARS.find(r => r.year === y) ?? fail(`no row for ${y}`);
const FIRST = yearOf(FROM_YEAR);
const MASON_LAST = [ ...YEARS ].reverse().find(y => y.mason);
const WHEAT_LAST = [ ...YEARS ].reverse().find(y => y.wheat);

// ── the headline ──────────────────────────────────────────────────────────────────────────────────────────────────

// The four years the story stops at, and how far each thing ran against the workers' index: its price in the last
// year over its price in the first, divided by the index's rise, so above one means it ran ahead of prices.
const LENS_YEARS = [ FROM_YEAR, 2011, 2021, TO_YEAR ];
for (const y of LENS_YEARS) yearOf(y);
const priceRise = NOW.index.value / FIRST.index.value;
const against = (a, b) => r2((b / a) / priceRise);
const HEADLINE = {
    sum : SUM, fromYear : FROM_YEAR, toYear : TO_YEAR, lensYears : LENS_YEARS,
    priceRise : r2(priceRise),
    worthNow  : FIRST.worthNow,                                               // ₹1 lakh of the first year in the last year's prices
    necklaceNow : Math.round(FIRST.gold.grams / 10 * NOW.gold.price),         // the first year's gold at the last year's price
    ranAhead : {
        gold   : against(FIRST.gold.price, NOW.gold.price),
        silver : against(FIRST.silver.price, NOW.silver.price),
        mason  : against(FIRST.mason.wage, MASON_LAST.mason.wage),            // to the mason's last year, not the index's
        masonAgainstIndexTo : MASON_LAST.year,
        usd    : against(FIRST.usd.rate, NOW.usd.rate),
        wheat  : against(FIRST.wheat.price, WHEAT_LAST.wheat.price),
        wheatTo : WHEAT_LAST.year,
    },
    // The last period each series reaches, for the vintage line.
    last : {
        gold : lastMonth(BULLION.gold), silver : lastMonth(BULLION.silver), mason : lastMonth(MASON), usd : NOW.usd.days ? [ ...USD_DAILY.keys() ].sort().pop() : `${NOW.year}-12`,
        wheat : WHEAT_LAST.wheat.cropYear, index : lastMonth(CPI),
    },
    masonBreak : MASON_BREAK,
};
// The mason's run against prices is measured to the mason's own last year.
{
    const idx = yearOf(MASON_LAST.year).index.value;
    HEADLINE.ranAhead.mason = r2((MASON_LAST.mason.wage / FIRST.mason.wage) / (idx / FIRST.index.value));
    const widx = yearOf(WHEAT_LAST.year).index.value;
    HEADLINE.ranAhead.wheat = r2((WHEAT_LAST.wheat.price / FIRST.wheat.price) / (widx / FIRST.index.value));
}

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const out = { headline : HEADLINE, factors : FACTORS, years : YEARS };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 1));

// ── the page's data module ────────────────────────────────────────────────────────────────────────────────────────

const ts = v => JSON.stringify(v);
const GEN = [
    '// GENERATED by data/processors/story-what-one-lakh-bought.mjs — do not edit. Every number on the page comes from',
    '// here, and here from the scraped DBIE series (METAL_PRICE_RN, WAGE_RATES_RN, FOREX_RATE_A_RN, FOREX_RATE_D_RN,',
    '// MIN_SUP_PRICE_RN, CPI_IW_RN) and the bulletin table of linking factors; the processor\'s header says how.',
    '',
    '// The sum, the years, the four years the story stops at, how far each thing ran against the workers\' price index',
    '// (above one is ahead of prices), the last period each series reaches, and the November 2013 step in the mason\'s',
    '// series.',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    '// The Labour Bureau\'s linking factors, as the RBI Bulletin prints them: to2001 links the 1982 base onto 2001,',
    '// to2016 the 2001 base onto 2016.',
    `export const FACTORS = ${ts(FACTORS)};`,
    '',
    '// One row a year. Prices are calendar-year averages over the months DBIE carries (`months`), except wheat, which',
    '// is the support price for the marketing year beginning that year. The index is the workers\' general index chained',
    '// onto 2016 = 100, and `base` the base DBIE carries that year on. `worthNow` is the sum carried to the last year\'s',
    '// prices by the index. The mason and wheat rows are null where DBIE has no figure yet.',
    'export interface Year {',
    '    year : number;',
    '    gold : { price : number; months : number; grams : number };',
    '    silver : { price : number; months : number; kg : number };',
    '    mason : { wage : number; months : number; days : number } | null;',
    '    usd : { rate : number; days : number | null; dollars : number };',
    '    wheat : { price : number; cropYear : string; quintals : number } | null;',
    '    index : { value : number; months : number; base : string };',
    '    worthNow : number;',
    '}',
    `export const YEARS : Year[] = ${ts(YEARS)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => v ?? '').join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'one-lakh-by-year.csv'), `# What ₹${SUM.toLocaleString('en-IN')} bought each year, from the prices on DBIE: Mumbai gold and silver (RBI, calendar-year averages), a rural mason's daily wage (Labour Bureau, men, all India), the rupee–dollar rate (calendar-year average), the minimum support price of wheat (by marketing year) and the consumer price index for industrial workers chained onto 2016 = 100 with the Labour Bureau's linking factors ${FACTORS.to2001} and ${FACTORS.to2016}. The last year is a part year.\n` + csv(
    [ 'year', 'gold_rs_per_10g', 'gold_months', 'gold_grams', 'silver_rs_per_kg', 'silver_months', 'silver_kg', 'mason_rs_per_day', 'mason_months', 'mason_days', 'usd_rate', 'dollars', 'wheat_msp_rs_per_quintal', 'wheat_crop_year', 'wheat_quintals', 'cpi_iw_2016_base', 'cpi_months', 'cpi_base_on_dbie', 'worth_in_last_year_rs' ],
    YEARS.map(y => [ y.year, y.gold.price, y.gold.months, y.gold.grams, y.silver.price, y.silver.months, y.silver.kg, y.mason?.wage, y.mason?.months, y.mason?.days, y.usd.rate, y.usd.dollars, y.wheat?.price, y.wheat?.cropYear, y.wheat?.quintals, y.index.value, y.index.months, y.index.base, y.worthNow ])));

console.log(`${NAME}: ${YEARS.length} years, ${FROM_YEAR} to ${TO_YEAR}; gold ${FIRST.gold.grams} g → ${NOW.gold.grams} g; ₹${SUM} of ${FROM_YEAR} is ₹${HEADLINE.worthNow} in ${TO_YEAR} prices; mason ${FIRST.mason.days} → ${MASON_LAST.mason.days} days (${MASON_LAST.year}); $${FIRST.usd.dollars} → $${NOW.usd.dollars}`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 1 CSV under public/stories/${SLUG}/`);
