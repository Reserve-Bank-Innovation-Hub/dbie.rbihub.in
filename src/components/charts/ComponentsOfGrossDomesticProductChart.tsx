"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ComponentsOfGrossDomesticProductRow } from "@/lib/api/tables/components-of-gross-domestic-product";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ComponentsOfGrossDomesticProductChartProps {
    data     : ComponentsOfGrossDomesticProductRow[];
    title  ? : string;
    height ? : number;
}

const ComponentsOfGrossDomesticProductChart : React.FC<ComponentsOfGrossDomesticProductChartProps> = ({
    data,
    title = "GDP at constant prices (base year 2011-12)",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right time axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    const x = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => [
        {
            x,
            y             : chartData.map(d => d.gdp_const),
            name          : "GDP — constant prices",
            type          : "scatter",
            mode          : "lines",
            line          : {
                color : CHART_COLORS.blueMid,
                width : 2,
            },
            customdata    : x,
            hovertemplate :
                "<b>%{fullData.name}</b><br>" +
                "%{customdata}<br>" +
                "₹%{y:,.0f} crores<br>" +
                "<extra></extra>",
        },
    ], [ chartData, x ]);

    // Range selector uses count/step on a category axis — use slice instead.
    const totalYears = chartData.length;

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 20),
        xaxis  : createAxis("Year", {
            type        : "category",
            rangeslider : { visible: true },
            tickangle   : -45,
            nticks      : 15,
        }),
        yaxis  : createAxis("Rupees crores", {
            rangemode : "tozero",
        }),
        height,
        margin : { t: 80, b: 150, l: 100, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.35,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("components_of_gdp_chart", {
        toImageButtonOptions : {
            format   : "png",
            filename : "components_of_gdp_chart",
            height   : 1000,
            width    : 1600,
            scale    : 2,
        },
    });

    return (
        <div className="components-of-gdp-chart">
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

export default ComponentsOfGrossDomesticProductChart;
