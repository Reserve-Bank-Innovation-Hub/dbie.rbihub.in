// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// External commercial borrowings (ECB) registrations, monthly (RBI Bulletin Table 38).
// Covers automatic route, approval route, total registrations, weighted average maturity,
// interest rate indicators, and borrower-category breakdown.
export interface ECBColumn {
    code  : string;   // "1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4", "5.1", "5.2", …
    label : string;   // human-readable measure name
    group : string;   // top-level group ("Automatic Route", "Approval Route", "Total (1+2)", …)
}

export interface ECBRow {
    fy     : string;              // financial year, e.g. "2019-20"
    month  : string;              // "Apr", "May", …, "Mar"
    values : (number | null)[];   // 31 values aligned to columns[]
}

export interface ExternalCommercialBorrowings {
    reportTitle : string;
    unit        : string;     // "US$ Millions"
    columns     : ECBColumn[];
    rows        : ECBRow[];
}

/**
 * Fetch monthly ECB registrations from the build-synced JSON.
 */
export async function getExternalCommercialBorrowings() : Promise<ExternalCommercialBorrowings> {
    return loadData<ExternalCommercialBorrowings>("external-commercial-borrowings");
}
