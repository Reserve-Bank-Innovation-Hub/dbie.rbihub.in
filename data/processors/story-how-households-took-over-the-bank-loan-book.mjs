// Processor: story-how-households-took-over-the-bank-loan-book — derives every series for "How households took over the bank loan book" from the
// scrape's report exports (data/reports/**, restored by `pnpm data:fetch`), read with the parser the database
// loader uses, so each grid is the one loaded into Postgres. Nothing is typed by hand.
//
// Sources (DBIE report id → table):
//   958   Table 3.2   organisation by occupation, quarterly BSR-1, Mar 2014 – Jun 2026, scheduled commercial banks
//                     excluding regional rural banks. DBIE publishes no June or September 2014 quarter, so the
//                     series has 48 quarters: Mar 2014, Dec 2014, then every quarter from Mar 2015.
//   1092  Table 3.2   organisation by occupation, annual BSR-1, March 2026, including regional rural banks. Its
//                     columns are eleven organisations without a gender split and without the microfinance,
//                     non-profit and non-resident columns, though its total includes them.
//   1137  Table 1.11  credit by organisation, annual BSR-1, March 2026, including regional rural banks: the male and
//                     female rows of individuals that 1092 lacks.
//   610   CPI rural, urban, combined, base 2012 = 100, monthly; the general index, combined, Final where both
//                     Final and Provisional rows exist. The 2012 series stops at December 2025.
//   45    CPI rural, urban, combined, base 2024 = 100 (Monthly Bulletin), January 2025 onwards: a month after
//                     December 2025 is carried onto the 2012 base by its published year-on-year change, that is
//                     2012-base index twelve months earlier × (2024-base index ÷ 2024-base index twelve months
//                     earlier). March 2026 so reads 192.0 × 104.84 ÷ 101.39. Linking at the 2025 average or at
//                     December 2025 instead puts March 2026 at 199.0 to 199.4, and prices at 1.66 rather than 1.65.
//
// The quarterly CSV is the xlsx beside it with the first (empty) column dropped, the period written "Mar-2015" on
// every row instead of an Excel serial carried down a block, and amounts rounded to whole crore (accounts are
// identical; the xlsx keeps four decimals, so total credit for March 2015 reads 66,97,242.0227 there and 66,97,242
// here). The sums below are therefore checked within half a crore per addend.
//
// The table counts loan accounts, not people. Amounts are ₹ crore outstanding.
//
// Emits:
//   out/story-how-households-took-over-the-bank-loan-book.json                     the oracle (data/processors/oracles/ holds the snapshot)
//   src/app/stories/how-households-took-over-the-bank-loan-book/data.gen.ts        the module the page imports
//   public/stories/how-households-took-over-the-bank-loan-book/*.csv               the four downloads the page offers

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRows } from '../../scripts/db/lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const OUT_DIR   = path.join(__dirname, 'out');
const NAME      = 'story-how-households-took-over-the-bank-loan-book';

const PUB       = path.join(REPO, 'data/reports/publication/time-series-publications');
const QUARTERLY = path.join(PUB, 'quarterly-basic-statistical-return-bsr-1-on-credit-by-scheduled-commercial-banks-excluding-regional-rural-banks');
const ANNUAL    = path.join(PUB, 'annual-basic-statistical-return-bsr-1-on-credit-by-scheduled-commercial-banks-including-regional-rural-banks');
const BULLETIN  = path.join(PUB, 'monthly-rbi-bulletin');
const CPI_DIR   = path.join(REPO, 'data/reports/indicators/real-sector-indicators/cpi-rural-urban-combined');

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

// A cell to a number: Indian or plain digit grouping; '', ' ' and '-' are null.
const num = s => {
    if (s == null) return null;
    const t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-') return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
};
const zero = s => num(s) ?? 0;
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
const pct = (a, b) => a / b * 100;

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const fatal = () => { if (errors.length) { console.error(`${NAME}: self-check FAILED:`); errors.forEach(e => console.error('  ' + e)); process.exit(1); } };
const passed = [];
const anchor = (cond, msg) => { check(cond, msg); if (cond) passed.push(msg); };

const MONTHS = { JAN : '01', FEB : '02', MAR : '03', APR : '04', MAY : '05', JUN : '06', JUL : '07', AUG : '08', SEP : '09', OCT : '10', NOV : '11', DEC : '12' };
// "Mar-2015" or "MAR-2015" to "2015-03".
const monthKey = s => { const [ m, y ] = s.split('-'); const mm = MONTHS[m.toUpperCase()]; return mm && /^\d{4}$/.test(y) ? `${y}-${mm}` : null; };
const shiftYear = (k, d) => `${+k.slice(0, 4) + d}${k.slice(4)}`;

// ── 1. Quarterly Table 3.2 (report 958) ───────────────────────────────────────────────────────────────────────────
// Row 5 holds the organisation headers, row 6 a {No. of Accounts, Credit Limit, Amount Outstanding} triplet under
// each, data from row 7: column 0 the period, column 1 the occupation. The column numbers are the xlsx's less one.

const q32 = await grid(reportFile(QUARTERLY, 958));
const ORG = {
    public           : [ 2,  '1. PUBLIC SECTOR' ],
    cooperative      : [ 23, '2. CO-OPERATIVE SECTOR' ],
    privateCompanies : [ 26, '3. PRIVATE CORPORATE SECTOR' ],
    household        : [ 35, '4. HOUSEHOLD SECTOR' ],
    individuals      : [ 38, '4.1 INDIVIDUALS' ],
    men              : [ 41, 'a) Male' ],
    women            : [ 44, 'b) Female' ],
    householdOthers  : [ 47, '4.2 HOUSEHOLD SECTOR-OTHERS' ],
    mfis             : [ 56, '5. MICRO FINANCE INSTITUTIONS' ],
    nonProfits       : [ 59, '6. NON-PROFIT INSTITUTIONS SERVING HOUSEHOLDS' ],
    nonResidents     : [ 62, '7. NON RESIDENTS' ],
    total            : [ 65, 'TOTAL CREDIT' ],
};
check(q32[5]?.length === 68, `quarterly Table 3.2: expected 68 columns, got ${q32[5]?.length}`);
check(norm(q32[5]?.[0]) === 'Reporting Period', `quarterly Table 3.2: column 0 should be the reporting period, got "${q32[5]?.[0]}"`);
check(/^Oraganization\/ Occupation$/.test(norm(q32[5]?.[1])), `quarterly Table 3.2: column 1 should be the occupation, got "${norm(q32[5]?.[1])}"`);
for (const [ key, [ col, label ] ] of Object.entries(ORG)) {
    check(norm(q32[5]?.[col]) === label, `quarterly Table 3.2: ${key} should head column ${col} as "${label}", got "${norm(q32[5]?.[col])}"`);
    check(q32[6]?.[col] === 'No. of Accounts' && q32[6]?.[col + 2] === 'Amount Outstanding', `quarterly Table 3.2: ${key} sub-headers at ${col}–${col + 2}`);
}
fatal();

const OCC_ROWS = {
    'I. AGRICULTURE' : 'agriculture', 'II. INDUSTRY' : 'industry', 'III. TRANSPORT OPERATORS' : 'transport',
    'IV. PROFESSIONAL AND OTHER SERVICES' : 'services', 'V. PERSONAL LOANS' : 'personal', 'VI. TRADE' : 'trade',
    'VII. FINANCE' : 'finance', 'VIII. ALL OTHERS' : 'others',
};
const PERSONAL_ROWS = {
    '1. Housing' : 'housing', '2. Consumer Durables' : 'durables', '3. Vehicles' : 'vehicles', '4. Education' : 'education',
    '5. Personal Credit Cards' : 'cards', '6. Other Personal Loans' : 'otherPersonal',
};
const OCC_KEYS = Object.values(OCC_ROWS), PERSONAL_KEYS = Object.values(PERSONAL_ROWS);
const CLASS_KEYS = [ 'public', 'cooperative', 'privateCompanies', 'individuals', 'householdOthers', 'mfis', 'nonProfits', 'nonResidents' ];

// The rows of each quarter: byQuarter[key][label] = the row. A numbered sub-row ("1. Housing") is filed under the
// Roman-numeral row above it, so "1. Housing" under V. PERSONAL LOANS is not confused with "1. Direct Finance".
const byQuarter = new Map();
let parent = null;
for (const r of q32.slice(7)) {
    if (r.length < 68) continue;
    const key = monthKey(r[0]);
    check(key, `quarterly Table 3.2: unreadable period "${r[0]}"`);
    if (!key) continue;
    if (!byQuarter.has(key)) byQuarter.set(key, { main : {}, personal : {} });
    const q = byQuarter.get(key), label = r[1];
    if (/^[IVX]+\. /.test(label) || label === 'TOTAL CREDIT') { parent = label; q.main[label] = r; }
    else if (parent === 'V. PERSONAL LOANS' && PERSONAL_ROWS[label]) q.personal[label] = r;
}
fatal();

const money = (r, org, strict = false) => {
    const [ col ] = ORG[org];
    if (strict) check(num(r[col]) != null && num(r[col + 2]) != null, `quarterly Table 3.2: ${r[0]} ${r[1]} ${org} is blank`);
    return { accounts : zero(r[col]), outstanding : zero(r[col + 2]) };
};

const QUARTERS = [ ...byQuarter.keys() ].sort().map(key => {
    const { main, personal } = byQuarter.get(key);
    for (const label of [ ...Object.keys(OCC_ROWS), 'TOTAL CREDIT' ]) check(main[label], `quarterly Table 3.2: ${key} has no "${label}" row`);
    for (const label of Object.keys(PERSONAL_ROWS)) check(personal[label], `quarterly Table 3.2: ${key} has no "${label}" row under personal loans`);
    if (errors.length) return null;
    const tot = main['TOTAL CREDIT'];
    return {
        quarter     : key,
        total       : money(tot, 'total', true),
        classes     : Object.fromEntries(CLASS_KEYS.map(c => [ c, money(tot, c, true) ])),
        men         : money(tot, 'men', true),
        women       : money(tot, 'women', true),
        occupations : Object.fromEntries(Object.entries(OCC_ROWS).map(([ label, k ]) => [ k, { all : money(main[label], 'individuals'), women : money(main[label], 'women') } ])),
        personal    : Object.fromEntries(Object.entries(PERSONAL_ROWS).map(([ label, k ]) => [ k, { all : money(personal[label], 'individuals'), women : money(personal[label], 'women') } ])),
        // Kept for the downloads only: men by occupation, read from the table rather than derived.
        _menByOcc   : Object.fromEntries(Object.entries(OCC_ROWS).map(([ label, k ]) => [ k, money(main[label], 'men') ])),
        _menByKind  : Object.fromEntries(Object.entries(PERSONAL_ROWS).map(([ label, k ]) => [ k, money(personal[label], 'men') ])),
        _household  : money(tot, 'household', true),
    };
});
fatal();

// Sums. Accounts are whole counts and must add exactly; amounts are rounded to whole crore in the CSV, so a sum of
// n cells may miss its total by up to n/2 crore.
const sumOf = (cells, f) => cells.reduce((s, c) => s + c[f], 0);
const near = (parts, whole, what) => {
    check(sumOf(parts, 'accounts') === whole.accounts, `${what}: accounts add to ${sumOf(parts, 'accounts')}, total ${whole.accounts}`);
    const d = Math.abs(sumOf(parts, 'outstanding') - whole.outstanding);
    check(d <= parts.length / 2 + 0.5, `${what}: amounts add to ${sumOf(parts, 'outstanding')}, total ${whole.outstanding}`);
};
let maxDrift = 0;
for (const q of QUARTERS) {
    near(CLASS_KEYS.map(c => q.classes[c]), q.total, `${q.quarter} classes`);
    near([ q.classes.individuals, q.classes.householdOthers ], q._household, `${q.quarter} household sector`);
    near([ q.men, q.women ], q.classes.individuals, `${q.quarter} men and women`);
    near(OCC_KEYS.map(k => q.occupations[k].all), q.classes.individuals, `${q.quarter} occupations of individuals`);
    near(OCC_KEYS.map(k => q.occupations[k].women), q.women, `${q.quarter} occupations of women`);
    near(PERSONAL_KEYS.map(k => q.personal[k].all), q.occupations.personal.all, `${q.quarter} personal loans`);
    near(PERSONAL_KEYS.map(k => q.personal[k].women), q.occupations.personal.women, `${q.quarter} women's personal loans`);
    maxDrift = Math.max(maxDrift, Math.abs(sumOf(CLASS_KEYS.map(c => q.classes[c]), 'outstanding') - q.total.outstanding));
}
check(QUARTERS[0].quarter === '2014-03', `quarterly Table 3.2: should start in March 2014, starts ${QUARTERS[0].quarter}`);
check(QUARTERS.length >= 48, `quarterly Table 3.2: expected 48 quarters or more, got ${QUARTERS.length}`);
if (QUARTERS.length > 48) console.warn(`${NAME}: warning: ${QUARTERS.length} quarters (48 expected); the span has grown to ${QUARTERS.at(-1).quarter}`);
passed.push(`${QUARTERS.length} quarters, ${QUARTERS[0].quarter} to ${QUARTERS.at(-1).quarter}; every class, gender, occupation and personal-loan sum adds (accounts exactly, amounts within ${maxDrift} crore for the classes)`);
fatal();

const Q = new Map(QUARTERS.map(q => [ q.quarter, q ]));
const LATEST = QUARTERS.at(-1);
const M15 = Q.get('2015-03'), M26 = Q.get('2026-03');
check(M15 && M26, 'quarterly Table 3.2: March 2015 or March 2026 is missing');
fatal();

// ── 2. CPI, general index, combined, 2012 = 100 (report 610), carried past December 2025 by report 45 ───────────

const cpiRows = await grid(reportFile(CPI_DIR, 610, '--cpi-2012-100-all-india-1'));
check(norm(cpiRows[3]?.[0]) === 'Base : 2012 = 100', `CPI 610: expected base 2012 = 100, got "${cpiRows[3]?.[0]}"`);
check(cpiRows[5]?.[0] === 'Month' && cpiRows[5]?.[1] === 'Commodity Description' && cpiRows[5]?.[2] === 'Provisional / Final' && cpiRows[5]?.[7] === 'Combined' && cpiRows[6]?.[7] === 'Index', 'CPI 610: header layout changed');
const cpiLink = await grid(reportFile(BULLETIN, 45, '--cpi-2024-100-all-india'));
check(norm(cpiLink[3]?.[0]) === 'Base : 2024 = 100', `CPI 45: expected base 2024 = 100, got "${cpiLink[3]?.[0]}"`);
check(cpiLink[5]?.[0] === 'Month' && cpiLink[5]?.[7] === 'Combined' && cpiLink[6]?.[7] === 'Index', 'CPI 45: header layout changed');
fatal();

// General index, combined: Final where a month has both rows, else Provisional.
function generalIndex(rows) {
    const out = new Map();
    for (const r of rows.slice(7)) {
        if (r[1] !== 'A) General Index') continue;
        const k = monthKey(r[0]), v = num(r[7]);
        if (!k || v == null) continue;
        const prev = out.get(k);
        if (!prev || (prev.status !== 'Final' && r[2] === 'Final')) out.set(k, { value : v, status : r[2] });
    }
    return out;
}
const cpi12 = generalIndex(cpiRows), cpi24 = generalIndex(cpiLink);
const CPI = {}, CPI_LINKED = [], cpiStatus = {};
for (const { quarter : k } of QUARTERS) {
    if (cpi12.has(k)) { CPI[k] = cpi12.get(k).value; cpiStatus[k] = cpi12.get(k).status; continue; }
    const back = shiftYear(k, -1);
    const a = cpi12.get(back), b = cpi24.get(k), c = cpi24.get(back);
    check(a && b && c, `CPI: ${k} is not in the 2012 series and cannot be carried from the 2024 series`);
    if (!(a && b && c)) continue;
    CPI[k] = r1(a.value * b.value / c.value);
    cpiStatus[k] = `linked (2024 = 100, ${b.status})`;
    CPI_LINKED.push(k);
}
anchor(CPI['2015-03'] === 120.2, `CPI March 2015 = 120.2 (got ${CPI['2015-03']}, ${cpiStatus['2015-03']})`);
for (const { quarter : k } of QUARTERS) check(Number.isFinite(CPI[k]), `CPI: no index for ${k}`);
fatal();

// ── 3. Annual Table 3.2 (report 1092) and Table 1.11 (report 1137), March 2026, with regional rural banks ────────

const a32 = await grid(reportFile(ANNUAL, 1092));
const A32 = { individuals : [ 10, 'HOUSEHOLD SECTOR - INDIVIDUALS' ], privateFinancial : [ 19, 'PRIVATE FINANCIAL CORPORATIONS' ], privateNonFinancial : [ 22, 'PRIVATE NON-FINANCIAL CORPORATIONS' ], total : [ 34, 'TOTAL' ] };
check(/MARCH 2026$/.test(norm(a32[1]?.[0])), `annual Table 3.2: expected March 2026, title "${norm(a32[1]?.[0])}"`);
check(norm(a32[5]?.[0]) === 'Occupation Group' && a32[5]?.length === 37, 'annual Table 3.2: expected 37 columns with the occupation in column 0');
for (const [ key, [ col, label ] ] of Object.entries(A32)) {
    check(norm(a32[5]?.[col]) === label, `annual Table 3.2: ${key} should head column ${col} as "${label}", got "${norm(a32[5]?.[col])}"`);
    check(norm(a32[6]?.[col]) === 'No. of Accounts' && norm(a32[6]?.[col + 2]) === 'Amount Outstanding', `annual Table 3.2: ${key} sub-headers at ${col}–${col + 2}`);
}
check(!a32[5]?.some(h => /female|male|micro|non-?resident|non-profit/i.test(h)), 'annual Table 3.2 has gained a gender, microfinance, non-profit or non-resident column; revisit RRB_2026');
const aRow = label => { const r = a32.find(x => x[0] === label); check(r, `annual Table 3.2: no "${label}" row`); return r; };
const aMoney = (r, key) => ({ accounts : num(r[A32[key][0]]), outstanding : num(r[A32[key][0] + 2]) });
const aAgri = aRow('I. AGRICULTURE'), aTotal = aRow('Total Bank Credit');
fatal();

const t111 = await grid(reportFile(ANNUAL, 1137));
check(/MARCH - 2026$/.test(norm(t111[1]?.[0])), `annual Table 1.11: expected March 2026, title "${norm(t111[1]?.[0])}"`);
check(norm(t111[5]?.[1]) === 'Total Credit' && norm(t111[6]?.[1]) === 'No. of Accounts' && norm(t111[6]?.[3]) === 'Amount Outstanding', 'annual Table 1.11: header layout changed');
const t111Row = label => { const r = t111.find(x => norm(x[0]) === label); check(r, `annual Table 1.11: no "${label}" row`); return r ? { accounts : num(r[1]), outstanding : num(r[3]) } : null; };
const RRB_2026 = {
    total            : t111Row('TOTAL'),
    individuals      : t111Row('4.1 INDIVIDUALS'),
    men              : t111Row('(a) Male'),
    women            : t111Row('(b) Female'),
    privateCompanies : t111Row('3. PRIVATE CORPORATE SECTOR'),
    agriculture      : { all : aMoney(aAgri, 'individuals') },
};
fatal();
const same = (a, b) => a.accounts === b.accounts && a.outstanding === b.outstanding;
check(same(RRB_2026.total, aMoney(aTotal, 'total')), 'annual: Table 1.11 and Table 3.2 totals differ');
check(same(RRB_2026.individuals, aMoney(aTotal, 'individuals')), 'annual: Table 1.11 and Table 3.2 individuals differ');
const pf = aMoney(aTotal, 'privateFinancial'), pnf = aMoney(aTotal, 'privateNonFinancial');
near([ pf, pnf ], RRB_2026.privateCompanies, 'annual: Table 3.2 private financial and non-financial against Table 1.11 private companies');
near([ RRB_2026.men, RRB_2026.women ], RRB_2026.individuals, 'annual Table 1.11 men and women');
// With the regional rural banks, every class is at least what it is without them.
for (const k of [ 'total', 'individuals', 'women', 'privateCompanies' ]) check(RRB_2026[k].accounts >= (M26[k] ?? M26.classes[k]).accounts, `annual: ${k} accounts with regional rural banks below the quarterly figure`);
fatal();

// ── 4. The headline figures ───────────────────────────────────────────────────────────────────────────────────────

const share = (q, c) => pct(q.classes[c].outstanding, q.total.outstanding);
const avgLakh = m => m.outstanding * 100 / m.accounts;   // ₹ crore per account to ₹ lakh

const MARCHES = QUARTERS.filter(q => q.quarter.endsWith('-03'));
const marches = MARCHES.map(q => {
    const ind = share(q, 'individuals'), pc = share(q, 'privateCompanies'), pl = pct(q.occupations.personal.all.outstanding, q.total.outstanding);
    return { year : +q.quarter.slice(0, 4), individuals : r1(ind), privateCompanies : r1(pc), personal : r1(pl), otherIndividuals : r1(ind - pl), rest : r1(100 - ind - pc) };
});
const crossover = QUARTERS.find(q => share(q, 'individuals') > share(q, 'privateCompanies'))?.quarter ?? null;
const peakQ = QUARTERS.reduce((b, q) => share(q, 'individuals') - share(q, 'privateCompanies') > share(b, 'individuals') - share(b, 'privateCompanies') ? q : b);
const prices = r2(CPI['2026-03'] / CPI['2015-03']);
const mult = (a, b) => b / a;
const womenPeak = QUARTERS.reduce((b, q) => q.women.accounts > b.women.accounts ? q : b);

const ofInd = (q, m) => pct(m.outstanding, q.classes.individuals.outstanding);
const personalOf = q => Object.fromEntries(PERSONAL_KEYS.map(k => [ k, { ofIndividuals : r1(ofInd(q, q.personal[k].all)), ofBook : r1(pct(q.personal[k].all.outstanding, q.total.outstanding)) } ]));
const occOf = q => Object.fromEntries(OCC_KEYS.map(k => [ k, { ofIndividuals : r1(ofInd(q, q.occupations[k].all)), womenShare : r1(pct(q.occupations[k].women.outstanding, q.occupations[k].all.outstanding)) } ]));

const HEADLINE = {
    marches,
    latest      : { quarter : LATEST.quarter, individuals : r1(share(LATEST, 'individuals')), privateCompanies : r1(share(LATEST, 'privateCompanies')) },
    crossover,
    gapPeak     : { quarter : peakQ.quarter, gap : r1(share(peakQ, 'individuals') - share(peakQ, 'privateCompanies')) },
    prices,
    // accounts and outstanding are individuals'; companies is private companies' outstanding; book is all credit.
    growth      : {
        accounts        : r2(mult(M15.classes.individuals.accounts, M26.classes.individuals.accounts)),
        outstanding     : r2(mult(M15.classes.individuals.outstanding, M26.classes.individuals.outstanding)),
        outstandingReal : r2(mult(M15.classes.individuals.outstanding, M26.classes.individuals.outstanding) / prices),
        companies       : r2(mult(M15.classes.privateCompanies.outstanding, M26.classes.privateCompanies.outstanding)),
        companiesReal   : r2(mult(M15.classes.privateCompanies.outstanding, M26.classes.privateCompanies.outstanding) / prices),
        book            : r2(mult(M15.total.outstanding, M26.total.outstanding)),
    },
    averageLoan : {
        y2015          : { all : r2(avgLakh(M15.classes.individuals)), men : r2(avgLakh(M15.men)), women : r2(avgLakh(M15.women)) },
        y2026          : { all : r2(avgLakh(M26.classes.individuals)), men : r2(avgLakh(M26.men)), women : r2(avgLakh(M26.women)) },
        womenToMen2015 : r2(avgLakh(M15.women) / avgLakh(M15.men)),
        womenToMen2026 : r2(avgLakh(M26.women) / avgLakh(M26.men)),
        realChange     : r2(avgLakh(M26.classes.individuals) / prices / avgLakh(M15.classes.individuals)),
    },
    // Shares are of individuals' accounts and money; belowPeakPct and latestAccounts are for the latest quarter;
    // shareOfAccountsAdded is women's part of the individuals' accounts added from March 2015 to March 2026.
    women       : {
        accountsShare2015    : r1(pct(M15.women.accounts, M15.classes.individuals.accounts)),
        accountsShare2026    : r1(pct(M26.women.accounts, M26.classes.individuals.accounts)),
        moneyShare2015       : r1(pct(M15.women.outstanding, M15.classes.individuals.outstanding)),
        moneyShare2026       : r1(pct(M26.women.outstanding, M26.classes.individuals.outstanding)),
        peak                 : { quarter : womenPeak.quarter, accounts : womenPeak.women.accounts },
        belowPeakPct         : r1((womenPeak.women.accounts - LATEST.women.accounts) / womenPeak.women.accounts * 100),
        shareOfAccountsAdded : r1(pct(M26.women.accounts - M15.women.accounts, M26.classes.individuals.accounts - M15.classes.individuals.accounts)),
        latestAccounts       : LATEST.women.accounts,
    },
    personal    : { y2015 : personalOf(M15), y2026 : personalOf(M26) },
    occupations : { y2015 : occOf(M15), y2026 : occOf(M26) },
    rrb         : {
        womenMoneyShare2026        : r1(pct(RRB_2026.women.outstanding, RRB_2026.individuals.outstanding)),
        womenAccountsShare2026     : r1(pct(RRB_2026.women.accounts, RRB_2026.individuals.accounts)),
        individualsShareOfBook2026 : r1(pct(RRB_2026.individuals.outstanding, RRB_2026.total.outstanding)),
    },
};

// ── 5. Anchors, verified against DBIE on 13-10-2026 ───────────────────────────────────────────────────────────────

anchor(r2(share(M15, 'individuals')) === 30.82, `March 2015 individuals' share 30.82 (got ${r2(share(M15, 'individuals'))})`);
anchor(r2(share(M15, 'privateCompanies')) === 40.02, `March 2015 private companies' share 40.02 (got ${r2(share(M15, 'privateCompanies'))})`);
anchor(M15.classes.individuals.accounts === 115682833, `March 2015 individuals' accounts 115,682,833 (got ${M15.classes.individuals.accounts})`);
anchor(M15.total.outstanding === 6697242, `March 2015 total outstanding 66,97,242 crore (got ${M15.total.outstanding}; the xlsx reads 6697242.0227)`);
anchor(crossover === '2017-06', `crossover 2017-06 (got ${crossover})`);
// The brief put the peak in March 2024 (11,60,62,757 accounts); June 2024 is higher by 16,287 (11,60,79,044), and both
// round to 11.61 crore.
anchor(womenPeak.quarter === '2024-06' && r2(womenPeak.women.accounts / 1e7) === 11.61, `women's accounts peak 2024-06 at 11.61 crore (got ${womenPeak.quarter} at ${r2(womenPeak.women.accounts / 1e7)})`);
anchor(HEADLINE.women.moneyShare2026 === 24.5, `women's money share March 2026 24.5 (got ${HEADLINE.women.moneyShare2026})`);
anchor(HEADLINE.occupations.y2026.agriculture.womenShare === 33.0, `agriculture women's share by value March 2026 33.0 (got ${HEADLINE.occupations.y2026.agriculture.womenShare})`);

// No NaN or infinity anywhere in what is emitted.
const walk = (v, p) => {
    if (typeof v === 'number') check(Number.isFinite(v), `${p} is ${v}`);
    else if (v && typeof v === 'object') for (const [ k, x ] of Object.entries(v)) walk(x, `${p}.${k}`);
};
const emitted = QUARTERS.map(({ _menByOcc, _menByKind, _household, ...q }) => q);
walk({ QUARTERS : emitted, CPI, RRB_2026, HEADLINE }, 'out');
passed.push('no NaN or infinity in QUARTERS, CPI, RRB_2026 or HEADLINE');
fatal();

// ── the oracle ────────────────────────────────────────────────────────────────────────────────────────────────────

const SOURCE = {
    quarterly          : 'RBI, BSR-1 quarterly, Table 3.2, organisation-wise classification of outstanding credit of scheduled commercial banks according to occupation, excluding regional rural banks (DBIE report 958)',
    annual             : 'RBI, BSR-1 annual March 2026, Table 3.2, the same classification including regional rural banks (DBIE report 1092)',
    annualOrganisation : 'RBI, BSR-1 annual March 2026, Table 1.11, outstanding credit according to organisation, including regional rural banks (DBIE report 1137)',
    cpi                : 'MoSPI, consumer price index, rural, urban and combined, general index, combined, base 2012 = 100 (DBIE report 610)',
    cpiLink            : 'MoSPI, consumer price index, base 2024 = 100, as published in the RBI Monthly Bulletin (DBIE report 45)',
    from               : QUARTERS[0].quarter,
    to                 : LATEST.quarter,
};
const CLASS_LABELS = {
    public : 'Government and public sector', cooperative : 'Co-operatives', privateCompanies : 'Private companies', individuals : 'Individuals',
    householdOthers : 'Sole proprietors, partnerships and groups', mfis : 'Microfinance institutions', nonProfits : 'Non-profits', nonResidents : 'Non-residents',
};
const OCC_LABELS = {
    agriculture : 'Agriculture', industry : 'Industry', transport : 'Transport operators', services : 'Professional and other services',
    personal : 'Personal loans', trade : 'Trade', finance : 'Finance', others : 'All others',
};
const PERSONAL_LABELS = {
    housing : 'Housing', durables : 'Consumer durables', vehicles : 'Vehicles', education : 'Education', cards : 'Credit cards', otherPersonal : 'Other personal loans',
};

const out = { SOURCE, CLASS_LABELS, OCC_LABELS, PERSONAL_LABELS, QUARTERS : emitted, CPI, CPI_LINKED, RRB_2026, HEADLINE };
fs.mkdirSync(OUT_DIR, { recursive : true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.json`), JSON.stringify(out, null, 2));

// ── the module ────────────────────────────────────────────────────────────────────────────────────────────────────

const ts = v => {
    if (Array.isArray(v)) return '[ ' + v.map(ts).join(', ') + ' ]';
    if (v && typeof v === 'object') return '{ ' + Object.entries(v).map(([ k, x ]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)} : ${ts(x)}`).join(', ') + ' }';
    return JSON.stringify(v);
};
const lines = (arr, indent = '    ') => '[\n' + arr.map(x => indent + ts(x) + ',').join('\n') + '\n]';
const objLines = (obj, indent = '    ') => '{\n' + Object.entries(obj).map(([ k, x ]) => `${indent}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)} : ${ts(x)},`).join('\n') + '\n}';

const GEN = [
    `// GENERATED by data/processors/${NAME}.mjs — do not edit by hand; regenerate via pnpm data:build`,
    '// Sources: RBI, Basic Statistical Returns of scheduled commercial banks (quarterly BSR-1 Table 3.2, excluding regional',
    '// rural banks; annual BSR-1 March 2026 Tables 3.2 and 1.11, including them) and MoSPI\'s consumer price index, all as',
    '// scraped from DBIE. The table counts loan accounts, not people; amounts are ₹ crore outstanding.',
    '',
    `export const SOURCE = ${objLines(SOURCE)} as const;`,
    '',
    'export interface Money { accounts : number; outstanding : number }   // accounts: count; outstanding: ₹ crore',
    '',
    `export type ClassKey = ${CLASS_KEYS.map(k => JSON.stringify(k)).join(' | ')};`,
    `export const CLASS_LABELS : Record<ClassKey, string> = ${objLines(CLASS_LABELS)};`,
    '',
    `export type OccKey = ${OCC_KEYS.map(k => JSON.stringify(k)).join(' | ')};`,
    `export type PersonalKey = ${PERSONAL_KEYS.map(k => JSON.stringify(k)).join(' | ')};`,
    `export const OCC_LABELS : Record<OccKey, string> = ${objLines(OCC_LABELS)};`,
    `export const PERSONAL_LABELS : Record<PersonalKey, string> = ${objLines(PERSONAL_LABELS)};`,
    '',
    'export interface Quarter {',
    '    quarter     : string;                                              // "2014-03"',
    '    total       : Money;',
    '    classes     : Record<ClassKey, Money>;                             // sums to total',
    '    men         : Money; women : Money;                                // men + women = classes.individuals',
    '    occupations : Record<OccKey, { all : Money; women : Money }>;      // individuals; sums to classes.individuals',
    '    personal    : Record<PersonalKey, { all : Money; women : Money }>; // sums to occupations.personal',
    '}',
    '',
    `// Every quarter DBIE publishes, ${SOURCE.from} to ${SOURCE.to}, ascending. There is no June or September 2014 quarter.`,
    `export const QUARTERS : Quarter[] = ${lines(emitted)};`,
    '',
    '// General index, combined, base 2012 = 100, for every quarter key in QUARTERS (the last month of the quarter).',
    '// The 2012 series ends in December 2025; the quarters in CPI_LINKED carry it on by the 2024-base series\'',
    '// published year-on-year change (index a year earlier × this month ÷ the same month a year earlier).',
    `export const CPI : Record<string, number> = ${objLines(CPI)};`,
    `export const CPI_LINKED : string[] = ${ts(CPI_LINKED)};`,
    '',
    '// March 2026 with the regional rural banks: Table 1.11 for the totals, men and women; Table 3.2 for agriculture.',
    '// No table that includes the regional rural banks splits an occupation by gender, so agriculture has no women here.',
    'export const RRB_2026 : {',
    '    total : Money; individuals : Money; men : Money; women : Money; privateCompanies : Money;',
    '    agriculture : { all : Money };',
    `} = ${objLines(RRB_2026)};`,
    '',
    '// Derived and checked in the processor. Shares are ₹ of every ₹100 (1 dp); multiples, ₹ lakh and ratios 2 dp.',
    '// growth: March 2015 to March 2026; accounts and outstanding are individuals\', companies private companies\',',
    '// book all credit; the Real figures divide by prices (CPI March 2026 ÷ CPI March 2015).',
    '// marches.personal is individuals\' personal loans; otherIndividuals the rest of individuals\'; rest everyone but',
    '// individuals and private companies. women: shares of individuals\' accounts and money; belowPeakPct and',
    '// latestAccounts at latest.quarter; shareOfAccountsAdded is women\'s part of the accounts added 2015 to 2026.',
    '// occupations.womenShare is by value.',
    'export const HEADLINE : {',
    '    marches       : Array<{ year : number; individuals : number; privateCompanies : number; personal : number; otherIndividuals : number; rest : number }>;',
    '    latest        : { quarter : string; individuals : number; privateCompanies : number };',
    '    crossover     : string;',
    '    gapPeak       : { quarter : string; gap : number };',
    '    prices        : number;',
    '    growth        : { accounts : number; outstanding : number; outstandingReal : number; companies : number; companiesReal : number; book : number };',
    '    averageLoan   : { y2015 : { all : number; men : number; women : number }; y2026 : { all : number; men : number; women : number }; womenToMen2015 : number; womenToMen2026 : number; realChange : number };',
    '    women         : { accountsShare2015 : number; accountsShare2026 : number; moneyShare2015 : number; moneyShare2026 : number; peak : { quarter : string; accounts : number }; belowPeakPct : number; shareOfAccountsAdded : number; latestAccounts : number };',
    '    personal      : { y2015 : Record<PersonalKey, { ofIndividuals : number; ofBook : number }>; y2026 : Record<PersonalKey, { ofIndividuals : number; ofBook : number }> };',
    '    occupations   : { y2015 : Record<OccKey, { ofIndividuals : number; womenShare : number }>; y2026 : Record<OccKey, { ofIndividuals : number; womenShare : number }> };',
    '    rrb           : { womenMoneyShare2026 : number; womenAccountsShare2026 : number; individualsShareOfBook2026 : number };',
    '} = {',
    `    marches : ${lines(HEADLINE.marches, '        ').replace(/\n\]$/, '\n    ]')},`,
    ...Object.entries(HEADLINE).filter(([ k ]) => k !== 'marches').map(([ k, v ]) => `    ${k} : ${ts(v)},`),
    '};',
    '',
].join('\n');
const genPath = path.join(REPO, 'src/app/stories/how-households-took-over-the-bank-loan-book/data.gen.ts');
fs.mkdirSync(path.dirname(genPath), { recursive : true });
fs.writeFileSync(genPath, GEN);

// ── the downloads ─────────────────────────────────────────────────────────────────────────────────────────────────

const pubDir = path.join(REPO, 'public/stories/how-households-took-over-the-bank-loan-book');
fs.mkdirSync(pubDir, { recursive : true });
const old = path.join(pubDir, 'rbi-bsr-table-3-2-occupation-credit.xlsx');
if (fs.existsSync(old)) fs.unlinkSync(old);   // the hand-saved workbook the earlier story offered; the CSVs replace it
const csv = (header, rows) => header.join(',') + '\n' + rows.map(r => r.map(v => (typeof v === 'string' && /[",\n]/.test(v)) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
const NOTE = 'RBI, BSR-1 quarterly Table 3.2, scheduled commercial banks excluding regional rural banks; counts are loan accounts, not people; amounts in ₹ crore';
fs.writeFileSync(path.join(pubDir, 'credit-by-borrower-class-quarterly.csv'), `# ${NOTE}\n` + csv(
    [ 'quarter', 'borrower_class', 'accounts', 'amount_outstanding_cr', 'share_of_all_credit_pct' ],
    QUARTERS.flatMap(q => [
        ...CLASS_KEYS.map(c => [ q.quarter, CLASS_LABELS[c], q.classes[c].accounts, q.classes[c].outstanding, r2(share(q, c)) ]),
        [ q.quarter, 'All borrowers', q.total.accounts, q.total.outstanding, 100 ],
    ])));
fs.writeFileSync(path.join(pubDir, 'individuals-by-gender-and-occupation-quarterly.csv'), `# ${NOTE}; credit to individuals only\n` + csv(
    [ 'quarter', 'occupation', 'accounts', 'amount_outstanding_cr', 'men_accounts', 'men_amount_outstanding_cr', 'women_accounts', 'women_amount_outstanding_cr' ],
    QUARTERS.flatMap(q => [
        ...OCC_KEYS.map(k => [ q.quarter, OCC_LABELS[k], q.occupations[k].all.accounts, q.occupations[k].all.outstanding, q._menByOcc[k].accounts, q._menByOcc[k].outstanding, q.occupations[k].women.accounts, q.occupations[k].women.outstanding ]),
        [ q.quarter, 'All occupations', q.classes.individuals.accounts, q.classes.individuals.outstanding, q.men.accounts, q.men.outstanding, q.women.accounts, q.women.outstanding ],
    ])));
fs.writeFileSync(path.join(pubDir, 'personal-loans-by-kind-quarterly.csv'), `# ${NOTE}; personal loans to individuals only\n` + csv(
    [ 'quarter', 'kind', 'accounts', 'amount_outstanding_cr', 'men_accounts', 'men_amount_outstanding_cr', 'women_accounts', 'women_amount_outstanding_cr' ],
    QUARTERS.flatMap(q => [
        ...PERSONAL_KEYS.map(k => [ q.quarter, PERSONAL_LABELS[k], q.personal[k].all.accounts, q.personal[k].all.outstanding, q._menByKind[k].accounts, q._menByKind[k].outstanding, q.personal[k].women.accounts, q.personal[k].women.outstanding ]),
        [ q.quarter, 'All personal loans', q.occupations.personal.all.accounts, q.occupations.personal.all.outstanding, q._menByOcc.personal.accounts, q._menByOcc.personal.outstanding, q.occupations.personal.women.accounts, q.occupations.personal.women.outstanding ],
    ])));
fs.writeFileSync(path.join(pubDir, 'cpi-general-index-quarterly.csv'), '# MoSPI consumer price index, general index, combined, base 2012 = 100, the last month of each quarter (DBIE report 610); months after December 2025 carried on by the base 2024 = 100 series\' year-on-year change (DBIE report 45)\n' + csv(
    [ 'quarter', 'cpi_general_index_combined', 'status' ],
    QUARTERS.map(q => [ q.quarter, CPI[q.quarter], cpiStatus[q.quarter] ])));

// ── report ────────────────────────────────────────────────────────────────────────────────────────────────────────

console.log(`${NAME}: ${QUARTERS.length} quarters (${SOURCE.from} to ${SOURCE.to}), ${MARCHES.length} Marches; self-check passed`);
passed.forEach(p => console.log('  ok  ' + p));
console.log(`  CPI ${CPI_LINKED.join(', ')} linked from base 2024 = 100: ${CPI_LINKED.map(k => `${k} ${CPI[k]}`).join(', ')}; prices ${prices}`);
console.log(`  wrote out/${NAME}.json, src/app/stories/how-households-took-over-the-bank-loan-book/data.gen.ts and 4 CSVs under public/stories/how-households-took-over-the-bank-loan-book/`);
