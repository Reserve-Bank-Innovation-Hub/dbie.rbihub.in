"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// CHART CONFIG ========================================================================================================
import {
    CHART_FONTS, ChartSchemeLayer, ResolvedScheme, resolveScheme,
    getBaseLayout, getBaseConfig, createTitle, createAxis,
} from "./chartConfig";
import { titleFontSize, useChartWidth, wrapLabel } from "./useChartWidth";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// A grid of one number per row and column, read by colour. The scale is diverging around a
// midpoint that means something — an inflation target, a zero change — with a neutral grey at
// the centre and one hue per side. No number is printed in the cells: the colour bar carries
// the scale and the hover carries the exact value.

export interface HeatmapRow {
    key    : string;
    label  : string;
    values : (number | null)[];
}

interface HeatmapChartProps {
    columns         : string[];        // x labels, left to right
    rows            : HeatmapRow[];    // y labels, first row at the top
    title         ? : string;
    midpoint      ? : number;          // the value the neutral colour sits on
    span          ? : number;          // how far each arm reaches from the midpoint
    valueDecimals ? : number;
    valueSuffix   ? : string;
    colourBarTitle? : string;
    height        ? : number | "fill";
    exportName    ? : string;
    scheme        ? : ChartSchemeLayer;   // this chart's own colours, over its kind's and the base
}

// The cool pole below the midpoint, neutral at it, the warm pole above — either side of a grey
// that reads as "nothing to see".
const divergingScale = (palette : ResolvedScheme) : [ number, string ][] => [
    [ 0,     palette.positiveSteps[2] ],
    [ 0.25,  palette.positiveSteps[1] ],
    [ 0.42,  palette.positiveSteps[0] ],
    [ 0.5,   palette.neutral ],
    [ 0.58,  palette.negativeSteps[0] ],
    [ 0.75,  palette.negativeSteps[1] ],
    [ 1,     palette.negativeSteps[2] ],
];

const HeatmapChart : React.FC<HeatmapChartProps> = ({
    columns,
    rows,
    title,
    midpoint = 0,
    span = 10,
    valueDecimals = 1,
    valueSuffix = "",
    colourBarTitle = "",
    height = 600,
    exportName,
    scheme,
}) => {
    const [ theme ] = useTheme();

    const [ frame, frameWidth ] = useChartWidth();
    const compact = frameWidth < 520;
    const palette = useMemo(() => resolveScheme("heatmap", scheme, theme), [ scheme, theme ]);

    // Plotly draws the first y category at the bottom, so the rows go in reversed to keep the
    // reading order the page asked for.
    const trace = useMemo<Partial<Plotly.PlotData>>(() => {
        const ordered = [ ...rows ].reverse();
        return {
            x             : columns,
            y             : ordered.map(r => (compact ? wrapLabel(r.label, 18) : r.label)),
            z             : ordered.map(r => r.values),
            type          : "heatmap",
            colorscale    : divergingScale(palette),
            zmin          : midpoint - span,
            zmax          : midpoint + span,
            zmid          : midpoint,
            xgap          : 1,
            ygap          : 1,
            hovertemplate : `<b>%{y}</b><br>%{x}<br>%{z:.${valueDecimals}f}${valueSuffix}<extra></extra>`,
            // On a narrow card the colour bar lies under the grid instead of beside it, where it
            // would take a third of the width away from the cells.
            colorbar      : {
                title        : {text : colourBarTitle, font : {...CHART_FONTS.axis, color : palette.ink.secondary}},
                tickfont     : {...CHART_FONTS.axis, color : palette.ink.muted},
                thickness    : compact ? 10 : 12,
                len          : 0.9,
                outlinewidth : 0,
                tickvals     : [ midpoint - span, midpoint - span / 2, midpoint, midpoint + span / 2, midpoint + span ],
                ...(compact
                    ? {orientation : "h", x : 0.5, xanchor : "center", y : -0.24, yanchor : "top", tickangle : 0}
                    : {}),
            },
        } as Partial<Plotly.PlotData>;
    }, [ columns, rows, midpoint, span, valueDecimals, valueSuffix, colourBarTitle, compact, palette ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, titleFontSize(frameWidth), theme)} : {}),
        xaxis      : createAxis("", {type : "category", showgrid : false, nticks : compact ? 4 : 12}, theme),
        yaxis      : createAxis("", {type : "category", showgrid : false, automargin : true}, theme),
        showlegend : false,
        hovermode  : "closest",
        margin     : {t : 88, b : compact ? 132 : 56, l : 8, r : 8},
    }, theme), [ title, frameWidth, compact, theme ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "heatmap").toLowerCase().replace(/\s+/g, "-")),
        [ exportName, title ],
    );

    return (
        <div ref={frame} style={{width : "100%", height : height === "fill" ? "100%" : `${height}px`}}>
            <Plot
                data={[ trace ] as Plotly.Data[]}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler
            />
        </div>
    );
};

export default HeatmapChart;
