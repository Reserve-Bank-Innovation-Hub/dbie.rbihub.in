// The RBIH Kosh palette, as the phone-pays story sets it (the-phone-pays-the-cash-stays/cashThree.ts holds the same
// hexes; they are restated here so the stage and the tile maps need none of that story's three.js), and the roles the
// stage's dots and the tile maps fill from it under each theme. the-two-lakh-line.css states the same colours as
// tokens for everything drawn in CSS; the two must agree.

export const KOSH = {
    terracotta : "#ba644f",
    indivara   : "#864fe3",
    turmeric   : "#eaaa3a",
    neem       : "#6b8e23",
    sandal     : "#e1d5bc",
    ivory      : "#f2f0e6",
    charcoal   : "#2f2f2f",
    night      : "#16151a",    // the dark theme's page, the opening's evening studio in the phone-pays story
    warmGrey   : "#a8957a",    // the small change on the note wall: what is not the point
    white      : "#ffffff",
} as const;

// LOCAL ===============================================================================================================
import type { RGB, StagePalette } from "./stageLayout";

export const rgbOf = (hex : string) : RGB => [ parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16) ];
const hexOf = (c : RGB) => `#${c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

// a and b mixed in sRGB: t of b, the rest a. Close enough to the oklch mixes the CSS makes for the same pairs.
export const mix = (a : string, b : string, t : number) : string => {
    const [ ar, ag, ab ] = rgbOf(a), [ br, bg, bb ] = rgbOf(b);
    return hexOf([ ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t ]);
};

export type Theme = "theme-light" | "theme-dark";
export const themeOf = (theme ? : string | null) : Theme => (theme === "theme-dark" ? "theme-dark" : "theme-light");

// The surfaces: the page the stage draws on and the card the tile maps sit in.
export const SURFACES : Record<Theme, { page : string; card : string }> = {
    "theme-light" : { page : KOSH.ivory, card : KOSH.white },
    "theme-dark"  : { page : KOSH.night, card : mix(KOSH.night, KOSH.ivory, 0.08) },
};

// What the stage's dots are painted: the unlit field, the emphasis and the rest, the three prices, the quarters not
// yet reached and the rings of the loans that have gone (the roles stageLayout.ts names).
export const STAGE_PALETTES : Record<Theme, StagePalette> = {
    "theme-light" : {
        field  : rgbOf(mix(KOSH.charcoal, KOSH.ivory, 0.74)),
        emph   : rgbOf(KOSH.indivara),
        deemph : rgbOf(KOSH.warmGrey),
        top    : rgbOf(KOSH.charcoal),
        cool   : rgbOf(KOSH.neem),
        mid    : rgbOf(mix(KOSH.charcoal, KOSH.ivory, 0.6)),
        warm   : rgbOf(KOSH.terracotta),
        faint  : rgbOf(KOSH.sandal),
        ring   : rgbOf(mix(KOSH.charcoal, KOSH.ivory, 0.3)),
    },
    "theme-dark" : {
        field  : rgbOf(mix(KOSH.night, KOSH.ivory, 0.26)),
        emph   : rgbOf(mix(KOSH.indivara, KOSH.white, 0.15)),
        deemph : rgbOf(mix(KOSH.warmGrey, KOSH.night, 0.3)),
        top    : rgbOf(KOSH.ivory),
        cool   : rgbOf(mix(KOSH.neem, KOSH.white, 0.2)),
        mid    : rgbOf(mix(KOSH.night, KOSH.ivory, 0.4)),
        warm   : rgbOf(mix(KOSH.terracotta, KOSH.white, 0.22)),
        faint  : rgbOf(mix(KOSH.night, KOSH.sandal, 0.22)),
        ring   : rgbOf(mix(KOSH.night, KOSH.ivory, 0.7)),
    },
};

// The tile maps' classes: a sequential map climbs indivara in seven steps from the card; a diverging map takes
// terracotta for a fall and neem for a rise, three steps each from a sandal neutral, weakest first in each arm.
export interface TilePalette {
    ramp          : string[];    // seven, lowest first
    negativeSteps : string[];    // three, weakest first
    positiveSteps : string[];    // three, weakest first
    neutral       : string;
}

const arm = (hue : string, surface : string, dark : boolean) : string[] =>
    dark ? [ mix(hue, surface, 0.55), mix(hue, surface, 0.25), mix(hue, KOSH.white, 0.15) ] : [ mix(hue, surface, 0.72), mix(hue, surface, 0.42), hue ];

export const tilePalette = (theme : Theme) : TilePalette => {
    const dark = theme === "theme-dark", { card } = SURFACES[theme];
    return {
        ramp          : dark
            ? [ 0.78, 0.64, 0.5, 0.36, 0.22, 0.08 ].map(t => mix(KOSH.indivara, card, t)).concat(mix(KOSH.indivara, KOSH.white, 0.22))
            : [ 0.9, 0.76, 0.61, 0.45, 0.28, 0.1 ].map(t => mix(KOSH.indivara, card, t)).concat(mix(KOSH.indivara, KOSH.charcoal, 0.3)),
        negativeSteps : arm(KOSH.terracotta, card, dark),
        positiveSteps : arm(KOSH.neem, card, dark),
        neutral       : dark ? mix(KOSH.night, KOSH.sandal, 0.22) : mix(KOSH.white, KOSH.sandal, 0.45),
    };
};
