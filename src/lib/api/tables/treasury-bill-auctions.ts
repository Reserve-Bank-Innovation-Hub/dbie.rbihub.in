// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Auction-wise results for 91, 182 and 364-day Government of India treasury bills.
// Source: RBI Bulletin Table 26. Amounts in ₹ crore.
export interface TreasuryBillAuctionRow {
    tenor               : "91-day" | "182-day" | "364-day";
    auction_date        : string;         // "08-Apr-2026"
    issue_date          : string;         // "09-Apr-2026"
    notified            : number | null;  // Notified amount (₹ crore)
    bids_recd_num       : number | null;  // Number of bids received
    bids_recd_comp      : number | null;  // Competitive bids received (face value, ₹ crore)
    bids_recd_noncomp   : number | null;  // Non-competitive bids received (face value, ₹ crore)
    bids_acc_num        : number | null;  // Number of bids accepted
    bids_acc_comp       : number | null;  // Competitive bids accepted (face value, ₹ crore)
    bids_acc_noncomp    : number | null;  // Non-competitive bids accepted (face value, ₹ crore)
    total_issue         : number | null;  // Total amount issued (₹ crore)
    cutoff_price        : number | null;  // Cut-off price (₹)
    implicit_yield      : number | null;  // Implicit yield at cut-off (%)
    wavg_price          : number | null;  // Weighted average price (₹)
}

export interface TreasuryBillAuctions {
    reportTitle : string;
    notes       : string[];
    data        : TreasuryBillAuctionRow[];
}

/**
 * Fetch the treasury bill auction results from the build-synced JSON.
 */
export async function getTreasuryBillAuctions() : Promise<TreasuryBillAuctions> {
    return loadData<TreasuryBillAuctions>("treasury-bill-auctions");
}
