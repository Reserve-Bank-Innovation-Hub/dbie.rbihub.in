// OTHER ===============================================================================================================
import { loadData } from "./loadData";

export interface ExchangeRateDataRaw {
    date          : string;
    dateString    : string;
    usDollar      : number;
    poundSterling : number;
    euro          : number;
    japaneseYen   : number;
}

export interface ExchangeRateData {
    date          : Date;
    dateString    : string;
    usDollar      : number;
    poundSterling : number;
    euro          : number;
    japaneseYen   : number;
}

export type CurrencyKey = "usDollar" | "poundSterling" | "euro" | "japaneseYen";

export interface Currency {
    name        : string;
    key         : CurrencyKey;
    displayName : string;
}

export interface ParsedExchangeRates {
    data       : ExchangeRateData[];
    currencies : Currency[];
}

/**
 * Fetch exchange rates data from the API
 */
export async function getExchangeRates() : Promise<ParsedExchangeRates> {
    const raw = loadData<{
        data : ExchangeRateDataRaw[];
        currencies : Currency[];
    }>("exchange-rates");

    // Transform date strings to Date objects for frontend use
    const transformedData : ParsedExchangeRates = {
        currencies : raw.currencies,
        data       : raw.data.map(item => ({
            ...item,
            date : new Date(item.date),
        })),
    };

    return transformedData;
}

// Forex Reserves Types
export interface ForexReserveData {
    weekEnded              : string;
    year                   : string;
    totalReservesINR       : number;
    totalReservesUSD       : number;
    foreignCurrencyINR     : number;
    foreignCurrencyUSD     : number;
    goldINR                : number;
    goldUSD                : number;
    goldVolumeMetricTonnes : number;
    sdrsINR                : number;
    sdrsUSD                : number;
    rtpINR                 : number;
    rtpUSD                 : number;
}

export interface ParsedForexReserves {
    data        : ForexReserveData[];
    reportTitle : string;
}

/**
 * Fetch forex reserves data from the API
 */
export async function getForexReserves() : Promise<ParsedForexReserves> {
    return loadData<ParsedForexReserves>("forex-reserves");
}

/**
 * Fetch recent forex reserves data (last 6 months) for home page charts
 */
export async function getForexReservesRecent() : Promise<ParsedForexReserves> {
    return loadData<ParsedForexReserves>("forex-reserves-recent");
}

// Foreign Investment Inflows Types
export interface ForeignInvestmentInflowsRow {
    month                  : string;
    netFdi                 : number;
    netPortfolioInvestment : number;
    totalInvestmentInflows : number;
}

export interface ForeignInvestmentInflowsData {
    data        : ForeignInvestmentInflowsRow[];
    reportTitle : string;
    unit        : string;
}

/**
 * Fetch foreign investment inflows data from the API
 */
export async function getForeignInvestmentInflows() : Promise<ForeignInvestmentInflowsData> {
    return loadData<ForeignInvestmentInflowsData>("foreign-investment-inflows");
}

/**
 * Fetch recent foreign investment inflows data (last 12 months) for home page charts
 */
export async function getForeignInvestmentInflowsRecent() : Promise<ForeignInvestmentInflowsData> {
    return loadData<ForeignInvestmentInflowsData>("foreign-investment-inflows-recent");
}
