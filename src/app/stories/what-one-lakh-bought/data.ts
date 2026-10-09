// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-what-one-lakh-bought.mjs
// writes from the scraped DBIE series (its header names them). Nothing numeric is typed by hand; the prose in
// page.client.tsx reads these constants, so a refresh of the data refreshes the sentences and the cards.

export type { Year } from "./data.gen";
export { FACTORS, HEADLINE, YEARS } from "./data.gen";

import { HEADLINE, YEARS, type Year } from "./data.gen";

export const SUM       = HEADLINE.sum;
export const FROM_YEAR = HEADLINE.fromYear;
export const TO_YEAR   = HEADLINE.toYear;
export const SPAN      = TO_YEAR - FROM_YEAR;                                 // twenty-five years

// FORMATTING ==========================================================================================================
const IN = "en-IN";
export const inr   = (n : number) => n.toLocaleString(IN, { maximumFractionDigits : 0 });     // 100000 → "1,00,000"
export const rs    = (n : number) => `₹${inr(n)}`;
// A sum in lakh: 437908 → "₹4.38 lakh"; 3397212 → "₹33.97 lakh".
export const lakh  = (n : number, dp = 2) => `₹${(n / 1e5).toFixed(dp)} lakh`;
export const grams = (g : number) => `${g.toLocaleString(IN, { maximumFractionDigits : 1 })} g`;
export const kg    = (k : number) => `${k.toLocaleString(IN, { maximumFractionDigits : 2 })} kg`;
// A multiple as a label: "7.8×" above two, "0.98×" below, so a near-level ratio does not read as exactly one.
export const times = (r : number) => `${r.toLocaleString(IN, { minimumFractionDigits : r < 2 ? 2 : 1, maximumFractionDigits : r < 2 ? 2 : 1 })}×`;
// "about 7.8 times", "about half", "about level".
export const timesWords = (r : number) => r >= 1.5 ? `about ${r.toLocaleString(IN, { maximumFractionDigits : 1 })} times` : r >= 1.15 ? `about ${Math.round((r - 1) * 100)}% more` : r >= 0.9 ? "about level" : r >= 0.6 ? `about ${Math.round((1 - r) * 100)}% less` : "under half";
const MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
export const monthName = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
// A part year's span: "January to May 2026".
export const partYear = (year : number, months : number) => months >= 12 ? `${year}` : `January to ${MONTH_NAMES[months - 1]} ${year}`;

// THE YEARS ===========================================================================================================
export const yearOf = (y : number) : Year => {
    const row = YEARS.find(r => r.year === y);
    if (!row) throw new Error(`no row for ${y}`);
    return row;
};
export const FIRST = yearOf(FROM_YEAR);
export const NOW   = yearOf(TO_YEAR);
export const LENS  = HEADLINE.lensYears.map(yearOf);
export const MASON_LAST = [ ...YEARS ].reverse().find(y => y.mason) as Year & { mason : NonNullable<Year["mason"]> };
export const WHEAT_LAST = [ ...YEARS ].reverse().find(y => y.wheat) as Year & { wheat : NonNullable<Year["wheat"]> };

// THE OBJECTS =========================================================================================================
// The jewellery a weight of gold stands for: a guide for the reader, not a measure. The gram thresholds are the
// story's own, to be replaced by cited typical weights or by the reader's own choice before publication.
export const pieceOf = (g : number) => g >= 100 ? "a full bridal set" : g >= 40 ? "a pair of bangles" : g >= 18 ? "a chain" : g >= 8 ? "a pair of earrings" : "a ring";
