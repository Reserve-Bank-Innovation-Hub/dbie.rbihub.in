// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Reserve money — components and sources (RBI Bulletin Table 11).
// Each row covers one observation date (fortnightly / monthly, newest-first).
// `values` carries 9 entries in this order:
//   [0] RM   — Reserve money (total)
//   [1] 1.1  — Currency in circulation
//   [2] 1.2  — Bankers' deposits with RBI
//   [3] 1.3  — 'Other' deposits with RBI
//   [4] 2.1  — Net Reserve Bank credit to government
//   [5] 2.2  — Reserve Bank credit to banks
//   [6] 2.3  — Reserve Bank credit to commercial sector
//   [7] 2.4  — Net foreign exchange assets of RBI
//   [8] 2.5  — Government's currency liabilities to the public
export interface ReserveMoneyRow {
    date   : string;                // "31 Mar 2026" (newest-first)
    values : (number | null)[];     // 9 values per row, indices 0–8
}

export interface ReserveMoneyColumn {
    code  : string;   // e.g. "RM", "1.1", "2.4"
    label : string;   // full description
    group : "total" | "components" | "sources";
}

export interface ReserveMoney {
    reportTitle : string;
    unit        : string;                   // "Rupees millions"
    columns     : ReserveMoneyColumn[];
    data        : ReserveMoneyRow[];
}

/**
 * Fetch reserve money components and sources from the build-synced JSON.
 */
export function getReserveMoney() : ReserveMoney {
    return loadData<ReserveMoney>("reserve-money");
}
