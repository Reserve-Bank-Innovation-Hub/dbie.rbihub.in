// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-the-two-lakh-line.mjs writes
// from the scraped BSR tables (the table ids are in its header). Nothing numeric is typed by hand; the prose in
// page.client.tsx and the stage read these constants, so a refresh of the data refreshes the sentences and the dots.

export type {
    Band, BankGroupQuarter, CardsQuarter, District, DistrictYear, PopGroupYear, SmallPurposeChange, SmallQuarter, StateRow,
    StateSmall, Walr, WomenDistrict, WomenState,
} from "./data.gen";
export {
    BANDS, BANK_GROUPS, DISTRICT_HISTORY, DISTRICTS, ENTRY, POP_GROUPS, RATE_2014, RATE_OCCUPATIONS, RATE_RANGES, SANCTION,
    SMALL_CARDS, SMALL_PURPOSE, SMALL_PURPOSE_CHANGE, SMALL_SERIES, STATE_SMALL, STATES, TOP_SERIES, TOTAL_RATE, TOTALS,
    WALR, WOMEN_DISTRICT_COUNTS, WOMEN_DISTRICTS_FALLS, WOMEN_DISTRICTS_RISES, WOMEN_STATES, WOMEN_TOTAL,
} from "./data.gen";

import {
    BANDS, DISTRICTS, POP_GROUPS, RATE_OCCUPATIONS, SMALL_PURPOSE_CHANGE, SMALL_SERIES, STATES, TOTAL_RATE,
    WOMEN_DISTRICT_COUNTS, WOMEN_DISTRICTS_FALLS, WOMEN_STATES, WOMEN_TOTAL,
} from "./data.gen";

// The line: a sanctioned limit of ₹2 lakh, DBIE's definition of a small borrowal account.
export const LINE_INR = 200000;

// FORMATTING ==========================================================================================================
const IN = "en-IN";
export const inr       = (n : number) => n.toLocaleString(IN, { maximumFractionDigits : 0 });
export const pct       = (v : number, dp = 1) => `${v.toFixed(dp)}%`;
// A count in crore: 262430617 → "26.2 crore"; below a crore, in lakh.
export const crore     = (n : number, dp = 1) => n >= 1e7 ? `${(n / 1e7).toFixed(dp)} crore` : `${(n / 1e5).toFixed(dp)} lakh`;
export const croreN    = (n : number, dp = 1) => (n / 1e7).toFixed(dp);
// An amount given in ₹ crore, as ₹ lakh crore: 1277476 → "₹12.8 lakh crore".
export const lakhCrore = (rsCrore : number, dp = 1) => `₹${(rsCrore / 1e5).toFixed(dp)} lakh crore`;
// "twice" when a ratio rounds to two, else "2.4 times".
export const times     = (r : number) => r >= 1.85 && r <= 2.15 ? "twice" : `${r.toFixed(1)} times`;
// Rupees in every hundred, without a trailing ".0": 5.0 → "5", 7.2 → "7.2".
export const in100     = (v : number) => v.toFixed(1).replace(/\.0$/, "");
// A rupee amount, in the unit that reads: ₹56,000 / ₹2.4 lakh / ₹28 crore.
export const rupees = (n : number) => {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)} crore`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)} lakh`;
    return `₹${inr(Math.round(n / 100) * 100)}`;
};
// A quarter in full: "Jun 2017" → "June 2017".
export const monthName = (quarter : string) => {
    const [ m, y ] = quarter.split(" ");
    return `${({ Mar : "March", Jun : "June", Sep : "September", Dec : "December" } as Record<string, string>)[m] ?? m} ${y}`;
};
// "A", "A and B", "A, B and C".
export const list = (xs : string[]) => xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const WORDS = [ "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve" ];
// A span of months in words: 18 → "a year and a half", 90 → "seven and a half years", 24 → "two years".
export const span = (months : number) => {
    const halves = Math.round(months / 6);
    const whole = Math.floor(halves / 2), half = halves % 2 === 1;
    if (whole === 0) return half ? "half a year" : "under a quarter";
    if (whole === 1) return half ? "a year and a half" : "a year";
    return `${WORDS[whole] ?? whole} ${half ? "and a half " : ""}years`;
};

const NUMBER_WORDS = [
    "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
    "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two",
    "twenty-three", "twenty-four",
];
// A whole number in words up to twenty-four, in figures after that.
export const numberWord = (n : number) => NUMBER_WORDS[n] ?? inr(n);
// Months in words: 18 → "eighteen months"; past two years, as span() puts it.
export const monthsWords = (months : number) => (months <= 24 ? `${numberWord(months)} months` : span(months));
// A ratio as a reader says it: 2.47 → "two and a half times", 2.09 → "twice", 3.8 → "3.8 times".
export const timesWords = (r : number) => {
    const halves = Math.round(r * 2);
    if (Math.abs(r - halves / 2) > 0.15 || halves < 3) return `${r.toFixed(1)} times`;
    const whole = Math.floor(halves / 2), half = halves % 2 === 1;
    if (whole === 2 && !half) return "twice";
    return `${NUMBER_WORDS[whole] ?? whole}${half ? " and a half" : ""} times`;
};
// A share of a hundred as the nearest simple fraction, with the noun it counts: (65.1, "loans") → "nearly two in
// every three loans", (48.4, "loans") → "nearly half of all loans", (71.1, "loans") → "seven in every ten loans".
const FRACTIONS : [ number, string ][] = [
    [ 25, "one in every four" ], [ 100 / 3, "one in every three" ], [ 50, "half" ], [ 200 / 3, "two in every three" ],
    [ 75, "three in every four" ],
    ...[ 1, 2, 3, 4, 6, 7, 8, 9 ].map(k => [ 10 * k, `${NUMBER_WORDS[k]} in every ten` ] as [ number, string ]),
];
export const shareOf = (v : number, noun : string) => {
    const [ at, words ] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - v) < Math.abs(best[0] - v) ? f : best));
    const lead = v - at <= -1 ? "nearly " : v - at >= 1 ? "more than " : "";
    return words === "half" ? `${lead}half of all ${noun}` : `${lead}${words} ${noun}`;
};

// Largest-remainder rounding: whole counts in proportion to `weights` that always sum to `total`.
export const largestRemainder = (weights : number[], total : number) : number[] => {
    const w = weights.reduce((s, v) => s + v, 0);
    if (!w) return weights.map(() => 0);
    const raw = weights.map(v => (v / w) * total);
    const out = raw.map(Math.floor);
    const left = total - out.reduce((s, v) => s + v, 0);
    raw.map((v, i) => [ v - out[i], i ] as const)
       .sort((a, b) => b[0] - a[0] || a[1] - b[1])
       .slice(0, left)
       .forEach(([ , i ]) => out[i]++);
    return out;
};

const sum = (xs : number[]) => xs.reduce((s, v) => s + v, 0);

// THE BANDS ===========================================================================================================
// Readable names for Table 1.8's thirteen bands, smallest first, the order of BANDS; short ones for a phone.
export const BAND_NAMES = [
    "up to ₹25,000", "₹25,000 to ₹2 lakh", "₹2 to 5 lakh", "₹5 to 10 lakh", "₹10 to 25 lakh", "₹25 to 50 lakh",
    "₹50 lakh to ₹1 crore", "₹1 to 4 crore", "₹4 to 6 crore", "₹6 to 10 crore", "₹10 to 25 crore", "₹25 to 100 crore",
    "above ₹100 crore",
];
export const BAND_SHORT = [
    "≤₹25k", "₹25k–2L", "₹2–5L", "₹5–10L", "₹10–25L", "₹25–50L", "₹50L–1cr", "₹1–4cr", "₹4–6cr", "₹6–10cr",
    "₹10–25cr", "₹25–100cr", ">₹100cr",
];
// The bands at or below the line.
export const BELOW_BANDS = BANDS.map((b, i) => (b.hi !== null && b.hi <= LINE_INR ? i : -1)).filter(i => i >= 0);
export const isBelow = (i : number) => BELOW_BANDS.includes(i);

export const BOOK = {
    accounts    : sum(BANDS.map(b => b.accounts)),
    outstanding : sum(BANDS.map(b => b.outstanding)),   // ₹ crore
};

const bandsTo5L = BANDS.filter(b => b.hi !== null && b.hi <= 500000);
const topBand   = BANDS[BANDS.length - 1];

// The two sides of the line, March 2026, all scheduled commercial banks including regional rural banks.
export const BELOW = {
    accounts         : sum(BELOW_BANDS.map(i => BANDS[i].accounts)),
    outstanding      : sum(BELOW_BANDS.map(i => BANDS[i].outstanding)),
    accountShare     : 100 * sum(BELOW_BANDS.map(i => BANDS[i].accounts)) / BOOK.accounts,
    outstandingShare : 100 * sum(BELOW_BANDS.map(i => BANDS[i].outstanding)) / BOOK.outstanding,
};
export const TO_FIVE_LAKH = {
    accounts    : sum(bandsTo5L.map(b => b.accounts)),
    outstanding : sum(bandsTo5L.map(b => b.outstanding)),
};
export const TOP = {
    accounts         : topBand.accounts,
    outstanding      : topBand.outstanding,
    outstandingShare : 100 * topBand.outstanding / BOOK.outstanding,
    weightedRate     : topBand.weightedRate ?? 0,
    amtBelow8        : topBand.amtBelow8 ?? 0,
};
export const SMALLEST = {
    weightedRate : BANDS[0].weightedRate ?? 0,
    amtAtLeast13 : BANDS[0].amtAtLeast13 ?? 0,
    accAtLeast13 : BANDS[0].accAtLeast13 ?? 0,
};

// The rupee of every hundred a band holds, and of every hundred accounts.
export const bandShares = (i : number) => ({
    accounts    : 100 * BANDS[i].accounts / BOOK.accounts,
    outstanding : 100 * BANDS[i].outstanding / BOOK.outstanding,
    averageLoan : BANDS[i].outstanding * 1e7 / BANDS[i].accounts,
});

// THE PRICE ===========================================================================================================
// Table 2.1's ten rate ranges fall into three classes on the page: under 8%, 8 to 13%, and 13% or more.
export const RATE_CLASSES = [ "under 8%", "8 to 13%", "13% or more" ] as const;
export const rateClass = (range : number) => (range <= 3 ? 0 : range <= 8 ? 1 : 2);
const classTotals = (arr : number[]) => [ 0, 1, 2 ].map(c => arr.reduce((t, v, i) => (rateClass(i) === c ? t + v : t), 0));

const belowMoneyByRange = BELOW_BANDS.map(i => BANDS[i].rateOutstanding).reduce((acc, a) => acc.map((v, k) => v + a[k]), Array(10).fill(0));
export const PRICE = {
    // the whole book, by accounts and by amount
    accountsAt13     : 100 * TOTAL_RATE.rateAccounts[9] / sum(TOTAL_RATE.rateAccounts),
    moneyAt13        : 100 * TOTAL_RATE.rateOutstanding[9] / sum(TOTAL_RATE.rateOutstanding),
    // below the line and at the very top, by amount
    belowMoneyAt13   : 100 * belowMoneyByRange[9] / sum(belowMoneyByRange),
    // below the line, the money lent at 7 to 9% (Table 2.1's 7–8% and 8–9% ranges), much of it crop loans at 7%
    below7to9        : 100 * (belowMoneyByRange[3] + belowMoneyByRange[4]) / sum(belowMoneyByRange),
    topMoneyUnder8   : 100 * sum(topBand.rateOutstanding.slice(0, 4)) / sum(topBand.rateOutstanding),
    // credit cards among the accounts that pay 13% or more (Table 3.3)
    cardsAt13        : RATE_OCCUPATIONS.creditCards.accounts[9],
    allAt13          : RATE_OCCUPATIONS.total.accounts[9],
    farmAt13Share    : 100 * RATE_OCCUPATIONS.agriculture.accounts[9] / sum(RATE_OCCUPATIONS.agriculture.accounts),
};

// THE STAGE ===========================================================================================================
// One dot is ten lakh accounts in the opening scenes; the loan dots are then re-weighed by money, and in the quarterly
// scenes one dot is a crore accounts below the line.
export const DOT_ACCOUNTS = 1e6;

// The Reserve Bank's population groups, in the words a reader uses: rural centres have fewer than 10,000 people,
// semi-urban under a lakh, urban under ten lakh, and metropolitan ten lakh or more.
export const PLACES = [ "Villages", "Small towns", "Cities", "Big cities" ] as const;

const pop26 = POP_GROUPS[POP_GROUPS.length - 1];
const groupRows = [
    [ PLACES[0], pop26.rural ], [ PLACES[1], pop26.semiUrban ], [ PLACES[2], pop26.urban ], [ PLACES[3], pop26.metro ],
] as const;

// The loan dots: one per ten lakh loan accounts in Table 1.8, 403 of them.
export const LOAN_DOTS = Math.round(BOOK.accounts / DOT_ACCOUNTS);
const loanDotsByGroup = largestRemainder(groupRows.map(([ , g ]) => g.creditAccounts), LOAN_DOTS);
export const STAGE_GROUPS = groupRows.map(([ label, g ], i) => ({
    label,
    depositAccounts : g.depositAccounts * 1e3,
    creditAccounts  : g.creditAccounts * 1e3,
    depositDots     : Math.round((g.depositAccounts * 1e3) / DOT_ACCOUNTS),
    loanDots        : loanDotsByGroup[i],
    ratio           : g.depositAccounts / g.creditAccounts,
    depositShare    : 100 * g.depositOutstanding / sum(groupRows.map(([ , x ]) => x.depositOutstanding)),
    creditShare     : 100 * g.creditOutstanding / sum(groupRows.map(([ , x ]) => x.creditOutstanding)),
}));
export const DEPOSIT_DOTS = sum(STAGE_GROUPS.map(g => g.depositDots));

export const SAVE_BORROW = {
    year            : pop26.year,
    depositAccounts : sum(STAGE_GROUPS.map(g => g.depositAccounts)),
    creditAccounts  : sum(STAGE_GROUPS.map(g => g.creditAccounts)),
    rows            : STAGE_GROUPS,
    // deposit accounts for every person, the people being the states' populations derived from their income series
    perPerson       : sum(STAGE_GROUPS.map(g => g.depositAccounts)) / sum(STATES.map(x => x.population ?? 0)),
};

// The loan dots by band, counted by accounts and weighed by money; each always sums to LOAN_DOTS.
export const BAND_DOTS = {
    accounts : largestRemainder(BANDS.map(b => b.accounts), LOAN_DOTS),
    money    : largestRemainder(BANDS.map(b => b.outstanding), LOAN_DOTS),
};
// Within a band, how many of its dots fall in each rate class, by accounts and by money.
export const BAND_HEAT = {
    accounts : BANDS.map((b, i) => largestRemainder(classTotals(b.rateAccounts), BAND_DOTS.accounts[i])),
    money    : BANDS.map((b, i) => largestRemainder(classTotals(b.rateOutstanding), BAND_DOTS.money[i])),
};
export const DOTS_BELOW = {
    accounts : sum(BELOW_BANDS.map(i => BAND_DOTS.accounts[i])),
    money    : sum(BELOW_BANDS.map(i => BAND_DOTS.money[i])),
};

// THE SERIES ==========================================================================================================
export const smallShare = (s : typeof SMALL_SERIES[number]) => 100 * s.total.small / s.total.accounts;
export const moneyShare = (s : typeof SMALL_SERIES[number]) => 100 * s.total.smallOutstanding / s.total.outstanding;

export const seriesAt = (key : string) => {
    const i = SMALL_SERIES.findIndex(s => s.key === key);
    if (i < 0) throw new Error(`no quarter ${key} in SMALL_SERIES`);
    return { index : i, ...SMALL_SERIES[i] };
};
export const Q_FIRST = SMALL_SERIES[0];
export const Q_PEAK  = SMALL_SERIES.reduce((best, s) => (s.total.small > best.total.small ? s : best), SMALL_SERIES[0]);
export const Q_LAST  = SMALL_SERIES[SMALL_SERIES.length - 1];
export const PEAK_INDEX = SMALL_SERIES.indexOf(Q_PEAK);

// The quarterly scenes: one dot per crore accounts below the line, the fraction as a part-lit top dot.
export const SERIES_DOTS = SMALL_SERIES.map(s => {
    const v = s.total.small / 1e7;
    return { key : s.key, quarter : s.quarter, whole : Math.floor(v), frac : v - Math.floor(v), value : v, share : moneyShare(s), borrowers : smallShare(s) };
});

const monthsBetween = (a : string, b : string) => {
    const [ ya, ma ] = a.split("-").map(Number), [ yb, mb ] = b.split("-").map(Number);
    return (yb - ya) * 12 + (mb - ma);
};
const aboveLine = (s : typeof SMALL_SERIES[number]) => s.total.accounts - s.total.small;
export const SERIES = {
    first      : Q_FIRST,
    peak       : Q_PEAK,
    last       : Q_LAST,
    fewer      : Q_PEAK.total.small - Q_LAST.total.small,
    growth     : Q_PEAK.total.small / Q_FIRST.total.small,
    doubling   : Q_LAST.total.small / Q_FIRST.total.small,
    riseMonths : monthsBetween(Q_FIRST.key, Q_PEAK.key),
    fallMonths : monthsBetween(Q_PEAK.key, Q_LAST.key),
    aboveRise  : aboveLine(Q_LAST) - aboveLine(Q_PEAK),
    // loan accounts of every size, peak to latest, by population group
    totalChange : {
        rural     : Q_LAST.rural.accounts - Q_PEAK.rural.accounts,
        semiUrban : Q_LAST.semiUrban.accounts - Q_PEAK.semiUrban.accounts,
        urban     : Q_LAST.urban.accounts - Q_PEAK.urban.accounts,
        metro     : Q_LAST.metro.accounts - Q_PEAK.metro.accounts,
    },
};

// Where the accounts went, the peak against the latest quarter, by population group and by purpose.
const grp = (g : "rural" | "semiUrban" | "urban" | "metro") => ({ then : Q_PEAK[g].small, now : Q_LAST[g].small });
const purpose = (group : string, name : string) => {
    const r = SMALL_PURPOSE_CHANGE.find(x => x.group === group && x.purpose === name);
    if (!r) throw new Error(`no ${group} / ${name} in SMALL_PURPOSE_CHANGE`);
    return { then : r.accountsThen, now : r.accountsNow };
};
export const WHERE_THEY_WENT = {
    from   : Q_PEAK.quarter,
    to     : Q_LAST.quarter,
    groups : [
        { key : "rural",     label : PLACES[0], ...grp("rural") },
        { key : "semiUrban", label : PLACES[1], ...grp("semiUrban") },
        { key : "urban",     label : PLACES[2], ...grp("urban") },
        { key : "metro",     label : PLACES[3], ...grp("metro") },
    ],
    purposes : [
        { key : "farm",     label : "Farm loans, villages",          ...purpose("rural", "Agriculture") },
        { key : "durables", label : "Consumer durables, big cities", ...purpose("metro", "Consumer durables") },
        { key : "cards",    label : "Credit cards, big cities",      ...purpose("metro", "Credit cards") },
        { key : "personal", label : "Other personal loans, cities",  ...purpose("urban", "Other personal loans") },
    ],
};

// WOMEN ===============================================================================================================
const wq = (key : string) => {
    const w = WOMEN_TOTAL.find(x => x.key === key);
    if (!w) throw new Error(`no quarter ${key} in WOMEN_TOTAL`);
    return w;
};
const womenChange = (s : typeof WOMEN_STATES[number]) => 100 * (s.women2026 - s.women2024) / s.women2024;
const comparableStates = WOMEN_STATES.filter(s => s.comparable);
const notMumbai = (d : typeof WOMEN_DISTRICTS_FALLS[number]) => !/^Mumbai/.test(d.district);
const fallsOutsideMumbai = WOMEN_DISTRICTS_FALLS.filter(notMumbai);
export const WOMEN = {
    then      : wq("2024-03"),
    now       : wq("2026-06"),
    thenCount : wq("2024-03").women * 1e3,
    nowCount  : wq("2026-06").women * 1e3,
    districts : WOMEN_DISTRICT_COUNTS,
    // the states the bar chart draws: those with a March 2024 to compare with, and a change of half a lakh or more
    rows : comparableStates.filter(s => Math.abs(s.women2026 - s.women2024) >= 50).map(s => ({
        key    : s.name,
        label  : s.name,
        value  : (s.women2026 - s.women2024) / 100,           // lakh accounts
        change : womenChange(s),
        then   : s.women2024 * 1e3,
        now    : s.women2026 * 1e3,
    })),
    state : (name : string) => {
        const s = WOMEN_STATES.find(x => x.name === name);
        if (!s) throw new Error(`no state ${name} in WOMEN_STATES`);
        return { ...s, change : womenChange(s) };
    },
    // states of ten lakh women borrowers or more, by how far they fell or rose
    fallers : comparableStates.filter(s => s.women2024 >= 1000 && womenChange(s) <= -20).sort((a, b) => womenChange(a) - womenChange(b)).map(s => ({ name : s.name, change : womenChange(s) })),
    risers  : comparableStates.filter(s => s.women2024 >= 1000 && womenChange(s) >= 5).sort((a, b) => womenChange(b) - womenChange(a)).map(s => ({ name : s.name, change : womenChange(s) })),
    // of the ten districts outside Mumbai that lost the most, how many had women as most of their borrowers
    topFallsOutsideMumbai : fallsOutsideMumbai.slice(0, 10).length,
    majorityWomenOfThem   : fallsOutsideMumbai.slice(0, 10).filter(d => d.womenShare2026 >= 50).length,
};

// DISTRICTS ===========================================================================================================
const distOut = sum(DISTRICTS.map(d => d.outstanding));
const distAcc = sum(DISTRICTS.map(d => d.accounts));
const topN = (n : number) => ({
    outstandingShare : 100 * sum(DISTRICTS.slice(0, n).map(d => d.outstanding)) / distOut,
    accountShare     : 100 * sum(DISTRICTS.slice(0, n).map(d => d.accounts)) / distAcc,
});
// The long tail: districts with under a twentieth of a per cent of the money each.
const tail = DISTRICTS.filter(d => 100 * d.outstanding / distOut < 0.05);
let running = 0;
export const DISTRICT_SHARES = {
    count : DISTRICTS.length,
    top5  : topN(5),
    top10 : topN(10),
    top20 : topN(20),
    tail  : {
        count            : tail.length,
        outstandingShare : 100 * sum(tail.map(d => d.outstanding)) / distOut,
        accountShare     : 100 * sum(tail.map(d => d.accounts)) / distAcc,
    },
    // largest first, with the running share of all credit
    shares : DISTRICTS.map(d => {
        running += d.outstanding;
        return { ...d, outstandingShare : 100 * d.outstanding / distOut, accountShare : 100 * d.accounts / distAcc, cumulative : 100 * running / distOut };
    }),
};

// Mumbai's two districts, Mumbai and Mumbai Suburban, as a share of all the credit used in Maharashtra.
const inMaharashtra = DISTRICTS.filter(d => d.state === "Maharashtra");
export const MUMBAI_IN_MAHARASHTRA = 100 * sum(inMaharashtra.filter(d => /^Mumbai/.test(d.district)).map(d => d.outstanding))
    / sum(inMaharashtra.map(d => d.outstanding));

// STATES ==============================================================================================================
export const stateNamed = (name : string) => {
    const s = STATES.find(x => x.name === name);
    if (!s) throw new Error(`no state ${name} in STATES`);
    return s;
};

// The tile map: the 28 states, Delhi, and Jammu & Kashmir, each a square in roughly its place (column 0 is the west,
// row 0 the north). The smaller union territories are left off the maps; their figures stay in the downloads.
export const TILES : { name : string; code : string; col : number; row : number }[] = [
    { name : "Jammu & Kashmir",   code : "JK", col : 1, row : 0 },
    { name : "Punjab",            code : "PB", col : 0, row : 1 },
    { name : "Himachal Pradesh",  code : "HP", col : 1, row : 1 },
    { name : "Uttarakhand",       code : "UK", col : 2, row : 1 },
    { name : "Arunachal Pradesh", code : "AR", col : 7, row : 1 },
    { name : "Haryana",           code : "HR", col : 0, row : 2 },
    { name : "Delhi",             code : "DL", col : 1, row : 2 },
    { name : "Uttar Pradesh",     code : "UP", col : 2, row : 2 },
    { name : "Bihar",             code : "BR", col : 3, row : 2 },
    { name : "Sikkim",            code : "SK", col : 4, row : 2 },
    { name : "Assam",             code : "AS", col : 6, row : 2 },
    { name : "Nagaland",          code : "NL", col : 7, row : 2 },
    { name : "Rajasthan",         code : "RJ", col : 0, row : 3 },
    { name : "Madhya Pradesh",    code : "MP", col : 1, row : 3 },
    { name : "Chhattisgarh",      code : "CG", col : 2, row : 3 },
    { name : "Jharkhand",         code : "JH", col : 3, row : 3 },
    { name : "West Bengal",       code : "WB", col : 4, row : 3 },
    { name : "Meghalaya",         code : "ML", col : 6, row : 3 },
    { name : "Manipur",           code : "MN", col : 7, row : 3 },
    { name : "Gujarat",           code : "GJ", col : 0, row : 4 },
    { name : "Maharashtra",       code : "MH", col : 1, row : 4 },
    { name : "Telangana",         code : "TG", col : 2, row : 4 },
    { name : "Odisha",            code : "OD", col : 3, row : 4 },
    { name : "Tripura",           code : "TR", col : 6, row : 4 },
    { name : "Mizoram",           code : "MZ", col : 7, row : 4 },
    { name : "Goa",               code : "GA", col : 0, row : 5 },
    { name : "Karnataka",         code : "KA", col : 1, row : 5 },
    { name : "Andhra Pradesh",    code : "AP", col : 2, row : 5 },
    { name : "Kerala",            code : "KL", col : 1, row : 6 },
    { name : "Tamil Nadu",        code : "TN", col : 2, row : 6 },
];

// The states drawn as bars under the access map: a population of a crore or more and an income series.
export const STATE_ROWS = STATES.filter(s => s.population !== null && s.population >= 1e7 && s.accountsPer100 !== null);
