// The figures for the story "Cash didn't die" (src/app/stories/cash-didnt-die), from the scraped DBIE files
// (data/sdmx/** and data/reports/**, restored by `pnpm data:fetch`), read with the parsers the database loader uses.
//
//   payment system indicators, new format (report 612)   monthly from November 2019: UPI, card payments, cash
//                                                        withdrawals at ATMs and at micro-ATMs (village banking agents)
//   RMC_M_RN    reserve money components, monthly      currency in circulation (COM11), from 1991
//   RMC_W_RN    reserve money components, weekly       currency in circulation (COM11), Fridays, from 2001
//   AMAGG_RN    average monetary aggregates, yearly    currency with the public (CMS1101101), financial-year average
//   MACRO_ECN_AGG_RN  macro-economic aggregates        nominal GDP, 2011-12 base (NII_GDP, current prices)
//   MONTRY_RATIOS_RN  monetary ratios                  GDP ÷ currency with the public as the Reserve Bank prints it,
//                                                       read only to check the ratio computed here
//
// Four inputs are not on DBIE: data/sources/banknotes-by-denomination.json, the banknotes in circulation by denomination
// from the Reserve Bank's Annual Reports, used when present; and data/sources/upi-users.json, the unique UPI users at
// the few dates official documents give them (PIB, RBI, Parliament), interpolated month by month.
// data/sources/festival-dates.json holds the gazetted dates of Diwali and Dussehra, for the festive weeks.
// A fourth, data/sources/cash-events.json, is the official record of what changed around each series (RBI and Government
// of India documents), marked on the story's steps.
//
// Writes data/processors/out/story-cash-didnt-die.json (the oracle), src/app/stories/cash-didnt-die/data.gen.ts and
// the downloads under public/stories/cash-didnt-die/. It fails, writing nothing, if a check does not hold.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows, readSdmxCsv } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-cash-didnt-die';
const SLUG      = 'cash-didnt-die';

const PAYMENTS  = path.join(REPO, 'data/reports/indicators/financial-sector-indicators/payment-system-indicators/612--payment-system-indicators--new-format.csv');
const MONETARY  = path.join(REPO, 'data/sdmx/financial-sector/monetary-statistics');
const GDP_FILE  = path.join(REPO, 'data/sdmx/real-sector/national-income/macro-economic-aggregates.csv');
const NOTES     = path.join(REPO, 'data/sources/banknotes-by-denomination.json');
const USERS_SRC = path.join(REPO, 'data/sources/upi-users.json');
const EVENTS_SRC = path.join(REPO, 'data/sources/cash-events.json');
const FEST_SRC = path.join(REPO, 'data/sources/festival-dates.json');

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };
const num = s => { const t = String(s ?? '').replace(/,/g, '').trim(); if (t === '' || t === '-') return null; const v = Number(t); return Number.isFinite(v) ? v : null; };
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const objects = file => { const { header, data } = readSdmxCsv(file); return data.map(f => Object.fromEntries(header.map((h, i) => [ h, f[i] ]))); };
const ym = d => d.slice(0, 7);
const fyOf = d => { const y = +d.slice(0, 4), m = +d.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };

// ── payments, monthly ─────────────────────────────────────────────────────────────────────────────────────────────
// The table's sixth row names each column pair (volume in lakh, value in ₹ crore); its rows are months, "Nov-2019".

const MON = { Jan : 1, Feb : 2, Mar : 3, Apr : 4, May : 5, Jun : 6, Jul : 7, Aug : 8, Sep : 9, Oct : 10, Nov : 11, Dec : 12 };
const grid = [];
await csvRows(PAYMENTS, { onRow : cells => grid.push(cells.map(c => c.trim())) });
const labels = grid[5], units = grid[6];
check(/Volume/.test(units?.[1] ?? '') && /Value/.test(units?.[2] ?? ''), 'payments: the unit row is not where it was');
// the volume column of the item whose label matches; its value column is the next
const col = re => {
    let cur = '';
    for (let i = 1; i < labels.length; i++) { if (labels[i]) cur = labels[i]; if (re.test(cur) && /Volume/.test(units[i])) return i; }
    errors.push(`payments: no column for ${re}`); return -1;
};
const COLS = {
    upi    : col(/^2\.7 UPI/),
    cards  : col(/^4 Card Payments/),
    debit  : col(/^4\.2 Debit Cards/),
    atm    : col(/^3 Cash Withdrawal at ATMs/),
    micro  : col(/^5\s+Cash With[a-z]*al at Micro ATMs/),
};
fatal();
const payRows = grid.filter(r => /^[A-Z][a-z]{2}-\d{4}$/.test(r[0]))
    .map(r => ({ month : `${r[0].slice(4)}-${String(MON[r[0].slice(0, 3)]).padStart(2, '0')}`, r }))
    .sort((a, b) => a.month.localeCompare(b.month));
const PAY_MONTHS = payRows.map(p => p.month);
check(PAY_MONTHS[0] === '2019-11', `payments: first month ${PAY_MONTHS[0]}, expected 2019-11`);
for (let i = 1; i < PAY_MONTHS.length; i++) {
    const [ y0, m0 ] = PAY_MONTHS[i - 1].split('-').map(Number), [ y1, m1 ] = PAY_MONTHS[i].split('-').map(Number);
    check((y1 - y0) * 12 + (m1 - m0) === 1, `payments: a gap between ${PAY_MONTHS[i - 1]} and ${PAY_MONTHS[i]}`);
}
// volumes in crore (the table's lakh ÷ 100), values in ₹ crore
const series = c => ({ volume : payRows.map(p => r2(num(p.r[c]) / 100)), value : payRows.map(p => Math.round(num(p.r[c + 1]))) });
const PAY = Object.fromEntries(Object.entries(COLS).map(([ k, c ]) => [ k, series(c) ]));
for (const [ k, s ] of Object.entries(PAY)) check(s.volume.every(v => Number.isFinite(v) && v >= 0) && s.value.every(v => Number.isFinite(v)), `payments: ${k} has a missing month`);
// The machines, in lakh: ATMs (bank-owned and white-label) and micro-ATMs (with village banking agents).
const MCOLS = { atm : col(/^3 Number of ATMs/), micro : col(/^4\s+Number of Micro ATMs/) };
fatal();
const MACHINES = Object.fromEntries(Object.entries(MCOLS).map(([ k, c ]) => [ k, payRows.map(p => r2(num(p.r[c]))) ]));
for (const [ k, s ] of Object.entries(MACHINES)) check(s.every(v => Number.isFinite(v) && v > 0), `machines: ${k} has a missing month`);
fatal();

// ── cash, monthly and yearly ──────────────────────────────────────────────────────────────────────────────────────

const cicRows = objects(path.join(MONETARY, 'reserve-money-components-monthly.csv')).filter(r => r.COMP_RN === 'COM11');
const CIC_MONTHS = cicRows.map(r => ym(r.TIME_PERIOD)).sort();
const cicBy = new Map(cicRows.map(r => [ ym(r.TIME_PERIOD), num(r.OBS_VALUE) / 1e7 ]));      // ₹ crore
const CIC = CIC_MONTHS.map(m => Math.round(cicBy.get(m)));
check(CIC_MONTHS[0] <= '1991-04' && CIC_MONTHS.length > 400, `cash: monthly series from ${CIC_MONTHS[0]}, ${CIC_MONTHS.length} months`);

const cwpRows = objects(path.join(MONETARY, 'average-monetary-aggregates.csv')).filter(r => r.COM_MS_RN === 'CMS1101101');
const cwpBy = new Map(cwpRows.map(r => [ fyOf(r.TIME_PERIOD), num(r.OBS_VALUE) / 1e7 ]));

const gdpRows = objects(GDP_FILE).filter(r => r.NAT_INC_INDC_RN === 'NII_GDP' && r.PRC_TYP_RN === 'CURR_PRC' && r.BASE_PER === 'BY_2011_12');
const gdpBy = new Map(gdpRows.map(r => [ fyOf(r.TIME_PERIOD), num(r.OBS_VALUE) / 1e7 ]));
check(gdpBy.size > 70, `GDP: only ${gdpBy.size} years on the 2011-12 base`);

// The tide: currency with the public (financial-year average) as a share of nominal GDP, every year both carry.
const TIDE_FYS = [ ...cwpBy.keys() ].filter(fy => gdpBy.has(fy)).sort();
const TIDE = TIDE_FYS.map(fy => r2(100 * cwpBy.get(fy) / gdpBy.get(fy)));
// Check against the Reserve Bank's own ratio (RO9, GDP ÷ currency with the public, by financial year): the same
// currency series, so where the printed ratio is on the 2011-12 base too, its inverse agrees with the share computed
// here. Counted over the years from 2011-12, where both are on that base.
const ro9 = new Map(objects(path.join(MONETARY, 'monetary-ratios.csv')).filter(r => r.RATIOS_RN === 'RO9').map(r => [ fyOf(r.TIME_PERIOD), num(r.OBS_VALUE) ]));
let ratioAgree = 0, ratioYears = 0;
for (const fy of TIDE_FYS.filter(fy => fy >= '2011-12' && ro9.has(fy))) {
    ratioYears++;
    if (Math.abs(100 / ro9.get(fy) - TIDE[TIDE_FYS.indexOf(fy)]) < 0.15) ratioAgree++;
}
check(ratioYears >= 10 && ratioAgree >= ratioYears - 1, `tide: the Reserve Bank's ratio agrees in only ${ratioAgree} of ${ratioYears} years since 2011-12`);
// End-March currency in circulation over GDP, every year from 1992 (a second, stricter stock measure)
const MARCH = CIC_MONTHS.filter(m => m.endsWith('-03'));
const STOCK = MARCH.filter(m => gdpBy.has(fyOf(m + '-01'))).map(m => ({ fy : fyOf(m + '-01'), cic : Math.round(cicBy.get(m)), share : r2(100 * cicBy.get(m) / gdpBy.get(fyOf(m + '-01'))) }));

check(TIDE_FYS.length > 60, `tide: only ${TIDE_FYS.length} years`);
fatal();

// ── the headline figures ──────────────────────────────────────────────────────────────────────────────────────────

const N = PAY_MONTHS.length, last = N - 1;
const at = (s, m) => s[PAY_MONTHS.indexOf(m)];
const cicAt = m => Math.round(cicBy.get(m));
const tideAt = fy => TIDE[TIDE_FYS.indexOf(fy)];
const tideMin = TIDE_FYS.filter(fy => fy >= '2010-11').reduce((b, fy) => (tideAt(fy) < tideAt(b) ? fy : b), '2016-17');
const tideMax = TIDE_FYS.reduce((b, fy) => (tideAt(fy) > tideAt(b) ? fy : b), TIDE_FYS[0]);
const lastMarch = MARCH[MARCH.length - 1];

const HEADLINE = {
    payFirst : PAY_MONTHS[0], payLast : PAY_MONTHS[last],
    upi   : { from : PAY.upi.volume[0], to : PAY.upi.volume[last], times : r1(PAY.upi.volume[last] / PAY.upi.volume[0]) },
    atm   : { from : PAY.atm.volume[0], to : PAY.atm.volume[last], change : r1(100 * (PAY.atm.volume[last] / PAY.atm.volume[0] - 1)) },
    micro : { from : PAY.micro.volume[0], to : PAY.micro.volume[last], times : r1(PAY.micro.volume[last] / PAY.micro.volume[0]) },
    debit : { from : PAY.debit.volume[0], to : PAY.debit.volume[last] },
    // the average ATM withdrawal, ₹, first and latest month
    atmTicket : { from : Math.round(1e7 * PAY.atm.value[0] / (PAY.atm.volume[0] * 1e7)), to : Math.round(1e7 * PAY.atm.value[last] / (PAY.atm.volume[last] * 1e7)) },
    cash : { march2016 : cicAt('2016-03'), lastMarch, last : cicAt(lastMarch), cicLast : CIC_MONTHS[CIC_MONTHS.length - 1], cicLastValue : CIC[CIC.length - 1] },
    tide : { first : TIDE_FYS[0], last : TIDE_FYS[TIDE_FYS.length - 1], lastValue : tideAt(TIDE_FYS[TIDE_FYS.length - 1]),
             y2015 : tideAt('2015-16'), y2017 : tideAt('2016-17'), max : { fy : tideMax, v : tideAt(tideMax) }, low : { fy : tideMin, v : tideAt(tideMin) } },
};
// sanity: the slate's figures, as the scrape of 29-09-2026 gave them
check(HEADLINE.upi.to > 1000, `UPI in ${HEADLINE.payLast}: ${HEADLINE.upi.to} crore, expected over 1,000`);
check(HEADLINE.cash.last > 3e6, `cash at end-March ${lastMarch}: ₹${HEADLINE.cash.last} crore, expected over ₹30 lakh crore`);
fatal();

// ── banknotes by denomination (not on DBIE) ───────────────────────────────────────────────────────────────────────

let NOTE_YEARS = null;
if (fs.existsSync(NOTES)) {
    const n = JSON.parse(fs.readFileSync(NOTES, 'utf8'));
    for (const y of n.years) {
        const sum = y.denominations.reduce((s, d) => s + d.value_crore, 0);
        check(Math.abs(sum / y.total.value_crore - 1) < 0.01, `banknotes ${y.march}: denominations add to ${Math.round(sum)}, total ${y.total.value_crore}`);
        check(/^https:\/\/(www\.)?rbi\.org\.in\//.test(y.url), `banknotes ${y.march}: source is not an rbi.org.in page`);
    }
    NOTE_YEARS = n.years.map(y => ({ march : y.march, report : y.report, url : y.url, total : y.total.value_crore,
        notes : y.denominations.map(d => ({ denom : d.denom, series : d.series ?? 'all', value : d.value_crore, volume : d.volume_lakh })) }));
}
fatal();

// ── UPI users (not on DBIE) ───────────────────────────────────────────────────────────────────────────────────────────
// Straight lines between the sourced points, month by month over the payments months; past the last point, the last
// point held (USERS_HELD says from which month). The points must rise, be official, and cover the first month.

const ymIndex = s => { const [ y, m ] = s.split('-').map(Number); return y * 12 + m - 1; };
const up = JSON.parse(fs.readFileSync(USERS_SRC, 'utf8'));
const USER_POINTS = up.points.map(p => ({ month : p.month, users : p.users, approximate : p.approximate, source : p.source, url : p.url }));
USER_POINTS.forEach((p, i) => {
    check(/^https:\/\/(www\.|static\.)?(pib\.gov\.in|rbi\.org\.in)\//.test(p.url), `UPI users ${p.month}: source is not on pib.gov.in or rbi.org.in`);
    if (i) check(p.users > USER_POINTS[i - 1].users && ymIndex(p.month) > ymIndex(USER_POINTS[i - 1].month), `UPI users ${p.month}: not after and above ${USER_POINTS[i - 1].month}`);
});
check(ymIndex(USER_POINTS[0].month) <= ymIndex(PAY_MONTHS[0]), `UPI users start ${USER_POINTS[0].month}, after the payments' first month`);
fatal();
const USERS = PAY_MONTHS.map(m => {
    const t = ymIndex(m);
    const j = USER_POINTS.findIndex(p => ymIndex(p.month) >= t);
    if (j < 0) return USER_POINTS[USER_POINTS.length - 1].users;
    if (j === 0 || ymIndex(USER_POINTS[j].month) === t) return USER_POINTS[j].users;
    const a = USER_POINTS[j - 1], b = USER_POINTS[j];
    return r2(a.users + (b.users - a.users) * (t - ymIndex(a.month)) / (ymIndex(b.month) - ymIndex(a.month)));
});
const lastPoint = USER_POINTS[USER_POINTS.length - 1].month;
const USERS_HELD = PAY_MONTHS.find(m => ymIndex(m) > ymIndex(lastPoint)) ?? null;
// payments per user a month, the first month and the last sourced one
HEADLINE.perUser = { from : r1(PAY.upi.volume[0] / USERS[0]), fromMonth : PAY_MONTHS[0], to : r1(PAY.upi.volume[PAY_MONTHS.indexOf(lastPoint)] / USERS[PAY_MONTHS.indexOf(lastPoint)]), toMonth : lastPoint };

// The festive weeks: currency in circulation every week (RMC_W_RN, COM11, Fridays), and the cash drawn in the three
// weeks up to the week of Diwali (the gazetted date, data/sources/festival-dates.json), over and above that year's
// normal pace: the average weekly growth over the 52 weeks ending ten weeks before. Then the four weeks after. 2016
// (demonetisation), 2017 (the refill after it) and 2020 (the pandemic) are left out. The path is the average, across those years, of the cumulative
// growth above the normal pace from six weeks before to six weeks after.
const weekRows = objects(path.join(MONETARY, 'reserve-money-components-weekly.csv')).filter(r => r.COMP_RN === 'COM11')
    .map(r => ({ date : r.TIME_PERIOD, crore : num(r.OBS_VALUE) / 1e7 })).filter(r => r.crore > 0).sort((a, b) => a.date.localeCompare(b.date));
check(weekRows.length > 1000 && weekRows[weekRows.length - 1].date >= '2025-01-01', `weekly cash: ${weekRows.length} weeks to ${weekRows[weekRows.length - 1]?.date}`);
const FEST_LEFT_OUT = [ 2016, 2017, 2020 ];   // demonetisation, the refill after it, the pandemic
const fest = JSON.parse(fs.readFileSync(FEST_SRC, 'utf8')).years;
for (const f of fest) check(f.verified && /^https:\/\/(www\.)?(dopt\.gov\.in|documents\.doptcirculars\.nic\.in)\//.test(f.url ?? ''), `festival dates ${f.year}: not read from a DoPT holiday list`);
const wk = weekRows.map(r => r.crore), wkDate = weekRows.map(r => r.date);
const FESTIVE_YEARS = fest.filter(f => !FEST_LEFT_OUT.includes(f.year)).map(f => {
    const i = wkDate.findIndex(d => d >= f.diwali);
    if (i < 62 || i + 6 >= wk.length) return null;
    const norm = (wk[i - 10] / wk[i - 62] - 1) / 52 * 100;               // % a week
    return {
        year : f.year, diwali : f.diwali, week : wkDate[i], verified : !!f.verified,
        before : r2((wk[i] / wk[i - 3] - 1) * 100 - 3 * norm), crore : Math.round(wk[i] - wk[i - 3]),
        after : r2((wk[i + 4] / wk[i] - 1) * 100 - 4 * norm),
        path : Array.from({ length : 13 }, (_, j) => j - 6).map(t => (wk[i + t] / wk[i - 6] - 1) * 100 - (t + 6) * norm),
    };
}).filter(Boolean);
check(FESTIVE_YEARS.length >= 10, `festive weeks: only ${FESTIVE_YEARS.length} years`);
const FESTIVE = {
    years : FESTIVE_YEARS.map(({ path : _p, ...y }) => y),
    path : Array.from({ length : 13 }, (_, j) => r2(FESTIVE_YEARS.reduce((a, y) => a + y.path[j], 0) / FESTIVE_YEARS.length)),
    leftOut : FEST_LEFT_OUT, lastWeek : wkDate[wkDate.length - 1],
};

// The official record of what changed around each series, marked on the steps: data/sources/cash-events.json. Each
// event must name a step, fall in a month the step's series covers (or be a pattern with no month), and come from an
// official site.
const SLIDES = [ 'refill', 'rain', 'card', 'small', 'tide', 'season', 'machines', 'cash', 'notes' ];
const EVENTS = JSON.parse(fs.readFileSync(EVENTS_SRC, 'utf8')).events.map(e => ({ slide : e.slide, month : e.month, label : e.label, note : e.note, source : e.source_title, url : e.url }));
for (const e of EVENTS) {
    check(SLIDES.includes(e.slide), `events: ${e.label}: unknown step ${e.slide}`);
    check(e.slide === 'season' ? e.month === null : /^\d{4}-(0[1-9]|1[0-2])$/.test(e.month), `events: ${e.label}: month ${e.month} (a seasonal pattern has none; every other event has one)`);
    check(e.label && e.note && e.source, `events: ${e.month} needs a label, a note and a source`);
    check(/^https:\/\/(www\.|static\.)?(rbi\.org\.in|pib\.gov\.in|mospi\.gov\.in|indiabudget\.gov\.in|sansad\.in)\//i.test(e.url), `events: ${e.label}: ${e.url} is not an official site`);
    if ([ 'rain', 'card', 'small', 'machines', 'cash' ].includes(e.slide)) check(PAY_MONTHS.includes(e.month), `events: ${e.label}: ${e.month} is outside the payments months`);
    if (e.slide === 'refill') check(CIC_MONTHS.includes(e.month), `events: ${e.label}: ${e.month} is outside the cash months`);
}

// ── write ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const out = { HEADLINE, PAY_MONTHS, PAY, MACHINES, CIC_MONTHS, CIC, TIDE_FYS, TIDE, STOCK, NOTE_YEARS, USER_POINTS, USERS, USERS_HELD, EVENTS, FESTIVE };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 1));

const ts = v => JSON.stringify(v);
const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit. Every number on the page comes from here, and here from`,
    '// the scraped DBIE series (payment system indicators, RMC_M_RN, AMAGG_RN, MACRO_ECN_AGG_RN); the processor\'s header says how.',
    '',
    `export const HEADLINE = ${ts(HEADLINE)};`,
    '',
    `// Payments, monthly from ${PAY_MONTHS[0]} to ${PAY_MONTHS[last]}: volume in crore transactions, value in ₹ crore.`,
    `export const PAY_MONTHS : string[] = ${ts(PAY_MONTHS)};`,
    `export const PAY : Record<"upi" | "cards" | "debit" | "atm" | "micro", { volume : number[]; value : number[] }> = ${ts(PAY)};`,
    '// ATMs and micro-ATMs, lakh machines, each payments month.',
    `export const MACHINES : Record<"atm" | "micro", number[]> = ${ts(MACHINES)};`,
    '',
    '// Currency in circulation, end of each month, ₹ crore.',
    `export const CIC_MONTHS : string[] = ${ts(CIC_MONTHS)};`,
    `export const CIC : number[] = ${ts(CIC)};`,
    '',
    '// The tide: currency with the public (financial-year average) as % of nominal GDP (2011-12 base), by financial year.',
    `export const TIDE_FYS : string[] = ${ts(TIDE_FYS)};`,
    `export const TIDE : number[] = ${ts(TIDE)};`,
    '',
    '// End-March currency in circulation, ₹ crore, and as % of that year\'s nominal GDP.',
    `export const STOCK : { fy : string; cic : number; share : number }[] = ${ts(STOCK)};`,
    '',
    '// Banknotes in circulation by denomination at end-March, from the RBI Annual Reports (not on DBIE), or null until sourced.',
    `export const NOTE_YEARS : { march : string; report : string; url : string; total : number; notes : { denom : string; series : string; value : number; volume : number }[] }[] | null = ${ts(NOTE_YEARS)};`,
    '',
    '// Unique UPI users, crore (cumulative, onboarded; not monthly active), at the dates official documents give them, and',
    '// interpolated for each payments month; from USERS_HELD on, the last point held.',
    `export const USER_POINTS : { month : string; users : number; approximate : boolean; source : string; url : string }[] = ${ts(USER_POINTS)};`,
    `export const USERS : number[] = ${ts(USERS)};`,
    `export const USERS_HELD : string | null = ${ts(USERS_HELD)};`,
    '',
    '// The festive weeks: cash drawn in the three weeks up to Diwali week above the year\'s normal pace (%), the change in ₹ crore,',
    '// the four weeks after (%), and the average path from six weeks before to six after (cumulative %, above the normal pace).',
    `export const FESTIVE : { years : { year : number; diwali : string; week : string; verified : boolean; before : number; crore : number; after : number }[]; path : number[]; leftOut : number[]; lastWeek : string } = ${ts(FESTIVE)};`,
    '',
    '// What changed around each series, from official documents (data/sources/cash-events.json), by the step they are shown on.',
    `export const EVENTS : { slide : string; month : string | null; label : string; note : string; source : string; url : string }[] = ${ts(EVENTS)};`,
    '',
].join('\n');
const genPath = path.join(REPO, `src/app/stories/${SLUG}/data.gen.ts`);
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

const pubDir = path.join(REPO, `public/stories/${SLUG}`);
fs.mkdirSync(pubDir, { recursive : true });
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(pubDir, 'payments-monthly.csv'), '# Reserve Bank of India, payment system indicators (new format), as published on DBIE; volume in crore transactions, value in rupees crore\n' + csv(
    [ 'month', 'upi_volume_crore', 'upi_value_crore', 'debit_card_volume_crore', 'atm_withdrawals_crore', 'atm_withdrawal_value_crore', 'micro_atm_withdrawals_crore', 'micro_atm_value_crore' ],
    PAY_MONTHS.map((m, i) => [ m, PAY.upi.volume[i], PAY.upi.value[i], PAY.debit.volume[i], PAY.atm.volume[i], PAY.atm.value[i], PAY.micro.volume[i], PAY.micro.value[i] ])));
fs.writeFileSync(path.join(pubDir, 'cash-and-gdp-yearly.csv'), '# Reserve Bank of India, as published on DBIE: currency with the public (financial-year average) and nominal GDP (2011-12 base), rupees crore\n' + csv(
    [ 'financial_year', 'currency_with_public_crore', 'gdp_crore', 'share_pct' ],
    TIDE_FYS.map((fy, i) => [ fy, Math.round(cwpBy.get(fy)), Math.round(gdpBy.get(fy)), TIDE[i] ])));

console.log(`${NAME}: payments ${PAY_MONTHS[0]} to ${PAY_MONTHS[last]} (${N} months); UPI ${HEADLINE.upi.from} → ${HEADLINE.upi.to} crore a month (${HEADLINE.upi.times}x); ATM withdrawals ${HEADLINE.atm.from} → ${HEADLINE.atm.to} crore (${HEADLINE.atm.change}%); micro-ATM ${HEADLINE.micro.from} → ${HEADLINE.micro.to}; machines: ATMs ${MACHINES.atm[0]} → ${MACHINES.atm[last]} lakh, micro-ATMs ${MACHINES.micro[0]} → ${MACHINES.micro[last]} lakh; cash ₹${HEADLINE.cash.march2016} crore (Mar 2016) → ₹${HEADLINE.cash.last} crore (${lastMarch}); tide ${TIDE_FYS[0]}–${HEADLINE.tide.last}: ${HEADLINE.tide.y2015}% (2015-16), ${HEADLINE.tide.y2017}% (2016-17), ${HEADLINE.tide.lastValue}% (${HEADLINE.tide.last}), high ${HEADLINE.tide.max.v}% (${HEADLINE.tide.max.fy}); banknotes ${NOTE_YEARS ? NOTE_YEARS.length + ' years' : 'not yet sourced'}; UPI users ${USERS[0]} → ${USERS[last]} crore (${USER_POINTS.length} points), ${HEADLINE.perUser.from} → ${HEADLINE.perUser.to} payments a user a month; Reserve Bank ratio agrees ${ratioAgree}/${ratioYears} years; self-check passed`);
