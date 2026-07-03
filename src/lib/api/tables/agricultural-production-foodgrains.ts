// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual production of foodgrains in India (RBI Handbook annual series).
export interface AgriculturalProductionFoodgrainsRow {
    year           : string;        // "2024-25" (newest-first)
    rice           : number | null; // Lakhs Tonnes
    wheat          : number | null; // Lakhs Tonnes
    coarse_cereals : number | null; // Lakhs Tonnes
    total_cereals  : number | null; // Lakhs Tonnes (Rice + Wheat + Coarse Cereals)
    pulses         : number | null; // Lakhs Tonnes
}

export interface AgriculturalProductionFoodgrains {
    reportTitle : string;
    units       : string;           // "Lakhs Tonnes"
    data        : AgriculturalProductionFoodgrainsRow[];
}

/**
 * Fetch annual agricultural production (foodgrains) from the build-synced JSON.
 */
export async function getAgriculturalProductionFoodgrains() : Promise<AgriculturalProductionFoodgrains> {
    return loadData<AgriculturalProductionFoodgrains>("agricultural-production-foodgrains");
}
