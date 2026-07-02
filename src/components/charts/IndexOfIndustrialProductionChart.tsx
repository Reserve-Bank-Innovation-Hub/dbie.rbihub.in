"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { IIPDataRow } from "@/lib/api/tables/index-of-industrial-production";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr : false });

interface IndexOfIndustrialProductionChartProps {
    data     : IIPDataRow[];
    title  ? : string;
    height ? : number;
}

const IndexOfIndustrialProductionChart : React.FC<IndexOfIndustrialProductionChartProps> = ({
    data,
    title = "General index over time",
    height = 600,
}) => {
    // The dataset is newest-first; a time series reads oldest -> newest.
    const chronological = useMemo(() => [ ...data ].reverse(), [ data ]);

    const trace = useMemo(() => ({
        x             : chronological.map(d => `${d.period}-01`),
        y             : chronological.map(d => d.index.generalIndex),
        type          : "scatter" as const,
        mode          : "lines" as const,
        name          : "General index",
        line          : { color : CHART_COLORS.purpleDark, width : 2 },
        hovertemplate :
            "<b>General index</b><br>" +
            "Month: %{x|%b %Y}<br>" +
            "Index: %{y:.1f}<br>" +
            "<extra></extra>",
    }), [ chronological ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title   : createTitle(title, 20),
        xaxis   : createAxis("Month", {
            type          : "date",
            rangeslider   : { visible : true },
            rangeselector : {
                buttons : [
                    { count : 6, label : "6M", step : "month", stepmode : "backward" },
                    { count : 1, label : "1Y", step : "year", stepmode : "backward" },
                    { count : 5, label : "5Y", step : "year", stepmode : "backward" },
                    { step : "all", label : "All" },
                ],
            },
        }),
        yaxis   : createAxis("Index (base 2011-12 = 100)"),
        height,
        margin  : { t : 80, b : 150, l : 70, r : 40 },
        legend  : {
            orientation : "h",
            yanchor     : "bottom",
            y           : -0.3,
            xanchor     : "center",
            x           : 0.5,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig("index_of_industrial_production_chart");

    return (
        <div className="index-of-industrial-production-chart">
            <Plot
                data={[ trace ]}
                layout={layout}
                config={config}
                style={{ width : "100%", height : "100%" }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default IndexOfIndustrialProductionChart;
