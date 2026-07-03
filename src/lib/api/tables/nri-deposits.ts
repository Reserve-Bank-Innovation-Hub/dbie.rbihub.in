// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// NRI deposits — outstandings and inflows/outflows (RBI Bulletin Table 34).
// All values in US$ millions.
export interface NriDepositsRow {
    month               : string;        // "YYYY-MM" (newest-first)
    fiscal_year         : string;        // "2025-26"
    outstanding_total   : number | null; // Total NRI deposits outstanding
    outstanding_fcnrb   : number | null; // FCNR(B) outstanding
    outstanding_nrera   : number | null; // NR(E)RA outstanding
    outstanding_nro     : number | null; // NRO outstanding
    flows_total         : number | null; // Total NRI deposit flows
    flows_fcnrb         : number | null; // FCNR(B) flows
    flows_nrera         : number | null; // NR(E)RA flows
}

export interface NriDeposits {
    reportTitle : string;
    unit        : string;  // "US$ Millions"
    data        : NriDepositsRow[];
}

/**
 * Fetch monthly NRI deposit data from the build-synced JSON.
 */
export async function getNriDeposits() : Promise<NriDeposits> {
    return loadData<NriDeposits>("nri-deposits");
}
