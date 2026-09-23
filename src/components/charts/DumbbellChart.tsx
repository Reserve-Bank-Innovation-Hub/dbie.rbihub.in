"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// CHART CONFIG ========================================================================================================
import {
    CHART_FONTS, ChartSchemeLayer, resolveScheme,
    bottomLegend, legendBandHeight, legendRowCount,
    getBaseLayout, getBaseConfig, createTitle, createAxis,
} from "./chartConfig";
import { titleFontSize, useChartWidth, wrapLabel } from "./useChartWidth";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// Before and after, one row per item: two dots joined by a connector. The two dots are two
// shades of one hue — the earlier reading light, the current one dark — because they are the
// same measure at two dates, not two different things. Only the current value is
// direct-labelled; the earlier one is in the legend and the hover.

export interface DumbbellRow {
    key      : string;
    label    : string;
    current  : number | null;
    previous : number | null;
}

interface DumbbellChartProps {
    rows            : DumbbellRow[];
    currentLabel    : string;
    previousLabel   : string;
    title         ? : string;
    xAxisTitle    ? : string;
    valueDecimals ? : number;
    valueSuffix   ? : string;
    height        ? : number | "fill";
    exportName    ? : string;
    scheme        ? : ChartSchemeLayer;   // this chart's own colours, over its kind's and the base
}

const DumbbellChart : React.FC<DumbbellChartProps> = ({
    rows,
    currentLabel,
    previousLabel,
    title,
    xAxisTitle = "",
    valueDecimals = 1,
    valueSuffix = "",
    height = 600,
    exportName,
    scheme,
}) => {
    const [ theme ] = useTheme();

    const [ frame, frameWidth ] = useChartWidth();
    const legendRows = legendRowCount([ previousLabel, currentLabel ], frameWidth);
    const compact = frameWidth < 520;
    const palette = useMemo(() => resolveScheme("dumbbell", scheme, theme), [ scheme, theme ]);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const labels = rows.map(r => (compact ? wrapLabel(r.label, 20) : r.label));
        const connectorX : (number | null)[] = [];
        const connectorY : (string | null)[] = [];
        rows.forEach(r => {
            connectorX.push(r.previous, r.current, null);
            const label = compact ? wrapLabel(r.label, 20) : r.label;
            connectorY.push(label, label, null);
        });

        return [
            {
                x          : connectorX,
                y          : connectorY,
                type       : "scatter",
                mode       : "lines",
                line       : {color : palette.ink.axis, width : 2},
                hoverinfo  : "skip",
                showlegend : false,
                connectgaps: false,
            },
            {
                x             : rows.map(r => r.previous),
                y             : labels,
                name          : previousLabel,
                type          : "scatter",
                mode          : "markers",
                marker        : {color : palette.previous, size : 11, line : {color : palette.ink.paper, width : 2}},
                hovertemplate : `<b>%{y}</b><br>${previousLabel}: %{x:.${valueDecimals}f}${valueSuffix}<extra></extra>`,
            },
            {
                x             : rows.map(r => r.current),
                y             : labels,
                name          : currentLabel,
                type          : "scatter",
                mode          : "markers",
                marker        : {color : palette.current, size : 11, line : {color : palette.ink.paper, width : 2}},
                hovertemplate : `<b>%{y}</b><br>${currentLabel}: %{x:.${valueDecimals}f}${valueSuffix}<extra></extra>`,
            },
        ] as Partial<Plotly.PlotData>[];
    }, [ rows, currentLabel, previousLabel, valueDecimals, valueSuffix, compact, palette ]);

    const annotations = useMemo<Partial<Plotly.Annotations>[]>(() => rows
        .filter(r => r.current != null && Number.isFinite(r.current))
        .map(r => ({
            x         : r.current as number,
            y         : compact ? wrapLabel(r.label, 20) : r.label,
            text      : `${(r.current as number).toFixed(valueDecimals)}${valueSuffix}`,
            xanchor   : (r.current as number) >= 0 ? "left" : "right",
            yanchor   : "middle",
            xshift    : (r.current as number) >= 0 ? 12 : -12,
            showarrow : false,
            font      : {...CHART_FONTS.axis, color : palette.ink.secondary},
        })), [ rows, valueDecimals, valueSuffix, compact, palette ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, titleFontSize(frameWidth), theme)} : {}),
        xaxis     : createAxis(compact ? "" : xAxisTitle, {zeroline : true, zerolinecolor : palette.ink.axis, zerolinewidth : 1}, theme),
        // The rows arrive sorted, largest first; reversing the axis keeps that order top to bottom.
        yaxis     : createAxis("", {type : "category", autorange : "reversed", showgrid : false, automargin : true}, theme),
        hovermode : "closest",
        // Pinned to the card's own bottom edge, so it lands in the same place at any card height.
        legend    : bottomLegend(frameWidth, theme),
        annotations,
        margin    : {t : 60, b : 44 + legendBandHeight(legendRows, frameWidth), l : 8, r : 72},
    }, theme), [ title, xAxisTitle, annotations, frameWidth, compact, legendRows, palette, theme ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "dumbbell").toLowerCase().replace(/\s+/g, "-")),
        [ exportName, title ],
    );

    return (
        <div ref={frame} style={{width : "100%", height : height === "fill" ? "100%" : `${height}px`}}>
            <Plot
                data={traces as Plotly.Data[]}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler
            />
        </div>
    );
};

export default DumbbellChart;
