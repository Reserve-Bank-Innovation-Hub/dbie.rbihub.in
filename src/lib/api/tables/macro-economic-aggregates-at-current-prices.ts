// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual macro-economic aggregates at current prices (base year 2011-12) — NSO.
export interface MacroEconomicAggregatesCurrentPricesRow {
    year                             : string;          // e.g. "2025-26" (newest-first)
    population_lakhs                 : number | null;   // in lakhs
    gva_at_basic_prices              : number | null;   // ₹ crores
    net_taxes_on_products            : number | null;
    gross_domestic_product           : number | null;
    consumption_of_fixed_capital     : number | null;
    net_domestic_product             : number | null;
    primary_income_from_row_net      : number | null;
    gross_national_income            : number | null;
    net_national_income              : number | null;
    gross_national_disposable_income : number | null;
    gross_saving                     : number | null;
    gross_capital_formation          : number | null;
    net_capital_formation            : number | null;
    per_capita_gdp                   : number | null;   // ₹ (not crores)
    per_capita_gni                   : number | null;
    per_capita_nni                   : number | null;
    per_capita_pfce                  : number | null;
}

export interface MacroEconomicAggregatesCurrentPrices {
    reportTitle : string;
    unit        : string;
    baseYear    : string;
    data        : MacroEconomicAggregatesCurrentPricesRow[];
}

/**
 * Fetch annual macro-economic aggregates at current prices from the build-synced JSON.
 */
export async function getMacroEconomicAggregatesCurrentPrices() : Promise<MacroEconomicAggregatesCurrentPrices> {
    return loadData<MacroEconomicAggregatesCurrentPrices>("macro-economic-aggregates-at-current-prices");
}
