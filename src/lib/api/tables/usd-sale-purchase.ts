// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Monthly sale/purchase of U.S. Dollar by the Reserve Bank of India.
// Source: RBI Monthly Bulletin Table 4. Three parts: outright, currency forwards, maturity breakdown.
// All monetary values in US $ millions unless stated; INR crore equivalents noted in field names.

export interface UsdSalePurchaseOutrightRow {
    month                : string;        // "January 2026" (newest-first)
    net_usd_mn           : number | null; // Net purchase/sale (US $ millions)
    purchase_usd_mn      : number | null; // Purchase (US $ millions)
    sale_usd_mn          : number | null; // Sale (US $ millions)
    inr_crore_equivalent : number | null; // ₹ equivalent at contract rate (₹ crores)
    cumulative_usd_mn    : number | null; // Cumulative over end-March (US $ millions)
    cumulative_inr_crore : number | null; // Cumulative over end-March (₹ crores)
}

export interface UsdSalePurchaseForwardsRow {
    month            : string;        // "January 2026" (newest-first)
    net_usd_mn       : number | null; // Net purchase/sale (US $ millions)
    purchase_usd_mn  : number | null; // Purchase (US $ millions)
    sale_usd_mn      : number | null; // Sale (US $ millions)
}

export interface UsdSalePurchaseForwardsMaturityRow {
    month     : string;        // "January 2026" (newest-first)
    m1_long   : number | null; // Up to 1 month — long
    m1_short  : number | null; // Up to 1 month — short
    m1_net    : number | null; // Up to 1 month — net
    m3_long   : number | null; // More than 1 month up to 3 months — long
    m3_short  : number | null; // More than 1 month up to 3 months — short
    m3_net    : number | null; // More than 1 month up to 3 months — net
    m12_long  : number | null; // More than 3 months up to 1 year — long
    m12_short : number | null; // More than 3 months up to 1 year — short
    m12_net   : number | null; // More than 3 months up to 1 year — net
}

export interface UsdSalePurchase {
    reportTitle        : string;
    notes              : string;
    outright           : UsdSalePurchaseOutrightRow[];
    forwards           : UsdSalePurchaseForwardsRow[];
    forwards_maturity  : UsdSalePurchaseForwardsMaturityRow[];
}

/**
 * Fetch RBI USD sale/purchase data from the build-synced JSON.
 */
export function getUsdSalePurchase() : UsdSalePurchase {
    return loadData<UsdSalePurchase>("usd-sale-purchase");
}
