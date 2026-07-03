// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Index numbers of area, production and yield of foodgrains, non-foodgrains and all crops in India
// (RBI Handbook of Statistics). Three stacked series (base 2007-08, 1993-94, 1981-82 = 100).
export interface AreaProductionYieldRow {
    year                    : string;        // e.g. "2024-25" (newest-first within series)
    foodGrainsArea          : number | null;
    foodGrainsProduction    : number | null;
    foodGrainsYield         : number | null;
    nonFoodGrainsArea       : number | null;
    nonFoodGrainsProduction : number | null;
    nonFoodGrainsYield      : number | null;
    allCropsArea            : number | null;
    allCropsProduction      : number | null;
    allCropsYield           : number | null;
}

export interface AreaProductionYieldSeries {
    base    : string;                 // e.g. "2007-08=100"
    weights : AreaProductionYieldRow | null;
    data    : AreaProductionYieldRow[];
}

export interface AreaProductionYieldColumns {
    foodGrainsArea          : string;
    foodGrainsProduction    : string;
    foodGrainsYield         : string;
    nonFoodGrainsArea       : string;
    nonFoodGrainsProduction : string;
    nonFoodGrainsYield      : string;
    allCropsArea            : string;
    allCropsProduction      : string;
    allCropsYield           : string;
}

export interface AreaProductionYieldFoodgrainsNonFoodgrains {
    reportTitle : string;
    columns     : AreaProductionYieldColumns;
    series      : AreaProductionYieldSeries[];
}

/**
 * Fetch index numbers of area, production and yield of foodgrains/non-foodgrains from the build-synced JSON.
 */
export async function getAreaProductionYieldFoodgrainsNonFoodgrains() : Promise<AreaProductionYieldFoodgrainsNonFoodgrains> {
    return loadData<AreaProductionYieldFoodgrainsNonFoodgrains>(
        "index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains",
    );
}
