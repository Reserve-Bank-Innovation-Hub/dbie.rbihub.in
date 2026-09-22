"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// CHART CONFIG ========================================================================================================
import {
    CHART_FONTS, CHART_INK, DIVERGING, PALETTE,
    bottomLegend, legendBandHeight, legendRowCount,
    getBaseLayout, getBaseConfig, createTitle, createAxis,
} from "./chartConfig";
import { titleFontSize, useChartWidth } from "./useChartWidth";

// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import("react-plotly.js"), {ssr : false});

// The generic time-series chart: one shared date axis, any number of named series, one
// y-axis — never two. Pages adapt their payloads to this shape; series toggling uses
// Plotly's legend (click to hide/show, double-click to isolate) — series beyond
// `defaultVisible` start as legend-only entries.
//
// Everything past a plain line chart is opt-in through props, so existing callers keep the
// behaviour they had: columns and stacks, a shaded y-range, a reference line, a fill between
// two series, an area split by sign, and one series held in the accent with the rest greyed.

export interface TimeSeriesChartSeries {
    key             : string;
    label           : string;
    values          : (number | null)[];
    color         ? : string;
    dash          ? : "solid" | "dot" | "dash" | "longdash" | "dashdot" | "longdashdot";
    dates         ? : string[];          // this series' own x positions, when they differ from the chart's
    type          ? : "line" | "bar";    // default line
    colourBySign  ? : boolean;           // bars/area split into the diverging pair by sign
    stack         ? : string;            // bar stack group; negatives stack below zero
    areaStack     ? : string;            // stacked-area group (scatter traces)
    fillToZero    ? : boolean;           // fill between the series and the zero line, split by sign
    width         ? : number;            // line width, px
    markers       ? : boolean;           // draw a dot at every point as well as the line
    hideFromLegend? : boolean;           // plotted, but not its own legend entry
    endLabelPrefix? : string;            // prefix for this series' direct label, e.g. "Total "
    noEndLabel    ? : boolean;           // never direct-label this series
}

export interface TimeSeriesBand {
    from     : number;
    to       : number;
    label  ? : string;
    colour ? : string;
}

export interface TimeSeriesReferenceLine {
    value    : number;
    label  ? : string;
    colour ? : string;
}

export interface TimeSeriesAreaBetween {
    lower    : string;    // series key
    upper    : string;    // series key
    colour ? : string;
}

interface TimeSeriesChartProps {
    dates              : string[];                  // ISO YYYY-MM-DD, aligned with every series' values
    series             : TimeSeriesChartSeries[];
    title            ? : string;
    yAxisTitle       ? : string;
    height           ? : number | "fill";           // px, or "fill" to track the parent's height
    valueDecimals    ? : number;                    // hover precision
    valueSuffix      ? : string;                    // e.g. "%" appended in hover
    defaultVisible   ? : string[];                  // series keys plotted initially; others start legend-only
    exportName       ? : string;                    // download-as-image filename
    defaultRangeYears? : number | null;             // opening x window, in years back from the newest date
    endLabels        ? : boolean;                   // direct-label each visible series' last value
    maxEndLabels     ? : number;                    // above this many visible series the labels would collide
    bands            ? : TimeSeriesBand[];          // shaded y ranges
    referenceLines   ? : TimeSeriesReferenceLine[]; // horizontal lines with a label
    areaBetween      ? : TimeSeriesAreaBetween[];   // fill between two of the series
    emphasis         ? : string[];                  // these keys in the accent, the rest in the de-emphasis grey
    showZeroLine     ? : boolean;                   // default: on as soon as any value is negative
    showRangeSlider  ? : boolean;                   // the strip under the plot; the buttons stay either way
    rangeButtons     ? : string[];                  // which range presets to offer, by label
}

// Series beyond this many start legend-only unless defaultVisible says otherwise.
const MAX_DEFAULT_VISIBLE = 8;
// Past this many visible series the end labels stack on top of each other, so they are dropped.
const DEFAULT_MAX_END_LABELS = 4;
const DEFAULT_RANGE_YEARS = 10;

// The range presets, longest window last. A caller can take a subset: "3M" means nothing on a
// series that reports once a quarter.
const RANGE_BUTTONS : Partial<Plotly.RangeSelectorButton>[] = [
    {count : 3,  label : "3M",  step : "month", stepmode : "backward"},
    {count : 1,  label : "1Y",  step : "year",  stepmode : "backward"},
    {count : 5,  label : "5Y",  step : "year",  stepmode : "backward"},
    {count : 10, label : "10Y", step : "year",  stepmode : "backward"},
    {step : "all", label : "All"},
];

const isNumber = (v : number | null | undefined) : v is number => v != null && Number.isFinite(v);

// Sorted (x, y) pairs for one series — payloads arrive newest-first or oldest-first.
interface Points {
    x : string[];
    y : (number | null)[];
}

function sortPoints(dates : string[], values : (number | null)[]) : Points {
    const order = dates
        .map((d, i) => [ d, i ] as const)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([ , i ]) => i);
    return {x : order.map(i => dates[i]), y : order.map(i => values[i] ?? null)};
}

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
    defaultRangeYears = DEFAULT_RANGE_YEARS,
    endLabels = true,
    maxEndLabels = DEFAULT_MAX_END_LABELS,
    bands,
    referenceLines,
    areaBetween,
    emphasis,
    showZeroLine,
    showRangeSlider = true,
    rangeButtons,
}) => {
    // The legend wraps against the plot's real width and the title has to fit inside it, so the
    // card is measured: a full-width card holds a legend a half-width card would wrap onto three
    // rows, and a title it would clip.
    const [ frame, frameWidth ] = useChartWidth();

    const points = useMemo(
        () => new Map(series.map(s => [ s.key, sortPoints(s.dates ?? dates, s.values) ])),
        [ series, dates ],
    );

    const visibleKeys = useMemo(() => {
        if (defaultVisible) return new Set(defaultVisible);
        return new Set(series.slice(0, MAX_DEFAULT_VISIBLE).map(s => s.key));
    }, [ defaultVisible, series ]);

    // Colour by slot, in order — except where the caller names an accent set, where the named
    // series take the first slot and everything else recedes into grey.
    const colourOf = useMemo(() => {
        const map = new Map<string, string>();
        series.forEach((s, idx) => {
            if (s.color) { map.set(s.key, s.color); return; }
            if (emphasis && emphasis.length > 0) {
                const rank = emphasis.indexOf(s.key);
                map.set(s.key, rank >= 0 ? PALETTE[rank % PALETTE.length] : CHART_INK.deemphasis);
                return;
            }
            map.set(s.key, PALETTE[idx % PALETTE.length]);
        });
        return map;
    }, [ series, emphasis ]);

    const hasNegative = useMemo(
        () => series.some(s => s.values.some(v => isNumber(v) && v < 0)),
        [ series ],
    );

    const hasBars = useMemo(() => series.some(s => s.type === "bar"), [ series ]);

    // A card too narrow for the range slider does without it — the strip and its mask cost more
    // height than they are worth on a phone. The preset buttons stay: without the slider they are
    // the only way to change the window.
    const compact = frameWidth < 520;
    const legendRows = useMemo(
        () => legendRowCount(series.filter(s => !s.hideFromLegend).map(s => s.label), frameWidth),
        [ series, frameWidth ],
    );
    // The title holds the top left and the range buttons the top right; the legend goes under
    // the chart, so the bottom margin is the axis band plus however many legend rows there are.
    const topMargin = (title ? 46 : 12) + 36;
    const bottomMargin = 34 + legendBandHeight(legendRows, frameWidth);
    const barMode : Plotly.Layout["barmode"] = useMemo(
        () => (series.some(s => s.stack) ? "relative" : "group"),
        [ series ],
    );

    const traces = useMemo<Partial<Plotly.PlotData>[]>(() => {
        const out : Partial<Plotly.PlotData>[] = [];
        const hover = (label : string) =>
            `<b>${label}</b><br>%{x}<br>%{y:.${valueDecimals}f}${valueSuffix}<br><extra></extra>`;

        // Fills between two series go in first, so they sit under every line.
        for (const pair of areaBetween ?? []) {
            const lower = points.get(pair.lower), upper = points.get(pair.upper);
            if (!lower || !upper) continue;
            const both = lower.x.map((_, i) => isNumber(lower.y[i]) && isNumber(upper.y[i]));
            out.push({
                x           : lower.x,
                y           : lower.y.map((v, i) => (both[i] ? v : null)),
                type        : "scatter",
                mode        : "lines",
                line        : {width : 0},
                hoverinfo   : "skip",
                showlegend  : false,
                connectgaps : false,
            });
            out.push({
                x           : upper.x,
                y           : upper.y.map((v, i) => (both[i] ? v : null)),
                type        : "scatter",
                mode        : "lines",
                line        : {width : 0},
                fill        : "tonexty",
                fillcolor   : pair.colour ?? CHART_INK.areaBetween,
                hoverinfo   : "skip",
                showlegend  : false,
                connectgaps : false,
            });
        }

        for (const s of series) {
            const p = points.get(s.key)!;
            const colour = colourOf.get(s.key)!;
            const visible : boolean | "legendonly" = visibleKeys.has(s.key) ? true : "legendonly";

            // An area filled to the zero line, split by sign into the diverging pair, with the
            // series itself drawn on top as a thin ink line so the legend has one entry.
            if (s.fillToZero) {
                const side = (keep : (v : number) => boolean) =>
                    p.y.map(v => (isNumber(v) && keep(v) ? v : null));
                for (const [ values, fill ] of [
                    [ side(v => v >= 0), DIVERGING.coolFill ],
                    [ side(v => v <= 0), DIVERGING.warmFill ],
                ] as [ (number | null)[], string ][]) {
                    out.push({
                        x           : p.x,
                        y           : values,
                        type        : "scatter",
                        mode        : "lines",
                        line        : {width : 0},
                        fill        : "tozeroy",
                        fillcolor   : fill,
                        hoverinfo   : "skip",
                        showlegend  : false,
                        legendgroup : s.key,
                        visible,
                        connectgaps : false,
                    });
                }
                out.push({
                    x             : p.x,
                    y             : p.y,
                    name          : s.label,
                    type          : "scatter",
                    mode          : "lines",
                    legendgroup   : s.key,
                    visible,
                    connectgaps   : false,
                    line          : {color : s.color ?? CHART_INK.secondary, width : s.width ?? 2},
                    hovertemplate : hover(s.label),
                });
                continue;
            }

            // Columns, optionally split by sign into the diverging pair and optionally stacked.
            if (s.type === "bar") {
                const marker = (fill : string | string[]) => ({
                    color        : fill,
                    cornerradius : 4,
                    ...(s.stack ? {line : {color : CHART_INK.surface, width : 1}} : {}),
                } as unknown as Partial<Plotly.PlotMarker>);
                out.push({
                    x             : p.x,
                    y             : p.y,
                    name          : s.label,
                    type          : "bar",
                    legendgroup   : s.key,
                    ...(s.hideFromLegend ? {showlegend : false} : {}),
                    visible,
                    ...(s.stack ? {offsetgroup : s.stack} : {}),
                    marker        : marker(s.colourBySign
                        ? p.y.map(v => (isNumber(v) && v < 0 ? DIVERGING.warm : DIVERGING.cool))
                        : colour),
                    hovertemplate : hover(s.label),
                });
                continue;
            }

            // Plain line, or one layer of a stacked area.
            out.push({
                x             : p.x,
                y             : p.y,
                name          : s.label,
                type          : "scatter",
                mode          : s.markers ? "lines+markers" : "lines",
                ...(s.markers ? {marker : {color : colour, size : 6, line : {color : CHART_INK.paper, width : 1.5}}} : {}),
                legendgroup   : s.key,
                ...(s.hideFromLegend ? {showlegend : false} : {}),
                visible,
                connectgaps   : false,
                ...(s.areaStack
                    ? {stackgroup : s.areaStack, fillcolor : colour + "33", line : {color : colour, width : 1.5}}
                    : {line : {color : colour, width : s.width ?? 2, ...(s.dash ? {dash : s.dash} : {})}}),
                hovertemplate : hover(s.label),
            });
        }

        return out;
    }, [ series, points, colourOf, visibleKeys, valueDecimals, valueSuffix, areaBetween ]);

    // The x extent across every series, and the opening window inside it.
    const { fullRange, openingRange } = useMemo(() => {
        let min : string | null = null, max : string | null = null;
        for (const p of points.values()) {
            if (p.x.length === 0) continue;
            if (min === null || p.x[0] < min) min = p.x[0];
            if (max === null || p.x[p.x.length - 1] > max) max = p.x[p.x.length - 1];
        }
        if (!min || !max) return {fullRange : undefined, openingRange : undefined};
        const full : [ string, string ] = [ min, max ];
        if (!defaultRangeYears) return {fullRange : full, openingRange : undefined};
        const from = `${Number(max.slice(0, 4)) - defaultRangeYears}${max.slice(4)}`;
        return {fullRange : full, openingRange : from > min ? [ from, max ] as [ string, string ] : undefined};
    }, [ points, defaultRangeYears ]);

    // Direct labels: the last value of each visible series, in the text colour with a dot in the
    // series colour at the line end. Dropped once too many series would stack their labels.
    const { endDots, endAnnotations } = useMemo(() => {
        const dots : Partial<Plotly.PlotData>[] = [];
        const notes : Partial<Plotly.Annotations>[] = [];
        const eligible = series.filter(s => visibleKeys.has(s.key) && !s.noEndLabel && s.type !== "bar");
        if (!endLabels || eligible.length === 0 || eligible.length > maxEndLabels) return {endDots : dots, endAnnotations : notes};

        // A stacked area is read at its top edge, so only the last layer is labelled — with the
        // running total, which is what the top edge actually is.
        const stacked = eligible.filter(s => s.areaStack);
        const labelled = stacked.length > 0
            ? [ ...eligible.filter(s => !s.areaStack), stacked[stacked.length - 1] ]
            : eligible;

        // Where each label would sit, and how far apart two of them have to be to stay readable.
        // The y axis spans every value, whatever x window is open, so the gap is measured against
        // the whole series: seven per cent of it is about one line of text on a card-sized plot.
        let lo = Infinity, hi = -Infinity;
        for (const s of eligible) {
            for (const v of points.get(s.key)!.y) {
                if (!isNumber(v)) continue;
                if (v < lo) lo = v;
                if (v > hi) hi = v;
            }
        }
        const minGap = Number.isFinite(lo) && Number.isFinite(hi) ? (hi - lo) * 0.07 : 0;

        interface Candidate { key : string; x : string; y : number; rank : number; series : TimeSeriesChartSeries }
        const candidates : Candidate[] = [];
        for (const s of labelled) {
            const p = points.get(s.key)!;
            let at = -1;
            for (let i = p.y.length - 1; i >= 0; i--) if (isNumber(p.y[i])) { at = i; break; }
            if (at < 0) continue;
            const y = s.areaStack
                ? stacked.reduce((total, layer) => {
                    const lp = points.get(layer.key)!;
                    const v = lp.y[lp.x.indexOf(p.x[at])];
                    return total + (isNumber(v) ? v : 0);
                }, 0)
                : (p.y[at] as number);
            // An emphasised series keeps its label first; otherwise the series order decides.
            const accent = emphasis ? emphasis.indexOf(s.key) : -1;
            candidates.push({key : s.key, x : p.x[at], y, rank : accent >= 0 ? accent : 100 + series.indexOf(s), series : s});
        }

        const kept : Candidate[] = [];
        for (const c of [ ...candidates ].sort((a, b) => a.rank - b.rank)) {
            if (kept.some(k => Math.abs(k.y - c.y) < minGap)) continue;
            kept.push(c);
        }

        for (const c of kept) {
            const colour = colourOf.get(c.key)!;
            dots.push({
                x          : [ c.x ],
                y          : [ c.y ],
                type       : "scatter",
                mode       : "markers",
                marker     : {color : colour, size : 8, line : {color : CHART_INK.paper, width : 2}},
                hoverinfo  : "skip",
                showlegend : false,
                legendgroup: c.key,
                visible    : true,
            });
            notes.push({
                x         : c.x,
                y         : c.y,
                text      : `${c.series.endLabelPrefix ?? ""}${c.y.toFixed(valueDecimals)}${valueSuffix}`,
                xanchor   : "left",
                yanchor   : "middle",
                xshift    : 8,
                showarrow : false,
                font      : {...CHART_FONTS.axis, color : CHART_INK.secondary},
            });
        }
        return {endDots : dots, endAnnotations : notes};
    }, [ series, points, colourOf, visibleKeys, endLabels, maxEndLabels, valueDecimals, valueSuffix, emphasis ]);

    const shapes = useMemo<Partial<Plotly.Shape>[]>(() => [
        ...(bands ?? []).map(b => ({
            type      : "rect" as const,
            xref      : "paper" as const,
            yref      : "y" as const,
            x0        : 0,
            x1        : 1,
            y0        : b.from,
            y1        : b.to,
            fillcolor : b.colour ?? CHART_INK.band,
            line      : {width : 0},
            layer     : "below" as const,
        })),
        ...(referenceLines ?? []).map(r => ({
            type  : "line" as const,
            xref  : "paper" as const,
            yref  : "y" as const,
            x0    : 0,
            x1    : 1,
            y0    : r.value,
            y1    : r.value,
            line  : {color : r.colour ?? CHART_INK.muted, width : 1},
            layer : "below" as const,
        })),
    ], [ bands, referenceLines ]);

    const annotations = useMemo<Partial<Plotly.Annotations>[]>(() => [
        ...(bands ?? []).filter(b => b.label).map(b => ({
            xref      : "paper" as const,
            yref      : "y" as const,
            x         : 0.01,
            y         : b.to,
            text      : b.label as string,
            xanchor   : "left" as const,
            yanchor   : "bottom" as const,
            showarrow : false,
            font      : {...CHART_FONTS.axis, size : 11, color : CHART_INK.muted},
        })),
        ...(referenceLines ?? []).filter(r => r.label).map(r => ({
            xref      : "paper" as const,
            yref      : "y" as const,
            x         : 0.01,
            y         : r.value,
            text      : r.label as string,
            xanchor   : "left" as const,
            yanchor   : "bottom" as const,
            showarrow : false,
            font      : {...CHART_FONTS.axis, size : 11, color : CHART_INK.muted},
        })),
        ...endAnnotations,
    ], [ bands, referenceLines, endAnnotations ]);

    const layout : Partial<Plotly.Layout> = useMemo(() => getBaseLayout({
        ...(title ? {title : createTitle(title, titleFontSize(frameWidth))} : {}),
        xaxis  : createAxis("", {
            type          : "date",
            rangeslider   : {visible : showRangeSlider && !compact, ...(fullRange ? {range : fullRange} : {})},
            ...(openingRange ? {range : openingRange} : {}),
            // Under the title and clear of the legend below the chart.
            ...({rangeselector : {
                x       : 1,
                xanchor : "right",
                y       : 1.02,
                yanchor : "bottom",
                font    : {...CHART_FONTS.axis, color : CHART_INK.secondary},
                buttons : RANGE_BUTTONS.filter(b => !rangeButtons || rangeButtons.includes(b.label as string)),
            }}),
        }),
        // A long axis title is taller than a narrow card's plot, so it stands down there; short
        // units ("%", "US$ billion") still fit and still carry the scale.
        yaxis  : createAxis(compact && yAxisTitle.length > 20 ? "" : yAxisTitle, {
            zeroline      : showZeroLine ?? hasNegative,
            zerolinecolor : CHART_INK.axis,
            zerolinewidth : 1,
        }),
        // One series identifies itself through the title; a legend box with a single swatch
        // would only repeat it.
        showlegend : series.filter(s => !s.hideFromLegend).length > 1,
        legend : bottomLegend(frameWidth),
        shapes,
        annotations,
        ...(hasBars ? {barmode : barMode, bargap : 0.3, bargroupgap : 0.1} : {}),
        // The base layout's bottom margin is sized for below-chart legends; ours sits on top,
        // so reclaim the space for the plot. The right margin holds the direct labels.
        margin : {t : topMargin, b : bottomMargin, l : 80, r : endAnnotations.length > 0 ? 96 : 40},
    }), [
        title, yAxisTitle, fullRange, openingRange, shapes, annotations, series,
        hasBars, barMode, hasNegative, showZeroLine, endAnnotations.length,
        topMargin, bottomMargin, frameWidth, compact, showRangeSlider, rangeButtons,
    ]);

    const config = useMemo(
        () => getBaseConfig(exportName ?? (title ?? "chart").toLowerCase().replace(/\s+/g, "-")),
        [ exportName, title ],
    );

    return (
        <div ref={frame} style={{width : "100%", height : height === "fill" ? "100%" : `${height}px`}}>
            <Plot
                data={[ ...traces, ...endDots ] as Plotly.Data[]}
                layout={layout}
                config={config}
                style={{width : "100%", height : "100%"}}
                useResizeHandler
            />
        </div>
    );
};

export default TimeSeriesChart;
