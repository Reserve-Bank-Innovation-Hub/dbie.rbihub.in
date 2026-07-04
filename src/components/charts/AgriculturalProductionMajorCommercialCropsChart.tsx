"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { AgriculturalProductionMajorCommercialCropsRow } from "@/lib/api/tables/agricultural-production-major-commercial-crops";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface AgriculturalProductionMajorCommercialCropsChartProps {
    data     : AgriculturalProductionMajorCommercialCropsRow[];
    units    : string;
    title  ? : string;
    height ? : number;
}

const AgriculturalProductionMajorCommercialCropsChart : React.FC<AgriculturalProductionMajorCommercialCropsChartProps> = ({
    data,
    units,
    title  = "Agricultural production of major commercial crops over time",
    height = 600,
}) => {
    // The file is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const years = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    // Sugarcane dwarfs all other crops (in the thousands vs tens), so put it on a
    // secondary y-axis to keep the other series readable.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x             : years,
            y             : chartData.map(d => d.sugarcane),
            name          : "Sugarcane",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y2",
            line          : { color: CHART_COLORS.greenMid, width: 2 },
            hovertemplate : "<b>%{fullData.name}</b><br>%{x}<br>%{y:,.2f}<extra></extra>",
        },
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
        yaxis  : createAxis(`Production (${units})`, { rangemode: "tozero" }),
        yaxis2 : createAxis(`Sugarcane (${units})`, {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height,
        margin : {t : 80, b : 40, l : 90, r : 90},
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("agricultural_production_major_commercial_crops_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "agricultural_production_major_commercial_crops_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="agricultural-production-major-commercial-crops-chart">
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

export default AgriculturalProductionMajorCommercialCropsChart;
