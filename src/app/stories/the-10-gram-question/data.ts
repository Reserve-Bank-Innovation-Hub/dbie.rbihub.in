// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-the-10-gram-question.mjs
// writes from the scraped DBIE series and reports (its header names them). Nothing numeric is typed by hand; the
// prose in page.client.tsx reads these constants, so a refresh of the data refreshes the sentences and the cards.

export type { Month, Reserve, Tonnes, Window, Year } from "./data.gen";
export { FACTORS, HEADLINE, MONTHS, RESERVES, TONNES, WINDOWS, YEARS } from "./data.gen";

import { HEADLINE, YEARS, type Year } from "./data.gen";

export const TEN       = HEADLINE.tenGrams;                                   // the ten grams of the title
export const SUM       = HEADLINE.sum;                                        // the lens: ₹1 lakh
export const FROM_YEAR = HEADLINE.fromYear;
export const TO_YEAR   = HEADLINE.toYear;

// FORMATTING ==========================================================================================================
const IN = "en-IN";
export const inr   = (n : number) => n.toLocaleString(IN, { maximumFractionDigits : 0 });     // 142606 → "1,42,606"
export const rs    = (n : number) => `₹${inr(n)}`;
export const lakh  = (n : number, dp = 2) => `₹${(n / 1e5).toFixed(dp)} lakh`;
export const grams = (g : number) => `${g.toLocaleString(IN, { maximumFractionDigits : g < 20 ? 1 : 0 })} g`;
export const usd   = (n : number, dp = 0) => `$${n.toLocaleString(IN, { minimumFractionDigits : dp, maximumFractionDigits : dp })}`;
export const bn    = (n : number) => `$${n.toLocaleString(IN, { maximumFractionDigits : n < 10 ? 1 : 0 })} billion`;
export const pct   = (n : number, dp = 1) => `${n.toLocaleString(IN, { minimumFractionDigits : dp, maximumFractionDigits : dp })}%`;
// A multiple as a label: "41.7×" above two, "0.66×" below, so a near-level ratio does not read as exactly one.
export const times = (r : number) => `${r.toLocaleString(IN, { minimumFractionDigits : r < 2 ? 2 : 1, maximumFractionDigits : r < 2 ? 2 : 1 })}×`;
// "about 42 times", "about a third less", "about level".
export const timesWords = (r : number) =>
    r >= 1.5 ? `about ${r.toLocaleString(IN, { maximumFractionDigits : r >= 10 ? 0 : 1 })} times`
    : r >= 1.15 ? `about ${Math.round((r - 1) * 100)}% more`
    : r >= 0.9 ? "about level"
    : r >= 0.6 ? `about ${Math.round((1 - r) * 100)}% less`
    : "under half";
const MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
export const monthName = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
export const monthShort = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1].slice(0, 3)} ${ym.slice(0, 4)}`;
// A date as DBIE gives the weeks: "2026-08-28" → "28 August 2026".
export const dateName = (d : string) => `${+d.slice(8, 10)} ${MONTH_NAMES[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
// A part year's span: "January to July 2026"; the first year runs from April.
export const partYear = (year : number, months : number) => months >= 12 ? `${year}` : year === FROM_YEAR ? `April to December ${year}` : `January to ${MONTH_NAMES[months - 1]} ${year}`;
// A financial year as the handbook writes it, in words: "2025-26" → "2025-26".
export const fy = (s : string) => s;

// THE YEARS ===========================================================================================================
export const yearOf = (y : number) : Year => {
    const row = YEARS.find(r => r.year === y);
    if (!row) throw new Error(`no row for ${y}`);
    return row;
};
export const FIRST   = yearOf(FROM_YEAR);
export const NOW     = yearOf(TO_YEAR);
export const AGAINST = yearOf(HEADLINE.againstFrom);
// What a sum bought in a year, in grams, at that year's average price.
export const gramsFor = (year : number, sum : number) => sum / yearOf(year).gold.price * TEN;

// THE OBJECTS =========================================================================================================
// The jewellery a weight of gold stands for: a guide for the reader, not a measure. The gram thresholds are the
// story's own, shared with "What ₹1 lakh could buy", to be replaced by cited typical weights before publication.
export const pieceOf = (g : number) => g >= 100 ? "a full bridal set" : g >= 40 ? "a pair of bangles" : g >= 18 ? "a chain" : g >= 8 ? "a pair of earrings" : "a ring";
