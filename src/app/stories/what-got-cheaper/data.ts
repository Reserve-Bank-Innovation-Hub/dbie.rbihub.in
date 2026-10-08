// DATA ================================================================================================================
// Every figure on the page is derived here from data.gen.ts, which data/processors/story-what-got-cheaper.mjs writes
// from the scraped DBIE series (its header names them). Nothing numeric is typed by hand; the prose in page.client.tsx
// and the stage read these constants, so a refresh of the data refreshes the sentences and the dots.

export type { CpiGroup, Followed, FyMajors, Group, Item, LongYear, Major, Wage } from "./data.gen";
export {
    AGRI_CPI, ALL, BULLION, COUNTS, CPI_FY_WINDOW, CPI_GROUPS, CPI_SERIES, FLAT, FOLLOWED, FY_MAJORS, GAP_SHARES, GROUPS, HEADLINE, ITEMS,
    KEPT_PACE_UNTIL, LINKS, LONG, LONG_RANGE, LONG_TIMES, MAJORS, MISFILED, MONTHS, RURAL_CPI, WAGES, WPI_CALENDAR, YARDSTICK,
} from "./data.gen";

import { COUNTS, CPI_GROUPS, FOLLOWED, GROUPS, HEADLINE, ITEMS, MAJORS, WAGES, WPI_CALENDAR, YARDSTICK, type Item } from "./data.gen";

// FORMATTING ==========================================================================================================
const IN = "en-IN";
export const inr = (n : number) => n.toLocaleString(IN, { maximumFractionDigits : 0 });
export const pct = (v : number, dp = 1) => `${v.toFixed(dp)}%`;
// An index as rupees of every ₹100: 155.96 → "₹156".
export const rs  = (v : number) => `₹${Math.round(v)}`;
// A change against the base year, signed: 46.1 → "−54%", 265.9 → "+166%".
export const signed = (now : number, dp = 0) => { const c = now - 100; return `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(dp)}%`; };
// "twice" when a ratio rounds to two, "2.4 times" otherwise, "half" below one.
const NUMBER_WORDS = [
    "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
    "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
export const numberWord = (n : number) => NUMBER_WORDS[n] ?? inr(n);
export const timesWords = (r : number) => {
    const halves = Math.round(r * 2);
    if (Math.abs(r - halves / 2) > 0.15 || halves < 3) return `${r.toFixed(1)} times`;
    const whole = Math.floor(halves / 2), half = halves % 2 === 1;
    if (whole === 2 && !half) return "twice";
    return `${NUMBER_WORDS[whole] ?? whole}${half ? " and a half" : ""} times`;
};
// "A", "A and B", "A, B and C".
export const list = (xs : string[]) => xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
// A share of a hundred as the nearest simple fraction with the noun it counts: (4.7, "goods") → "about one in every
// twenty goods"; falls back to "x in every 100 goods".
const FRACTIONS : [ number, string ][] = [
    [ 5, "one in every twenty" ], [ 10, "one in every ten" ], [ 12.5, "one in every eight" ], [ 100 / 6, "one in every six" ],
    [ 20, "one in every five" ], [ 25, "one in every four" ], [ 100 / 3, "one in every three" ], [ 50, "half" ],
    [ 200 / 3, "two in every three" ], [ 75, "three in every four" ], [ 80, "four in every five" ], [ 90, "nine in every ten" ],
];
export const shareOf = (v : number, noun : string) => {
    let best : [ number, string ] | null = null;
    for (const f of FRACTIONS) if (!best || Math.abs(f[0] - v) < Math.abs(best[0] - v)) best = f;
    if (!best || Math.abs(best[0] - v) / best[0] > 0.12) return `${Math.round(v)} in every 100 ${noun}`;
    const tag = v < best[0] - 0.5 ? "nearly " : v > best[0] + 0.5 ? "more than " : "";
    return best[1] === "half" ? `${tag}half of all ${noun}` : `${tag}${best[1]} ${noun}`;
};
// "2026-04" → "April 2026"; "2025-26" stays as it is.
const MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
export const monthName = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
export const shortMonth = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1].slice(0, 3)} ${ym.slice(0, 4)}`;

// THE BASKET'S SHAPE ==================================================================================================
// The three major groups in plain words, in the index's order: primary articles, fuel and power, manufactured products.
export const MAJOR_PLAIN = [ "Grown, reared or mined", "Fuel and power", "Made in factories" ] as const;
export const MAJOR_SHORT = [ "grown or mined", "fuel and power", "factory-made" ] as const;

export const YEARS = +HEADLINE.nowFy.slice(0, 4) - +HEADLINE.baseFy.slice(0, 4);           // 2011-12 to 2025-26: fourteen years
export const RISE = HEADLINE.all - 100;                                                       // the basket as a whole, per cent
export const YEARLY = 100 * (Math.pow(HEADLINE.all / 100, 1 / YEARS) - 1);                   // the same as a rate a year

export const BY_NOW   = [ ...ITEMS ].sort((a, b) => a.now - b.now || a.label.localeCompare(b.label));
export const CHEAPER  = BY_NOW.filter(i => i.now < 100);
export const DOUBLED  = BY_NOW.filter(i => i.now >= 200).reverse();
export const TRIPLED  = DOUBLED.filter(i => i.now >= 300);
export const RISERS   = [ ...BY_NOW ].reverse();
export const IN_WORK  = ITEMS.filter(i => i.inWork !== null) as (Item & { inWork : number })[];
export const CHEAPER_IN_WORK = IN_WORK.filter(i => i.inWork < 1);
export const STALE_CHEAPER = CHEAPER.filter(i => i.stale);

export const itemNamed = (label : string) => {
    const it = ITEMS.find(i => i.label === label);
    if (!it) throw new Error(`no item labelled ${label}`);
    return it;
};
export const followedNamed = (name : string) => {
    const f = FOLLOWED.find(x => x.name === name);
    if (!f) throw new Error(`no followed item named ${name}`);
    return f;
};
export const itemOfFollowed = (name : string) => itemNamed(followedNamed(name).label);
export const groupOf = (it : Item) => GROUPS[it.group];
export const majorOf = (it : Item) => MAJORS[it.major];

// The heaviest items in the basket: where the rupees of the hundred are.
export const HEAVIEST = [ ...ITEMS ].sort((a, b) => b.weight - a.weight).slice(0, 12);
export const weightOf = (its : Item[]) => its.reduce((s, i) => s + i.weight, 0);

// THE CONSUMER SIDE ===================================================================================================
export const cpiNamed = (code : string) => {
    const g = CPI_GROUPS.find(x => x.code === code);
    if (!g) throw new Error(`no CPI group ${code}`);
    return g;
};
export const cpiRise = (code : string) => 100 * (cpiNamed(code).to / cpiNamed(code).from - 1);
export const cpiRiseFy = (code : string) => 100 * (cpiNamed(code).fyTo / cpiNamed(code).fyFrom - 1);
export const WPI_RISE_CAL = 100 * (WPI_CALENDAR.to / WPI_CALENDAR.from - 1);
export const CPI_GENERAL = cpiNamed("C_GIAG");
// The groups the story names, in the order it compares them, with plain names.
export const CPI_SHOWN : { code : string; name : string; kind : "service" | "goods" | "mixed" }[] = [
    { code : "C_GIAG_MS_HTH", name : "Health", kind : "mixed" },
    { code : "C_GIAG_MS_ED", name : "Education", kind : "mixed" },
    { code : "C_GIAG_HO", name : "Housing", kind : "service" },
    { code : "C_GIAG_MS_TC", name : "Transport and communication", kind : "mixed" },
    { code : "C_GIAG_MS_RA", name : "Recreation", kind : "mixed" },
    { code : "C_GIAG_MS_PCE", name : "Personal care", kind : "goods" },
    { code : "C_GIAG_MS_HHGS", name : "Household goods and services", kind : "mixed" },
    { code : "C_GIAG_CF", name : "Clothing and footwear", kind : "goods" },
    { code : "C_GIAG_FL", name : "Fuel and light", kind : "goods" },
    { code : "C_GIAG_FB", name : "Food and beverages", kind : "goods" },
];

// THE WAGE YARDSTICK ==================================================================================================
export const WAGE_RISE = COUNTS.inWork.wageRise;                        // a non-farm labourer's day, 2014-15 to 2024-25
export const WPI_RISE_WAGE_WINDOW = COUNTS.inWork.allRise;
export const wageNamed = (code : string) => {
    const w = WAGES.find(x => x.code === code);
    if (!w) throw new Error(`no wage series ${code}`);
    return w;
};
export const YARD = YARDSTICK.nonFarm;
export const WAGES_BY_RISE = [ ...WAGES ].sort((a, b) => b.to / b.from - a.to / a.from);

// THE GOODS AS EMOJI ==================================================================================================
// The emoji that stands for a followed good on the chart, in its caption and at the head of its row of days, by the
// story's name for it; "basket" is the basket as a whole. Unicode has no blanket, so blankets take the scarf, and no
// solar panel, so solar power systems take the sun.
export const EMOJI_OF : Record<string, string> = {
    "Colour TVs" : "📺", "Anti-cancer drugs" : "💊", "Blankets" : "🧣", "Solar power systems" : "☀️", "Wheat" : "🌾", "Rice" : "🍚",
    "Silver" : "🥈", "Coconuts" : "🥥", "Tomatoes" : "🍅", "Jasmine" : "🌼", "Milk" : "🥛", "Eggs" : "🥚", "Petrol" : "⛽",
    "Kerosene" : "🪔", "Cement" : "🧱", "basket" : "🧺",
};
