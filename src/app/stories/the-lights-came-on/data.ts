// DATA ================================================================================================================
// All series extracted from RBI, Basic Statistical Returns of SCBs, Table 3.2 — organisation-wise classification of
// outstanding credit according to occupation (quarterly, March 2014 – March 2026). Derived by
// data/processors/story-the-lights-came-on.mjs from the committed workbook; nothing is parsed client-side.
// The workbook is mirrored at /public/data/rbi-bsr-table-3-2-occupation-credit.xlsx for download.

// Re-export all generated series and interfaces.
export type { YearPoint, QuarterPoint, BookMixPoint, SlopeRow } from './data.gen';
export {
    YEARS,
    QUARTERS,
    BOOK_MIX,
    WOMEN_BY_SECTOR,
    WOMEN_OVERALL_2026,
    WOMEN_OVERALL_2015,
} from './data.gen';

import { YEARS, QUARTERS } from './data.gen';

// Derived index constants — no hardcoded positions.
export const YEAR_2015 = YEARS.findIndex((p) => p.y === 2015);
export const YEAR_2026 = YEARS.findIndex((p) => p.y === 2026);
export const Q_MAR_2015 = QUARTERS.findIndex((q) => q.d === 'Mar 2015');
export const Q_LAST     = QUARTERS.length - 1;

// Dot model for Act II. Field = India's credit-eligible adults ≈ 1,036 million (TransUnion CIBIL,
// World Bank–based, December 2024; population aged 18–80). 1 dot = 1 crore. The field does not grow
// between 2015 and 2026 — what changes is how many dots light up.
export const FIELD_DOTS  = 104;
export const CR_PER_DOT  = 1;

export const litDots = (i : number) => Math.round(YEARS[i].acc  / 1e7);   // borrower accounts, crore
export const femDots = (i : number) => Math.round(YEARS[i].accF / 1e7);

// Largest-remainder rounding so column counts always sum to the dot total.
export const largestRemainder = (weights : number[], total : number) : number[] => {
    const raw = weights.map((w) => (w / 100) * total);
    const out = raw.map(Math.floor);
    let left = total - out.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [ v - out[i], i ] as const)
       .sort((a, b) => b[0] - a[0])
       .slice(0, left)
       .forEach(([ , i ]) => out[i]++);
    return out;
};
