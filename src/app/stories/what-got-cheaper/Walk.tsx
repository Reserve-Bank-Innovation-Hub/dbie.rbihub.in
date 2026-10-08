"use client";

// The walk: a porter carries each good in WALKS along its own price line, from the base year to the last month, and
// the lines he leaves behind become the chart: per cent above or below 2011-12 on a linear axis, a line that ends
// dearer in the warm pole, one that ends cheaper in the cool pole, the basket in ink, each ending in its glyph, name
// and figure. Scroll progress through the section is the only clock: every mark is a pure function of it, so a reader
// who stops sees a still picture and scrolling back rewinds everything. Scroll changes write to refs only; React state
// holds the discrete stage, the chosen chips and the hovered line.
//
// Every drawn line is the index averaged over the twelve months to each month (smooth12), and the porter's feet, the
// camera, the readout, the end labels and the spike markers all read that average; the captions name single months
// and read the raw series. Each line starts at the base year's average, ₹100 by construction, plotted at the middle
// of 2011-12 (six and a half months before April 2012), so every line leaves the same 0% origin.

// REACT CORE ==========================================================================================================
import { CSSProperties, useLayoutEffect, useMemo, useRef, useState } from "react";

// ANIMATION ===========================================================================================================
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

// LOCAL ===============================================================================================================
import { ALL, COUNTS, HEADLINE, MONTHS, RISERS, followedNamed, inr, itemOfFollowed, list, monthName, numberWord, rs, shortMonth } from "./data";
import { EASE } from "./chartKit";
import { GLYPH_OF, Glyph, GlyphPaths, type GlyphName } from "./glyphs";
import { useSize } from "./useSize";

// WHAT IS WALKED ======================================================================================================
// The walks in order, by the story's names for the followed goods; "ALL" is the basket as a whole.
export const WALKS = [
    "Colour TVs", "Anti-cancer drugs", "Blankets", "Solar power systems", "Wheat", "Silver", "Coconuts", "Tomatoes", "Jasmine", "ALL",
] as const;

// The chips of the finished chart, each adding other followed goods as grey lines.
export const PRESETS : { label : string; names : string[] }[] = [
    { label : "Everyday food", names : [ "Milk", "Rice", "Eggs", "Sugar", "Tea", "Potatoes", "Onions" ] },
    { label : "Fuel and power", names : [ "Petrol", "Diesel", "LPG", "Electricity", "Kerosene" ] },
    { label : "Factory goods", names : [ "Cement", "Urea", "Cotton yarn", "Shirts", "Motorcycles", "Bicycles", "Air conditioners", "Refrigerators", "Telephones and mobile handsets" ] },
    { label : "What rose most", names : [ "Gold and ornaments", "Kerosene", "Onions", "Potatoes" ] },
];

// THE TIMELINE ========================================================================================================
// In screens of the section's height: half a screen of poster, 1.25 screens a walk, one screen of the finished chart.
const POSTER = 0.5, PER = 1.25, HOLD = 1;
const TOTAL = POSTER + WALKS.length * PER + HOLD;
const ARRIVE = 0.9;                 // share of a walk spent walking; for the rest he stands at the line's end
const FADE = 0.04;                  // share of a walk over which he fades in at the origin and out at the end
const RAMP = 0.1;                   // share of the walking spent starting and stopping
const CLIMB = 60;                   // points of rise or fall that take as much scroll as one month of level walking
const CUE_OUT = 0.15;               // the cue fades over this much of the poster
const FINISHED = 2 * WALKS.length + 1;

// THE AXES ============================================================================================================
const Y_MIN = -60, Y_MAX = 350, GRID = 50;  // per cent against the base year
const KN = MONTHS.length - 1;               // the last month, April 2026
const K0 = -6.5;                            // the base year's average, at the middle of 2011-12 in months from April 2012
const FOOT_SNAP = 3;                        // the feet follow the smoothed line to within this many pixels of the drawn one
const CARD_STACKED = 176;                   // the height the caption card keeps when it stacks above the plot
const CARD_W = 380, CARD_H = 200;           // the card over the plot's top left on a wide screen, at its tallest

// HELPERS (local; candidates for data.ts) ==============================================================================
const rsThousands = (v : number) => `₹${inr(v)}`;
const cap = (t : string) => t.charAt(0).toUpperCase() + t.slice(1);
const pctLabel = (p : number) => p === 0 ? "0%" : `${p > 0 ? "+" : "−"}${inr(Math.abs(p))}%`;
const clamp = (v : number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a : number, b : number, v : number) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const argmax = (s : number[]) => s.reduce((b, v, i) => v > s[b] ? i : b, 0);
const argmin = (s : number[]) => s.reduce((b, v, i) => v < s[b] ? i : b, 0);

// A walk starts and stops: speed rises over the first RAMP of it, holds, and falls over the last RAMP.
const VMAX = 1 / (1 - RAMP);
const ease = (x : number) => x < RAMP ? VMAX * x * x / (2 * RAMP) : x > 1 - RAMP ? 1 - VMAX * (1 - x) ** 2 / (2 * RAMP) : VMAX * (x - RAMP / 2);
const speed = (x : number) => x <= 0 || x >= 1 ? 0 : x < RAMP ? x / RAMP : x > 1 - RAMP ? (1 - x) / RAMP : 1;

// Labels pushed apart to a minimum gap, in value order, and pushed back inside the plot.
const dodge = (ys : number[], gap : number, top : number, bottom : number) => {
    const order = [ ...ys.keys() ].sort((a, b) => ys[a] - ys[b]);
    const out = [ ...ys ];
    let prev = -Infinity;
    for (const i of order) { out[i] = Math.max(out[i], prev + gap, top); prev = out[i]; }
    let next = bottom;
    for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; out[i] = Math.min(out[i], next); next = out[i] - gap; }
    return out;
};

// Shorter names for end labels that do not fit their column.
const SHORT : Record<string, string> = {
    "Telephones and mobile handsets" : "Phones", "Air conditioners" : "ACs", "Refrigerators" : "Fridges", "Gold and ornaments" : "Gold",
    "Solar power systems" : "Solar power", "Anti-cancer drugs" : "Cancer drugs", "The whole basket" : "Basket",
};

let measureCtx : CanvasRenderingContext2D | null = null;
const textWidth = (s : string, px : number, family : string, weight = 400) => {
    if (!measureCtx && typeof document !== "undefined") measureCtx = document.createElement("canvas").getContext("2d");
    if (!measureCtx || !family) return s.length * px * 0.6;
    measureCtx.font = `${weight} ${px}px ${family}`;
    return measureCtx.measureText(s).width;
};

// THE WORDS ===========================================================================================================
const BASE = HEADLINE.baseFy, NOW = HEADLINE.nowFy, HUNDRED = rs(100);
const nameOf = (key : string) => key === "ALL" ? "The whole basket" : key;
const seriesOf = (key : string) => key === "ALL" ? ALL : followedNamed(key).series;
// The trailing twelve-month average, over an expanding window for the first eleven months.
export const smooth12 = (v : number[]) => v.map((_, k) => {
    const w = v.slice(Math.max(0, k - 11), k + 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
});
const DRAWN = new Map<string, number[]>();
const drawnOf = (key : string) => {
    let d = DRAWN.get(key);
    if (!d) { d = smooth12(seriesOf(key)); DRAWN.set(key, d); }
    return d;
};
const glyphOf = (key : string) : GlyphName => GLYPH_OF[key === "ALL" ? "basket" : key] ?? "basket";

const captionOf = (key : string) : string => {
    if (key === "ALL") {
        return `The whole basket. Every good weighted as the index weights it: ${HUNDRED} in ${BASE} is ${rs(HEADLINE.all)} in ${NOW}, and ${rs(ALL[ALL.length - 1])} in ${monthName(HEADLINE.lastMonth)}, the last month of the series.`;
    }
    const f = followedNamed(key), s = f.series, hi = argmax(s), lo = argmin(s);
    const head = `${key}. ${HUNDRED} in ${BASE} is ${rs(f.now)}`;
    switch (key) {
        case "Colour TVs" :
            return `${head} in ${NOW}. No month was below ${rs(s[lo])} or above ${rs(s[hi])}.`;
        case "Anti-cancer drugs" :
            return `${head} in ${NOW}. ${rs(s[hi])} in ${monthName(MONTHS[hi])} was the highest month, ${rs(s[lo])} in ${monthName(MONTHS[lo])} the lowest.`;
        case "Blankets" : {
            let last = s.length - 1;
            while (last >= 0 && s[last] < 100) last--;
            return last < s.length - 1
                ? `${head} in ${NOW}. Under ${HUNDRED} in every month since ${monthName(MONTHS[last + 1])}.`
                : `${head} in ${NOW}.`;
        }
        case "Solar power systems" :
            return s[hi] < 100
                ? `${head} in ${NOW}. Never above ${HUNDRED} in any month; ${rs(s[lo])} at the low in ${monthName(MONTHS[lo])}.`
                : `${head} in ${NOW}. ${rs(s[lo])} at the low in ${monthName(MONTHS[lo])}.`;
        case "Silver" :
            return `${head} in ${NOW}. Down to ${rs(s[lo])} in ${monthName(MONTHS[lo])}, then up to ${rs(s[hi])} in ${monthName(MONTHS[hi])}.`;
        case "Tomatoes" :
            return `${head} on the ${NOW} average, and ${rsThousands(s[hi])} for the one month of ${monthName(MONTHS[hi])}.`;
        case "Jasmine" : {
            const top = RISERS[0]?.code === itemOfFollowed(key).code ? `, the steepest rise among the ${inr(COUNTS.items)} goods` : "";
            return `${head} in ${NOW}${top}, and ${rsThousands(s[hi])} in ${monthName(MONTHS[hi])}.`;
        }
        default :   // wheat, coconuts
            return `${head} in ${NOW}, after ${rs(s[hi])} in ${monthName(MONTHS[hi])}.`;
    }
};

// The captions in full, as templates over the data; the card shows them after the good's name, which it sets as its
// heading, so the leading name is not said twice.
export const CAPTIONS : Record<string, string> = Object.fromEntries(WALKS.map(k => [ k, captionOf(k) ]));
const captionBody = (key : string) => CAPTIONS[key].slice(nameOf(key).length + 2);

const ARIA = `${cap(numberWord(WALKS.length))} price lines, each at ${HUNDRED} in ${BASE} and averaged over twelve months, monthly to ${monthName(HEADLINE.lastMonth)}. In the twelve months to ${monthName(HEADLINE.lastMonth)}: ${list(
    WALKS.map(k => `${k === "ALL" ? "the whole basket" : k} ${rs(drawnOf(k)[KN])}`),
)}.`;
const NOTE = "Each line is the index averaged over the twelve months to each month; the captions give single months.";

// GEOMETRY ============================================================================================================
interface Geo {
    W : number; H : number; narrow : boolean; stacked : boolean;
    padL : number; padR : number; padT : number; padB : number; plotW : number; plotH : number; right : number; bottom : number;
    h : number; feetLimit : number; family : string;
    xOf : (k : number) => number; yOf : (p : number) => number; kOfX : (x : number) => number;
}

// The porter's proportions, from his height h: hip at the origin, y up is negative. His forearms rise beside his head
// to the lower corners of the load, elbows out at shoulder height.
const bodyOf = (h : number, narrow : boolean) => {
    const L = 0.48 * h, torso = 0.3 * h, neck = 0.05 * h, headR = 0.085 * h, G = narrow ? 16 : 18;
    const headTop = -torso - neck - 2 * headR;
    const loadY = headTop - G * 0.9;
    return {
        L, seg : L / 2, torso, neck, headR, headTop, G, loadY,
        hand : [ 0.155 * h, headTop - 0.07 * h ] as const, elbow : [ 0.19 * h, -torso - 0.06 * h ] as const,
        stride : 0.6 * h, lift : 0.08 * h, stand : 0.04 * h, bob : 0.015 * h,
        top : L - loadY,                                 // feet to the top of the load
        stroke : narrow ? 1.5 : 1.75,
    };
};
type Body = ReturnType<typeof bodyOf>;

// On a phone, and wherever the card over the plot's top left would cover a walked line, the card stacks above the plot.
const geoOf = (W : number, H : number, family : string, stack : boolean) : Geo => {
    const narrow = W < 560, stacked = narrow || stack;
    const h = narrow ? 34 : 40;
    const top = bodyOf(h, narrow).top;
    const padL = narrow ? 44 : 56, padR = narrow ? 112 : 184, padB = narrow ? 36 : 40;
    const padT = stacked ? 12 + CARD_STACKED + 8 + Math.ceil(top) : 56;
    const plotW = Math.max(1, W - padL - padR), plotH = Math.max(1, H - padT - padB);
    const xOf = (k : number) => padL + (k - K0) / (KN - K0) * plotW;
    const yOf = (p : number) => padT + (Y_MAX - p) / (Y_MAX - Y_MIN) * plotH;
    const kOfX = (x : number) => K0 + (x - padL) / plotW * (KN - K0);
    return {
        W, H, narrow, stacked, padL, padR, padT, padB, plotW, plotH, right : padL + plotW, bottom : padT + plotH, h,
        feetLimit : Math.max(padT, Math.ceil(top) + 8) + 4, family, xOf, yOf, kOfX,
    };
};

// A line as knots: the base year's ₹100 at K0, then every month from April 2012.
const KS = [ K0, ...MONTHS.map((_, m) => m) ];
const knotAt = (k : number) : [ number, number ] => {
    if (k <= 0) return [ 0, clamp((k - K0) / -K0) ];
    const m = Math.min(Math.floor(k), KN - 1);
    return [ m + 1, clamp(k - m) ];
};
const lerpAt = (arr : number[], k : number) => { const [ j, f ] = knotAt(clamp(k, K0, KN)); return arr[j] + (arr[j + 1] - arr[j]) * f; };

// Whether any of the lines runs through a box on the screen; a line above the plot counts at the plot's top.
const hitsBox = (lines : Track[], geo : Geo, b : { x0 : number; x1 : number; y0 : number; y1 : number }) => lines.some(tr => {
    for (let j = 0; j < KS.length - 1; j++) {
        const xa = geo.xOf(KS[j]), xb = geo.xOf(KS[j + 1]);
        if (xb < b.x0 || xa > b.x1) continue;
        const ya = Math.max(geo.padT, tr.ys[j]), yb = Math.max(geo.padT, tr.ys[j + 1]);
        if (Math.max(ya, yb) >= b.y0 && Math.min(ya, yb) <= b.y1) return true;
    }
    return false;
});

interface Track {
    key : string; values : number[]; ys : number[]; feet : number[]; effort : number[]; dist : number[]; cam : number[];
    d : string; endY : number; tone : "dearer" | "cheaper" | "basket" | "deemph";
}

const trackOf = (key : string, geo : Geo, tone : Track["tone"]) : Track => {
    const s = drawnOf(key);
    const values = [ 100, ...s ];
    const ys = values.map(v => geo.yOf(v - 100));
    const xs = KS.map(geo.xOf);
    // The ground under his feet: the line smoothed over a month either side, held within FOOT_SNAP of the drawn line.
    const feet = ys.map((y, j) => {
        if (j === 0) return y;
        const m = j - 1, win = s.slice(Math.max(0, m - 1), Math.min(s.length, m + 2));
        const sm = geo.yOf(win.reduce((a, b) => a + b, 0) / win.length - 100);
        return y + clamp(sm - y, -FOOT_SNAP, FOOT_SNAP);
    });
    // Scroll is shared by months and by climbing, so a spike takes scroll to climb rather than flashing past.
    const effort = [ 0 ], dist = [ 0 ];
    for (let j = 1; j < KS.length; j++) {
        effort.push(effort[j - 1] + (KS[j] - KS[j - 1]) + Math.abs(values[j] - values[j - 1]) / CLIMB);
        dist.push(dist[j - 1] + Math.hypot(xs[j] - xs[j - 1], 0.35 * (feet[j] - feet[j - 1])));
    }
    const total = effort[effort.length - 1];
    // The camera: how far the plot must come down to keep him in frame at each month, averaged over three months
    // either side; the painter holds it between what keeps him below the top and what keeps him above the foot.
    const need = ys.map(y => Math.max(0, geo.feetLimit - y));
    const cam = need.map((_, j) => { const w = need.slice(Math.max(0, j - 3), j + 4); return w.reduce((a, b) => a + b, 0) / w.length; });
    const d = xs.map((x, j) => `${j ? "L" : "M"}${x.toFixed(1)} ${ys[j].toFixed(1)}`).join("");
    return { key, values, ys, feet, effort : effort.map(e => e / total), dist, cam, d, endY : ys[ys.length - 1], tone };
};

// The month at a share of the walk's effort.
const kAtEffort = (tr : Track, e : number) => {
    const ef = tr.effort;
    let lo = 0, hi = ef.length - 1;
    if (e <= 0) return K0;
    if (e >= 1) return KN;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ef[mid] <= e) lo = mid; else hi = mid; }
    const f = (e - ef[lo]) / Math.max(1e-9, ef[hi] - ef[lo]);
    return KS[lo] + f * (KS[hi] - KS[lo]);
};

// A knee between a hip and a foot, bent forward.
const kneeOf = (hx : number, hy : number, fx : number, fy : number, seg : number) => {
    const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy), mx = (hx + fx) / 2, my = (hy + fy) / 2;
    if (d >= 2 * seg || d < 1e-6) return [ mx, my ];
    const off = Math.sqrt(seg * seg - (d / 2) ** 2);
    let nx = -dy / d, ny = dx / d;
    if (nx < 0) { nx = -nx; ny = -ny; }
    return [ mx + nx * off, my + ny * off ];
};

// The porter at month k of a track, his gait at amplitude amp (0 standing, 1 walking).
const poseOf = (tr : Track, k : number, amp : number, geo : Geo, body : Body) => {
    const x = geo.xOf(k);
    const ground = (xx : number) => lerpAt(tr.feet, geo.kOfX(xx));
    const ka = clamp(k - 2, K0, KN), kb = clamp(k + 2, K0, KN);
    const slope = (lerpAt(tr.feet, kb) - lerpAt(tr.feet, ka)) / Math.max(1e-6, geo.xOf(kb) - geo.xOf(ka));
    const lean = clamp(-0.25 * Math.atan(slope) * 180 / Math.PI, -12, 12);
    const phase = 2 * Math.PI * lerpAt(tr.dist, k) / body.stride;
    const A = body.stride / 4;
    // Where the line rises or falls steeply within a step, the feet come together, so that both stand on the line
    // within a leg's reach of the ground under his hips.
    const g0 = ground(x), dy = Math.max(Math.abs(ground(x + A) - g0), Math.abs(ground(x - A) - g0));
    const reach = Math.min(1, 0.3 * body.L / Math.max(1e-6, dy));
    const sw = Math.sin(phase), cw = Math.cos(phase);
    const offA = amp * A * reach * sw + (1 - amp) * body.stand, offB = -amp * A * reach * sw - (1 - amp) * body.stand;
    const gA = ground(x + offA), gB = ground(x + offB);
    const fA = [ x + offA, gA - amp * body.lift * Math.max(0, cw) ], fB = [ x + offB, gB - amp * body.lift * Math.max(0, -cw) ];
    const hipY = Math.min(Math.max(gA, gB) - body.L * (0.99 - 0.05 * amp), g0 - 0.7 * body.L) + amp * body.bob * Math.cos(2 * phase);
    const kA = kneeOf(x, hipY, fA[0], fA[1], body.seg), kB = kneeOf(x, hipY, fB[0], fB[1], body.seg);
    const leg = (kn : number[], f : number[]) => `${x.toFixed(2)},${hipY.toFixed(2)} ${kn[0].toFixed(2)},${kn[1].toFixed(2)} ${f[0].toFixed(2)},${f[1].toFixed(2)}`;
    return { x, hipY, lean, legA : leg(kA, fA), legB : leg(kB, fB) };
};

// Where a stage stands: 0 the poster, 1 + 2i walking walk i, 2 + 2i walk i complete, FINISHED the finished chart.
const momentOf = (p : number, reduced : boolean) => {
    const u = clamp(p) * TOTAL;
    if (u < POSTER) return { u, stage : 0, walk : -1, t : 0 };
    const i = Math.floor((u - POSTER) / PER);
    if (i >= WALKS.length) return { u, stage : FINISHED, walk : WALKS.length, t : 1 };
    const t = (u - POSTER - i * PER) / PER;
    return { u, stage : reduced || t >= ARRIVE ? 2 + 2 * i : 1 + 2 * i, walk : i, t };
};

// The readout under the card's heading: the good's drawn value, the twelve-month average, at the month nearest the porter.
const readoutOf = (key : string, k : number) => {
    if (k < K0 / 2) return `${BASE} average · ${HUNDRED}`;
    const m = clamp(Math.round(k), 0, KN);
    return `${rsThousands(drawnOf(key)[m])} · twelve months to ${shortMonth(MONTHS[m])}`;
};

// THE COMPONENT =======================================================================================================
export const Walk = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const { ref : frameRef, width, height } = useSize<HTMLDivElement>();
    const reduced = !!useReducedMotion();
    const [ stage, setStage ] = useState(0);
    const [ chosen, setChosen ] = useState<string[]>([]);
    const [ hover, setHover ] = useState<string | null>(null);
    const stageRef = useRef(0);

    // The camera moves four groups together: the frame, the lines, the end labels and the porter.
    const camRefs = [ useRef<SVGGElement>(null), useRef<SVGGElement>(null), useRef<SVGGElement>(null), useRef<SVGGElement>(null) ];
    const revealRef = useRef<SVGRectElement>(null);
    const porterRef = useRef<SVGGElement>(null);
    const upperRef = useRef<SVGGElement>(null);
    const legARef = useRef<SVGPolylineElement>(null);
    const legBRef = useRef<SVGPolylineElement>(null);
    const markersRef = useRef<SVGGElement>(null);
    const readoutRef = useRef<HTMLSpanElement>(null);
    const cueRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({ target : sectionRef, offset : [ "start start", "end end" ] });

    // Everything that depends on the frame's size, measured after mount.
    const layout = useMemo(() => {
        if (!width || !height) return null;
        const family = frameRef.current ? getComputedStyle(frameRef.current).fontFamily : "";
        const walked = (g : Geo) => WALKS.map(k => trackOf(k, g, k === "ALL" ? "basket" : drawnOf(k)[KN] >= 100 ? "dearer" : "cheaper"));
        let geo = geoOf(width, height, family, false), tracks = walked(geo);
        if (!geo.stacked && hitsBox(tracks, geo, { x0 : geo.padL + 16, x1 : geo.padL + 16 + CARD_W, y0 : 16, y1 : 16 + CARD_H })) {
            geo = geoOf(width, height, family, true);
            tracks = walked(geo);
        }
        const body = bodyOf(geo.h, geo.narrow);
        const extraNames = [ ...new Set(PRESETS.flatMap(p => p.names)) ];
        const extras = Object.fromEntries(extraNames.map(n => [ n, trackOf(n, geo, "deemph") ]));
        // Gridlines every GRID points from the foot of the axis to the highest walked value, for the camera to pass.
        const top = Math.max(...tracks.map(t => Math.max(...t.values))) - 100;
        const grid = Array.from({ length : Math.floor(top / GRID) - Math.ceil(Y_MIN / GRID) + 1 }, (_, i) => (Math.ceil(Y_MIN / GRID) + i) * GRID);
        // On the finished chart the chips sit in the band above the plot, with the note on one line beneath them, when
        // the row fits before the end-label column and no line runs under the note; otherwise they stay in the card.
        const chipsW = PRESETS.reduce((w, pr) => w + textWidth(pr.label, 14, family) + 26, 0) + 8 * (PRESETS.length - 1);
        const noteW = textWidth(NOTE, 12, family);
        const band = !geo.stacked && geo.padL + 16 + Math.max(chipsW, noteW) <= geo.right - 8
            && !hitsBox([ ...tracks, ...Object.values(extras) ], geo, { x0 : geo.padL + 8, x1 : geo.padL + 24 + noteW, y0 : geo.padT, y1 : 6 + 44 + 10 + 16 + 4 });
        return { geo, body, tracks, extras, grid, chipsW, band };
    }, [ width, height, frameRef ]);

    // The zone words, placed where no line of the walks or the chips runs, clear of the caption card.
    const zones = useMemo(() => {
        if (!layout) return null;
        const { geo, tracks, extras } = layout;
        const all = [ ...tracks, ...Object.values(extras) ];
        const card = geo.stacked ? null : { x0 : geo.padL + 8, x1 : geo.padL + 16 + CARD_W + 8, y0 : 0, y1 : 16 + CARD_H + 8 };
        const place = (lines : string[], cys : number[]) => {
            const w = Math.max(...lines.map(l => textWidth(l, 12, geo.family))), half = 7 * lines.length + 1;
            for (const avoid of [ all, tracks ]) {
                for (let x = geo.padL + 12; x + w < geo.right - 12; x += 12) {
                    for (const cy of cys) {
                        const y0 = cy - half, y1 = cy + half, x0 = x - 6, x1 = x + w + 6;
                        if (y0 < geo.padT + 4 || y1 > geo.bottom) continue;
                        if (card && x1 > card.x0 && x0 < card.x1 && y0 < card.y1) continue;
                        if (!hitsBox(avoid, geo, { x0, x1, y0, y1 })) return { x, y : cy + 4 - 7 * (lines.length - 1), lines };
                    }
                }
            }
            return null;
        };
        const dearer = `Dearer than in ${BASE}`;
        return [
            place(geo.narrow ? [ "Dearer than", `in ${BASE}` ] : [ dearer ], [ 225, 175, 275, 300, 125, 75 ].map(geo.yOf)),
            place([ "Cheaper" ], [ geo.bottom - 9, geo.yOf(-35), geo.yOf(-25) ]),
        ];
    }, [ layout ]);

    // THE PAINTER: every scroll change lands here and writes to refs only.
    const paint = (p : number) => {
        const m = momentOf(p, reduced);
        if (m.stage !== stageRef.current) { stageRef.current = m.stage; setStage(m.stage); }
        if (cueRef.current) cueRef.current.style.opacity = `${1 - clamp(m.u / CUE_OUT)}`;
        if (!layout) return;
        const { geo, body, tracks } = layout;
        const wi = clamp(m.walk, 0, WALKS.length - 1);
        const tr = tracks[wi];
        let k = K0, amp = 0, op = 1, cam = 0;
        if (m.walk >= WALKS.length) { k = KN; op = 0; }
        else if (m.walk >= 0) {
            const x = clamp(m.t / ARRIVE);
            k = reduced ? KN : kAtEffort(tr, ease(x));
            amp = smoothstep(0.05, 0.5, speed(x));
            const fadeIn = m.walk === 0 ? 1 : clamp(m.t / FADE);
            op = Math.min(fadeIn, clamp((1 - m.t) / FADE));
            const y = lerpAt(tr.ys, k), n = Math.max(0, geo.feetLimit - y), allow = Math.max(n, geo.bottom - 16 - y);
            const c = clamp(lerpAt(tr.cam, k), n, allow);
            cam = reduced ? 0 : c + (n - c) * smoothstep(ARRIVE, 1 - FADE, m.t);
        }
        const tf = `translate(0 ${cam.toFixed(2)})`;
        for (const r of camRefs) r.current?.setAttribute("transform", tf);
        if (markersRef.current) markersRef.current.style.opacity = `${1 - clamp(cam / 12)}`;
        if (revealRef.current) revealRef.current.setAttribute("width", `${Math.max(0, geo.xOf(k) - geo.padL + 4).toFixed(2)}`);
        if (readoutRef.current && m.walk >= 0 && m.walk < WALKS.length) readoutRef.current.textContent = readoutOf(WALKS[wi], reduced ? KN : k);
        if (reduced || !porterRef.current) return;
        porterRef.current.style.opacity = `${op}`;
        const pose = poseOf(tr, k, amp, geo, body);
        upperRef.current?.setAttribute("transform", `translate(${pose.x.toFixed(2)} ${pose.hipY.toFixed(2)}) rotate(${pose.lean.toFixed(2)})`);
        legARef.current?.setAttribute("points", pose.legA);
        legBRef.current?.setAttribute("points", pose.legB);
    };
    const paintRef = useRef(paint);
    paintRef.current = paint;

    useMotionValueEvent(scrollYProgress, "change", p => paintRef.current(p));
    useLayoutEffect(() => { paintRef.current(scrollYProgress.get()); }, [ stage, layout, reduced, chosen, scrollYProgress ]);

    // The discrete picture for this stage.
    const walk = stage === 0 ? -1 : stage >= FINISHED ? WALKS.length : Math.floor((stage - 1) / 2);
    const done = stage >= FINISHED || (stage > 0 && stage % 2 === 0);
    const finished = stage >= FINISHED;
    const current = clamp(walk, 0, WALKS.length - 1);
    const completed = WALKS.map((_, i) => finished || i < walk || (i === walk && done));
    const extraNames = finished ? [ ...new Set(PRESETS.filter(p => chosen.includes(p.label)).flatMap(p => p.names)) ] : [];

    const toggle = (label : string) => setChosen(c => c.includes(label) ? c.filter(x => x !== label) : [ ...c, label ]);
    const on = (key : string) => hover === null || hover === key;
    const hoverable = finished;

    const frameStyle = { "--walk-ease" : `cubic-bezier(${EASE.join(", ")})` } as CSSProperties;

    // The end labels: every complete line and every chip line, dodged in the end-label column.
    const ends = (() => {
        if (!layout) return [];
        const { geo, tracks, extras } = layout;
        const items = [
            ...tracks.filter((_, i) => completed[i]).map(tr => ({ tr, glyph : glyphOf(tr.key) as GlyphName | null, name : nameOf(tr.key) })),
            ...extraNames.map(n => ({ tr : extras[n], glyph : null, name : n })),
        ];
        const ys = dodge(items.map(it => it.tr.endY), geo.narrow ? 13 : 14, geo.padT + 8, geo.bottom - 4);
        const room = geo.padR - 14;
        return items.map((it, i) => {
            const value = rs(drawnOf(it.tr.key)[KN]);
            const glyphW = it.glyph ? 18 : 0;
            let name : string | null = geo.narrow && it.glyph ? null : it.name;
            if (name && glyphW + textWidth(`${name} ${value}`, 12, geo.family, it.tr.tone === "basket" ? 600 : 400) > room) name = SHORT[name] ?? name;
            return { ...it, y : ys[i], value, name };
        });
    })();

    // The spike markers: where a complete line leaves the top of the plot, its highest value and month.
    const markers = (() => {
        if (!layout) return [];
        const { geo, tracks, extras } = layout;
        const spikeOf = (tr : Track) => {
            const s = drawnOf(tr.key), hi = argmax(s);
            if (s[hi] - 100 <= Y_MAX) return null;
            let a = hi;
            while (a > 0 && s[a - 1] - 100 > Y_MAX) a--;
            const prev = a > 0 ? s[a - 1] : 100, kPrev = a > 0 ? a - 1 : K0;
            const kc = kPrev + (Y_MAX + 100 - prev) / (s[a] - prev) * (a - kPrev);
            return { key : tr.key, x : geo.xOf(kc), text : `${rsThousands(s[hi])}, ${shortMonth(MONTHS[hi])}` };
        };
        const byX = (lines : Track[]) => lines.map(spikeOf).filter(<T,>(v : T | null) : v is T => v !== null).sort((p, q) => p.x - q.x);
        // The walked lines are placed first, then the chips' lines.
        const raw = [ ...byX(tracks.filter((_, i) => completed[i])), ...byX(extraNames.map(n => extras[n])) ];
        const maxRows = geo.narrow ? 3 : 4;
        // The caption card or the chips take the left of the band above the plot on a wide screen.
        const cardRight = geo.stacked ? -Infinity : geo.padL + 16 + (finished && layout.band ? layout.chipsW : CARD_W) + 8;
        type Placed = { key : string; x : number; span : [ number, number ]; row : number; lx : number; anchor : "start" | "end"; y : number; text : string };
        const out : Placed[] = [];
        // A tick rises from the plot's top to its label's row, so a label may not sit below the row of a tick inside its
        // span, nor a tick rise past a lower label; a spike whose label fits no row is left unmarked.
        for (const r of raw) {
            const w = textWidth(r.text, 12, geo.family);
            let best : Placed | null = null;
            for (let row = 0; row < maxRows && !best; row++) {
                for (const end of [ true, false ]) {
                    const span : [ number, number ] = end ? [ r.x - 4 - w, r.x - 4 ] : [ r.x + 4, r.x + 4 + w ];
                    if (span[0] < Math.max(geo.padL, cardRight) || span[1] > geo.right) continue;
                    const clash = out.some(o => {
                        if (o.row === row && !(span[1] + 8 < o.span[0] || span[0] > o.span[1] + 8)) return true;
                        if (o.x >= span[0] - 2 && o.x <= span[1] + 2 && o.row > row) return true;
                        if (r.x >= o.span[0] - 2 && r.x <= o.span[1] + 2 && o.row < row) return true;
                        return false;
                    });
                    if (!clash) { best = { key : r.key, x : r.x, span, row, lx : end ? r.x - 4 : r.x + 4, anchor : end ? "end" : "start", y : geo.padT - 7 - row * 14, text : r.text }; break; }
                }
            }
            if (best) out.push(best);
        }
        return out;
    })();

    const caption = walk >= 0 && walk < WALKS.length ? WALKS[walk] : null;
    const geo = layout?.geo;
    const body = layout?.body;
    const cardStyle : CSSProperties | undefined = geo
        ? geo.narrow ? { left : 12, right : 12, top : 12, minHeight : CARD_STACKED }
            : geo.stacked ? { left : geo.padL + 16, top : 12, width : Math.min(560, geo.right - geo.padL - 16), minHeight : CARD_STACKED }
            : finished && layout.band ? { left : geo.padL + 16, top : 6 } : { left : geo.padL + 16, top : 16, maxWidth : CARD_W }
        : undefined;
    const cueStyle : CSSProperties | undefined = geo && body ? { left : geo.xOf(K0) + 0.3 * geo.h + 16, top : geo.yOf(0) - body.top * 0.75 } : undefined;

    return (
        <section ref={sectionRef} className={`walk ${finished ? "is-finished" : ""}`} style={{ height : `${TOTAL * 100}svh` }}>
            <div ref={frameRef} className="walk-frame" style={frameStyle}>
                {geo && body && layout && (
                    <svg className="walk-svg" width={geo.W} height={geo.H} viewBox={`0 0 ${geo.W} ${geo.H}`} role="img" aria-label={ARIA} onPointerLeave={() => setHover(null)}>
                        <defs>
                            <clipPath id="walk-clip-lines"><rect x={0} y={geo.padT} width={geo.W} height={geo.plotH} /></clipPath>
                            <clipPath id="walk-clip-frame"><rect x={0} y={geo.padT - 14} width={geo.W} height={geo.plotH + 20} /></clipPath>
                            <clipPath id="walk-reveal"><rect ref={revealRef} x={geo.padL - 4} y={-1e5} width={0} height={2e5} /></clipPath>
                        </defs>

                        {/* The frame: gridlines and their labels, the 0% line, the zone words; these move with the camera. */}
                        <g clipPath="url(#walk-clip-frame)">
                            <g ref={camRefs[0]}>
                                {layout.grid.map(p => (
                                    <g key={p}>
                                        <line className={p === 0 ? "walk-zero" : "walk-grid"} x1={geo.padL} x2={geo.right} y1={geo.yOf(p)} y2={geo.yOf(p)} />
                                        <text className="walk-tick" x={geo.padL - (geo.narrow ? 5 : 8)} y={geo.yOf(p) + 4} textAnchor="end">{pctLabel(p)}</text>
                                    </g>
                                ))}
                                {zones?.map(z => z && (
                                    <text key={z.lines[0]} className="walk-zone" x={z.x} y={z.y}>
                                        {z.lines.map((l, i) => <tspan key={l} x={z.x} dy={i ? 14 : 0}>{l}</tspan>)}
                                    </text>
                                ))}
                            </g>
                        </g>

                        {/* The lines, clipped at the top of the plot. */}
                        <g clipPath="url(#walk-clip-lines)">
                            <g ref={camRefs[1]} className="walk-lines">
                                {extraNames.map(n => (
                                    <g key={n} className={`walk-series is-extra ${on(n) ? "" : "is-dim"} ${hover === n ? "is-hot" : ""}`}>
                                        <path className="walk-line tone-deemph" d={layout.extras[n].d} />
                                        {hoverable && <path className="walk-hit" d={layout.extras[n].d} onPointerEnter={() => setHover(n)} />}
                                    </g>
                                ))}
                                {layout.tracks.map((tr, i) => {
                                    if (completed[i]) return (
                                        <g key={tr.key} className={`walk-series ${on(tr.key) ? "" : "is-dim"} ${hover === tr.key ? "is-hot" : ""}`}>
                                            <path className={`walk-line is-done tone-${tr.tone}`} d={tr.d} />
                                            {hoverable && <path className="walk-hit" d={tr.d} onPointerEnter={() => setHover(tr.key)} />}
                                        </g>
                                    );
                                    if (i !== current || finished) return null;
                                    return (
                                        <g key={tr.key} className="walk-series is-current">
                                            <path className="walk-line is-future" d={tr.d} />
                                            <path className={`walk-line is-active tone-${tr.tone}`} d={tr.d} clipPath="url(#walk-reveal)" />
                                        </g>
                                    );
                                })}
                            </g>
                        </g>

                        {/* The end labels, which move with the camera but are not clipped to the plot. */}
                        <g clipPath="url(#walk-clip-frame)">
                            <g ref={camRefs[2]}>
                                {ends.map(e => (
                                    <g
                                        key={e.tr.key} className={`walk-end tone-${e.tr.tone} ${on(e.tr.key) ? "" : "is-dim"} ${hover === e.tr.key ? "is-hot" : ""}`}
                                        onPointerEnter={hoverable ? () => setHover(e.tr.key) : undefined}
                                    >
                                        {e.tr.endY >= geo.padT && Math.abs(e.y - e.tr.endY) > 6 && <line className="walk-leader" x1={geo.right + 2} x2={geo.right + 8} y1={e.tr.endY} y2={e.y} />}
                                        <g className="walk-end-label" style={{ transform : `translate(${geo.right + 10}px, ${e.y}px)` }}>
                                            {e.glyph && (
                                                <g className="walk-end-glyph" transform={`translate(0 -7) scale(${14 / 24})`} strokeWidth={1.25 * 24 / 14}>
                                                    <GlyphPaths name={e.glyph} />
                                                </g>
                                            )}
                                            <text x={e.glyph ? 18 : 0} y={4}>
                                                {e.name && <tspan className="walk-end-name">{e.name}{" "}</tspan>}
                                                <tspan className="walk-end-value">{e.value}</tspan>
                                            </text>
                                        </g>
                                    </g>
                                ))}
                            </g>
                        </g>

                        {/* The spike markers, at the top of the plot, shown while the camera is home. */}
                        <g ref={markersRef} className="walk-markers">
                            {markers.map(mk => (
                                <g key={mk.key} className={on(mk.key) ? "" : "is-dim"}>
                                    <line className="walk-marker-tick" x1={mk.x} x2={mk.x} y1={geo.padT} y2={mk.y + 3} />
                                    <text className="walk-marker" x={mk.lx} y={mk.y} textAnchor={mk.anchor}>{mk.text}</text>
                                </g>
                            ))}
                        </g>

                        {/* The year ticks and the head of the end-label column, which stay put. */}
                        {MONTHS.map((mo, k) => ({ mo, k })).filter(({ mo }) => mo.endsWith("-04") && (+mo.slice(0, 4) - +MONTHS[0].slice(0, 4)) % (geo.narrow ? 4 : 2) === 0).map(({ mo, k }) => (
                            <text key={mo} className="walk-tick" x={geo.xOf(k)} y={geo.H - geo.padB + (geo.narrow ? 22 : 24)} textAnchor="middle">{mo.slice(0, 4)}</text>
                        ))}
                        {geo.narrow ? (
                            <text className="walk-head" x={geo.right + 10} y={geo.padT - 24}>
                                <tspan x={geo.right + 10}>Twelve months</tspan>
                                <tspan x={geo.right + 10} dy={14}>{`to ${shortMonth(HEADLINE.lastMonth)}`}</tspan>
                            </text>
                        ) : (
                            <text className="walk-head" x={geo.right + 10} y={geo.padT - 12}>{`Twelve months to ${shortMonth(HEADLINE.lastMonth)}`}</text>
                        )}

                        {/* The porter, who moves with the camera and is never clipped. */}
                        {!reduced && !finished && (
                            <g ref={camRefs[3]}>
                                <g ref={porterRef} className="walk-porter" strokeWidth={body.stroke}>
                                    <polyline ref={legBRef} />
                                    <polyline ref={legARef} />
                                    <g ref={upperRef}>
                                        <polyline points={`0,${-body.torso} ${-body.elbow[0]},${body.elbow[1]} ${-body.hand[0]},${body.hand[1]}`} />
                                        <line x1={0} y1={0} x2={0} y2={-body.torso - body.neck} />
                                        <circle className="walk-head-dot" cx={0} cy={-body.torso - body.neck - body.headR} r={body.headR} />
                                        <g transform={`translate(${-body.G / 2} ${body.loadY}) scale(${body.G / 24})`} strokeWidth={1.5 * 24 / body.G}>
                                            <GlyphPaths name={glyphOf(WALKS[current])} />
                                        </g>
                                        <polyline points={`0,${-body.torso} ${body.elbow[0]},${body.elbow[1]} ${body.hand[0]},${body.hand[1]}`} />
                                    </g>
                                </g>
                            </g>
                        )}
                    </svg>
                )}

                <div className={`walk-cue ${geo ? "" : "is-unplaced"}`} ref={cueRef} style={cueStyle} aria-hidden="true">Scroll to walk</div>

                <div className={`walk-caption ${stage === 0 ? "is-empty" : ""} ${finished ? "is-chips" : ""} ${finished && layout?.band ? "is-band" : ""} ${geo ? "" : "is-unplaced"}`} style={cardStyle} aria-live="polite">
                    {caption && (
                        <>
                            <div className="walk-caption-head">
                                <Glyph name={glyphOf(caption)} size={20} />
                                <h3 className="walk-caption-name">{nameOf(caption)}</h3>
                            </div>
                            <span className="walk-caption-readout" ref={readoutRef} aria-hidden="true" />
                            <p className="walk-caption-text">{captionBody(caption)}</p>
                        </>
                    )}
                    {finished && (
                        <>
                            <div className="walk-chips" role="group" aria-label="Add other goods the story follows">
                                {PRESETS.map(pr => (
                                    <button key={pr.label} type="button" className={`walk-chip ${chosen.includes(pr.label) ? "is-on" : ""}`} aria-pressed={chosen.includes(pr.label)} onClick={() => toggle(pr.label)}>
                                        {pr.label}
                                    </button>
                                ))}
                            </div>
                            <p className="walk-chips-note">{NOTE}</p>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};
