// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Union Government Accounts at a Glance (Monthly RBI Bulletin Table 24).
// Monthly cumulative fiscal-year figures; unit: Rupees Crores.
// 14 measure groups × 3 variants (Actual, Budget Estimates, Revised Estimates) = 42 fields.
export interface UnionGovernmentAccountsRow {
    month           : string;       // "Jan 2026" (newest-first)

    // 1  Revenue receipts
    rr_actual       : number | null;
    rr_be           : number | null;
    rr_re           : number | null;

    // 1.1  Tax revenue (net)
    tax_actual      : number | null;
    tax_be          : number | null;
    tax_re          : number | null;

    // 1.2  Non-tax revenue
    ntr_actual      : number | null;
    ntr_be          : number | null;
    ntr_re          : number | null;

    // 2  Non-debt capital receipt
    ndcr_actual     : number | null;
    ndcr_be         : number | null;
    ndcr_re         : number | null;

    // 2.1  Recovery of loans
    recovery_actual : number | null;
    recovery_be     : number | null;
    recovery_re     : number | null;

    // 2.2  Other receipts
    other_actual    : number | null;
    other_be        : number | null;
    other_re        : number | null;

    // 3  Total receipts (excluding borrowings)
    receipts_actual : number | null;
    receipts_be     : number | null;
    receipts_re     : number | null;

    // 4  Revenue expenditure
    revexp_actual   : number | null;
    revexp_be       : number | null;
    revexp_re       : number | null;

    // 4.1  Interest payments
    interest_actual : number | null;
    interest_be     : number | null;
    interest_re     : number | null;

    // 5  Capital expenditure
    capexp_actual   : number | null;
    capexp_be       : number | null;
    capexp_re       : number | null;

    // 6  Total expenditure
    totalexp_actual : number | null;
    totalexp_be     : number | null;
    totalexp_re     : number | null;

    // 7  Revenue deficit
    rd_actual       : number | null;
    rd_be           : number | null;
    rd_re           : number | null;

    // 8  Fiscal deficit
    fd_actual       : number | null;
    fd_be           : number | null;
    fd_re           : number | null;

    // 9  Gross primary deficit
    gpd_actual      : number | null;
    gpd_be          : number | null;
    gpd_re          : number | null;
}

export interface UnionGovernmentAccounts {
    reportTitle : string;
    unit        : string;
    data        : UnionGovernmentAccountsRow[];
}

/**
 * Fetch Union Government Accounts data from the build-synced JSON.
 */
export async function getUnionGovernmentAccounts() : Promise<UnionGovernmentAccounts> {
    return loadData<UnionGovernmentAccounts>("union-government-accounts");
}
