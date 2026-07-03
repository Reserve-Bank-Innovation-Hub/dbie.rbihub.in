// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Daily liquidity operations by the Reserve Bank of India (RBI Bulletin Table 3).
// Covers Nov 1, 2012 to the latest available date, newest-first.
export interface LiquidityOperationsRow {
    date                          : string;        // "Apr 5, 2026" (newest-first)
    repo                          : number | null; // Repo (LAF)
    reverse_repo                  : number | null; // Reverse repo (LAF)
    variable_rate_repo            : number | null; // Variable rate repo
    variable_rate_reverse_repo    : number | null; // Variable rate reverse repo
    msf                           : number | null; // Marginal standing facility
    sdf                           : number | null; // Standing deposit facility
    standing_liquidity_facilities : number | null; // Standing liquidity facilities
    omo_sale                      : number | null; // OMO outright sale
    omo_purchase                  : number | null; // OMO outright purchase
    mss                           : number | null; // Market stabilisation scheme
    ltro                          : number | null; // Long term repo operations
    tltro                         : number | null; // Targeted long term repo operations
    sltro_sfb                     : number | null; // Special LTRO for small finance banks
    special_reverse_repo          : number | null; // Special reverse repo
    slf_mutual_funds              : number | null; // Special liquidity facility — mutual funds
    sls_nbfc_hfc                  : number | null; // Special liquidity scheme — NBFCs/HFCs
}

export interface LiquidityOperations {
    reportTitle : string;
    unit        : string;           // "Rupees Crores"
    data        : LiquidityOperationsRow[];
}

/**
 * Fetch daily RBI liquidity operations from the build-synced JSON.
 */
export function getLiquidityOperations() : LiquidityOperations {
    return loadData<LiquidityOperations>("liquidity-operations");
}
