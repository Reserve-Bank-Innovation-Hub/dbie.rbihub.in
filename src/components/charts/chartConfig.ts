// UI ==================================================================================================================
import type { OklchColourName } from "fictoan-react";

// LIB =================================================================================================================
import { FICTOAN_STEPS, type FictoanStep, WHITE, contrastBetween, fictoanColour, lightnessOfHex } from "@/lib/fictoan-colours";

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

/* THE HUES ============================================================================================================
 * The finite set of colours a chart on this site may use: each a fictoan family and its usual step, named once here
 * and nowhere else. Everything below — the categorical slots, the diverging arms, the sequential ramp, the second
 * shades, the ink — names one of these, and where it needs a lighter or darker step it asks for that step of the same
 * hue, so changing what "blue" means on the site is one edit. src/lib/fictoan-colours.ts turns a token into the hex
 * Plotly needs, the same colour the CSS paints for var(--navy) and the rest.
 *
 * Why these families and not their neighbours: most fictoan tokens sit outside sRGB and the browser clips them, which
 * turns a saturated light blue towards cyan and flattens the light steps of a saturated red. Navy is the blue whose
 * light steps keep their hue, salmon the warm pole whose arm keeps its spacing, iris the violet whose lightest tints
 * stay lavender. */
export const CHART_HUES = {
    violet   : [ "royal", "base" ],
    green    : [ "green", "base" ],
    pink     : [ "cerise", "base" ],
    red      : [ "red", "base" ],
    teal     : [ "teal", "base" ],
    amber    : [ "amber", "base" ],
    blue     : [ "blue", "light10" ],
    lime     : [ "lime", "base" ],
    coral    : [ "salmon", "base" ],
    orange   : [ "orange", "base" ],
    lavender : [ "iris", "light90" ],
    grey     : [ "grey", "base" ],
} as const satisfies Record<string, readonly [ OklchColourName, FictoanStep ]>;

export type ChartHue = keyof typeof CHART_HUES;

// The hex of a hue at its usual step, or at another step of the same family: hue("blue"), hue("blue", "light40").
export const hue = (name : ChartHue, step ? : FictoanStep) : string => {
    const [ family, usual ] = CHART_HUES[name];
    return fictoanColour(family, step ?? usual);
};

/* NAMED PICKS =========================================================================================================
 * The bespoke charts pick colours by these names, each a hue of the table above at a step. The eight slot names are the
 * categorical order the base scheme below takes; the rest are second shades of the same hues. */
export const CHART_COLORS = {
    // The eight categorical slots, in order
    purpleDark  : hue("violet"),              // slot 1
    greenMid    : hue("green"),               // slot 2
    magentaMid  : hue("pink"),                // slot 3
    redMid      : hue("red"),                 // slot 4
    tealMid     : hue("teal"),                // slot 5
    yellowDark  : hue("amber"),               // slot 6
    blueMid     : hue("blue"),                // slot 7
    greenLight  : hue("lime"),                // slot 8

    // Other steps of the same hues, for charts that need a second shade of one
    purpleLight : hue("violet", "light30"),
    orangeMid   : hue("orange"),
    blueDark    : hue("blue", "dark20"),
    blueLight   : hue("blue", "light30"),
    greenDark   : hue("green", "dark20"),
    yellowMid   : hue("amber", "light20"),
    redDark     : hue("red", "dark20"),
    redLight    : hue("red", "light30"),
} as const;

/* SCHEMES =============================================================================================================
 * A chart does not need "colours", it needs a few ROLES filled: an ordered set for series identity, a positive and a
 * negative for polarity against a baseline, a ramp for magnitude, an emphasis pair, and the ink. A scheme fills them,
 * naming hues of the table above and never a hex, so a scheme cannot bring in a colour the site does not have.
 *
 * Four layers, each overriding the one before: the BASE scheme for the whole site, the THEME's scheme, which restates
 * what a dark surface changes, a KIND scheme for a form of chart (all columns, all heatmaps), and a scheme for one
 * chart, which the chart's caller passes in (the registry of those is src/components/charts/schemes.ts).
 * resolveScheme merges them and turns the names into hex. Objects merge key by key, so a layer can restate one role of
 * the ink or one series' hue and inherit the rest; a series list replaces the one below it whole, because merging two
 * lists slot by slot would be a trap. A kind's or a chart's layer applies under both themes, so one that restates the
 * ink should name a colour that reads on both surfaces. */

// A colour a scheme may name: a hue at its usual step, a hue at another step, or white.
export type ChartColour = ChartHue | "white" | readonly [ ChartHue, FictoanStep ];

export const colourOf = (c : ChartColour) : string => (c === "white" ? WHITE : typeof c === "string" ? hue(c) : hue(c[0], c[1]));

// The hue and step a colour names; white has neither.
const partsOf = (c : ChartColour) : [ ChartHue, FictoanStep ] | null =>
    c === "white" ? null : typeof c === "string" ? [ c, CHART_HUES[c][1] ] : [ c[0], c[1] ];

// Adjacent steps of a scale must differ by at least this much in lightness to read as steps, and a step that is a
// mark of its own must keep at least this contrast against the surface: the data-viz method's floors for an ordinal
// ramp.
const MIN_STEP_DELTA = 0.06;
const MIN_STEP_CONTRAST = 2;

// Steps of one hue walking the ladder from a step, lighter (direction 1) or darker (-1), each at least MIN_STEP_DELTA
// from the last IN THE COLOUR PAINTED: clipping compresses the light steps of a saturated family, so the nominal
// lightness of a step is no guide. With a contrast floor the walk also stops before a step fades into the surface.
// Stops early when the ladder runs out.
function spacedSteps(name : ChartHue, from : FictoanStep, direction : 1 | -1, count : number, surface : string, minContrast = 0) : FictoanStep[] {
    const steps : FictoanStep[] = [];
    let last = lightnessOfHex(hue(name, from));
    for (let i = FICTOAN_STEPS.indexOf(from) + direction; i >= 0 && i < FICTOAN_STEPS.length && steps.length < count; i += direction) {
        const step = FICTOAN_STEPS[i];
        const colour = hue(name, step);
        if (contrastBetween(colour, surface) < minContrast) break;
        const L = lightnessOfHex(colour);
        if (Math.abs(L - last) >= MIN_STEP_DELTA) { steps.push(step); last = L; }
    }
    return steps;
}

// The arm of a diverging scale from a pole: two steps of the pole's hue nearer the surface, then the pole, weak to
// strong — lighter steps on the light surface, darker ones on the dark. Each step keeps the contrast floor. A pole
// set at a step of a family that clips hard, or one whose hue darkens quickly, may have only one step a full
// MIN_STEP_DELTA apart before the floor; the arm then takes, of the legible steps on the surface's side of the pole,
// the one furthest in lightness from those it has, so the scale stays monotone and readable at the cost of one gap
// narrower than the method asks for. The comment on a scheme that sets such a pole should say so.
function armOf(pole : ChartColour, surface : string, dark : boolean) : string[] {
    const parts = partsOf(pole);
    if (!parts) return [ surface, surface, surface ];
    const [ name, step ] = parts;
    const towardsSurface : 1 | -1 = dark ? -1 : 1;
    const L = (s : FictoanStep) => lightnessOfHex(hue(name, s));
    const legible = spacedSteps(name, step, towardsSurface, 2, surface, MIN_STEP_CONTRAST);
    if (legible.length < 2) {
        const from = FICTOAN_STEPS.indexOf(step);
        const candidates = (towardsSurface === 1 ? FICTOAN_STEPS.slice(from + 1) : FICTOAN_STEPS.slice(0, from))
            .filter(s => !legible.includes(s) && contrastBetween(hue(name, s), surface) >= MIN_STEP_CONTRAST);
        while (legible.length < 2 && candidates.length) {
            const taken = [ step, ...legible ].map(L);
            const room  = (s : FictoanStep) => Math.min(...taken.map(l => Math.abs(L(s) - l)));
            candidates.sort((a, b) => room(b) - room(a));
            legible.push(candidates.shift()!);
        }
        while (legible.length < 2) legible.push(legible[legible.length - 1] ?? step);
    }
    // Weakest first: the step nearest the surface, then the next, then the pole.
    legible.sort((a, b) => (FICTOAN_STEPS.indexOf(b) - FICTOAN_STEPS.indexOf(a)) * towardsSurface);
    return [ ...legible.map(s => hue(name, s)), hue(name, step) ];
}

// A sequential ramp: seven steps of one hue from the surface's end of the ladder, each a legible step apart — light90
// down on the light surface, dark80 up on the dark, so "near zero" recedes towards the surface either way.
const rampOf = (name : ChartHue, surface : string, dark : boolean) : string[] => {
    const start : FictoanStep = dark ? "dark80" : "light90";
    return [ start, ...spacedSteps(name, start, dark ? 1 : -1, 6, surface) ].map(s => hue(name, s));
};

export type ChartKind = "line" | "column" | "curve" | "heatmap" | "dumbbell" | "share" | "sparkline";

/* THE THEME ===========================================================================================================
 * fictoan's ThemeProvider (layout.client.tsx) keeps the theme's class on <html> and hands it out through useTheme();
 * the two it lists are the names below, and anything else is drawn light. */
export type ChartTheme = "theme-light" | "theme-dark";

const themeKey = (theme ? : string) : ChartTheme => (theme === "theme-dark" ? "theme-dark" : "theme-light");

// The theme the page is in when a caller does not say: the class on <html>, or light where there is no document (on
// the server, whose chart output is never shown; Plotly loads in the browser). A component that draws by it must also
// read useTheme(), which is what makes it draw again when the theme changes; the shared charts pass the theme in.
export const documentTheme = () : ChartTheme =>
    (typeof document !== "undefined" && document.documentElement.classList.contains("theme-dark")) ? "theme-dark" : "theme-light";

export type InkRole = "surface" | "paper" | "primary" | "secondary" | "muted" | "grid" | "axis" | "band" | "areaBetween";

export interface ChartScheme {
    series      : ChartColour[];                  // identity, in slot order; the order never cycles
    seriesByKey : Record<string, ChartColour>;    // identity by a series' key, which wins over its slot
    positive    : ChartColour;                    // polarity against a baseline: above, and the cool pole
    negative    : ChartColour;                    // below, and the warm pole
    neutral     : ChartColour;                    // the midpoint of a diverging scale, which reads as "nothing"
    ramp        : ChartHue;                       // magnitude: one hue, stepped light to dark
    emphasis    : ChartColour;                    // the one series that is the point
    deemphasis  : ChartColour;                    // everything else beside it
    current     : ChartColour;                    // a "now" mark against a "then" (the dumbbell)
    previous    : ChartColour;
    ink         : Record<InkRole, ChartColour>;
}

// What a layer above the base may say: any role, and of the ink and the keyed series any subset, since those two
// merge key by key. A chart's `scheme` prop is one of these.
export type ChartSchemeLayer = Partial<Omit<ChartScheme, "ink" | "seriesByKey">> & {
    seriesByKey ? : Record<string, ChartColour>;
    ink         ? : Partial<Record<InkRole, ChartColour>>;
};

// A scheme with its names turned into hex, plus what the components derive from it.
export interface ResolvedScheme {
    series        : string[];
    seriesByKey   : Record<string, string>;
    positive      : string;
    negative      : string;
    neutral       : string;
    positiveSteps : string[];   // two lighter steps then the pole, light to dark: the cool arm of a diverging scale
    negativeSteps : string[];   // the same of the warm pole
    ramp          : string[];   // seven steps of the ramp hue, light90 down, each a legible step apart
    emphasis      : string;
    deemphasis    : string;
    current       : string;
    previous      : string;
    ink           : Record<InkRole, string>;
}

/* The base scheme.
 *
 * The categorical order violet · green · pink · red · teal · amber · blue · lime was checked with the data-viz palette
 * validator on a white surface: the eight pass every gate (every adjacent pair at least ΔE 8 apart under simulated
 * colour blindness, every slot at least 3:1 against the surface); the first FOUR pass the harder all-pairs test with
 * one warning, red against green at ΔE 6.8, inside the band the method allows only where a chart names its series
 * some other way too, which every chart here does (legend plus a label at the line's end). fictoan fixes each family's
 * chroma and lightness, so no ordering of its tokens clears that band for the lead four; this one is the strongest.
 * The ORDER is the colour-blind-safety mechanism, not decoration: past eight series, fold the tail into "Other" or
 * split the chart.
 *
 * The poles are coral and blue, warm and cool either side of a light neutral, and they pass the all-pairs test. Each
 * arm is built by armOf: two lighter steps of the pole's hue, each a legible step apart in the colour painted and
 * above 2:1 against the surface, then the pole. The warm arm passes the validator's ordinal checks outright. The cool
 * arm depends on where the table puts blue: at a base step (fictoan's blue or navy) it passes outright; at light10, as
 * the table has it now, only one legible step fits above the pole before the contrast floor, so the arm takes the most
 * distinct step between and its two gaps fall short of the 0.06 the method asks for while staying monotone and
 * legible. The arms are named by hue, not by sign, because which end means what is the chart's decision: a value
 * below zero takes the warm arm, and so does a value above an inflation target.
 *
 * The ramp is built by rampOf: the ramp hue from light90 down through six steps, each a legible step apart in the
 * colour painted; the lightest two recede towards the surface on purpose, which is what "near zero" should do, and
 * from the fourth step on the ramp passes the validator's ordinal checks for the blue family.
 *
 * The ink is steps of grey; the body text is the same --grey-dark40 the site's paragraphs use, and text never wears a
 * series colour. Shaded regions are the lavender rather than grey, so they read as part of the chart and leave the
 * marks on top of them the loudest thing; a narrow band needs more tint than a tall one to read at all. */
export const BASE_SCHEME : ChartScheme = {
    series      : [ "violet", "green", "pink", "red", "teal", "amber", "blue", "lime",
                    [ "violet", "light30" ], [ "blue", "light30" ], [ "green", "dark20" ], [ "red", "light30" ] ],
    seriesByKey : {},
    positive    : "blue",
    negative    : "coral",
    neutral     : [ "grey", "light90" ],
    ramp        : "blue",
    emphasis    : "violet",
    deemphasis  : "grey",
    current     : [ "blue", "dark20" ],
    previous    : [ "blue", "light30" ],
    ink         : {
        surface     : "white",
        paper       : "white",
        primary     : [ "grey", "dark40" ],
        secondary   : [ "grey", "dark20" ],
        muted       : [ "grey", "dark10" ],
        grid        : [ "grey", "light90" ],
        axis        : [ "grey", "light70" ],
        band        : "lavender",
        areaBetween : [ "lavender", "light80" ],
    },
};

/* The theme schemes: what the dark surface changes, and nothing else. The paper and the surface are the grey the
 * dark theme paints its cells with (--grid-cell-bg in src/styles/theme-dark.css is var(--grey-dark80)), so a chart's
 * paper is the colour of its card; the text steps are the light greys the theme's paragraphs and subtext use; the
 * grid and axis are a step or two above the surface, recessive as before; the shaded regions keep their lavender
 * hue at dark steps. The neutral midpoint of a diverging scale is a grey a little above the surface, which is what
 * "nothing" looks like on a dark page. The series keep their steps: the categorical eight were chosen at mid
 * lightness, and the data-viz palette validator passes them against grey-dark80 as it does against white (every
 * adjacent pair at least ΔE 8 apart under simulated colour blindness, every slot at least 3:1 against the surface). */
export const THEME_SCHEMES : Record<ChartTheme, ChartSchemeLayer> = {
    "theme-light" : {},
    "theme-dark"  : {
        neutral  : [ "grey", "dark60" ],
        // The warm pole two steps lighter than the base's: salmon darkens fast, and from the base step only one
        // legible step fits between it and the dark surface's contrast floor, so its arm would have a gap under
        // 0.06; from light20 the arm is dark10, base, light20 and both arms pass the validator's ordinal checks
        // outright against grey-dark80. On a dark surface the strongest end of a scale is its brightest.
        negative : [ "coral", "light20" ],
        // The "now" mark stays the loud one of the pair: bright on the dark surface, with "then" a dimmer blue.
        current  : [ "blue", "light30" ],
        previous : [ "blue", "dark10" ],
        ink      : {
            surface     : [ "grey", "dark80" ],
            paper       : [ "grey", "dark80" ],
            primary     : [ "grey", "light60" ],
            secondary   : [ "grey", "light30" ],
            muted       : [ "grey", "light10" ],
            grid        : [ "grey", "dark60" ],
            axis        : [ "grey", "dark40" ],
            band        : [ "lavender", "dark60" ],
            areaBetween : [ "lavender", "dark70" ],
        },
    },
};

/* The kind schemes: what a whole form of chart does differently from the base. Kept thin on purpose, and each entry
 * says why, so that there are not three places to look for one answer. */
export const KIND_SCHEMES : Record<ChartKind, ChartSchemeLayer> = {
    line      : {},
    column    : {},
    curve     : {},
    heatmap   : {},
    dumbbell  : {},
    share     : {},
    // The stat tiles' sparklines are one instrument, not eight series, so every tile draws in the accent.
    sparkline : { series : [ "violet" ] },
};

// The scheme a chart draws with under a theme: the base, then the theme's, then its kind's, then its own, each
// overriding the one before. The arms and the ramp are built against the resolved surface, so they recede towards
// whichever surface the theme paints.
export function resolveScheme(kind : ChartKind, own ? : ChartSchemeLayer, theme ? : string) : ResolvedScheme {
    const key    = themeKey(theme);
    const layers : ChartSchemeLayer[] = [ BASE_SCHEME, THEME_SCHEMES[key], KIND_SCHEMES[kind], own ?? {} ];
    const merged : ChartScheme = {
        ...BASE_SCHEME,
        ...THEME_SCHEMES[key],
        ...KIND_SCHEMES[kind],
        ...(own ?? {}),
        seriesByKey : Object.assign({}, ...layers.map(l => l.seriesByKey ?? {})),
        ink         : Object.assign({}, ...layers.map(l => l.ink ?? {})),
    };
    const ink  = Object.fromEntries(Object.entries(merged.ink).map(([ k, c ]) => [ k, colourOf(c) ])) as Record<InkRole, string>;
    const dark = key === "theme-dark";
    return {
        series        : merged.series.map(colourOf),
        seriesByKey   : Object.fromEntries(Object.entries(merged.seriesByKey).map(([ k, c ]) => [ k, colourOf(c) ])),
        positive      : colourOf(merged.positive),
        negative      : colourOf(merged.negative),
        neutral       : colourOf(merged.neutral),
        positiveSteps : armOf(merged.positive, ink.surface, dark),
        negativeSteps : armOf(merged.negative, ink.surface, dark),
        ramp          : rampOf(merged.ramp, ink.surface, dark),
        emphasis      : colourOf(merged.emphasis),
        deemphasis    : colourOf(merged.deemphasis),
        current       : colourOf(merged.current),
        previous      : colourOf(merged.previous),
        ink,
    };
}

/* The base scheme resolved, under the names the bespoke charts and the home page have always read. New work takes
 * resolveScheme and a scheme instead. */
const base = resolveScheme("line");

export const PALETTE : string[] = base.series;

export const DIVERGING = {
    cool      : base.positive,
    coolFill  : base.positiveSteps[0],
    coolSteps : base.positiveSteps,
    neutral   : base.neutral,
    warm      : base.negative,
    warmFill  : base.negativeSteps[0],
    warmSteps : base.negativeSteps,
} as const;

export const SEQUENTIAL_BLUE : string[] = base.ramp;

/* The ink alone, by theme, for the callers that draw with it and not with a scheme: a series in the text colour, a
 * range button's active tint, the base layout's paper. Resolved once per theme. */
export type ChartInk = Record<InkRole | "deemphasis", string>;

const inkOf = (theme : ChartTheme) : ChartInk => {
    const scheme = resolveScheme("line", undefined, theme);
    return { ...scheme.ink, deemphasis : scheme.deemphasis };
};

const INK : Record<ChartTheme, ChartInk> = { "theme-light" : inkOf("theme-light"), "theme-dark" : inkOf("theme-dark") };

// The ink of a theme; of the page's theme when none is named (see documentTheme).
export const chartInk = (theme : string = documentTheme()) : ChartInk => INK[themeKey(theme)];

// The light theme's ink, under the name the bespoke charts have always read; a caller that follows the theme takes
// chartInk(theme) instead.
export const CHART_INK : ChartInk = INK["theme-light"];

// Common layout configuration. The paper and the plot's surface are the theme's; the theme is the page's when the
// caller does not pass it.
export const getBaseLayout = (overrides? : Partial<Plotly.Layout>, theme : string = documentTheme()) : Partial<Plotly.Layout> => {
    const ink = chartInk(theme);
    return {
        showlegend : true,
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
        // The text colour of anything a chart does not set itself — a legend's keys, a hover's text — so a bespoke
        // chart's legend reads on the dark paper too.
        font          : {family : CHART_FONTS.legend.family, color : ink.primary},
        plot_bgcolor  : ink.surface,
        paper_bgcolor : ink.paper,
        hovermode     : "x unified",
        ...overrides,
    };
};

// Common config for Plotly controls
export const getBaseConfig = (filename : string, overrides? : Partial<Plotly.Config>) : Partial<Plotly.Config> => ({
    responsive : true,
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

export const bottomLegend = (width : number, theme : string = documentTheme()) : Partial<Plotly.Legend> => ({
    orientation : "h",
    traceorder  : "normal",
    xref        : "container",
    yref        : "container",
    x           : 0.015,
    xanchor     : "left",
    y           : 0.012,
    yanchor     : "bottom",
    font        : {...CHART_FONTS.legend, size : legendFontSize(width), color : chartInk(theme).secondary},
} as Partial<Plotly.Legend>);

// Helper to create title configuration. The title is pinned to the top left of the figure: a
// legend sitting in the top margin can never ride over it, and it stays clear of the modebar
// in the top right.
export const createTitle = (text : string, fontSize? : number, theme : string = documentTheme()) : Partial<Plotly.Layout["title"]> => ({
    text,
    x       : 0,
    xanchor : "left",
    y       : 1,
    yanchor : "top",
    pad     : {t : 12, l : 12},
    font    : {
        size   : fontSize || CHART_FONTS.title.size,
        family : CHART_FONTS.title.family,
        color  : chartInk(theme).primary,
    },
});

// Helper to create axis configuration. Gridlines and the zero line are solid hairlines a
// step off the surface, so they stay recessive behind the data.
export const createAxis = (title : string, overrides? : Partial<Plotly.LayoutAxis>, theme : string = documentTheme()) : Partial<Plotly.LayoutAxis> => {
    const ink = chartInk(theme);
    return {
        title     : {
            text : title,
            font : {...CHART_FONTS.axis, color : ink.secondary},
        },
        tickfont  : {...CHART_FONTS.axis, color : ink.muted},
        gridcolor : ink.grid,
        linecolor : ink.axis,
        zeroline  : false,
        ...overrides,
    };
};
