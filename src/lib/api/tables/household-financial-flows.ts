// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Flow of Financial Assets and Liabilities of Households — Instrument-wise
// (RBI Bulletin Table 52(a)). Pivoted: rows are items, columns are year × period.
export interface HouseholdFinancialFlowsColumn {
    year   : string;  // "2018-19"
    period : string;  // "Q1" | "Q2" | "Q3" | "Q4" | "Annual"
}

export interface HouseholdFinancialFlowsRow {
    item   : string;              // item label e.g. "Net Financial Assets (I-II)"
    values : (number | null)[];   // aligned to columns[]
}

export interface HouseholdFinancialFlows {
    reportTitle : string;
    unit        : string;                          // "Rupees Crores"
    notes       : string[];
    columns     : HouseholdFinancialFlowsColumn[];
    data        : HouseholdFinancialFlowsRow[];
}

/**
 * Fetch household financial flows matrix from the build-synced JSON.
 */
export async function getHouseholdFinancialFlows() : Promise<HouseholdFinancialFlows> {
    return loadData<HouseholdFinancialFlows>("household-financial-flows");
}
