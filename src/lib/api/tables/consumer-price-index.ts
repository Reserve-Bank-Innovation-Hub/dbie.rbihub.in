// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Consumer price index (Table No. 19) — monthly CPI for Rural, Urban and Combined,
// carried as one series per base period (2024=100, 2012=100, 2010=100). Index and
// inflation cells are null where RBI does not compile them (e.g. rural housing, or
// inflation in a base's earliest twelve months).

export type CPIStatus = "P" | "F"; // Provisional | Final

export interface CPICommodity {
    description : string;
}

export interface CPIRow {
    month             : string;       // ISO year-month, e.g. "2026-03"
    commodity         : string;       // matches a CPICommodity.description
    status            : CPIStatus;
    ruralIndex        : number | null;
    ruralInflation    : number | null;
    urbanIndex        : number | null;
    urbanInflation    : number | null;
    combinedIndex     : number | null;
    combinedInflation : number | null;
}

export interface CPISeries {
    base        : string;          // base label, e.g. "2024=100"
    sheetName   : string;
    months      : string[];        // ISO year-months, newest-first
    commodities : CPICommodity[];  // canonical display order
    rows        : CPIRow[];        // newest-month-first, commodities in canonical order
}

export interface ParsedConsumerPriceIndex {
    reportTitle : string;
    source      : string;
    series      : CPISeries[];     // newest base first
}

/**
 * Fetch consumer price index data (all base periods).
 */
export async function getConsumerPriceIndex() : Promise<ParsedConsumerPriceIndex> {
    return loadData<ParsedConsumerPriceIndex>("consumer-price-index");
}
