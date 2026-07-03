"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { YieldPerHectareFoodgrainsRow } from "@/lib/api/tables/yield-per-hectare-foodgrains";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface YieldPerHectareFoodgrainsChartProps {
    data     : YieldPerHectareFoodgrainsRow[];
    unit   ? : string;
    title  ? : string;
    height ? : number;
}

const YieldPerHectareFoodgrainsChart : React.FC<YieldPerHectareFoodgrainsChartProps> = ({
    data,
    unit    = "Kg/hectare",
    title   = "Yield per hectare — foodgrains",
    height  = 500,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);
    const x = chartData.map(d => d.year);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.rice),
            name          : "Rice",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.blueMid, width : 2 },
            hovertemplate : "<b>Rice</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.wheat),
            name          : "Wheat",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.yellowDark, width : 2 },
            hovertemplate : "<b>Wheat</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.totalCereals),
            name          : "Total cereals",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.greenMid, width : 2 },
            hovertemplate : "<b>Total cereals</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.pulses),
            name          : "Pulses",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.orangeMid, width : 2 },
            hovertemplate : "<b>Pulses</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
    ], [ chartData, x, unit ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis(`Yield (${unit})`, { rangemode : "tozero" }),
        height,
        margin : { t : 80, b : 120, l : 80, r : 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("yield_per_hectare_foodgrains_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "yield_per_hectare_foodgrains_chart",
            height   : 800,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <div className="yield-per-hectare-foodgrains-chart">
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

export default YieldPerHectareFoodgrainsChart;
