// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Nine IIP series (four Sectoral, five Use-Based). `code` keys every value map;
// `group` mirrors the two-level column header, `label` is the display header.
export interface IIPCategory {
    code   : string;
    group  : string;
    label  : string;
    weight : number | null;
}

// A period carries the index level and the year-on-year growth rate for every
// series, keyed by category code. Growth is null for the oldest period (no prior
// year to compare) or any series the source leaves blank.
export type IIPSeriesValues = Record<string, number | null>;

export interface IIPDataRow {
    period : string;          // "YYYY-MM"
    label  : string;          // "Feb 2026"
    index  : IIPSeriesValues; // base 2011-12=100
    growth : IIPSeriesValues; // year-on-year %
}

export interface ParsedIndexOfIndustrialProduction {
    reportTitle : string;
    base        : string;     // "2011-12=100"
    categories  : IIPCategory[];
    data        : IIPDataRow[]; // newest-first
}

/**
 * Fetch the Index of Industrial Production (Table 23) dataset.
 */
export async function getIndexOfIndustrialProduction() : Promise<ParsedIndexOfIndustrialProduction> {
    return loadData<ParsedIndexOfIndustrialProduction>("index-of-industrial-production");
}
