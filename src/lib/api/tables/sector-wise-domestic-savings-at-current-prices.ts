// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual sector-wise domestic savings at current prices (base year 2011-12) — NSO.
export interface SectorWiseDomesticSavingsRow {
    year                               : string;         // e.g. "2023-24" (newest-first)
    gross_savings                      : number | null;  // ₹ crores
    non_financial_corporations         : number | null;
    public_non_financial_corporations  : number | null;
    private_non_financial_corporations : number | null;
    financial_corporations             : number | null;
    public_financial_corporations      : number | null;
    private_financial_corporations     : number | null;
    general_government                 : number | null;
    household_sector                   : number | null;
    gross_financial_saving             : number | null;
    less_financial_liabilities         : number | null;
    saving_in_physical_assets          : number | null;
}

export interface SectorWiseDomesticSavings {
    reportTitle : string;
    unit        : string;
    baseYear    : string;
    data        : SectorWiseDomesticSavingsRow[];
}

/**
 * Fetch annual sector-wise domestic savings from the build-synced JSON.
 */
export async function getSectorWiseDomesticSavings() : Promise<SectorWiseDomesticSavings> {
    return loadData<SectorWiseDomesticSavings>("sector-wise-domestic-savings-at-current-prices");
}
