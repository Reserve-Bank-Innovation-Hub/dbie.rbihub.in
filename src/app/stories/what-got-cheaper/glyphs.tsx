// The line glyphs of the goods the story follows, drawn by hand on a 24-unit grid, stroke only: everything sits within
// 2..22, is stroked at 1.5 with round caps and joins, and has no fill. Seeds and eyes are tiny closed arcs, so they show
// as small rings under the same stroke.

// REACT CORE ==========================================================================================================
import type { CSSProperties } from "react";

export type GlyphName =
    | "tv" | "pill" | "blanket" | "solar" | "wheat" | "rice" | "silver" | "coconut" | "tomato" | "jasmine"
    | "basket" | "milk" | "egg" | "petrol" | "kerosene" | "cement";

// SVG path "d" strings on a 24×24 grid, to be drawn with stroke currentColor, width 1.5, round caps and joins, no fill.
export const GLYPH_PATHS : Record<GlyphName, string[]> = {
    // A flat-screen television on two splayed feet, a glint across the glass.
    tv : [
        "M4.5 4.75h15a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1 -1.5 1.5h-15a1.5 1.5 0 0 1 -1.5 -1.5v-8.5a1.5 1.5 0 0 1 1.5 -1.5z",
        "M7.5 16.25l-1.25 3",
        "M16.5 16.25l1.25 3",
        "M6.25 10.25l3 -3",
    ],
    // A two-part capsule lying on the diagonal.
    pill : [
        "M10.15 18.95L18.95 10.15A3.6 3.6 0 0 0 13.85 5.05L5.05 13.85A3.6 3.6 0 0 0 10.15 18.95Z",
        "M9.45 9.45L14.55 14.55",
    ],
    // A blanket folded over twice, the folds rounded on the left and the loose edges squared on the right.
    blanket : [
        "M19.5 5H7.25a2.75 2.75 0 0 0 0 5.5H19.5z",
        "M19.5 13.5H7.25a2.75 2.75 0 0 0 0 5.5H19.5z",
    ],
    // A solar panel tilted back on a post, its face split into six cells.
    solar : [
        "M6.5 4h11l3.5 10.5H3z",
        "M4.75 9.25h14.5",
        "M10.17 4l-1.17 10.5",
        "M13.83 4l1.17 10.5",
        "M12 14.5v5",
        "M9 19.5h6",
    ],
    // An ear of wheat on its stalk: three pairs of grains and one at the tip.
    wheat : [
        "M12 21.5L12 8.5",
        "M12.6 16.5C15.4 16.95 16.9 15.4 16.35 12.62C13.55 12.16 12.05 13.72 12.6 16.5Z",
        "M11.4 16.5C11.95 13.72 10.45 12.16 7.65 12.62C7.1 15.4 8.6 16.95 11.4 16.5Z",
        "M12.6 12.75C15.4 13.2 16.9 11.65 16.35 8.87C13.55 8.41 12.05 9.97 12.6 12.75Z",
        "M11.4 12.75C11.95 9.97 10.45 8.41 7.65 8.87C7.1 11.65 8.6 13.2 11.4 12.75Z",
        "M12.6 9C15.4 9.45 16.9 7.9 16.35 5.12C13.55 4.66 12.05 6.22 12.6 9Z",
        "M11.4 9C11.95 6.22 10.45 4.66 7.65 5.12C7.1 7.9 8.6 9.45 11.4 9Z",
        "M12 7.5C14.26 6 14.26 4 12 2.5C9.74 4 9.74 6 12 7.5Z",
    ],
    // A footed bowl heaped with rice above its rim.
    rice : [
        "M3 9.5h18a9 7 0 0 1 -18 0z",
        "M9 16.1l-.5 2.4h7l-.5 -2.4",
        "M5 9.5a2.5 2.5 0 0 1 4.25 -1.9a3 3 0 0 1 5.5 0a2.5 2.5 0 0 1 4.25 1.9",
    ],
    // Three bars of bullion stacked two and one.
    silver : [
        "M2.75 18.5h9l-1.5 -6.5h-6z",
        "M12.25 18.5h9l-1.5 -6.5h-6z",
        "M7.5 12h9l-1.5 -6.5h-6z",
    ],
    // A whole coconut with its three eyes, half hidden behind a halved one showing its ring of flesh.
    coconut : [
        "M5.46 13.77A6 6 0 1 1 14.71 9.4",
        "M7 14.5a7 6.25 0 0 0 14 0",
        "M7 14.5a7 3.5 0 1 0 14 0a7 3.5 0 1 0 -14 0",
        "M10.5 14.6a3.5 1.05 0 1 0 7 0a3.5 1.05 0 1 0 -7 0",
        "M7.15 7.6a.4 .4 0 1 0 .8 0a.4 .4 0 1 0 -.8 0",
        "M9.75 7.6a.4 .4 0 1 0 .8 0a.4 .4 0 1 0 -.8 0",
        "M8.45 9.9a.4 .4 0 1 0 .8 0a.4 .4 0 1 0 -.8 0",
    ],
    // A tomato with the star of its calyx at the top.
    tomato : [
        "M9 6.4C5.5 6.2 3.5 9 3.5 13C3.5 17.75 7.25 20.5 12 20.5C16.75 20.5 20.5 17.75 20.5 13C20.5 9 18.5 6.2 15 6.4",
        "M12 9.5L11.12 8.13L7.63 8.05L10.57 7.12L9.3 5.7L12 6.5L14.7 5.7L13.43 7.12L16.37 8.05L12.88 8.13Z",
        "M12 6.5V3.5",
    ],
    // A jasmine flower face on: five rounded petals pinched at the centre.
    jasmine : [
        "M12 11.3C13.4 9.78 14.3 3.7 12 3.7C9.7 3.7 10.6 9.78 12 11.3Z",
        "M13.52 12.41C15.4 13.27 21.46 12.24 20.75 10.06C20.04 7.87 14.53 10.6 13.52 12.41Z",
        "M12.94 14.19C12.7 16.25 15.55 21.69 17.41 20.34C19.27 18.99 14.97 14.6 12.94 14.19Z",
        "M11.06 14.19C9.03 14.6 4.73 18.99 6.59 20.34C8.45 21.69 11.3 16.25 11.06 14.19Z",
        "M10.48 12.41C9.47 10.6 3.96 7.87 3.25 10.06C2.54 12.24 8.6 13.27 10.48 12.41Z",
    ],
    // A shallow market basket with a hoop handle and a hint of weave.
    basket : [
        "M3 10.5h18",
        "M4 10.5l1.75 8.25a1.5 1.5 0 0 0 1.47 1.25h9.56a1.5 1.5 0 0 0 1.47 -1.25L20 10.5",
        "M7 10.5a5 6 0 0 1 10 0",
        "M4.85 14.5h14.3",
        "M9.5 10.5l.5 9.5",
        "M14.5 10.5l-.5 9.5",
    ],
    // A gable-topped milk carton with a drop of milk on its face.
    milk : [
        "M6.5 20.5V10l2.5 -4.5h6l2.5 4.5v10.5a.5 .5 0 0 1 -.5 .5h-10a.5 .5 0 0 1 -.5 -.5z",
        "M9 5.5V3h6v2.5",
        "M6.5 10h11",
        "M12 12.75c1.25 1.4 1.9 2.4 1.9 3.3a1.9 1.9 0 0 1 -3.8 0c0 -.9 .65 -1.9 1.9 -3.3z",
    ],
    // Two eggs, the smaller one standing in front of the larger.
    egg : [
        "M15.2 8.6C17.84 8.6 19.6 11.57 19.6 15.68C19.6 18.49 17.66 20.8 15.2 20.8C12.74 20.8 10.8 18.49 10.8 15.68C10.8 11.57 12.56 8.6 15.2 8.6Z",
        "M9.49 17.8C9.46 17.8 9.43 17.8 9.4 17.8C6.43 17.8 4.1 15.04 4.1 11.67C4.1 6.76 6.22 3.2 9.4 3.2C11.47 3.2 13.1 4.71 13.98 7.13",
    ],
    // A petrol pump with its meter window, the hose looping to a nozzle at its side.
    petrol : [
        "M4.5 20V5.5A1.5 1.5 0 0 1 6 4h6.5A1.5 1.5 0 0 1 14 5.5V20",
        "M3 20h12.5",
        "M7 7h4.5v3.5H7z",
        "M14 7.5c3.5 0 5.5 1.5 5.5 4.5v3",
        "M18.5 15h2v3h-2z",
    ],
    // A hurricane lantern: ring handle, glass globe with a flame inside, and the fuel tank below.
    kerosene : [
        "M9 7a3 3.5 0 0 1 6 0",
        "M7.5 7h9",
        "M9 7C6.5 9 6.5 15 9 17",
        "M15 7C17.5 9 17.5 15 15 17",
        "M6.5 17h11v2.5a1 1 0 0 1 -1 1h-9a1 1 0 0 1 -1 -1z",
        "M12 10c1.5 1.5 2 2.5 2 3.5a2 2 0 0 1 -4 0c0 -1 .5 -2 2 -3.5z",
    ],
    // A mason's trowel resting over two courses of brick.
    cement : [
        "M3 14.5h18v6H3z",
        "M3 17.5h18",
        "M12 14.5v3",
        "M7.5 17.5v3M16.5 17.5v3",
        "M8.5 12.5L16.71 9.53L12.85 4.93Z",
        "M14.78 7.23L14.54 5.08L17.61 2.51",
    ],
};

// The glyph of a followed good, by the story's name for it; "basket" is the basket as a whole.
export const GLYPH_OF : Record<string, GlyphName> = {
    "Colour TVs" : "tv", "Anti-cancer drugs" : "pill", "Blankets" : "blanket", "Solar power systems" : "solar", "Wheat" : "wheat",
    "Rice" : "rice", "Silver" : "silver", "Coconuts" : "coconut", "Tomatoes" : "tomato", "Jasmine" : "jasmine", "Milk" : "milk",
    "Eggs" : "egg", "Petrol" : "petrol", "Kerosene" : "kerosene", "Cement" : "cement", "basket" : "basket",
};

// The <path> elements only, for use inside another SVG's <g>: the caller sets stroke, width and transform.
export const GlyphPaths = ({ name } : { name : GlyphName }) => (
    <>{GLYPH_PATHS[name].map((d, i) => <path key={i} d={d} />)}</>
);

// An inline glyph at a size, in the current text colour.
export const Glyph = ({ name, size = 20, className, title, style } : { name : GlyphName; size ? : number; className ? : string; title ? : string; style ? : CSSProperties }) => (
    <svg
        className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" style={style} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}
    >
        {title && <title>{title}</title>}
        <GlyphPaths name={name} />
    </svg>
);
