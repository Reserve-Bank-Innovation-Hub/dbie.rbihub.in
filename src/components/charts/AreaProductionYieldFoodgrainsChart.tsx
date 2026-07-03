"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { AreaProductionYieldRow } from "@/lib/api/tables/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface AreaProductionYieldFoodgrainsChartProps {
    data     : AreaProductionYieldRow[];
    base   ? : string;
    title  ? : string;
    height ? : number;
}

const AreaProductionYieldFoodgrainsChart : React.FC<AreaProductionYieldFoodgrainsChartProps> = ({
    data,
    base    = "",
    title   = "Index numbers of area, production and yield — foodgrains and all crops",
    height  = 500,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);
    const x = chartData.map(d => d.year);

    const baseLabel = base ? ` (base ${base})` : "";

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.allCropsProduction),
            name          : "All crops — production",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.greenMid, width : 2.5 },
            hovertemplate : "<b>All crops production</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.foodGrainsProduction),
            name          : "Foodgrains — production",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.yellowDark, width : 2 },
            hovertemplate : "<b>Foodgrains production</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.allCropsArea),
            name          : "All crops — area",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.blueMid, width : 2 },
            hovertemplate : "<b>All crops area</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.allCropsYield),
            name          : "All crops — yield",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.orangeMid, width : 2 },
            hovertemplate : "<b>All crops yield</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
    ], [ chartData, x ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis(`Index${baseLabel}`, { rangemode : "tozero" }),
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

    const config : Partial<Plotly.Config> = getBaseConfig("area_production_yield_foodgrains_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "area_production_yield_foodgrains_chart",
            height   : 800,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <div className="area-production-yield-foodgrains-chart">
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

export default AreaProductionYieldFoodgrainsChart;
