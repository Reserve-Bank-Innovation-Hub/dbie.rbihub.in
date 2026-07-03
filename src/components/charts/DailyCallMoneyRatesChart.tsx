"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { DailyCallMoneyRateRow } from "@/lib/api/tables/daily-call-money-rates";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface DailyCallMoneyRatesChartProps {
    data     : DailyCallMoneyRateRow[];
    title  ? : string;
    height ? : number;
}

const DailyCallMoneyRatesChart : React.FC<DailyCallMoneyRatesChartProps> = ({
    data,
    title = "Daily weighted average call / notice money rates",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        return [
            {
                x             : chartData.map(d => d.date),
                y             : chartData.map(d => d.minRate),
                name          : "Minimum rate",
                type          : "scatter",
                mode          : "lines",
                line          : {
                    color : CHART_COLORS.blueMid,
                    width : 1.5,
                },
                hovertemplate :
                    "<b>Minimum rate</b><br>" +
                    "%{x}<br>" +
                    "%{y:.2f}%<br>" +
                    "<extra></extra>",
            },
            {
                x             : chartData.map(d => d.date),
                y             : chartData.map(d => d.maxRate),
                name          : "Maximum rate",
                type          : "scatter",
                mode          : "lines",
                line          : {
                    color : CHART_COLORS.orangeMid,
                    width : 1.5,
                },
                hovertemplate :
                    "<b>Maximum rate</b><br>" +
                    "%{x}<br>" +
                    "%{y:.2f}%<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : {visible : true},
            rangeselector : {
                buttons : [
                    {count : 3,  label : "3M", step : "month", stepmode : "backward"},
                    {count : 1,  label : "1Y", step : "year",  stepmode : "backward"},
                    {count : 5,  label : "5Y", step : "year",  stepmode : "backward"},
                    {count : 10, label : "10Y", step : "year", stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis("Rate (% per annum)", {
            rangemode : "tozero",
        }),
        height,
        margin : {t : 80, b : 150, l : 80, r : 40},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("daily_call_money_rates_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "daily_call_money_rates_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="daily-call-money-rates-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler={true}
            />
        </div>
    );
};

export default DailyCallMoneyRatesChart;
