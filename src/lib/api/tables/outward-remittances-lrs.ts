// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Outward remittances under the Liberalised Remittance Scheme (LRS) for resident
// individuals, monthly (RBI Bulletin Table 36).
export interface LRSCategory {
    code  : string;   // "1", "1.1", "1.2", …, "1.10"
    label : string;   // human-readable purpose name
}

export interface LRSDataRow {
    month  : string;              // "Jan 2026" (newest-first)
    values : (number | null)[];   // 11 values aligned to categories[]
}

export interface OutwardRemittancesLRS {
    reportTitle : string;
    unit        : string;          // "US$ Millions"
    categories  : LRSCategory[];
    data        : LRSDataRow[];
}

/**
 * Fetch monthly LRS outward remittances from the build-synced JSON.
 */
export async function getOutwardRemittancesLRS() : Promise<OutwardRemittancesLRS> {
    return loadData<OutwardRemittancesLRS>("outward-remittances-lrs");
}
