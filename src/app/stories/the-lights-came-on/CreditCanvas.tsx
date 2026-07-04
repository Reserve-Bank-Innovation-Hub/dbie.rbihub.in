"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// DATA ================================================================================================================
import { FIELD_DOTS, QUARTERS, YEARS, femDots, largestRemainder, litDots } from "./data";

// One canvas serves both dot systems, at the same coarse, countable scale:
//   Act II  "field"   — 104 dots = credit-eligible adults (1 dot = 1 crore people); lit = borrower accounts.
//   Acts I/III "columns" — 100 dots = ₹100 of bank credit (1 dot = ₹1); three stacks, quarter by quarter.
export type CanvasScene =
    | { kind : "dark" }
    | { kind : "columns"; quarterIdx : number }
    | { kind : "field"; yearIdx : number; gender : boolean };

interface CreditCanvasProps {
    scene : CanvasScene;
}

interface Dot {
    fx : number; fy : number;          // field grid position, normalised
    x : number;  y : number;           // current
    sx : number; sy : number;          // transition start
    tx : number; ty : number;          // target
    t0 : number; dur : number;
    scol : string; tcol : string; col : string;
    sr : number; tr : number; r : number;   // radius (0 = invisible)
    pop : boolean;                     // ignition pop on arrival
    litPos : number;                   // ignition order in field mode
    femRank : number;                  // stable "woman dot" ordering
    j1 : number; j2 : number;          // grid jitter
}

const TAU = Math.PI * 2;

// Deterministic PRNG so the crowd is identical on every visit.
const mulberry = (seed : number) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const COLUMN_BUCKETS = [ "pc", "hi", "rest" ] as const;
type Bucket = typeof COLUMN_BUCKETS[number];
const BUCKET_LABEL : Record<Bucket, string> = {
    pc   : "Private companies",
    hi   : "Individuals",
    rest : "Everyone else",
};

export const CreditCanvas = ({ scene } : CreditCanvasProps) => {
    const wrapRef    = useRef<HTMLDivElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const dotsRef    = useRef<Dot[]>([]);
    const sceneRef   = useRef<CanvasScene>(scene);
    const sizeRef    = useRef({ w : 0, h : 0 });
    const coloursRef = useRef({ lit : "", fem : "", pc : "", rest : "", dark : "", ink : "" });
    const rmRef      = useRef(false);
    const [ tip, setTip ] = useState<{ x : number; y : number; text : string } | null>(null);
    const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ---- layout helpers (write dot targets for the active scene) ----------------------------------
    const retarget = (cascadeMs : number) => {
        const { w, h } = sizeRef.current;
        if (!w || !h) return;
        const dots = dotsRef.current;
        const sc = sceneRef.current;
        const now = performance.now();
        const dur = rmRef.current ? 0 : 700;
        const cas = rmRef.current ? 0 : cascadeMs;

        const set = (d : Dot, tx : number, ty : number, col : string, r : number, delay : number, pop = false) => {
            d.sx = d.x; d.sy = d.y; d.tx = tx; d.ty = ty;
            d.scol = d.col; d.tcol = col;
            d.sr = d.r; d.tr = r;
            d.t0 = now + delay; d.dur = dur; d.pop = pop && !rmRef.current;
        };

        if (sc.kind === "columns") {
            const q = QUARTERS[sc.quarterIdx];
            const rest = 100 - q.pc - q.hi;
            const counts = largestRemainder([ rest, q.pc, q.hi ], 100);
            // assignment order [rest, pc, hi] keeps the corporate↔individuals boundary adjacent,
            // so the great swap reads as dots streaming directly between those two stacks
            const [ nRest, nPc, nHi ] = counts;
            const bucketOf = (i : number) : Bucket => (i < nRest ? "rest" : i < nRest + nPc ? "pc" : "hi");
            const startOf : Record<Bucket, number> = { rest : 0, pc : nRest, hi : nRest + nPc };

            const dotR = Math.max(6, Math.min(13, Math.min(w, h) * 0.016));
            const pitch = dotR * 2.5;
            const perRow = 5;
            const bandW = perRow * pitch;
            const gap = Math.min(w * 0.10, bandW * 0.9);
            const totalW = bandW * 3 + gap * 2;
            const x0 = (w - totalW) / 2;
            const y0 = h * 0.82;
            const bandX : Record<Bucket, number> = { pc : x0, hi : x0 + bandW + gap, rest : x0 + 2 * (bandW + gap) };

            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                if (i >= 100) { set(d, d.x, d.y, coloursRef.current.dark, 0, 0); continue; }   // 4 spare dots hide
                const b = bucketOf(i);
                const k = i - startOf[b];
                const tx = bandX[b] + (k % perRow + 0.5) * pitch + d.j1 * pitch * 0.25;
                const ty = y0 - (Math.floor(k / perRow) + 0.5) * pitch + d.j2 * pitch * 0.25;
                const col = b === "pc" ? coloursRef.current.pc : b === "hi" ? coloursRef.current.lit : coloursRef.current.rest;
                set(d, tx, ty, col, dotR, Math.random() * cas);
            }
        } else {
            // field — fixed universe of 104, oriented to the viewport
            const cols = w >= h ? 13 : 8;
            const rows = Math.ceil(FIELD_DOTS / cols);
            const mX = w * 0.10, mTop = h * 0.14, mBot = h * 0.20;
            const cw = (w - 2 * mX) / cols, ch = (h - mTop - mBot) / rows;
            const dotR = Math.max(7, Math.min(17, Math.min(cw, ch) * 0.30));

            const L = sc.kind === "field" ? litDots(sc.yearIdx) : 0;
            const F = sc.kind === "field" && sc.gender ? femDots(sc.yearIdx) : 0;
            // the F lit dots with the smallest femRank read as women's accounts
            const litIdx = dots.map((d, i) => i).filter((i) => dots[i].litPos < L);
            litIdx.sort((a, b) => dots[a].femRank - dots[b].femRank);
            const femSet = new Set(litIdx.slice(0, F));

            const batch : { d : Dot; tx : number; ty : number; col : string }[] = [];
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                const gx = i % cols, gy = Math.floor(i / cols);
                const tx = mX + (gx + 0.5) * cw + d.j1 * cw * 0.30;
                const ty = mTop + (gy + 0.5) * ch + d.j2 * ch * 0.30;
                const lit = d.litPos < L;
                const col = lit ? (femSet.has(i) ? coloursRef.current.fem : coloursRef.current.lit) : coloursRef.current.dark;
                const igniting = lit && d.col === coloursRef.current.dark;
                if (igniting) batch.push({ d, tx, ty, col });
                else set(d, tx, ty, col, dotR, Math.random() * 150);
            }
            // lights come on progressively, strictly one after another in ignition order
            batch.sort((a, b) => a.d.litPos - b.d.litPos);
            batch.forEach((b, k) => set(b.d, b.tx, b.ty, b.col, dotR, (k / Math.max(1, batch.length)) * cas, true));
        }
    };

    // ---- mount: dots, colours, raf, resize ---------------------------------------------------------
    useEffect(() => {
        rmRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;

        const css = getComputedStyle(document.documentElement);
        const hsl = (name : string, fallback : string) => {
            const v = css.getPropertyValue(name).trim();
            return v ? `hsl(${v})` : fallback;
        };
        coloursRef.current = {
            lit  : hsl("--turmeric", "hsl(38, 81%, 57%)"),
            fem  : hsl("--vermilion", "hsl(6, 72%, 54%)"),
            pc   : hsl("--sand", "hsl(41, 38%, 81%)"),
            rest : "hsla(50, 32%, 93%, 0.38)",
            dark : "hsla(50, 32%, 93%, 0.14)",
            ink  : hsl("--ivory", "hsl(50, 32%, 93%)"),
        };

        const rnd = mulberry(20260605);
        const order = Array.from({ length : FIELD_DOTS }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ order[i], order[j] ] = [ order[j], order[i] ]; }
        const fem = Array.from({ length : FIELD_DOTS }, (_, i) => i);
        for (let i = fem.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ fem[i], fem[j] ] = [ fem[j], fem[i] ]; }

        dotsRef.current = Array.from({ length : FIELD_DOTS }, (_, i) => ({
            fx : 0, fy : 0, x : -20, y : -20, sx : -20, sy : -20, tx : -20, ty : -20,
            t0 : 0, dur : 0, scol : "", tcol : "", col : "rgba(0,0,0,0)",
            sr : 0, tr : 0, r : 0, pop : false,
            litPos : order[i], femRank : fem[i],
            j1 : rnd() - 0.5, j2 : rnd() - 0.5,
        }));

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            sizeRef.current = { w : width, h : height };
            const dpr = Math.min(2, devicePixelRatio || 1);
            canvas.width = width * dpr; canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            retarget(0);
        });
        ro.observe(wrapRef.current!);

        let raf = 0;
        const frame = (t : number) => {
            const { w, h } = sizeRef.current;
            ctx.clearRect(0, 0, w, h);
            const sc = sceneRef.current;

            for (const d of dotsRef.current) {
                let p = d.dur <= 0 ? 1 : (t - d.t0) / d.dur;
                p = p < 0 ? 0 : p > 1 ? 1 : p;
                const e = 1 - Math.pow(1 - p, 3);
                d.x = d.sx + (d.tx - d.sx) * e;
                d.y = d.sy + (d.ty - d.sy) * e;
                d.col = p >= 0.5 ? d.tcol : d.scol;
                const pop = d.pop && p > 0 && p < 1 ? 1 + 0.55 * Math.sin(p * Math.PI) : 1;
                d.r = (d.sr + (d.tr - d.sr) * e) * pop;
            }

            // glow pass for warm dots, then cores, grouped by colour to keep fills cheap
            const groups = new Map<string, Dot[]>();
            for (const d of dotsRef.current) {
                if (d.r <= 0.2) continue;
                const g = groups.get(d.col);
                if (g) g.push(d); else groups.set(d.col, [ d ]);
            }
            const { lit, fem : femCol } = coloursRef.current;
            for (const [ col, list ] of groups) {
                const warm = col === lit || col === femCol;
                ctx.beginPath();
                for (const d of list) { ctx.moveTo(d.x + d.r, d.y); ctx.arc(d.x, d.y, d.r, 0, TAU); }
                ctx.fillStyle = col;
                if (warm) {
                    // lamp-like soft glow rather than a hard halo disc
                    ctx.save();
                    ctx.shadowColor = col;
                    ctx.shadowBlur = Math.max(10, list[0].r * 2.6);
                    ctx.fill();
                    ctx.fill();   // second fill deepens the glow
                    ctx.restore();
                } else {
                    ctx.fill();
                }
            }

            // canvas-native labels
            ctx.textAlign = "center";
            ctx.fillStyle = coloursRef.current.ink;
            if (sc.kind === "columns") {
                const q = QUARTERS[sc.quarterIdx];
                const vals : Record<Bucket, number> = { pc : q.pc, hi : q.hi, rest : 100 - q.pc - q.hi };
                const counts = largestRemainder([ vals.rest, vals.pc, vals.hi ], 100);
                const startOf : Record<Bucket, number> = { rest : 0, pc : counts[0], hi : counts[0] + counts[1] };
                const agg : Record<Bucket, { sx : number; n : number; y : number }> = {
                    pc : { sx : 0, n : 0, y : h }, hi : { sx : 0, n : 0, y : h }, rest : { sx : 0, n : 0, y : h },
                };
                dotsRef.current.forEach((d, i) => {
                    if (i >= 100) return;
                    const b : Bucket = i < startOf.pc ? "rest" : i < startOf.hi ? "pc" : "hi";
                    agg[b].sx += d.tx; agg[b].n++;
                    agg[b].y = Math.min(agg[b].y, d.ty);
                });
                const tops : Record<Bucket, { x : number; y : number }> = {
                    pc   : { x : agg.pc.sx / Math.max(1, agg.pc.n), y : agg.pc.y },
                    hi   : { x : agg.hi.sx / Math.max(1, agg.hi.n), y : agg.hi.y },
                    rest : { x : agg.rest.sx / Math.max(1, agg.rest.n), y : agg.rest.y },
                };
                (COLUMN_BUCKETS).forEach((b) => {
                    ctx.font = "700 15px Geist, sans-serif";
                    ctx.fillText(`₹${vals[b].toFixed(1)}`, tops[b].x, tops[b].y - 30);
                    ctx.font = "500 12px Geist, sans-serif";
                    ctx.globalAlpha = 0.75;
                    ctx.fillText(BUCKET_LABEL[b], tops[b].x, tops[b].y - 14);
                    ctx.globalAlpha = 1;
                });
                ctx.font = "700 26px Geist Mono, monospace";
                ctx.textAlign = "right";
                ctx.fillText(q.d, w - 24, 46);
                ctx.font = "500 12px Geist, sans-serif";
                ctx.globalAlpha = 0.7;
                ctx.fillText("of every ₹100 banks have lent", w - 24, 64);
                ctx.globalAlpha = 1;
            } else if (sc.kind === "field") {
                const yp = YEARS[sc.yearIdx];
                ctx.font = "700 26px Geist Mono, monospace";
                ctx.textAlign = "right";
                ctx.fillText(`Mar ${yp.y}`, w - 24, 46);
                ctx.font = "500 12px Geist, sans-serif";
                ctx.globalAlpha = 0.7;
                ctx.fillText(`${(yp.acc / 1e7).toFixed(1)} crore borrower accounts lit`, w - 24, 64);
                if (sc.gender) ctx.fillText(`${(yp.accF / 1e7).toFixed(1)} crore held by women`, w - 24, 82);
                ctx.globalAlpha = 1;
            }

            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);

        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- scene changes -----------------------------------------------------------------------------
    useEffect(() => {
        const prev = sceneRef.current;
        sceneRef.current = scene;
        const bigIgnition = scene.kind === "field" && (prev.kind !== "field" || (prev.kind === "field" && scene.yearIdx > prev.yearIdx + 1));
        retarget(scene.kind === "columns" ? 320 : bigIgnition ? 1600 : 500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ scene ]);

    // ---- tap-to-inspect (quantified) ----------------------------------------------------------------
    const onPointerDown = (e : React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        let best : Dot | null = null, bd = 32 * 32;
        let bestIdx = -1;
        dotsRef.current.forEach((d, i) => {
            if (d.r <= 0.2) return;
            const dd = (d.x - px) ** 2 + (d.y - py) ** 2;
            if (dd < bd) { bd = dd; best = d; bestIdx = i; }
        });
        if (!best) { setTip(null); return; }
        const b = best as Dot;
        const sc = sceneRef.current;
        let text : string;
        if (sc.kind === "columns") {
            text = "₹1 of every ₹100 of outstanding bank credit";
        } else {
            const lit = sc.kind === "field" && b.litPos < litDots(sc.yearIdx);
            const isFem = lit && b.col === coloursRef.current.fem;
            text = !lit
                ? "≈ 1 crore credit-eligible adults — no formal loan, no file, no score"
                : isFem
                    ? "≈ 1 crore borrower accounts held by women"
                    : "≈ 1 crore borrower accounts with banks";
        }
        void bestIdx;
        setTip({ x : b.x, y : b.y - b.r - 10, text });
        if (tipTimer.current) clearTimeout(tipTimer.current);
        tipTimer.current = setTimeout(() => setTip(null), 2800);
    };

    return (
        <div ref={wrapRef} className="credit-canvas-wrap" onPointerDown={onPointerDown}>
            <canvas ref={canvasRef} />
            {tip && (
                <div className="dot-tip" style={{ left : tip.x, top : tip.y }}>
                    {tip.text}
                </div>
            )}
        </div>
    );
};
