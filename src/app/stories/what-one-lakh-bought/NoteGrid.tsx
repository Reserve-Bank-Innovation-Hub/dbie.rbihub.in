"use client";

// REACT CORE ==========================================================================================================
import { ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

// DATA ================================================================================================================
import { SUM, inr } from "./data";

// The hero's picture of the sum: a sheet of ₹1,000 notes, each on a white card with a flat shadow, in a grid tilted
// a little, after the sheet of notes in public/design-ref/one-lakh-story/ref-dribbble.webp. The section is tall and
// its frame sticks, the way the walk in what-got-cheaper does; scrolling pulls the camera back from a few notes up
// close, past the state in ref-scroll-state.png there, to where about a hundred notes, ₹1,00,000, are in view, and
// holds there until the reader scrolls on. The sheet is as large as it has to be to run off every edge of the frame
// at that zoom. The note itself comes from note-1000.svg, read by page.tsx and inlined here as one symbol that every
// unit refers to.

// THE NOTE ============================================================================================================
export interface NoteArt { viewBox : string; markup : string; }

export const DENOMINATION = 1000;                      // the note: the ₹1,000 of 2000 to 2016, the story's first year's
export const IN_VIEW      = SUM / DENOMINATION;        // the notes in view at the end of the pull-back: 100, the sum
const NOTE_W = 177, NOTE_H = 73;                       // that note's 177 × 73 mm, as grid units
const CARD   = 5;                                      // the white card's margin round the note
const GAP    = 14;                                     // between cards, in the same units
const SHADOW = { x : 3, y : 5 };                       // the card's flat shadow, offset down and right
const TILT   = -14;                                    // the grid's tilt, in degrees, as on the sheet
const PITCH  = { x : NOTE_W + 2 * CARD + GAP, y : NOTE_H + 2 * CARD + GAP };

// The sheet never shows its edges: given the widest view the camera reaches, vw by vh in grid units, the sheet is
// the smallest grid whose tilted rectangle still covers that view's corners.
const RAD    = TILT * Math.PI / 180, COS = Math.cos(RAD), SIN = Math.sin(RAD);
const ACOS   = Math.abs(COS), ASIN = Math.abs(SIN);
const gridOf = (vw : number, vh : number) => {
    const halfW = (vw / 2) * ACOS + (vh / 2) * ASIN + CARD, halfH = (vw / 2) * ASIN + (vh / 2) * ACOS + CARD;
    const cols = Math.ceil((2 * halfW + GAP) / PITCH.x), rows = Math.ceil((2 * halfH + GAP) / PITCH.y);
    return { cols, rows, W : cols * PITCH.x - GAP, H : rows * PITCH.y - GAP };
};

// THE CAMERA ==========================================================================================================
const TRACK  = 2.6;                                    // screens of scroll the section spans
const CLOSE  = { desktop : 2.6, phone : 1.4 };         // notes across the frame at the start
const clamp  = (v : number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (u : number) => u * u * (3 - 2 * u);

// THE COMPONENT =======================================================================================================
// The children are the story's title and standfirst, set on a panel over the notes while the camera is close; the
// corner is what sits top-left over them, the page's crumbs.
export const NoteGrid = ({ note, corner, children } : { note : NoteArt; corner? : ReactNode; children? : ReactNode }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const frameRef   = useRef<HTMLDivElement>(null);
    const svgRef     = useRef<SVGSVGElement>(null);
    const reduced    = !!useReducedMotion();
    const [ size, setSize ] = useState({ width : 0, height : 0 });
    const [ stage, setStage ]   = useState(0);         // 0 at rest with the title; 1 once the pull-back begins; 2 when the card is shown; 3 when the sheet blurs

    useLayoutEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([ e ]) => setSize({ width : e.contentRect.width, height : e.contentRect.height }));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { scrollYProgress } = useScroll({ target : sectionRef, offset : [ "start start", "end end" ] });

    // The sheet's geometry and the two ends of the camera's travel, both windows in the frame's own aspect so the
    // pull-back is a clean zoom about the sheet's centre. The far end is the view that holds IN_VIEW notes: across
    // squared times the rows per column of width gives the count, so across is the square root.
    const geo = useMemo(() => {
        const { width : fw, height : fh } = size;
        if (!fw || !fh) return null;
        const A = fw / fh, phone = fw < 900;
        const across = Math.sqrt(IN_VIEW * A * PITCH.y / PITCH.x);
        const fit = { vw : across * PITCH.x, vh : across * PITCH.x / A };
        const { cols, rows, W, H } = gridOf(fit.vw, fit.vh);
        const vw0 = Math.min((phone ? CLOSE.phone : CLOSE.desktop) * PITCH.x, fit.vw);
        const close = { vw : vw0, vh : vw0 / A };
        // Each cell's note sits CARD inside its card; the grid is tilted about its own centre, so the close-up's
        // centre, the middle note's, is that note's centre turned about the grid's.
        const cells = Array.from({ length : cols * rows }, (_, i) => ({ x : (i % cols) * PITCH.x + CARD, y : Math.floor(i / cols) * PITCH.y + CARD }));
        const c1 = { x : W / 2, y : H / 2 };
        const mid = cells[Math.floor(rows / 2) * cols + Math.floor(cols / 2)];
        const dx = mid.x + NOTE_W / 2 - c1.x, dy = mid.y + NOTE_H / 2 - c1.y;
        const c0 = { x : c1.x + dx * COS - dy * SIN, y : c1.y + dx * SIN + dy * COS };
        return { fw, fh, cols, rows, W, H, c0, c1, close, fit, cells };
    }, [ size ]);

    // The camera at a point of the scroll: held close for the first stretch, pulled back by the last, eased between.
    const paint = (p : number) => {
        const svg = svgRef.current;
        if (!svg || !geo) return;
        const t = reduced ? 1 : smooth(clamp((p - 0.12) / 0.7));
        const vw = geo.close.vw * Math.pow(geo.fit.vw / geo.close.vw, t), vh = vw / (geo.fw / geo.fh);
        const cx = geo.c0.x + (geo.c1.x - geo.c0.x) * t, cy = geo.c0.y + (geo.c1.y - geo.c0.y) * t;
        svg.setAttribute("viewBox", `${(cx - vw / 2).toFixed(1)} ${(cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
        // A note's width on screen decides how much of it is drawn: the numerals and motif go once it is under ~60 px.
        const px = geo.fw * NOTE_W / vw, detail = clamp((px - 30) / 30);
        svg.style.setProperty("--note-detail", detail.toFixed(2));
        svg.style.setProperty("--note-detail-vis", detail > 0 ? "visible" : "hidden");
        setStage(t > 0.72 ? 3 : t > 0.38 ? 2 : t > 0 ? 1 : 0);
    };
    const paintRef = useRef(paint);
    paintRef.current = paint;

    useMotionValueEvent(scrollYProgress, "change", p => paintRef.current(p));
    useLayoutEffect(() => { paintRef.current(scrollYProgress.get()); }, [ geo, reduced, scrollYProgress ]);

    const label = `A sheet of ₹${inr(DENOMINATION)} notes, seen up close and then from further away, with about ${inr(IN_VIEW)} of them, ₹${inr(SUM)}, in view at the end`;

    return (
        <section ref={sectionRef} className="notes" style={{ height : `${TRACK * 100}svh` }}>
            <div ref={frameRef} className={`notes-frame ${!reduced && stage >= 1 ? "is-moving" : ""} ${!reduced && stage >= 2 ? "is-card" : ""} ${!reduced && stage >= 3 ? "is-blur" : ""}`}>
                {geo && (
                    <svg ref={svgRef} className="notes-svg" width={geo.fw} height={geo.fh} role="img" aria-label={label}>
                        <defs>
                            <symbol id="note-1000" viewBox={note.viewBox} dangerouslySetInnerHTML={{ __html : note.markup }} />
                        </defs>
                        <g transform={`rotate(${TILT} ${geo.c1.x} ${geo.c1.y})`}>
                            {geo.cells.map((c, i) => (
                                <g key={i}>
                                    <rect className="note-shadow" x={c.x - CARD + SHADOW.x} y={c.y - CARD + SHADOW.y} width={NOTE_W + 2 * CARD} height={NOTE_H + 2 * CARD} rx={2} />
                                    <rect className="note-card" x={c.x - CARD} y={c.y - CARD} width={NOTE_W + 2 * CARD} height={NOTE_H + 2 * CARD} rx={2} />
                                    <use href="#note-1000" x={c.x} y={c.y} width={NOTE_W} height={NOTE_H} />
                                </g>
                            ))}
                        </g>
                    </svg>
                )}
                {corner && <div className="notes-corner">{corner}</div>}
                {children && <div className="notes-title">{children}</div>}
                {/* The card: in the centre, in the title's place, once the pull-back is well under way, with the sheet's
                    own note rocking gently at its top. */}
                <div className="notes-card" aria-hidden="true">
                    <svg className="notes-card-note" viewBox={`0 0 ${NOTE_W} ${NOTE_H}`}>
                        <use href="#note-1000" width={NOTE_W} height={NOTE_H} />
                    </svg>
                    <p className="notes-card-words">{`From the days the ₹${inr(DENOMINATION)} note was in circulation. It feels a long time ago, and what money can buy has moved just as far.`}</p>
                </div>
            </div>
        </section>
    );
};
