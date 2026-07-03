// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Payment system indicators — monthly volumes (lakh) and values (₹ crore) across
// settlement and payment systems in India. Source: RBI Bulletin Table 45.
// Covers Nov-2019 to the most recent available month, newest-first.
export interface PaymentSystemIndicatorColumn {
    group   : string;  // Instrument name, e.g. "2.7 UPI @"
    measure : string;  // "Volume (lakh)" or "Value (₹ crore)"
}

export interface PaymentSystemIndicatorRow {
    month  : string;               // "Jan-2026" (newest-first)
    values : (number | null)[];    // aligned to columns[]
}

export interface PaymentSystemIndicators {
    reportTitle : string;
    notes       : string[];
    columns     : PaymentSystemIndicatorColumn[];
    data        : PaymentSystemIndicatorRow[];
}

/**
 * Fetch the payment system indicators table from the build-synced JSON.
 */
export async function getPaymentSystemIndicators() : Promise<PaymentSystemIndicators> {
    return loadData<PaymentSystemIndicators>("payment-system-indicators");
}
