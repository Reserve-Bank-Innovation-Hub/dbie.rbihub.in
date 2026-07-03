// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Index numbers of agricultural production for major crops (RBI Handbook of Statistics).
// Base: Triennium ending 1981-82=100 / 1993-94=100 / 2007-08=100 (three stacked series).
export interface AgriProductionMajorCropsRow {
    year             : string;        // e.g. "2024-25" (newest-first within series)
    allCrops         : number | null;
    foodGrains       : number | null;
    cereals          : number | null;
    rice             : number | null;
    wheat            : number | null;
    coarseCereals    : number | null;
    pulses           : number | null;
    nonFoodGrains    : number | null;
    oilSeeds         : number | null;
    groundnut        : number | null;
    sesamum          : number | null;
    rapeseedMustard  : number | null;
    coconut          : number | null;
    fibres           : number | null;
    cottonLint       : number | null;
    jute             : number | null;
    tea              : number | null;
    coffee           : number | null;
    rubber           : number | null;
    fruitsVegetables : number | null;
    sugarcane        : number | null;
    tobacco          : number | null;
    guarseed         : number | null;
    condimentsSpices : number | null;
}

export interface AgriProductionMajorCropsSeries {
    base    : string;                       // e.g. "2007-08=100"
    weights : AgriProductionMajorCropsRow | null;
    data    : AgriProductionMajorCropsRow[];
}

export interface AgriProductionMajorCropsColumns {
    allCrops         : string;
    foodGrains       : string;
    cereals          : string;
    rice             : string;
    wheat            : string;
    coarseCereals    : string;
    pulses           : string;
    nonFoodGrains    : string;
    oilSeeds         : string;
    groundnut        : string;
    sesamum          : string;
    rapeseedMustard  : string;
    coconut          : string;
    fibres           : string;
    cottonLint       : string;
    jute             : string;
    tea              : string;
    coffee           : string;
    rubber           : string;
    fruitsVegetables : string;
    sugarcane        : string;
    tobacco          : string;
    guarseed         : string;
    condimentsSpices : string;
}

export interface AgriProductionMajorCrops {
    reportTitle : string;
    columns     : AgriProductionMajorCropsColumns;
    series      : AgriProductionMajorCropsSeries[];
}

/**
 * Fetch index numbers of agricultural production for major crops from the build-synced JSON.
 */
export async function getAgriProductionMajorCrops() : Promise<AgriProductionMajorCrops> {
    return loadData<AgriProductionMajorCrops>("index-numbers-of-agricultural-production-major-crops");
}
