// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// RBI's standing facilities — utilisation of MSF, export credit refinance, liquidity facility
// for primary dealers, and others. Fortnightly, Rupees Crores. (RBI Bulletin Table 5.)
export interface RbiStandingFacilitiesRow {
    date               : string;        // "Feb 28, 2026" (newest-first)
    msf                : number | null; // Marginal Standing Facility
    ecr_limit          : number | null; // Export credit refinance — limit
    ecr_outstanding    : number | null; // Export credit refinance — outstanding
    pd_limit           : number | null; // Liquidity facility for primary dealers — limit
    pd_outstanding     : number | null; // Liquidity facility for primary dealers — outstanding
    others_limit       : number | null; // Others — limit
    others_outstanding : number | null; // Others — outstanding
}

export interface RbiStandingFacilities {
    reportTitle : string;
    unit        : string;                    // "Rupees Crores"
    data        : RbiStandingFacilitiesRow[];
}

/**
 * Fetch RBI standing facilities utilisation from the build-synced JSON.
 */
export function getRbiStandingFacilities() : RbiStandingFacilities {
    return loadData<RbiStandingFacilities>("rbi-standing-facilities");
}
