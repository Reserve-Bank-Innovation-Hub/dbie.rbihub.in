// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual index numbers of industrial production (Handbook of Statistics on Indian Economy).
// Multiple base-year series stacked: 2011-12, 2004-05, 1993-94, 1980-81.

export interface IIPAnnualRow {
    year   : string;             // e.g. "2024-25" (newest-first within each series)
    values : (number | null)[];  // matches the columns array; null = dash/unavailable
}

export interface IIPSeries {
    baseYear : string;             // e.g. "2011-12"
    columns  : string[];           // ["Mining & Quarrying", "Manufacturing", "Electricity"]
    weights  : (number | null)[];  // e.g. [14.37, 77.63, 7.99]
    data     : IIPAnnualRow[];
}

export interface IndexNumbersOfIndustrialProduction {
    reportTitle : string;
    series      : IIPSeries[];
}

export async function getIndexNumbersOfIndustrialProduction() : Promise<IndexNumbersOfIndustrialProduction> {
    return loadData<IndexNumbersOfIndustrialProduction>("index-numbers-of-industrial-production");
}
