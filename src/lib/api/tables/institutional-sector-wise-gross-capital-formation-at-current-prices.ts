// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual institutional sector-wise gross capital formation at current prices (base year 2011-12) — NSO.
export interface InstitutionalSectorGrossCapitalFormationRow {
    year                                : string;         // e.g. "2023-24" (newest-first)
    public_non_financial_corporations   : number | null;  // ₹ crores
    private_non_financial_corporations  : number | null;
    public_financial_corporations       : number | null;
    private_financial_corporations      : number | null;
    general_government                  : number | null;
    households_including_npish          : number | null;
    gross_capital_formation             : number | null;
}

export interface InstitutionalSectorGrossCapitalFormation {
    reportTitle : string;
    unit        : string;
    baseYear    : string;
    data        : InstitutionalSectorGrossCapitalFormationRow[];
}

/**
 * Fetch annual institutional sector-wise gross capital formation from the build-synced JSON.
 */
export async function getInstitutionalSectorGrossCapitalFormation() : Promise<InstitutionalSectorGrossCapitalFormation> {
    return loadData<InstitutionalSectorGrossCapitalFormation>("institutional-sector-wise-gross-capital-formation-at-current-prices");
}
