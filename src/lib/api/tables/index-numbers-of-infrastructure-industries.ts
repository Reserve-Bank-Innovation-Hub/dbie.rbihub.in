// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual index numbers of eight core infrastructure industries across three base years
// (2011-12, 2004-05, 1993-94), sourced from the Ministry of Commerce and Industry.

export interface InfrastructureIndustriesRow {
    year   : string;
    values : (number | null)[];
}

export interface InfrastructureIndustriesSeries {
    baseYear : string;
    columns  : string[];
    weights  : (number | null)[];
    data     : InfrastructureIndustriesRow[];
}

export interface IndexNumbersOfInfrastructureIndustries {
    reportTitle : string;
    series      : InfrastructureIndustriesSeries[];
}

/**
 * Fetch annual infrastructure industries index data from the build-synced JSON.
 */
export async function getIndexNumbersOfInfrastructureIndustries() : Promise<IndexNumbersOfInfrastructureIndustries> {
    return loadData<IndexNumbersOfInfrastructureIndustries>("index-numbers-of-infrastructure-industries");
}
