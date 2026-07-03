// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Weekly balance-sheet of the Reserve Bank of India — issue department and banking department.
// Amounts in Rupees Crores, newest-first. Source: RBI Bulletin Table 2.
export interface RbiLiabilitiesAndAssetsRow {
    week : string;   // "03-Apr-2026" (week-ended date, newest-first)

    // Issue department — liabilities
    notes_in_circulation               : number | null;  // 1.1.1
    notes_in_banking_dept              : number | null;  // 1.1.2
    issue_dept_total                   : number | null;  // Total notes issued / assets

    // Issue department — assets
    gold                               : number | null;  // 1.2.1
    foreign_securities                 : number | null;  // 1.2.2
    rupee_coin                         : number | null;  // 1.2.3
    goi_rupee_securities               : number | null;  // 1.2.4

    // Banking department — liabilities
    deposits                           : number | null;  // 2.1.1 total (often null in recent rows)
    dep_central_govt                   : number | null;  // 2.1.1.1
    dep_mss                            : number | null;  // 2.1.1.2 Market Stabilisation Scheme
    dep_state_govts                    : number | null;  // 2.1.1.3
    dep_scheduled_commercial_banks     : number | null;  // 2.1.1.4
    dep_scheduled_state_coop_banks     : number | null;  // 2.1.1.5
    dep_non_scheduled_state_coop_banks : number | null;  // 2.1.1.6
    dep_other_banks                    : number | null;  // 2.1.1.7
    dep_others                         : number | null;  // 2.1.1.8
    dep_fi_outside_india               : number | null;  // 2.1.1.9
    other_liabilities                  : number | null;  // 2.1.2
    banking_dept_total                 : number | null;  // 2.1/2.2 total

    // Banking department — assets
    notes_and_coins                    : number | null;  // 2.2.1
    balances_held_abroad               : number | null;  // 2.2.2
    loans_and_advances                 : number | null;  // 2.2.3 total
    la_central_govt                    : number | null;  // 2.2.3.1
    la_state_govts                     : number | null;  // 2.2.3.2
    la_scheduled_commercial_banks      : number | null;  // 2.2.3.3
    la_scheduled_state_coop_banks      : number | null;  // 2.2.3.4
    la_idbi                            : number | null;  // 2.2.3.5 Industrial Dev. Bank of India
    la_nabard                          : number | null;  // 2.2.3.6
    la_exim_bank                       : number | null;  // 2.2.3.7
    la_others                          : number | null;  // 2.2.3.8
    la_fi_outside_india                : number | null;  // 2.2.3.9
    bills_purchased_discounted         : number | null;  // 2.2.4 total
    bills_internal                     : number | null;  // 2.2.4.1
    bills_govt_treasury                : number | null;  // 2.2.4.2
    investments                        : number | null;  // 2.2.5
    other_assets                       : number | null;  // 2.2.6
}

export interface RbiLiabilitiesAndAssets {
    reportTitle : string;
    unit        : string;   // "Rupees Crores"
    data        : RbiLiabilitiesAndAssetsRow[];
}

/**
 * Fetch the RBI liabilities and assets balance sheet from the build-synced JSON.
 */
export async function getRbiLiabilitiesAndAssets() : Promise<RbiLiabilitiesAndAssets> {
    return loadData<RbiLiabilitiesAndAssets>("rbi-liabilities-and-assets");
}
