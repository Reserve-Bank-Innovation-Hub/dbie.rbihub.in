// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// One index series (a column in the source table) with its base year and linking factor.
export interface OtherCPISeries {
    key           : string;
    group         : string;
    baseYear      : string;
    linkingFactor : number | null;
}

// One month's readings across every series; a series not published that month is null.
export interface OtherCPIRow {
    month      : string;                        // ISO year-month, e.g. "2026-02"
    monthLabel : string;                        // source label, e.g. "Feb. 2026"
    values     : Record<string, number | null>;
}

export interface ParsedOtherConsumerPriceIndices {
    data        : OtherCPIRow[];                // newest-first
    series      : OtherCPISeries[];             // in source column order
    months      : string[];                     // newest-first, matches data[].month
    reportTitle : string;
}

/**
 * Fetch other consumer price indices (Monthly RBI Bulletin, Table 20):
 * CPI for Industrial Workers, Agricultural Labourers and Rural Labourers.
 */
export async function getOtherConsumerPriceIndices() : Promise<ParsedOtherConsumerPriceIndices> {
    return loadData<ParsedOtherConsumerPriceIndices>("other-consumer-price-indices");
}
