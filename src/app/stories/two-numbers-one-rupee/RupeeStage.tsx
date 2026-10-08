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
import { resolveScheme } from "@/components/charts/chartConfig";
import { fictoanColour } from "@/lib/fictoan-colours";

// DATA ================================================================================================================
import { BAND, HEADLINE, MONTHS, N, PARTNERS, REBASED, SERIES, type Line, iOf, monthName, monthShort } from "./data";

// THE SCENES ==========================================================================================================
export type SceneId = "hero" | "basket" | "dollar" | "guess" | "neer" | "prices" | "reer" | "swing";
const isGlobe = (s : SceneId) => s === "hero" || s === "basket";

const LINE_KEYS : Line[] = [ "usd", "neer", "rel", "reer" ];
export const LINE_LABEL : Record<Line, string> = {
    usd  : "In US dollars",
    neer : "Against 40 currencies",
    rel  : "India’s prices against partners’",
    reer : "Real rate",
};

// What each chart scene shows: the lines at full strength, those left faint, the first month framed and the scale.
interface ChartCfg { on : Line[]; faint : Line[]; from : number; lo : number; hi : number; ticks : number[]; band : boolean; swing : boolean; guess : boolean }
const WIDE = { from : 0, lo : 35, hi : 190, ticks : [ 50, 100, 150 ] };
const SWING_FROM = Math.max(0, iOf("2022-04"));
const CHART : Partial<Record<SceneId, ChartCfg>> = {
    dollar : { on : [ "usd" ],         faint : [],                ...WIDE, band : false, swing : false, guess : false },
    guess  : { on : [ "usd" ],         faint : [],                ...WIDE, band : false, swing : false, guess : true },
    neer   : { on : [ "usd", "neer" ], faint : [],                ...WIDE, band : false, swing : false, guess : true },
    prices : { on : [ "neer", "rel" ], faint : [ "usd" ],         ...WIDE, band : false, swing : false, guess : true },
    reer   : { on : [ "reer" ],        faint : [ "neer", "rel" ], ...WIDE, band : true,  swing : false, guess : true },
    swing  : { on : [ "reer" ],        faint : [],                from : SWING_FROM, lo : 90, hi : 124, ticks : [ 100, 110, 120 ], band : true, swing : true, guess : false },
};

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
    const get = (f : string) => fetch(`/stories/two-numbers-one-rupee/${f}`).then(r => r.json() as Promise<FeatureCollection<Geometry, Props>>);
    const [ world, india ] = await Promise.all([ get("world-countries.geojson"), get("india-soi.geojson") ]);
    const countries : Country[] = [ ...world.features.filter(f => f.properties.iso !== "IND"), ...india.features ].map(f => {
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
    const host = typeof document !== "undefined" ? document.getElementById("two-numbers-page") : null;
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
export const palette = (theme : string, fromPage = true) : Pal => {
    const dark = theme === "theme-dark";
    const s = resolveScheme("line", undefined, theme);
    const emph = rgbOf(s.emphasis), cool = rgbOf(s.positive), warm = rgbOf(s.negative);
    const accent = fromPage ? pageRGB("--accent", ACCENT_LIGHT) : ACCENT_LIGHT;
    const paper = fromPage ? pageRGB("--fig-bg", [ 255, 255, 255 ]) : [ 255, 255, 255 ] as RGB;
    const head = fromPage ? pageRGB("--heading-text-colour", [ 40, 40, 40 ]) : [ 40, 40, 40 ] as RGB;
    return {
        field : rgbOf(fictoanColour("grey", dark ? "dark30" : "light50")),
        faint : rgbOf(fictoanColour("grey", dark ? "dark60" : "light80")),
        emph, warm, ink : rgbOf(s.ink.primary), paper, head,
        line  : { usd : rgbOf(s.ink.secondary), neer : cool, rel : warm, reer : accent },
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
    const card = mobile ? 0 : Math.min(420, 0.34 * w) + 56;
    const chart = mobile
        ? { x0 : 40, x1 : w - 100, y0 : h * 0.1, y1 : h * 0.46 }
        : { x0 : Math.max(64, w * 0.05), x1 : w - card - 150, y0 : h * 0.17, y1 : h * 0.83 };
    let globe;
    if (scene === "hero") {
        // a planet rising behind the title: wider than the screen, its horizon in the upper third
        const R = Math.max(w * 0.62, h * 0.95);
        globe = { cx : w / 2, cy : h * 0.42 + R * 0.72, R, alpha : 0.9 };
    } else if (scene === "basket") {
        const room = mobile ? w : w - card;
        const R = mobile ? Math.min(w * 0.4, h * 0.16) : Math.min(room * 0.36, h * 0.37);
        globe = { cx : mobile ? w / 2 : room / 2 + 16, cy : mobile ? h * 0.19 : h * 0.5, R, alpha : 1 };
    } else {
        globe = { cx : (chart.x0 + chart.x1) / 2, cy : (chart.y0 + chart.y1) / 2, R : Math.min(chart.x1 - chart.x0, chart.y1 - chart.y0) * 0.45, alpha : 0 };
    }
    return { mobile, globe, chart };
};
const xAt = (cfg : ChartCfg, f : Frame, m : number) => f.chart.x0 + (f.chart.x1 - f.chart.x0) * (m - cfg.from) / (N - 1 - cfg.from);
const yAt = (cfg : ChartCfg, f : Frame, v : number) => f.chart.y1 - (f.chart.y1 - f.chart.y0) * (v - cfg.lo) / (cfg.hi - cfg.lo);

// Where to turn the globe for a set of partners: halfway between India and the weighted mean of their capitals, so
// both ends of their arcs face the reader (the Americas lie almost opposite India).
const facing = (codes : string[]) : [ number, number ] => {
    const ilo = DELHI[0] * Math.PI / 180, ila = DELHI[1] * Math.PI / 180, wsum = codes.reduce((t, c) => t + (WEIGHT[c] ?? 1), 0);
    let x = wsum * Math.cos(ila) * Math.cos(ilo), y = wsum * Math.cos(ila) * Math.sin(ilo), z = wsum * Math.sin(ila);
    for (const c of codes) {
        const p = PLACE[c]; if (!p) continue;
        const w = WEIGHT[c] ?? 1, lo = p[0] * Math.PI / 180, la = p[1] * Math.PI / 180;
        x += w * Math.cos(la) * Math.cos(lo); y += w * Math.cos(la) * Math.sin(lo); z += w * Math.sin(la);
    }
    return [ Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI ];
};

const ease = (t : number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2, RAD = Math.PI / 180;

// THE STAGE ===========================================================================================================
interface Tip { x : number; y : number; head : string; lines : string[] }
interface StageProps {
    scene : SceneId;
    focus : string[] | null;        // partners picked out from the text: a region's or one country's codes
    guess : number | null;          // the reader's guess, per cent cheaper, drawn as a level on the chart
}

export const RupeeStage = ({ scene, focus, guess } : StageProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const [ land, setLand ] = useState<Land | null>(null);
    const [ tip, setTip ] = useState<Tip | null>(null);
    const [ hoverCode, setHoverCode ] = useState<string | null>(null);
    const [ hoverMonth, setHoverMonth ] = useState<number | null>(null);
    const pal = usePalette();
    const hitRef = useRef<((x : number, y : number) => { code : string | null; iso : string | null; name : string } | null) | null>(null);

    // What the frame loop reads; React writes it, the loop never re-renders.
    const live = useRef({ scene, focus : null as string[] | null, pal, w : 0, h : 0 });
    const lit = focus ?? (hoverCode ? [ hoverCode ] : null);
    live.current.scene = scene; live.current.focus = lit; live.current.pal = pal;

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

        const loop = (now : number) => {
            raf = 0;
            if (!visible) return;
            const dt = Math.min(0.1, (now - last) / 1000); last = now;
            const { scene : sc, focus : fo, pal : P, w, h } = live.current;
            if (!w) { raf = requestAnimationFrame(loop); return; }
            const F = frameOf(sc, w, h), cfg = CHART[sc];

            // the globe's place and turn, eased
            const k = reduced || first ? 1 : 1 - Math.exp(-dt / 0.28);
            g.cx += (F.globe.cx - g.cx) * k; g.cy += (F.globe.cy - g.cy) * k; g.R += (F.globe.R - g.R) * k;
            g.alpha += (F.globe.alpha - g.alpha) * (reduced || first ? 1 : 1 - Math.exp(-dt / 0.3));
            let lamT = g.lam, phiT = sc === "hero" ? 4 : 18;
            if (sc === "hero") {
                if (!reduced) swingPhase += dt * SWING_RATE;
                // the swing that takes India to 40% of the width either side of the centre
                const reach = Math.min(0.95, 0.4 * w / (F.globe.R * Math.cos(DELHI[1] * RAD)));
                lamT = DELHI[0] + Math.asin(reach) / RAD * Math.sin(swingPhase);
            }
            else if (sc === "basket") { if (fo?.length) [ lamT, phiT ] = facing(fo); else lamT = 62; phiT = Math.max(-25, Math.min(40, phiT)); }
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
                    if (toChart && (shown === null || isGlobe(shown))) { delay = 0.05 + 1.1 * (s % N) / N + seed[i] * 0.15; d = 1.0; }
                    else if (cfg && shown && !isGlobe(shown)) { delay = seed[i] * 0.12; d = 0.8; }
                    else if (!cfg && shown && !isGlobe(shown)) { delay = seed[i] * 0.45; d = 1.1; }   // a chart back into the globe
                    dur[i] = reduced || first || resize ? 0 : d;
                    b[i] = reduced || first || resize ? 1 : -delay / d;
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
                    tx[i] = xAt(cfg, F, m); ty[i] = yAt(cfg, F, REBASED[line][m]);
                    const inView = m >= cfg.from;
                    ta = inView ? (cfg.on.includes(line) ? 1 : 0.22) : 0; tr = rLine; tc = P.line[line];
                } else if (cfg) {
                    tx[i] = fx[i]; ty[i] = fy[i] + 24; ta = 0; tr = rGlobe; tc = P.field;
                } else {
                    tx[i] = gx; ty[i] = gy;
                    const c = land.countries[land.country[i]];
                    const vis = Math.max(0, Math.min(1, (depth + 0.02) / 0.18));
                    if (c.iso === "IND") { tc = P.warm; ta = vis; }
                    else if (c.code) {
                        const wgt = 0.3 + 0.7 * Math.sqrt((WEIGHT[c.code] ?? 0) / MAX_W);
                        const on = !focusSet || focusSet.has(c.code);
                        tc = on ? mix(P.field, P.emph, wgt) : P.field; ta = vis * (on ? 1 : 0.55);
                    } else { tc = P.field; ta = vis * (focusSet ? 0.45 : 0.7); }
                    ta *= g.alpha; tr = rGlobe;
                }
                // position: eased from where the scene began; colour, size and alpha: smoothed toward the target
                if (b[i] < 1) b[i] = Math.min(1, b[i] + (dur[i] > 0 ? dt / dur[i] : 1));
                const e = ease(Math.max(0, b[i]));
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
                const grad = ctx.createRadialGradient(g.cx - g.R * 0.35, g.cy - g.R * 0.4, g.R * 0.05, g.cx, g.cy, g.R);
                grad.addColorStop(0, rgba(P.emph, 0.035)); grad.addColorStop(1, rgba(P.emph, 0.1));
                ctx.fillStyle = grad; ctx.fill();
                ctx.strokeStyle = rgba(P.field, 0.55); ctx.lineWidth = 0.8; ctx.stroke();
                ctx.beginPath(); path(grat); ctx.strokeStyle = rgba(P.field, 0.16); ctx.lineWidth = 0.5; ctx.stroke();
                if (focusSet) {
                    ctx.beginPath();
                    for (const c of land.countries) if (c.code && focusSet.has(c.code)) path(c.feature);
                    ctx.fillStyle = rgba(P.emph, 0.16); ctx.fill();
                }
                ctx.beginPath();
                for (const c of land.countries) path(c.feature);
                ctx.strokeStyle = rgba(P.field, 0.5); ctx.lineWidth = 0.5; ctx.stroke();
                ctx.beginPath();
                for (const c of land.countries) if (c.iso === "IND") path(c.feature);
                ctx.strokeStyle = rgba(P.warm, 0.9); ctx.lineWidth = 0.9; ctx.stroke();
                ctx.restore();
            }

            // in a chart, a hairline through each line's months, so the dots read as a line; it follows the dots
            const hair = cfg ? Math.max(0, Math.min(1, (now - lineFrom) / 500)) : 0;
            if (cfg && hair > 0) {
                ctx.lineWidth = 1; ctx.lineJoin = "round";
                for (let s = 0; s < 4; s++) {
                    const line = LINE_KEYS[s];
                    const strength = hair * (cfg.on.includes(line) ? 0.45 : cfg.faint.includes(line) ? 0.12 : 0);
                    if (!strength) continue;
                    ctx.beginPath();
                    let started = false;
                    for (let m = cfg.from; m < N; m++) {
                        const i = dotOf[s * N + m];
                        if (a[i] < 0.05) { started = false; continue; }
                        if (started) ctx.lineTo(x[i], y[i]); else { ctx.moveTo(x[i], y[i]); started = true; }
                    }
                    ctx.strokeStyle = rgba(P.line[line], strength);
                    ctx.stroke();
                }
            }

            // the dots, batched by colour
            const buckets = new Map<string, number[]>();
            for (let i = 0; i < L; i++) {
                if (a[i] < 0.02) continue;
                const key = `${cr[i] | 0},${cg[i] | 0},${cb[i] | 0},${Math.round(a[i] * 20) / 20}`;
                const list = buckets.get(key);
                if (list) list.push(i); else buckets.set(key, [ i ]);
            }
            for (const [ key, list ] of buckets) {
                ctx.fillStyle = `rgba(${key})`;
                ctx.beginPath();
                for (const i of list) { ctx.moveTo(x[i] + r[i], y[i]); ctx.arc(x[i], y[i], r[i], 0, TAU); }
                ctx.fill();
            }

            // the arcs from India to each partner, lifted off the surface, with a bead running out along each
            if (g.alpha > 0.01) {
                ctx.save();
                const scale = arcScale(g.R);
                const low = sc === "hero";               // behind the title the arcs fly lower
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
                    const al = g.alpha * (on ? (focusSet ? 0.95 : 0.55) : 0.08);
                    // a ribbon as wide as the partner's weight, its colour running from India's to the partners'
                    const width = arcWidth(arc.weight, scale);
                    const from = P.warm, to = focusSet && on ? P.warm : P.emph;
                    ctx.lineWidth = width; ctx.lineCap = "round";
                    const K = 36, h0 = 0.06 + (low ? 0.08 : 0.2) * arc.dist / Math.PI;
                    let prev : { x : number; y : number; vis : boolean } | null = null;
                    for (let j = 0; j <= K; j++) {
                        const t = j / K, [ lo, la ] = arc.at(t), q = sp(lo, la, 1 + h0 * Math.sin(Math.PI * t));
                        if (prev && prev.vis && q.vis) {
                            ctx.strokeStyle = rgba(mix(from, to, Math.min(1, t * 1.6)), al);
                            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                        }
                        prev = q;
                    }
                    const end = sp(arc.end[0], arc.end[1], 1);
                    if (end.vis) {
                        ctx.fillStyle = rgba(focusSet && on ? P.warm : P.emph, Math.min(1, al * 1.6));
                        ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(2, width * 0.75), 0, TAU); ctx.fill();
                    }
                    if (!reduced && on) {
                        const t = ((now * 0.00011 * (1 + 0.05 * arc.weight)) + k2 * 0.137) % 1, [ lo, la ] = arc.at(t);
                        const q = sp(lo, la, 1 + h0 * Math.sin(Math.PI * t));
                        if (q.vis) {
                            ctx.fillStyle = rgba(P.warm, g.alpha * Math.sin(Math.PI * t));
                            ctx.beginPath(); ctx.arc(q.x, q.y, 1.8 * scale, 0, TAU); ctx.fill();
                        }
                    }
                }
                const india = sp(DELHI[0], DELHI[1], 1);
                if (india.vis) {
                    const pulse = reduced ? 0.5 : (now * 0.0006) % 1;
                    ctx.strokeStyle = rgba(P.warm, g.alpha * (1 - pulse)); ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.arc(india.x, india.y, (3 + 14 * pulse) * scale, 0, TAU); ctx.stroke();
                    ctx.fillStyle = rgba(P.warm, g.alpha);
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
                        ctx.strokeStyle = rgba(P.paper, 0.9 * fade); ctx.lineWidth = 3.5; ctx.strokeText(text, lx, ly);
                        ctx.fillStyle = rgba(P.head, fade); ctx.fillText(text, lx, ly);
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
            if (!hit) { setTip(null); setHoverCode(null); return; }
            setHoverCode(hit.code);
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
                lines : cfg.on.map(l => `${LINE_LABEL[l]}: ${REBASED[l][m].toFixed(1)}`)
                    .concat(cfg.on.includes("reer") ? [ `RBI’s own index (2015-16 = 100): ${SERIES.reer40t[m].toFixed(1)}` ] : []),
            });
            return;
        }
        setTip(null); setHoverMonth(null);
    };
    const onLeave = () => { setTip(null); setHoverCode(null); setHoverMonth(null); };

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
        const ls = [ ...C.on ].map(l => ({ l, v : REBASED[l][N - 1], y : yAt(C, CF, REBASED[l][N - 1]) })).sort((p, q) => p.y - q.y);
        for (let i = 1; i < ls.length; i++) if (ls[i].y - ls[i - 1].y < 40) ls[i].y = ls[i - 1].y + 40;
        return ls;
    }, [ C, CF?.chart.y0, CF?.chart.y1 ]); // eslint-disable-line react-hooks/exhaustive-deps

    const years = C ? Array.from(new Set(MONTHS.slice(C.from).map(m => +m.slice(0, 4)))).filter(yr => C.swing || yr % 5 === 0) : [];
    const peakM = iOf(HEADLINE.swing.peakMonth), troughM = iOf(HEADLINE.swing.troughMonth);
    const showGuess = !!C && C.guess && guess !== null && (scene === "guess" || (!!cfg && cfg.guess));

    return (
        <div ref={wrapRef} className={`rupee-stage scene-${scene}`} onPointerMove={onPointer} onPointerLeave={onLeave} role="img" aria-label={DESCRIBE[scene]}>
            <canvas ref={canvasRef} />

            {/* THE BASKET'S KEY */}
            {F && (
                <div className={`stage-layer globe-key ${scene === "basket" ? "is-on" : ""}`} style={{ left : F.mobile ? 16 : 24, top : F.mobile ? 12 : 24 }}>
                    <p>Each dot is land. A partner’s dots are deeper the more it weighs in the basket.</p>
                    <span className="key-ramp" style={{ background : `linear-gradient(to right, ${cssOf(mix(pal.field, pal.emph, 0.3))}, ${cssOf(pal.emph)})` }} />
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
                                <stop offset="0" stopColor={cssOf(pal.warm)} /><stop offset="0.62" stopColor={cssOf(pal.emph)} />
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
                            <g key={t} className={`stage-grid ${t === 100 ? "is-base" : ""}`}>
                                <line x1={CF.chart.x0} x2={CF.chart.x1} y1={yAt(C, CF, t)} y2={yAt(C, CF, t)} />
                                <text x={CF.chart.x0 - 10} y={yAt(C, CF, t) + 4} textAnchor="end">{t}</text>
                            </g>
                        ))}
                        {years.map(yr => {
                            const m = MONTHS.indexOf(`${yr}-${C.swing ? "01" : "04"}`);
                            if (m < C.from) return null;
                            return <text key={yr} className="year" x={xAt(C, CF, m)} y={CF.chart.y1 + 24} textAnchor="middle">{yr}</text>;
                        })}
                        {showGuess && guess !== null && (
                            <g className="guess-level">
                                <line x1={CF.chart.x0} x2={CF.chart.x1} y1={yAt(C, CF, 100 - guess)} y2={yAt(C, CF, 100 - guess)} />
                                <text x={CF.chart.x0 + 8} y={yAt(C, CF, 100 - guess) + 16}>{`your guess: ${guess}% cheaper`}</text>
                            </g>
                        )}
                        {hoverMonth !== null && cfg && (
                            <line className="crosshair" x1={xAt(cfg, CF, hoverMonth)} x2={xAt(cfg, CF, hoverMonth)} y1={CF.chart.y0 - 10} y2={CF.chart.y1} />
                        )}
                        {C.swing && (
                            <g className="swing-marks">
                                {[ { m : peakM, v : REBASED.reer[peakM], label : `${monthShort(HEADLINE.swing.peakMonth)}: the high` },
                                    { m : troughM, v : REBASED.reer[troughM], label : `${monthShort(HEADLINE.swing.troughMonth)}: ${HEADLINE.swing.fall.toFixed(1)}% lower` } ].map((p, i) => (
                                    <g key={p.m}>
                                        <circle cx={xAt(C, CF, p.m)} cy={yAt(C, CF, p.v)} r={7} />
                                        <text x={xAt(C, CF, p.m)} y={yAt(C, CF, p.v) + (i === 0 ? -16 : 26)} textAnchor="middle">{p.label}</text>
                                    </g>
                                ))}
                            </g>
                        )}
                    </svg>
                    <div className="axis-title" style={{ left : CF.chart.x0 - 4, top : CF.chart.y0 - 44 }}>
                        <strong>Each dot is a month.</strong> April 2004 = 100{C.band ? "; the shaded band is the range the real rate stayed in" : ""}
                    </div>
                    {ends.map(e => (
                        <div key={e.l} className="end-label" style={{ transform : `translate(${CF.chart.x1 + 12}px, ${e.y - 10}px)`, color : cssOf(pal.line[e.l]) }}>
                            <span className="end-value">{e.v.toFixed(0)}</span>
                            <span className="end-name">{LINE_LABEL[e.l]}</span>
                        </div>
                    ))}
                </div>
            )}

            {tip && (
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
    hero   : "A globe of dots, India and the 40 trading partners in the rupee’s basket joined to it by arcs.",
    basket : "A globe on which each trading partner is shaded by its weight in the basket.",
    dollar : "A line of dots, one a month from April 2004, of what a rupee buys in US dollars, falling to less than half.",
    guess  : "The same line, with the reader’s guess drawn across the chart.",
    neer   : "A second line, the rupee against 40 currencies, falls less far than the dollar line.",
    prices : "A third line, India’s prices against its partners’, rises as the nominal line falls.",
    reer   : "The real rate, the nominal rate and prices together, stays inside a narrow band near where it began.",
    swing  : "The real rate since 2022: it rose to a high in November 2024 and fell back by May 2026.",
};

export default RupeeStage;
