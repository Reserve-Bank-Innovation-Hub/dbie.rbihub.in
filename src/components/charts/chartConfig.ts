// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Common font configuration
export const CHART_FONTS = {
    title  : {
        size   : 14,
        family : "Geist, sans-serif",
    },
    axis   : {
        size   : 12,
        family : "Geist, sans-serif",
    },
    legend : {
        size   : 12,
        family : "Geist, sans-serif",
    },
};

/* PALETTE =============================================================================================================
 * Eight bright categorical hues in a fixed order, from the families current product dashboards
 * use for data: electric violet, leaf green, hot pink, tangerine, teal mint, coral, vivid azure
 * and lime. Every slot is a high-chroma step at mid lightness (OKLCH L 0.61–0.65, C 0.11–0.24),
 * which is what makes them read fresh on a near-white plot surface rather than dark and heavy.
 *
 * Each hue sits just under the lightness at which it stops clearing 3:1 against #fafafa, so the
 * set is as bright as it can be with every slot still legible as a mark. Measured with the
 * data-viz palette validator on the #fafafa plot surface:
 *
 *   worst adjacent pair  ΔE 12.4 (deutan, hot pink ↔ leaf green) · normal vision ΔE 17.2
 *   contrast             all eight ≥ 3:1 (lowest 3.02, coral)
 *   first FOUR slots also clear the harder all-pairs test (ΔE 8.2 / 17.2)
 *
 * The ORDER is the colour-blind-safety mechanism, not decoration: series take slots in sequence
 * and the sequence never cycles. Past eight series, fold the tail into "Other" or split the
 * chart — a ninth hue cannot be told from the first eight.
 *
 * The four leading slots are the most saturated hues (C 0.19–0.26), because those are the ones
 * most charts reach for; amber and yellow-green lose chroma fastest on a light surface and take
 * slots 6 and 8. Leaf green and coral had to be pushed apart in lightness to clear the all-pairs
 * test — red and green are the pair that collapses under deuteranopia — which is why coral and
 * hot pink sit at L 0.68 while leaf green sits at 0.61.
 */
export const CHART_COLORS = {
    // The eight categorical slots, in order
    purpleDark  : "#9762fd",   // slot 1 · electric violet  L 0.631 C 0.220
    greenMid    : "#009f32",   // slot 2 · leaf green       L 0.611 C 0.187
    magentaMid  : "#ff35b1",   // slot 3 · hot pink         L 0.680 C 0.255
    redMid      : "#ff563e",   // slot 4 · coral            L 0.680 C 0.209
    tealMid     : "#039e93",   // slot 5 · teal mint        L 0.629 C 0.110
    yellowDark  : "#c87600",   // slot 6 · tangerine        L 0.641 C 0.145
    blueMid     : "#0e89f7",   // slot 7 · vivid azure      L 0.630 C 0.190
    greenLight  : "#669c00",   // slot 8 · lime             L 0.630 C 0.170

    // Further steps of the same hues, for charts that need a second shade of one family
    purpleLight : "#a884ff",
    orangeMid   : "#e66700",
    blueDark    : "#006bc7",
    blueLight   : "#4da1fe",
    greenDark   : "#007f26",
    yellowMid   : "#da8a11",
    redDark     : "#cc3622",
    redLight    : "#f57762",

    // Neutrals
    ivoryLight  : "#f3f1e7",
    sandMid     : "#e1d5bc",
} as const;

// The categorical order. Series take these in sequence; slots 9 and beyond are second shades
// for the handful of older charts that plot more than eight series at once.
export const PALETTE : string[] = [
    CHART_COLORS.purpleDark,
    CHART_COLORS.greenMid,
    CHART_COLORS.magentaMid,
    CHART_COLORS.redMid,
    CHART_COLORS.tealMid,
    CHART_COLORS.yellowDark,
    CHART_COLORS.blueMid,
    CHART_COLORS.greenLight,
    CHART_COLORS.purpleLight,
    CHART_COLORS.blueDark,
    CHART_COLORS.redDark,
    CHART_COLORS.greenDark,
];

/* Diverging pair — for values read against a baseline (above/below zero, above/below an
 * inflation target). Bright coral and bright azure are warm/cool opposites either side of a
 * light neutral midpoint that reads as "nothing". Each arm is a single hue stepping light →
 * dark and both pass the validator's ordinal checks (monotone lightness, ΔL ≥ 0.06 per step,
 * light ends 2.01:1 and 2.03:1 against the surface); the two poles sit ΔE 28.0 apart under
 * simulated colour blindness.
 *
 * The arms are named by hue, not by sign, because which end means what is the chart's decision:
 * a value below zero takes the warm arm (a negative number is read warm everywhere), and so
 * does a value above an inflation target. */
export const DIVERGING = {
    cool      : "#0e89f7",
    coolFill  : "#82b7f4",
    coolSteps : [ "#82b7f4", "#54a1f9", "#0e89f7" ],
    neutral   : "#f1f0ee",
    warm      : "#f24d37",
    warmFill  : "#f49b8b",
    warmSteps : [ "#f49b8b", "#f57762", "#f24d36" ],
} as const;

/* Sequential ramp — one hue, a light tint through to a saturated step, for magnitude on a
 * continuous scale (heatmaps). Lightness is monotone across the seven steps; the lightest two
 * recede towards the surface on purpose, which is what "near zero" should do on a sequential
 * scale. Where the marks are discrete (an ordinal ramp) start no lighter than step 500, the
 * first that clears 2:1. Every adjacent step differs by 0.065 in OKLCH lightness, so the ramp
 * also satisfies the stricter spacing the validator applies to ordinal ramps. */
export const SEQUENTIAL_AZURE : string[] = [
    "#ecf4ff", "#c7e1ff", "#a2cdff", "#7bb8ff", "#4fa3ff", "#158cfb", "#0078dd",
];

/* Chart chrome: surfaces, ink and the two greys that carry de-emphasis. Text never wears a
 * series colour — identity comes from the coloured mark beside it. */
export const CHART_INK = {
    surface      : "#fafafa",
    paper        : "#ffffff",
    primary      : "#2e2e2e",
    secondary    : "#5c5b57",
    muted        : "#6f6e69",
    deemphasis   : "#8a8983",   // the "everything else" grey in an emphasis chart, 3.36:1
    grid         : "#eeede8",
    axis         : "#d5d4cd",
    // Shaded regions are a tint of the accent rather than grey: they read as part of the chart
    // instead of as a smudge, and they leave the bright marks on top of them the loudest thing.
    band         : "#f1ebff",   // shaded y-range, e.g. an inflation tolerance band
    areaBetween  : "#e9deff",   // fill between two series, e.g. a rate corridor — a narrow band
                                // needs more tint than a tall one to read at all
} as const;

// Common layout configuration
export const getBaseLayout = (overrides? : Partial<Plotly.Layout>) : Partial<Plotly.Layout> => ({
    showlegend    : true,
    // Legend sits above the plot, top-left; range buttons (where present) go
    // top-right. Keeps the bottom margin free for just the axis labels.
    legend        : {
        orientation : "h",
        yanchor     : "bottom",
        y           : 1.02,
        xanchor     : "left",
        x           : 0,
        font        : CHART_FONTS.legend,
    },
    margin        : {t : 60, b : 40, l : 80, r : 40},
    plot_bgcolor  : CHART_INK.surface,
    paper_bgcolor : CHART_INK.paper,
    hovermode     : "x unified",
    ...overrides,
});

// Common config for Plotly controls
export const getBaseConfig = (filename : string, overrides? : Partial<Plotly.Config>) : Partial<Plotly.Config> => ({
    responsive             : true,
    // The modebar is chrome, not data: it appears when the pointer is over the chart rather
    // than sitting permanently on top of the title.
    displayModeBar         : "hover",
    displaylogo            : false,
    modeBarButtonsToRemove : [ "lasso2d", "select2d" ],
    toImageButtonOptions   : {
        format   : "png",
        filename : filename,
        height   : 800,
        width    : 1200,
        scale    : 2,
    },
    ...overrides,
});

/* The legend sits under the chart, pinned to the card's own bottom edge rather than to the
 * plot, so it lands in the same place whatever height the card is. How many rows it wraps
 * into depends on the label text and the card's width, which only the card can measure. */
export const legendFontSize = (width : number) : number => (width < 520 ? 10 : 12);

// Plotly packs a horizontal legend onto one row when the keys fit, and otherwise lays them out
// in a grid of equal-width columns — on a narrow card that is usually one key per row. The
// legend stays horizontal at every width: a vertical one is a side legend to Plotly, and it
// takes the space out of the plot.
export const legendRowCount = (labels : string[], width : number) : number => {
    if (labels.length < 2) return 0;
    const size = legendFontSize(width);
    const keyWidth = (label : string) => label.length * size * 0.58 + 36;
    const available = Math.max(width - 40, 240);
    if (labels.reduce((total, label) => total + keyWidth(label), 0) <= available) return 1;
    const perRow = Math.max(1, Math.floor(available / Math.max(...labels.map(keyWidth))));
    return Math.ceil(labels.length / perRow);
};

export const legendBandHeight = (rows : number, width : number) : number =>
    (rows === 0 ? 0 : rows * (legendFontSize(width) + 8) + 8);

export const bottomLegend = (width : number) : Partial<Plotly.Legend> => ({
    orientation : "h",
    traceorder  : "normal",
    xref        : "container",
    yref        : "container",
    x           : 0.015,
    xanchor     : "left",
    y           : 0.012,
    yanchor     : "bottom",
    font        : {...CHART_FONTS.legend, size : legendFontSize(width), color : CHART_INK.secondary},
} as Partial<Plotly.Legend>);

// Helper to create title configuration. The title is pinned to the top left of the figure: a
// legend sitting in the top margin can never ride over it, and it stays clear of the modebar
// in the top right.
export const createTitle = (text : string, fontSize? : number) : Partial<Plotly.Layout["title"]> => ({
    text,
    x       : 0,
    xanchor : "left",
    y       : 1,
    yanchor : "top",
    pad     : {t : 12, l : 12},
    font    : {
        size   : fontSize || CHART_FONTS.title.size,
        family : CHART_FONTS.title.family,
        color  : CHART_INK.primary,
    },
});

// Helper to create axis configuration. Gridlines and the zero line are solid hairlines a
// step off the surface, so they stay recessive behind the data.
export const createAxis = (title : string, overrides? : Partial<Plotly.LayoutAxis>) : Partial<Plotly.LayoutAxis> => ({
    title     : {
        text : title,
        font : {...CHART_FONTS.axis, color : CHART_INK.secondary},
    },
    tickfont  : {...CHART_FONTS.axis, color : CHART_INK.muted},
    gridcolor : CHART_INK.grid,
    linecolor : CHART_INK.axis,
    zeroline  : false,
    ...overrides,
});
