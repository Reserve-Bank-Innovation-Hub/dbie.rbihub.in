"use client";

// The opening act's stage: one canvas of dots, one for each good the wholesale price index follows, that re-form scene
// by scene (stageLayout.ts says where), with the axis, the reference lines and the labels drawn over it in HTML and
// SVG so they stay sharp. The engine tweens every dot from wherever it is to its next target; it runs only while the
// stage is on screen.

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";

// UI ==================================================================================================================
import { useTheme } from "fictoan-react";

// LIB =================================================================================================================
import { resolveScheme } from "@/components/charts/chartConfig";
import { fictoanColour } from "@/lib/fictoan-colours";

// DATA ================================================================================================================
import { COUNTS, GROUPS, HEADLINE, ITEMS, MAJOR_PLAIN, MAJOR_SHORT, rs } from "./data";
import {
    LABEL_CLEAR_LEFT, N, SWARM_SCENES, WORK_TICKS, X_TICKS, dotRhythm, isMobile, isSwarm, labelledDots, layoutScene, referenceLines, valueOf,
    type RGB, type SceneId, type StagePalette, type SwarmGeometry, type Target,
} from "./stageLayout";

const TAU = Math.PI * 2;
const ease = (t : number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const near = (a : number, b : number) => Math.abs(a - b) < 0.01;

// THE ENGINE ==========================================================================================================
class DotEngine {
    n : number;
    x; y; r; a; cr; cg; cb : Float32Array;
    fx; fy; fr; fa; fcr; fcg; fcb : Float32Array;
    tx; ty; tr; ta; tcr; tcg; tcb : Float32Array;
    t0 : Float64Array; dur : Float32Array;
    twinkle; pop : Uint8Array;
    seed : Float32Array;

    constructor(n : number) {
        this.n = n;
        const f = () => new Float32Array(n), u = () => new Uint8Array(n);
        this.x = f(); this.y = f(); this.r = f(); this.a = f(); this.cr = f(); this.cg = f(); this.cb = f();
        this.fx = f(); this.fy = f(); this.fr = f(); this.fa = f(); this.fcr = f(); this.fcg = f(); this.fcb = f();
        this.tx = f(); this.ty = f(); this.tr = f(); this.ta = f(); this.tcr = f(); this.tcg = f(); this.tcb = f();
        this.t0 = new Float64Array(n); this.dur = f();
        this.twinkle = u(); this.pop = u();
        this.seed = Float32Array.from({ length : n }, (_, i) => dotRhythm(i));
    }

    // Put every dot on its target at once, invisible, so the first scene can fade in from where it will stand.
    place(ts : Target[]) {
        for (let i = 0; i < this.n; i++) {
            const t = ts[i];
            this.x[i] = this.fx[i] = this.tx[i] = t.x; this.y[i] = this.fy[i] = this.ty[i] = t.y;
            this.r[i] = this.fr[i] = this.tr[i] = t.r;
            this.cr[i] = this.fcr[i] = this.tcr[i] = t.c[0]; this.cg[i] = this.fcg[i] = this.tcg[i] = t.c[1]; this.cb[i] = this.fcb[i] = this.tcb[i] = t.c[2];
            this.a[i] = this.fa[i] = this.ta[i] = 0;
            this.twinkle[i] = t.twinkle ? 1 : 0; this.pop[i] = 0;
            this.dur[i] = 0; this.t0[i] = 0;
        }
    }

    // Move every dot whose target has changed, from wherever it is now.
    set(ts : Target[], now : number, reduced : boolean, snap = false) {
        for (let i = 0; i < this.n; i++) {
            const t = ts[i];
            if (near(this.tx[i], t.x) && near(this.ty[i], t.y) && near(this.tr[i], t.r) && near(this.ta[i], t.a)
                && this.tcr[i] === t.c[0] && this.tcg[i] === t.c[1] && this.tcb[i] === t.c[2]) { this.twinkle[i] = t.twinkle ? 1 : 0; continue; }
            this.fx[i] = this.x[i]; this.fy[i] = this.y[i]; this.fr[i] = this.r[i]; this.fa[i] = this.a[i];
            this.fcr[i] = this.cr[i]; this.fcg[i] = this.cg[i]; this.fcb[i] = this.cb[i];
            this.tx[i] = t.x; this.ty[i] = t.y; this.tr[i] = t.r; this.ta[i] = t.a;
            this.tcr[i] = t.c[0]; this.tcg[i] = t.c[1]; this.tcb[i] = t.c[2];
            this.t0[i] = now + (reduced || snap ? 0 : t.delay); this.dur[i] = reduced || snap ? 0 : t.dur;
            this.pop[i] = t.pop && !reduced && !snap ? 1 : 0;
            this.twinkle[i] = t.twinkle ? 1 : 0;
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
            this.r[i] = (this.fr[i] + (this.tr[i] - this.fr[i]) * e) * (this.pop[i] && p > 0 && p < 1 ? 1 + 0.5 * Math.sin(p * Math.PI) : 1);
            this.a[i] = this.fa[i] + (this.ta[i] - this.fa[i]) * e;
            this.cr[i] = this.fcr[i] + (this.tcr[i] - this.fcr[i]) * e;
            this.cg[i] = this.fcg[i] + (this.tcg[i] - this.fcg[i]) * e;
            this.cb[i] = this.fcb[i] + (this.tcb[i] - this.fcb[i]) * e;
        }
    }

    draw(ctx : CanvasRenderingContext2D, now : number, reduced : boolean) {
        const { x, y, r, a, cr, cg, cb, twinkle, seed } = this;
        const buckets = new Map<string, number[]>();
        for (let i = 0; i < this.n; i++) {
            if (a[i] < 0.01 || r[i] < 0.2) continue;
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
    }
}

// THE PALETTE =========================================================================================================
// The site's chart scheme for the page's theme: the first three categorical slots for the three major groups, the
// emphasis and de-emphasis, the cool and warm poles, and a grey from the ink ladder for the unlit.
const rgbOf = (hex : string) : RGB => [ parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16) ];
export const stagePalette = (theme : string) : StagePalette => {
    const dark = theme === "theme-dark";
    const s = resolveScheme("line", undefined, theme);
    return {
        field  : rgbOf(fictoanColour("grey", dark ? "dark40" : "light60")),
        majors : [ rgbOf(s.series[1]), rgbOf(s.series[2]), rgbOf(s.series[0]) ],
        emph   : rgbOf(s.emphasis),
        deemph : rgbOf(fictoanColour("grey", dark ? "dark40" : "light60")),
        cool   : rgbOf(s.positive),
        warm   : rgbOf(s.negative),
    };
};
const css = (c : RGB) => `rgb(${c.join(",")})`;

// WHAT EACH SCENE SAYS TO A SCREEN READER =============================================================================
const DESCRIBE : Record<SceneId, string> = {
    hero     : "The stage shows a field of faint dots.",
    block    : `A block of ${N} dots, one for each good in the wholesale price index, coloured by major group.`,
    spread   : `The dots spread along a scale of what ₹100 of each good in 2011-12 costs in ${HEADLINE.nowFy}, most of them between ₹120 and ₹200.`,
    guess    : "The same dots, with the ₹100 line marked and the basket’s own answer still hidden.",
    answer   : `The basket as a whole is marked at ₹${Math.round(HEADLINE.all)}, among the dots.`,
    cheaper  : `${COUNTS.cheaper} dots to the left of ₹100 are lit: the goods that are cheaper than in 2011-12.`,
    doubled  : `${COUNTS.doubled} dots at ₹200 or more are lit: the goods that have at least doubled.`,
    majors   : "The dots stand in three rows, for goods grown or mined, fuel and power, and goods made in factories.",
    weighted : "The same dots, each sized by the good's weight in the basket; the largest are milk, diesel and electricity.",
    work     : `The dots are placed by the good's price in days of a rural labourer's work, and ${COUNTS.inWork.cheaper} of ${COUNTS.inWork.items} sit to the left of 100.`,
};

// THE STAGE ===========================================================================================================
interface Hover { x : number; y : number; head : string; lines : string[] }

interface PriceStageProps { scene : SceneId }

export const PriceStage = ({ scene } : PriceStageProps) => {
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

    const layout = useMemo(() => (size.w ? layoutScene(scene, { w : size.w, h : size.h }, pal) : null), [ scene, size.w, size.h, pal ]);

    // The swarm geometry the overlay last had, so it fades out where it stood rather than jumping.
    const lastSwarm = useRef<SwarmGeometry | undefined>(undefined);
    if (layout?.swarm) lastSwarm.current = layout.swarm;

    // ---- mount: the engine, the canvas size, the frame loop while visible --------------------------------------------
    useEffect(() => {
        reducedRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
        engineRef.current = new DotEngine(N);
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
            eng.set(layout.targets, now, reducedRef.current, true);
        } else {
            eng.set(layout.targets, now, reducedRef.current);
        }
        shownRef.current = { scene, w : size.w, h : size.h };
        setHover(null);
    }, [ layout, scene, size.w, size.h ]);

    // ---- hover: the nearest dot -----------------------------------------------------------------------------------
    const onPointer = (e : RPointerEvent<HTMLDivElement>) => {
        if (!layout?.swarm || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        let best = -1, bestD = 12 * 12;
        for (let i = 0; i < N; i++) {
            const t = layout.targets[i];
            if (t.a < 0.05) continue;
            const d = (t.x - px) ** 2 + (t.y - py) ** 2;
            if (d < bestD + t.r * t.r) { best = i; bestD = d; }
        }
        if (best < 0) { setHover(null); return; }
        const it = ITEMS[best], t = layout.targets[best];
        const lines = [
            `${GROUPS[it.group].label}`,
            `₹100 of it in 2011-12 cost ${rs(it.now)} in ${HEADLINE.nowFy}`,
            `weight ₹${it.weight >= 0.1 ? it.weight.toFixed(2) : it.weight.toFixed(3)} of every ₹100 in the basket`,
        ];
        if (layout.swarm.work && it.inWork !== null) lines.push(`in days of a labourer’s work: ${Math.round(it.inWork * 100)} against 100 in 2014-15`);
        if (it.priced < 12) lines.push(`priced in ${it.priced} months of the year`);
        setHover({ x : t.x, y : t.y + t.r, head : it.label, lines });
    };

    // ---- the overlay -------------------------------------------------------------------------------------------------
    const mobile = isMobile(size);
    const S = lastSwarm.current;
    const onSwarm = isSwarm(scene);
    const region = layout?.region;

    const ticks = S ? (S.work ? WORK_TICKS : X_TICKS) : [];
    const refs = onSwarm ? referenceLines(scene) : [];
    const axisY = S ? S.r.y + S.r.h + 10 : 0;

    // The labels: each beside its dot, above or below the swarm in turn, with a leader to the dot.
    const labels = useMemo(() => {
        if (!layout?.swarm) return [];
        const sw = layout.swarm;
        const mob = isMobile(size);
        const raw = labelledDots(scene)
            .filter(({ i }) => scene !== "majors" || layout.targets[i].x > sw.r.x + LABEL_CLEAR_LEFT)
            .map(({ name, i }, k) => {
                const t = layout.targets[i];
                const band = sw.bands.find(b => b.major === -1 || b.major === ITEMS[i].major) ?? sw.bands[0];
                const up = scene === "majors" ? true : k % 2 === 0;
                const y = up ? Math.max(sw.r.y + 8, band.top + (scene === "majors" ? 2 : 10)) : band.bottom - 14;
                return { name, x : t.x, lx : t.x, dotY : t.y, y, up, value : valueOf(ITEMS[i], sw.work), item : ITEMS[i], w : name.length * (mob ? 6 : 7.2) + 16 };
            });
        // labels on the same row pushed apart so they never overlap, and kept inside the stage
        for (const up of [ true, false ]) {
            const row = raw.filter(l => l.up === up).sort((a, b) => a.x - b.x);
            for (let k = 1; k < row.length; k++) row[k].lx = Math.max(row[k].lx, row[k - 1].lx + (row[k - 1].w + row[k].w) / 2 + 6);
            for (let k = row.length - 2; k >= 0; k--) row[k].lx = Math.min(row[k].lx, row[k + 1].lx - (row[k].w + row[k + 1].w) / 2 - 6);
            for (const l of row) l.lx = Math.max(sw.r.x + l.w / 2, Math.min(size.w - l.w / 2 - 8, l.lx));
        }
        return raw;
    }, [ layout, scene, size ]);

    const keys : { colour : RGB; label : string }[] =
        scene === "hero" ? []
            : scene === "work" ? [ { colour : pal.cool, label : "cheaper in days of work" }, { colour : pal.warm, label : "dearer" } ]
                : MAJOR_PLAIN.map((label, m) => ({ colour : pal.majors[m], label }));
    const caption =
        scene === "block" ? `Each dot is one of the ${N} goods the index follows`
            : scene === "work" ? `Each good’s price in days of a rural labourer’s work, ${HEADLINE.wageWindow.to} against ${HEADLINE.wageWindow.from}`
                : scene === "weighted" ? "Each dot is sized by the good’s weight in the basket"
                    : SWARM_SCENES.includes(scene) || scene === "majors" ? `What ₹100 of each good in 2011-12 costs in ${HEADLINE.nowFy}` : "";

    return (
        <div ref={wrapRef} className="price-stage" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setHover(null)}>
            <canvas ref={canvasRef} role="img" aria-label={DESCRIBE[scene]} />

            {/* caption and key, above the dots */}
            {region && (caption || keys.length > 0) && (
                <div className="stage-caption" style={{ left : region.x, top : mobile ? 10 : 22 }}>
                    {caption && <div className="caption-text">{caption}</div>}
                    <div className="stage-keys">
                        {keys.map(k => (
                            <span key={k.label} className="stage-key"><i className="key-dot" style={{ background : css(k.colour) }} />{k.label}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* the axis, the reference lines and the row names */}
            <svg className={`stage-svg stage-layer ${onSwarm ? "is-on" : ""}`} width={size.w} height={size.h} aria-hidden="true">
                {S && (
                    <>
                        <line className="axis-base" x1={S.r.x} x2={S.r.x + S.r.w} y1={axisY} y2={axisY} />
                        {ticks.map(v => <line key={v} className="axis-tick" x1={S.x(v)} x2={S.x(v)} y1={axisY} y2={axisY + 5} />)}
                        {refs.map(l => <line key={l.label} className={`ref-line ${l.v === 100 ? "is-base" : ""}`} x1={S.x(l.v)} x2={S.x(l.v)} y1={S.r.y - 4} y2={axisY} />)}
                        {scene === "majors" && S.bands.length === 3 && S.bands.slice(1).map(b => <line key={b.major} className="row-rule" x1={S.r.x} x2={S.r.x + S.r.w} y1={b.top} y2={b.top} />)}
                        {labels.map(l => <line key={l.name} className="label-leader" x1={l.lx} x2={l.x} y1={l.up ? l.y + 30 : l.y - 32} y2={l.dotY + (l.up ? -4 : 4)} />)}
                    </>
                )}
            </svg>
            <div className={`stage-layer ${onSwarm ? "is-on" : ""}`} aria-hidden={!onSwarm}>
                {S && (
                    <>
                        {ticks.map(v => (
                            <div key={v} className="axis-label" style={{ transform : `translate(${S.x(v)}px, ${axisY + 8}px) translateX(-50%)` }}>
                                {S.work ? v : `₹${v}`}
                            </div>
                        ))}
                        <div className="axis-title" style={{ transform : `translate(${S.r.x + S.r.w}px, ${axisY + (mobile ? 24 : 26)}px) translateX(-100%)` }}>
                            {S.work ? "days of work, 2014-15 = 100" : "rupees of every ₹100 in 2011-12, log scale"}
                        </div>
                        {refs.map((l, k) => (
                            <div key={l.label} className={`ref-label ${l.v === 100 ? "is-base" : ""}`} style={{ transform : `translate(${S.x(l.v)}px, ${S.r.y - (mobile ? 4 : 8) - (k === 1 && Math.abs(S.x(refs[0].v) - S.x(l.v)) < 190 ? 22 : 0)}px) translate(${S.x(l.v) > S.r.x + S.r.w * 0.7 ? "-100%" : "-12px"}, -100%)` }}>
                                {l.label}
                            </div>
                        ))}
                        {scene === "majors" && S.bands.length === 3 && S.bands.map(b => (
                            <div key={b.major} className="row-name" style={{ transform : `translate(${S.r.x}px, ${b.top + 4}px)` }}>
                                <span className="row-name-text">{mobile ? MAJOR_SHORT[b.major] : MAJOR_PLAIN[b.major]}</span>
                                <span className="row-name-count">{COUNTS.byMajor[b.major].items} goods, typical {rs(COUNTS.byMajor[b.major].median)}</span>
                            </div>
                        ))}
                        {labels.map(l => (
                            <div key={l.name} className={`dot-label ${l.up ? "is-up" : "is-down"}`} style={{ transform : `translate(${l.lx}px, ${l.y}px) translate(-50%, ${l.up ? "0" : "-100%"})` }}>
                                <span className="dot-label-name">{l.name}</span>
                                <span className="dot-label-value">{S.work ? Math.round(l.value) : rs(l.value)}</span>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {hover && (
                <div className="stage-tip" style={{ left : Math.min(Math.max(hover.x, 130), size.w - 130), top : hover.y }}>
                    <strong>{hover.head}</strong>
                    {hover.lines.map(l => <span key={l}>{l}</span>)}
                </div>
            )}
        </div>
    );
};

