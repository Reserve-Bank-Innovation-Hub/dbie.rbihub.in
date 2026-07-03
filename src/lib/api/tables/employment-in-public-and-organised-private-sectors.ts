// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual employment in public and organised private sectors (RBI HSIE).
export interface EmploymentRow {
    year           : string;        // "2023-24" (newest-first)
    public_sector  : number | null; // In Lakhs — null where data unavailable
    private_sector : number | null; // In Lakhs — null where data unavailable
}

export interface EmploymentInPublicAndOrganisedPrivateSectors {
    reportTitle : string;
    unit        : string;
    data        : EmploymentRow[];
}

/**
 * Fetch annual employment data from the build-synced JSON.
 */
export async function getEmploymentInPublicAndOrganisedPrivateSectors() : Promise<EmploymentInPublicAndOrganisedPrivateSectors> {
    return loadData<EmploymentInPublicAndOrganisedPrivateSectors>("employment-in-public-and-organised-private-sectors");
}
