// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual yield per hectare for major commercial crops in India (RBI Handbook of Statistics).
export interface YieldPerHectareMajorCommercialCropsRow {
    year            : string;        // e.g. "2024-25" (newest-first)
    groundnut       : number | null; // Kg/hectare
    rapeseedMustard : number | null;
    soyabean        : number | null;
    totalOilseeds   : number | null;
    sugarcane       : number | null;
    tea             : number | null;
    coffee          : number | null;
    cottonLint      : number | null;
    rawJuteMesta    : number | null;
    tobacco         : number | null;
}

export interface YieldPerHectareMajorCommercialCropsColumns {
    groundnut       : string;
    rapeseedMustard : string;
    soyabean        : string;
    totalOilseeds   : string;
    sugarcane       : string;
    tea             : string;
    coffee          : string;
    cottonLint      : string;
    rawJuteMesta    : string;
    tobacco         : string;
}

export interface YieldPerHectareMajorCommercialCrops {
    reportTitle : string;
    unit        : string;
    columns     : YieldPerHectareMajorCommercialCropsColumns;
    data        : YieldPerHectareMajorCommercialCropsRow[];
}

/**
 * Fetch annual yield-per-hectare data for major commercial crops from the build-synced JSON.
 */
export async function getYieldPerHectareMajorCommercialCrops() : Promise<YieldPerHectareMajorCommercialCrops> {
    return loadData<YieldPerHectareMajorCommercialCrops>("yield-per-hectare-major-commercial-crops");
}
