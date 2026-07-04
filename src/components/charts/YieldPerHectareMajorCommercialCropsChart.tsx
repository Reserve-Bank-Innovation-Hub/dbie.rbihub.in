"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { YieldPerHectareMajorCommercialCropsRow } from "@/lib/api/tables/yield-per-hectare-major-commercial-crops";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface YieldPerHectareMajorCommercialCropsChartProps {
    data     : YieldPerHectareMajorCommercialCropsRow[];
    unit   ? : string;
    title  ? : string;
    height ? : number;
}

const YieldPerHectareMajorCommercialCropsChart : React.FC<YieldPerHectareMajorCommercialCropsChartProps> = ({
    data,
    unit    = "Kg/hectare",
    title   = "Yield per hectare — major commercial crops",
    height  = 500,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);
    const x = chartData.map(d => d.year);

    // Sugarcane yield is an order of magnitude higher than other crops, so it sits on
    // a secondary axis to avoid flattening the other series.
    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.groundnut),
            name          : "Groundnut",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : { color : CHART_COLORS.yellowMid, width : 2 },
            hovertemplate : "<b>Groundnut</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.totalOilseeds),
            name          : "Total oilseeds",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : { color : CHART_COLORS.orangeMid, width : 2 },
            hovertemplate : "<b>Total oilseeds</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.cottonLint),
            name          : "Cotton (lint)",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y",
            line          : { color : CHART_COLORS.blueMid, width : 2 },
            hovertemplate : "<b>Cotton (lint)</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
        {
            x,
            y             : chartData.map(d => d.sugarcane),
            name          : "Sugarcane",
            type          : "scatter",
            mode          : "lines",
            yaxis         : "y2",
            line          : { color : CHART_COLORS.greenMid, width : 2 },
            hovertemplate : "<b>Sugarcane</b><br>%{x}<br>%{y:,.0f} " + unit + "<extra></extra>",
        },
    ], [ chartData, x, unit ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year"),
        yaxis  : createAxis(`Yield (${unit})`, { rangemode : "tozero" }),
        yaxis2 : createAxis(`Sugarcane yield (${unit})`, {
            overlaying : "y",
            side       : "right",
            rangemode  : "tozero",
        }),
        height,
        margin : { t : 80, b : 40, l : 80, r : 80 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("yield_per_hectare_major_commercial_crops_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "yield_per_hectare_major_commercial_crops_chart",
            height   : 800,
            width    : 1400,
            scale    : 2,
        },
    });

    return (
        <div className="yield-per-hectare-major-commercial-crops-chart">
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

export default YieldPerHectareMajorCommercialCropsChart;
