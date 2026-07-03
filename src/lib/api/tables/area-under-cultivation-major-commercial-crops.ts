// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual area under cultivation for major commercial crops in India (RBI Handbook annual series).
export interface AreaUnderCultivationMajorCommercialCropsRow {
    year             : string;        // "2024-25" (newest-first)
    groundnut        : number | null; // Lakhs Hectares
    rapeseed_mustard : number | null; // Lakhs Hectares
    soyabean         : number | null; // Lakhs Hectares
    total_oilseeds   : number | null; // Lakhs Hectares
    sugarcane        : number | null; // Lakhs Hectares
    tea              : number | null; // Lakhs Hectares
    coffee           : number | null; // Lakhs Hectares
    cotton_lint      : number | null; // Lakhs Hectares
    raw_jute_mesta   : number | null; // Lakhs Hectares
    tobacco          : number | null; // Lakhs Hectares
}

export interface AreaUnderCultivationMajorCommercialCrops {
    reportTitle : string;
    units       : string;           // "Lakhs Hectares"
    data        : AreaUnderCultivationMajorCommercialCropsRow[];
}

/**
 * Fetch annual area under cultivation (major commercial crops) from the build-synced JSON.
 */
export async function getAreaUnderCultivationMajorCommercialCrops() : Promise<AreaUnderCultivationMajorCommercialCrops> {
    return loadData<AreaUnderCultivationMajorCommercialCrops>("area-under-cultivation-major-commercial-crops");
}
