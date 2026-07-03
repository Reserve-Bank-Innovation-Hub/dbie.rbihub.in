// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual production of major commercial crops in India (RBI Handbook annual series).
export interface AgriculturalProductionMajorCommercialCropsRow {
    year             : string;        // "2024-25" (newest-first)
    groundnut        : number | null; // Lakhs Tonnes
    rapeseed_mustard : number | null; // Lakhs Tonnes
    soyabean         : number | null; // Lakhs Tonnes
    total_oilseeds   : number | null; // Lakhs Tonnes
    coffee           : number | null; // Lakhs Tonnes
    cotton_lint      : number | null; // Lakhs Tonnes
    raw_jute_mesta   : number | null; // Lakhs Tonnes
    sugarcane        : number | null; // Lakhs Tonnes
    tea              : number | null; // Lakhs Tonnes
}

export interface AgriculturalProductionMajorCommercialCrops {
    reportTitle : string;
    units       : string;           // "Lakhs Tonnes"
    data        : AgriculturalProductionMajorCommercialCropsRow[];
}

/**
 * Fetch annual agricultural production (major commercial crops) from the build-synced JSON.
 */
export async function getAgriculturalProductionMajorCommercialCrops() : Promise<AgriculturalProductionMajorCommercialCrops> {
    return loadData<AgriculturalProductionMajorCommercialCrops>("agricultural-production-major-commercial-crops");
}
