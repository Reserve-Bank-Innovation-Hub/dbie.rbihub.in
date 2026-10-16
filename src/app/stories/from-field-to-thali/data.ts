// The figures the story's words and charts use, derived from data.gen.ts (written by the processor
// data/processors/story-from-field-to-thali.mjs from DBIE's tables). Nothing here is typed by hand: each value is read
// or worked out from the generated data, so the words change if DBIE's figures do.

import {
    COSTS, EXPORTS, FARM_EXPORTS, FARM_IMPORTS, FARM_WAGE, FERTILISER, GROWTH, HEADLINE, IMPORTS, LAND, LAND_LAST,
    LAND_STATUS, LONG_TRADE, MSP, MSP_CROPS, MSP_VS_COSTS, PDS, PDS_PART_YEAR, PROC_SHARE, STATE_LATEST,
    STATE_MISSING_LATEST, STATE_NOW, STATE_SHIFTS, STATE_STATUS, STATE_THEN, STATES_NOW, TRADE_PROVISIONAL, TRADE_YEARS,
} from "./data.gen";
import type { CropKey, StateCropKey, StateShift } from "./data.gen";

export {
    COSTS, EXPORTS, FARM_EXPORTS, FARM_IMPORTS, FARM_WAGE, FERTILISER, GROWTH, HEADLINE, IMPORTS, LAND, LAND_LAST,
    LAND_STATUS, LONG_TRADE, MSP, MSP_CROPS, MSP_VS_COSTS, PDS, PDS_PART_YEAR, PROC_SHARE, STATE_LATEST,
    STATE_MISSING_LATEST, STATE_NOW, STATE_SHIFTS, STATE_STATUS, STATE_THEN, STATES_NOW, TRADE_PROVISIONAL, TRADE_YEARS,
};
export type { CropKey, StateCropKey, StateShift };

// NUMBERS IN WORDS ====================================================================================================
export const inr = (v : number) => v.toLocaleString("en-IN", { maximumFractionDigits : 0 });
export const inr1 = (v : number) => v.toLocaleString("en-IN", { minimumFractionDigits : 1, maximumFractionDigits : 1 });
// US$ million → "$19.5 billion" (one decimal) or "$950 million"
export const usd = (m : number) => m >= 1000 ? `$${(m / 1000).toFixed(1)} billion` : `$${Math.round(m)} million`;
// a ratio as "1.62 times", and the same as "62% more" (or "less")
export const times = (r : number, d = 2) => `${r.toFixed(d)} times`;
export const moreLess = (r : number) => { const p = Math.round(100 * (r - 1)); return p >= 0 ? `${p}% more` : `${-p}% less`; };
export const pct = (v : number, d = 0) => `${v.toFixed(d)}%`;

// THE LAND: output, area and yield ====================================================================================
export const L0 = LAND[0];
export const L1 = LAND.find(l => l.year === LAND_LAST)!;
export const LEST = LAND.at(-1)!;                                // the latest year, still an estimate
export const CROP_NAMES : Record<CropKey, string> = { rice : "Rice", wheat : "Wheat", coarse : "Millets and maize", pulses : "Pulses (dal)", foodgrains : "All foodgrains", oilseeds : "Oilseeds", sugarcane : "Sugarcane" };
// lakh tonnes → crore kg is awkward; the words say lakh tonnes and explain it once
export const lt = (v : number) => `${inr(v)} lakh tonnes`;
// a hectare's harvest in 50 kg sacks
export const SACK_KG = 50;
export const sacks = (kgPerHa : number) => kgPerHa / SACK_KG;

// THE STATES ==========================================================================================================
export const STATE_CROPS : { key : StateCropKey; name : string; unit : string }[] = [
    { key : "rice", name : "Rice", unit : "thousand tonnes" },
    { key : "wheat", name : "Wheat", unit : "thousand tonnes" },
    { key : "pulses", name : "Pulses", unit : "thousand tonnes" },
    { key : "oilseeds", name : "Oilseeds", unit : "thousand tonnes" },
    { key : "coarse", name : "Millets and maize", unit : "thousand tonnes" },
    { key : "sugarcane", name : "Sugarcane", unit : "thousand tonnes" },
    { key : "cotton", name : "Cotton", unit : "thousand bales of 170 kg" },
    { key : "jute", name : "Jute", unit : "thousand bales of 180 kg" },
];
export const shiftOf = (k : StateCropKey) => STATE_SHIFTS.find(s => s.crop === k)!;
// a state's largest shares of India's output in the latest complete year, biggest first
export const topCropsOf = (name : string) => {
    const s = STATES_NOW.find(x => x.name === name);
    if (!s) return [];
    return STATE_CROPS.map(c => ({ ...c, share : (s.shares as Record<string, number>)[c.key] ?? 0, output : s.output[c.key] }))
        .filter(c => c.output > 0).sort((a, b) => b.share - a.share);
};

// WHAT THE GOVERNMENT BUYS ============================================================================================
export const P0 = PDS[0];
export const PFULL = PDS.filter(p => p.year <= LAND_LAST);
export const P1 = PFULL.at(-1)!;                                 // the last year with a final harvest beside it
export const PLAST = PDS.at(-1)!;                                // the latest full year of buying
// the five years behind PROC_SHARE, with the working for each
const prevYear = (y : string) => { const s = +y.slice(0, 4) - 1; return `${s}-${String(s + 1).slice(2)}`; };
export const PROC_WORKING = PDS.filter(p => p.year >= PROC_SHARE.from && p.year <= PROC_SHARE.to).map(p => {
    const rice = LAND.find(l => l.year === p.year)!.output.rice, wheatYear = prevYear(p.year), wheat = LAND.find(l => l.year === wheatYear)!.output.wheat;
    return { year : p.year, procRice : p.procRice, rice, procWheat : p.procWheat, wheat, wheatYear, riceShare : 100 * p.procRice / rice, wheatShare : 100 * p.procWheat / wheat };
});

// SUPPORT PRICES, WAGES AND EVERYDAY COSTS ============================================================================
export const M0 = MSP_VS_COSTS.from, M1 = MSP_VS_COSTS.to;
export const mspOf = (year : string, key : string) => MSP.find(m => m.year === year)?.[key] as number | null | undefined;
// what a day's farm wage would buy at the support price: ₹ a quintal → ₹ a kg
export const kgFor = (wage : number, perQuintal : number) => wage / (perQuintal / 100);
export const BUY_CROPS = [ { key : "wheat", name : "wheat" }, { key : "paddy", name : "paddy (rice still in its husk)" }, { key : "arhar", name : "arhar (tur dal)" } ] as const;
export const crossedCosts = MSP_VS_COSTS.crops.filter(c => c.times >= MSP_VS_COSTS.costs);
export const belowCosts = MSP_VS_COSTS.crops.filter(c => c.times < MSP_VS_COSTS.costs);

// MONEY OUT AND MONEY IN ==============================================================================================
export const T0 = TRADE_YEARS[0], T1 = TRADE_YEARS.at(-1)!;
export const exportsOf = (year : string) => EXPORTS.find(e => e.year === year)!;
export const importsOf = (year : string) => IMPORTS.find(e => e.year === year)!;
export const fertOf = (year : string) => FERTILISER.find(f => f.year === year)?.usd ?? null;
// a short everyday name for each trade item
export const TRADE_SHORT : Record<string, string> = {
    tea : "Tea", coffee : "Coffee", rice : "Rice", cereals : "Other cereals", tobacco : "Tobacco", spices : "Spices", cashew : "Cashew",
    oilmeals : "Oil cake (cattle feed)", oilseeds : "Oilseeds", fruitveg : "Fruit and vegetables", processed : "Processed foods",
    marine : "Fish and seafood", meat : "Meat, milk and eggs", cotton : "Raw cotton", oil : "Cooking oil", pulses : "Pulses (dal)",
};
