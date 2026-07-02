// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monthly average price of gold and silver in Mumbai (RBI Bulletin Table 21).
export interface GoldAndSilverPriceRow {
    month  : string;         // "Jan. 2026" (newest-first)
    gold   : number | null;  // ₹ per 10 grams of standard gold
    silver : number | null;  // ₹ per kilogram of silver
}

export interface GoldAndSilverPricesUnits {
    gold   : string;
    silver : string;
}

export interface GoldAndSilverPrices {
    reportTitle : string;
    units       : GoldAndSilverPricesUnits;
    data        : GoldAndSilverPriceRow[];
}

/**
 * Fetch monthly gold and silver prices from the build-synced JSON.
 */
export async function getGoldAndSilverPrices() : Promise<GoldAndSilverPrices> {
    return loadData<GoldAndSilverPrices>("gold-and-silver-prices");
}
