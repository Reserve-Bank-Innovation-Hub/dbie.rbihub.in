// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual area under cultivation for foodgrains in India (RBI Handbook annual series).
export interface AreaUnderCultivationFoodgrainsRow {
    year           : string;        // "2024-25" (newest-first)
    rice           : number | null; // Lakhs Hectares
    wheat          : number | null; // Lakhs Hectares
    coarse_cereals : number | null; // Lakhs Hectares
    total_cereals  : number | null; // Lakhs Hectares (Rice + Wheat + Coarse Cereals)
    pulses         : number | null; // Lakhs Hectares
}

export interface AreaUnderCultivationFoodgrains {
    reportTitle : string;
    units       : string;           // "Lakhs Hectares"
    data        : AreaUnderCultivationFoodgrainsRow[];
}

/**
 * Fetch annual area under cultivation (foodgrains) from the build-synced JSON.
 */
export async function getAreaUnderCultivationFoodgrains() : Promise<AreaUnderCultivationFoodgrains> {
    return loadData<AreaUnderCultivationFoodgrains>("area-under-cultivation-foodgrains");
}
