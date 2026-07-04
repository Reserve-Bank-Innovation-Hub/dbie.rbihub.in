"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { MoneyStockDataRow } from "@/lib/api/tables/money-stock-measures";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface MoneyStockMeasuresChartProps {
    data     : MoneyStockDataRow[];
    title  ? : string;
    height ? : number;
}

const MoneyStockMeasuresChart : React.FC<MoneyStockMeasuresChartProps> = ({
    data,
    title = "Money stock aggregates (M1, M2, M3, M4)",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.date), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.values["m3"]),
            name          : "M3",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueDark, width: 2 },
            hovertemplate : "<b>M3</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["m1"]),
            name          : "M1",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate : "<b>M1</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["m2"]),
            name          : "M2",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.orangeMid, width: 1.5, dash: "dot" },
            hovertemplate : "<b>M2</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.values["m4"]),
            name          : "M4",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.purpleDark, width: 1.5, dash: "dash" },
            hovertemplate : "<b>M4</b><br>%{x}<br>₹%{y:,.0f} cr<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : { visible: true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count: 1,  label: "1Y",  step: "year", stepmode: "backward" },
                    { count: 5,  label: "5Y",  step: "year", stepmode: "backward" },
                    { count: 10, label: "10Y", step: "year", stepmode: "backward" },
                    { step: "all", label: "All" },
                ],
            },
        }),
        yaxis  : createAxis("₹ crores", { rangemode: "tozero" }),
        height,
        margin : { t: 80, b: 40, l: 90, r: 40 },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("money_stock_measures_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "money_stock_measures_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="money-stock-measures-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default MoneyStockMeasuresChart;
