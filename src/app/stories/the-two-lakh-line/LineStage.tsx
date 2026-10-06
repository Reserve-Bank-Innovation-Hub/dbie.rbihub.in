"use client";

// The opening act's stage: one canvas of dots that re-form scene by scene (stageLayout.ts says where), with the
// labels, the line and the quarterly axes drawn over it in HTML and SVG so they stay sharp and readable. The engine
// tweens every dot from wherever it is to its next target; it runs only while the stage is on screen.

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// LIB =================================================================================================================
import { resolveScheme } from "@/components/charts/chartConfig";
import { fictoanColour } from "@/lib/fictoan-colours";

// DATA ================================================================================================================
import {
    BAND_NAMES, BAND_SHORT, BANDS, LOAN_DOTS, PEAK_INDEX, PRICE, SERIES_DOTS, SMALLEST, STAGE_GROUPS, WALR, bandShares, crore, lakhCrore,
    monthName, pct, rupees,
} from "./data";
import {
    POOL, SHARE_MAX, bandHeader, bandHeaderShort, bandValue, dotRhythm, isMobile, isPyramid, isSeries, layoutScene,
    type GroupsGeometry, type PyramidGeometry, type RGB, type SceneId, type SeriesGeometry, type Spawn, type StagePalette, type Target,
} from "./stageLayout";
import { AnimatedNumber } from "./Motion";

const TAU = Math.PI * 2;
const ease = (t : number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const near = (a : number, b : number) => Math.abs(a - b) < 0.01;

// THE ENGINE ==========================================================================================================
class DotEngine {
    n : number;
    x; y; r; a; cr; cg; cb; glow : Float32Array;
    fx; fy; fr; fa; fcr; fcg; fcb; fglow : Float32Array;
    tx; ty; tr; ta; tcr; tcg; tcb; tglow : Float32Array;
    t0 : Float64Array; dur : Float32Array;
    ring; twinkle; hold; pop : Uint8Array;
    seed : Float32Array;

    constructor(n : number) {
        this.n = n;
        const f = () => new Float32Array(n), u = () => new Uint8Array(n);
        this.x = f(); this.y = f(); this.r = f(); this.a = f(); this.cr = f(); this.cg = f(); this.cb = f(); this.glow = f();
        this.fx = f(); this.fy = f(); this.fr = f(); this.fa = f(); this.fcr = f(); this.fcg = f(); this.fcb = f(); this.fglow = f();
        this.tx = f(); this.ty = f(); this.tr = f(); this.ta = f(); this.tcr = f(); this.tcg = f(); this.tcb = f(); this.tglow = f();
        this.t0 = new Float64Array(n); this.dur = f();
        this.ring = u(); this.twinkle = u(); this.hold = u(); this.pop = u();
        this.seed = Float32Array.from({ length : n }, (_, i) => dotRhythm(i));
    }

    // Put every dot on its target at once, invisible, so the first scene can fade in from where it will stand.
    place(ts : Target[]) {
        for (let i = 0; i < this.n; i++) {
            const t = ts[i];
            const x = t.hold ? 0 : t.x, y = t.hold ? 0 : t.y;
            this.x[i] = this.fx[i] = this.tx[i] = x; this.y[i] = this.fy[i] = this.ty[i] = y;
            this.r[i] = this.fr[i] = this.tr[i] = t.r;
            this.cr[i] = this.fcr[i] = this.tcr[i] = t.c[0]; this.cg[i] = this.fcg[i] = this.tcg[i] = t.c[1]; this.cb[i] = this.fcb[i] = this.tcb[i] = t.c[2];
            this.a[i] = this.fa[i] = this.ta[i] = 0; this.glow[i] = this.fglow[i] = this.tglow[i] = 0;
            this.ring[i] = t.ring ? 1 : 0; this.twinkle[i] = t.twinkle ? 1 : 0; this.hold[i] = t.hold ? 1 : 0; this.pop[i] = 0;
            this.dur[i] = 0; this.t0[i] = 0;
        }
    }

    // Move every dot whose target has changed, from wherever it is now.
    set(ts : Target[], now : number, reduced : boolean, spawn ? : Map<number, Spawn>, snap = false) {
        for (let i = 0; i < this.n; i++) {
            const t = ts[i];
            const sp = spawn?.get(i);
            if (sp) {
                this.x[i] = sp.x; this.y[i] = sp.y; this.r[i] = sp.r; this.a[i] = sp.a; this.glow[i] = 0;
                this.cr[i] = sp.c[0]; this.cg[i] = sp.c[1]; this.cb[i] = sp.c[2]; this.ring[i] = sp.ring ? 1 : 0;
            }
            let tx = t.x, ty = t.y;
            if (t.hold) {
                if (this.hold[i] && this.ta[i] === 0) continue;                 // already hidden
                tx = this.x[i]; ty = this.y[i] + (this.a[i] > 0.01 ? t.y : 0);    // fade where it stands, drifting down
            } else if (!sp && !this.hold[i] && near(this.tx[i], tx) && near(this.ty[i], ty) && near(this.tr[i], t.r)
                && near(this.ta[i], t.a) && near(this.tglow[i], t.glow) && this.tcr[i] === t.c[0] && this.tcg[i] === t.c[1] && this.tcb[i] === t.c[2]) {
                continue;                                                         // unchanged
            }
            this.fx[i] = this.x[i]; this.fy[i] = this.y[i]; this.fr[i] = this.r[i]; this.fa[i] = this.a[i];
            this.fcr[i] = this.cr[i]; this.fcg[i] = this.cg[i]; this.fcb[i] = this.cb[i]; this.fglow[i] = this.glow[i];
            this.tx[i] = tx; this.ty[i] = ty; this.tr[i] = t.r; this.ta[i] = t.a;
            this.tcr[i] = t.c[0]; this.tcg[i] = t.c[1]; this.tcb[i] = t.c[2]; this.tglow[i] = t.glow;
            this.t0[i] = now + (reduced || snap ? 0 : t.delay); this.dur[i] = reduced || snap ? 0 : t.dur;
            this.pop[i] = t.pop && !reduced && !snap ? 1 : 0;
            if (!sp) this.ring[i] = t.ring ? 1 : this.ring[i] && t.hold ? 1 : 0;
            this.twinkle[i] = t.twinkle ? 1 : 0; this.hold[i] = t.hold ? 1 : 0;
        }
    }

    step(now : number) {
        for (let i = 0; i < this.n; i++) {
            const d = this.dur[i];
            let p = d <= 0 ? 1 : (now - this.t0[i]) / d;
            p = p < 0 ? 0 : p > 1 ? 1 : p;
            const e = ease(p);
            this.x[i] = this.fx[i] + (this.tx[i] - this.fx[i]) * e;
            this.y[i] = this.fy[i] + (this.ty[i] - this.fy[i]) * e;
            // a dot that lights up swells a little and settles
            this.r[i] = (this.fr[i] + (this.tr[i] - this.fr[i]) * e) * (this.pop[i] && p > 0 && p < 1 ? 1 + 0.55 * Math.sin(p * Math.PI) : 1);
            this.a[i] = this.fa[i] + (this.ta[i] - this.fa[i]) * e;
            this.cr[i] = this.fcr[i] + (this.tcr[i] - this.fcr[i]) * e;
            this.cg[i] = this.fcg[i] + (this.tcg[i] - this.fcg[i]) * e;
            this.cb[i] = this.fcb[i] + (this.tcb[i] - this.fcb[i]) * e;
            this.glow[i] = this.fglow[i] + (this.tglow[i] - this.fglow[i]) * e;
        }
    }

    draw(ctx : CanvasRenderingContext2D, now : number, reduced : boolean) {
        const { x, y, r, a, cr, cg, cb, ring, twinkle, seed } = this;
        // discs, batched by colour
        const buckets = new Map<string, number[]>();
        for (let i = 0; i < this.n; i++) {
            if (ring[i] || a[i] < 0.01 || r[i] < 0.2) continue;
            let al = a[i];
            if (twinkle[i] && !reduced) al *= 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 0.001 * (0.45 + seed[i]) + seed[i] * 57));
            const key = `${cr[i] | 0},${cg[i] | 0},${cb[i] | 0},${Math.round(al * 32) / 32}`;
            const list = buckets.get(key);
            if (list) list.push(i); else buckets.set(key, [ i ]);
        }
        for (const [ key, list ] of buckets) {
            ctx.fillStyle = `rgba(${key})`;
            ctx.beginPath();
            for (const i of list) { ctx.moveTo(x[i] + r[i], y[i]); ctx.arc(x[i], y[i], r[i], 0, TAU); }
            ctx.fill();
        }
        // rings: the accounts lost since the peak
        ctx.lineWidth = 1.5;
        for (let i = 0; i < this.n; i++) {
            if (!ring[i] || a[i] < 0.01) continue;
            ctx.strokeStyle = `rgba(${cr[i] | 0},${cg[i] | 0},${cb[i] | 0},${a[i]})`;
            ctx.beginPath(); ctx.arc(x[i], y[i], Math.max(1, r[i] - 0.75), 0, TAU); ctx.stroke();
        }
    }
}

// THE PALETTE =========================================================================================================
// The site's chart scheme for the page's theme: emphasis and de-emphasis, the cool and warm poles, and the ink, with
// greys from the same ladder for the unlit dots. The same scheme every chart on the site draws with.
const rgbOf = (hex : string) : RGB => [ parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16) ];
export const stagePalette = (theme : string) : StagePalette => {
    const dark = theme === "theme-dark";
    const s = resolveScheme("line", undefined, theme);
    return {
        field  : rgbOf(fictoanColour("grey", dark ? "dark40" : "light60")),
        emph   : rgbOf(s.emphasis),
        deemph : rgbOf(s.deemphasis),
        top    : rgbOf(s.ink.primary),
        cool   : rgbOf(s.positive),
        mid    : rgbOf(fictoanColour("grey", dark ? "dark40" : "light70")),
        warm   : rgbOf(s.negative),
        faint  : rgbOf(fictoanColour("grey", dark ? "dark60" : "light80")),
        ring   : rgbOf(s.ink.secondary),
    };
};
const css = (c : RGB) => `rgb(${c.join(",")})`;

// WHAT EACH SCENE SAYS TO A SCREEN READER =============================================================================
const DESCRIBE : Record<SceneId, string> = {
    hero          : "The stage shows a field of faint dots.",
    save          : "Each dot on the stage is ten lakh bank deposit accounts.",
    borrow        : `${LOAN_DOTS} of the dots are lit, one for every ten lakh loan accounts.`,
    groups        : "The dots stand in four columns, for villages, small towns, cities and big cities, with the loans at the foot of each.",
    accounts      : "Only the loans remain, stacked by size with the smallest at the bottom, and the ₹2 lakh line runs across the stack.",
    guess         : "The loans are stacked by size, with the ₹2 lakh line across them.",
    money         : "The same loans are now weighed by money rather than counted, and only a few dots remain below the line.",
    top           : "The loans above ₹100 crore are picked out at the top of the stack.",
    priceMoney    : "The money is coloured by the interest rate it is lent at, with the lowest rates at the top and the highest at the bottom.",
    priceAccounts : "The stack is counted as loans again and coloured by interest rate, and the loans with the highest rates sit at the bottom.",
    seriesStart   : `There is a column of dots for each quarter since ${monthName(SERIES_DOTS[0].quarter)}, and each dot is a crore small loans.`,
    seriesGrowth  : "The columns grow taller quarter by quarter as the number of small loans rises.",
    seriesPeak    : `The number of small loans is at its highest in ${monthName(SERIES_DOTS[PEAK_INDEX].quarter)}.`,
    seriesFall    : "The columns are shorter after the high point, and hollow rings mark the loans that have gone.",
    seriesCards   : "The same columns; the card beside them splits the latest count into credit cards and other small loans.",
};

// THE STAGE ===========================================================================================================
interface Hover { x : number; y : number; head : string; lines : string[] }

const bandTip = (b : number, scene : SceneId) : Omit<Hover, "x" | "y"> => {
    const s = bandShares(b), band = BANDS[b];
    const lines = [
        `${crore(band.accounts)} loans, ${pct(s.accounts)} of all loans`,
        `${lakhCrore(band.outstanding)} lent, ${pct(s.outstanding)} of all the money`,
        `about ${rupees(s.averageLoan)} each on average${band.weightedRate !== null ? `, at about ${band.weightedRate.toFixed(1)}% a year` : ""}`,
    ];
    if (scene === "priceMoney" || scene === "priceAccounts") lines.push(`${pct(band.accAtLeast13 ?? 0, 0)} of these loans cost 13% or more`);
    return { head : `Loans of ${BAND_NAMES[b]}`, lines };
};

interface LineStageProps {
    scene     : SceneId;
    seriesPos : number;    // a continuous position in the quarterly series, 0 = the first quarter
}

export const LineStage = ({ scene, seriesPos } : LineStageProps) => {
    const wrapRef   = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<DotEngine | null>(null);
    const sizeRef   = useRef({ w : 0, h : 0 });
    const reducedRef = useRef(false);
    const shownRef  = useRef<{ scene : SceneId | null; w : number; h : number }>({ scene : null, w : 0, h : 0 });
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const [ hover, setHover ] = useState<Hover | null>(null);
    const [ theme ] = useTheme();
    const pal = useMemo(() => stagePalette(theme ?? "theme-light"), [ theme ]);

    const N = SERIES_DOTS.length;
    const pos = Math.max(0, Math.min(N - 1, seriesPos));
    const litThrough = isSeries(scene) ? Math.floor(pos + 1e-6) : -1;
    const layout = useMemo(() => (size.w ? layoutScene(scene, { w : size.w, h : size.h }, litThrough, pal) : null), [ scene, size.w, size.h, litThrough, pal ]);

    // The geometry each overlay last had, so a layer fades out where it stood rather than jumping.
    const lastGroups  = useRef<GroupsGeometry | undefined>(undefined);
    const lastPyramid = useRef<PyramidGeometry | undefined>(undefined);
    const lastSeries  = useRef<SeriesGeometry | undefined>(undefined);
    if (layout?.groups) lastGroups.current = layout.groups;
    if (layout?.pyramid) lastPyramid.current = layout.pyramid;
    if (layout?.series) lastSeries.current = layout.series;

    // ---- mount: the engine, the canvas size, the frame loop while visible --------------------------------------------
    useEffect(() => {
        reducedRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
        engineRef.current = new DotEngine(POOL);
        const canvas = canvasRef.current!, ctx = canvas.getContext("2d")!;

        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            const dpr = Math.min(devicePixelRatio || 1, width < 900 ? 1.5 : 2);
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            sizeRef.current = { w : width, h : height };
            setSize({ w : width, h : height });
        });
        ro.observe(wrapRef.current!);

        let visible = true, raf = 0;
        const loop = (t : number) => {
            raf = 0;
            if (!visible) return;
            const eng = engineRef.current!;
            eng.step(t);
            ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);
            eng.draw(ctx, t, reducedRef.current);
            raf = requestAnimationFrame(loop);
        };
        const io = new IntersectionObserver(([ e ]) => {
            visible = e.isIntersecting;
            if (visible && !raf) raf = requestAnimationFrame(loop);
        });
        io.observe(wrapRef.current!);
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
    }, []);

    // ---- targets: tween on a new scene, snap on a resize ----------------------------------------------------------
    useEffect(() => {
        const eng = engineRef.current;
        if (!layout || !eng) return;
        const now = performance.now(), shown = shownRef.current;
        if (shown.scene === null) {
            eng.place(layout.targets);
            eng.set(layout.targets, now, reducedRef.current);
        } else if (shown.scene === scene && (shown.w !== size.w || shown.h !== size.h)) {
            eng.set(layout.targets, now, reducedRef.current, undefined, true);
        } else {
            eng.set(layout.targets, now, reducedRef.current, shown.scene !== scene ? layout.spawn : undefined);
        }
        shownRef.current = { scene, w : size.w, h : size.h };
        setHover(null);
    }, [ layout, scene, size.w, size.h ]);

    // ---- hover: a band of the pyramid, a group's column, a quarter ----------------------------------------------------
    const onPointer = (e : RPointerEvent<HTMLDivElement>) => {
        if (!layout || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        const p = layout.pyramid, g = layout.groups, s = layout.series;
        if (p) {
            const b = p.slots.findIndex(sl => py <= sl.bottom + p.pitch * 0.35 && py >= sl.top - p.pitch * 0.35);
            if (b >= 0 && px >= p.labelX - 170 && px <= p.valueX + 90) { setHover({ x : px, y : py, ...bandTip(b, scene) }); return; }
        }
        if (g) {
            const c = g.clusters.findIndex(cl => px >= cl.x - 12 && px <= cl.x + cl.w + 12 && py >= cl.top - 70 && py <= cl.bottom + 6);
            if (c >= 0) {
                const gr = STAGE_GROUPS[c];
                setHover({ x : px, y : py, head : gr.label, lines : [ `${crore(gr.depositAccounts)} deposit accounts`, `${crore(gr.creditAccounts)} loans`, `${gr.ratio.toFixed(1)} deposit accounts for every loan` ] });
                return;
            }
        }
        if (s) {
            const k = Math.floor((px - s.r.x) / s.colPitch);
            if (k >= 0 && k < N && py >= s.shareTop - 12 && py <= s.base + 24) {
                const q = SERIES_DOTS[k];
                setHover({ x : px, y : py, head : q.quarter, lines : [ `${q.value.toFixed(1)} crore small loans`, `${q.borrowers.toFixed(0)} in every 100 loans`, `₹${q.share.toFixed(1)} of every ₹100 lent` ] });
                return;
            }
        }
        setHover(null);
    };

    // ---- the overlay -------------------------------------------------------------------------------------------------
    const mobile = isMobile(size);
    const onPyramid = isPyramid(scene), onGroups = scene === "groups", onSeries = isSeries(scene);
    const P = lastPyramid.current, G = lastGroups.current, S = lastSeries.current;
    const region = layout?.region;

    // ---- the price scene's annotations: a note for each colour, an arrow to the dots it describes ------------------
    const onPrice = scene === "priceMoney";
    const annotations = useMemo(() => {
        if (!onPrice || !layout?.pyramid) return null;
        const p = layout.pyramid, mob = isMobile(size);
        const same = (a : RGB, b : RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
        const inBand = (t : Target, b : number) => t.y >= p.slots[b].top - p.pitch * 0.5 && t.y <= p.slots[b].bottom + p.pitch * 0.5;
        // the end dot of a colour in a band: the rightmost or leftmost, or the rightmost of the band's top row
        const end = (b : number, colour : RGB, which : "left" | "right" | "topRight") => {
            const ts = layout.targets.filter(t => t.a > 0.5 && same(t.c, colour) && inBand(t, b));
            if (!ts.length) return null;
            const pool = which === "topRight" ? ts.filter(t => t.y - Math.min(...ts.map(u => u.y)) < 1) : ts;
            return pool.reduce((m, t) => ((which === "left" ? t.x < m.x : t.x > m.x) ? t : m));
        };
        const cardRate = WALR.find(w => w.key === "2026-03")?.creditCards ?? WALR[0].creditCards;
        const top = BANDS.length - 1;
        const notes = [
            { key : "cool", colour : pal.cool, title : "Blue: under 8% a year", body : `On loans above ₹100 crore, ₹${Math.round(PRICE.topMoneyUnder8)} of every ₹100 is lent at these rates.`, dot : end(top, pal.cool, "topRight"), from : "side" as const, far : true },
            { key : "crop", colour : null, title : "Cheaper money below the line", body : `₹${Math.round(PRICE.below7to9)} of every ₹100 below the line is lent at 7% to 9%, much of it crop loans at a subsidised 7%.`, dot : end(1, pal.cool, "left"), from : "above" as const, far : false },
            { key : "warm", colour : pal.warm, title : "Red: 13% or more a year", body : `Below the line, ₹${Math.round(PRICE.belowMoneyAt13)} of every ₹100 is lent at these rates.`, dot : end(1, pal.warm, "right"), from : "below" as const, far : false },
            { key : "small", colour : null, title : "Loans up to ₹25,000", body : `At least ${SMALLEST.weightedRate.toFixed(1)}% a year on average. The table’s top range is open, and holds credit cards at ${Math.round(cardRate)}%.`, dot : end(0, pal.warm, "right"), from : "below" as const, far : false },
        ].filter(n => n.dot);
        // where the arrow lands: beside, above or below the dot, clear of it
        const land = (n : { dot : Target | null; from : "side" | "above" | "below" }) => {
            const t = n.dot!, g = t.r + 3;
            return n.from === "side" ? { x : t.x + g, y : t.y } : { x : t.x, y : n.from === "above" ? t.y - g : t.y + g };
        };
        const reg = layout.region;
        const colX = Math.max(reg.x + reg.w + 56, p.valueX + 210);
        const desk = !mob && size.w - colX - 24 >= 200;
        if (desk) {
            // a column to the right of the pyramid, each note level with its dots, pushed apart where they would meet
            const w = Math.min(300, size.w - colX - 24), perLine = w / 6.6;
            const boxes = notes.map(n => {
                const h = 20 + 18 + Math.ceil(n.body.length / perLine) * 18;
                const a = land(n);
                const want = n.from === "side" ? a.y - 18 : n.from === "above" ? a.y - h - 20 : a.y + 6;
                return { n, a, h, y : want };
            }).sort((m, k) => m.y - k.y);
            for (let i = 1; i < boxes.length; i++) boxes[i].y = Math.max(boxes[i].y, boxes[i - 1].y + boxes[i - 1].h + 14);
            for (let i = boxes.length - 1; i >= 0; i--) {
                const floor = i === boxes.length - 1 ? size.h - 16 : boxes[i + 1].y - 14;
                boxes[i].y = Math.max(reg.y, Math.min(boxes[i].y, floor - boxes[i].h));
            }
            return boxes.map(({ n, a, y }) => {
                const sx = colX - 8, sy = y + 18;
                const c2 = n.from === "side" ? `${a.x + 60},${a.y}` : `${a.x},${a.y + (n.from === "above" ? -70 : 70)}`;
                return { key : n.key, colour : n.colour, title : n.title, body : n.body, x : colX, y, w, path : `M${sx},${sy} C${sx - 80},${sy} ${c2} ${a.x},${a.y}` };
            });
        }
        // a phone: the notes in two columns under the pyramid, arrows up to the dots near the bottom of it
        const gap = 10, w = (size.w - 28 - gap) / 2, perLine = w / 6.2;
        const freeTop = reg.y + reg.h + 18;
        const order = [ "warm", "crop", "small", "cool" ];
        const sorted = order.map(k => notes.find(n => n.key === k)).filter(Boolean) as typeof notes;
        const hs = sorted.map(n => 18 + 16 + Math.ceil(n.body.length / perLine) * 16);
        return sorted.map((n, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const y = freeTop + (row === 0 ? 0 : Math.max(hs[0], hs[1] ?? 0) + gap);
            const x = 14 + col * (w + gap);
            const a = land({ ...n, from : n.from === "side" ? "side" : "below" });
            const sx = x + w / 2, sy = y - 4;
            return { key : n.key, colour : n.colour, title : n.title, body : n.body, x, y, w, path : n.far || row > 0 ? null : `M${sx},${sy} C${sx},${sy - 40} ${a.x},${a.y + 40} ${a.x},${a.y}` };
        });
    }, [ onPrice, layout, size, pal ]);
    const lastAnnotations = useRef<typeof annotations>(null);
    if (annotations) lastAnnotations.current = annotations;
    const A = lastAnnotations.current;

    const keys : { colour : RGB; label : string; ring ? : boolean }[] =
        scene === "save" ? [ { colour : pal.field, label : "deposit accounts" } ]
            : scene === "borrow" || scene === "groups" ? [ { colour : pal.field, label : "deposit accounts" }, { colour : pal.emph, label : "loans" } ]
                : scene === "accounts" || scene === "guess" || scene === "money" ? [ { colour : pal.emph, label : "₹2 lakh or less" }, { colour : pal.deemph, label : "more than ₹2 lakh" } ]
                    : scene === "top" ? [ { colour : pal.top, label : "more than ₹100 crore" } ]
                        : scene === "priceMoney" || scene === "priceAccounts" ? [ { colour : pal.cool, label : "under 8%" }, { colour : pal.mid, label : "8 to 13%" }, { colour : pal.warm, label : "13% or more" } ]
                            : onSeries ? [ { colour : pal.emph, label : "small loans" }, ...(scene === "seriesFall" || scene === "seriesCards" ? [ { colour : pal.ring, label : "gone since the high point", ring : true } ] : []) ]
                                : [];
    const caption =
        scene === "save" || scene === "borrow" || scene === "groups" ? "Each dot is ten lakh bank accounts"
            : scene === "accounts" || scene === "guess" || scene === "priceAccounts" ? "Each dot is ten lakh loans, stacked by size"
                : scene === "money" || scene === "top" || scene === "priceMoney" ? "Each dot is an equal share of all the money lent"
                    : onSeries ? "Each dot is a crore small loans, quarter by quarter"
                        : "";

    // the quarterly overlay
    const shareLine = S ? SERIES_DOTS.map((q, k) => `${k ? "L" : "M"}${S.x(k).toFixed(1)} ${S.yShare(q.share).toFixed(1)}`).join(" ") : "";
    const shareArea = S ? `${shareLine} L${S.x(N - 1).toFixed(1)} ${(S.shareTop + S.shareH).toFixed(1)} L${S.x(0).toFixed(1)} ${(S.shareTop + S.shareH).toFixed(1)} Z` : "";
    const px = S ? S.r.x + (pos + 0.5) * S.colPitch : 0;
    // the badges ride the playhead but stay inside the stage: a centred badge stops half its width from the edge, and
    // the money badge flips to the playhead's left when there is no room on its right (the last quarters on a phone)
    const inside = (half : number) => Math.min(Math.max(px, half + 6), size.w - half - 6);
    const shareOnLeft = px + 10 + 52 > size.w - 6;
    const qi = Math.round(pos);
    const interp = (f : (k : number) => number) => { const lo = Math.floor(pos), hi = Math.min(N - 1, lo + 1), t = pos - lo; return f(lo) * (1 - t) + f(hi) * t; };
    const countNow = interp(k => SERIES_DOTS[k].value);
    const shareNow = interp(k => SERIES_DOTS[k].share);
    const ticks = SERIES_DOTS.map((q, k) => ({ q, k })).filter(({ q }) => q.key.endsWith("-03") && +q.key.slice(0, 4) % (mobile ? 3 : 2) === 0);
    const peakY = S ? S.y(Math.ceil(SERIES_DOTS[PEAK_INDEX].value) - 1) - S.rowPitch * 0.5 : 0;

    return (
        <div ref={wrapRef} className="line-stage" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setHover(null)}>
            <canvas ref={canvasRef} role="img" aria-label={DESCRIBE[scene]} />

            {/* caption and key, above the dots */}
            {region && (caption || keys.length > 0) && (
                <div className="stage-caption" style={{ left : region.x, top : mobile ? 12 : Math.max(18, region.y - 58) }}>
                    {caption && <div className="caption-text">{caption}</div>}
                    <div className="stage-keys">
                        {keys.map(k => (
                            <span key={k.label} className="stage-key">
                                <i className="key-dot" style={k.ring ? { boxShadow : `inset 0 0 0 1.5px ${css(k.colour)}` } : { background : css(k.colour) }} />{k.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* the groups: a label over each column */}
            <div className={`stage-layer ${onGroups ? "is-on" : ""}`} aria-hidden={!onGroups}>
                {G && STAGE_GROUPS.map((gr, i) => (
                    <div key={gr.label} className="cluster-label" style={{ transform : `translate(${G.clusters[i].x + G.clusters[i].w / 2}px, ${G.clusters[i].top - 10}px) translate(-50%, -100%)` }}>
                        <span className="cluster-name">{gr.label}</span>
                        <span className="cluster-ratio">{Math.round(gr.ratio)} to 1</span>
                        {!mobile && <span className="cluster-detail">deposit accounts to each loan</span>}
                    </div>
                ))}
            </div>

            {/* the pyramid: band names, their values, the line */}
            <div className={`stage-layer ${onPyramid ? "is-on" : ""}`} aria-hidden={!onPyramid}>
                {P && (
                    <>
                        <div className="band-header" style={{ transform : `translate(${P.labelX}px, ${P.headerY}px) translate(-100%, -100%)` }}>{mobile ? "size" : "loan size"}</div>
                        <div className="band-header" style={{ transform : `translate(${P.valueX}px, ${P.headerY}px) translate(${mobile ? "-60%" : "0"}, -100%)` }}>{mobile ? bandHeaderShort(scene) : bandHeader(scene)}</div>
                        {BANDS.map((b, i) => (
                            <div key={b.label}>
                                <div className={`band-label ${i === BANDS.length - 1 && scene === "top" ? "is-lit" : ""}`} style={{ transform : `translate(${P.labelX}px, ${P.slots[i].mid}px) translate(-100%, -50%)` }}>
                                    {mobile ? BAND_SHORT[i] : BAND_NAMES[i]}
                                </div>
                                <div className="band-value" style={{ transform : `translate(${P.valueX}px, ${P.slots[i].mid}px) translateY(-50%)` }}>
                                    <AnimatedNumber value={bandValue(scene, i)} format={v => (v > 0 && v < 0.05 ? "<0.1%" : `${v.toFixed(mobile && v >= 1 ? 0 : 1)}%`)} />
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
            <svg className={`stage-svg stage-layer ${onPyramid ? "is-on" : ""}`} width={size.w} height={size.h} aria-hidden="true">
                {P && region && (
                    <line className={`the-line ${onPyramid ? "is-drawn" : ""}`} x1={region.x - 8} x2={region.x + region.w + 8} y1={P.lineY} y2={P.lineY} pathLength={1} />
                )}
            </svg>
            {P && region && (
                <div className={`line-label ${onPyramid ? "is-on" : ""}`} style={{ transform : `translate(${P.cx}px, ${P.lineY}px) translate(-50%, -50%)` }}>
                    the ₹2 lakh line
                </div>
            )}

            {/* the price scene: a note for each colour, with an arrow to its dots */}
            <svg className={`stage-svg stage-layer annot-layer ${onPrice ? "is-on" : ""}`} width={size.w} height={size.h} aria-hidden="true">
                <defs>
                    <marker id="annot-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0,1 L10,5 L0,9 z" className="annot-head" />
                    </marker>
                </defs>
                {A?.map(a => a.path && <path key={a.key} d={a.path} className="annot-arrow" markerEnd="url(#annot-head)" />)}
            </svg>
            <div className={`stage-layer annot-layer ${onPrice ? "is-on" : ""}`} aria-hidden={!onPrice}>
                {A?.map(a => (
                    <div key={a.key} className="annot" style={{ transform : `translate(${a.x}px, ${a.y}px)`, width : a.w }}>
                        <div className="annot-title">{a.colour && <i className="key-dot" style={{ background : css(a.colour) }} />}{a.title}</div>
                        <div className="annot-body">{a.body}</div>
                    </div>
                ))}
            </div>

            {/* the quarterly series: the money panel, the axis, the playhead */}
            <svg className={`stage-svg stage-layer ${onSeries ? "is-on" : ""}`} width={size.w} height={size.h} aria-hidden="true">
                {S && (
                    <>
                        <defs>
                            <clipPath id="share-reveal"><rect x={0} y={0} width={Math.max(0, px)} height={size.h} /></clipPath>
                        </defs>
                        <line className="share-base" x1={S.r.x} x2={S.r.x + S.r.w} y1={S.shareTop + S.shareH} y2={S.shareTop + S.shareH} />
                        <path className="share-ghost" d={shareLine} />
                        <g clipPath="url(#share-reveal)">
                            <path className="share-area" d={shareArea} />
                            <path className="share-line" d={shareLine} />
                        </g>
                        <line className="series-base" x1={S.r.x} x2={S.r.x + S.r.w} y1={S.base + 4} y2={S.base + 4} />
                        {litThrough >= PEAK_INDEX && (
                            <line className="peak-line" x1={S.x(PEAK_INDEX) - S.colPitch * 0.45} x2={S.r.x + S.r.w} y1={peakY} y2={peakY} />
                        )}
                        <line className="playhead" x1={px} x2={px} y1={S.shareTop - 6} y2={S.base + 6} />
                        <circle className="share-dot" cx={px} cy={S.yShare(shareNow)} r={4} />
                    </>
                )}
            </svg>
            <div className={`stage-layer ${onSeries ? "is-on" : ""}`} aria-hidden={!onSeries}>
                {S && (
                    <>
                        <div className="share-title" style={{ transform : `translate(${S.r.x}px, ${S.shareTop - 8}px) translateY(-100%)` }}>Their share of all the money lent, ₹ of every ₹100</div>
                        {ticks.map(({ q, k }) => (
                            <div key={q.key} className="series-tick" style={{ transform : `translate(${S.x(k)}px, ${S.base + 10}px) translateX(-50%)`, opacity : Math.abs(S.x(k) - px) < 52 ? 0 : undefined }}>
                                {mobile ? `’${q.key.slice(2, 4)}` : q.quarter}
                            </div>
                        ))}
                        <div className="playhead-badge" style={{ transform : `translate(${inside(38)}px, ${S.base + 8}px) translateX(-50%)` }}>{SERIES_DOTS[qi].quarter}</div>
                        <div className="value-badge value-count" style={{ transform : `translate(${inside(44)}px, ${S.y(Math.max(0, countNow - 1))}px) translate(-50%, calc(-100% - ${S.rowPitch * 0.9}px))` }}>
                            {countNow.toFixed(1)} crore
                        </div>
                        <div className="value-badge value-share" style={{ transform : `translate(${px}px, ${S.yShare(shareNow)}px) ${shareOnLeft ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)"}` }}>₹{shareNow.toFixed(1)}</div>
                        {litThrough >= PEAK_INDEX + 2 && !mobile && (
                            <div className="peak-label" style={{ transform : `translate(${S.r.x + S.r.w}px, ${peakY - 6}px) translate(-100%, -100%)` }}>the high point, {SERIES_DOTS[PEAK_INDEX].quarter}</div>
                        )}
                    </>
                )}
            </div>

            {hover && (
                <div className="stage-tip" style={{ left : Math.min(Math.max(hover.x, 120), size.w - 120), top : hover.y }}>
                    <strong>{hover.head}</strong>
                    {hover.lines.map(l => <span key={l}>{l}</span>)}
                </div>
            )}
        </div>
    );
};
