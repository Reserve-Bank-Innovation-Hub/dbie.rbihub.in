// OTHER ===============================================================================================================
import { loadData } from "../loadData";

// Consumer Price Index — Annual Average (Handbook of Statistics on Indian Economy).

export interface CpiAlRow {
    year  : string;        // e.g. "2024-25" (newest-first)
    index : number | null; // index value
    base  : string;        // e.g. "1960=100" or "1986-87=100"
}

export interface CpiIwRow {
    year            : string;        // e.g. "2024-25" (newest-first)
    general         : number | null; // general CPI-IW index
    food_beverages  : number | null; // food and beverages sub-index
    base            : string;        // e.g. "2016=100"
}

export interface NewCpiRow {
    year     : string;        // e.g. "2024-25" (newest-first)
    rural    : number | null; // rural CPI
    urban    : number | null; // urban CPI
    combined : number | null; // combined CPI
}

export interface CpiSeriesMeta {
    label : string;
    note  : string;
}

export interface CpiAlSeries extends CpiSeriesMeta {
    data : CpiAlRow[];
}

export interface CpiIwSeries extends CpiSeriesMeta {
    data : CpiIwRow[];
}

export interface NewCpiSeries extends CpiSeriesMeta {
    data : NewCpiRow[];
}

export interface ConsumerPriceIndexAnnualAverage {
    reportTitle : string;
    series      : {
        cpi_al  : CpiAlSeries;
        cpi_iw  : CpiIwSeries;
        new_cpi : NewCpiSeries;
    };
}

/**
 * Fetch Consumer Price Index annual average data from the build-synced JSON.
 */
export async function getConsumerPriceIndexAnnualAverage() : Promise<ConsumerPriceIndexAnnualAverage> {
    return loadData<ConsumerPriceIndexAnnualAverage>("consumer-price-index-annual-average");
}
