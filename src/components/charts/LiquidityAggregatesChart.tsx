"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { LiquidityAggregateRow } from "@/lib/api/tables/liquidity-aggregates";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

// "2026:01 (JAN)" -> "2026-01-01" (a real date, so Plotly can use a time axis).
const periodToISO = (label : string) : string => {
    const m = label.match(/^(\d{4}):(\d{2})\s*\(/);
    if (!m) return label;
    return `${m[1]}-${m[2]}-01`;
};

interface LiquidityAggregatesChartProps {
    data     : LiquidityAggregateRow[];
    title  ? : string;
    height ? : number;
}

const LiquidityAggregatesChart : React.FC<LiquidityAggregatesChartProps> = ({
    data,
    title = "Liquidity aggregates over time",
    height = 480,
}) => {
    // Data arrives newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => periodToISO(d.period)), [ chartData ]);

    // Plot the three headline series: NM3 (values[0]), L1 (values[3]), L2 (values[9]).
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const periodLabels = chartData.map(d => d.period);

        return [
            {
                x,
                y             : chartData.map(d => d.values[0]),
                name          : "NM3",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.blueMid, width : 2 },
                customdata    : periodLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f} cr.<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.values[3]),
                name          : "L1",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.greenMid, width : 2 },
                customdata    : periodLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f} cr.<br>" +
                    "<extra></extra>",
            },
            {
                x,
                y             : chartData.map(d => d.values[9]),
                name          : "L2",
                type          : "scatter",
                mode          : "lines",
                line          : { color : CHART_COLORS.purpleDark, width : 2 },
                customdata    : periodLabels,
                hovertemplate :
                    "<b>%{fullData.name}</b><br>" +
                    "%{customdata}<br>" +
                    "₹%{y:,.0f} cr.<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Period", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    { count : 1,  label : "1Y",  step : "year", stepmode : "backward" },
                    { count : 5,  label : "5Y",  step : "year", stepmode : "backward" },
                    { count : 10, label : "10Y", step : "year", stepmode : "backward" },
                    { step : "all", label : "All" },
                ],
            },
        }),
        yaxis  : createAxis("Rupees crores", { rangemode : "tozero" }),
        height,
        margin : { t : 80, b : 40, l : 80, r : 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("liquidity_aggregates_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "liquidity_aggregates_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="liquidity-aggregates-chart">
            <Plot
                data={traces}
                layout={layout}
                config={config}
                style={{ width : "100%", height : "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default LiquidityAggregatesChart;
