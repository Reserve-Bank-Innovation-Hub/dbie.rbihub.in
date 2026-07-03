// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Quarter-end stocks of household financial assets and liabilities (RBI Bulletin Table 52b).
// Pivoted: rows are indicator items, columns are quarter-end period labels ("JUN-2018" … "DEC-2024").
export interface HouseholdFinancialStocksRow {
    item   : string;         // indicator label (trimmed, leading spaces stripped)
    indent : number;         // hierarchy depth (0 = top-level, 1–3 = sub-items)
    values : (number | null)[]; // values aligned to `columns`; null for missing / "-"
}

export interface HouseholdFinancialStocks {
    reportTitle : string;
    unit        : string;   // "Rupees Crores"
    notes       : string[]; // footnotes from source
    columns     : string[]; // period labels e.g. ["JUN-2018", "SEP-2018", …, "DEC-2024"]
    data        : HouseholdFinancialStocksRow[];
}

/**
 * Fetch quarter-end stocks of household financial assets and liabilities
 * from the build-synced JSON (RBI Bulletin Table 52b).
 */
export async function getHouseholdFinancialStocks() : Promise<HouseholdFinancialStocks> {
    return loadData<HouseholdFinancialStocks>("household-financial-stocks");
}
