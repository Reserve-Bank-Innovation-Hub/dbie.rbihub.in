// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Investments by state governments in sinking, redemption and stabilisation funds
// and auction treasury bills (RBI Bulletin Table 50, ₹ Crores).
// Columns are dynamic: one entry per month × fund combination, newest month first.
export interface StateGovernmentInvestmentsColumn {
    month : string;  // e.g. "During January 2026"
    fund  : string;  // e.g. "Consolidated Sinking Fund (CSF)"
}

export interface StateGovernmentInvestmentsRow {
    state  : string;             // state or UT name, e.g. "Andhra Pradesh" (last row = "Total")
    values : (number | null)[];  // aligned to columns[]
}

export interface StateGovernmentInvestments {
    reportTitle : string;
    unit        : string;                            // "₹ Crores"
    notes       : string[];                          // footnotes from source
    columns     : StateGovernmentInvestmentsColumn[];
    data        : StateGovernmentInvestmentsRow[];
}

/**
 * Fetch state government investments matrix from the build-synced JSON.
 */
export async function getStateGovernmentInvestments() : Promise<StateGovernmentInvestments> {
    return loadData<StateGovernmentInvestments>("state-government-investments");
}
