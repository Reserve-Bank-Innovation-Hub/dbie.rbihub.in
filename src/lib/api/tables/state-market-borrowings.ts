// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Market Borrowings of State Governments (Monthly RBI Bulletin Table 51).
// Unit: ₹ Crores. Two datasets — annual (fiscal-year totals) and monthly (calendar-month figures).
// Each dataset has dynamic columns (period × gross/net) and state-wise data rows.

export interface StateMarketBorrowingsColumn {
    period  : string;              // "2024-25" (annual) or "January 2026" (monthly)
    measure : "gross" | "net";     // "gross" = Gross Amount Raised; "net" = Net Amount Raised
}

export interface StateMarketBorrowingsRow {
    state  : string;               // State/UT name, e.g. "Andhra Pradesh", or "Total"
    values : (number | null)[];    // Values aligned to columns[]; null = "-" / blank in source
}

export interface StateMarketBorrowingsSheet {
    columns : StateMarketBorrowingsColumn[];
    data    : StateMarketBorrowingsRow[];
}

export interface StateMarketBorrowings {
    reportTitle : string;
    unit        : string;
    annual      : StateMarketBorrowingsSheet;
    monthly     : StateMarketBorrowingsSheet;
}

/**
 * Fetch state-wise market borrowings data from the build-synced JSON.
 */
export async function getStateMarketBorrowings() : Promise<StateMarketBorrowings> {
    return loadData<StateMarketBorrowings>("state-market-borrowings");
}
