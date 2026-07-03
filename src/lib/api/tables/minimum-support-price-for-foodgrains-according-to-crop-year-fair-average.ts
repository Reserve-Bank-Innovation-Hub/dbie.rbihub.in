// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Minimum support price for foodgrains according to crop year (fair average quality)
export interface MspFoodgrainsRow {
    year         : string;         // "2025-26" (newest-first)
    paddy_common : number | null;  // Rupees per quintal
    maize        : number | null;
    wheat        : number | null;
    gram         : number | null;
    arhar_tur    : number | null;
    moong        : number | null;
}

export interface MspFoodgrains {
    reportTitle : string;
    units       : string;
    crops       : string[];
    data        : MspFoodgrainsRow[];
}

/**
 * Fetch minimum support price for foodgrains data from the build-synced JSON.
 */
export async function getMspFoodgrains() : Promise<MspFoodgrains> {
    return loadData<MspFoodgrains>("minimum-support-price-for-foodgrains-according-to-crop-year-fair-average");
}
