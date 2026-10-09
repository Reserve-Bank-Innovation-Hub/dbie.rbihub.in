// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-rupee-and-world.mjs
// writes from the scraped DBIE series (its header names them). Nothing numeric is typed by hand; the prose in
// page.client.tsx, the stage and the charts read these constants.

export { BASKET, EVENTS, HEADLINE, MONTHS, RATES, SERIES, USD, YEARLY } from "./data.gen";
import { BASKET, HEADLINE, MONTHS, SERIES, USD } from "./data.gen";

// FORMATTING ==========================================================================================================
const IN = "en-IN";
export const inr   = (n : number, dp = 0) => n.toLocaleString(IN, { minimumFractionDigits : dp, maximumFractionDigits : dp });
export const pct   = (v : number, dp = 0) => `${Math.abs(v).toFixed(dp)}%`;
export const idx1  = (v : number) => v.toFixed(1);
const MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const MONTH_SHORT = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
// "2024-11" → "November 2024"; short → "Nov 2024".
export const monthName  = (k : string) => `${MONTH_NAMES[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
export const monthShort = (k : string) => `${MONTH_SHORT[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
// Months between two "YYYY-MM" keys.
export const monthsBetween = (a : string, b : string) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7));

// DERIVED =============================================================================================================
export type Basket = "40t" | "40e" | "6";
export const SERIES_OF : Record<Basket, { neer : number[]; reer : number[]; label : string; short : string }> = {
    "40t" : { neer : SERIES.neer40t, reer : SERIES.reer40t, label : "40 currencies, trade weights", short : "40, trade" },
    "40e" : { neer : SERIES.neer40e, reer : SERIES.reer40e, label : "40 currencies, export weights", short : "40, exports" },
    "6"   : { neer : SERIES.neer6,   reer : SERIES.reer6,   label : "6 currencies, trade weights", short : "6, trade" },
};

// The price term the two headline indices imply: REER ÷ NEER × 100, India's prices against its partners'.
export const REL : number[] = SERIES.reer40t.map((r, i) => 100 * r / SERIES.neer40t[i]);
// What one rupee bought in US cents, month by month.
export const CENTS : number[] = USD.map(v => 100 / (v as number));

export const N = MONTHS.length;
export const iOf = (k : string) => MONTHS.indexOf(k);
export const FIRST = HEADLINE.first, LAST = HEADLINE.last;

// The rise in India's prices relative to its partners' over the run, per cent.
export const REL_RISE = 100 * (HEADLINE.rel.to / HEADLINE.rel.from - 1);
// The swing: months from the real rate's recent peak to its low.
export const SWING_MONTHS = monthsBetween(HEADLINE.swing.peakMonth, HEADLINE.swing.troughMonth);
export const CENTS_FROM = CENTS[0], CENTS_TO = CENTS[N - 1];

// The basket by weight, heaviest first (RBI's 2015-16 trade weights).
export const PARTNERS = BASKET ? [ ...BASKET.partners ].sort((a, b) => b.weight - a.weight) : [];
export const WEIGHT_SUM = PARTNERS.reduce((s, p) => s + p.weight, 0);

// THE OPENING'S CHARTS ================================================================================================
// The four lines of the opening, each in the units its card quotes: rupees for one US dollar, and the Reserve Bank's
// own indices on its base, 2015-16 = 100 (the nominal and real indices, and the price term they imply).
export const LINES = {
    usd  : USD as number[],
    neer : SERIES.neer40t,
    rel  : REL,
    reer : SERIES.reer40t,
};
export type Line = keyof typeof LINES;
// The same four as prices that all start at 100 in the first month and rise the same way: what the dollars ₹100
// bought then cost now; what a basket of the 40 currencies that cost ₹100 then costs now (the NEER turned into a price,
// its first value over each month's); India's prices against its partners'; and what Indian goods cost abroad (the
// REER). The last is exactly the third over the second: REER ÷ REER₀ = (REL ÷ REL₀) ÷ (NEER₀ ÷ NEER).
const from100 = (xs : number[]) => xs.map(v => 100 * v / xs[0]);
export const COST : Record<Line, number[]> = {
    usd  : from100(USD as number[]),
    neer : SERIES.neer40t.map(v => 100 * SERIES.neer40t[0] / v),
    rel  : from100(REL),
    reer : from100(SERIES.reer40t),
};
// The band the real rate stayed in: on the price scale (April 2004 = 100) and on the Reserve Bank's index.
export const BAND = { lo : Math.min(...COST.reer), hi : Math.max(...COST.reer) };
// The dollar against the basket: the month after which dollars that were worth ₹100 in April 2004 always cost more than
// the basket (the lines' last crossing), and how much more they cost in the latest month, per cent.
const lastBasketAbove = COST.neer.reduce((k, v, i) => (v > COST.usd[i] ? i : k), -1);
export const CROSS = lastBasketAbove + 1;
export const DOLLAR_GAP = 100 * (COST.usd[COST.usd.length - 1] / COST.neer[COST.neer.length - 1] - 1);
// The two halves side by side, India's prices against the basket: the month their gap was widest (prices ahead), and
// the first month after it that the basket caught up.
export const HALVES_PEAK = COST.rel.reduce((k, v, i) => (v - COST.neer[i] > COST.rel[k] - COST.neer[k] ? i : k), 0);
export const HALVES_MEET = COST.rel.findIndex((v, i) => i > HALVES_PEAK && COST.neer[i] >= v);
export const BAND_RBI = { lo : Math.min(...SERIES.reer40t), hi : Math.max(...SERIES.reer40t) };

// THE BASKET BY REGION ================================================================================================
// The 40 partners in six regions, by RBI's currency code; every partner is in exactly one, which is checked here.
export const REGIONS : { key : string; label : string; codes : string[] }[] = [
    { key : "east",     label : "East Asia and the Pacific", codes : [ "CNY", "HKD", "IDR", "SGD", "KRW", "JPY", "MYR", "THB", "VND", "TWD", "AUD" ] },
    { key : "west",     label : "West Asia",                 codes : [ "AED", "SAR", "IQD", "KWD", "QAR", "IRR", "OMR", "ILS" ] },
    { key : "americas", label : "The Americas",              codes : [ "USD", "BRL", "MXN", "CAD", "CLP" ] },
    { key : "europe",   label : "Europe",                    codes : [ "EUR", "CHF", "GBP", "RUB", "TRY", "UAH" ] },
    { key : "africa",   label : "Africa",                    codes : [ "NGN", "ZAR", "AOA", "EGP", "KES", "TZS", "GHS" ] },
    { key : "south",    label : "South Asia",                codes : [ "BDT", "LKR", "NPR" ] },
];
const regionCodes = REGIONS.flatMap(r => r.codes);
if (PARTNERS.length && (regionCodes.length !== PARTNERS.length || PARTNERS.some(p => !regionCodes.includes(p.iso)))) {
    throw new Error("REGIONS must hold each of the 40 partners exactly once");
}
export const weightOf = (codes : string[]) => PARTNERS.filter(p => codes.includes(p.iso)).reduce((s, p) => s + p.weight, 0);
