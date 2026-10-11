// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-the-women-who-stayed.mjs writes
// from DBIE's tables (the report ids are in its header). Nothing numeric is typed by hand; the sentences in the chapters
// are built from these constants, so a refresh of the data rewrites them.

import { CPI_AL, RURAL as RURAL_ROUNDS, WAGES } from "./data.gen";
import type { Round } from "./data.gen";

export { CPI_AL, JOBS, URBAN_WOMEN_FARM, WAGES, WAGE_RANGE } from "./data.gen";
export type { Round, WageYear } from "./data.gen";

// A survey's midpoint as a decimal year, for the time axes: "July 2000-June 2001" → 2001.0.
const MONTHS : Record<string, number> = { January : 0, February : 1, March : 2, April : 3, May : 4, June : 5, July : 6, August : 7, September : 8, October : 9, November : 10, December : 11 };
const midOf = (period : string) => {
    const parts = period.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})?/g) ?? [ "" ];
    const yrs = period.match(/\d{4}/g) ?? [];
    const a = parts[0].split(/\s+/), b = parts[parts.length - 1].split(/\s+/);
    return (+(a[1] ?? yrs[0]) + MONTHS[a[0]] / 12 + +(b[1] ?? yrs[yrs.length - 1]) + (MONTHS[b[0]] + 1) / 12) / 2;
};
export interface Survey extends Round { t : number; }
export const RURAL : Survey[] = RURAL_ROUNDS.map(r => ({ ...r, t : midOf(r.period) }));

export const FIRST = RURAL[0], LAST = RURAL[RURAL.length - 1];
export const I_DIP = RURAL.findIndex(r => r.round === "PLFS 2"), I_TOP = RURAL.findIndex(r => r.round === "PLFS 7");
export const DIP = RURAL[I_DIP], TOP = RURAL[I_TOP];
// the survey with the widest gap between women's and men's shares in agriculture
export const WIDEST = RURAL.reduce((b, r) => r.w[0] - r.m[0] > b.w[0] - b.m[0] ? r : b, RURAL[0]);

// FORMATTING ==========================================================================================================
// per 1000 → per cent: 727 → "72.7%"; a difference per 1000 → points
export const pc  = (v : number) => `${(v / 10).toFixed(1)}%`;
export const pts = (v : number) => `${(v / 10).toFixed(1)} points`;
// "July 2000-June 2001" → "2000-01"; a calendar year stays as it is
export const shortOf = (r : Round) => {
    const yrs = r.period.match(/\d{4}/g) ?? [];
    if (/^July/.test(r.period) && yrs.length === 2) return `${yrs[0]}-${yrs[1].slice(2)}`;
    // a calendar-year survey: "January 2025-December 2025" (or "January-December 2003") → "2025"
    if (/^January/.test(r.period) && /December/.test(r.period) && new Set(yrs).size === 1) return yrs[0] ?? r.period;
    return r.period.replace(/-/g, "–");
};
// Shares per 1000 as whole figures out of 100, by the largest remainder, so each sex adds to 100.
export const hundred = (t : number[]) => {
    const tot = t[0] + t[1] + t[2], raw = t.map(v => v / tot * 100), fl = raw.map(Math.floor);
    const rem = 100 - fl.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [ v - fl[i], i ]).sort((a, b) => b[0] - a[0]).slice(0, rem).forEach(([ , i ]) => { fl[i] += 1; });
    return fl;
};

// WAGES ===============================================================================================================
export type JobKey = "farm" | "nonfarm" | "constr" | "carp" | "mason";
export const W0 = WAGES[0], W1 = WAGES[WAGES.length - 1];
export const prem = (r : typeof W0, k : JobKey) => 100 * (r[k] / r.farm - 1);
export const realGrowth = (k : JobKey) => 100 * ((W1[k] / W0[k]) / (CPI_AL[W1.year] / CPI_AL[W0.year]) - 1);
