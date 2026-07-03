// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual macro-economic aggregates at constant prices (base year 2011-12) — NSO.
export interface MacroEconomicAggregatesConstantPricesRow {
    year                         : string;          // e.g. "2025-26" (newest-first)
    gva_at_basic_prices          : number | null;   // ₹ crores
    net_taxes_on_products        : number | null;
    gross_domestic_product       : number | null;
    consumption_of_fixed_capital : number | null;
    net_domestic_product         : number | null;
    primary_income_from_row_net  : number | null;
    gross_national_income        : number | null;
    net_national_income          : number | null;
    gross_capital_formation      : number | null;
    net_capital_formation        : number | null;
    per_capita_gdp               : number | null;   // ₹ (not crores)
    per_capita_gni               : number | null;
    per_capita_nni               : number | null;
    per_capita_pfce              : number | null;
}

export interface MacroEconomicAggregatesConstantPrices {
    reportTitle : string;
    unit        : string;
    baseYear    : string;
    data        : MacroEconomicAggregatesConstantPricesRow[];
}

/**
 * Fetch annual macro-economic aggregates at constant prices from the build-synced JSON.
 */
export async function getMacroEconomicAggregatesConstantPrices() : Promise<MacroEconomicAggregatesConstantPrices> {
    return loadData<MacroEconomicAggregatesConstantPrices>("macro-economic-aggregates-at-constant-prices");
}
