// OTHER ===============================================================================================================
import { loadData } from "../loadData";

export interface IIPUseBasedRow {
    year   : string;
    values : (number | null)[];
}

export interface IIPUseBasedSeries {
    baseYear : string;
    columns  : string[];
    weights  : (number | null)[];
    data     : IIPUseBasedRow[];
}

export interface IndexNumbersOfIndustrialProductionUseBased {
    reportTitle : string;
    series      : IIPUseBasedSeries[];
}

/**
 * Fetch annual IIP use-based classification data from the build-synced JSON.
 */
export function getIndexNumbersOfIndustrialProductionUseBased() : IndexNumbersOfIndustrialProductionUseBased {
    return loadData<IndexNumbersOfIndustrialProductionUseBased>(
        "index-numbers-of-industrial-production-use-based-classification",
    );
}
