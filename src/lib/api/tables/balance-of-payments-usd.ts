// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// India's overall balance of payments — US$ million (RBI Bulletin Table 40).

/** A single BoP line item (Current Account, Capital Account, sub-components, etc.). */
export interface BoPItem {
    code   : string;        // dotted numeric code, e.g. "1", "1.2.1", "2.1.1.1.1"; "0" = overall total
    label  : string;        // human-readable name
    parent : string | null; // parent code; null for "0" (overall total)
}

/** One row of data: a (quarter, transaction type) pair with one value per item. */
export interface BoPEntry {
    period : string;               // e.g. "2025-26:Q3"
    type   : "Credit" | "Debit" | "Net";
    values : (number | null)[];    // aligned to items[]
}

export interface BalanceOfPaymentsUsd {
    reportTitle : string;
    unit        : string;   // "US$ millions"
    items       : BoPItem[];
    periods     : string[]; // quarter labels, newest-first
    data        : BoPEntry[];
}

/**
 * Fetch India's overall balance of payments (US$ million) from the build-synced JSON.
 */
export async function getBalanceOfPaymentsUsd() : Promise<BalanceOfPaymentsUsd> {
    return loadData<BalanceOfPaymentsUsd>("balance-of-payments-usd");
}
