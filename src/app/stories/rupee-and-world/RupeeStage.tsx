"use client";

// The opening act's stage: one canvas on which the world turns into the rupee's numbers. At the title it is a planet of
// land dots rising behind the words, India and its 40 trading partners on it, each partner's dots deeper the more it
// weighs in the basket (RBI's 2015-16 trade weights, January 2021 Bulletin, Table 1). Scrolling shrinks it to a globe
// beside the text, where a country or a region answers to the pointer. Then the dots leave the land and line up as
// months, one dot a month from April 2004, into the four lines the story reads: what a rupee buys in dollars, the
// nominal index (NEER), India's prices against its partners' (REER ÷ NEER) and the real index (REER), each rebased to
// April 2004 = 100. Axes, labels and tooltips are HTML and SVG over the canvas so they stay sharp.
//
// Borders: India is the Survey of India outline (india-soi.geojson), drawn in place of Natural Earth's India; the
// other countries are Natural Earth's (world-countries.geojson), the same two files the debt-service story draws.
//
// Every frame is computed from the scene, the size and the clock; a scene change re-captures where each dot is and
// eases it to its new target, staggered so a line draws from left to right.

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// GEO =================================================================================================================
import { geoBounds, geoContains, geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// LIB =================================================================================================================

// DATA ================================================================================================================
import { BAND, COST, CROSS, DOLLAR_GAP, EVENTS, HALVES_MEET, HALVES_PEAK, HEADLINE, LINES, MONTHS, N, PARTNERS, type Line, iOf, monthName, monthShort } from "./data";
import { COINS, CoinBasket, VIEW_H, VIEW_TOP } from "./CoinBasket";
import { PriceScale } from "./PriceScale";
import { Constellation } from "./Constellation";

// THE SCENES ==========================================================================================================
// After the dollar chart, two scenes with no chart: a basket of the 40 currencies bought in 2004 ("coins") and again
// in 2026 ("coins26"), drawn by CoinBasket.tsx over an empty stage.
export type SceneId = "hero" | "basket" | "dollar" | "coins" | "coins26" | "neer" | "orbit" | "scale" | "prices" | "guess" | "halves" | "reer" | "orbitReal" | "swing";
const isGlobe = (s : SceneId) => s === "hero" || s === "basket";
export const isCoins = (s : SceneId) => s === "coins" || s === "coins26";
// the scenes drawn as illustrations over an empty stage (the basket of coins, the balance scale)
const isIllus = (s : SceneId) => isCoins(s) || s === "scale" || s === "orbit" || s === "orbitReal";

const LINE_KEYS : Line[] = [ "usd", "neer", "rel", "reer" ];
// What each line is called: on the dollar chart in rupees for a dollar, on the others as prices from April 2004 = 100.
const LINE_LABEL : Record<Line, string> = {
    usd  : "Rupees for one US dollar",
    neer : "The basket of 40 currencies (NEER)",
    rel  : "India’s prices against partners’",
    reer : "Indian goods, priced abroad (REER)",
};
const COST_LABEL : Record<Line, string> = { ...LINE_LABEL, usd : `Dollars that were worth ₹100 in ${monthShort(MONTHS[0])}`, neer : "The basket (NEER)" };

// What each chart scene shows: the lines at full strength, those left faint, the first month framed and the scale.
// `unit` is rupees for one dollar, or a price where April 2004 = 100 (COST in data.ts, its 100 drawn dashed), so every
// line after the first rises the same way as the first: up is more rupees, or a higher price. `key` says so.
interface ChartCfg { on : Line[]; faint : Line[]; unit : "inr" | "cost"; from : number; lo : number; hi : number; ticks : number[]; band : boolean; swing : boolean; guess : boolean; key : string }
const valueOf = (cfg : ChartCfg, l : Line) => (cfg.unit === "cost" ? COST[l] : LINES[l]);
const labelOf = (cfg : ChartCfg, l : Line) => (cfg.unit === "cost" ? COST_LABEL[l] : LINE_LABEL[l]);
const MORE_RUPEES = "↑ more rupees spent to buy the same basket of currencies.";
const PRICES = "↑ India’s prices rising faster than its partners’.";
const GOODS = "↑ Indian goods cost more abroad · ↓ they cost less.";
const HALVES = "Terracotta above purple: Indian prices rose faster than the rupee cost of partners’ currencies.";
const RUPEES = { unit : "inr" as const, from : 0, lo : 35, hi : 105, ticks : [ 40, 60, 80, 100 ] };
// one scale for all the price charts, from the lowest guess (50) to dollars that were worth ₹100 in 2004, at their highest (218)
const PRICE  = { unit : "cost" as const, from : 0, lo : 40, hi : 232, ticks : [ 50, 100, 150, 200 ] };
const SWING_FROM = Math.max(0, iOf("2022-04"));
const CHART : Partial<Record<SceneId, ChartCfg>> = {
    dollar : { on : [ "usd" ],         faint : [],                ...RUPEES, band : false, swing : false, guess : false, key : "" },
    neer   : { on : [ "neer", "usd" ], faint : [],                ...PRICE,  band : false, swing : false, guess : false, key : MORE_RUPEES },
    // the prices line alone until the answer: the basket beside it would give the answer away
    prices : { on : [ "rel" ],         faint : [],                ...PRICE,  band : false, swing : false, guess : false, key : PRICES },
    guess  : { on : [ "rel" ],         faint : [],                ...PRICE,  band : false, swing : false, guess : false, key : PRICES },
    // the two halves together, after the guess: the answer shows here first, as two lines meeting
    halves : { on : [ "rel", "neer" ], faint : [],                ...PRICE,  band : false, swing : false, guess : false, key : HALVES },
    reer   : { on : [ "reer" ],        faint : [ "neer", "rel" ], ...PRICE,  band : true,  swing : false, guess : true,  key : GOODS },
    swing  : { on : [ "reer" ],        faint : [],                ...PRICE, from : SWING_FROM, lo : 92, hi : 124, ticks : [ 100, 110, 120 ], band : true, swing : true, guess : false, key : GOODS },
};
// Which events each chart scene shows: those on its line (EVENTS' chart field). The guess shares the prices chart.
const EVENT_LINE : Partial<Record<SceneId, "usd" | "neer" | "rel">> = { dollar : "usd", neer : "neer", prices : "rel", guess : "rel" };

// The Reserve Bank's own index for a line in a month, where it has one: shown in the tooltip beside the price.
const RBI_INDEX : Partial<Record<Line, number[]>> = { neer : LINES.neer, reer : LINES.reer };

// THE BASKET ON THE MAP ===============================================================================================
// Each partner's countries, by RBI's currency code: the euro area as its 19 members of 2015-16.
const COUNTRIES : Record<string, string[]> = {
    EUR : [ "AUT", "BEL", "CYP", "EST", "FIN", "FRA", "DEU", "GRC", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", "PRT", "SVK", "SVN", "ESP" ],
    CNY : [ "CHN" ], AED : [ "ARE" ], USD : [ "USA" ], SAR : [ "SAU" ], CHF : [ "CHE" ], HKD : [ "HKG" ], IDR : [ "IDN" ], SGD : [ "SGP" ],
    IQD : [ "IRQ" ], KRW : [ "KOR" ], KWD : [ "KWT" ], JPY : [ "JPN" ], QAR : [ "QAT" ], NGN : [ "NGA" ], GBP : [ "GBR" ], MYR : [ "MYS" ],
    IRR : [ "IRN" ], AUD : [ "AUS" ], ZAR : [ "ZAF" ], BRL : [ "BRA" ], THB : [ "THA" ], VND : [ "VNM" ], BDT : [ "BGD" ], TWD : [ "TWN" ],
    AOA : [ "AGO" ], RUB : [ "RUS" ], TRY : [ "TUR" ], MXN : [ "MEX" ], ILS : [ "ISR" ], LKR : [ "LKA" ], CAD : [ "CAN" ], EGP : [ "EGY" ],
    OMR : [ "OMN" ], NPR : [ "NPL" ], KES : [ "KEN" ], TZS : [ "TZA" ], CLP : [ "CHL" ], UAH : [ "UKR" ], GHS : [ "GHA" ],
};
const CODE_OF : Record<string, string> = Object.fromEntries(Object.entries(COUNTRIES).flatMap(([ code, isos ]) => isos.map(iso => [ iso, code ])));

// Where each partner's arc lands: its capital as [lon, lat] (the euro area at Frankfurt, where its central bank sits;
// Israel at Tel Aviv, as most embassies are). Small partners the map draws too small to see get only this point.
const PLACE : Record<string, [ number, number ]> = {
    EUR : [ 8.68, 50.11 ],   CNY : [ 116.40, 39.90 ], AED : [ 54.38, 24.45 ],  USD : [ -77.04, 38.90 ],  SAR : [ 46.68, 24.71 ],
    CHF : [ 7.45, 46.95 ],   HKD : [ 114.17, 22.32 ], IDR : [ 106.85, -6.21 ], SGD : [ 103.82, 1.35 ],   IQD : [ 44.36, 33.31 ],
    KRW : [ 126.98, 37.57 ], KWD : [ 47.99, 29.38 ],  JPY : [ 139.69, 35.68 ], QAR : [ 51.53, 25.29 ],   NGN : [ 7.40, 9.08 ],
    GBP : [ -0.13, 51.51 ],  MYR : [ 101.69, 3.14 ],  IRR : [ 51.39, 35.69 ],  AUD : [ 149.13, -35.28 ], ZAR : [ 28.19, -25.75 ],
    BRL : [ -47.88, -15.79 ], THB : [ 100.50, 13.76 ], VND : [ 105.85, 21.03 ], BDT : [ 90.41, 23.81 ],  TWD : [ 121.57, 25.03 ],
    AOA : [ 13.23, -8.84 ],  RUB : [ 37.62, 55.76 ],  TRY : [ 32.86, 39.93 ],  MXN : [ -99.13, 19.43 ],  ILS : [ 34.78, 32.09 ],
    LKR : [ 79.85, 6.93 ],   CAD : [ -75.70, 45.42 ], EGP : [ 31.24, 30.04 ],  OMR : [ 58.41, 23.59 ],   NPR : [ 85.32, 27.72 ],
    KES : [ 36.82, -1.29 ],  TZS : [ 35.75, -6.16 ],  CLP : [ -70.67, -33.45 ], UAH : [ 30.52, 50.45 ],  GHS : [ -0.19, 5.60 ],
};
const DELHI : [ number, number ] = [ 77.21, 28.61 ];
const WEIGHT = Object.fromEntries(PARTNERS.map(p => [ p.iso, p.weight ]));
const NAME = Object.fromEntries(PARTNERS.map(p => [ p.iso, p.country ]));
const MAX_W = PARTNERS[0]?.weight ?? 1;
const ARCS = PARTNERS.filter(p => PLACE[p.iso]).map(p => ({
    code : p.iso, weight : p.weight, end : PLACE[p.iso], at : geoInterpolate(DELHI, PLACE[p.iso]), dist : geoDistance(DELHI, PLACE[p.iso]),
}));

// An arc's width in pixels for a weight in per cent, at the globe's scale (1 at a radius of 260px).
export const arcWidth = (weight : number, scale : number) => (0.5 + 0.36 * weight) * scale;
export const arcScale = (R : number) => Math.max(0.6, Math.min(1.6, R / 260));

// THE LAND ============================================================================================================
interface Country { name : string; iso : string; code : string | null; feature : Feature<Geometry>; box : [ [ number, number ], [ number, number ] ] }
interface Land { countries : Country[]; lon : Float32Array; lat : Float32Array; country : Int16Array }
type Props = { name : string; iso : string };

const inBox = (b : Country["box"], lon : number, lat : number) => {
    const [ [ w, s ], [ e, n ] ] = b;
    if (lat < s || lat > n) return false;
    return w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;     // a box across the antimeridian
};
const countryAt = (cs : Country[], lon : number, lat : number) => {
    for (let i = 0; i < cs.length; i++) if (inBox(cs[i].box, lon, lat) && geoContains(cs[i].feature, [ lon, lat ])) return i;
    return -1;
};

// The land as dots on an even grid, 1.8° apart on the ground: about 3,400 of them. Loaded once per visit.
const STEP = 1.8;
let landPromise : Promise<Land> | null = null;
const loadLand = () => landPromise ??= (async () => {
    const get = (f : string) => fetch(`/stories/rupee-and-world/${f}`).then(r => r.json() as Promise<FeatureCollection<Geometry, Props>>);
    const [ world, india ] = await Promise.all([ get("world-countries.geojson"), get("india-soi.geojson") ]);
    // India's outline without its inner rings: the Survey of India file keeps slivers between Ladakh and Jammu and
    // Kashmir as holes, which would draw as a line across the north
    const solid = (f : Feature<Geometry, Props>) : Feature<Geometry, Props> => f.geometry.type === "MultiPolygon"
        ? { ...f, geometry : { type : "MultiPolygon", coordinates : f.geometry.coordinates.map(poly => [ poly[0] ]) } }
        : f.geometry.type === "Polygon" ? { ...f, geometry : { type : "Polygon", coordinates : [ f.geometry.coordinates[0] ] } } : f;
    const countries : Country[] = [ ...world.features.filter(f => f.properties.iso !== "IND"), ...india.features.map(solid) ].map(f => {
        // Natural Earth files France without an ISO code
        const iso = f.properties.iso === "-99" && f.properties.name === "France" ? "FRA" : f.properties.iso;
        return { name : f.properties.name, iso, code : CODE_OF[iso] ?? null, feature : f, box : geoBounds(f) as Country["box"] };
    });
    const lon : number[] = [], lat : number[] = [], country : number[] = [];
    for (let la = -56; la <= 80; la += STEP) {
        const dl = STEP / Math.cos(la * Math.PI / 180);
        for (let lo = -180 + ((la / STEP) % 2) * dl / 2; lo < 180; lo += dl) {
            const c = countryAt(countries, lo, la);
            if (c >= 0) { lon.push(lo); lat.push(la); country.push(c); }
        }
    }
    return { countries, lon : Float32Array.from(lon), lat : Float32Array.from(lat), country : Int16Array.from(country) };
})();

// THE PALETTE =========================================================================================================
// The site's chart scheme for the page's theme. The four lines: the dollar in the secondary ink, the nominal index
// in the cool pole, prices in the warm pole, and the real index, the point of the story, in the page's accent, the
// colour of "one rupee" in the title.
type RGB = [ number, number, number ];
interface Pal { field : RGB; faint : RGB; emph : RGB; warm : RGB; ink : RGB; paper : RGB; head : RGB; line : Record<Line, RGB> }
const mix = (a : RGB, b : RGB, t : number) : RGB => [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t ];
const rgbOf = (hex : string) : RGB => [ parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16) ];
// A colour of the page as RGB, read from the page itself so the canvas matches it in either theme: --accent for the
// real-rate line (the colour of "one rupee" in the title) and the page's paper and heading ink for the globe's labels.
// The fallbacks are the light theme's (the accent is the site's indivara, hsl(262, 82%, 52%), deepened by 12%).
const ACCENT_LIGHT : RGB = [ 93, 29, 205 ];
const pageRGB = (cssVar : string, fallback : RGB) : RGB => {
    const host = typeof document !== "undefined" ? document.getElementById("rupee-and-world-page") : null;
    if (!host) return fallback;
    const probe = document.createElement("span");
    probe.style.color = `var(${cssVar})`;
    host.appendChild(probe);
    const css = getComputedStyle(probe).color;
    probe.remove();
    const cv = document.createElement("canvas"); cv.width = cv.height = 1;
    const c2 = cv.getContext("2d")!;
    c2.fillStyle = css; c2.fillRect(0, 0, 1, 1);
    const [ r, g, b ] = c2.getImageData(0, 0, 1, 1).data;
    return [ r, g, b ];
};
// RBIH's brand palette (the Kosh design guidelines): Terracotta and Indivara the primaries, Turmeric and Neem the
// accents, Sandalwood, Ivory and Charcoal the neutrals. Each role keeps one colour through the story: India and its
// prices terracotta, the partners and the basket indivara, the dollar charcoal, the answer (goods abroad) neem. The
// dark theme lifts each to a lighter tint of its own family.
export const BRAND = {
    terracotta : [ 186, 100, 79 ] as RGB, indivara : [ 134, 79, 227 ] as RGB, turmeric : [ 234, 170, 58 ] as RGB,
    neem : [ 107, 142, 35 ] as RGB, sandalwood : [ 225, 213, 188 ] as RGB, ivory : [ 242, 240, 230 ] as RGB,
    charcoal : [ 47, 47, 47 ] as RGB,
};
// RBIH's indivara scale, base to 10 (each step 10% nearer white), and a partner's step by weight: 70 for the heaviest
// to 20 for the lightest
const INDI : RGB[] = Array.from({ length : 10 }, (_, k) => mix(BRAND.indivara, [ 255, 255, 255 ], k * 0.1));
const indiFor = (weight : number) => INDI[3 + Math.min(5, Math.floor((1 - Math.sqrt(weight / MAX_W)) * 6))];
export const palette = (theme : string, fromPage = true) : Pal => {
    const dark = theme === "theme-dark";
    const W : RGB = [ 255, 255, 255 ], up = (c : RGB, t : number) => (dark ? mix(c, W, t) : c);
    void ACCENT_LIGHT;
    const paper = fromPage ? pageRGB("--fig-bg", [ 255, 255, 255 ]) : [ 255, 255, 255 ] as RGB;
    const head = fromPage ? pageRGB("--heading-text-colour", [ 40, 40, 40 ]) : [ 40, 40, 40 ] as RGB;
    return {
        field : dark ? mix(BRAND.charcoal, W, 0.32) : mix(BRAND.sandalwood, BRAND.charcoal, 0.25),
        faint : dark ? mix(BRAND.charcoal, W, 0.12) : BRAND.sandalwood,
        emph  : up(BRAND.indivara, 0.2), warm : up(BRAND.terracotta, 0.22), ink : dark ? BRAND.ivory : BRAND.charcoal, paper, head,
        line  : {
            usd  : dark ? BRAND.sandalwood : BRAND.charcoal,
            neer : up(BRAND.indivara, 0.3),
            rel  : up(BRAND.terracotta, 0.25),
            reer : up(BRAND.neem, 0.35),
        },
    };
};
// The palette, re-read whenever the theme changes: after the change has reached the page, since --accent is read
// from it. The first render uses the fallback accent on the server and in the browser alike, so hydration matches.
export const usePalette = () => {
    const [ theme ] = useTheme();
    const [ pal, setPal ] = useState<Pal>(() => palette(theme ?? "theme-light", false));
    useEffect(() => {
        const read = () => setPal(palette(document.documentElement.classList.contains("theme-dark") ? "theme-dark" : "theme-light"));
        read();
        const mo = new MutationObserver(read);
        mo.observe(document.documentElement, { attributes : true, attributeFilter : [ "class" ] });
        return () => mo.disconnect();
    }, [ theme ]);
    return pal;
};
const rgba = (c : RGB, a : number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const cssOf = (c : RGB) => `rgb(${c.join(",")})`;

// THE LAYOUT ==========================================================================================================
interface Frame {
    mobile : boolean;
    globe  : { cx : number; cy : number; R : number; alpha : number };
    chart  : { x0 : number; x1 : number; y0 : number; y1 : number };
}
const frameOf = (scene : SceneId, w : number, h : number) : Frame => {
    const mobile = w < 900;
    // the basket's card is wider, to hold all 40 partners (.step-card.is-wide in the stylesheet)
    const card = mobile ? 0 : (scene === "basket" ? Math.min(500, 0.38 * w) : Math.min(420, 0.34 * w)) + 56;
    const chart = mobile
        ? { x0 : 40, x1 : w - 100, y0 : h * 0.1, y1 : h * 0.46 }
        : { x0 : Math.max(64, w * 0.05), x1 : w - card - 150, y0 : h * 0.17, y1 : h * 0.83 };
    let globe;
    if (scene === "hero") {
        // the whole globe beside the title, on the right; on a phone, above it
        globe = mobile
            ? { cx : w / 2, cy : h * 0.2, R : Math.min(w * 0.36, h * 0.16), alpha : 1 }
            // a huge globe on the right, running off the right and bottom edges, the title on the left
            : { cx : w * 0.8, cy : h * 0.66, R : Math.max(h * 0.78, w * 0.4), alpha : 1 };
    } else if (scene === "basket") {
        const room = mobile ? w : w - card;
        const R = mobile ? Math.min(w * 0.4, h * 0.16) : Math.min(room * 0.36, h * 0.37);
        globe = { cx : mobile ? w / 2 : room / 2 + 16, cy : mobile ? h * 0.19 : h * 0.5, R, alpha : 1 };
    } else {
        globe = { cx : (chart.x0 + chart.x1) / 2, cy : (chart.y0 + chart.y1) / 2, R : Math.min(chart.x1 - chart.x0, chart.y1 - chart.y0) * 0.45, alpha : 0 };
    }
    return { mobile, globe, chart };
};
// a value as the chart shows it: rupees to the paisa on the dollar chart; on the price charts the two currency lines
// as rupees, the price lines as plain numbers
const fmt = (cfg : ChartCfg, v : number, l ? : Line) => (cfg.unit === "inr" ? `₹${v.toFixed(2)}` : `${l === "usd" || l === "neer" ? "₹" : ""}${Math.round(v)}`);
const xAt = (cfg : ChartCfg, f : Frame, m : number) => f.chart.x0 + (f.chart.x1 - f.chart.x0) * (m - cfg.from) / (N - 1 - cfg.from);
const yAt = (cfg : ChartCfg, f : Frame, v : number) => f.chart.y1 - (f.chart.y1 - f.chart.y0) * (v - cfg.lo) / (cfg.hi - cfg.lo);

// Where to turn the globe for a set of partners: towards the weighted mean of their capitals, but drawn back towards
// India far enough that India stays on the near side, about 70° from the centre, so the arcs' source is in view at the
// rim while the partners fill the globe. For partners close to India it turns a quarter of the way back, which keeps
// both well inside.
const vecOf = (lon : number, lat : number) => {
    const lo = lon * Math.PI / 180, la = lat * Math.PI / 180;
    return [ Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la) ];
};
const facing = (codes : string[]) : [ number, number ] => {
    let x = 0, y = 0, z = 0;
    for (const c of codes) {
        const p = PLACE[c]; if (!p) continue;
        const w = WEIGHT[c] ?? 1, v = vecOf(p[0], p[1]);
        x += w * v[0]; y += w * v[1]; z += w * v[2];
    }
    const n = Math.hypot(x, y, z) || 1, f = [ x / n, y / n, z / n ], india = vecOf(DELHI[0], DELHI[1]);
    const d = Math.acos(Math.max(-1, Math.min(1, f[0] * india[0] + f[1] * india[1] + f[2] * india[2])));
    const back = Math.max(d * 0.25, d - 70 * Math.PI / 180);      // how far to turn back towards India
    // the point `back` radians from the partners along the great circle towards India
    const t = d > 1e-6 ? back / d : 0, s0 = Math.sin((1 - t) * d), s1 = Math.sin(t * d), sd = Math.sin(d) || 1;
    const c = d > 1e-6 ? [ 0, 1, 2 ].map(k => (s0 * f[k] + s1 * india[k]) / sd) : f;
    return [ Math.atan2(c[1], c[0]) * 180 / Math.PI, Math.atan2(c[2], Math.hypot(c[0], c[1])) * 180 / Math.PI ];
};

// a coin's fall: accelerating down, then two small bounces as it lands
const bounce = (t : number) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
};
const ease = (t : number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2, RAD = Math.PI / 180;

// THE STAGE ===========================================================================================================
interface Tip { x : number; y : number; head : string; lines : string[] }
interface StageProps {
    scene : SceneId;
    focus : string[] | null;        // partners picked out from the text: a region's or one country's codes
    guess : number | null;          // the reader's guess, the shoes' price today where 2004 is 100, drawn on the real rate
}

export const RupeeStage = ({ scene, focus, guess } : StageProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const [ land, setLand ] = useState<Land | null>(null);
    const [ tip, setTip ] = useState<Tip | null>(null);
    const [ hoverCode, setHoverCode ] = useState<string | null>(null);
    const [ hoverMonth, setHoverMonth ] = useState<number | null>(null);
    // the event whose note is open on the dollar chart; leaving waits a moment so the pointer can reach the note's link
    const [ openEvent, setOpenEvent ] = useState<number | null>(null);
    const sceneEvents = useMemo(() => EVENTS.filter(e => e.chart === EVENT_LINE[scene]), [ scene ]);
    const eventLetGo = useRef(0);
    const showEvent = (k : number | null) => {
        clearTimeout(eventLetGo.current);
        if (k !== null) setOpenEvent(k); else eventLetGo.current = window.setTimeout(() => setOpenEvent(null), 300);
    };
    useEffect(() => { setOpenEvent(null); return () => clearTimeout(eventLetGo.current); }, [ scene ]);
    // The events arrive one by one, in order, once the dollar line has drawn itself: after about 2.3 s when the line
    // comes from the globe, at once when the chart is already up. `intro.run` restarts their animation on each arrival.
    const [ intro, setIntro ] = useState({ run : 0, wait : 0 });
    const prevScene = useRef<SceneId>(scene);
    useEffect(() => {
        const was = prevScene.current, chart = EVENT_LINE[scene];
        if (chart && chart !== EVENT_LINE[was]) setIntro(i => ({ run : i.run + 1, wait : isGlobe(was) || isIllus(was) ? 2.3 : 0.4 }));
        prevScene.current = scene;
    }, [ scene ]);
    const pal = usePalette();
    const letGo = useRef(0);
    useEffect(() => () => clearTimeout(letGo.current), []);
    const hitRef = useRef<((x : number, y : number) => { code : string | null; iso : string | null; name : string } | null) | null>(null);

    // What the frame loop reads; React writes it, the loop never re-renders.
    // `focus` (lit) picks partners out whether it comes from a chip or the pointer on the globe; `turn` is only the
    // chips', since turning the globe to a country under the pointer would move it away and flicker.
    const live = useRef({ scene, focus : null as string[] | null, turn : null as string[] | null, pal, w : 0, h : 0 });
    const lit = focus ?? (hoverCode ? [ hoverCode ] : null);
    live.current.scene = scene; live.current.focus = lit; live.current.turn = focus; live.current.pal = pal;

    useEffect(() => { let on = true; loadLand().then(l => on && setLand(l)).catch(() => {}); return () => { on = false; }; }, []);
    useEffect(() => { setTip(null); setHoverCode(null); setHoverMonth(null); }, [ scene ]);

    // ---- the frame loop ------------------------------------------------------------------------------------------------
    useEffect(() => {
        if (!land) return;
        const canvas = canvasRef.current!, ctx = canvas.getContext("2d")!;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const L = land.lon.length;
        const cosLa = new Float32Array(L), sinLa = new Float32Array(L), lonR = new Float32Array(L);
        for (let i = 0; i < L; i++) { cosLa[i] = Math.cos(land.lat[i] * RAD); sinLa[i] = Math.sin(land.lat[i] * RAD); lonR[i] = land.lon[i] * RAD; }
        // The dots each month of each line takes: the land read west to east from behind India, so the globe unrolls.
        const order = Array.from({ length : L }, (_, i) => i).sort((a, b) => ((land.lon[a] - DELHI[0] + 540) % 360) - ((land.lon[b] - DELHI[0] + 540) % 360));
        const slot = new Int32Array(L).fill(-1);
        const dotOf = new Int32Array(4 * N);
        for (let s = 0; s < 4; s++) for (let m = 0; m < N; m++) {
            const i = order[Math.floor(((m * 4 + s) / (4 * N)) * L)];
            slot[i] = s * N + m; dotOf[s * N + m] = i;
        }
        const seed = Float32Array.from({ length : L }, (_, i) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); });

        const x = new Float32Array(L), y = new Float32Array(L), r = new Float32Array(L), a = new Float32Array(L);
        const cr = new Float32Array(L), cg = new Float32Array(L), cb = new Float32Array(L);
        const fx = new Float32Array(L), fy = new Float32Array(L), b = new Float32Array(L).fill(1), dur = new Float32Array(L).fill(1);
        const tx = new Float32Array(L), ty = new Float32Array(L);
        // coins: a month's point that arrives from the globe or an illustration falls from above as a blank coin,
        // lands on its line, and fades once the line is drawn through it
        const fall = new Uint8Array(L), pendingFall = new Uint8Array(L);

        const proj = geoOrthographic().clipAngle(90).precision(0.6);
        const labelFont = getComputedStyle(document.body).fontFamily || "sans-serif";
        const path = geoPath(proj, ctx);
        const grat = geoGraticule10();
        const g = { cx : 0, cy : 0, R : 0, alpha : 0, lam : DELHI[0] - 20, phi : 6 };
        // Behind the title the globe swings rather than spins: India travels towards one side of the screen, slows,
        // and comes back, so it never goes round the back however long the title stays on screen.
        const SWING_RATE = 0.1;                             // radians a second
        let swingPhase = -0.4;
        let shown : SceneId | null = null, shownW = 0, shownH = 0, last = performance.now(), first = true;
        let lineFrom = 0;                                  // when the hairlines may start to show
        const arcAlpha = new Float32Array(ARCS.length).fill(0.55);   // each arc's strength, eased, so a hover fades

        const loop = (now : number) => {
            raf = 0;
            if (!visible) return;
            const dt = Math.min(0.1, (now - last) / 1000); last = now;
            const { scene : sc, focus : fo, turn, pal : P, w, h } = live.current;
            // the globe's own colours (RBIH): land in ivory to sandalwood, India #C17461, a country pointed at #595959,
            // the beams solid indivara
            const darkTheme = document.documentElement.classList.contains("theme-dark");
            // The globe is a white sphere in both themes; on it, countries outside the basket are the palest sandalwood,
            // partners run from sandalwood to a deep sandalwood with their weight, India #C17461; a country pointed at turns
            // #595959 with the rest dimmed; the beams are RBIH indivara.
            void darkTheme;
            // Countries in RBIH indivara tints (the Kosh scale: each step 10% nearer white): a partner deeper the more it
            // weighs, from step 70 to step 20; countries outside the basket step 10; India terracotta; the beams the
            // deep indivara base; the country pointed at keeps its own shade while the rest fall to the lightest step.
            const SEA : RGB = [ 255, 255, 255 ], SEA_RIM : RGB = INDI[3];
            const LAND = { none : INDI[9] };
            const INDIA : RGB = BRAND.terracotta;
            const HOT : RGB = [ 89, 89, 89 ];
            const BEAM : RGB = BRAND.indivara;
            if (!w) { raf = requestAnimationFrame(loop); return; }
            const F = frameOf(sc, w, h), cfg = CHART[sc];

            // the globe's place and turn, eased
            const k = reduced || first ? 1 : 1 - Math.exp(-dt / 0.28);
            g.cx += (F.globe.cx - g.cx) * k; g.cy += (F.globe.cy - g.cy) * k; g.R += (F.globe.R - g.R) * k;
            g.alpha += (F.globe.alpha - g.alpha) * (reduced || first ? 1 : 1 - Math.exp(-dt / 0.3));
            let lamT = g.lam, phiT = sc === "hero" ? 14 : 18;
            if (sc === "hero") {
                // the whole globe is in view: India swings 40° either side of facing the reader, never round the back
                if (!reduced) swingPhase += dt * SWING_RATE;
                lamT = DELHI[0] + 28 * Math.sin(swingPhase);
            }
            else if (sc === "basket") {
                // the chips turn the globe; the pointer on a country only lights it, and the globe holds still under it
                if (turn?.length) [ lamT, phiT ] = facing(turn);
                else if (fo?.length) { lamT = g.lam; phiT = g.phi; }
                else lamT = 62;
                phiT = Math.max(-25, Math.min(40, phiT));
            }
            const dLam = ((lamT - g.lam + 540) % 360) - 180;
            g.lam += dLam * (reduced ? 1 : 1 - Math.exp(-dt / 0.6));
            g.phi += (phiT - g.phi) * (reduced ? 1 : 1 - Math.exp(-dt / 0.6));
            proj.rotate([ -g.lam, -g.phi ]).scale(g.R).translate([ g.cx, g.cy ]);

            // a new scene, or a new size: every dot sets off from where it is
            if (sc !== shown || w !== shownW || h !== shownH) {
                const resize = sc === shown;
                for (let i = 0; i < L; i++) {
                    fx[i] = x[i]; fy[i] = y[i];
                    const s = slot[i], toChart = !!cfg && s >= 0;
                    let delay = seed[i] * 0.12, d = 0.7;          // globe to globe: quick, so the basket is in place as the scroll ends
                    // coins fall only from the globe into the first chart; after an illustration a chart fades in
                    const coins = toChart && (shown === null || isGlobe(shown));
                    const fromIllus = toChart && shown !== null && isIllus(shown);
                    fall[i] = coins && !reduced && !first && !resize ? 1 : 0; pendingFall[i] = fall[i];
                    if (coins) { delay = 0.05 + 1.1 * (s % N) / N + seed[i] * 0.15; d = 1.0; }
                    else if (cfg && shown && !isGlobe(shown)) { delay = seed[i] * 0.12; d = 0.8; }
                    else if (!cfg && shown && !isGlobe(shown)) { delay = seed[i] * 0.45; d = 1.1; }   // a chart back into the globe
                    dur[i] = reduced || first || resize || fromIllus ? 0 : d;
                    b[i] = reduced || first || resize || fromIllus ? 1 : -delay / d;
                    if (fromIllus) { a[i] = 0; }
                }
                // the hairlines wait until the dots have landed when the line is drawn from the globe
                lineFrom = now + (cfg && (shown === null || isGlobe(shown)) && !reduced && !first && !resize ? 1900 : 0);
                shown = sc; shownW = w; shownH = h;
            }

            const l0 = g.lam * RAD, sP = Math.sin(g.phi * RAD), cP = Math.cos(g.phi * RAD);
            const rGlobe = Math.max(0.9, Math.min(2.6, g.R * 0.0072)), rLine = F.mobile ? 1.5 : 2.1;
            const kc = reduced ? 1 : 1 - Math.exp(-dt / 0.22);
            const focusSet = fo ? new Set(fo) : null;
            for (let i = 0; i < L; i++) {
                // where the dot belongs on the globe this frame
                const dl = lonR[i] - l0, cd = Math.cos(dl);
                const gx = g.cx + g.R * cosLa[i] * Math.sin(dl);
                const gy = g.cy - g.R * (cP * sinLa[i] - sP * cosLa[i] * cd);
                const depth = sP * sinLa[i] + cP * cosLa[i] * cd;
                let ta : number, tr : number, tc : RGB;
                const s = slot[i];
                if (cfg && s >= 0 && (cfg.on.includes(LINE_KEYS[(s / N) | 0]) || cfg.faint.includes(LINE_KEYS[(s / N) | 0]))) {
                    const line = LINE_KEYS[(s / N) | 0], m = s % N;
                    tx[i] = xAt(cfg, F, m); ty[i] = yAt(cfg, F, valueOf(cfg, line)[m]);
                    const inView = m >= cfg.from;
                    ta = inView ? (cfg.on.includes(line) ? 1 : 0.22) : 0; tr = rLine; tc = P.line[line];
                } else if (cfg) {
                    tx[i] = fx[i]; ty[i] = fy[i] + 24; ta = 0; tr = rGlobe; tc = P.field;
                } else {
                    // on the globe the points are unseen: the countries themselves are drawn, filled by weight
                    tx[i] = gx; ty[i] = gy; ta = 0; tr = rGlobe; tc = P.field;
                    void depth;
                }
                if (pendingFall[i] && cfg) {
                    // a falling coin starts above the chart, over the month it will land on
                    pendingFall[i] = 0;
                    fx[i] = tx[i] + (seed[i] - 0.5) * 36; fy[i] = F.chart.y0 - 90 - seed[i] * 260;
                    x[i] = fx[i]; y[i] = fy[i];
                }
                // position: eased from where the scene began; colour, size and alpha: smoothed toward the target
                if (b[i] < 1) b[i] = Math.min(1, b[i] + (dur[i] > 0 ? dt / dur[i] : 1));
                const e = fall[i] ? bounce(Math.max(0, b[i])) : ease(Math.max(0, b[i]));
                x[i] = fx[i] + (tx[i] - fx[i]) * e; y[i] = fy[i] + (ty[i] - fy[i]) * e;
                r[i] += (tr - r[i]) * kc; a[i] += (ta - a[i]) * kc;
                cr[i] += (tc[0] - cr[i]) * kc; cg[i] += (tc[1] - cg[i]) * kc; cb[i] += (tc[2] - cb[i]) * kc;
                if (first) { x[i] = tx[i]; y[i] = ty[i]; r[i] = tr; a[i] = 0; cr[i] = tc[0]; cg[i] = tc[1]; cb[i] = tc[2]; }
            }
            first = false;

            ctx.clearRect(0, 0, w, h);
            // the globe beneath the dots: its disc, the graticule, the partners picked out, the borders
            if (g.alpha > 0.01) {
                ctx.save();
                ctx.globalAlpha = g.alpha;
                ctx.beginPath(); path({ type : "Sphere" });
                // charcoal, a touch lighter towards the upper left so it reads as a sphere
                const grad = ctx.createRadialGradient(g.cx - g.R * 0.35, g.cy - g.R * 0.4, g.R * 0.05, g.cx, g.cy, g.R);
                grad.addColorStop(0, rgba(SEA, 1)); grad.addColorStop(1, rgba(INDI[9], 0.6));
                ctx.fillStyle = grad; ctx.fill();
                ctx.strokeStyle = rgba(SEA_RIM, 1); ctx.lineWidth = 1; ctx.stroke();
                ctx.beginPath(); path(grat); ctx.strokeStyle = rgba(SEA_RIM, 0.18); ctx.lineWidth = 0.5; ctx.stroke();
                // the countries, filled in RBIH's ivory and sandalwood: a partner deeper the more it weighs in the basket,
                // the rest the palest ivory, India its own terracotta; a country pointed at (or picked out) in charcoal
                for (const c of land.countries) {
                    let fill : RGB, al = 1;
                    if (c.iso === "IND") fill = INDIA;
                    else if (c.code) {
                        const wgt = Math.sqrt((WEIGHT[c.code] ?? 0) / MAX_W);
                        // picked out: a country keeps its own shade, the rest fall to the lightest indivara
                        fill = focusSet && !focusSet.has(c.code) ? LAND.none : indiFor(WEIGHT[c.code] ?? 0); void wgt; void HOT;
                    } else fill = LAND.none;
                    ctx.beginPath(); path(c.feature);
                    ctx.fillStyle = rgba(fill, al); ctx.fill();
                }
                ctx.beginPath();
                for (const c of land.countries) path(c.feature);
                ctx.strokeStyle = rgba(SEA, 0.9); ctx.lineWidth = 0.6; ctx.stroke();
                // India last, filled over everything: Natural Earth's neighbours overlap the Survey of India's northern
                // boundary, and their borders would otherwise draw lines across Ladakh and Jammu and Kashmir
                ctx.beginPath();
                for (const c of land.countries) if (c.iso === "IND") path(c.feature);
                ctx.fillStyle = rgba(INDIA, 1); ctx.fill();
                ctx.strokeStyle = rgba(INDIA, 1); ctx.lineWidth = 0.9; ctx.stroke();
                ctx.restore();
            }

            // in a chart, a hairline through each line's months, so the dots read as a line; it follows the dots
            // The lines: solid, drawn through each line's monthly points, at the points' own strength (so a line
            // leaving a chart fades and a faint one stays faint). They wait for falling coins to land.
            const hair = Math.max(0, Math.min(1, (now - lineFrom) / 500));
            if (hair > 0) {
                ctx.lineJoin = "round"; ctx.lineCap = "round";
                for (let s = 0; s < 4; s++) {
                    const line = LINE_KEYS[s];
                    let sum = 0, cnt = 0;
                    for (let m = 0; m < N; m++) { const i = dotOf[s * N + m]; if (a[i] > 0.02) { sum += a[i]; cnt++; } }
                    const strength = hair * (cnt ? sum / cnt : 0);
                    if (strength < 0.02) continue;
                    ctx.lineWidth = strength > 0.5 ? (F.mobile ? 2 : 2.6) : 1.6;
                    ctx.beginPath();
                    let started = false;
                    for (let m = 0; m < N; m++) {
                        const i = dotOf[s * N + m];
                        if (a[i] < 0.05) { started = false; continue; }
                        if (started) ctx.lineTo(x[i], y[i]); else { ctx.moveTo(x[i], y[i]); started = true; }
                    }
                    ctx.strokeStyle = rgba(P.line[line], strength);
                    ctx.stroke();
                }
            }

            // the coins still falling or just landed, flat gold discs with a rim, fading once the line is drawn
            const coinFade = Math.max(0, Math.min(1, (lineFrom + 700 - now) / 700));
            if (coinFade > 0) {
                ctx.lineWidth = 1;
                for (let i = 0; i < L; i++) {
                    if (!fall[i] || a[i] < 0.05) continue;
                    const rc = F.mobile ? 3.4 : 4.6;
                    ctx.globalAlpha = coinFade * Math.min(1, a[i] * 1.5);
                    ctx.beginPath(); ctx.arc(x[i], y[i], rc, 0, TAU);
                    ctx.fillStyle = "#eaaa3a"; ctx.fill(); ctx.strokeStyle = "#a9771f"; ctx.stroke();      // turmeric
                }
                ctx.globalAlpha = 1;
            }

            // the arcs from India to each partner, lifted off the surface, with a bead running out along each
            if (g.alpha > 0.01) {
                ctx.save();
                const scale = arcScale(g.R);
                const low = false;
                const sp = (lon : number, lat : number, lift : number) => {
                    const la = lat * RAD, dl = lon * RAD - l0, cl = Math.cos(la), cd = Math.cos(dl);
                    const px = g.R * cl * Math.sin(dl), py = g.R * (cP * Math.sin(la) - sP * cl * cd);
                    const depth = sP * Math.sin(la) + cP * cl * cd;
                    const vis = depth > 0 || Math.hypot(px, py) * lift > g.R;     // hidden only where the globe is in front
                    return { x : g.cx + px * lift, y : g.cy - py * lift, vis, depth };
                };
                for (let k2 = 0; k2 < ARCS.length; k2++) {
                    const arc = ARCS[k2];
                    const on = !focusSet || focusSet.has(arc.code);
                    const want = on ? (focusSet ? 0.95 : 0.55) : 0.08;
                    arcAlpha[k2] += (want - arcAlpha[k2]) * (reduced ? 1 : 1 - Math.exp(-dt / 0.18));
                    const al = g.alpha * arcAlpha[k2];
                    // a ribbon as wide as the partner's weight, its colour running from India's to the partners'
                    const width = arcWidth(arc.weight, scale);
                    ctx.lineWidth = width; ctx.lineCap = "round";
                    ctx.strokeStyle = rgba(BEAM, al);
                    const K = 36, h0 = 0.06 + (low ? 0.08 : 0.2) * arc.dist / Math.PI;
                    let prev : { x : number; y : number; vis : boolean } | null = null;
                    for (let j = 0; j <= K; j++) {
                        const t = j / K, [ lo, la ] = arc.at(t), q = sp(lo, la, 1 + h0 * Math.sin(Math.PI * t));
                        if (prev && prev.vis && q.vis) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
                        prev = q;
                    }
                    const end = sp(arc.end[0], arc.end[1], 1);
                    if (end.vis) {
                        ctx.fillStyle = rgba(BEAM, Math.min(1, al * 1.6));
                        ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(2, width * 0.75), 0, TAU); ctx.fill();
                    }
                    if (!reduced && on) {
                        const t = ((now * 0.00011 * (1 + 0.05 * arc.weight)) + k2 * 0.137) % 1, [ lo, la ] = arc.at(t);
                        const q = sp(lo, la, 1 + h0 * Math.sin(Math.PI * t));
                        if (q.vis) {
                            ctx.fillStyle = rgba(BEAM, g.alpha * Math.sin(Math.PI * t));
                            ctx.beginPath(); ctx.arc(q.x, q.y, 1.8 * scale, 0, TAU); ctx.fill();
                        }
                    }
                }
                const india = sp(DELHI[0], DELHI[1], 1);
                if (india.vis) {
                    const pulse = reduced ? 0.5 : (now * 0.0006) % 1;
                    ctx.strokeStyle = rgba(INDIA, g.alpha * (1 - pulse)); ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.arc(india.x, india.y, (3 + 14 * pulse) * scale, 0, TAU); ctx.stroke();
                    ctx.fillStyle = rgba(INDIA, g.alpha);
                    ctx.beginPath(); ctx.arc(india.x, india.y, 3 * scale, 0, TAU); ctx.fill();
                }

                // The partners named at their capitals, on the basket's globe: the largest dozen, or those picked out.
                // Larger partners claim their place first; a name that would overlap one already set is left out.
                if (sc === "basket" && g.alpha > 0.5) {
                    ctx.font = `600 ${F.mobile ? 10.5 : 12}px ${labelFont}`;
                    ctx.textBaseline = "middle"; ctx.lineJoin = "round";
                    const taken : [ number, number, number, number ][] = [];
                    const names = (focusSet ? ARCS.filter(a => focusSet.has(a.code)) : ARCS.slice(0, 12));
                    for (const arc of names) {
                        const q = sp(arc.end[0], arc.end[1], 1);
                        if (q.depth < 0.08) continue;
                        const text = arc.code === "EUR" ? "Euro area" : NAME[arc.code];
                        const tw = ctx.measureText(text).width, lx = q.x + 7, ly = q.y - 9;
                        const box : [ number, number, number, number ] = [ lx - 2, ly - 8, lx + tw + 2, ly + 8 ];
                        if (taken.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
                        taken.push(box);
                        const fade = g.alpha * Math.min(1, (q.depth - 0.08) / 0.15);
                        ctx.strokeStyle = rgba(SEA, 0.9 * fade); ctx.lineWidth = 3.5; ctx.strokeText(text, lx, ly);
                        ctx.fillStyle = rgba(BRAND.charcoal, fade); ctx.fillText(text, lx, ly);
                    }
                }
                ctx.restore();
            }
            raf = requestAnimationFrame(loop);
        };

        let visible = true, raf = 0;
        const io = new IntersectionObserver(([ e ]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } });
        io.observe(wrapRef.current!);
        raf = requestAnimationFrame(loop);
        // hit-testing reads the same projection
        hitRef.current = (px : number, py : number) => {
            if (Math.hypot(px - g.cx, py - g.cy) > g.R) return null;
            const ll = proj.invert?.([ px, py ]);
            if (!ll) return null;
            // the small partners first, by their point
            for (const arc of ARCS) {
                const p = proj(arc.end);
                if (p && Math.hypot(p[0] - px, p[1] - py) < 9 && geoDistance(arc.end, [ g.lam, g.phi ]) < Math.PI / 2) return { code : arc.code, iso : null, name : NAME[arc.code] };
            }
            const c = countryAt(land.countries, ll[0], ll[1]);
            return c >= 0 ? { code : land.countries[c].code, iso : land.countries[c].iso, name : land.countries[c].name } : null;
        };
        return () => { cancelAnimationFrame(raf); io.disconnect(); hitRef.current = null; };
    }, [ land ]);

    // ---- the size --------------------------------------------------------------------------------------------------------
    useEffect(() => {
        const canvas = canvasRef.current!, ctx = canvas.getContext("2d")!;
        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            const dpr = Math.min(devicePixelRatio || 1, width < 900 ? 1.5 : 2);
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            live.current.w = width; live.current.h = height;
            setSize({ w : width, h : height });
        });
        ro.observe(wrapRef.current!);
        return () => ro.disconnect();
    }, []);

    // ---- hover: a country on the globe, a month on the chart -----------------------------------------------------------
    const F = size.w ? frameOf(scene, size.w, size.h) : null;
    const cfg = CHART[scene];
    const onPointer = (e : RPointerEvent<HTMLDivElement>) => {
        if (!F || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        if (scene === "basket") {
            const hit = hitRef.current?.(px, py);
            // A partner lights at once; anything else (a border, the sea, a country outside the basket) lets go only
            // after a moment, so crossing from one partner to the next never flashes the whole globe back.
            clearTimeout(letGo.current);
            if (hit?.code) setHoverCode(hit.code);
            else letGo.current = window.setTimeout(() => setHoverCode(null), 250);
            if (!hit) { setTip(null); return; }
            const euro = hit.code === "EUR" && hit.iso;
            setTip({
                x : px, y : py, head : hit.name,
                lines : hit.iso === "IND" ? [ "Home: the rupee is priced against the other 40" ]
                    : hit.code ? [ euro ? `In the euro area, ${WEIGHT.EUR.toFixed(1)}% of the basket` : `${WEIGHT[hit.code].toFixed(1)}% of the basket` ]
                    : [ "Not in the rupee’s basket" ],
            });
            return;
        }
        if (cfg && px >= F.chart.x0 - 6 && px <= F.chart.x1 + 6 && py >= F.chart.y0 - 30 && py <= F.chart.y1 + 20) {
            const m = Math.max(cfg.from, Math.min(N - 1, Math.round(cfg.from + (px - F.chart.x0) / (F.chart.x1 - F.chart.x0) * (N - 1 - cfg.from))));
            setHoverMonth(m);
            setTip({
                x : xAt(cfg, F, m), y : py, head : monthName(MONTHS[m]),
                lines : cfg.on.map(l => `${labelOf(cfg, l)}: ${fmt(cfg, valueOf(cfg, l)[m], l)}${cfg.unit === "cost" && RBI_INDEX[l] ? ` (RBI index ${RBI_INDEX[l]![m].toFixed(1)})` : ""}`),
            });
            return;
        }
        setTip(null); setHoverMonth(null);
    };
    const onLeave = () => { clearTimeout(letGo.current); setTip(null); setHoverCode(null); setHoverMonth(null); };

    // ---- the overlay -----------------------------------------------------------------------------------------------------
    // The chart's furniture stays drawn for the last chart scene while the stage turns back into the globe, so it can
    // fade where it stood.
    const lastCfg = useRef<ChartCfg | null>(null);
    if (cfg) lastCfg.current = cfg;
    const C = lastCfg.current;
    const CF = size.w ? frameOf(cfg ? scene : "dollar", size.w, size.h) : null;

    // the end labels, nudged apart so they never overlap
    const ends = useMemo(() => {
        if (!C || !CF) return [];
        const ls = [ ...C.on ].map(l => ({ l, v : valueOf(C, l)[N - 1], y : yAt(C, CF, valueOf(C, l)[N - 1]) })).sort((p, q) => p.y - q.y);
        // a label is its value and a name of up to two lines: about 52px tall
        for (let i = 1; i < ls.length; i++) if (ls[i].y - ls[i - 1].y < 52) ls[i].y = ls[i - 1].y + 52;
        return ls;
    }, [ C, CF?.chart.y0, CF?.chart.y1 ]); // eslint-disable-line react-hooks/exhaustive-deps

    // the start labels: above the first dot, or below it when a higher label already sits there
    const starts = (() => {
        if (!C || !CF) return [];
        let ls = C.on.map(l => ({ l, v : valueOf(C, l)[C.from], py : yAt(C, CF, valueOf(C, l)[C.from]), y : 0, shared : false })).sort((p, q) => p.py - q.py);
        // lines that start at the same value (every price line starts at 100) share one label, in the ink colour
        if (ls.length > 1 && ls.every(st => Math.abs(st.v - ls[0].v) < 0.5)) ls = [ { ...ls[0], shared : true } ];
        let last = -Infinity;
        for (const st of ls) {
            st.y = C.unit === "inr" ? st.py + 10 : st.py - 30;
            if (st.y < last + 32) st.y = st.py + 10;
            last = st.y;
        }
        return ls;
    })();
    // Between the dollar and the basket, on the basket's chart: one area per run of months in which one cost more than
    // the other, traced along the upper line and back along the lower.
    const gapAreas = useMemo(() => {
        if (!C || !CF || C.unit !== "cost" || !C.on.includes("neer")) return null;
        // the line compared with the basket: the dollar on the basket's chart, India's prices on the two halves'
        const other : Line | null = C.on.includes("usd") ? "usd" : C.on.includes("rel") ? "rel" : null;
        if (!other) return null;
        const out : { d : string; ahead : boolean; other : Line }[] = [];
        let k = 0;
        while (k < N) {
            const ahead = COST[other][k] >= COST.neer[k];
            let e = k;
            while (e + 1 < N && (COST[other][e + 1] >= COST.neer[e + 1]) === ahead) e++;
            const a = Math.max(0, k - 1), z = Math.min(N - 1, e + 1);     // reach to the neighbouring months, so runs meet
            const top = [], bottom = [];
            for (let m = a; m <= z; m++) { top.push(`${xAt(C, CF, m).toFixed(1)} ${yAt(C, CF, COST[other][m]).toFixed(1)}`); bottom.push(`${xAt(C, CF, m).toFixed(1)} ${yAt(C, CF, COST.neer[m]).toFixed(1)}`); }
            out.push({ d : `M${top.join(" L")} L${bottom.reverse().join(" L")} Z`, ahead, other });
            k = e + 1;
        }
        return out;
    }, [ C, CF?.chart.x0, CF?.chart.x1, CF?.chart.y0, CF?.chart.y1 ]); // eslint-disable-line react-hooks/exhaustive-deps

    // The $ coin leaves the basket for the dollar line's label as the basket turns into its chart.
    const [ fly, setFly ] = useState(0);
    const flyFrom = useRef<SceneId>(scene);
    useEffect(() => {
        if (scene === "neer" && flyFrom.current === "coins26") setFly(f => f + 1);
        flyFrom.current = scene;
    }, [ scene ]);
    const flight = (() => {
        if (!fly || scene !== "neer" || !CF || !C || C.unit !== "cost") return null;
        const coin = COINS.find(c => c.code === "USD"), end = ends.find(e => e.l === "usd");
        if (!coin || !end) return null;
        const w = CF.chart.x1 - CF.chart.x0, h = CF.chart.y1 - CF.chart.y0, k = Math.min(w / 800, h / VIEW_H);
        const sx = CF.chart.x0 + (w - 800 * k) / 2 + coin.x * k, sy = CF.chart.y0 + (h - VIEW_H * k) / 2 + (coin.y - VIEW_TOP) * k;
        return { sx, sy, ex : CF.chart.x1 + 22, ey : end.y + 2, size : 2 * coin.r * k };
    })();

    // How high each event's name sits above its mark: 40px, raised in steps until its box (it ends at the mark and runs
    // left, about 6.6px a character at 12px) clears every name placed before it.
    const eventLifts = useMemo(() => {
        if (!cfg || !CF || CF.mobile) return sceneEvents.map(() => 26);
        const boxes : [ number, number, number, number ][] = [];
        return sceneEvents.map(ev => {
            const line : Line = ev.chart === "neer" ? "usd" : ev.chart;
            const m = iOf(ev.month), x = xAt(cfg, CF, m), y = yAt(cfg, CF, valueOf(cfg, line)[m]), w = ev.label.length * 6.6 + 8;
            let lift = 40;
            const box = (l : number) : [ number, number, number, number ] => [ x - w, y - l - 16, x, y - l + 2 ];
            while (boxes.some(b => { const a = box(lift); return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }) && lift < 200) lift += 22;
            boxes.push(box(lift));
            return lift;
        });
    }, [ sceneEvents, cfg, CF?.chart.x0, CF?.chart.x1, CF?.chart.y0, CF?.chart.y1, CF?.mobile ]); // eslint-disable-line react-hooks/exhaustive-deps

    const years = C ? Array.from(new Set(MONTHS.slice(C.from).map(m => +m.slice(0, 4)))).filter(yr => C.swing || yr % 5 === 0) : [];
    const peakM = iOf(HEADLINE.swing.peakMonth), troughM = iOf(HEADLINE.swing.troughMonth);
    // the reader's guess, a price where 2004 is 100, on the same scale as the real rate's line
    const showGuess = !!C && C.guess && guess !== null && !!cfg?.guess;
    const guessLevel = guess ?? 0;

    return (
        <div ref={wrapRef} className={`rupee-stage scene-${scene}`} onPointerMove={onPointer} onPointerLeave={onLeave} role="img" aria-label={DESCRIBE[scene]}>
            <canvas ref={canvasRef} />

            {/* THE BASKET OF CURRENCIES, BOUGHT IN 2004 AND IN 2026 */}
            {F && <CoinBasket scene={scene} box={F.chart} />}
            {F && <PriceScale scene={scene} box={F.chart} />}
            {/* the currency constellation, twice: in rupees after the basket's chart, turned to prices after the answer */}
            {F && (
                <div className={`coin-scene orbit-scene ${scene === "orbit" || scene === "orbitReal" ? "is-on" : ""}`}
                    style={{ left : F.chart.x0, top : Math.max(8, F.chart.y0 - 60), width : F.chart.x1 - F.chart.x0 + 120, height : F.chart.y1 - F.chart.y0 + 110 }}>
                    <Constellation active={scene === "orbit" || scene === "orbitReal"} realView={scene === "orbitReal"} />
                </div>
            )}

            {/* THE BASKET'S KEY */}
            {F && (
                <div className={`stage-layer globe-key ${scene === "basket" ? "is-on" : ""}`} style={{ left : F.mobile ? 16 : 24, top : F.mobile ? 12 : 24 }}>
                    <p>A partner’s colour is deeper the more it weighs in the basket.</p>
                    <span className="key-ramp" style={{ background : `linear-gradient(to right, ${[ 8, 7, 6, 5, 4, 3 ].map((k, i) => `${cssOf(INDI[k])} ${(i * 100 / 6).toFixed(1)}% ${((i + 1) * 100 / 6).toFixed(1)}%`).join(", ")})` }} />
                    <span className="key-ends"><span>0.2%</span><span>{MAX_W.toFixed(1)}%</span></span>
                    <p className="key-arcs-title">An arc is as wide as the partner’s weight</p>
                    <svg className="key-arcs" width={230} height={66} aria-hidden="true">
                        {[ 1, 5, 10 ].map((wt, i) => {
                            const lw = arcWidth(wt, arcScale(F.globe.R)), y = 12 + i * 21;
                            return (
                                <g key={wt}>
                                    <line x1={4} x2={110} y1={y} y2={y} strokeWidth={lw} strokeLinecap="round" stroke={`url(#key-grad)`} />
                                    <text x={124} y={y + 4}>{`${wt}% of the basket`}</text>
                                </g>
                            );
                        })}
                        <defs>
                            <linearGradient id="key-grad" gradientUnits="userSpaceOnUse" x1={4} x2={110} y1={0} y2={0}>
                                <stop offset="0" stopColor="#864fe3" /><stop offset="1" stopColor="#864fe3" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            )}

            {/* THE CHART'S FURNITURE */}
            {C && CF && (
                <div className={`stage-layer ${cfg ? "is-on" : ""}`}>
                    <svg className="stage-svg" width={size.w} height={size.h}>
                        {C.band && (
                            <g className="band">
                                <rect x={CF.chart.x0} width={CF.chart.x1 - CF.chart.x0} y={yAt(C, CF, BAND.hi)} height={yAt(C, CF, BAND.lo) - yAt(C, CF, BAND.hi)} />
                            </g>
                        )}
                        {C.ticks.map(t => (
                            <g key={t} className={`stage-grid ${t === 100 && C.unit === "cost" ? "is-base" : ""}`}>
                                <line x1={CF.chart.x0} x2={CF.chart.x1} y1={yAt(C, CF, t)} y2={yAt(C, CF, t)} />
                                <text x={CF.chart.x0 - 10} y={yAt(C, CF, t) + 4} textAnchor="end">{C.unit === "inr" ? `₹${t}` : t}</text>
                            </g>
                        ))}
                        {years.map(yr => {
                            const m = MONTHS.indexOf(`${yr}-${C.swing ? "01" : "04"}`);
                            if (m < C.from) return null;
                            return <text key={yr} className="year" x={xAt(C, CF, m)} y={CF.chart.y1 + 24} textAnchor="middle">{yr}</text>;
                        })}
                        {showGuess && guess !== null && (
                            <g className="guess-level">
                                <line x1={CF.chart.x0} x2={CF.chart.x1} y1={yAt(C, CF, guessLevel)} y2={yAt(C, CF, guessLevel)} />
                                <text x={CF.chart.x0 + 8} y={yAt(C, CF, guessLevel) + 16}>{`your guess: the batch at ${guess} (it was 100 in ${MONTHS[0].slice(0, 4)})`}</text>
                            </g>
                        )}
                        {hoverMonth !== null && cfg && openEvent === null && (
                            <line className="crosshair" x1={xAt(cfg, CF, hoverMonth)} x2={xAt(cfg, CF, hoverMonth)} y1={CF.chart.y0 - 10} y2={CF.chart.y1} />
                        )}
                        {/* the dollar against the basket: the space between the two shaded by which cost more, where
                            they last crossed, and the gap now */}
                        {gapAreas && (
                            <g className="gap-areas">
                                {gapAreas.map((a, k) => <path key={k} d={a.d} className={!a.ahead ? "is-basket" : a.other === "usd" ? "is-dollar" : "is-prices"} />)}
                                {/* the two halves: the widest gap, and where the basket caught up */}
                                {gapAreas[0]?.other === "rel" && (
                                    <g className="gap-bracket">
                                        <path d={`M${xAt(C, CF, HALVES_PEAK)} ${yAt(C, CF, COST.rel[HALVES_PEAK])} V${yAt(C, CF, COST.neer[HALVES_PEAK])}`} strokeDasharray="3 3" />
                                        <circle cx={xAt(C, CF, HALVES_PEAK)} cy={yAt(C, CF, COST.rel[HALVES_PEAK])} r={4} className="gap-dot" />
                                        <circle cx={xAt(C, CF, HALVES_PEAK)} cy={yAt(C, CF, COST.neer[HALVES_PEAK])} r={4} className="gap-dot" />
                                        <text x={xAt(C, CF, HALVES_PEAK) - 10} y={yAt(C, CF, COST.rel[HALVES_PEAK]) - 14} textAnchor="end">
                                            {`${monthShort(MONTHS[HALVES_PEAK])}, widest gap: ${Math.round(COST.rel[HALVES_PEAK])} against ${Math.round(COST.neer[HALVES_PEAK])}`}
                                        </text>
                                        {/* where they meet: named below the lines, on a leader, clear of the shading */}
                                        {HALVES_MEET > 0 && (
                                            <g className="meet-mark">
                                                <line x1={xAt(C, CF, HALVES_MEET)} x2={xAt(C, CF, HALVES_MEET)} y1={yAt(C, CF, COST.neer[HALVES_MEET]) + 8} y2={yAt(C, CF, COST.neer[HALVES_MEET]) + 140} />
                                                <text x={xAt(C, CF, HALVES_MEET) + 4} y={yAt(C, CF, COST.neer[HALVES_MEET]) + 156} textAnchor="end">
                                                    {`${monthShort(MONTHS[HALVES_MEET])}: they meet`}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                )}
                                {gapAreas[0]?.other === "usd" && <>
                                {/* the gap: a bracket at the end, and its name inside the grey area about four years back, where it is wide */}
                                <g className="gap-bracket">
                                    <path d={`M${CF.chart.x1 + 4} ${yAt(C, CF, COST.usd[N - 1])} h4 V${yAt(C, CF, COST.neer[N - 1])} h-4`} />
                                    <text x={xAt(C, CF, N - 46)} y={(yAt(C, CF, COST.usd[N - 46]) + yAt(C, CF, COST.neer[N - 46])) / 2 + 4} textAnchor="middle">
                                        {`the dollar’s own rise: ${Math.round(DOLLAR_GAP)}%`}
                                    </text>
                                </g>
                                </>}
                            </g>
                        )}
                        {C.swing && (
                            <g className="swing-marks">
                                {/* the batch of shoes at the swing's two ends, on the same scale as the pop quiz */}
                                {[ { m : peakM, v : COST.reer[peakM], label : `👞 ${monthShort(HEADLINE.swing.peakMonth)}: the shoes at ${Math.round(COST.reer[peakM])}, the high` },
                                    { m : troughM, v : COST.reer[troughM], label : `👞 ${monthShort(HEADLINE.swing.troughMonth)}: back to ${Math.round(COST.reer[troughM])}` } ].map((p, i) => (
                                    <g key={p.m}>
                                        <circle cx={xAt(C, CF, p.m)} cy={yAt(C, CF, p.v)} r={7} />
                                        <text x={xAt(C, CF, p.m)} y={yAt(C, CF, p.v) + (i === 0 ? -16 : 26)} textAnchor="middle">{p.label}</text>
                                    </g>
                                ))}
                            </g>
                        )}
                    </svg>
                    <div className="axis-title" style={{ left : CF.chart.x0 - 4, top : CF.chart.y0 - (C.key ? 64 : 44) }}>
                        <strong>{`Monthly, ${monthName(MONTHS[C.from])} to ${monthName(MONTHS[N - 1])}.`}</strong>{" "}
                        {C.unit === "inr" ? "The average number of rupees paid for one US dollar."
                            : `Prices in April 2004 = 100 (the dashed line).${C.band ? " The shaded band is the range this price stayed in." : ""}`}
                        {C.key && <span className="axis-key">{C.key}</span>}
                    </div>
                    {ends.map(e => (
                        <div key={e.l} className="end-label" style={{ transform : `translate(${CF.chart.x1 + 12}px, ${e.y - 10}px)`, color : cssOf(pal.line[e.l]) }}>
                            <span className="end-value">
                                {C.unit === "cost" && e.l === "usd" && cfg?.unit === "cost" && <span className="coin-badge" aria-hidden="true">$</span>}
                                {C.unit === "cost" && e.l === "neer" && <span className="basket-badge" aria-hidden="true">🧺</span>}
                                {fmt(C, e.v, e.l)}
                            </span>
                            <span className="end-name">{labelOf(C, e.l)}</span>
                        </div>
                    ))}
                    {/* The events behind the sharpest moves, on the dollar chart: a numbered mark on the line, a short name
                        above it, and on pointing (or a tap) a note with its RBI or Government source. */}
                    {cfg && sceneEvents.map((ev, k) => {
                        const lift = eventLifts[k];
                        // an event sits on its own line; the basket's chart marks where the dollar line crosses it
                        const line : Line = ev.chart === "neer" ? "usd" : ev.chart;
                        const m = iOf(ev.month), x = xAt(cfg, CF, m), y = yAt(cfg, CF, valueOf(cfg, line)[m]);
                        // The line rises from left to right, so the space above and to its left is empty: each name sits
                        // there, ending at its stem, at one of two heights so neighbours do not touch. A note opens
                        // downward from a mark in the upper half of the chart, and leftward from one in the right half.
                        const right = x > (CF.chart.x0 + CF.chart.x1) / 2;
                        const high = y < (CF.chart.y0 + CF.chart.y1) / 2, isOpen = openEvent === k;
                        return (
                            <div key={`${ev.month}-${intro.run}`} className={`event ${isOpen ? "is-open" : ""} ${right ? "is-right" : ""} ${high ? "is-high" : ""}`}
                                style={{ transform : `translate(${x}px, ${y}px)`, "--d" : `${(intro.wait + k * 0.45).toFixed(2)}s` } as React.CSSProperties}
                                onPointerEnter={() => showEvent(k)} onPointerLeave={() => showEvent(null)}>
                                <span className="event-stem" style={{ height : lift }} />
                                <button type="button" className="event-mark" aria-expanded={isOpen} aria-label={`${ev.label}, ${monthName(ev.month)}`}
                                    onClick={() => setOpenEvent(o => (o === k ? null : k))} onFocus={() => showEvent(k)} onBlur={() => showEvent(null)}>{sceneEvents.length > 1 ? k + 1 : "i"}</button>
                                {!CF.mobile && <span className="event-label" style={{ bottom : lift - 2 }}>{ev.label}</span>}
                                {isOpen && (
                                    <div className="event-note" role="note" style={high ? { top : 18 } : { bottom : lift + 22 }}>
                                        <strong>{monthName(ev.month)} · {ev.label}</strong>
                                        <span>{ev.note}</span>
                                        <a href={ev.url} target="_blank" rel="noopener">{ev.source} ↗</a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {/* where each line starts, so its change reads without the axis (below the dollar line, whose space
                        above holds the events' names) */}
                    {starts.map(st => (
                        <div key={st.l} className="start-label" style={{ transform : `translate(${xAt(C, CF, C.from) - 4}px, ${st.y}px)`, color : st.shared ? "var(--heading-text-colour)" : cssOf(pal.line[st.l]) }}>
                            {st.shared ? Math.round(st.v) : fmt(C, st.v, st.l)}<span>{st.shared ? `both, ${monthShort(MONTHS[C.from])}` : monthShort(MONTHS[C.from])}</span>
                        </div>
                    ))}
                </div>
            )}

            {flight && (
                <div key={fly} className="dollar-fly" aria-hidden="true"
                    style={{ "--sx" : `${flight.sx}px`, "--sy" : `${flight.sy}px`, "--ex" : `${flight.ex}px`, "--ey" : `${flight.ey}px`, "--size" : `${flight.size}px` } as React.CSSProperties}>$</div>
            )}

            {tip && openEvent === null && (
                <div className="stage-tip" style={{ transform : `translate(${Math.min(tip.x + 14, size.w - 250)}px, ${Math.max(8, tip.y - 70)}px)` }}>
                    <strong>{tip.head}</strong>
                    {tip.lines.map(l => <span key={l}>{l}</span>)}
                </div>
            )}
        </div>
    );
};

// WHAT EACH SCENE SAYS TO A SCREEN READER =============================================================================
const DESCRIBE : Record<SceneId, string> = {
    hero    : "A globe, India and the 40 trading partners in the rupee’s basket joined to it by arcs.",
    basket  : "A globe on which each trading partner is shaded by its weight in the basket.",
    dollar  : "A line, month by month from April 2004, of the rupees paid for one US dollar, rising from ₹43.93 to ₹95.82, with numbered events.",
    coins   : "A basket of 40 coins, one for each partner’s currency, sized by its weight; a ₹100 note pays for it in April 2004.",
    coins26 : "The same basket in July 2026: a ₹100 note, a ₹50 note and three ₹10 notes pay for it, with ₹2 back.",
    halves  : "India’s prices against its partners’ and the basket’s price together: prices ran ahead from 2013, widest in November 2024, and the two meet again in 2026.",
    neer    : "The basket’s price, month by month, from ₹100 to ₹178, beside dollars that were worth ₹100 in April 2004, now ₹218; the basket cost more until late 2014, the dollars since.",
    orbit   : "The currency constellation: the rupee at the centre, every currency as far from it as it costs in rupees, from the dashed ring at 100 in April 2004; played month by month to July 2026.",
    orbitReal : "The same constellation, adjusted for prices: the basket's ring settles back on the dashed ring, at 101.",
    scale   : "A balance scale with the same goods on both pans, India’s prices on one and its partners’ on the other, level at 100 in April 2004; in July 2026 India’s side sinks, its tag at 179.",
    prices  : "India’s prices against its partners’, month by month, rising from 100 to 179.",
    guess   : "India’s prices against its partners’, as before.",
    reer    : "What Indian goods cost abroad, from 100 to 101, inside a narrow band, with the two lines it divides faint behind it.",
    swing   : "What Indian goods cost abroad since 2022: up to a high in November 2024 and back by May 2026.",
};

export default RupeeStage;
