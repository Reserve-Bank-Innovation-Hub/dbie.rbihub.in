// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual-average wholesale price index (Handbook of Statistics on Indian Economy).
// Base: 2011-12 = 100. Covers 1952-53 to the most recent available year, newest-first.
export interface WpiAnnualAverageRow {
    year : string;         // "2024-25" (financial year, newest-first)
    ac   : number | null;  // All commodities
    pa   : number | null;  // Primary articles
    fa   : number | null;  // Food articles (subset of PA)
    nf   : number | null;  // Non-food articles (subset of PA)
    fp   : number | null;  // Fuel & power
    mp   : number | null;  // Manufactured products
}

export interface WpiAnnualAverage {
    reportTitle : string;
    base        : string;   // e.g. "Base : 2011-12 = 100"
    note        : string;   // abbreviation footnote from source
    data        : WpiAnnualAverageRow[];
}

/**
 * Fetch the annual-average wholesale price index from the build-synced JSON.
 */
export async function getWpiAnnualAverage() : Promise<WpiAnnualAverage> {
    return loadData<WpiAnnualAverage>("wholesale-price-index-annual-average");
}
