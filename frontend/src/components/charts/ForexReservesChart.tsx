"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// LIB =================================================================================================================
import { ForexReserveData } from "@/lib/api/indicators";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

interface ForexReservesChartProps {
    data     : ForexReserveData[];
    title  ? : string;
    height ? : number;
}

const ForexReservesChart : React.FC<ForexReservesChartProps> = ({
    data,
    title = "Foreign exchange reserves — last 6 months",
}) => {
    // Prepare data (reverse to show oldest to newest)
    const chartData = useMemo(() => {
        return [ ...data ].reverse();
    }, [ data ]);

    // Create relative time labels with 'w' suffix
    const relativeLabels = useMemo(() => {
        return chartData.map((_, index) => {
            const weeksAgo = chartData.length - 1 - index;
            return `${weeksAgo}w`;
        });
    }, [ chartData ]);

    // Create grouped bar + line traces
    const traces = useMemo(() => {
        const weekEnded = chartData.map(d => d.weekEnded);

        return [
            // Bars for components
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.goldUSD),
                name          : "Gold",
                type          : "bar" as const,
                marker        : {
                    color : CHART_COLORS.yellowMid,
                },
                customdata    : weekEnded,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Week: %{customdata}<br>" +
                    "Value: $%{y:,.0f}M<br>" +
                    "<extra></extra>",
            },
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.sdrsUSD),
                name          : "SDRs",
                type          : "bar" as const,
                marker        : {
                    color : CHART_COLORS.greenLight,
                },
                customdata    : weekEnded,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Week: %{customdata}<br>" +
                    "Value: $%{y:,.0f}M<br>" +
                    "<extra></extra>",
            },
            // Foreign Currency Assets as dotted line
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.foreignCurrencyUSD),
                name          : "Foreign currency assets",
                type          : "scatter" as const,
                mode          : "lines+markers" as const,
                line          : {
                    color : CHART_COLORS.blueLight,
                    width : 2,
                },
                marker        : {
                    size   : 6,
                    color  : CHART_COLORS.blueMid,
                    symbol : "diamond" as const,
                },
                customdata    : weekEnded,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Week: %{customdata}<br>" +
                    "Value: $%{y:,.0f}M<br>" +
                    "<extra></extra>",
            },
            // Total reserves as solid line overlay
            {
                x             : relativeLabels,
                y             : chartData.map(d => d.totalReservesUSD),
                name          : "Total reserves",
                type          : "scatter" as const,
                mode          : "lines+markers" as const,
                line          : {
                    color : CHART_COLORS.purpleLight,
                    width : 4,
                },
                marker        : {
                    size   : 8,
                    color  : CHART_COLORS.purpleDark,
                    symbol : "circle" as const,
                },
                customdata    : weekEnded,
                hovertemplate : "<b>%{fullData.name}</b><br>" +
                    "Week: %{customdata}<br>" +
                    "Total: $%{y:,.0f}M<br>" +
                    "<extra></extra>",
            },
        ];
    }, [ chartData ]);

    // Layout configuration
    const layout : Partial<Plotly.Layout> = getBaseLayout({
        title   : createTitle(title),
        barmode : "group",
        xaxis   : createAxis("Weeks ago", {type : "category"}),
        yaxis   : createAxis("USD millions"),
    });

    // Config for Plotly controls
    const config : Partial<Plotly.Config> = getBaseConfig("forex_reserves_chart");

    return (
        <div className="forex-reserves-chart">
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

export default ForexReservesChart;
