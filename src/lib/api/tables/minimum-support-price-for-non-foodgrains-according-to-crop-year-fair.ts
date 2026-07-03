// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Minimum support price for non-foodgrains according to crop year (fair average quality)
export interface MspNonFoodgrainsRow {
    year                : string;         // "2025-26" (newest-first)
    sugarcane           : number | null;  // Rupees per quintal
    cotton              : number | null;
    jute                : number | null;
    groundnut_in_shell  : number | null;
    soyabean_black      : number | null;
    soyabean_yellow     : number | null;
    sunflower_seed      : number | null;
    rapeseed_mustard    : number | null;
    safflower           : number | null;
}

export interface MspNonFoodgrains {
    reportTitle : string;
    units       : string;
    crops       : string[];
    data        : MspNonFoodgrainsRow[];
}

/**
 * Fetch minimum support price for non-foodgrains data from the build-synced JSON.
 */
export async function getMspNonFoodgrains() : Promise<MspNonFoodgrains> {
    return loadData<MspNonFoodgrains>("minimum-support-price-for-non-foodgrains-according-to-crop-year-fair");
}
