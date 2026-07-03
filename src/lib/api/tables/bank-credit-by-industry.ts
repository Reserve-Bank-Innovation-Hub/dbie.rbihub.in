// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// One industry row in the taxonomy. The numeric `code` ("2.2.1") carries the
// hierarchy; `parent` is the code with its last segment dropped (null at the
// top level, i.e. code "2"). `values` aligns to the `periods` array by index,
// with null for cells that are blank in the source.
export interface BankCreditIndustry {
    code   : string;
    label  : string;
    parent : string | null;
    values : (number | null)[];
}

export interface BankCreditByIndustry {
    reportTitle : string;
    unit        : string;
    // Period labels as they appear in the sheet, e.g. "January,  18 2019".
    // Ordered oldest-first (January 2019 … December 2025).
    periods     : string[];
    items       : BankCreditIndustry[];
}

/**
 * Fetch the industry-wise deployment of bank credit (Table 16) data.
 *
 * Returns 43 industry rows × 84 fortnightly/monthly periods spanning
 * January 2019 to December 2025, with outstanding amounts in Rupees crores.
 */
export async function getBankCreditByIndustry() : Promise<BankCreditByIndustry> {
    return loadData<BankCreditByIndustry>("bank-credit-by-industry");
}
