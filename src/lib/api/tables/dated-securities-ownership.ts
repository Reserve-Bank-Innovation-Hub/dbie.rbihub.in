// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Ownership pattern of government securities — quarterly per cent shares
// (GoI dated securities, state govt securities, treasury bills).
// Source: RBI Bulletin table 47.

export interface DatedSecuritiesOwnershipRow {
    period : string;             // "Dec 2025" (quarter-end month, newest-first)
    values : (number | null)[];  // aligned to section.columns; [0]=total ₹ cr, [1..]=% shares
}

export interface DatedSecuritiesOwnershipSection {
    key     : string;  // "goi_dated" | "state_securities" | "treasury_bills"
    title   : string;  // human-readable section title
    columns : string[]; // e.g. ["(A) Total (in Rs. Crores)", "1 Commercial Banks", …]
    data    : DatedSecuritiesOwnershipRow[];
}

export interface DatedSecuritiesOwnership {
    reportTitle : string;
    sections    : DatedSecuritiesOwnershipSection[];
}

/**
 * Fetch the ownership pattern of government securities from the build-synced JSON.
 */
export async function getDatedSecuritiesOwnership() : Promise<DatedSecuritiesOwnership> {
    return loadData<DatedSecuritiesOwnership>("dated-securities-ownership");
}
