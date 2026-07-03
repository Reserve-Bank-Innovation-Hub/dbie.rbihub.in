// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual per capita Net State Domestic Product (NSDP) at current prices,
// state-wise — from the RBI Handbook of Statistics on Indian Economy.
export interface PerCapitaNsdpCurrentPrices {
    reportTitle : string;
    baseYear    : string;
    unit        : string;                              // "Rupees"
    years       : string[];                            // newest-first, e.g. "2024-25"
    states      : string[];                            // 33 states/UTs (includes Puducherry)
    data        : Record<string, (number | null)[]>;   // keyed by state name, aligned to years[]
}

/**
 * Fetch annual per capita NSDP at current prices (base 2011-12), state-wise.
 *
 * Covers 14 years from 2011-12 to 2024-25 across 33 states and union territories.
 * Values are in rupees per capita. Source: National Statistical Office (NSO).
 */
export async function getPerCapitaNsdpCurrentPrices() : Promise<PerCapitaNsdpCurrentPrices> {
    return loadData<PerCapitaNsdpCurrentPrices>("per-capita-net-state-domestic-product-state-wise-at-current-prices");
}
