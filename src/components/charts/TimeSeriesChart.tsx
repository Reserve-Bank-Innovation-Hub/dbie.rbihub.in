"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, getBaseLayout, getBaseConfig, createTitle, createAxis } from "./chartConfig";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// The generic time-series chart: one shared date axis, any number of named series.
// Pages adapt their payloads to this shape; series toggling uses Plotly's legend
// (click to hide/show, double-click to isolate) — series beyond `defaultVisible`
// start as legend-only entries.

export interface TimeSeriesChartSeries {
    key      : string;
    label    : string;
    values   : (number | null)[];
    color  ? : string;
    dash   ? : "solid" | "dot" | "dash" | "longdash" | "dashdot" | "longdashdot";
}

interface TimeSeriesChartProps {
    dates            : string[];                  // ISO YYYY-MM-DD, aligned with every series' values
    series           : TimeSeriesChartSeries[];
    title          ? : string;
    yAxisTitle     ? : string;
    height         ? : number | "fill";           // px, or "fill" to track the parent's height
    valueDecimals  ? : number;                    // hover precision
    valueSuffix    ? : string;                    // e.g. "%" appended in hover
    defaultVisible ? : string[];                  // series keys plotted initially; others start legend-only
    exportName     ? : string;                    // download-as-image filename
}

// Default trace colours, cycled when there are more series than colours.
const PALETTE : string[] = [
    CHART_COLORS.purpleDark,
    CHART_COLORS.blueMid,
    CHART_COLORS.greenMid,
    CHART_COLORS.orangeMid,
    CHART_COLORS.redMid,
    CHART_COLORS.yellowDark,
    CHART_COLORS.blueDark,
    CHART_COLORS.greenDark,
    CHART_COLORS.redDark,
    CHART_COLORS.purpleLight,
    CHART_COLORS.blueLight,
    CHART_COLORS.redLight,
];

// Series beyond this many start legend-only unless defaultVisible says otherwise.
const MAX_DEFAULT_VISIBLE = 8;

const TimeSeriesChart : React.FC<TimeSeriesChartProps> = ({
    dates,
    series,
    title,
    yAxisTitle = "",
    height = 600,
    valueDecimals = 2,
    valueSuffix = "",
    defaultVisible,
    exportName,
}) => {
    // Sort chronologically once; payloads arrive newest-first or oldest-first.
    const order = useMemo(() => {
        return dates
            .map((d, i) => [ d, i ] as const)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([ , i ]) => i);
    }, [ dates ]);

    const sortedDates = useMemo(() => order.map(i => dates[i]), [ order, dates ]);

    const visibleKeys = useMemo(() => {
        if (defaultVisible) return new Set(defaultVisible);
        return new Set(series.slice(0, MAX_DEFAULT_VISIBLE).map(s => s.key));
    }, [ defaultVisible, series ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        return series.map((s, idx) => ({
            x             : sortedDates,
            y             : order.map(i => s.values[i]),
            name          : s.label,
            type          : "scatter",
            mode          : "lines",
            connectgaps   : false,
            visible       : visibleKeys.has(s.key) ? true : "legendonly",
            line          : {
                color : s.color ?? PALETTE[idx % PALETTE.length],
                width : 1.5,
                ...(s.dash ? {dash : s.dash} : {}),
            },
            hovertemplate :
                `<b>${s.label}</b><br>` +
                "%{x}<br>" +
                `%{y:.${valueDecimals}f}${valueSuffix}<br>` +
                "<extra></extra>",
        }));
    }, [ series, sortedDates, order, visibleKeys, valueDecimals, valueSuffix ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, 20)} : {}),
        xaxis  : createAxis("Date", {
            type          : "date",
            rangeslider   : {visible : true},
            // Top-right, clear of the legend row at top-left.
            rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                buttons : [
                    {count : 3,  label : "3M",  step : "month", stepmode : "backward"},
                    {count : 1,  label : "1Y",  step : "year",  stepmode : "backward"},
                    {count : 5,  label : "5Y",  step : "year",  stepmode : "backward"},
                    {count : 10, label : "10Y", step : "year",  stepmode : "backward"},
                    {step : "all", label : "All"},
                ],
            },
        }),
        yaxis  : createAxis(yAxisTitle),
        legend : {
            orientation : "h",
            yanchor     : "bottom",
            y           : 1.02,
            xanchor     : "left",
            x           : 0,
        },
        // The base layout's 140px bottom margin is sized for below-chart
        // legends; ours sits on top, so reclaim the space for the plot.
        margin : {t : 80, b : 40, l : 80, r : 40},
    }), [ title, yAxisTitle ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "chart").toLowerCase().replace(/\s+/g, "-")),
        [ exportName, title ],
    );

    return (
        <Plot
            data={traces as Plotly.Data[]}
            layout={layout}
            config={config}
            style={{width : "100%", height : height === "fill" ? "100%" : `${height}px`}}
            useResizeHandler
        />
    );
};

export default TimeSeriesChart;
