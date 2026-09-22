// OTHER ===============================================================================================================
import { loadData } from "./loadData";

// TYPES ===============================================================================================================
// The shapes here mirror data/processors/home.mjs exactly; change one and change the other.

export interface HomeMarkerSpark {
    dates  : string[];
    values : number[];
}

export interface HomeMarker {
    key      : string;
    label    : string;
    unit     : string;
    value    : string;                            // the number, formatted; the unit is separate
    as_of    : string;
    previous : { value : string; as_of : string };
    delta    : number;                            // latest − previous, in the unit's own terms
    spark    : HomeMarkerSpark;                   // the last 24 observations
}

export interface HomeChartSeries {
    key    : string;
    label  : string;
    values : (number | null)[];
}

export interface HomeChart {
    dates  : string[];
    series : HomeChartSeries[];
}

// Daily nets plus the average of each calendar month's nets.
export interface HomeLiquidityChart extends HomeChart {
    monthly : {
        dates  : string[];
        values : number[];
    };
}

// One curve per date, read across the same ordered tenors.
export interface HomeYieldCurveChart {
    tenors : string[];
    curves : { key : string; label : string; values : number[] }[];
}

// One row per index, one column per month.
export interface HomeHeatmapChart {
    months : string[];
    rows   : { key : string; label : string; values : number[] }[];
}

// Year-on-year growth now against a year ago, one row per sector.
export interface HomeCreditBySectorChart {
    as_of          : string;
    previous_as_of : string;
    rows           : { key : string; label : string; growth : number; previous : number }[];
}

// Shares of retail payment volume in two months, adding to 100 in each.
export interface HomePaymentsMixChart {
    months      : string[];
    instruments : { key : string; label : string; shares : number[] }[];
}

export interface HomePayload {
    markers : HomeMarker[];
    charts  : {
        gdp              : HomeChart;
        contributions    : HomeChart;
        inflation        : HomeChart;
        corridor         : HomeChart;
        cpi_heatmap      : HomeHeatmapChart;
        yields           : HomeChart;
        yield_curve      : HomeYieldCurveChart;
        transmission     : HomeChart;
        liquidity        : HomeLiquidityChart;
        credit           : HomeChart;
        credit_by_sector : HomeCreditBySectorChart;
        upi_value        : HomeChart;
        upi_volume       : HomeChart;
        payments_mix     : HomePaymentsMixChart;
        usd_inr          : HomeChart;
        trade            : HomeChart;
        flows            : HomeChart;
        reserves         : HomeChart;
    };
}

/**
 * The home page's stat tiles and chart series, derived at data:build time by
 * data/processors/home.mjs from the committed datasets.
 */
export function getHomeData() : HomePayload {
    return loadData<HomePayload>("home");
}
