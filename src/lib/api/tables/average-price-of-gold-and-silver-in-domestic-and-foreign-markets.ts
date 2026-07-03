// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual average price of gold and silver in domestic (Mumbai) and foreign (London/New York) markets.
export interface AveragePriceOfGoldAndSilverRow {
    year                : string;        // "2024-25" (newest-first)
    gold_mumbai         : number | null; // ₹ per 10 gms. — Mumbai spot price
    gold_london         : number | null; // $ per troy oz. — London fix
    gold_mumbai_rupees  : number | null; // ₹ per 10 gms. — London price converted to ₹
    gold_spread         : number | null; // ₹ per 10 gms. — Mumbai minus London-in-₹
    silver_mumbai       : number | null; // ₹ per kg. — Mumbai spot price
    silver_ny           : number | null; // Cents per troy oz. — New York price
    silver_ny_rupees    : number | null; // ₹ per kg. — New York price converted to ₹
    silver_spread       : number | null; // ₹ per kg. — Mumbai minus NY-in-₹
}

export interface AveragePriceOfGoldAndSilverUnits {
    goldMumbai       : string;
    goldLondon       : string;
    goldMumbaiRupees : string;
    goldSpread       : string;
    silverMumbai     : string;
    silverNY         : string;
    silverNYRupees   : string;
    silverSpread     : string;
}

export interface AveragePriceOfGoldAndSilver {
    reportTitle : string;
    units       : AveragePriceOfGoldAndSilverUnits;
    data        : AveragePriceOfGoldAndSilverRow[];
}

/**
 * Fetch annual gold and silver price data from the build-synced JSON.
 */
export async function getAveragePriceOfGoldAndSilver() : Promise<AveragePriceOfGoldAndSilver> {
    return loadData<AveragePriceOfGoldAndSilver>(
        "average-price-of-gold-and-silver-in-domestic-and-foreign-markets",
    );
}
