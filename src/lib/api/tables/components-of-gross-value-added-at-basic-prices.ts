// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Annual components of gross value added at basic prices (HSIE national income series).
export interface ComponentsOfGrossValueAddedAtBasicPricesRow {
    year                          : string;         // e.g. "2025-26" (newest-first)

    // Agriculture, forestry & fishing
    agri_const                    : number | null;
    agri_curr                     : number | null;

    // Industry
    industry_const                : number | null;
    industry_curr                 : number | null;

    // Mining & quarrying
    mining_quarrying_const        : number | null;
    mining_quarrying_curr         : number | null;

    // Manufacturing
    manufacturing_const           : number | null;
    manufacturing_curr            : number | null;

    // Electricity, gas, water supply & other utility services
    electricity_gas_water_const   : number | null;
    electricity_gas_water_curr    : number | null;

    // Services
    services_const                : number | null;
    services_curr                 : number | null;

    // Construction
    construction_const            : number | null;
    construction_curr             : number | null;

    // Trade, repair, hotels, restaurants & transport
    trade_hotels_transport_const  : number | null;
    trade_hotels_transport_curr   : number | null;

    // Financial, real estate & professional services
    financial_realestate_const    : number | null;
    financial_realestate_curr     : number | null;

    // Public administration, defence & other services
    public_admin_defence_const    : number | null;
    public_admin_defence_curr     : number | null;

    // GVA at basic prices
    gva_const                     : number | null;
    gva_curr                      : number | null;

    // Private final consumption expenditure
    pfce_const                    : number | null;
    pfce_curr                     : number | null;

    // Government final consumption expenditure
    gfce_const                    : number | null;
    gfce_curr                     : number | null;

    // Gross fixed capital formation
    gfcf_const                    : number | null;
    gfcf_curr                     : number | null;

    // Changes in stocks
    changes_in_stocks_const       : number | null;
    changes_in_stocks_curr        : number | null;

    // Valuables
    valuables_const               : number | null;
    valuables_curr                : number | null;

    // Exports
    exports_const                 : number | null;
    exports_curr                  : number | null;

    // Imports
    imports_const                 : number | null;
    imports_curr                  : number | null;

    // Discrepancies
    discrepancies_const           : number | null;
    discrepancies_curr            : number | null;

    // GDP at market prices (constant prices only)
    gdp_const                     : number | null;
}

export interface ComponentsOfGrossValueAddedAtBasicPrices {
    reportTitle : string;
    baseYear    : string;
    unit        : string;
    data        : ComponentsOfGrossValueAddedAtBasicPricesRow[];
}

/**
 * Fetch annual components of gross value added at basic prices from the build-synced JSON.
 */
export async function getComponentsOfGrossValueAddedAtBasicPrices() : Promise<ComponentsOfGrossValueAddedAtBasicPrices> {
    return loadData<ComponentsOfGrossValueAddedAtBasicPrices>("components-of-gross-value-added-at-basic-prices");
}
