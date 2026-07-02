"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { GoldAndSilverPriceRow, GoldAndSilverPricesUnits } from "@/lib/api/tables/gold-and-silver-prices";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jan. 2026" -> "2026-01-01" (a real date, so Plotly can use a time axis).
const monthToISO = (label : string) : string => {
    const m = label.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
    if (!m) return label;
    const idx = MONTHS.indexOf(m[1]);
    if (idx < 0) return label;
    return `${m[2]}-${String(idx + 1).padStart(2, "0")}-01`;
};

interface GoldAndSilverPricesChartProps {
    data     : GoldAndSilverPriceRow[];
    units    : GoldAndSilverPricesUnits;
    title  ? : string;
    height ? : number;
}

const GoldAndSilverPricesChart : React.FC<GoldAndSilverPricesChartProps> = ({
    data,
    units,
    title = "Monthly average price of gold and silver in Mumbai",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => monthToISO(d.month)), [ chartData ]);

    // Gold and silver differ enough in magnitude that a shared axis flattens one
    // of them, so silver sits on a secondary y-axis.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const monthLabels = chartData.map(d => d.month);

        return [
            {
                x,
                y             : chartData.map(d => d.gold),
                name          : "Gold",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y",
                line          : {
                    color : CHART_COLORS.yellowMid,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f}<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.silver),
                name          : "Silver",
                type          : "scatter",
                mode          : "lines",
                yaxis         : "y2",
                line          : {
                    color : CHART_COLORS.blueMid,
                    width : 2,
                },
                customdata    : monthLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f}<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Month", {
            type          : "date",
            rangeslider   : {visible : true},
            rangeselector : {
                buttons : [
                    {count : 1, label : "1Y", step : "year", stepmode : "backward"},
                    {count : 5, label : "5Y", step : "year", stepmode : "backward"},
                    {count : 10, label : "10Y", step : "year", stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis(`Gold (${units.gold})`, {
            rangemode : "tozero",
        }),
        yaxis2 : createAxis(`Silver (${units.silver})`, {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height,
        margin : {t : 80, b : 150, l : 80, r : 80},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("gold_and_silver_prices_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "gold_and_silver_prices_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="gold-and-silver-prices-chart">
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

export default GoldAndSilverPricesChart;
