// Processor: story-from-field-to-thali — derives every figure for "From field to thali", the story of what India grows,
// where it is grown, what the government buys at the minimum support price, and what India sells abroad and buys from
// abroad. It reads the scrape's Handbook of Statistics exports (data/reports/**) and the SDMX price index for farm
// workers (data/sdmx/**), both restored by `pnpm data:fetch`, with the parsers the database loader uses. Every figure on
// the page is DBIE's; nothing is typed by hand or taken from elsewhere.
//
// Sources (DBIE report id or SDMX series → what the story takes from it):
//   189  Agricultural production: foodgrains, lakh tonnes, 1950-51 to the latest crop year
//   166  Agricultural production: major commercial crops (oilseeds, sugarcane, cotton), lakh tonnes (cotton in lakh bales)
//   167  Area under cultivation: foodgrains, lakh hectares
//   190  Area under cultivation: major commercial crops, lakh hectares
//   191  Yield per hectare: foodgrains, kg
//   192  Yield per hectare: major commercial crops, kg
//   193  State-wise production of foodgrains and major non-foodgrain crops, thousand tonnes, 1980-81 to 2022-23
//   169  Public distribution system: rice and wheat procured, issued (off-take) and in stock, lakh tonnes
//   194  Minimum support price for foodgrains, ₹ per quintal, by crop year
//   195  Minimum support price for non-foodgrains, ₹ per quintal, by crop year
//   207  Exports of major commodities, US$ million: old items 1987-88 to 2013-14, new items 2009-10 onwards
//   297  Imports of major commodities, US$ million: old items 1987-88 to 2013-14, new items 2009-10 onwards
//   CPI_AG_RN  Consumer price index for agricultural labourers, general index, base 1986-87, monthly
//   WAGE_RATES_RN  Daily wage of a general farm labourer (men), all-India, monthly
//
// Emits:
//   out/story-from-field-to-thali.json                 the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/from-field-to-thali/data.gen.ts    the module the page imports
//   public/stories/from-field-to-thali/*.csv           the downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows, readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-from-field-to-thali';
const SLUG      = 'from-field-to-thali';

const HANDBOOK = path.join(REPO, 'data/reports/publication/time-series-publications/handbook-of-statistics-on-the-indian-economy');
const PRICES   = path.join(REPO, 'data/sdmx/real-sector/prices-wages');

// The one file in a folder that starts with a report id and ends with the suffix.
function reportFile(dir, id, suffix = '') {
    const hits = fs.readdirSync(dir).filter(f => f.startsWith(`${id}--`) && f.endsWith(`${suffix}.csv`));
    if (hits.length !== 1) throw new Error(`${NAME}: expected one CSV for report ${id}${suffix} in ${path.basename(dir)}, found ${hits.length}`);
    return path.join(dir, hits[0]);
}
async function grid(file) {
    const rows = [];
    await csvRows(file, { onRow : cells => rows.push(cells.map(c => c.trim())) });
    return rows;
}

// A cell to a number: Indian or plain digit grouping; '', '-' and ' -' (not available) as null.
const num = s => {
    if (s == null) return null;
    const t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-') return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
};
const r1 = v => v == null ? null : Math.round(v * 10) / 10;
const r2 = v => v == null ? null : Math.round(v * 100) / 100;
const isYear = s => /^\d{4}-\d{2}$/.test(s || '');
// "2025-26" → 2025, the year the crop or financial year starts; and back.
const startOf = y => +y.slice(0, 4);
const yearOf = s => `${s}-${String(s + 1).slice(2)}`;
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };

// The text of a table's notes, folded to one line: the Handbook prints them after the last data row.
const notesOf = g => g.map(r => r.join(' ')).filter(t => /^Notes?\s*:/i.test(t) || /^\s*\d+\.\s/.test(t)).join(' ').replace(/\s+/g, ' ');
// A header row's column index by its label, matched loosely (case, spacing and punctuation ignored).
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const colOf = (header, label, table) => {
    const i = header.findIndex(h => norm(h) === norm(label));
    if (i < 0) throw new Error(`${NAME}: ${table}: no column "${label}"`);
    return i;
};

// ── 1. What India grows: production, area and yield, all-India (reports 189, 166, 167, 190, 191, 192) ──────────────

// 189 and 191 and 167: Year; Rice; Wheat; Coarse Cereals; Cereals; Pulses; Food-grains.
// 166, 190 and 192: two header rows; the second gives Year; Groundnut; Rapeseed & Mustard; Soyabean; Oilseeds; then
// the first row's Sugarcane; Tea; Coffee; Cotton (Lint); Raw Jute & Mesta; Tobacco.
const t189 = await grid(reportFile(HANDBOOK, 189)), t166 = await grid(reportFile(HANDBOOK, 166));
const t167 = await grid(reportFile(HANDBOOK, 167)), t190 = await grid(reportFile(HANDBOOK, 190));
const t191 = await grid(reportFile(HANDBOOK, 191)), t192 = await grid(reportFile(HANDBOOK, 192));
check(/Lakhs? Tonnes/i.test(t189.flat().join(' ')), 'Report 189: the unit is no longer lakh tonnes');
check(/Lakhs? Hectares/i.test(t167.flat().join(' ')) && /Lakhs? Hectares/i.test(t190.flat().join(' ')), 'Reports 167 and 190: the unit is no longer lakh hectares');
check(/Kg\s*\/\s*Hectare/i.test(t191.flat().join(' ')) && /Kg\s*\/\s*Hectare/i.test(t192.flat().join(' ')), 'Reports 191 and 192: the unit is no longer kg per hectare');
for (const [ t, id ] of [ [ t189, 189 ], [ t167, 167 ], [ t191, 191 ] ]) {
    const h = t.find(r => r[0] === 'Year'), s = t[t.indexOf(h) + 1];
    check(s?.[1] === 'Rice' && s?.[2] === 'Wheat' && /Pulses/.test(h?.[5] ?? '') && /Food-?grains/i.test(h?.[6] ?? ''), `Report ${id}: the columns are not Rice; Wheat; … Pulses; Food-grains`);
}
// 166 heads its columns with the crop groups on one row and the oilseeds' parts on the other, and 190 and 192 put the
// two rows the other way round, so the columns are found by name: the oilseeds total, then sugarcane.
const commCols = (t, id) => {
    const a = t.find(r => r[0] === 'Year'), b = t[t.indexOf(a) + 1], c = t[t.indexOf(a) - 1];
    const parts = [ a, b ].find(r => r?.[4] === 'Oilseeds'), groups = [ a, b, c ].find(r => r?.includes('Sugarcane'));
    check(parts && groups, `Report ${id}: the oilseeds total or sugarcane column was not found`);
    return { oil : 4, cane : groups?.indexOf('Sugarcane') ?? -1 };
};
const foodBy = t => new Map(t.filter(r => isYear(r[0])).map(r => [ r[0], { rice : num(r[1]), wheat : num(r[2]), coarse : num(r[3]), pulses : num(r[5]), foodgrains : num(r[6]) } ]));
const commBy = (t, id) => { const k = commCols(t, id); return new Map(t.filter(r => isYear(r[0])).map(r => [ r[0], { oilseeds : num(r[k.oil]), sugarcane : num(r[k.cane]) } ])); };
const pF = foodBy(t189), pC = commBy(t166, 166), aF = foodBy(t167), aC = commBy(t190, 190), yF = foodBy(t191), yC = commBy(t192, 192);
const CROPS = [ 'rice', 'wheat', 'coarse', 'pulses', 'foodgrains', 'oilseeds', 'sugarcane' ];
const join = (f, c, y) => ({ ...f.get(y), ...c.get(y) });
const LAND = [ ...pF.keys() ].sort((a, b) => startOf(a) - startOf(b)).map(year => ({
    year, output : join(pF, pC, year), area : join(aF, aC, year), yield : join(yF, yC, year),
}));
const land = y => LAND.find(l => l.year === y);
const estMatch = notesOf(t189).match(/Data for (\d{4}-\d{2}) are based on ([A-Za-z ]+?Estimates)/i);
const LAND_STATUS = estMatch ? { year : estMatch[1], status : estMatch[2].trim().toLowerCase() } : null;
check(LAND_STATUS !== null, 'Report 189: the note on the latest year\'s estimates was not found');
check(land('1950-51')?.output.foodgrains === 508 && land('1950-51')?.output.rice === 206 && land('1950-51')?.output.wheat === 65, 'Report 189: 1950-51 should be 508 foodgrains, 206 rice, 65 wheat');
check(land('1950-51')?.output.oilseeds === 52 && land('1950-51')?.output.sugarcane === 571, 'Report 166: 1950-51 should be 52 oilseeds and 571 sugarcane');
check(land('2025-26')?.area.foodgrains === 1423 && land('2025-26')?.yield.wheat === 3591 && land('2025-26')?.yield.pulses === 957, 'Reports 167 and 191: 2025-26 foodgrain area 1423, wheat yield 3591, pulses yield 957');
for (const l of LAND) check(Math.abs(l.output.rice + l.output.wheat + l.output.coarse + l.output.pulses - l.output.foodgrains) <= 3, `Report 189: ${l.year} crops do not add to foodgrains`);
// The comparison the words use ends on the last year whose figures are final, not on the advance estimates.
const LAND_LAST = LAND.filter(l => l.year !== LAND_STATUS?.year).at(-1).year;
const L0 = land('1950-51'), L1 = land(LAND_LAST);
const GROWTH = { from : L0.year, to : L1.year,
    ...Object.fromEntries([ 'output', 'area', 'yield' ].map(k => [ k, Object.fromEntries(CROPS.map(c => [ c, r2(L1[k][c] / L0[k][c]) ])) ])) };

// ── 2. Which state grows what, then and now (report 193) ─────────────────────────────────────────────────────────

// Blocks of rows, each opened by "N. State" (or All States / Union Territories / All India) in the first cell, years
// down the second. Columns: Rice; Wheat; Coarse Cereals; Pulses; Foodgrains; Oilseeds; Cotton (Lint); Sugarcane; Raw
// Jute & Mesta. Every state is kept, not only the large growers.
const t193 = await grid(reportFile(HANDBOOK, 193));
const h193 = t193.find(r => /State/.test(r[0]) && r[1] === 'Year');
check(h193 && h193.slice(2, 11).join('|') === 'Rice|Wheat|Coarse Cereals|Pulses|Foodgrains|Oilseeds|Cotton (Lint)|Sugarcane|Raw Jute & Mesta', 'Report 193: the crop columns have moved');
const STATE_CROP_KEYS = [ 'rice', 'wheat', 'coarse', 'pulses', 'foodgrains', 'oilseeds', 'cotton', 'sugarcane', 'jute' ];
const stateRows = new Map();   // name → Map(year → { crop : thousand tonnes, cotton in thousand bales })
let current = null;
for (const r of t193) {
    if (r[0] && isYear(r[1])) current = r[0].replace(/^\d+\.\s*/, '').trim();
    if (!current || !isYear(r[1])) continue;
    if (!stateRows.has(current)) stateRows.set(current, new Map());
    if (r.slice(2, 11).every(c => c === '')) continue;   // not yet reported for this year
    stateRows.get(current).set(r[1], Object.fromEntries(STATE_CROP_KEYS.map((k, i) => [ k, num(r[i + 2]) ?? 0 ])));
}
// The table's notes: Chhattisgarh, Jharkhand and Uttarakhand were carved out in 2000-01 and Telangana in 2014-15, and
// the parent's earlier figures cover the undivided state. A comparison with 1980-81 therefore adds each new state back
// to its parent; the latest year is also given state by state as the states are now.
const PARENTS = { Chhattisgarh : 'Madhya Pradesh', Jharkhand : 'Bihar', Uttarakhand : 'Uttar Pradesh', Telangana : 'Andhra Pradesh' };
const UNDIVIDED = { 'Madhya Pradesh' : 'with Chhattisgarh', Bihar : 'with Jharkhand', 'Uttar Pradesh' : 'with Uttarakhand', 'Andhra Pradesh' : 'with Telangana' };
const RENAME = { Orissa : 'Odisha' };
const NOT_STATES = new Set([ 'All States', 'All India' ]);
// The latest years are estimates that leave out the smaller states (2022-23 has no figures for nine of them or for the
// union territories), so "now" is the latest year in which every state and the union territories report: the page
// compares all states, not the large growers alone.
const blocks = [ ...stateRows.keys() ].filter(n => !NOT_STATES.has(n));
const STATE_LATEST = [ ...stateRows.get('All India').keys() ].sort().at(-1);
const STATE_THEN = '1980-81', STATE_NOW = [ ...stateRows.get('All India').keys() ].sort().reverse().find(y => blocks.every(n => stateRows.get(n).has(y)));
const STATE_MISSING_LATEST = blocks.filter(n => !stateRows.get(n).has(STATE_LATEST)).map(n => RENAME[n] ?? n);
check(STATE_NOW === '2020-21', `Report 193: the latest year every state reports is ${STATE_NOW}, the page's words assume 2020-21`);
const STATE_STATUS = (notesOf(t193).match(/Data for (\d{4}-\d{2}) are based on ([a-z ]+?estimates)/i) ?? [])[2]?.toLowerCase() ?? null;   // of STATE_LATEST
const at = (year, merge) => {
    const out = new Map();
    for (const [ raw, years ] of stateRows) {
        if (NOT_STATES.has(raw)) continue;
        const v = years.get(year); if (!v) continue;
        const name = RENAME[raw] ?? raw, key = merge ? PARENTS[name] ?? name : name;
        const acc = out.get(key) ?? Object.fromEntries(STATE_CROP_KEYS.map(k => [ k, 0 ]));
        for (const k of STATE_CROP_KEYS) acc[k] += v[k];
        out.set(key, acc);
    }
    return out;
};
const thenStates = at(STATE_THEN, true), nowMerged = at(STATE_NOW, true), nowStates = at(STATE_NOW, false);
const aiThen = stateRows.get('All India').get(STATE_THEN), aiNow = stateRows.get('All India').get(STATE_NOW);
check(Math.round(aiThen.rice) === 53631 && Math.round(aiNow.rice) === 124368, `Report 193: all-India rice should be 53631 (1980-81) and 124368 (${STATE_NOW}), got ${aiThen.rice}, ${aiNow.rice}`);
// Each crop: every state's (or union-territory group's) output and share of all-India then and now, largest now first.
const STATE_SHIFTS = STATE_CROP_KEYS.map(crop => {
    const names = [ ...new Set([ ...thenStates.keys(), ...nowMerged.keys() ]) ];
    const rows = names.map(name => {
        const t = thenStates.get(name)?.[crop] ?? 0, n = nowMerged.get(name)?.[crop] ?? 0;
        return { name, note : UNDIVIDED[name] ?? null, then : Math.round(t), now : Math.round(n),
            thenShare : r2(aiThen[crop] ? 100 * t / aiThen[crop] : 0), nowShare : r2(aiNow[crop] ? 100 * n / aiNow[crop] : 0) };
    }).filter(r => r.then > 0 || r.now > 0).sort((a, b) => b.nowShare - a.nowShare || b.thenShare - a.thenShare);
    const sumThen = [ ...thenStates.values() ].reduce((s, v) => s + v[crop], 0), sumNow = [ ...nowMerged.values() ].reduce((s, v) => s + v[crop], 0);
    check(Math.abs(sumThen - aiThen[crop]) <= aiThen[crop] * 0.06 + 2 && Math.abs(sumNow - aiNow[crop]) <= aiNow[crop] * 0.06 + 2, `Report 193: ${crop} states sum to ${Math.round(sumThen)} and ${Math.round(sumNow)} against all-India ${aiThen[crop]} and ${aiNow[crop]}`);
    return { crop, allIndiaThen : Math.round(aiThen[crop]), allIndiaNow : Math.round(aiNow[crop]), rows };
});
// Each state as it is now: what it grew in the latest year, and the crop it grows most of as a share of India.
const STATES_NOW = [ ...nowStates.entries() ].map(([ name, v ]) => {
    const shares = Object.fromEntries(STATE_CROP_KEYS.filter(k => k !== 'foodgrains').map(k => [ k, r2(aiNow[k] ? 100 * v[k] / aiNow[k] : 0) ]));
    return { name, output : Object.fromEntries(STATE_CROP_KEYS.map(k => [ k, Math.round(v[k]) ])), shares };
}).filter(s => STATE_CROP_KEYS.some(k => s.output[k] > 0)).sort((a, b) => a.name.localeCompare(b.name));
const sh = (crop, name) => STATE_SHIFTS.find(s => s.crop === crop).rows.find(r => r.name === name);
check(STATES_NOW.length >= 29, `Report 193: expected every state and the union territories, got ${STATES_NOW.length}`);
check(sh('wheat', 'Uttar Pradesh')?.thenShare === 36.86 && sh('rice', 'Punjab')?.thenShare === 6.01, `Report 193: Uttar Pradesh wheat 1980-81 36.86% and Punjab rice 6.01%, got ${sh('wheat', 'Uttar Pradesh')?.thenShare}, ${sh('rice', 'Punjab')?.thenShare}`);

// ── 3. What the government buys and gives out (report 169) ───────────────────────────────────────────────────────

// Year; procurement rice, wheat, total; off-take rice, wheat, total; stocks rice, wheat, total. The latest row is a
// part year (its note says so) and is left out; so are the earliest stock figures, which DBIE prints in thousand
// tonnes before 1972-73 without a note.
const t169 = await grid(reportFile(HANDBOOK, 169));
check(t169.some(r => r[0] === 'Year' && r[1] === 'Procurement' && r[4] === 'Off-take' && r[7] === 'Stocks'), 'Report 169: the column groups have moved');
const PART_YEAR = (notesOf(t169).match(/Procurement for (\d{4}-\d{2}) relate/i) ?? [])[1] ?? null;
check(PART_YEAR !== null, 'Report 169: the part-year note was not found');
const PDS = t169.filter(r => isYear(r[0]) && r[0] !== PART_YEAR && startOf(r[0]) >= 1972).map(r => ({
    year : r[0], procRice : num(r[1]), procWheat : num(r[2]), proc : num(r[3]), offRice : num(r[4]), offWheat : num(r[5]), off : num(r[6]),
    stockRice : num(r[7]), stockWheat : num(r[8]), stock : num(r[9]),
})).sort((a, b) => startOf(a.year) - startOf(b.year));
check(PDS[0].year === '1972-73' && PDS[0].proc === 77.1 && PDS[0].off === 109.3, `Report 169: 1972-73 should be 77.1 procured and 109.3 off-take, got ${PDS[0].proc}, ${PDS[0].off}`);
for (const p of PDS) check(p.proc != null && p.off != null && p.stock != null, `Report 169: ${p.year} has a gap`);
// How much of the harvest the government buys, over the last five full years. Rice is bought in the marketing year
// that has the harvest's crop-year label; wheat, sown in winter, in the marketing year after (the 2023-24 crop is
// bought in 2024-25). The ratio is therefore rough, and the words say "about".
const lastFive = PDS.filter(p => startOf(p.year) <= startOf(LAND_LAST)).slice(-5);   // only years whose harvest is final
const PROC_SHARE = {
    from : lastFive[0].year, to : lastFive.at(-1).year,
    rice : r1(100 * avg(lastFive.map(p => p.procRice / (land(p.year)?.output.rice ?? NaN)))),
    wheat : r1(100 * avg(lastFive.map(p => p.procWheat / (land(yearOf(startOf(p.year) - 1))?.output.wheat ?? NaN)))),
};
check(PROC_SHARE.rice > 20 && PROC_SHARE.rice < 60 && PROC_SHARE.wheat > 15 && PROC_SHARE.wheat < 60, `Report 169 against 189: the shares bought look wrong, rice ${PROC_SHARE.rice}%, wheat ${PROC_SHARE.wheat}%`);

// ── 4. Minimum support prices (reports 194 and 195) and farm families' everyday costs (CPI_AG_RN) ─────────────────

const t194 = await grid(reportFile(HANDBOOK, 194)), t195 = await grid(reportFile(HANDBOOK, 195));
check(/Rupees per Quintal/i.test(t194.flat().join(' ')) && /Rupees per Quintal/i.test(t195.flat().join(' ')), 'Reports 194 and 195: the unit is no longer ₹ per quintal');
const h194 = t194.find(r => r[0] === 'Year'), h195 = t195.find(r => r[0] === 'Year');
// Every crop DBIE gives a support price for, under a plain name; the two soyabean grades are one crop, and the story
// uses yellow, the grade priced in every year since it was split.
const MSP_NAMES = {
    'Paddy common' : [ 'paddy', 'Paddy (common)' ], 'Maize' : [ 'maize', 'Maize' ], 'Wheat' : [ 'wheat', 'Wheat' ],
    'Gram' : [ 'gram', 'Gram (chana)' ], 'Arhar(Tur)' : [ 'arhar', 'Arhar (tur dal)' ], 'Moong' : [ 'moong', 'Moong' ], 'Urad' : [ 'urad', 'Urad' ],
    'Sugarcane' : [ 'sugarcane', 'Sugarcane' ], 'Cotton' : [ 'cotton', 'Cotton' ], 'Jute' : [ 'jute', 'Jute' ],
    'Groundnut (in shell)' : [ 'groundnut', 'Groundnut' ], 'Soyabean yellow' : [ 'soyabean', 'Soyabean' ],
    'Sunflower seed' : [ 'sunflower', 'Sunflower seed' ], 'Rapeseed / Mustard' : [ 'mustard', 'Mustard' ], 'Safflower' : [ 'safflower', 'Safflower' ],
};
const mspCols = [ ...[ ...h194.entries() ].map(([ i, c ]) => [ t194, i, c ]), ...[ ...h195.entries() ].map(([ i, c ]) => [ t195, i, c ]) ].filter(([ , , c ]) => MSP_NAMES[c]);
check(mspCols.length === 15, `Reports 194 and 195: expected 15 crops, got ${mspCols.length}`);
const MSP_CROPS = mspCols.map(([ , , c ]) => ({ key : MSP_NAMES[c][0], name : MSP_NAMES[c][1] }));
const mspYears = [ ...new Set(t194.filter(r => isYear(r[0])).map(r => r[0])) ].sort();
const rowsBy = t => new Map(t.filter(r => isYear(r[0])).map(r => [ r[0], r ]));
const r194 = rowsBy(t194), r195 = rowsBy(t195);
const MSP = mspYears.map(year => ({ year, ...Object.fromEntries(mspCols.map(([ t, i, c ]) => [ MSP_NAMES[c][0], num((t === t194 ? r194 : r195).get(year)?.[i]) ])) }));
const msp = y => MSP.find(m => m.year === y);
check(msp('1975-76')?.paddy === 74 && msp('1975-76')?.wheat === 105, `Report 194: 1975-76 paddy and wheat should be 74 and 105, got ${msp('1975-76')?.paddy}, ${msp('1975-76')?.wheat}`);
check(msp('2013-14')?.paddy === 1310 && msp('2024-25')?.paddy === 2300, `Report 194: paddy should be 1310 (2013-14) and 2300 (2024-25), got ${msp('2013-14')?.paddy}, ${msp('2024-25')?.paddy}`);
// The farm workers' price index, base 1986-87, averaged over each financial year in which it has all twelve months.
const fyOf = d => { const y = +d.slice(0, 4), m = +d.slice(5, 7); return yearOf(m >= 4 ? y : y - 1); };
const cpi = readSdmxCsv(path.join(PRICES, 'cpi-agricultural-labourer.csv'));
const ci = n => cpi.header.indexOf(n);
const cpiFy = {};
for (const f of cpi.data) if (f[ci('BASE_PER')] === 'BY_1986-87' && f[ci('COMD_ITEM')] === 'CO_GIAG') (cpiFy[fyOf(f[ci('TIME_PERIOD')])] ??= []).push(num(f[ci('OBS_VALUE')]));
const COSTS = Object.keys(cpiFy).filter(y => cpiFy[y].length === 12).sort().map(year => ({ year, index : r1(avg(cpiFy[year])) }));
const cost = y => COSTS.find(c => c.year === y)?.index;
check(COSTS[0].year === '1996-97' && cost('2014-15') === 799.5 && cost('2024-25') === 1299.1, `CPI_AG_RN: full years from 1996-97, 2014-15 799.5 and 2024-25 1299.1, got ${COSTS[0].year}, ${cost('2014-15')}, ${cost('2024-25')}`);
// A day's pay for a general farm labourer (WAGE_RATES_RN, men, all-India), averaged over each financial year with at
// least ten monthly readings, exactly as "The women who stayed" computes it.
const wr = readSdmxCsv(path.join(PRICES, 'wage-rates.csv'));
const wi = n => wr.header.indexOf(n);
const wageFy = {};
for (const f of wr.data) if (f[wi('STATE_CODE')] === 'ALL_INDIA' && f[wi('TYP_AAA_RN')] === 'WR13') (wageFy[fyOf(f[wi('TIME_PERIOD')])] ??= []).push(num(f[wi('OBS_VALUE')]));
const FARM_WAGE = Object.fromEntries(Object.keys(wageFy).filter(y => y >= '2014-15' && wageFy[y].length >= 10).sort().map(y => [ y, r1(avg(wageFy[y])) ]));
// The comparison uses the same ten years as "The women who stayed" (its full wage years), so the two stories never
// give different figures for how much a farm family's costs or a farm day's pay rose.
const M0 = Object.keys(FARM_WAGE)[0], M1 = Object.keys(FARM_WAGE).at(-1);
check(M0 === '2014-15' && M1 === '2024-25', `WAGE_RATES_RN: the full wage years should run 2014-15 to 2024-25, got ${M0} to ${M1}`);
const sister = JSON.parse(fs.readFileSync(path.join(__dirname, 'oracles/story-the-women-who-stayed.json'), 'utf8'));
check(sister.CPI_AL[M0] === cost(M0) && sister.CPI_AL[M1] === cost(M1), `CPI_AG_RN: differs from "The women who stayed" (${sister.CPI_AL[M0]}, ${sister.CPI_AL[M1]} against ${cost(M0)}, ${cost(M1)})`);
const sw0 = sister.WAGES.find(w => w.year === M0)?.farm, sw1 = sister.WAGES.find(w => w.year === M1)?.farm;
check(sw0 === FARM_WAGE[M0] && sw1 === FARM_WAGE[M1], `WAGE_RATES_RN: the farm wage differs from "The women who stayed" (${sw0}, ${sw1} against ${FARM_WAGE[M0]}, ${FARM_WAGE[M1]})`);
// Each crop's support price, the farm wage and everyday costs over those years: how many times each rose. The story
// says what the figures show, not whether a price is enough.
const MSP_VS_COSTS = { from : M0, to : M1, costs : r2(cost(M1) / cost(M0)), wage : r2(FARM_WAGE[M1] / FARM_WAGE[M0]),
    wageFrom : FARM_WAGE[M0], wageTo : FARM_WAGE[M1], costsFrom : cost(M0), costsTo : cost(M1),
    crops : MSP_CROPS.map(({ key, name }) => {
        const a = msp(M0)?.[key], b = msp(M1)?.[key];
        return { key, name, from : a ?? null, to : b ?? null, times : a && b ? r2(b / a) : null };
    }).filter(c => c.times != null).sort((a, b) => b.times - a.times) };
check(MSP_VS_COSTS.crops.length === 15, `Reports 194/195: every crop should be priced in both ${M0} and ${M1}, got ${MSP_VS_COSTS.crops.length}`);
const COSTS_IN = COSTS.filter(c => c.year >= M0 && c.year <= M1);

// ── 5. Money out and money in: farm trade (reports 207 and 297, US dollars) ──────────────────────────────────────

async function tradeGrid(id, suffix) {
    const g = await grid(reportFile(HANDBOOK, id, suffix));
    check(/US \$ Millions/i.test(g.flat().join(' ')), `Report ${id}${suffix}: the unit is no longer US$ million`);
    return { g, h : g.find(r => /^Year/i.test(r[0])) };
}
const ex = await tradeGrid(207, '--new-items'), im = await tradeGrid(297, '--new-items');
const exOld = await tradeGrid(207, '--old-items'), imOld = await tradeGrid(297, '--old-items');
// The farm items in DBIE's current list, under plain names. Fertilisers are a farm input, not food, and are kept apart.
const FARM_EXPORTS = [ [ '1. Tea', 'tea', 'Tea' ], [ '2. Coffee', 'coffee', 'Coffee' ], [ '3. Rice', 'rice', 'Rice' ], [ '4. Other cereals', 'cereals', 'Other cereals' ],
    [ '5. Tobacco', 'tobacco', 'Tobacco' ], [ '6. Spices', 'spices', 'Spices' ], [ '7. Cashew', 'cashew', 'Cashew' ], [ '8. Oil Meals', 'oilmeals', 'Oil meals (cattle feed)' ],
    [ '9. Oil seeds', 'oilseeds', 'Oilseeds' ], [ '10. Fruits & Vegetables', 'fruitveg', 'Fruit and vegetables' ],
    [ '11. Cereal preparations & miscellaneous processed items', 'processed', 'Processed foods' ], [ '12. Marine Products', 'marine', 'Fish and seafood' ],
    [ '13. Meat, dairy & poultry products', 'meat', 'Meat, dairy and poultry' ] ];
const FARM_IMPORTS = [ [ '1. Cotton Raw & Waste', 'cotton', 'Raw cotton' ], [ '2. Vegetable Oil', 'oil', 'Cooking oil (vegetable oil)' ],
    [ '3. Pulses', 'pulses', 'Pulses (dal)' ], [ '4. Fruits & vegetables', 'fruitveg', 'Fruit and vegetables' ] ];
const readItems = ({ g, h }, items, total) => {
    const idx = items.map(([ label, key ]) => [ key, colOf(h, label, 'trade') ]), it = colOf(h, total, 'trade');
    return g.filter(r => isYear(r[0])).map(r => ({ year : r[0], total : num(r[it]), ...Object.fromEntries(idx.map(([ k, i ]) => [ k, num(r[i]) ])) }))
        .sort((a, b) => startOf(a.year) - startOf(b.year));
};
const EXPORTS = readItems(ex, FARM_EXPORTS, 'Total Exports'), IMPORTS = readItems(im, FARM_IMPORTS, 'Total Imports');
const fertCol = colOf(im.h, '7. Fertilisers, Crude & manufactured', '297');
const FERTILISER = im.g.filter(r => isYear(r[0])).map(r => ({ year : r[0], usd : num(r[fertCol]) })).sort((a, b) => startOf(a.year) - startOf(b.year));
const farmSum = (row, items) => items.reduce((s, [ , k ]) => s + (row[k] ?? 0), 0);
const TRADE_YEARS = EXPORTS.map(e => {
    const i = IMPORTS.find(x => x.year === e.year), f = FERTILISER.find(x => x.year === e.year);
    return { year : e.year, farmExports : Math.round(farmSum(e, FARM_EXPORTS)), farmImports : Math.round(farmSum(i, FARM_IMPORTS)), fertiliser : f?.usd ?? null, allExports : e.total, allImports : i.total };
});
const tx = y => EXPORTS.find(e => e.year === y), tm = y => IMPORTS.find(i => i.year === y);
check(tx('2025-26')?.rice === 11537 && tm('2025-26')?.oil === 19488 && tm('2025-26')?.pulses === 3573, `Reports 207/297: 2025-26 rice exports 11537, oil imports 19488, pulses 3573, got ${tx('2025-26')?.rice}, ${tm('2025-26')?.oil}, ${tm('2025-26')?.pulses}`);
check(tx('2009-10')?.rice === 2372 && tm('2009-10')?.oil === 4704, 'Reports 207/297: 2009-10 rice exports 2372 and oil imports 4704');
// The long view of rice sold and cooking oil and pulses bought, from 1987-88: the old item list before 2009-10, where
// DBIE's current list starts. "Edible oils" (old) and "vegetable oil" (new) are not quite the same heading.
const oldItems = (t, cols) => { const idx = Object.fromEntries(Object.entries(cols).map(([ k, l ]) => [ k, colOf(t.h, l, 'trade old') ])); return new Map(t.g.filter(r => isYear(r[0])).map(r => [ r[0], Object.fromEntries(Object.entries(idx).map(([ k, i ]) => [ k, num(r[i]) ])) ])); };
const eO = oldItems(exOld, { rice : '3. Rice' }), iO = oldItems(imOld, { oil : '2. Edible Oils', pulses : '3. Pulses' });
const LONG_TRADE = [ ...new Set([ ...eO.keys(), ...EXPORTS.map(e => e.year) ]) ].sort((a, b) => startOf(a) - startOf(b)).map(year => ({
    year, rice : tx(year)?.rice ?? eO.get(year)?.rice ?? null, oil : tm(year)?.oil ?? iO.get(year)?.oil ?? null, pulses : tm(year)?.pulses ?? iO.get(year)?.pulses ?? null,
    series : tx(year) ? 'new' : 'old',
}));
check(LONG_TRADE.find(t => t.year === '1990-91')?.rice === 257 && LONG_TRADE.find(t => t.year === '1990-91')?.oil === 182, 'Reports 207/297: 1990-91 rice exports 257 and edible oil imports 182');
const tradeNote = notesOf(ex.g) + ' ' + notesOf(im.g);
const TRADE_PROVISIONAL = (tradeNote.match(/Data for (\d{4}-\d{2}) (?:are|is) provisional/i) ?? [])[1] ?? null;

fatal();

// ── the derived figures the words use ─────────────────────────────────────────────────────────────────────────────

const T1 = EXPORTS.at(-1).year, T0 = EXPORTS[0].year, ty = TRADE_YEARS.at(-1);
const HEADLINE = {
    tradeYear : T1, tradeFirst : T0,
    riceExports : tx(T1).rice, oilImports : tm(T1).oil, pulsesImports : tm(T1).pulses,
    oilImportsFirst : tm(T0).oil, farmExports : ty.farmExports, farmImports : ty.farmImports, fertiliser : ty.fertiliser,
    // the years since cooking oil bought abroad first cost more than rice sold abroad, without a break
    oilAheadSince : (() => { let k = LONG_TRADE.length - 1; while (k > 0 && LONG_TRADE[k - 1].oil > LONG_TRADE[k - 1].rice) k--; return LONG_TRADE[k].year; })(),
};

const DATA = {
    LAND, LAND_STATUS, LAND_LAST, GROWTH,
    STATE_THEN, STATE_NOW, STATE_LATEST, STATE_MISSING_LATEST, STATE_STATUS, STATE_SHIFTS, STATES_NOW, STATE_CROP_KEYS,
    PDS, PDS_PART_YEAR : PART_YEAR, PROC_SHARE,
    MSP, MSP_CROPS, MSP_VS_COSTS, COSTS : COSTS_IN, FARM_WAGE,
    EXPORTS, IMPORTS, FERTILISER, TRADE_YEARS, LONG_TRADE, TRADE_PROVISIONAL,
    FARM_EXPORTS : FARM_EXPORTS.map(([ , k, n ]) => ({ key : k, name : n })), FARM_IMPORTS : FARM_IMPORTS.map(([ , k, n ]) => ({ key : k, name : n })),
    HEADLINE,
};

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(DATA, null, 2));

// ── the module ────────────────────────────────────────────────────────────────────────────────────────────────────

const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit by hand; regenerate via pnpm data:build`,
    '// Sources: DBIE, as scraped — Handbook reports 166, 167, 169, 189, 190, 191, 192, 193, 194, 195, 207 and 297; SDMX',
    '// series CPI_AG_RN and WAGE_RATES_RN. Production in lakh tonnes (states in thousand tonnes; cotton in bales), area in lakh hectares,',
    '// yield in kg a hectare, support prices in ₹ a quintal, trade in US$ million.',
    '',
    'export type CropKey = "rice" | "wheat" | "coarse" | "pulses" | "foodgrains" | "oilseeds" | "sugarcane";',
    'export interface LandYear { year : string; output : Record<CropKey, number>; area : Record<CropKey, number>; yield : Record<CropKey, number>; }',
    `export const LAND : LandYear[] = ${ts(LAND)};`,
    `export const LAND_STATUS = ${ts(LAND_STATUS)};`,
    `export const LAND_LAST = ${ts(LAND_LAST)};`,
    '// Each crop\'s output, area and yield in LAND_LAST as a multiple of 1950-51.',
    `export const GROWTH = ${ts(GROWTH)};`,
    '',
    '// Report 193: every state\'s output and share of all-India, then and now; states carved out since 1980-81 are added',
    '// back to their parents for the comparison. STATES_NOW gives the latest year as the states are now.',
    'export type StateCropKey = "rice" | "wheat" | "coarse" | "pulses" | "foodgrains" | "oilseeds" | "cotton" | "sugarcane" | "jute";',
    'export interface StateShiftRow { name : string; note : string | null; then : number; now : number; thenShare : number; nowShare : number; }',
    'export interface StateShift { crop : StateCropKey; allIndiaThen : number; allIndiaNow : number; rows : StateShiftRow[]; }',
    `export const STATE_SHIFTS : StateShift[] = ${ts(STATE_SHIFTS)};`,
    'export interface StateNow { name : string; output : Record<StateCropKey, number>; shares : Record<Exclude<StateCropKey, "foodgrains">, number>; }',
    `export const STATES_NOW : StateNow[] = ${ts(STATES_NOW)};`,
    `export const STATE_THEN = ${ts(STATE_THEN)}, STATE_NOW = ${ts(STATE_NOW)};`,
    `export const STATE_STATUS : string | null = ${ts(STATE_STATUS)};`,
    '// The table\'s latest year, and the states it has no figures for yet (why STATE_NOW is earlier).',
    `export const STATE_LATEST = ${ts(STATE_LATEST)};`,
    `export const STATE_MISSING_LATEST : string[] = ${ts(STATE_MISSING_LATEST)};`,
    '',
    '// Report 169: rice and wheat the government bought (procurement), issued (off-take) and held (stocks), lakh tonnes.',
    'export interface PdsYear { year : string; procRice : number; procWheat : number; proc : number; offRice : number; offWheat : number; off : number; stockRice : number; stockWheat : number; stock : number; }',
    `export const PDS : PdsYear[] = ${ts(PDS)};`,
    `export const PDS_PART_YEAR : string | null = ${ts(PART_YEAR)};`,
    '// About how much of the harvest the government bought, per cent, averaged over the last five full years.',
    `export const PROC_SHARE = ${ts(PROC_SHARE)};`,
    '',
    '// Reports 194 and 195: minimum support prices, ₹ a quintal, every crop DBIE prices.',
    `export const MSP_CROPS = ${ts(MSP_CROPS)};`,
    `export const MSP : ({ year : string } & Record<string, number | null | string>)[] = ${ts(MSP)};`,
    '// Each crop\'s support price and farm families\' everyday costs (CPI_AG_RN), as multiples of the first year both exist.',
    `export const MSP_VS_COSTS = ${ts(MSP_VS_COSTS)};`,
    'export interface CostYear { year : string; index : number; }',
    `export const COSTS : CostYear[] = ${ts(COSTS_IN)};`,
    '// WAGE_RATES_RN: a day\'s pay for a general farm labourer (men, all-India), ₹, financial-year averages.',
    `export const FARM_WAGE : Record<string, number> = ${ts(FARM_WAGE)};`,
    '',
    '// Reports 207 and 297, US$ million, DBIE\'s current item list from 2009-10: farm exports and imports by item, and',
    '// fertiliser imports (a farm input) apart.',
    `export const FARM_EXPORTS = ${ts(DATA.FARM_EXPORTS)};`,
    `export const FARM_IMPORTS = ${ts(DATA.FARM_IMPORTS)};`,
    `export const EXPORTS : ({ year : string; total : number } & Record<string, number | string>)[] = ${ts(EXPORTS)};`,
    `export const IMPORTS : ({ year : string; total : number } & Record<string, number | string>)[] = ${ts(IMPORTS)};`,
    '// Fertiliser imports (a farm input, not food), US$ million.',
    `export const FERTILISER : { year : string; usd : number | null }[] = ${ts(FERTILISER)};`,
    'export interface TradeYear { year : string; farmExports : number; farmImports : number; fertiliser : number | null; allExports : number; allImports : number; }',
    `export const TRADE_YEARS : TradeYear[] = ${ts(TRADE_YEARS)};`,
    '// Rice sold abroad against cooking oil and pulses bought, from 1987-88 (the old item list before 2009-10).',
    'export interface LongTradeYear { year : string; rice : number | null; oil : number | null; pulses : number | null; series : "old" | "new"; }',
    `export const LONG_TRADE : LongTradeYear[] = ${ts(LONG_TRADE)};`,
    `export const TRADE_PROVISIONAL : string | null = ${ts(TRADE_PROVISIONAL)};`,
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => v == null ? '' : (typeof v === 'string' && /[",\n]/.test(v)) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'production-area-yield.csv'), `# DBIE, Handbook reports 189, 166, 167, 190, 191 and 192; output lakh tonnes, area lakh hectares, yield kg a hectare; ${LAND_STATUS.year} is ${LAND_STATUS.status}\n` + csv(
    [ 'year', ...CROPS.map(c => `output_${c}`), ...CROPS.map(c => `area_${c}`), ...CROPS.map(c => `yield_${c}`) ],
    LAND.map(l => [ l.year, ...CROPS.map(c => l.output[c]), ...CROPS.map(c => l.area[c]), ...CROPS.map(c => l.yield[c]) ])));
fs.writeFileSync(path.join(pubDir, 'state-crops-then-and-now.csv'), `# DBIE, Handbook report 193; thousand tonnes (cotton thousand bales) and per cent of all-India; states carved out since 1980-81 added back to their parents\n` + csv(
    [ 'crop', 'state', 'note', `output_${STATE_THEN}`, `output_${STATE_NOW}`, `share_${STATE_THEN}_pct`, `share_${STATE_NOW}_pct` ],
    STATE_SHIFTS.flatMap(c => c.rows.map(r => [ c.crop, r.name, r.note ?? '', r.then, r.now, r.thenShare, r.nowShare ]))));
fs.writeFileSync(path.join(pubDir, 'procurement-offtake-stocks.csv'), '# DBIE, Handbook report 169, rice and wheat, lakh tonnes\n' + csv(
    [ 'year', 'procurement_rice', 'procurement_wheat', 'procurement_total', 'offtake_rice', 'offtake_wheat', 'offtake_total', 'stocks_rice', 'stocks_wheat', 'stocks_total' ],
    PDS.map(p => [ p.year, p.procRice, p.procWheat, p.proc, p.offRice, p.offWheat, p.off, p.stockRice, p.stockWheat, p.stock ])));
fs.writeFileSync(path.join(pubDir, 'minimum-support-prices.csv'), '# DBIE, Handbook reports 194 and 195, ₹ a quintal\n' + csv(
    [ 'year', ...MSP_CROPS.map(c => c.key) ], MSP.map(m => [ m.year, ...MSP_CROPS.map(c => m[c.key]) ])));
fs.writeFileSync(path.join(pubDir, 'farm-trade-usd.csv'), `# DBIE, Handbook reports 207 and 297, US$ million; ${TRADE_PROVISIONAL ?? ''} provisional\n` + csv(
    [ 'year', ...FARM_EXPORTS.map(([ , k ]) => `export_${k}`), ...FARM_IMPORTS.map(([ , k ]) => `import_${k}`), 'import_fertiliser', 'all_exports', 'all_imports' ],
    EXPORTS.map(e => { const i = IMPORTS.find(x => x.year === e.year), f = FERTILISER.find(x => x.year === e.year);
        return [ e.year, ...FARM_EXPORTS.map(([ , k ]) => e[k]), ...FARM_IMPORTS.map(([ , k ]) => i?.[k]), f?.usd, e.total, i?.total ]; })));

console.log(`${NAME}: ${LAND.length} crop years, ${STATES_NOW.length} states and territories, ${PDS.length} procurement years, ${MSP_CROPS.length} support-price crops, ${EXPORTS.length} trade years; self-check passed`);
console.log(`  wrote out/${NAME}.json, src/app/stories/${SLUG}/data.gen.ts and 5 CSVs under public/stories/${SLUG}/`);
