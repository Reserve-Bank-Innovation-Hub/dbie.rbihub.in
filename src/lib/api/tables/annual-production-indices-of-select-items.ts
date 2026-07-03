// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual production indices of select items (base 2011-12 = 100), covering 80 industries
// across five use-based groups. Source: NSO, Government of India.

export interface AnnualProductionIndicesItem {
    number : number;  // 1-indexed item number
    name   : string;  // item name (e.g. "Electricity")
    group  : string;  // use-based group (e.g. "I. Primary goods industries")
}

export interface AnnualProductionIndicesRow {
    year    : string;             // fiscal year, e.g. "2024-25" (newest-first)
    indices : (number | null)[];  // 80 values, index position matches items array
}

export interface AnnualProductionIndices {
    reportTitle : string;
    baseYear    : string;
    items       : AnnualProductionIndicesItem[];
    data        : AnnualProductionIndicesRow[];
}

/**
 * Load annual production indices of select items from the build-synced JSON.
 */
export async function getAnnualProductionIndices() : Promise<AnnualProductionIndices> {
    return loadData<AnnualProductionIndices>("annual-production-indices-of-select-items");
}
