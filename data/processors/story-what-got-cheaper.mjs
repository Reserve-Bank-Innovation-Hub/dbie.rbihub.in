// Processor: story-what-got-cheaper — derives every series for the story from the scrape's SDMX exports
// (data/sdmx/real-sector/prices-wages/**, restored by `pnpm data:fetch`), read with the parser the database loader
// uses, so each series is the one loaded into Postgres as real_sector.<dsd_code>. Nothing is typed by hand.
//
// Sources (DBIE SDMX dataset → table):
//   WHOLE_PRICE_INDEX_RN          the wholesale price index, monthly, every commodity code of four bases:
//                                 2011-12 (869 series, April 2012 onwards), 2004-05, 1993-94 and 1981-82
//   CPI_RUC_RN                    the consumer price index (rural, urban, combined), 2012 base, group level
//   WAGE_RATES_RN                 daily wage rates in rural India, men, by occupation and state, from the Labour Bureau
//   CPI_RL_RN, CPI_AG_RN          the consumer price indices for rural and for agricultural labourers, the Bureau's deflators
//   WHOLE_PRICE_INDEX_AVG_VAR_RN  the index's yearly averages by base: the 1993-94 series for 1994-95 to 1999-00, which the
//                                 monthly table on DBIE does not carry
//   METAL_PRICE_RN                the RBI's monthly Mumbai prices of gold and silver
//
// The commodity code carries the tree: WPI01 is all commodities; WPI0101, WPI0102, WPI0103 the three major groups
// (WPI0104, the food index, is a cross-cut and not part of the tree); every further pair of digits a level down:
// group, sub-group, item, sub-item. An item of the story is a leaf of that tree: a code no other code extends.
// COM_WGT is the code's weight in the 2011-12 basket, in rupees of every ₹100. DBIE prints the base year itself, April
// 2011 to March 2012, as twelve rows of exactly 100 for every code: placeholders, not prices, which the processor
// checks and drops. The last two months of a series are the Office's provisional figures.
//
// The older bases are linked the official way: each series is divided by its own average over the next base year
// (the 2004-05 series averaged 156.1 over 2011-12, so 156.1 on that base is 100 on this one), which reproduces the
// Office's published linking factors.
//
// Emits:
//   out/story-what-got-cheaper.json                   the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/what-got-cheaper/data.gen.ts      the module the page imports
//   public/stories/what-got-cheaper/*.csv             the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-what-got-cheaper';
const SLUG      = 'what-got-cheaper';

const SDMX      = path.join(REPO, 'data/sdmx/real-sector/prices-wages');
const CODELISTS = path.join(REPO, 'data/sdmx-codelists');

const fail = msg => { throw new Error(`${NAME}: ${msg}`); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

// ── reading ───────────────────────────────────────────────────────────────────────────────────────────────────────

// An SDMX CSV as rows keyed by header name.
function sdmxRows(file) {
    const { header, data } = readSdmxCsv(path.join(SDMX, file));
    const idx = Object.fromEntries(header.map((h, i) => [ h, i ]));
    for (const col of [ 'TIME_PERIOD', 'OBS_VALUE' ]) assert(idx[col] !== undefined, `${file} has no ${col} column`);
    return { rows : data, col : name => { assert(idx[name] !== undefined, `${file} has no ${name} column`); return idx[name]; } };
}

// A dimension's code → label from the scraped code list.
function labels(dsd, dim) {
    const list = JSON.parse(fs.readFileSync(path.join(CODELISTS, `${dsd}.json`), 'utf8'));
    const d = list.dims.find(x => x.code === dim);
    assert(d, `${dsd} code list has no dimension ${dim}`);
    const map = new Map();
    for (const v of d.values) map.set(v.code, tidy(v.label));
    return map;
}

// DBIE's labels as they are, with the whitespace and entities tidied.
const tidy = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const ym   = period => period.slice(0, 7);                                   // '2025-04-30' → '2025-04'
const fyOf = key => { const y = +key.slice(0, 4), m = +key.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
const num  = s => { const v = Number(s); assert(s !== '' && Number.isFinite(v), `not a number: ${JSON.stringify(s)}`); return v; };
const r1   = v => Math.round(v * 10) / 10;
const r2   = v => Math.round(v * 100) / 100;
const r3   = v => Math.round(v * 1000) / 1000;
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

// Months of a series that fall in a financial year, as a list of [month, value]; the average leaves out the months
// an item carried no price (a 0 on DBIE: a seasonal fruit out of season).
const fyValues = (series, fy) => [ ...series.entries() ].filter(([ k ]) => fyOf(k) === fy).sort(([ a ], [ b ]) => a < b ? -1 : 1);
const fyAverage = (series, fy) => {
    const vals = fyValues(series, fy);
    const priced = vals.filter(([ , v ]) => v > 0).map(([ , v ]) => v);
    return { avg : priced.length ? mean(priced) : null, months : vals.length, priced : priced.length };
};
const calendarAverage = (series, year) => {
    const vals = [ ...series.entries() ].filter(([ k ]) => k.startsWith(`${year}-`)).map(([ , v ]) => v);
    assert(vals.length === 12, `${year} has ${vals.length} months, not 12`);
    return mean(vals);
};

// ── the wholesale price index ──────────────────────────────────────────────────────────────────────────────────────

const WPI_LABEL = labels('WHOLE_PRICE_INDEX_RN', 'WPI_COM_CLS_RN');
const wpi = sdmxRows('wholesale-price-index.csv');
{
    const BASES = new Set([ 'BY_1981_82', 'BY_1993_94', 'BY_2004_05', 'BY_2011_12' ]);
    const cBase = wpi.col('BASE_PER'), cW = wpi.col('COM_WGT'), cCode = wpi.col('WPI_COM_CLS_RN'), cT = wpi.col('TIME_PERIOD'), cV = wpi.col('OBS_VALUE');
    var byBase = new Map();                                                   // base → code → { w, series : Map(ym → value) }
    for (const r of wpi.rows) {
        const base = r[cBase];
        assert(BASES.has(base), `unexpected WPI base ${base}`);
        let codes = byBase.get(base);
        if (!codes) byBase.set(base, (codes = new Map()));
        const code = r[cCode];
        let s = codes.get(code);
        if (!s) codes.set(code, (s = { w : num(r[cW]), series : new Map() }));
        else assert(s.w === num(r[cW]), `${base} ${code}: weight changes within the series`);
        const k = ym(r[cT]);
        assert(!s.series.has(k), `${base} ${code} ${k}: duplicate month`);
        s.series.set(k, num(r[cV]));
    }
}
const B11 = byBase.get('BY_2011_12');
assert(B11 && B11.size > 800, `the 2011-12 base has ${B11?.size ?? 0} series`);

// The base year's own twelve months are placeholders of 100 on DBIE, for every code: check, count and drop them.
const PLACEHOLDER = { from : '2011-04', to : '2012-03', rows : 0 };
for (const [ code, s ] of B11) {
    for (const [ k, v ] of s.series) {
        if (k > PLACEHOLDER.to) continue;
        assert(k >= PLACEHOLDER.from && v === 100, `${code} ${k}: a base-year row that is not the placeholder 100 (${v})`);
        s.series.delete(k);
        PLACEHOLDER.rows++;
    }
}
assert(PLACEHOLDER.rows === 12 * B11.size, `${PLACEHOLDER.rows} placeholder rows for ${B11.size} series`);

// The months of the 2011-12 base, first to last, every one of which all commodities carries.
const MONTHS = [ ...B11.get('WPI01').series.keys() ].sort();
assert(MONTHS[0] === '2012-04', `the 2011-12 base's data begins in ${MONTHS[0]}, not April 2012`);
// The Office's latest two months are provisional, and DBIE carries them as such.
const PROVISIONAL = MONTHS.slice(-2);
const LAST_MONTH = MONTHS[MONTHS.length - 1];
for (let i = 1; i < MONTHS.length; i++) {
    const [ y, m ] = MONTHS[i - 1].split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    assert(MONTHS[i] === next, `the all-commodities series skips from ${MONTHS[i - 1]} to ${MONTHS[i]}`);
}
const seriesOf = code => { const s = B11.get(code); assert(s, `no 2011-12 series for ${code}`); return s; };
const seriesArray = code => { const s = seriesOf(code).series; return MONTHS.map(k => { const v = s.get(k); assert(v !== undefined, `${code} has no value for ${k}`); return v; }); };

// The windows the story compares: the base year, the latest complete financial year, and the latest month.
const BASE_FY = '2011-12';
const NOW_FY  = (() => { const fy = fyOf(LAST_MONTH); return fyValues(seriesOf('WPI01').series, fy).length === 12 ? fy : fyOf(`${+fy.slice(0, 4) - 1}-04`); })();
assert(fyValues(seriesOf('WPI01').series, NOW_FY).length === 12, `${NOW_FY} is not a complete year`);
// The window the wage series allows: the Labour Bureau's current occupations begin in November 2013, and the series
// on DBIE ends in April 2025, so the first and last complete financial years are 2014-15 and 2024-25.
const WAGE_FY_FROM = '2014-15', WAGE_FY_TO = '2024-25';

// The tree. Every code of the 2011-12 base except the food index (a cross-cut), with its parent by code length.
const TREE_CODES = [ ...B11.keys() ].filter(c => c !== 'WPI0104').sort();
const LEVEL = { 5 : 'all', 7 : 'major', 9 : 'group', 11 : 'subgroup', 13 : 'item', 15 : 'subitem' };
for (const c of TREE_CODES) assert(LEVEL[c.length], `unexpected code length ${c.length}: ${c}`);
const parentOf = c => (c.length > 5 ? c.slice(0, c.length - 2) : null);
for (const c of TREE_CODES) if (c.length > 5) assert(B11.has(parentOf(c)), `${c} has no parent ${parentOf(c)} in the base`);
const hasChild = new Set(TREE_CODES.map(parentOf).filter(Boolean));
// DBIE files one pair the wrong way round, and the Office's own file shows which: the sub-group "manufacture of
// machinery for textile, apparel and leather production" (weight 0.19214) sits as an item under food-processing
// machinery, and the item "open end spinning machinery" (0.13728) sits as a sub-group with the textile-machinery items
// beneath it. The story swaps them back: the sub-group is no good, the item is one. Without the swap the goods' weights
// add to 100.055, not 100.
const MISFILED = { subgroupAsItem : 'WPI0103301206', itemAsSubgroup : 'WPI01033013' };
assert(/^Manufacture of Machinery For Textile/i.test(WPI_LABEL.get(MISFILED.subgroupAsItem) ?? ''), `${MISFILED.subgroupAsItem} is not the textile-machinery sub-group`);
assert(/^Open End Spinning Machinery/i.test(WPI_LABEL.get(MISFILED.itemAsSubgroup) ?? ''), `${MISFILED.itemAsSubgroup} is not open-end spinning machinery`);
assert(!hasChild.has(MISFILED.subgroupAsItem) && hasChild.has(MISFILED.itemAsSubgroup), 'the mis-filed pair is not filed as expected');
const LEAVES = TREE_CODES.filter(c => c.length >= 11 && ((!hasChild.has(c) && c !== MISFILED.subgroupAsItem) || c === MISFILED.itemAsSubgroup));
assert(LEAVES.length >= 600 && LEAVES.length <= 900, `${LEAVES.length} leaves, expected about 700`);
// Every parent's children add up to its weight, bar the three the mis-filing touches: the two sub-groups and the
// machinery group above them, whose sub-groups are off by the same 0.055.
{
    const touched = new Set([ parentOf(MISFILED.subgroupAsItem), MISFILED.itemAsSubgroup, parentOf(MISFILED.itemAsSubgroup) ]);
    assert(parentOf(parentOf(MISFILED.subgroupAsItem)) === parentOf(MISFILED.itemAsSubgroup), 'the mis-filed pair are not in one group');
    const byParent = new Map();
    for (const c of TREE_CODES) { const p = parentOf(c); if (p) byParent.set(p, (byParent.get(p) ?? 0) + seriesOf(c).w); }
    for (const [ p, sum ] of byParent) {
        if (touched.has(p)) continue;
        assert(Math.abs(sum - seriesOf(p).w) <= 0.001, `${p}: children weigh ${sum} against ${seriesOf(p).w}`);
    }
}

const MAJORS = [ 'WPI0101', 'WPI0102', 'WPI0103' ].map(code => ({ code, label : WPI_LABEL.get(code), weight : seriesOf(code).w }));
const GROUP_CODES = TREE_CODES.filter(c => c.length === 9);
const GROUPS = GROUP_CODES.map(code => ({ code, label : WPI_LABEL.get(code), major : MAJORS.findIndex(m => code.startsWith(m.code)), weight : seriesOf(code).w }));
for (const g of GROUPS) assert(g.major >= 0 && g.label, `group ${g.code} has no major group or label`);

// Weights add up: the groups to their major group, the major groups to a hundred, the leaves to the whole.
const closeTo = (a, b, tol, what) => assert(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
closeTo(MAJORS.reduce((s, m) => s + m.weight, 0), 100, 0.01, 'the major groups\' weights');
for (const m of MAJORS) closeTo(GROUPS.filter(g => g.code.startsWith(m.code)).reduce((s, g) => s + g.weight, 0), m.weight, 0.02, `${m.label}'s groups' weights`);
const leafWeight = LEAVES.reduce((s, c) => s + seriesOf(c).w, 0);
closeTo(leafWeight, 100, 0.001, 'the goods\' weights');

// The index is a weighted average: the groups at their weights reproduce all commodities, month by month.
const ALL = seriesArray('WPI01');
const GROUP_SERIES = GROUPS.map(g => seriesArray(g.code));
let worstRebuild = 0;
MONTHS.forEach((k, i) => {
    const rebuilt = GROUPS.reduce((s, g, gi) => s + g.weight * GROUP_SERIES[gi][i], 0) / 100;
    worstRebuild = Math.max(worstRebuild, Math.abs(rebuilt - ALL[i]));
});
assert(worstRebuild <= 0.3, `the groups at their weights miss all commodities by up to ${worstRebuild}`);

// The items.
const ITEMS = LEAVES.map(code => {
    const s = seriesOf(code);
    const now = fyAverage(s.series, NOW_FY), a = fyAverage(s.series, WAGE_FY_FROM), b = fyAverage(s.series, WAGE_FY_TO);
    assert(now.months === 12, `${code} has ${now.months} months in ${NOW_FY}`);
    assert(now.priced >= 1, `${code} carried no price in ${NOW_FY}`);           // litchi is priced in two months a year
    const group = GROUPS.findIndex(g => code.startsWith(g.code));
    assert(group >= 0, `${code} belongs to no group`);
    const subgroup = code.length >= 11 ? code.slice(0, 11) : null;
    return {
        code,
        label    : WPI_LABEL.get(code) ?? fail(`no label for ${code}`),
        major    : GROUPS[group].major,
        group,
        subgroup : subgroup && subgroup !== code ? (WPI_LABEL.get(subgroup) ?? null) : null,
        weight   : s.w,
        now      : r1(now.avg),             // the financial year's average, 2011-12 = 100
        priced   : now.priced,              // months of the year the item carried a price (seasonal fruit do not, out of season)
        latest   : s.series.get(LAST_MONTH),
        fyA      : a.avg === null ? null : r1(a.avg),   // the wage window: 2014-15 and 2024-25 averages
        fyB      : b.avg === null ? null : r1(b.avg),
        flat     : 0,                        // the longest run of unchanged months, filled below
        unchanged : 0,                       // the share of months with the index unchanged from the month before
        stale    : false,                    // unchanged half the time or more, or two years or more at one value
    };
});
const SEASONAL = ITEMS.filter(i => i.priced < 12).map(i => ({ code : i.code, label : i.label, priced : i.priced }));
// Series that hardly move: the longest run of unchanged months, and the items with three or fewer distinct values,
// which the method note reports as a sign of quotations not kept up.
const longestFlat = series => { let best = 0, run = 0, last = null; for (const k of MONTHS) { const v = series.get(k); run = v === last ? run + 1 : 1; last = v; best = Math.max(best, run); } return best; };
for (const it of ITEMS) it.flat = longestFlat(seriesOf(it.code).series);
const FLAT = ITEMS.filter(it => new Set(MONTHS.map(k => seriesOf(it.code).series.get(k))).size <= 3 || it.flat >= 60).map(it => ({ code : it.code, label : it.label, flat : it.flat, distinct : new Set(MONTHS.map(k => seriesOf(it.code).series.get(k))).size })).sort((a, b) => b.flat - a.flat);

// The headline figures of the basket for the same windows.
const fy = (code, f) => r2(fyAverage(seriesOf(code).series, f).avg);
const HEADLINE = {
    baseFy : BASE_FY, nowFy : NOW_FY, lastMonth : LAST_MONTH,
    all : fy('WPI01', NOW_FY), primary : fy('WPI0101', NOW_FY), fuel : fy('WPI0102', NOW_FY), manufactured : fy('WPI0103', NOW_FY), food : fy('WPI0104', NOW_FY),
    allLatest : seriesOf('WPI01').series.get(LAST_MONTH),
    foodWeight : r2(seriesOf('WPI0104').w),       // the food index's weight: food articles plus manufactured food products
    fuelJumpPct : r1(100 * (seriesOf('WPI0102').series.get(LAST_MONTH) / seriesOf('WPI0102').series.get(MONTHS[MONTHS.length - 2]) - 1)),   // fuel and power, last month over the one before
    provisional : PROVISIONAL, placeholderMonths : PLACEHOLDER.rows / B11.size,
    wageWindow : { from : WAGE_FY_FROM, to : WAGE_FY_TO, all : { from : fy('WPI01', WAGE_FY_FROM), to : fy('WPI01', WAGE_FY_TO) } },
    rebuildTolerance : r3(worstRebuild),
};

// Financial-year averages of all commodities and the major groups on the 2011-12 base, every year.
const FYS_2011 = [ ...new Set(MONTHS.map(fyOf)) ].filter(f => fyValues(seriesOf('WPI01').series, f).length === 12);
const FY_MAJORS = FYS_2011.map(f => ({ fy : f, all : fy('WPI01', f), primary : fy('WPI0101', f), fuel : fy('WPI0102', f), manufactured : fy('WPI0103', f), food : fy('WPI0104', f) }));

// ── since 1982: the four older bases linked into one series ───────────────────────────────────────────────────────
// The Office's own method: an older series is divided by its average over the next series' base year, where the
// next series is 100 by definition. The 2004-05 series averaged 156.1 over 2011-12, the 1993-94 series 187.3 over
// 2004-05 and the 1981-82 series 247.8 over 1993-94, the published linking factors.

const LONG_CODES = [ [ 'all', 'WPI01' ], [ 'primary', 'WPI0101' ], [ 'fuel', 'WPI0102' ], [ 'manufactured', 'WPI0103' ] ];
const LINKS = [];
const longMonthly = {};
for (const [ key, code ] of LONG_CODES) {
    const b11 = seriesOf(code).series, b04 = byBase.get('BY_2004_05').get(code)?.series, b93 = byBase.get('BY_1993_94').get(code)?.series, b81 = byBase.get('BY_1981_82').get(code)?.series;
    assert(b04 && b93 && b81, `${code} is missing from an older base`);
    for (const [ base, series ] of [ [ '2004-05', b04 ], [ '1993-94', b93 ], [ '1981-82', b81 ] ]) for (const v of series.values()) assert(v > 0 && v < 9000, `${code} on the ${base} base carries a placeholder value ${v}`);
    const l04 = fyAverage(b04, '2011-12'), l93 = fyAverage(b93, '2004-05'), l81 = fyAverage(b81, '1993-94');
    assert(l04.months === 12 && l93.months === 12 && l81.months === 12, `${code}: a linking year is incomplete`);
    const f04 = l04.avg / 100, f93 = l93.avg / 100, f81 = l81.avg / 100;
    LINKS.push({ series : key, code, from2004 : r3(f04), from1993 : r3(f93), from1981 : r3(f81) });
    const linked = new Map();
    for (const [ k, v ] of b81) linked.set(k, v / (f81 * f93 * f04));
    for (const [ k, v ] of b93) linked.set(k, v / (f93 * f04));
    for (const [ k, v ] of b04) linked.set(k, v / f04);
    for (const [ k, v ] of b11) linked.set(k, v);
    longMonthly[key] = linked;
}
// The all-commodities factors reproduce the Office's published ones (2.478, 1.873, 1.561) to the third decimal.
closeTo(LINKS[0].from1981, 2.478, 0.002, 'the 1981-82 to 1993-94 linking factor');
closeTo(LINKS[0].from1993, 1.873, 0.002, 'the 1993-94 to 2004-05 linking factor');
closeTo(LINKS[0].from2004, 1.561, 0.002, 'the 2004-05 to 2011-12 linking factor');
// The Office's own 1993-94 series ran from April 1994, but DBIE's monthly table carries it only from January 2000; its
// yearly averages are in DBIE's table of yearly averages, so the years 1994-95 to 1999-00 are taken from there, in
// 2011-12 terms, and the join falls at 1993-94 as the Office makes it.
const avgTable = sdmxRows('wholesale-price-index-annual-average-variation.csv');
const yearlyAverages = (base, code) => {
    const cBase = avgTable.col('BASE_PER'), cM = avgTable.col('MEASURE_RN'), cCode = avgTable.col('WPI_COM_CLS_RN'), cT = avgTable.col('TIME_PERIOD'), cV = avgTable.col('OBS_VALUE');
    const out = new Map();
    for (const r of avgTable.rows) if (r[cBase] === base && r[cM] === 'ANNUAL_AVE' && r[cCode] === code) { assert(r[cT].slice(5, 7) === '03', `yearly average dated ${r[cT]}`); out.set(fyOf(`${+r[cT].slice(0, 4) - 1}-04`), num(r[cV])); }
    return out;
};
const LONG_FYS = [ ...new Set([ ...longMonthly.all.keys() ].map(fyOf)) ].sort().filter(f => fyValues(longMonthly.all, f).length === 12);
assert(LONG_FYS[0] === '1982-83', `the long series begins in ${LONG_FYS[0]}`);
const longYearly = {};
for (const [ key, code ] of LONG_CODES) {
    const y93 = yearlyAverages('BY_1993_94', code);
    const l = LINKS.find(x => x.series === key);
    longYearly[key] = new Map(LONG_FYS.map(f => {
        if (f >= '1994-95' && f <= '1999-00') { const v = y93.get(f); assert(v, `${code}: no 1993-94 yearly average for ${f}`); return [ f, v / (l.from1993 * l.from2004) ]; }
        return [ f, fyAverage(longMonthly[key], f).avg ];
    }));
}
const LONG = LONG_FYS.map(f => ({ fy : f, ...Object.fromEntries(LONG_CODES.map(([ key ]) => [ key, r1(longYearly[key].get(f)) ])) }));
for (const l of LONG) assert(LONG_CODES.every(([ key ]) => Number.isFinite(l[key])), `a long-series year has no value: ${l.fy}`);
const LONG_FIRST = LONG_FYS[0], LONG_LAST = LONG_FYS[LONG_FYS.length - 1];
// The multiples from the unrounded yearly averages, and the ratio of the grown to the made.
const LONG_TIMES = Object.fromEntries(LONG_CODES.map(([ key ]) => [ key, r3(longYearly[key].get(LONG_LAST) / longYearly[key].get(LONG_FIRST)) ]));
LONG_TIMES.primaryOverManufactured = r3(LONG_TIMES.primary / LONG_TIMES.manufactured);
// When factory goods last kept pace with the basket (within a hundredth of their 1982-83 ratio), and how much of the
// grown-against-made gap, in logs, had opened by 2011-12 and opened between 2005-06 and 2013-14.
const rel = (key, f) => longYearly[key].get(f) / longYearly.all.get(f);
const base0 = rel('manufactured', LONG_FIRST);
const KEPT_PACE_UNTIL = [ ...LONG_FYS ].reverse().find(f => rel('manufactured', f) / base0 >= 0.99);
const gapAt = f => Math.log(longYearly.primary.get(f) / longYearly.manufactured.get(f)) - Math.log(longYearly.primary.get(LONG_FIRST) / longYearly.manufactured.get(LONG_FIRST));
const GAP_SHARES = { by2011 : r2(gapAt('2011-12') / gapAt(LONG_LAST)), from2005to2013 : r2((gapAt('2013-14') - gapAt('2005-06')) / gapAt(LONG_LAST)) };
// Joined at other years the two series both ran: the range of multiples each choice gives.
const LONG_RANGE = {};
for (const [ key, code ] of LONG_CODES) {
    const b11 = seriesOf(code).series, b04 = byBase.get('BY_2004_05').get(code).series, b93 = byBase.get('BY_1993_94').get(code).series, b81 = byBase.get('BY_1981_82').get(code).series;
    const y93 = yearlyAverages('BY_1993_94', code);
    const ratios = (a, b, fys) => fys.map(f => fyAverage(a, f).avg / (b instanceof Map && !(b.values().next().value instanceof Object) && fyAverage(b, f).months === 12 ? fyAverage(b, f).avg : NaN)).filter(Number.isFinite);
    const r04 = ratios(b04, b11, [ '2011-12', '2012-13', '2013-14', '2014-15', '2015-16', '2016-17' ].filter(f => f !== '2011-12')).concat([ LINKS.find(x => x.series === key).from2004 ]);
    const r93 = ratios(b93, b04, [ '2005-06', '2006-07', '2007-08', '2008-09', '2009-10' ]).concat([ LINKS.find(x => x.series === key).from1993 ]);
    const r81 = [ '1993-94', '1994-95', '1995-96', '1996-97', '1997-98', '1998-99' ].map(f => fyAverage(b81, f).avg / (f === '1993-94' ? 100 : y93.get(f))).filter(Number.isFinite);
    const first = fyAverage(b81, LONG_FIRST).avg, last = fyAverage(b11, LONG_LAST).avg;
    const multiple = (a, b, c) => last / (first / (a * b * c));
    LONG_RANGE[key] = { low : r2(multiple(Math.min(...r04), Math.min(...r93), Math.min(...r81))), high : r2(multiple(Math.max(...r04), Math.max(...r93), Math.max(...r81))) };
}

// ── the items the fan chart follows ───────────────────────────────────────────────────────────────────────────────
// Picked by DBIE's own label, so a renamed or dropped item fails loudly; the name is how the story says it.
const FOLLOW = [
    [ 'Solar Power System (Solar Panel & Attachable Equipment)', 'Solar power systems' ],
    [ 'Anti cancer drugs', 'Anti-cancer drugs' ],
    [ 'Colour Tv', 'Colour TVs' ],
    [ 'Blankets', 'Blankets' ],
    [ 'Air Conditioner', 'Air conditioners' ],
    [ 'Refrigerators', 'Refrigerators' ],
    [ 'Telephone Sets Including Mobile Hand Sets', 'Telephones and mobile handsets' ],
    [ 'Motor Cycles', 'Motorcycles' ],
    [ 'Bicycles of All Types', 'Bicycles' ],
    [ 'Ordinary Portland Cement', 'Cement' ],
    [ 'Urea', 'Urea' ],
    [ 'Cotton Yarn', 'Cotton yarn' ],
    [ 'Shirts/Half Shirts of Cotton and/Or Man-Made Fibre', 'Shirts' ],
    [ 'Petrol', 'Petrol' ],
    [ 'High Speed Diesel', 'Diesel' ],
    [ 'LPG', 'LPG' ],
    [ 'Electricity', 'Electricity' ],
    [ 'Kerosene', 'Kerosene' ],
    [ 'Milk', 'Milk' ],
    [ 'Egg', 'Eggs' ],
    [ 'Wheat', 'Wheat' ],
    [ 'Rice, Non - basmati', 'Rice' ],
    [ 'Sugar', 'Sugar' ],
    [ 'Tea', 'Tea' ],
    [ 'Potato', 'Potatoes' ],
    [ 'Onion', 'Onions' ],
    [ 'Tomato', 'Tomatoes' ],
    [ 'Coconut(Fresh)', 'Coconuts' ],
    [ 'Gold & Gold Ornaments', 'Gold and ornaments' ],
    [ 'Silver', 'Silver' ],
    [ 'Jasmine', 'Jasmine' ],
];
const FOLLOWED = FOLLOW.map(([ label, name ]) => {
    const hits = ITEMS.filter(i => i.label === label);
    assert(hits.length === 1, `${hits.length} items labelled ${JSON.stringify(label)}`);
    const it = hits[0];
    return { code : it.code, label, name, major : it.major, group : it.group, weight : it.weight, now : it.now, series : seriesArray(it.code).map(r1) };
});

// ── bullion: the Mumbai gold and silver prices, beside the index's gold and silver items ─────────────────────────────
// DBIE's metal-price table (METAL_PRICE_RN) carries the RBI's monthly average Mumbai price of gold (rupees per 10
// grams) and silver (rupees per kilogram); the index's "gold & gold ornaments" item does not follow it.

const metal = sdmxRows('metal-price.csv');
const BULLION = {};
{
    const cCity = metal.col('PICE_REF_CITY_RN'), cMetal = metal.col('PREC_METL_RN'), cUnit = metal.col('UNIT_MEASURE'), cT = metal.col('TIME_PERIOD'), cV = metal.col('OBS_VALUE');
    for (const [ key, code, unit ] of [ [ 'gold', 'GOLD', 'RUP_PER_10_GMS' ], [ 'silver', 'SILVER', 'RUP_PER_KG' ] ]) {
        const series = new Map();
        for (const r of metal.rows) if (r[cCity] === 'PRC1' && r[cMetal] === code && r[cUnit] === unit) series.set(ym(r[cT]), num(r[cV]));
        const a = fyAverage(series, BASE_FY), b = fyAverage(series, NOW_FY);
        assert(a.months === 12 && b.months === 12, `Mumbai ${key}: ${a.months} and ${b.months} months in ${BASE_FY} and ${NOW_FY}`);
        BULLION[key] = { unit : key === 'gold' ? 'rupees per 10 grams' : 'rupees per kilogram', base : Math.round(a.avg), now : Math.round(b.avg), times : r2(b.avg / a.avg) };
        BULLION[key].series = series;
    }
}

// ── the consumer price index, for the services the wholesale index leaves out ─────────────────────────────────────

const CPI_LABEL = labels('CPI_RUC_RN', 'COMD_ITEM');
const cpi = sdmxRows('consumer-price-index-rural-urban-combined-all-india.csv');
const cpiSeries = new Map();
{
    const cBase = cpi.col('BASE_PER'), cItem = cpi.col('COMD_ITEM'), cGeo = cpi.col('COVERAGE_GEO_RN'), cT = cpi.col('TIME_PERIOD'), cV = cpi.col('OBS_VALUE');
    for (const r of cpi.rows) {
        if (r[cBase] !== 'BY_2012' || r[cGeo] !== 'ALL_INDIA') continue;
        let s = cpiSeries.get(r[cItem]);
        if (!s) cpiSeries.set(r[cItem], (s = new Map()));
        const k = ym(r[cT]);
        assert(!s.has(k), `CPI ${r[cItem]} ${k}: duplicate month`);
        s.set(k, num(r[cV]));
    }
}
assert(cpiSeries.has('C_GIAG'), 'the CPI general index is missing');
const CPI_MONTHS = [ ...cpiSeries.get('C_GIAG').keys() ].sort();
const CPI_FIRST_YEAR = +CPI_MONTHS[0].slice(0, 4) + (CPI_MONTHS[0].endsWith('-01') ? 0 : 1);
const CPI_LAST_YEAR = +CPI_MONTHS[CPI_MONTHS.length - 1].slice(0, 4) - (CPI_MONTHS[CPI_MONTHS.length - 1].endsWith('-12') ? 0 : 1);
assert(CPI_FIRST_YEAR === 2013, `the 2012-base CPI's first full year is ${CPI_FIRST_YEAR}`);
const CPI_GROUPS = [ ...cpiSeries.keys() ].sort().map(code => {
    const s = cpiSeries.get(code);
    const full = y => [ ...s.keys() ].filter(k => k.startsWith(`${y}-`)).length === 12;
    const from = full(CPI_FIRST_YEAR) ? CPI_FIRST_YEAR : CPI_FIRST_YEAR + 1;      // the food price index begins a month late
    const fyA = fyAverage(s, `${from}-${String(from + 1).slice(2)}`), fyB = fyAverage(s, `${CPI_LAST_YEAR - 1}-${String(CPI_LAST_YEAR).slice(2)}`);
    assert(fyA.months === 12 && fyB.months === 12, `${code}: incomplete financial years`);
    return { code, label : CPI_LABEL.get(code) ?? fail(`no CPI label for ${code}`), fromYear : from, toYear : CPI_LAST_YEAR, from : r1(calendarAverage(s, from)), to : r1(calendarAverage(s, CPI_LAST_YEAR)), fyFrom : r1(fyA.avg), fyTo : r1(fyB.avg) };
});
const CPI_FY_WINDOW = { from : `${CPI_FIRST_YEAR}-${String(CPI_FIRST_YEAR + 1).slice(2)}`, to : `${CPI_LAST_YEAR - 1}-${String(CPI_LAST_YEAR).slice(2)}` };
// The wholesale index over the same calendar years, for the comparison.
const WPI_CALENDAR = {
    fromYear : CPI_FIRST_YEAR, toYear : CPI_LAST_YEAR,
    from : r1(calendarAverage(seriesOf('WPI01').series, CPI_FIRST_YEAR)), to : r1(calendarAverage(seriesOf('WPI01').series, CPI_LAST_YEAR)),
    food : { from : r1(calendarAverage(seriesOf('WPI0104').series, CPI_FIRST_YEAR)), to : r1(calendarAverage(seriesOf('WPI0104').series, CPI_LAST_YEAR)) },
    fuel : { from : r1(calendarAverage(seriesOf('WPI0102').series, CPI_FIRST_YEAR)), to : r1(calendarAverage(seriesOf('WPI0102').series, CPI_LAST_YEAR)) },
};
for (const key of [ 'gold', 'silver' ]) { const series = BULLION[key].series; delete BULLION[key].series; BULLION[key].calendar = { fromYear : CPI_FIRST_YEAR, toYear : CPI_LAST_YEAR, times : r2(calendarAverage(series, CPI_LAST_YEAR) / calendarAverage(series, CPI_FIRST_YEAR)) }; }
const CPI_FOLLOW = [ 'C_GIAG', 'C_GIAG_FB', 'C_GIAG_HO', 'C_GIAG_MS_HTH', 'C_GIAG_MS_ED', 'C_GIAG_MS_TC', 'C_GIAG_CF', 'C_GIAG_FL', 'C_GIAG_MS_PCE', 'C_GIAG_MS_RA', 'C_GIAG_MS_HHGS' ];
const CPI_SERIES = { months : CPI_MONTHS, series : CPI_FOLLOW.map(code => ({ code, label : CPI_LABEL.get(code), values : CPI_MONTHS.map(k => cpiSeries.get(code)?.get(k) ?? null) })) };
for (const s of CPI_SERIES.series) assert(s.label && s.values.slice(1).every(v => v !== null), `CPI series ${s.code} is incomplete`);

// ── rural wages, for the price of a thing in days of work ─────────────────────────────────────────────────────────

const WAGE_LABEL = labels('WAGE_RATES_RN', 'TYP_AAA_RN');
const wages = sdmxRows('wage-rates.csv');
const wageSeries = new Map();
{
    const cState = wages.col('STATE_CODE'), cOcc = wages.col('TYP_AAA_RN'), cG = wages.col('GENDER_RN'), cT = wages.col('TIME_PERIOD'), cV = wages.col('OBS_VALUE');
    for (const r of wages.rows) {
        if (r[cState] !== 'ALL_INDIA') continue;
        assert(r[cG] === 'MALE', `a wage row for ${r[cG]}: the story assumes DBIE carries men's wages only`);
        let s = wageSeries.get(r[cOcc]);
        if (!s) wageSeries.set(r[cOcc], (s = new Map()));
        const k = ym(r[cT]);
        assert(!s.has(k), `wages ${r[cOcc]} ${k}: duplicate month`);
        s.set(k, num(r[cV]));
    }
}
const WAGES = [ ...wageSeries.keys() ].sort().map(code => {
    const s = wageSeries.get(code);
    const a = fyAverage(s, WAGE_FY_FROM), b = fyAverage(s, WAGE_FY_TO);
    if (a.months !== 12 || b.months !== 12) return null;                   // the occupations of the older series, to October 2013
    return { code, label : WAGE_LABEL.get(code) ?? fail(`no wage label for ${code}`), from : r1(a.avg), to : r1(b.avg) };
}).filter(Boolean);
assert(WAGES.length >= 20, `${WAGES.length} occupations cover both ${WAGE_FY_FROM} and ${WAGE_FY_TO}`);
const wageNamed = code => WAGES.find(w => w.code === code) ?? fail(`no wage series ${code}`);
// The yardstick: a day of a non-agricultural labourer (porters and loaders included), the Labour Bureau's general
// unskilled rate outside the farm; the farm labourer's day beside it.
const YARDSTICK = { nonFarm : wageNamed('WR24'), farm : wageNamed('WR13'), carpenter : wageNamed('WR07') };
const wageRise = YARDSTICK.nonFarm.to / YARDSTICK.nonFarm.from;
// Every item in days of work: its rise over the wage window against the wage's.
for (const it of ITEMS) it.inWork = it.fyA && it.fyB ? r3((it.fyB / it.fyA) / wageRise) : null;
const itemsInWindow = ITEMS.filter(i => i.inWork !== null);
// The same count against other yardsticks and from the next starting year, so the method note can say how far it moves.
const cheaperInWorkAgainst = (rise, fromFy = WAGE_FY_FROM) => ITEMS.filter(it => { const a = fyAverage(seriesOf(it.code).series, fromFy).avg, b = it.fyB; return a && b && (b / a) / rise < 1; }).length;
const meanWageRise = mean(WAGES.map(w => w.to / w.from));
const NEXT_FY = `${+WAGE_FY_FROM.slice(0, 4) + 1}-${String(+WAGE_FY_FROM.slice(0, 4) + 2).slice(2)}`;
const nextFyWage = (code => { const s = wageSeries.get(code); const a = fyAverage(s, NEXT_FY); assert(a.months === 12, `${code}: ${a.months} months in ${NEXT_FY}`); return wageNamed(code).to / a.avg; })('WR24');
// The all-India wage is the Bureau's average over village quotations; the states' rises averaged equally give another.
const STATE_WAGE = (() => {
    const cState = wages.col('STATE_CODE'), cOcc = wages.col('TYP_AAA_RN'), cT = wages.col('TIME_PERIOD'), cV = wages.col('OBS_VALUE');
    const byState = new Map();
    for (const r of wages.rows) { if (r[cOcc] !== 'WR24' || r[cState] === 'ALL_INDIA') continue; let m = byState.get(r[cState]); if (!m) byState.set(r[cState], (m = new Map())); m.set(ym(r[cT]), num(r[cV])); }
    const rises = [ ...byState.values() ].map(m => { const a = fyAverage(m, WAGE_FY_FROM), b = fyAverage(m, WAGE_FY_TO); return a.months === 12 && b.months === 12 ? b.avg / a.avg : null; }).filter(v => v !== null);
    return { states : rises.length, equalRise : r3(mean(rises)) };
})();

// ── the rural labourers' consumer price index, the Labour Bureau's own deflator for these wages ─────────────────────
const cpiRl = sdmxRows('consumer-price-index-rural-labourer.csv');
const RURAL_CPI = (() => {
    const cBase = cpiRl.col('BASE_PER'), cItem = cpiRl.col('COMD_ITEM'), cT = cpiRl.col('TIME_PERIOD'), cV = cpiRl.col('OBS_VALUE');
    const series = new Map();
    for (const r of cpiRl.rows) if (r[cItem] === 'CO_GIAG') { assert(r[cBase] === 'BY_1986-87', `CPI-RL base ${r[cBase]}`); series.set(ym(r[cT]), num(r[cV])); }
    const a = fyAverage(series, WAGE_FY_FROM), b = fyAverage(series, WAGE_FY_TO);
    assert(a.months === 12 && b.months === 12, `CPI-RL: ${a.months} and ${b.months} months in the wage window`);
    return { base : '1986-87', from : r1(a.avg), to : r1(b.avg), times : r3(b.avg / a.avg) };
})();

// The Labour Bureau's index for agricultural labourers, its deflator for the farm occupations.
const AGRI_LABEL = labels('CPI_AG_RN', 'COMD_ITEM');
const agriCode = [ ...AGRI_LABEL.entries() ].find(([ , l ]) => /^General Index$/i.test(l))?.[0] ?? fail('no general index in the agricultural labourers\' index');
const cpiAg = sdmxRows('cpi-agricultural-labourer.csv');
const AGRI_CPI = (() => {
    const cItem = cpiAg.col('COMD_ITEM'), cT = cpiAg.col('TIME_PERIOD'), cV = cpiAg.col('OBS_VALUE');
    const series = new Map();
    for (const r of cpiAg.rows) if (r[cItem] === agriCode) series.set(ym(r[cT]), num(r[cV]));
    const a = fyAverage(series, WAGE_FY_FROM), b = fyAverage(series, WAGE_FY_TO);
    assert(a.months === 12 && b.months === 12, `CPI-AL: ${a.months} and ${b.months} months in the wage window`);
    return { base : '1986-87', from : r1(a.avg), to : r1(b.avg), times : r3(b.avg / a.avg) };
})();

// ── the counts the story opens with ───────────────────────────────────────────────────────────────────────────────

const median = xs => { const a = [ ...xs ].sort((p, q) => p - q), n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
const sortedNow = [ ...ITEMS ].sort((a, b) => a.now - b.now);
// A good's contribution to the basket's rise, in points of the 2011-12 = 100 index.
const points = items => items.reduce((t, i) => t + i.weight * (i.now - 100) / 100, 0);
// Stale-looking: the index unchanged from the month before in half or more of its months, or at one value for two
// years or more. The data cannot say whether that is a list price that did not move or a quotation carried forward.
for (const it of ITEMS) {
    const s = seriesOf(it.code).series;
    let same = 0, n = 0, last = null;
    for (const k of MONTHS) { const v = s.get(k); if (last !== null) { n++; if (v === last) same++; } last = v; }
    it.unchanged = r3(same / n);
    it.stale = it.unchanged >= 0.5 || it.flat >= 24;
}
const STALE = ITEMS.filter(i => i.stale);
const CHEAPER_ITEMS = ITEMS.filter(i => i.now < 100);
const weightedMedian = (items, key) => {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let acc = 0;
    for (const i of [ ...items ].sort((a, b) => a[key] - b[key])) { acc += i.weight; if (acc >= total / 2) return i[key]; }
    return null;
};
const COUNTS = {
    items        : ITEMS.length,
    cheaper      : ITEMS.filter(i => i.now < 100).length,
    underHalfUp  : ITEMS.filter(i => i.now >= 100 && i.now < 150).length,
    halfToDouble : ITEMS.filter(i => i.now >= 150 && i.now < 200).length,
    doubled      : ITEMS.filter(i => i.now >= 200).length,
    tripled      : ITEMS.filter(i => i.now >= 300).length,
    weightCheaper      : r2(ITEMS.filter(i => i.now < 100).reduce((s, i) => s + i.weight, 0)),
    weightDoubled      : r2(ITEMS.filter(i => i.now >= 200).reduce((s, i) => s + i.weight, 0)),
    medianItem         : r1(median(ITEMS.map(i => i.now))),
    meanItem           : r1(mean(ITEMS.map(i => i.now))),            // the goods counted equally, no weights
    weightedMedianItem : r1(weightedMedian(ITEMS, 'now')),
    belowBasket        : ITEMS.filter(i => i.now < HEADLINE.all).length,
    weightBelowBasket  : r2(ITEMS.filter(i => i.now < HEADLINE.all).reduce((t, i) => t + i.weight, 0)),
    // where the basket's rise came from: points of the 56, by group and by the tails
    points : {
        all      : r2(points(ITEMS)),
        doubled  : r2(points(ITEMS.filter(i => i.now >= 200))),
        tripled  : r2(points(ITEMS.filter(i => i.now >= 300))),
        cheaper  : r2(points(CHEAPER_ITEMS)),
        heaviest : r2(points([ ...ITEMS ].sort((a, b) => b.weight - a.weight).slice(0, 10))),
        byMajor  : MAJORS.map((_, mi) => r2(points(ITEMS.filter(i => i.major === mi)))),
    },
    weightTripled : r2(ITEMS.filter(i => i.now >= 300).reduce((t, i) => t + i.weight, 0)),
    // stale-looking goods, and how they sit among the cheaper ones
    stale : {
        items : STALE.length, weight : r2(STALE.reduce((t, i) => t + i.weight, 0)),
        amongCheaper : CHEAPER_ITEMS.filter(i => i.stale).length,
        amongRest : ITEMS.filter(i => !(i.now < 100) && i.stale).length, rest : ITEMS.length - CHEAPER_ITEMS.length,
        cheaperNear : CHEAPER_ITEMS.filter(i => !i.stale && i.now >= 95).length,
        cheaperFair : CHEAPER_ITEMS.filter(i => !i.stale && i.now < 95).length,
        cheaperFairWeight : r2(CHEAPER_ITEMS.filter(i => !i.stale && i.now < 95).reduce((t, i) => t + i.weight, 0)),
        cheaperFairMade : CHEAPER_ITEMS.filter(i => !i.stale && i.now < 95 && i.major === 2).length,
    },
    byMajor : MAJORS.map((m, mi) => {
        const its = ITEMS.filter(i => i.major === mi);
        return { label : m.label, items : its.length, cheaper : its.filter(i => i.now < 100).length, doubled : its.filter(i => i.now >= 200).length, median : r1(median(its.map(i => i.now))) };
    }),
    inWork : {
        items   : itemsInWindow.length,
        cheaper : itemsInWindow.filter(i => i.inWork < 1).length,
        dearer  : itemsInWindow.filter(i => i.inWork >= 1).length,
        weightCheaper : r2(itemsInWindow.filter(i => i.inWork < 1).reduce((s, i) => s + i.weight, 0)),
        wageRise : r3(wageRise),
        allRise  : r3(HEADLINE.wageWindow.all.to / HEADLINE.wageWindow.all.from),
        ruralCpiRise : RURAL_CPI.times,            // the Labour Bureau's deflator for these wages over the same years
        agriCpiRise  : AGRI_CPI.times,             // and its deflator for the farm occupations
        farmRise     : r3(YARDSTICK.farm.to / YARDSTICK.farm.from),
        cheaperAgainst : { farm : cheaperInWorkAgainst(YARDSTICK.farm.to / YARDSTICK.farm.from), carpenter : cheaperInWorkAgainst(YARDSTICK.carpenter.to / YARDSTICK.carpenter.from), meanOfOccupations : cheaperInWorkAgainst(meanWageRise), fromNextYear : cheaperInWorkAgainst(nextFyWage, NEXT_FY) },
        nextFy : NEXT_FY, occupations : WAGES.length, stateEqualRise : STATE_WAGE.equalRise, states : STATE_WAGE.states,
    },
};
assert(COUNTS.cheaper > 0 && COUNTS.doubled > 0, 'the counts are empty');

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const GROUP_OUT = GROUPS.map((g, gi) => ({ ...g, now : r2(fyAverage(seriesOf(g.code).series, NOW_FY).avg), series : GROUP_SERIES[gi] }));
const MAJOR_OUT = MAJORS.map(m => ({ ...m, now : r2(fyAverage(seriesOf(m.code).series, NOW_FY).avg), series : seriesArray(m.code) }));
const out = {
    headline : HEADLINE, counts : COUNTS, months : MONTHS, all : ALL, majors : MAJOR_OUT, groups : GROUP_OUT, items : ITEMS, seasonal : SEASONAL,
    followed : FOLLOWED, fyMajors : FY_MAJORS, long : LONG, links : LINKS, flat : FLAT, cpiGroups : CPI_GROUPS, cpiSeries : CPI_SERIES, wpiCalendar : WPI_CALENDAR,
    wages : WAGES, yardstick : YARDSTICK, bullion : BULLION, ruralCpi : RURAL_CPI, agriCpi : AGRI_CPI,
    longTimes : LONG_TIMES, longRange : LONG_RANGE, keptPaceUntil : KEPT_PACE_UNTIL, gapShares : GAP_SHARES, cpiFyWindow : CPI_FY_WINDOW,
};
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 1));

// ── the page's data module ────────────────────────────────────────────────────────────────────────────────────────

const ts = v => JSON.stringify(v);
const GEN = [
    '// GENERATED by data/processors/story-what-got-cheaper.mjs — do not edit. Every number on the page comes from',
    '// here, and here from the scraped DBIE series (WHOLE_PRICE_INDEX_RN, WHOLE_PRICE_INDEX_AVG_VAR_RN, CPI_RUC_RN,',
    '// WAGE_RATES_RN); the processor\'s header says how. Index values are 2011-12 = 100 unless a field says otherwise.',
    '',
    '// The comparison the story makes: the base year, the latest complete financial year, and the latest month on',
    '// DBIE; the three major groups and the food index for that year; the wage window, 2014-15 to 2024-25; the',
    '// provisional months at the end of the series; and the placeholder months DBIE prints for the base year.',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    `export const MISFILED = ${ts({ ...MISFILED, subgroupLabel : WPI_LABEL.get(MISFILED.subgroupAsItem), itemLabel : WPI_LABEL.get(MISFILED.itemAsSubgroup) })};`,
    '',
    '// How many of the items fell, rose a little, rose a lot, and doubled; the same by major group; and the same',
    '// measured in days of a rural labourer\'s work over the wage window.',
    `export const COUNTS = ${ts(COUNTS)};`,
    '',
    '// The months of the 2011-12 base, April 2012 to the latest, the index of every monthly series here.',
    `export const MONTHS : string[] = ${ts(MONTHS)};`,
    `export const ALL : number[] = ${ts(ALL)};`,
    '',
    'export interface Major { code : string; label : string; weight : number; now : number; series : number[]; }',
    `export const MAJORS : Major[] = ${ts(MAJOR_OUT)};`,
    '',
    '// The 29 groups of the basket, in code order: primary articles\' four, fuel\'s three, manufacturing\'s 22. Their',
    '// weights add to a hundred, and at those weights their indices reproduce all commodities.',
    'export interface Group { code : string; label : string; major : number; weight : number; now : number; series : number[]; }',
    `export const GROUPS : Group[] = ${ts(GROUP_OUT)};`,
    '',
    '// Every item: a leaf of DBIE\'s commodity tree, with one pair the processor swaps back the way the Office files',
    '// them (its header says which). `now` is its average over the latest complete financial year,',
    '// over the months it carried a price (`priced`); `latest` the latest month (0 for a seasonal item out of season);',
    '// fyA and fyB its averages over the wage window; inWork its rise over that window divided by the rise in the',
    '// day wage of a non-farm rural labourer, so that below 1 means cheaper in days of work; flat the longest run of',
    '// months in which its index did not change, unchanged the share of months it did not change, and stale whether',
    '// that share is half or more or the run two years or more.',
    'export interface Item { code : string; label : string; major : number; group : number; subgroup : string | null; weight : number; now : number; priced : number; latest : number; fyA : number | null; fyB : number | null; inWork : number | null; flat : number; unchanged : number; stale : boolean; }',
    `export const ITEMS : Item[] = ${ts(ITEMS)};`,
    '',
    '// The items the fan chart follows, with the names the story uses for them and their monthly series.',
    'export interface Followed { code : string; label : string; name : string; major : number; group : number; weight : number; now : number; series : number[]; }',
    `export const FOLLOWED : Followed[] = ${ts(FOLLOWED)};`,
    '',
    '// Financial-year averages on the 2011-12 base.',
    'export interface FyMajors { fy : string; all : number; primary : number; fuel : number; manufactured : number; food : number; }',
    `export const FY_MAJORS : FyMajors[] = ${ts(FY_MAJORS)};`,
    '',
    '// Since 1982-83: the four older bases linked onto 2011-12 = 100 the official way (LINKS has each series\' own',
    '// factors: its average over the next base year, divided by a hundred), yearly averages.',
    'export interface LongYear { fy : string; all : number; primary : number; fuel : number; manufactured : number; }',
    `export const LONG : LongYear[] = ${ts(LONG)};`,
    `export const LINKS = ${ts(LINKS)};`,
    '// The multiples from the unrounded yearly averages, latest year over 1982-83; the range each would take if the series',
    '// were joined at another year both ran; the last year factory goods kept pace with the basket; and how much of the',
    '// grown-against-made gap (in logs) had opened by 2011-12 and opened between 2005-06 and 2013-14.',
    `export const LONG_TIMES = ${ts(LONG_TIMES)};`,
    `export const LONG_RANGE : Record<"all" | "primary" | "fuel" | "manufactured", { low : number; high : number }> = ${ts(LONG_RANGE)};`,
    `export const KEPT_PACE_UNTIL = ${ts(KEPT_PACE_UNTIL)};`,
    `export const GAP_SHARES = ${ts(GAP_SHARES)};`,
    '',
    '// The items whose index hardly moved: three or fewer distinct values since April 2012, or sixty or more months',
    '// unchanged in a row.',
    `export const FLAT = ${ts(FLAT)};`,
    '',
    '// The consumer price index, 2012 base, all India combined: every group\'s calendar-year average in the first and',
    '// the latest full year, with the wholesale index over the same years; and monthly series for the groups shown.',
    'export interface CpiGroup { code : string; label : string; fromYear : number; toYear : number; from : number; to : number; fyFrom : number; fyTo : number; }',
    `export const CPI_FY_WINDOW = ${ts(CPI_FY_WINDOW)};`,
    `export const CPI_GROUPS : CpiGroup[] = ${ts(CPI_GROUPS)};`,
    `export const WPI_CALENDAR = ${ts(WPI_CALENDAR)};`,
    `export const CPI_SERIES : { months : string[]; series : { code : string; label : string; values : (number | null)[] }[] } = ${ts(CPI_SERIES)};`,
    '',
    '// Rural daily wages, men, all India, by occupation: averages over 2014-15 and 2024-25, in rupees a day.',
    'export interface Wage { code : string; label : string; from : number; to : number; }',
    `export const WAGES : Wage[] = ${ts(WAGES)};`,
    `export const YARDSTICK = ${ts(YARDSTICK)};`,
    '',
    '// The Mumbai price of gold (rupees per 10 grams) and silver (rupees per kilogram), RBI monthly averages on DBIE,',
    '// averaged over the base year and the latest year, beside which the index\'s gold item falls short.',
    `export const BULLION : Record<"gold" | "silver", { unit : string; base : number; now : number; times : number; calendar : { fromYear : number; toYear : number; times : number } }> = ${ts(BULLION)};`,
    '',
    '// The consumer price index for rural labourers (Labour Bureau, 1986-87 = 100), averaged over the wage window: the',
    '// deflator the Bureau itself uses for these wages.',
    `export const RURAL_CPI = ${ts(RURAL_CPI)};`,
    '// The same for agricultural labourers, the Bureau\'s deflator for the farm occupations.',
    `export const AGRI_CPI = ${ts(AGRI_CPI)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => (typeof v === 'string' && /[",\n]/.test(v)) ? `"${v.replace(/"/g, '""')}"` : (v ?? '')).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'wpi-items.csv'), `# Office of the Economic Adviser, DPIIT, wholesale price index (2011-12 = 100) as published on DBIE; one row per item (a leaf of the commodity tree); weight in rupees of every ₹100 of the basket; averages over the financial years named; in_work_${WAGE_FY_FROM}_to_${WAGE_FY_TO} is the item's rise over the wage window divided by the rise in the all-India day wage of a non-agricultural rural labourer\n` + csv(
    [ 'code', 'item', 'major_group', 'group', 'sub_group', 'weight', `avg_${NOW_FY}`, `months_priced_${NOW_FY}`, `index_${LAST_MONTH}`, `avg_${WAGE_FY_FROM}`, `avg_${WAGE_FY_TO}`, `in_work_${WAGE_FY_FROM}_to_${WAGE_FY_TO}`, 'longest_unchanged_run_months', 'share_of_months_unchanged', 'stale_looking' ],
    ITEMS.map(i => [ i.code, i.label, MAJORS[i.major].label, GROUPS[i.group].label, i.subgroup ?? '', i.weight, i.now, i.priced, i.latest, i.fyA, i.fyB, i.inWork, i.flat, i.unchanged, i.stale ])));
fs.writeFileSync(path.join(pubDir, 'wpi-groups-monthly.csv'), '# Office of the Economic Adviser, DPIIT, wholesale price index (2011-12 = 100) as published on DBIE: all commodities, the three major groups, the food index and the 29 groups, monthly\n' + csv(
    [ 'month', 'all_commodities', ...MAJOR_OUT.map(m => m.label), 'food_index', ...GROUP_OUT.map(g => g.label) ],
    MONTHS.map((k, i) => [ k, ALL[i], ...MAJOR_OUT.map(m => m.series[i]), seriesOf('WPI0104').series.get(k), ...GROUP_OUT.map(g => g.series[i]) ])));
fs.writeFileSync(path.join(pubDir, 'wpi-followed-items-monthly.csv'), '# Office of the Economic Adviser, DPIIT, wholesale price index (2011-12 = 100) as published on DBIE: the items the story follows, monthly\n' + csv(
    [ 'month', ...FOLLOWED.map(f => f.name) ], MONTHS.map((k, i) => [ k, ...FOLLOWED.map(f => f.series[i]) ])));
fs.writeFileSync(path.join(pubDir, 'wpi-since-1982.csv'), '# Office of the Economic Adviser, DPIIT, wholesale price index as published on DBIE, four bases linked onto 2011-12 = 100 by the official linking factors (each series divided by its average over the next base year), financial-year averages\n' + csv(
    [ 'financial_year', 'all_commodities', 'primary_articles', 'fuel_and_power', 'manufactured_products' ], LONG.map(l => [ l.fy, l.all, l.primary, l.fuel, l.manufactured ])));
fs.writeFileSync(path.join(pubDir, 'cpi-groups.csv'), '# MoSPI, consumer price index (2012 = 100), all India combined, as published on DBIE: calendar-year averages by group\n' + csv(
    [ 'code', 'group', 'from_year', 'to_year', 'avg_from', 'avg_to' ], CPI_GROUPS.map(g => [ g.code, g.label, g.fromYear, g.toYear, g.from, g.to ])));
fs.writeFileSync(path.join(pubDir, 'rural-wages.csv'), `# Labour Bureau, wage rates in rural India (men, all India), as published on DBIE: averages over ${WAGE_FY_FROM} and ${WAGE_FY_TO}, rupees a day\n` + csv(
    [ 'code', 'occupation', `avg_${WAGE_FY_FROM}`, `avg_${WAGE_FY_TO}` ], WAGES.map(w => [ w.code, w.label, w.from, w.to ])));

console.log(`${NAME}: ${ITEMS.length} items in ${GROUPS.length} groups, ${MONTHS.length} months to ${LAST_MONTH} (${PLACEHOLDER.rows} placeholder rows dropped, ${FLAT.length} flat and ${STALE.length} stale-looking items); ${NOW_FY} all commodities ${HEADLINE.all}; ${COUNTS.cheaper} cheaper, ${COUNTS.doubled} doubled; groups rebuild all commodities within ${HEADLINE.rebuildTolerance}; ${SEASONAL.length} seasonal items; ${CPI_GROUPS.length} CPI groups; ${WAGES.length} occupations; self-check passed`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 6 CSVs under public/stories/${SLUG}/`);
