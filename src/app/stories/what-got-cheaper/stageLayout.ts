// The opening act's layouts: where each of the stage's dots sits in every scene, what colour it is, and when it moves.
// Pure functions of the scene and the stage's size, so the canvas engine (PriceStage.tsx) only tweens and draws. One
// dot per item of the wholesale price index, the same dot for the same item in every scene:
//   the field      the hero's faint scatter
//   the block      the items as a grid, before they are placed
//   the swarm      each item at what ₹100 of it in 2011-12 costs now, on a log scale, stacked where they crowd
//   the three rows the same swarm split by major group
//   the weighing   the swarm with each dot sized by the item's weight in the basket
//   in work        the swarm with each item's price measured in days of a rural labourer's work

// DATA ================================================================================================================
import { COUNTS, HEADLINE, ITEMS, MAJORS, WAGE_RISE, WPI_RISE_WAGE_WINDOW as WPI_RISE_IN_WAGE_WINDOW, followedNamed, type Item } from "./data";

export type SceneId = "hero" | "block" | "spread" | "guess" | "answer" | "cheaper" | "doubled" | "majors" | "weighted" | "work";
export const SWARM_SCENES : SceneId[] = [ "spread", "guess", "answer", "cheaper", "doubled", "weighted", "work" ];
export const isSwarm = (s : SceneId) => SWARM_SCENES.includes(s) || s === "majors";

export type RGB = [ number, number, number ];
export interface StagePalette {
    field  : RGB;          // the hero's scatter and the unlit
    majors : RGB[];        // one hue a major group: grown or mined, fuel and power, factory-made
    emph   : RGB;          // the dots the scene is about, when the groups' hues step back
    deemph : RGB;          // the rest
    cool   : RGB;          // cheaper in days of work
    warm   : RGB;          // dearer in days of work
}

export interface Target {
    x : number; y : number; r : number;
    c : RGB; a : number;
    twinkle : boolean;      // a slow shimmer while idle
    pop : boolean;          // swell and settle on arrival
    delay : number; dur : number;
}
export interface Frame { w : number; h : number }
export interface Region { x : number; y : number; w : number; h : number }
export const isMobile = (f : Frame) => f.w < 900;

export const N = ITEMS.length;

// THE POOL ============================================================================================================
const mulberry = (seed : number) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry(20261007);
const SEED = Float32Array.from({ length : N }, () => rnd());
const FX = Float32Array.from({ length : N }, () => rnd());
const FY = Float32Array.from({ length : N }, () => rnd());
const ORDER = (() => { const a = Array.from({ length : N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ a[i], a[j] ] = [ a[j], a[i] ]; } return a; })();
export const dotRhythm = (i : number) => SEED[i];

// THE SCALE ===========================================================================================================
// Rupees of every ₹100, on a log scale so a halving and a doubling are the same distance either side of ₹100.
export const X_DOMAIN : [ number, number ] = [ 40, 700 ];
export const X_TICKS = [ 50, 75, 100, 150, 200, 300, 400, 600 ];
export const WORK_DOMAIN : [ number, number ] = [ 25, 420 ];
export const WORK_TICKS = [ 25, 50, 75, 100, 150, 200, 300, 400 ];
export const xScale = (r : Region, domain : [ number, number ]) => {
    const lo = Math.log(domain[0]), hi = Math.log(domain[1]);
    return (v : number) => r.x + ((Math.log(Math.max(domain[0], Math.min(domain[1], v))) - lo) / (hi - lo)) * r.w;
};

// The value each dot is placed by: what ₹100 of the item costs now, or the same measured in days of work.
export const valueOf = (it : Item, work : boolean) => (work ? (it.inWork ?? 1) * 100 : it.now);

// REGIONS =============================================================================================================
// The dots keep to the left of the cards on a wide screen and to the top on a phone, where the cards come up from
// the bottom. The swarm's region leaves room above for the caption and key and below for the axis.
export const regionOf = (f : Frame, scene : SceneId) : Region => {
    if (scene === "hero") return { x : 10, y : 10, w : f.w - 20, h : f.h - 20 };
    if (isMobile(f)) return { x : 16, y : 92, w : f.w - 32, h : Math.max(180, f.h * 0.56 - 92) };
    const cardW = Math.min(440, f.w * 0.34);
    return { x : 56, y : 124, w : f.w - cardW - 56 - 88, h : f.h - 124 - 86 };
};

const gridIn = (r : Region, n : number) => {
    const cols = Math.max(1, Math.round(Math.sqrt((n * r.w) / r.h)));
    const rows = Math.ceil(n / cols);
    const pitch = Math.min(r.w / cols, r.h / rows);
    const ox = r.x + (r.w - cols * pitch) / 2, oy = r.y + (r.h - rows * pitch) / 2;
    return { pitch, at : (i : number) : [ number, number ] => [ ox + ((i % cols) + 0.5) * pitch, oy + (Math.floor(i / cols) + 0.5) * pitch ] };
};

// THE SWARM ===========================================================================================================
// A beeswarm: dots placed left to right, each as near its baseline as it can be without touching one already placed.
// Deterministic, so the same item lands in the same place every time the scene is laid out at a size.
const swarm = (xs : Float64Array, rs : Float64Array, baseline : number, idx : number[]) : Float64Array => {
    const ys = new Float64Array(xs.length);
    const order = [ ...idx ].sort((a, b) => xs[a] - xs[b] || a - b);
    const placed : number[] = [];
    for (const i of order) {
        const ri = rs[i];
        const near : number[] = [];
        for (let k = placed.length - 1; k >= 0; k--) {
            const j = placed[k];
            if (xs[i] - xs[j] > ri + rs[j]) break;
            near.push(j);
        }
        const candidates = [ baseline ];
        for (const j of near) {
            const dx = xs[i] - xs[j], rr = ri + rs[j] + 0.6;
            const dy = Math.sqrt(Math.max(0, rr * rr - dx * dx));
            candidates.push(ys[j] + dy, ys[j] - dy);
        }
        candidates.sort((a, b) => Math.abs(a - baseline) - Math.abs(b - baseline));
        for (const y of candidates) {
            let ok = true;
            for (const j of near) {
                const dx = xs[i] - xs[j], dy = y - ys[j], rr = ri + rs[j] + 0.5;
                if (dx * dx + dy * dy < rr * rr) { ok = false; break; }
            }
            if (ok) { ys[i] = y; break; }
        }
        placed.push(i);
    }
    return ys;
};

// The dot radius a swarm can afford: the region's area over the dots, with a floor and a ceiling.
const swarmRadius = (r : Region, n : number, mobile : boolean) => Math.max(mobile ? 2.2 : 3, Math.min(mobile ? 4.5 : 7, Math.sqrt((r.w * r.h * 0.42) / n) / 2));

// THE SCENES ==========================================================================================================
export interface Band { major : number; baseline : number; top : number; bottom : number }
export interface SwarmGeometry {
    r : Region; domain : [ number, number ]; x : (v : number) => number; work : boolean;
    bands : Band[];          // one band for the single swarm, three for the major groups
    radius : number;
}
export interface Layout {
    region : Region;
    targets : Target[];
    swarm ? : SwarmGeometry;
    block ? : { pitch : number };
}

const T = (x : number, y : number, r : number, c : RGB, a : number, o : Partial<Target> = {}) : Target =>
    ({ x, y, r, c, a, twinkle : false, pop : false, delay : 0, dur : 900, ...o });

export const layoutScene = (scene : SceneId, frame : Frame, pal : StagePalette) : Layout => {
    const mobile = isMobile(frame);
    const region = regionOf(frame, scene);
    const targets : Target[] = new Array(N);

    // The field: every item scattered faintly, the middle cleared for the title.
    if (scene === "hero") {
        const cx = frame.w / 2, cy = frame.h / 2;
        for (let i = 0; i < N; i++) {
            const x = region.x + FX[i] * region.w, y = region.y + FY[i] * region.h;
            const d = Math.hypot((x - cx) / (frame.w * 0.5), (y - cy) / (frame.h * 0.5));
            const clear = Math.min(1, Math.max(0, (d - 0.24) / 0.5));
            targets[i] = T(x, y, mobile ? 2.4 : 3.2, pal.majors[ITEMS[i].major], 0.1 + 0.6 * clear, { twinkle : true, delay : SEED[i] * 1400, dur : 1200 });
        }
        return { region, targets };
    }

    // The block: the items as a grid, coloured by major group, one dot one good.
    if (scene === "block") {
        const g = gridIn(region, N);
        for (let i = 0; i < N; i++) {
            const [ x, y ] = g.at(ORDER[i]);
            targets[i] = T(x, y, Math.min(g.pitch * 0.33, 9), pal.majors[ITEMS[i].major], 1, { pop : true, delay : SEED[i] * 900, dur : 800 });
        }
        return { region, targets, block : { pitch : g.pitch } };
    }

    // The swarms.
    const work = scene === "work";
    const domain = work ? WORK_DOMAIN : X_DOMAIN;
    const x = xScale(region, domain);
    const xs = new Float64Array(N), rs = new Float64Array(N);
    let base = swarmRadius(region, N, mobile);
    const all = Array.from({ length : N }, (_, i) => i).filter(i => !work || ITEMS[i].inWork !== null);
    for (let i = 0; i < N; i++) xs[i] = x(valueOf(ITEMS[i], work));
    const radii = (b : number) => { for (let i = 0; i < N; i++) rs[i] = scene === "weighted" ? Math.max(b * 0.45, Math.min(b * 4.2, b * 0.45 + Math.sqrt(ITEMS[i].weight) * b * 1.9)) : b; };
    let bands : Band[];
    let ys : Float64Array;
    // The swarm must fit its band: lay it out, measure the tallest column, and shrink the dots until it does.
    const fitted = (baseline : number, half : number, idx : number[]) => {
        for (let pass = 0; pass < 6; pass++) {
            radii(base);
            const part = swarm(xs, rs, baseline, idx);
            let reach = 0;
            for (const i of idx) reach = Math.max(reach, Math.abs(part[i] - baseline) + rs[i]);
            if (reach <= half || base <= 1.6) return part;
            base = Math.max(1.6, base * Math.max(0.8, Math.sqrt(half / reach)));
        }
        radii(base);
        return swarm(xs, rs, baseline, idx);
    };
    if (scene === "majors") {
        // three rows, each as tall as its swarm needs, the heaviest row (factory-made) the deepest
        const counts = MAJORS.map((_, m) => ITEMS.filter(it => it.major === m).length);
        const total = counts.reduce((s, v) => s + v, 0);
        const minH = mobile ? 40 : 56;
        const spare = region.h - minH * 3;
        let top = region.y;
        bands = MAJORS.map((_, m) => {
            const h = minH + spare * (counts[m] / total);
            const b = { major : m, top, bottom : top + h, baseline : top + h / 2 };
            top += h;
            return b;
        });
        ys = new Float64Array(N);
        // the deepest band sets the radius for all three, so the rows read at one scale
        const deepest = [ ...bands ].sort((a, b) => (b.bottom - b.top) - (a.bottom - a.top))[0];
        const order = [ deepest, ...bands.filter(b => b !== deepest) ];
        for (const b of order) {
            const idx = all.filter(i => ITEMS[i].major === b.major);
            const part = fitted(b.baseline, (b.bottom - b.top) / 2 - 2, idx);
            for (const i of idx) ys[i] = part[i];
        }
    } else {
        const baseline = region.y + region.h * 0.5;
        bands = [ { major : -1, baseline, top : region.y, bottom : region.y + region.h } ];
        ys = fitted(baseline, region.h / 2 - 2, all);
    }
    const lit = (it : Item) =>
        scene === "cheaper" ? it.now < 100
            : scene === "doubled" ? it.now >= 200
                : true;
    for (let i = 0; i < N; i++) {
        const it = ITEMS[i];
        if (work && it.inWork === null) { targets[i] = T(xs[i], region.y + region.h + 40, 0, pal.deemph, 0, { dur : 600 }); continue; }
        const on = lit(it);
        const colour = work ? ((it.inWork ?? 1) < 1 ? pal.cool : pal.warm) : pal.majors[it.major];
        const fromBlock = scene === "spread";
        targets[i] = T(xs[i], ys[i], rs[i], on ? colour : pal.deemph, on ? 1 : 0.22, {
            pop : on && (scene === "cheaper" || scene === "doubled"),
            delay : fromBlock ? (xs[i] - region.x) / region.w * 500 + SEED[i] * 300 : scene === "work" ? SEED[i] * 400 : SEED[i] * 350,
            dur : fromBlock ? 1300 : scene === "weighted" ? 900 : 1000,
        });
    }
    return { region, targets, swarm : { r : region, domain, x, work, bands, radius : base } };
};

// THE LABELS ==========================================================================================================
// The items a scene names beside their dots, by the story's name for them.
export const SCENE_LABELS : Partial<Record<SceneId, string[]>> = {
    spread   : [ "Solar power systems", "Jasmine", "Milk", "Silver" ],
    answer   : [ "Milk", "Diesel", "Silver", "Solar power systems" ],
    cheaper  : [ "Solar power systems", "Anti-cancer drugs", "Blankets", "Colour TVs" ],
    doubled  : [ "Silver", "Tomatoes", "Coconuts", "Jasmine", "Wheat" ],
    majors   : [ "Jasmine", "Kerosene", "LPG", "Silver", "Milk" ],
    weighted : [ "Milk", "Diesel", "Electricity", "Silver", "Solar power systems" ],
    work     : [ "Solar power systems", "Colour TVs", "Silver", "Jasmine", "Milk", "Petrol" ],
};
export const labelledDots = (scene : SceneId) => (SCENE_LABELS[scene] ?? []).map(name => {
    const f = followedNamed(name);
    const i = ITEMS.findIndex(it => it.code === f.code);
    return { name, i };
});
// In the three rows the row names sit at the left, so a label there would cover them.
export const LABEL_CLEAR_LEFT = 300;

// The reference lines of a swarm: the base year, the basket as a whole, and in days of work the wage itself.
export const referenceLines = (scene : SceneId) =>
    scene === "work"
        ? [ { v : 100, label : "as many days’ work as in 2014-15" }, { v : 100 * WPI_RISE_IN_WAGE_WINDOW / WAGE_RISE, label : `the basket as a whole: ${Math.round(100 * WPI_RISE_IN_WAGE_WINDOW / WAGE_RISE)}` } ]
        : scene === "guess" || scene === "spread" || scene === "block"
            ? [ { v : 100, label : "₹100 in 2011-12" } ]
            : [ { v : 100, label : "₹100 in 2011-12" }, { v : HEADLINE.all, label : `the basket as a whole: ₹${Math.round(HEADLINE.all)}` } ];

export const COUNT_CHEAPER = COUNTS.cheaper;
