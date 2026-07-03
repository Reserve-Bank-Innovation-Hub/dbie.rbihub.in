// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Weekly treasury bills outstanding by holder category — RBI Bulletin Table 25.
// Five tenor groups (91-day, 182-day, 364-day, 14-day intermediate, CMB),
// each broken down by Banks / Primary dealers / State governments / Others / Total.
// Amounts in Rupees Crores, newest-first.
export interface TreasuryBillsOwnershipRow {
    week          : string;         // "03-Apr-2026" (week-ended date, newest-first)
    // 91-day
    t91_banks     : number | null;
    t91_pds       : number | null;
    t91_stategov  : number | null;
    t91_others    : number | null;
    t91_total     : number | null;
    // 182-day
    t182_banks    : number | null;
    t182_pds      : number | null;
    t182_stategov : number | null;
    t182_others   : number | null;
    t182_total    : number | null;
    // 364-day
    t364_banks    : number | null;
    t364_pds      : number | null;
    t364_stategov : number | null;
    t364_others   : number | null;
    t364_total    : number | null;
    // 14-day intermediate
    t14_banks     : number | null;
    t14_pds       : number | null;
    t14_stategov  : number | null;
    t14_others    : number | null;
    t14_total     : number | null;
    // Cash management bills
    cmb_banks     : number | null;
    cmb_pds       : number | null;
    cmb_stategov  : number | null;
    cmb_others    : number | null;
    cmb_total     : number | null;
}

export interface TreasuryBillsOwnership {
    reportTitle : string;
    unit        : string;   // "Rupees Crores"
    data        : TreasuryBillsOwnershipRow[];
}

/**
 * Fetch the treasury bills ownership pattern from the build-synced JSON.
 */
export async function getTreasuryBillsOwnership() : Promise<TreasuryBillsOwnership> {
    return loadData<TreasuryBillsOwnership>("treasury-bills-ownership");
}
