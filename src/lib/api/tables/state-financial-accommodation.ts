// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// State-wise financial accommodation availed under SDF, WMA, and OD facilities.
// Source: RBI Bulletin Table 49. Unit: ₹ Crores.
// Covers September 2017 to the most recent month, newest-first by column.
export interface StateFinancialAccommodationColumn {
    month    : string;   // e.g. "During January 2026"
    facility : string;   // "Special Drawing Facility (SDF)" | "Ways and Means Advances (WMA)" | "Overdraft (OD)"
    measure  : string;   // "Average amount availed" | "Number of days availed"
}

export interface StateFinancialAccommodationRow {
    state  : string;            // State / UT name
    values : (number | null)[]; // aligned to columns[]
}

export interface StateFinancialAccommodation {
    reportTitle : string;
    unit        : string;   // "₹ Crores"
    notes       : string[];
    columns     : StateFinancialAccommodationColumn[];
    data        : StateFinancialAccommodationRow[];
}

/**
 * Fetch state-wise financial accommodation data from the build-synced JSON.
 */
export async function getStateFinancialAccommodation() : Promise<StateFinancialAccommodation> {
    return loadData<StateFinancialAccommodation>("state-financial-accommodation");
}
