// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual yield per hectare for foodgrain crops in India (RBI Handbook of Statistics).
export interface YieldPerHectareFoodgrainsRow {
    year          : string;        // e.g. "2024-25" (newest-first)
    rice          : number | null; // Kg/hectare
    wheat         : number | null;
    coarseCereals : number | null;
    totalCereals  : number | null;
    pulses        : number | null;
}

export interface YieldPerHectareFoodgrainsColumns {
    rice          : string;
    wheat         : string;
    coarseCereals : string;
    totalCereals  : string;
    pulses        : string;
}

export interface YieldPerHectareFoodgrains {
    reportTitle : string;
    unit        : string;
    columns     : YieldPerHectareFoodgrainsColumns;
    data        : YieldPerHectareFoodgrainsRow[];
}

/**
 * Fetch annual yield-per-hectare data for foodgrains from the build-synced JSON.
 */
export async function getYieldPerHectareFoodgrains() : Promise<YieldPerHectareFoodgrains> {
    return loadData<YieldPerHectareFoodgrains>("yield-per-hectare-foodgrains");
}
