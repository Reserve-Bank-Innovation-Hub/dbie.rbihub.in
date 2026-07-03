// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// State co-operative banks maintaining accounts with the Reserve Bank of India
// (RBI Bulletin Table 17).
//
// Fortnightly snapshot data for state co-operative banks, covering aggregate
// deposits, demand/time liabilities, borrowings, cash and investments.
// Data run newest-first from late 1997 onwards.

export interface ScbColumn {
    code   : string;       // numeric code from the header ("1", "2.1", "2.1.1.2", …)
    label  : string;       // human-readable label stripped of the code prefix
    parent : string | null; // parent code, null at top level
}

export interface ScbPeriod {
    date     : string;              // "Dec 31, 2025"
    numBanks : number | null;       // number of reporting banks
    values   : (number | null)[];   // one value per column, aligned to StateCooperativeBanks.columns
}

export interface StateCooperativeBanks {
    reportTitle : string;
    unit        : string;      // "Rupees crore"
    columns     : ScbColumn[];
    periods     : ScbPeriod[]; // newest-first
}

/**
 * Fetch state co-operative banks data (Table 17) from the build-synced JSON.
 */
export async function getStateCooperativeBanks() : Promise<StateCooperativeBanks> {
    return loadData<StateCooperativeBanks>("state-cooperative-banks");
}
