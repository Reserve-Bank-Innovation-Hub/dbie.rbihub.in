// DATA ================================================================================================================
// What the page derives from data.gen.ts, which data/processors/story-how-households-took-over-the-bank-loan-book.mjs emits from the quarterly
// Basic Statistical Return, Table 3.2 (DBIE report 958), the annual March 2026 Tables 3.2 and 1.11 (reports 1092 and
// 1137) and the consumer price index (report 610). Nothing here is typed by hand: every figure is read from QUARTERS,
// CPI or HEADLINE, so a refresh of the data rewrites the page.

export type { ClassKey, Money, OccKey, PersonalKey, Quarter } from "./data.gen";
export { CLASS_LABELS, CPI, CPI_LINKED, HEADLINE, OCC_LABELS, PERSONAL_LABELS, QUARTERS, RRB_2026, SOURCE } from "./data.gen";

import { CPI, HEADLINE, type OccKey, type PersonalKey, type Quarter, QUARTERS } from "./data.gen";

// THE WORDS ===========================================================================================================
const MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
// "2026-06" → "June 2026"
export const monthName = (key : string) => `${MONTHS[+key.slice(5, 7) - 1]} ${key.slice(0, 4)}`;
// "2026-06" → "Jun 2026", for axes and tables
export const shortMonth = (key : string) => `${MONTHS[+key.slice(5, 7) - 1].slice(0, 3)} ${key.slice(0, 4)}`;
export const yearOf = (key : string) => key.slice(0, 4);
// ₹ crore → "₹55.3 lakh crore"
export const lakhCrore = (crore : number, dp = 1) => `₹${(crore / 1e5).toFixed(dp)} lakh crore`;
// a count → "34.6 crore"
export const crore = (n : number, dp = 1) => `${(n / 1e7).toFixed(dp)} crore`;
// a ratio of two values → how people say it: "doubled", "nearly tripled", "grew 4.7 times"
export const timesWords = (x : number) => {
    if (x >= 1.9 && x < 2.1) return "doubled";
    if (x >= 2.75 && x < 2.9) return "nearly tripled";
    if (x >= 2.9 && x < 3.1) return "tripled";
    if (x >= 1.15 && x < 1.35) return `grew by about a ${x < 1.3 ? "quarter" : "third"}`;
    return `grew ${x.toFixed(1)} times`;
};
// a share to the nearest whole number, as said: 46.5 → "47"
export const whole = (v : number) => `${Math.round(v)}`;

// THE QUARTERS ========================================================================================================
// The span every multiple runs over is March to March: March 2015 (the first year DBIE has all four quarters of)
// to the latest March, as HEADLINE.growth is computed in the processor.
export const quarterAt = (key : string) : Quarter => {
    const q = QUARTERS.find(x => x.quarter === key);
    if (!q) throw new Error(`no quarter ${key} in QUARTERS`);
    return q;
};
export const FROM = quarterAt("2015-03");
export const TO = quarterAt(`${HEADLINE.marches[HEADLINE.marches.length - 1].year}-03`);
export const LATEST = quarterAt(HEADLINE.latest.quarter);

// A ₹ crore figure of quarter `key` in the rupees of the latest March, by the general index.
export const real = (crore : number, key : string) => crore * CPI[TO.quarter] / CPI[key];

// ₹ of every ₹100 lent, one decimal: the share as the processor rounds it.
export const in100 = (part : number, whole_ : number) => Math.round(1000 * part / whole_) / 10;

// BOTH SIDES MOVED ====================================================================================================
// Private companies and individuals, March 2015 and the latest March, in rupees of the day and of the latest March.
export const BOTH_SIDES = ([ "privateCompanies", "individuals" ] as const).map(k => ({
    key        : k,
    label      : k === "individuals" ? "Individuals" : "Private companies",
    thenNominal : FROM.classes[k].outstanding,
    nowNominal : TO.classes[k].outstanding,
    thenReal   : real(FROM.classes[k].outstanding, FROM.quarter),
    nowReal    : TO.classes[k].outstanding,
}));

// The swing between the two: individuals' share less private companies', March 2015 to the latest quarter, and the
// part of it that is companies' fall.
const FIRST = HEADLINE.marches.find(m => m.year === 2015) ?? HEADLINE.marches[0];
export const SWING = {
    individualsRise : HEADLINE.latest.individuals - FIRST.individuals,
    companiesFall   : FIRST.privateCompanies - HEADLINE.latest.privateCompanies,
};
export const companiesPartOfSwing = SWING.companiesFall / (SWING.individualsRise + SWING.companiesFall);

// The gap since its peak: whether it has narrowed, and to what in the latest quarter.
export const latestGap = Math.round(10 * (HEADLINE.latest.individuals - HEADLINE.latest.privateCompanies)) / 10;

// THE LATEST YEAR =====================================================================================================
// Why the gap has narrowed since its peak: growth of lending to private companies and to individuals in the year to
// the latest quarter, and in the year before that, with each group's share at the peak and now.
const yearBefore = (key : string) => `${+key.slice(0, 4) - 1}${key.slice(4)}`;
const grewPct = (key : string, k : "privateCompanies" | "individuals") =>
    100 * (quarterAt(key).classes[k].outstanding / quarterAt(yearBefore(key)).classes[k].outstanding - 1);
const shareIn = (key : string, k : "privateCompanies" | "individuals") => 100 * quarterAt(key).classes[k].outstanding / quarterAt(key).total.outstanding;
export const LATEST_YEAR = {
    companies         : grewPct(HEADLINE.latest.quarter, "privateCompanies"),
    companiesBefore   : grewPct(yearBefore(HEADLINE.latest.quarter), "privateCompanies"),
    individuals       : grewPct(HEADLINE.latest.quarter, "individuals"),
    companiesAtPeak   : shareIn(HEADLINE.gapPeak.quarter, "privateCompanies"),
    individualsAtPeak : shareIn(HEADLINE.gapPeak.quarter, "individuals"),
};

// THE HDFC MERGER =====================================================================================================
// HDFC, a housing finance company, merged into HDFC Bank on 1 July 2023, and its loans joined the banks' returns from
// the September 2023 quarter. The quarter before and the quarter of the merger, for individuals' share and home loans.
export const MERGER = (() => {
    const before = quarterAt("2023-06"), after = quarterAt("2023-09");
    return {
        before, after,
        individualsBefore : shareIn(before.quarter, "individuals"),
        individualsAfter  : shareIn(after.quarter, "individuals"),
        housingGrowth     : 100 * (after.personal.housing.all.outstanding / before.personal.housing.all.outstanding - 1),
    };
})();

// MORE LOANS ==========================================================================================================
// Individuals' accounts, money and money in the latest March's rupees, each indexed to March 2015 = 100, every
// quarter from March 2015.
const fromIndex = QUARTERS.indexOf(FROM);
export const INDEX = QUARTERS.slice(fromIndex).map(q => ({
    key      : q.quarter,
    accounts : 100 * q.classes.individuals.accounts / FROM.classes.individuals.accounts,
    money    : 100 * q.classes.individuals.outstanding / FROM.classes.individuals.outstanding,
    real     : 100 * (q.classes.individuals.outstanding / CPI[q.quarter]) / (FROM.classes.individuals.outstanding / CPI[FROM.quarter]),
}));

// WHAT THE HOUSEHOLD BORROWS FOR ======================================================================================
// Individuals' ₹100 by occupation, with personal loans split into their six kinds, in the order the bar draws them.
export const PERSONAL_ORDER : PersonalKey[] = [ "housing", "otherPersonal", "vehicles", "cards", "education", "durables" ];
export const OCC_ORDER : OccKey[] = [ "agriculture", "trade", "services", "industry", "transport", "finance", "others" ];
export const mixOf = (q : Quarter) => {
    const all = q.classes.individuals.outstanding;
    return [
        ...PERSONAL_ORDER.map(k => ({ key : k, personal : true, value : 100 * q.personal[k].all.outstanding / all })),
        ...OCC_ORDER.map(k => ({ key : k, personal : false, value : 100 * q.occupations[k].all.outstanding / all })),
    ];
};

// WOMEN ===============================================================================================================
// Women's accounts (crore) and their shares of individuals' accounts and money, every quarter.
export const WOMEN_SERIES = QUARTERS.map(q => ({
    key           : q.quarter,
    accounts      : q.women.accounts,
    accountsShare : 100 * q.women.accounts / q.classes.individuals.accounts,
    moneyShare    : 100 * q.women.outstanding / q.classes.individuals.outstanding,
}));

// Women's share of the money lent to individuals, by occupation, March 2015 and the latest March. An occupation
// under 1% of individuals' credit in either year is folded into "All others": the Finance row is ₹0.5 of every ₹100
// and swings from year to year, so two single years of it say nothing.
const small = (k : OccKey) => k !== "others" && (HEADLINE.occupations.y2015[k].ofIndividuals < 1 || HEADLINE.occupations.y2026[k].ofIndividuals < 1);
export const FOLDED : OccKey[] = (Object.keys(HEADLINE.occupations.y2015) as OccKey[]).filter(small);
const womenShareOf = (q : Quarter, keys : OccKey[]) => {
    const women = keys.reduce((s, k) => s + q.occupations[k].women.outstanding, 0);
    const all = keys.reduce((s, k) => s + q.occupations[k].all.outstanding, 0);
    return 100 * women / all;
};
export const SLOPE = (Object.keys(HEADLINE.occupations.y2015) as OccKey[])
    .filter(k => !small(k))
    .map(k => {
        const keys = k === "others" ? [ "others" as OccKey, ...FOLDED ] : [ k ];
        return { key : k, then : womenShareOf(FROM, keys), now : womenShareOf(TO, keys) };
    })
    .sort((a, b) => b.now - a.now);
