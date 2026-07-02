// OTHER ===============================================================================================================
import type * as Plotly from "plotly.js";

// Common font configuration
export const CHART_FONTS = {
    title  : {
        size   : 18,
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

// Chart color palette with named colors
export const CHART_COLORS = {
    purpleDark  : "#806afe",
    purpleLight : "#c2abff",
    blueDark    : "#0342b3",
    blueMid     : "#3691ff",
    blueLight   : "#8bbefa",
    greenDark   : "#0d5c52",
    greenMid    : "#169d8b",
    greenLight  : "#47cb73",
    yellowDark  : "#fabe01",
    yellowMid   : "#ffa60c",
    orangeMid   : "#fc843a",
    redDark     : "#d12d1b",
    redMid      : "#f66555",
    redLight    : "#f18b7f",
    ivoryLight  : "#f3f1e7",
    sandMid     : "#e1d5bc",
} as const;

// Common layout configuration
export const getBaseLayout = (overrides? : Partial<Plotly.Layout>) : Partial<Plotly.Layout> => ({
    showlegend    : true,
    legend        : {
        orientation : "h",
        yanchor     : "bottom",
        y           : -0.45,
        xanchor     : "center",
        x           : 0.5,
        font        : CHART_FONTS.legend,
    },
    margin        : {t : 60, b : 140, l : 80, r : 40},
    plot_bgcolor  : "#fafafa",
    paper_bgcolor : "#ffffff",
    hovermode     : "x unified",
    ...overrides,
});

// Common config for Plotly controls
export const getBaseConfig = (filename : string, overrides? : Partial<Plotly.Config>) : Partial<Plotly.Config> => ({
    responsive             : true,
    displayModeBar         : true,
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

// Helper to create title configuration
export const createTitle = (text : string, fontSize? : number) : Partial<Plotly.Layout["title"]> => ({
    text,
    font : {
        size   : fontSize || CHART_FONTS.title.size,
        family : CHART_FONTS.title.family,
    },
});

// Helper to create axis configuration
export const createAxis = (title : string, overrides? : Partial<Plotly.LayoutAxis>) : Partial<Plotly.LayoutAxis> => ({
    title    : {
        text : title,
        font : CHART_FONTS.axis,
    },
    tickfont : CHART_FONTS.axis,
    ...overrides,
});
