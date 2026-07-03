// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual Net State Domestic Product (NSDP) at current prices, state-wise —
// from the RBI Handbook of Statistics on Indian Economy.
export interface NsdpCurrentPrices {
    reportTitle : string;
    baseYear    : string;
    unit        : string;                              // "Rupees crores"
    years       : string[];                            // newest-first, e.g. "2024-25"
    states      : string[];                            // 32 states/UTs
    data        : Record<string, (number | null)[]>;   // keyed by state name, aligned to years[]
}

/**
 * Fetch annual NSDP at current prices (base 2011-12), state-wise.
 *
 * Covers 14 years from 2011-12 to 2024-25 across 32 states and union territories.
 * Source: National Statistical Office (NSO).
 */
export async function getNsdpCurrentPrices() : Promise<NsdpCurrentPrices> {
    return loadData<NsdpCurrentPrices>("net-state-domestic-product-state-wise-at-current-prices");
}
