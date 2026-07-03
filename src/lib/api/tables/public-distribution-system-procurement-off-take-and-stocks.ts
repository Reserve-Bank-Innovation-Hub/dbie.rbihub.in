// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual public distribution system data — procurement, off-take and stocks of rice and wheat.
export interface PDSColumn {
    code  : string;
    label : string;
    group : string;
}

export interface PDSRow {
    year       : string;        // "2025-26" (newest-first)
    proc_rice  : number | null; // Procurement — rice (lakhs tonnes)
    proc_wheat : number | null; // Procurement — wheat (lakhs tonnes)
    proc_total : number | null; // Procurement — total (lakhs tonnes)
    offt_rice  : number | null; // Off-take — rice (lakhs tonnes)
    offt_wheat : number | null; // Off-take — wheat (lakhs tonnes)
    offt_total : number | null; // Off-take — total (lakhs tonnes)
    stck_rice  : number | null; // Stocks — rice (lakhs tonnes)
    stck_wheat : number | null; // Stocks — wheat (lakhs tonnes)
    stck_total : number | null; // Stocks — total (lakhs tonnes)
}

export interface PublicDistributionSystemData {
    reportTitle : string;
    units       : string;
    columns     : PDSColumn[];
    data        : PDSRow[];
}

/**
 * Load annual public distribution system data from the build-synced JSON.
 * Synchronous — no Promise wrapper.
 */
export function getPublicDistributionSystemData() : PublicDistributionSystemData {
    return loadData<PublicDistributionSystemData>(
        "public-distribution-system-procurement-off-take-and-stocks",
    );
}
