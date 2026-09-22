"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// CHART CONFIG ========================================================================================================
import {
    CHART_FONTS, CHART_INK, PALETTE,
    bottomLegend, legendBandHeight, legendRowCount,
    getBaseLayout, getBaseConfig, createTitle, createAxis,
} from "./chartConfig";
import { titleFontSize, useChartWidth } from "./useChartWidth";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// Several curves read across the same ordered categories — a yield curve at a few dates, or
// anything else where the x axis is a short ordered list rather than a calendar. Each curve is
// one categorical slot, drawn with markers so a four-point curve still reads as a shape, and
// direct-labelled at its last point.

export interface CurveChartCurve {
    key      : string;
    label    : string;
    values   : (number | null)[];
    color  ? : string;
}

interface CurveChartProps {
    categories      : string[];
    curves          : CurveChartCurve[];
    title         ? : string;
    xAxisTitle    ? : string;
    yAxisTitle    ? : string;
    height        ? : number | "fill";
    valueDecimals ? : number;
    valueSuffix   ? : string;
    exportName    ? : string;
}

const CurveChart : React.FC<CurveChartProps> = ({
    categories,
    curves,
    title,
    xAxisTitle = "",
    yAxisTitle = "",
    height = 600,
    valueDecimals = 2,
    valueSuffix = "",
    exportName,
}) => {
    const [ frame, frameWidth ] = useChartWidth();
    const legendRows = legendRowCount(curves.map(c => c.label), frameWidth);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => curves.map((c, idx) => ({
        x             : categories,
        y             : c.values,
        name          : c.label,
        type          : "scatter",
        mode          : "lines+markers",
        connectgaps   : false,
        line          : {color : c.color ?? PALETTE[idx % PALETTE.length], width : 2},
        marker        : {
            color : c.color ?? PALETTE[idx % PALETTE.length],
            size  : 8,
            line  : {color : CHART_INK.paper, width : 2},
        },
        hovertemplate : `<b>${c.label}</b><br>%{x}<br>%{y:.${valueDecimals}f}${valueSuffix}<extra></extra>`,
    })), [ categories, curves, valueDecimals, valueSuffix ]);

    // Each curve labelled where it ends, in the text colour beside its own coloured marker.
    const annotations = useMemo<Partial<Plotly.Annotations>[]>(() => {
        const notes : Partial<Plotly.Annotations>[] = [];
        for (const c of curves) {
            let at = -1;
            for (let i = c.values.length - 1; i >= 0; i--) {
                const v = c.values[i];
                if (v != null && Number.isFinite(v)) { at = i; break; }
            }
            if (at < 0) continue;
            notes.push({
                x         : categories[at],
                y         : c.values[at] as number,
                text      : `${(c.values[at] as number).toFixed(valueDecimals)}${valueSuffix}`,
                xanchor   : "left",
                yanchor   : "middle",
                xshift    : 10,
                showarrow : false,
                font      : {...CHART_FONTS.axis, color : CHART_INK.secondary},
            });
        }
        return notes;
    }, [ categories, curves, valueDecimals, valueSuffix ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, titleFontSize(frameWidth))} : {}),
        xaxis      : createAxis(xAxisTitle, {type : "category"}),
        yaxis      : createAxis(yAxisTitle),
        showlegend : curves.length > 1,
        // Pinned to the card's own bottom edge, so it lands in the same place at any card height.
        legend    : bottomLegend(frameWidth),
        annotations,
        margin     : {t : 60, b : 44 + legendBandHeight(legendRows, frameWidth), l : 72, r : 72},
    }), [ title, xAxisTitle, yAxisTitle, curves.length, annotations, frameWidth ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "curve").toLowerCase().replace(/\s+/g, "-")),
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

export default CurveChart;
