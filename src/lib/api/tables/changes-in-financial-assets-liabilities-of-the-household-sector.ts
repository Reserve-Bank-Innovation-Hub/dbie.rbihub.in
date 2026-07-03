// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual changes in financial assets/liabilities of the household sector (RBI HSIE series).
export interface ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow {
    year                              : string;         // e.g. "2023-24" (newest-first)
    currency                          : number | null;  // Currency (₹ crore)
    bank_deposits                     : number | null;  // Bank deposits (₹ crore)
    non_banking_deposits              : number | null;  // Non-banking deposits (₹ crore)
    life_insurance_fund               : number | null;  // Life insurance fund (₹ crore)
    provident_pension_fund            : number | null;  // Provident and pension fund (₹ crore)
    claims_on_government              : number | null;  // Claims on Government (₹ crore)
    shares_debentures                 : number | null;  // Shares & debentures (₹ crore)
    units_of_uti                      : number | null;  // Units of UTI (₹ crore)
    trade_debt_net                    : number | null;  // Trade debt (net) (₹ crore)
    changes_in_financial_assets       : number | null;  // Total changes in financial assets cols 2–10 (₹ crore)
    bank_advances                     : number | null;  // Bank advances (₹ crore)
    loans_other_financial_institutions: number | null;  // Loans & advances from other financial institutions (₹ crore)
    loans_government                  : number | null;  // Loans & advances from Government (₹ crore)
    loans_cooperative_societies       : number | null;  // Loans & advances from co-operative non-credit societies (₹ crore)
}

export interface ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector {
    reportTitle : string;
    unit        : string;
    data        : ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorRow[];
}

/**
 * Fetch annual changes in financial assets/liabilities of the household sector from the build-synced JSON.
 */
export async function getChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector() : Promise<ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector> {
    return loadData<ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector>("changes-in-financial-assets-liabilities-of-the-household-sector");
}
