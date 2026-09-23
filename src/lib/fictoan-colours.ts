// fictoan's colours as hex, for the places that cannot take a CSS variable: Plotly reads colours as strings and does
// its own arithmetic on them, so it needs rgb or hex rather than var(--cobalt).
//
// fictoan defines each colour family as an OKLCH hue and chroma (oklchColourDefinitions, which the package exports)
// and derives nineteen steps per family in its CSS: dark90 to dark10, the base at 60% lightness, light10 to light90.
// This module repeats that derivation, the lightness scale and the chroma taper at the ends included, straight from
// fictoan's generator (packages/fictoan-react/src/scripts/generateColourClasses.ts), so fictoanColour("navy",
// "light30") is the colour var(--navy-light30) paints. Most of fictoan's tokens sit outside sRGB (their chroma is set
// for wider gamuts), and browsers bring such a colour on screen by clipping each channel rather than by the gamut
// mapping the CSS specification describes; this does the same, so the hex here equals what the CSS paints, checked
// against Chromium pixel for pixel. Clipping shifts a saturated light blue towards cyan and flattens the lightness
// steps of a saturated family, so a ramp or a pair of arms is built from a family that stays close to the gamut.

// UI ==================================================================================================================
import { oklchColourDefinitions, type OklchColourName } from "fictoan-react";

export type FictoanStep =
    | "dark90" | "dark80" | "dark70" | "dark60" | "dark50" | "dark40" | "dark30" | "dark20" | "dark10"
    | "base"
    | "light10" | "light20" | "light30" | "light40" | "light50" | "light60" | "light70" | "light80" | "light90";

// The steps in order, darkest first.
export const FICTOAN_STEPS : FictoanStep[] = [
    "dark90", "dark80", "dark70", "dark60", "dark50", "dark40", "dark30", "dark20", "dark10",
    "base",
    "light10", "light20", "light30", "light40", "light50", "light60", "light70", "light80", "light90",
];

// fictoan's lightness per step: 15% to 55% across the dark steps, 60% at the base, 65% to 97% across the light ones.
function lightnessOf(step : FictoanStep) : number {
    if (step === "base") return 60;
    const n = Number(step.slice(-2)) / 10;
    return step.startsWith("dark") ? 15 + (40 * (9 - n)) / 9 : 65 + (32 * (n - 1)) / 9;
}

// fictoan's taper: chroma falls away below 25% and above 85% lightness, where colours read less chromatic anyway.
function chromaAt(chroma : number, lightness : number) : number {
    if (lightness < 25) return chroma * (0.4 + (lightness / 25) * 0.6);
    if (lightness > 85) return chroma * (0.4 + ((100 - lightness) / 15) * 0.6);
    return chroma;
}

// OKLCH → linear sRGB, the standard OKLab matrices.
function linearSrgb(L : number, C : number, H : number) : [ number, number, number ] {
    const h = (H * Math.PI) / 180;
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
}

// Linear sRGB to hex, each channel clipped to 0..1 as the browser clips it, then the usual transfer curve.
function oklchToHex(L : number, C : number, H : number) : string {
    const channel = (v : number) : string => {
        const clamped = Math.min(1, Math.max(0, v));
        const gamma   = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
        return Math.round(gamma * 255).toString(16).padStart(2, "0");
    };
    return "#" + linearSrgb(L, C, H).map(channel).join("");
}

// The hex of fictoan's --<family>[-<step>], e.g. fictoanColour("royal") for var(--royal), fictoanColour("grey", "light90")
// for var(--grey-light90).
export function fictoanColour(family : OklchColourName, step : FictoanStep = "base") : string {
    const { hue, chroma } = oklchColourDefinitions[family];
    const lightness = lightnessOf(step);
    return oklchToHex(lightness / 100, chromaAt(chroma, lightness), hue);
}

export const WHITE = "#ffffff";   // fictoan's --white

// The relative luminance of a hex colour, as WCAG defines it.
function luminanceOfHex(hex : string) : number {
    const [ r, g, b ] = [ 1, 3, 5 ]
        .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// The WCAG contrast ratio between two hex colours: a mark against the surface it is drawn on, whichever is lighter.
export function contrastBetween(a : string, b : string) : number {
    const [ lighter, darker ] = [ luminanceOfHex(a), luminanceOfHex(b) ].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
}

// The contrast of a hex colour against white, the light theme's surface.
export const contrastOnWhite = (hex : string) : number => contrastBetween(hex, WHITE);

// The OKLCH lightness (0 to 1) a hex colour has on screen: what a step of a saturated family keeps after clipping,
// which can be a good deal less separation from its neighbours than the steps' nominal lightness promises.
export function lightnessOfHex(hex : string) : number {
    const [ r, g, b ] = [ 1, 3, 5 ]
        .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
}
