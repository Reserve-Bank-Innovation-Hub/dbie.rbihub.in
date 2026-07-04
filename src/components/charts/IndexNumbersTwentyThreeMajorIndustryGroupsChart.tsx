"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { IndustryGroupRow, IndustryGroupIndustry } from "@/lib/api/tables/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Show at most 5 industries by weight (heaviest first).
const TOP_N = 5;

const LINE_COLORS = [
    CHART_COLORS.purpleDark,
    CHART_COLORS.blueMid,
    CHART_COLORS.greenMid,
    CHART_COLORS.yellowMid,
    CHART_COLORS.orangeMid,
];

interface IndexNumbersTwentyThreeMajorIndustryGroupsChartProps {
    data       : IndustryGroupRow[];
    industries : IndustryGroupIndustry[];
    title    ? : string;
    height   ? : number;
}

const IndexNumbersTwentyThreeMajorIndustryGroupsChart : React.FC<IndexNumbersTwentyThreeMajorIndustryGroupsChartProps> = ({
    data,
    industries,
    title  = "Index numbers of major industry groups of manufacturing",
    height = 600,
}) => {
    // Data is newest-first; reverse to oldest-first for a left-to-right axis.
    const chartData = useMemo(() => [ ...data ].reverse(), [ data ]);

    // Pick the top N industries by weight descending; fall back to first N if weights are missing.
    const topIndustries = useMemo(() => {
        const sorted = [ ...industries ].sort((a, b) => {
            const wa = a.weight ?? -Infinity;
            const wb = b.weight ?? -Infinity;
            return wb - wa;
        });
        return sorted.slice(0, TOP_N);
    }, [ industries ]);

    const xLabels = useMemo(() => chartData.map(d => d.year), [ chartData ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        return topIndustries.map((ind, i) => ({
            x             : xLabels,
            y             : chartData.map(d => d.values[ind.code] ?? null),
            name          : ind.label,
            type          : "scatter",
            mode          : "lines",
            line          : { color: LINE_COLORS[i % LINE_COLORS.length], width: 2 },
            hovertemplate :
                `<b>${ind.label}</b><br>` +
                "Year: %{x}<br>" +
                "Index: %{y:.1f}<br>" +
                "<extra></extra>",
        }));
    }, [ topIndustries, chartData, xLabels ]);

    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title  : createTitle(title, 18),
        xaxis  : createAxis("Year", { type: "category" }),
        yaxis  : createAxis("Index value"),
        height,
        margin : { t: 80, b: 40, l: 70, r: 40 },
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
    });

    const config : Partial<Plotly.Config> = getBaseConfig(
        "index_numbers_twenty_three_major_industry_groups",
        {
            toImageButtonOptions: {
                format   : "png",
                filename : "index_numbers_twenty_three_major_industry_groups",
                height   : 1000,
                width    : 1600,
                scale    : 2,
            },
        },
    );

    return (
        <div className="index-numbers-twenty-three-chart">
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

export default IndexNumbersTwentyThreeMajorIndustryGroupsChart;
