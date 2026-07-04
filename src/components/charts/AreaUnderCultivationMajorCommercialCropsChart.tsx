"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { AreaUnderCultivationMajorCommercialCropsRow } from "@/lib/api/tables/area-under-cultivation-major-commercial-crops";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface AreaUnderCultivationMajorCommercialCropsChartProps {
    data     : AreaUnderCultivationMajorCommercialCropsRow[];
    units    : string;
    title  ? : string;
    height ? : number;
}

const AreaUnderCultivationMajorCommercialCropsChart : React.FC<AreaUnderCultivationMajorCommercialCropsChartProps> = ({
    data,
    units,
    title  = "Area under cultivation of major commercial crops over time",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const years = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : years,
            y             : chartData.map(d => d.total_oilseeds),
            name          : "Total oilseeds",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.yellowMid, width: 2 },
            hovertemplate : "<b>%{fullData.name}</b><br>%{x}<br>%{y:,.2f}<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.cotton_lint),
            name          : "Cotton lint",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.blueMid, width: 2 },
            hovertemplate : "<b>%{fullData.name}</b><br>%{x}<br>%{y:,.2f}<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.sugarcane),
            name          : "Sugarcane",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate : "<b>%{fullData.name}</b><br>%{x}<br>%{y:,.2f}<extra></extra>",
        },
        {
            x             : years,
            y             : chartData.map(d => d.raw_jute_mesta),
            name          : "Raw jute & mesta",
            type          : "scatter",
            mode          : "lines",
            line          : { color: CHART_COLORS.orangeMid, width: 2 },
            hovertemplate : "<b>%{fullData.name}</b><br>%{x}<br>%{y:,.2f}<extra></extra>",
        },
    ], [ chartData, years ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis(`Area (${units})`, { rangemode: "tozero" }),
        height,
        margin : {t : 80, b : 40, l : 90, r : 40},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("area_under_cultivation_major_commercial_crops_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "area_under_cultivation_major_commercial_crops_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="area-under-cultivation-major-commercial-crops-chart">
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

export default AreaUnderCultivationMajorCommercialCropsChart;
