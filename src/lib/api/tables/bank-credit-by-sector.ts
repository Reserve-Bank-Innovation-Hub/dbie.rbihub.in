// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// A single sector in the deployment hierarchy. The `code` carries the hierarchy
// ("3.7.1"); `parent` is the code with its last dotted segment removed, or null
// for top-level entries (Roman numerals I, II, III and bare integers 1–5).
// `values` is aligned to the top-level `periods` array, with null for gaps.
export interface BankCreditSector {
    code   : string;
    label  : string;
    parent : string | null;
    values : (number | null)[];
}

export interface BankCreditBySector {
    reportTitle : string;
    unit        : string;
    periods     : string[];           // raw date labels, oldest-first
    items       : BankCreditSector[];
}

/**
 * Fetch the deployment of gross bank credit by major sectors (Table 15) data.
 *
 * Covers 84 fortnightly/end-of-month periods from January 2019 to December 2025,
 * across 44 sector and sub-sector rows.
 */
export async function getBankCreditBySector() : Promise<BankCreditBySector> {
    return loadData<BankCreditBySector>("bank-credit-by-sector");
}
