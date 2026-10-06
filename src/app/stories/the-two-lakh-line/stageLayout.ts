// The opening act's layouts: where each of the stage's dots sits in every scene, what colour it is, and when it
// moves. Pure functions of the scene and the stage's size, so the canvas engine (LineStage.tsx) only tweens and
// draws. One pool of dots serves every scene:
//   the deposit field    one dot per ten lakh bank accounts: 2,743 deposit accounts, 403 of them lit as loan accounts
//   the pyramid          the 403 loan dots stacked by loan size, counted by accounts, then weighed by money
//   the quarterly series one dot per crore accounts below the line, a column a quarter

// DATA ================================================================================================================
import {
    BAND_DOTS, BAND_HEAT, BANDS, BELOW_BANDS, DEPOSIT_DOTS, LOAN_DOTS, PEAK_INDEX, SERIES, SERIES_DOTS, STAGE_GROUPS,
    bandShares,
} from "./data";

export type SceneId =
    | "hero" | "save" | "borrow" | "groups"
    | "accounts" | "guess" | "money" | "top" | "priceMoney" | "priceAccounts"
    | "seriesStart" | "seriesGrowth" | "seriesPeak" | "seriesFall" | "seriesCards";

export const PYRAMID_SCENES : SceneId[] = [ "accounts", "guess", "money", "top", "priceMoney", "priceAccounts" ];
export const SERIES_SCENES  : SceneId[] = [ "seriesStart", "seriesGrowth", "seriesPeak", "seriesFall", "seriesCards" ];
export const isPyramid = (s : SceneId) => PYRAMID_SCENES.includes(s);
export const isSeries  = (s : SceneId) => SERIES_SCENES.includes(s);

// THE STAGE'S COLOURS =================================================================================================
// The stage draws in the site's own chart scheme (src/components/charts/chartConfig.ts), resolved for the page's theme
// in LineStage: the emphasis hue for the small loans, the de-emphasis grey for everything else, the scheme's cool and
// warm poles either side of a grey for the price, and greys from the ink for the unlit and the lost.
export type RGB = [ number, number, number ];
export interface StagePalette {
    field  : RGB;    // the deposit accounts, unlit
    emph   : RGB;    // loans; the loans at or below the line; the lit quarters
    deemph : RGB;    // the loans above the line
    top    : RGB;    // the loans above ₹100 crore, when they are the point
    cool   : RGB;    // lent under 8%
    mid    : RGB;    // 8 to 13%
    warm   : RGB;    // 13% or more
    faint  : RGB;    // quarters not yet reached
    ring   : RGB;    // the accounts lost since the peak
}
// Kept for the engine's type: the stage draws no halos.
export const HALO = { none : 0 } as const;

export interface Target {
    x : number; y : number; r : number;
    c : RGB; a : number;                    // colour and opacity
    glow : number; halo : number;           // halo strength 0–1 and which halo
    ring : boolean;                         // a hollow ring rather than a disc
    twinkle : boolean;                      // a slow shimmer while idle
    hold : boolean;                         // hidden dots stay where they are and drift down as they fade
    pop : boolean;                          // swell and settle on arrival: a dot lighting up
    delay : number; dur : number;           // ms before moving, and for how long
}
export interface Spawn { x : number; y : number; r : number; c : RGB; a : number; ring : boolean }

export interface Frame { w : number; h : number }
export interface Region { x : number; y : number; w : number; h : number }
export const isMobile = (f : Frame) => f.w < 900;

// THE POOL ============================================================================================================
const mulberry = (seed : number) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffled = (n : number, rnd : () => number) => {
    const a = Array.from({ length : n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ a[i], a[j] ] = [ a[j], a[i] ]; }
    return a;
};

// The quarterly scenes' slots: a column per quarter, one dot per whole crore, a part-lit dot for the fraction.
interface SeriesSlot { k : number; j : number; part : number }
const SERIES_SLOTS : SeriesSlot[] = [];
SERIES_DOTS.forEach((q, k) => {
    for (let j = 0; j < q.whole; j++) SERIES_SLOTS.push({ k, j, part : 1 });
    if (q.frac >= 0.05) SERIES_SLOTS.push({ k, j : q.whole, part : q.frac });
});
const LAST = SERIES_DOTS[SERIES_DOTS.length - 1];
export const LOST_DOTS = Math.round(SERIES.fewer / 1e7);

export const POOL = Math.max(DEPOSIT_DOTS, SERIES_SLOTS.length + LOST_DOTS);

const rnd = mulberry(20260930);
// Each dot's population group and whether it is a loan dot: the first loanDots of each group's deposit dots.
const GROUP_OF = new Int8Array(POOL).fill(-1);
const IS_LOAN  = new Uint8Array(POOL);
const FILL_IN_GROUP = new Int32Array(POOL).fill(-1);
{
    let k = 0;
    STAGE_GROUPS.forEach((g, gi) => {
        for (let j = 0; j < g.depositDots; j++, k++) { GROUP_OF[k] = gi; IS_LOAN[k] = j < g.loanDots ? 1 : 0; FILL_IN_GROUP[k] = j; }
    });
}
const LOANS = Array.from({ length : POOL }, (_, i) => i).filter(i => IS_LOAN[i]);
if (LOANS.length !== LOAN_DOTS) throw new Error(`stage: ${LOANS.length} loan dots, the pyramid needs ${LOAN_DOTS}`);

// Where each deposit dot sits in the field: a seeded shuffle, so the groups and the loans are scattered through it.
const FIELD_SLOT = shuffled(DEPOSIT_DOTS, rnd);
// Per-dot jitter and idle rhythm.
const JX = Float32Array.from({ length : POOL }, () => rnd() - 0.5);
const JY = Float32Array.from({ length : POOL }, () => rnd() - 0.5);
const SEED = Float32Array.from({ length : POOL }, () => rnd());

// The quarterly slots: the 403 loan dots take a seeded scatter of them, the other dots fill the rest in order.
const SERIES_SLOT_OF = new Int32Array(POOL).fill(-1);
{
    const order = shuffled(SERIES_SLOTS.length, rnd);
    const used = new Uint8Array(SERIES_SLOTS.length);
    LOANS.forEach((dot, i) => { if (i < order.length) { SERIES_SLOT_OF[dot] = order[i]; used[order[i]] = 1; } });
    let next = 0;
    for (let dot = 0; dot < POOL; dot++) {
        if (IS_LOAN[dot]) continue;
        while (next < used.length && used[next]) next++;
        if (next >= used.length) break;
        SERIES_SLOT_OF[dot] = next; used[next] = 1;
    }
}
// The rings that fall away in the last quarterly scene: the first dots with no slot of their own.
const LOST_OF : number[] = [];
for (let dot = 0; dot < POOL && LOST_OF.length < LOST_DOTS; dot++) if (SERIES_SLOT_OF[dot] < 0 && !IS_LOAN[dot]) LOST_OF.push(dot);

export const dotRhythm = (i : number) => SEED[i];

// REGIONS =============================================================================================================
// The dots keep to the left of the cards on a wide screen and to the top on a phone, where the cards come up from
// the bottom.
export const regionOf = (f : Frame, scene : SceneId) : Region => {
    if (scene === "hero") return { x : 10, y : 10, w : f.w - 20, h : f.h - 20 };
    if (isMobile(f)) {
        const top = SERIES_SCENES.includes(scene) ? 96 : 58;
        return { x : 14, y : top, w : f.w - 28, h : Math.max(180, f.h * 0.56 - top) };
    }
    const cardW = Math.min(440, f.w * 0.34);
    return { x : 56, y : 84, w : f.w - cardW - 56 - 88, h : f.h - 84 - 70 };
};

const gridIn = (r : Region, n : number) => {
    const cols = Math.max(1, Math.round(Math.sqrt((n * r.w) / r.h)));
    const rows = Math.ceil(n / cols);
    const pitch = Math.min(r.w / cols, r.h / rows);
    const ox = r.x + (r.w - cols * pitch) / 2, oy = r.y + (r.h - rows * pitch) / 2;
    return { pitch, at : (i : number) : [ number, number ] => [ ox + ((i % cols) + 0.5) * pitch, oy + (Math.floor(i / cols) + 0.5) * pitch ] };
};

// THE GROUPS ==========================================================================================================
export interface GroupsGeometry {
    pitch : number;
    clusters : { x : number; w : number; top : number; bottom : number; cols : number }[];
    at : (dot : number) => [ number, number ];
}
export const groupsGeometry = (r : Region, mobile : boolean) : GroupsGeometry => {
    const n = STAGE_GROUPS.length, labelH = mobile ? 46 : 76, gap = mobile ? 10 : 34;
    const cw = (r.w - gap * (n - 1)) / n;
    const maxDots = Math.max(...STAGE_GROUPS.map(g => g.depositDots));
    let p = Math.min(cw / 5, mobile ? 9 : 15);
    for (; p > 2; p -= 0.2) {
        const cols = Math.floor(cw / p);
        if (Math.ceil(maxDots / cols) * p <= r.h - labelH) break;
    }
    const cols = Math.max(1, Math.floor(cw / p));
    const bottom = r.y + r.h;
    const clusters = STAGE_GROUPS.map((g, gi) => {
        const x = r.x + gi * (cw + gap) + (cw - cols * p) / 2;
        return { x, w : cols * p, top : bottom - Math.ceil(g.depositDots / cols) * p, bottom, cols };
    });
    const at = (dot : number) : [ number, number ] => {
        const c = clusters[GROUP_OF[dot]], f = FILL_IN_GROUP[dot];
        return [ c.x + ((f % cols) + 0.5) * p, bottom - (Math.floor(f / cols) + 0.5) * p ];
    };
    return { pitch : p, clusters, at };
};

// THE PYRAMID =========================================================================================================
// Thirteen band slots, smallest loans at the bottom, each tall enough for its dots whether they are counted by accounts
// or weighed by money, so the labels never move and only the dots do. The line sits in a wider gap above the last
// band at or below ₹2 lakh.
const LAST_BELOW = Math.max(...BELOW_BANDS);
export type PyramidView = "accounts" | "money";
export interface PyramidGeometry {
    perRow : number; pitch : number; cx : number; left : number; right : number;
    slots : { bottom : number; top : number; mid : number }[];
    lineY : number; headerY : number; labelX : number; valueX : number;
    fillStart : Record<PyramidView, number[]>;
    at : (view : PyramidView, fill : number) => [ number, number, number ];   // x, y, band
}
export const pyramidGeometry = (r : Region, mobile : boolean) : PyramidGeometry => {
    const labelL = mobile ? 66 : 150, labelR = mobile ? 44 : 104, headerH = mobile ? 26 : 34;
    const availW = r.w - labelL - labelR, availH = r.h - headerH;
    const GAP_U = 0.7, LINE_U = 2.8;
    let best = { perRow : 36, rows : [] as number[], pitch : 0 };
    for (const perRow of [ 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12 ]) {
        const rows = BANDS.map((_, b) => Math.max(1, Math.ceil(BAND_DOTS.accounts[b] / perRow), Math.ceil(BAND_DOTS.money[b] / perRow)));
        const units = rows.reduce((s, v) => s + v, 0) + (BANDS.length - 1) * GAP_U + (LINE_U - GAP_U);
        const pitch = Math.min(availW / perRow, availH / units, mobile ? 12 : 19);
        if (pitch > best.pitch + 0.01) best = { perRow, rows, pitch };
    }
    const { perRow, rows, pitch } = best;
    const cx = r.x + labelL + availW / 2;
    const slots : PyramidGeometry["slots"] = [];
    let y = r.y + r.h, lineY = 0;
    for (let b = 0; b < BANDS.length; b++) {
        const top = y - rows[b] * pitch;
        slots.push({ bottom : y, top, mid : (y + top) / 2 });
        if (b === LAST_BELOW) lineY = top - (LINE_U * pitch) / 2;
        y = top - (b === LAST_BELOW ? LINE_U : GAP_U) * pitch;
    }
    const half = (perRow * pitch) / 2;
    const starts = (counts : number[]) => counts.reduce<number[]>((acc, v, i) => { acc.push(i ? acc[i - 1] + counts[i - 1] : 0); return acc; }, []);
    const fillStart = { accounts : starts(BAND_DOTS.accounts), money : starts(BAND_DOTS.money) };
    const at = (view : PyramidView, fill : number) : [ number, number, number ] => {
        const st = fillStart[view], counts = BAND_DOTS[view];
        let b = 0;
        while (b < BANDS.length - 1 && fill >= st[b] + counts[b]) b++;
        const f = fill - st[b], n = counts[b];
        const row = Math.floor(f / perRow), inRow = f % perRow;
        const rowCount = Math.min(perRow, n - row * perRow);
        const lift = ((rows[b] - Math.max(1, Math.ceil(n / perRow))) / 2) * pitch;   // centre the used rows in the slot
        return [ cx + (inRow - (rowCount - 1) / 2) * pitch, slots[b].bottom - lift - (row + 0.5) * pitch, b ];
    };
    return { perRow, pitch, cx, left : cx - half, right : cx + half, slots, lineY, headerY : y + GAP_U * pitch - 8, labelX : cx - half - 14, valueX : cx + half + 14, fillStart, at };
};

// Which accounts-fill each loan dot takes: the loan dots sorted by where they stand in the groups scene, left to
// right, matched to the pyramid's slots sorted the same way, so they gather rather than cross. Its money slot is
// the one with the same fill number, so the pile turns over upwards.
const fillOfDot = (g : GroupsGeometry, p : PyramidGeometry) => {
    const dots = [ ...LOANS ].sort((a, b) => { const [ ax, ay ] = g.at(a), [ bx, by ] = g.at(b); return ax - bx || by - ay; });
    const fills = Array.from({ length : LOAN_DOTS }, (_, f) => f).sort((a, b) => {
        const [ ax, ay ] = p.at("accounts", a), [ bx, by ] = p.at("accounts", b); return ax - bx || by - ay;
    });
    const out = new Map<number, number>();
    dots.forEach((dot, i) => out.set(dot, fills[i]));
    return out;
};

// A band's price class at a fill position: its hottest dots at the bottom of the band, then the middle, then the cool.
const heatAt = (view : PyramidView, p : PyramidGeometry, fill : number) => {
    const [ , , b ] = p.at(view, fill);
    const f = fill - p.fillStart[view][b];
    const [ cool, mid, hot ] = BAND_HEAT[view][b];
    void cool;
    return f < hot ? 2 : f < hot + mid ? 1 : 0;
};

// THE SERIES ==========================================================================================================
export interface SeriesGeometry {
    colPitch : number; rowPitch : number; base : number; r : Region;
    shareTop : number; shareH : number;
    x : (k : number) => number; y : (j : number) => number; yShare : (v : number) => number;
}
export const SHARE_MAX = 10;   // the money panel's scale: rupees in every hundred, from nought
export const seriesGeometry = (r : Region, mobile : boolean) : SeriesGeometry => {
    const Q = SERIES_DOTS.length, shareH = mobile ? 54 : 88, axisH = mobile ? 24 : 30, gap = mobile ? 18 : 30;
    const colPitch = r.w / Q;
    const maxDots = Math.ceil(Math.max(...SERIES_DOTS.map(s => s.value)));
    const rowPitch = Math.min(colPitch * 1.15, (r.h - shareH - gap - axisH) / maxDots);
    const base = r.y + r.h - axisH;
    return {
        colPitch, rowPitch, base, r, shareTop : r.y, shareH,
        x : k => r.x + (k + 0.5) * colPitch,
        y : j => base - (j + 0.5) * rowPitch,
        yShare : v => r.y + shareH - (v / SHARE_MAX) * shareH,
    };
};

// THE SCENES ==========================================================================================================
export interface Layout {
    region : Region;
    targets : Target[];
    groups ? : GroupsGeometry;
    pyramid ? : PyramidGeometry;
    series ? : SeriesGeometry;
    spawn ? : Map<number, Spawn>;   // dots that appear from somewhere of their own when the scene is entered
}

const T = (x : number, y : number, r : number, c : RGB, a : number, o : Partial<Target> = {}) : Target =>
    ({ x, y, r, c, a, glow : 0, halo : HALO.none, ring : false, twinkle : false, hold : false, pop : false, delay : 0, dur : 900, ...o });
const hidden = (o : Partial<Target> = {}) : Target => T(0, 18, 0, [ 128, 128, 128 ], 0, { hold : true, dur : 700, ...o });

export const layoutScene = (scene : SceneId, frame : Frame, litThrough : number, pal : StagePalette) : Layout => {
    const mobile = isMobile(frame);
    const region = regionOf(frame, scene);
    const targets : Target[] = new Array(POOL);

    // The field: the deposit accounts, scattered; in the hero the middle clears for the title.
    if (scene === "hero" || scene === "save" || scene === "borrow") {
        const g = gridIn(region, DEPOSIT_DOTS);
        const cx = frame.w / 2, cy = frame.h / 2;
        for (let i = 0; i < POOL; i++) {
            if (i >= DEPOSIT_DOTS) { targets[i] = hidden(); continue; }
            const [ gx, gy ] = g.at(FIELD_SLOT[i]);
            const x = gx + JX[i] * g.pitch * 0.55, y = gy + JY[i] * g.pitch * 0.55;
            const lit = scene === "borrow" && IS_LOAN[i] === 1;
            if (scene === "hero") {
                const d = Math.hypot((x - cx) / (frame.w * 0.5), (y - cy) / (frame.h * 0.5));
                const clear = Math.min(1, Math.max(0, (d - 0.22) / 0.5));
                targets[i] = T(x, y, g.pitch * 0.22, pal.field, 0.08 + 0.5 * clear, { twinkle : true, delay : SEED[i] * 1400, dur : 1200 });
            } else if (lit) {
                targets[i] = T(x, y, g.pitch * 0.34, pal.emph, 1, { pop : true, delay : 200 + SEED[i] * 1700, dur : 620 });
            } else {
                targets[i] = T(x, y, g.pitch * 0.26, pal.field, scene === "save" ? 1 : 0.7, { twinkle : scene === "save", delay : SEED[i] * 350, dur : 1000 });
            }
        }
        return { region, targets };
    }

    // The population groups: each a column of deposit dots with its loan dots lit at the foot.
    if (scene === "groups") {
        const g = groupsGeometry(region, mobile);
        for (let i = 0; i < POOL; i++) {
            if (i >= DEPOSIT_DOTS) { targets[i] = hidden(); continue; }
            const [ x, y ] = g.at(i);
            targets[i] = IS_LOAN[i]
                ? T(x, y, g.pitch * 0.36, pal.emph, 1, { delay : SEED[i] * 500, dur : 1300 })
                : T(x, y, g.pitch * 0.3, pal.field, 0.85, { delay : SEED[i] * 500, dur : 1300 });
        }
        return { region, targets, groups : g };
    }

    // The pyramid: the loan dots by loan size, counted by accounts or weighed by money, coloured by the line or by price.
    if (isPyramid(scene)) {
        const gg = groupsGeometry(regionOf(frame, "groups"), mobile);
        const p = pyramidGeometry(region, mobile);
        const fills = fillOfDot(gg, p);
        const view : PyramidView = scene === "money" || scene === "top" || scene === "priceMoney" ? "money" : "accounts";
        const heat = scene === "priceMoney" || scene === "priceAccounts";
        const r = p.pitch * 0.36;
        for (let i = 0; i < POOL; i++) {
            if (!IS_LOAN[i]) { targets[i] = hidden({ delay : SEED[i] * 400 }); continue; }
            const fill = fills.get(i)!;
            const [ x, y, b ] = p.at(view, fill);
            const below = BELOW_BANDS.includes(b);
            // arrival: a wave from the bottom up into money, from the top down back into accounts
            const wave = scene === "money" ? fill * 2.2 : scene === "priceAccounts" ? (LOAN_DOTS - fill) * 2 : scene === "priceMoney" ? (1 - (y - region.y) / region.h) * 520 : fill * 1.4 + SEED[i] * 160;
            const dur = scene === "top" || scene === "priceMoney" ? 650 : 1150;
            if (heat) {
                const cls = heatAt(view, p, fill);
                targets[i] = T(x, y, r, cls === 2 ? pal.warm : cls === 1 ? pal.mid : pal.cool, 1, { delay : wave, dur });
            } else if (scene === "top") {
                const topBand = b === BANDS.length - 1;
                targets[i] = T(x, y, r, topBand ? pal.top : below ? pal.emph : pal.deemph, topBand ? 1 : 0.18, { pop : topBand, delay : topBand ? SEED[i] * 300 : 0, dur });
            } else {
                targets[i] = T(x, y, r, below ? pal.emph : pal.deemph, 1, { delay : wave, dur });
            }
        }
        return { region, targets, pyramid : p };
    }

    // The quarterly series: columns of dots lit up to the quarter the reader has scrolled to.
    const s = seriesGeometry(region, mobile);
    const rr = Math.min(s.colPitch, s.rowPitch) * 0.36;
    const fromPyramid = scene === "seriesStart";
    for (let i = 0; i < POOL; i++) {
        const slot = SERIES_SLOT_OF[i];
        if (slot < 0) { targets[i] = hidden(); continue; }
        const { k, j, part } = SERIES_SLOTS[slot];
        const lit = k <= litThrough;
        const a = lit ? 0.3 + 0.7 * part : 0.35 + 0.65 * part;
        targets[i] = T(s.x(k), s.y(j), rr, lit ? pal.emph : pal.faint, a, {
            pop : lit && !fromPyramid,
            delay : fromPyramid ? (IS_LOAN[i] ? SEED[i] * 600 : 650 + SEED[i] * 700) : j * 12,
            dur : fromPyramid ? (IS_LOAN[i] ? 1400 : 800) : 460,
        });
    }
    // The last scene: rings for the accounts lost since the peak rise off the latest column and fall away.
    let spawn : Map<number, Spawn> | undefined;
    if (scene === "seriesFall" || scene === "seriesCards") {
        spawn = new Map();
        const k = SERIES_DOTS.length - 1, base = LAST.whole + (LAST.frac >= 0.05 ? 1 : 0);
        LOST_OF.forEach((dot, n) => {
            const x = s.x(k), y = s.y(base + n);
            spawn!.set(dot, { x, y, r : rr, c : pal.ring, a : 0.95, ring : true });
            targets[dot] = T(x, y + 90, rr, pal.ring, 0, { ring : true, delay : 500 + n * 160, dur : 1800 });
        });
    }
    return { region, targets, series : s, spawn };
};

// The value beside each band in a pyramid scene, and what it is a share of.
export const bandValue = (scene : SceneId, b : number) => {
    if (scene === "money" || scene === "top") return bandShares(b).outstanding;
    if (scene === "priceMoney") return BANDS[b].amtAtLeast13 ?? 0;
    if (scene === "priceAccounts") return BANDS[b].accAtLeast13 ?? 0;
    return bandShares(b).accounts;
};
export const bandHeader = (scene : SceneId) =>
    scene === "money" || scene === "top" ? "share of the money"
        : scene === "priceMoney" ? "money lent at 13% or more"
            : scene === "priceAccounts" ? "loans costing 13% or more"
                : "share of loans";

export const bandHeaderShort = (scene : SceneId) =>
    scene === "money" || scene === "top" ? "money" : scene === "priceMoney" || scene === "priceAccounts" ? "13%+" : "loans";

export const PEAK_K = PEAK_INDEX;
