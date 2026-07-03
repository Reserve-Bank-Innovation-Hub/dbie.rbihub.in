// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Net State Value Added by Economic Activity at constant prices (base 2011-12).
// Source: RBI Handbook of Statistics on Indian Economy — sheet NAS-2011-12.
//
// Data shape: for each of 33 states/UTs, values[year_idx][activity_idx] where
// activity_idx 0–10 are the 11 individual sector columns and activity_idx 11
// is the total NSVA at basic prices. Years run newest-first.

export interface NsvaStateEntry {
    name   : string;               // e.g. "ANDHRA PRADESH"
    years  : string[];             // fiscal-year labels, newest-first, e.g. "2024-25"
    values : (number | null)[][];  // [year_idx][activity_idx], aligned to activities[]
}

export interface NetStateValueAddedAtConstantPrices {
    reportTitle : string;
    unit        : string;          // "Rupees Crores"
    baseYear    : string;          // "2011-12"
    activities  : string[];        // 11 sector names + "TOTAL NSVA at basic prices" (12 total)
    states      : NsvaStateEntry[];
}

/**
 * Fetch net state value added by economic activity at constant prices (base 2011-12).
 *
 * Covers 33 states/UTs and 14 fiscal years (2011-12 to 2024-25) across 12 economic
 * activity columns (11 sectors + total NSVA at basic prices).
 */
export async function getNetStateValueAddedAtConstantPrices() : Promise<NetStateValueAddedAtConstantPrices> {
    return loadData<NetStateValueAddedAtConstantPrices>(
        "net-state-value-added-by-economic-activity-at-constant-prices",
    );
}
