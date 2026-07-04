// OTHER ===============================================================================================================
import { loadData } from "./loadData";

// TYPES ===============================================================================================================
export interface HomeMarker {
    label : string;
    value : string;
    as_of : string;
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

export interface HomePayload {
    markers : HomeMarker[];
    charts  : {
        usd_inr   : HomeChart;
        inflation : HomeChart;
        corridor  : HomeChart;
        upi       : HomeChart;
        trade     : HomeChart;
        reserves  : HomeChart;
    };
}

/**
 * The home page's markers and chart series, derived at data:build time by
 * data/processors/home.mjs from the committed datasets.
 */
export function getHomeData() : HomePayload {
    return loadData<HomePayload>("home");
}
