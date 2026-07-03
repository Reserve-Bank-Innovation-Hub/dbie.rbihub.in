"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { AgriProductionMajorCropsRow } from "@/lib/api/tables/index-numbers-of-agricultural-production-major-crops";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface AgriProductionMajorCropsChartProps {
    data     : AgriProductionMajorCropsRow[];
    base   ? : string;
    title  ? : string;
    height ? : number;
}

const AgriProductionMajorCropsChart : React.FC<AgriProductionMajorCropsChartProps> = ({
    data,
    base    = "",
    title   = "Index numbers of agricultural production — major crops",
    height  = 500,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);
    const x = chartData.map(d => d.year);

    const baseLabel = base ? ` (base ${base})` : "";

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.allCrops),
            name          : "All crops",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.greenMid, width : 2.5 },
            hovertemplate : "<b>All crops</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.foodGrains),
            name          : "Food-grains",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.yellowDark, width : 2 },
            hovertemplate : "<b>Food-grains</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.nonFoodGrains),
            name          : "Non-food-grains",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.blueMid, width : 2 },
            hovertemplate : "<b>Non-food-grains</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.oilSeeds),
            name          : "Oil-seeds",
            type          : "scatter",
            mode          : "lines",
            line          : { color : CHART_COLORS.orangeMid, width : 2 },
            hovertemplate : "<b>Oil-seeds</b><br>%{x}<br>%{y:,.1f}<extra></extra>",
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

    const config : Partial<Plotly.Config> = getBaseConfig("agri_production_major_crops_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "agri_production_major_crops_chart",
            height   : 800,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <div className="agri-production-major-crops-chart">
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

export default AgriProductionMajorCropsChart;
