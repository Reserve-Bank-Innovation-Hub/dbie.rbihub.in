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

// Part-to-whole across a few groups: one full-width horizontal bar per group, split into
// shares that add to 100. Categorical slots in fixed order, a hairline of the surface colour
// separating touching segments, and a label printed inside a segment only when it is wide
// enough to hold one — everything else is in the legend and the hover.

export interface ShareBarCategory {
    key     : string;
    label   : string;
    shares  : number[];      // one per group, in the same order as `groups`
    color ? : string;
}

interface ShareBarChartProps {
    groups           : string[];
    categories       : ShareBarCategory[];
    title          ? : string;
    xAxisTitle     ? : string;
    valueDecimals  ? : number;
    minLabelShare  ? : number;    // below this share the label would not fit inside the segment
    height         ? : number | "fill";
    exportName     ? : string;
}

const ShareBarChart : React.FC<ShareBarChartProps> = ({
    groups,
    categories,
    title,
    xAxisTitle = "",
    valueDecimals = 1,
    minLabelShare = 7,
    height = 400,
    exportName,
}) => {
    const [ frame, frameWidth ] = useChartWidth();
    const legendRows = legendRowCount(categories.map(c => c.label), frameWidth);
    // A narrow card holds fewer inline labels: below this share the text would not fit the segment.
    const compact = frameWidth < 520;
    const labelFloor = Math.max(minLabelShare, compact ? 14 : 0);

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => categories.map((c, idx) => {
        const colour = c.color ?? PALETTE[idx % PALETTE.length];
        return {
            x            : c.shares,
            y            : groups,
            name         : c.label,
            type         : "bar",
            orientation  : "h",
            marker       : {
                color : colour,
                line  : {color : CHART_INK.surface, width : 1.5},
            },
            // Printed inside the segment, and only where there is room for it.
            text         : c.shares.map(v => (v >= labelFloor ? `${v.toFixed(valueDecimals)}%` : "")),
            textposition : "inside",
            textangle    : 0,
            insidetextanchor : "middle",
            textfont     : {...CHART_FONTS.axis, color : CHART_INK.paper},
            cliponaxis   : false,
            constraintext: "inside",
            hovertemplate: `<b>${c.label}</b><br>%{y}<br>%{x:.${valueDecimals}f}%<extra></extra>`,
        } as Partial<Plotly.PlotData>;
    }), [ groups, categories, labelFloor, valueDecimals ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, titleFontSize(frameWidth))} : {}),
        barmode   : "stack",
        bargap    : 0.45,
        xaxis     : createAxis(compact ? "" : xAxisTitle, {range : [ 0, 100 ], ticksuffix : "%"}),
        yaxis     : createAxis("", {type : "category", autorange : "reversed", showgrid : false, automargin : true}),
        hovermode : "closest",
        // Stacks read left to right, so the legend has to as well — Plotly reverses it by default.
        // It is pinned to the card's own bottom edge, clear of the bars at any card height.
        legend    : bottomLegend(frameWidth),
        margin    : {t : 60, b : 48 + legendBandHeight(legendRows, frameWidth), l : 24, r : 24},
    }), [ title, xAxisTitle, frameWidth, compact, legendRows ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "shares").toLowerCase().replace(/\s+/g, "-")),
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

export default ShareBarChart;
