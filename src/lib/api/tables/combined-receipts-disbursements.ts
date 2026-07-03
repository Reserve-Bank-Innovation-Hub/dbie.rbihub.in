// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Combined Receipts and Disbursements of the Central and State Governments
// (Monthly RBI Bulletin Table 48). Pivoted: rows are line items, columns are
// fiscal years (newest-first). Unit: Rupees Crores.
export interface CombinedReceiptsDisbursementsRow {
    item   : string;           // Hierarchical label, e.g. "1.1.1 Revenue"
    values : (number | null)[]; // One entry per year, aligned with `years`
}

export interface CombinedReceiptsDisbursements {
    reportTitle : string;
    unit        : string;   // "Rupees Crores"
    years       : string[]; // ["2025-26", …, "1994-95"] — newest-first
    data        : CombinedReceiptsDisbursementsRow[];
    notes       : string;   // Footnote text from the source sheet
}

/**
 * Fetch the combined receipts and disbursements table from the build-synced JSON.
 */
export async function getCombinedReceiptsDisbursements() : Promise<CombinedReceiptsDisbursements> {
    return loadData<CombinedReceiptsDisbursements>("combined-receipts-disbursements");
}
