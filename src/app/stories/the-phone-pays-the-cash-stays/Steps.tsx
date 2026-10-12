"use client";

// The story's flat steps, drawn in SVG: the guess (how much cash, before and after), the tide (cash with the public as a
// share of GDP since 1951-52), UPI against debit cards, the wall of notes by denomination, and the close. Each starts its motion the first time it is mostly on screen; with reduced motion
// each is drawn at once.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useId, useRef, useState } from "react";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, FESTIVE, NOTE_YEARS, PAY, PAY_MONTHS, TIDE, TIDE_FYS } from "./data.gen";
import { monthName, type StepEvent } from "./record";
import { Pins, Readout, useReadout } from "./ChartBits";
import { NoteFace, NoteIcon } from "./Note";

// Where a step's words sit beside its picture: on the right (the default), on the left, or above it across the width.
// The steps vary it, so the story does not read as one template.
export type Layout = "right" | "left" | "top";
const splitClass = (layout? : Layout) => `split is-${layout ?? "right"}`;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lakhCrore = (crore : number) => (crore / 1e5).toFixed(1);

// The element's size, and whether it has yet been mostly on screen.
function useStage<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const [ seen, setSeen ] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ w : el.clientWidth, h : el.clientHeight }));
        ro.observe(el);
        const io = new IntersectionObserver(([ e ]) => { if (e.intersectionRatio > 0.55) { setSeen(true); io.disconnect(); } }, { threshold : [ 0.55 ] });
        io.observe(el);
        return () => { ro.disconnect(); io.disconnect(); };
    }, []);
    return { ref, size, seen };
}

// THE GUESS ===========================================================================================================
// Two piles of notes, each note ₹1 lakh crore of currency in circulation: March 2016's, and in its place for March 2026
// a question mark until the reader guesses. Then March 2026's pile rises, note by note.
const MARCH_2016 = CIC[CIC_MONTHS.indexOf("2016-03")];
const LAST_MARCH = (() => { for (let i = CIC_MONTHS.length - 1; i >= 0; i--) if (CIC_MONTHS[i].endsWith("-03")) return i; return CIC_MONTHS.length - 1; })();
const MARCH_LAST = CIC[LAST_MARCH], LAST_YEAR = CIC_MONTHS[LAST_MARCH].slice(0, 4);
const TIMES = MARCH_LAST / MARCH_2016;
type Guess = "down" | "same" | "up";
const VERDICT : Record<Guess, string> = { down : "No, it rose.", same : "No, it rose.", up : "Yes, it rose." };

// A pile of bundles, each ₹1 lakh crore: notes seen edge on (a few fine lines), a paper band round the middle, and a
// slight skew, as a pile is never quite straight. On `rise` the bundles fall from above the stage, one after another
// from the bottom, and settle with a small bounce.
const Pile = ({ lakh, x, base, slab, width, rise, delay } : { lakh : number; x : number; base : number; slab : number; width : number; rise : boolean; delay : number }) => {
    const whole = Math.floor(lakh), part = lakh - whole;
    const notes = Array.from({ length : whole + (part > 0.05 ? 1 : 0) }, (_, k) => k);
    return (
        <g>
            {notes.map(k => {
                const hh = (k === whole ? part : 1) * (slab - 2);
                const y = base - (k + 1) * slab + (slab - 2 - hh);
                const skew = Math.sin(k * 2.3) * width * 0.025;
                const x0 = x - width / 2 + skew, band = width * 0.16;
                const edges = hh > 7 ? [ 0.35, 0.65 ] : hh > 4 ? [ 0.5 ] : [];
                return (
                    <g key={k} className={`pile-note ${rise ? "is-up" : ""}`} style={{ animationDelay : `${delay + k * 0.06}s`, "--drop" : `${-(y + hh + 40)}px` } as React.CSSProperties}>
                        <rect className="pile-body" x={x0} y={y} width={width} height={Math.max(1, hh)} rx={2} />
                        {edges.map(f => <line key={f} className="pile-edge" x1={x0 + 3} x2={x0 + width - 3} y1={y + hh * f} y2={y + hh * f} />)}
                        <rect className="pile-band" x={x0 + width / 2 - band / 2} y={y - 0.5} width={band} height={Math.max(1, hh + 1)} />
                    </g>
                );
            })}
        </g>
    );
};

export const GuessStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ guess, setGuess ] = useState<Guess | null>(null);
    const { w, h } = size;
    const top = 40, bottom = 64;
    const slab = Math.max(3, Math.min(16, (h - top - bottom) / Math.ceil(MARCH_LAST / 1e5)));
    const width = Math.min(220, w * 0.3), base = h - bottom;
    const xs = [ w * 0.3, w * 0.7 ];
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage guess-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={guess ? `Currency in circulation: ₹${lakhCrore(MARCH_2016)} lakh crore in March 2016, ₹${lakhCrore(MARCH_LAST)} lakh crore in March ${LAST_YEAR}, each note ₹1 lakh crore.` : `Currency in circulation in March 2016: ₹${lakhCrore(MARCH_2016)} lakh crore, a pile of notes; March ${LAST_YEAR} is a question.`}>
                        <Pile lakh={MARCH_2016 / 1e5} x={xs[0]} base={base} slab={slab} width={width} rise={seen} delay={0.2} />
                        <Pile lakh={MARCH_LAST / 1e5} x={xs[1]} base={base} slab={slab} width={width} rise={!!guess} delay={0.1} />
                        {!guess && <text className="guess-mark" x={xs[1]} y={base - 60} textAnchor="middle">?</text>}
                        {/* once answered, a scale beside March's pile: March 2016's height is 1x, carried across */}
                        {guess && (() => {
                            const one = MARCH_2016 / 1e5 * slab, x = xs[1] + width / 2 + 28;
                            const marks = [ 1, 2 ].map(k => ({ k, y : base - k * one, label : `${k}x` })).concat({ k : TIMES, y : base - TIMES * one, label : `${TIMES.toFixed(1)}x` });
                            return (
                                <g className="guess-scale" style={{ animationDelay : `${0.4 + Math.ceil(MARCH_LAST / 1e5) * 0.06}s` }}>
                                    <line className="guess-carry" x1={xs[0] - width / 2} x2={x} y1={base - one} y2={base - one} />
                                    <line className="guess-ruler" x1={x} x2={x} y1={base} y2={base - TIMES * one} />
                                    {marks.map(m => (
                                        <g key={m.label} className={m.k === TIMES ? "is-top" : ""}>
                                            <line x1={x - 5} x2={x + 5} y1={m.y} y2={m.y} />
                                            <text x={x + 10} y={m.y + 5}>{m.label}</text>
                                        </g>
                                    ))}
                                </g>
                            );
                        })()}
                        <line className="guess-floor" x1={w * 0.1} x2={w * 0.9} y1={base + 1} y2={base + 1} />
                        {[ [ "March 2016", MARCH_2016 ], [ `March ${LAST_YEAR}`, MARCH_LAST ] ].map(([ label, v ], i) => (
                            <g key={i} className="guess-label">
                                <text x={xs[i]} y={base + 26} textAnchor="middle">{label as string}</text>
                                <text className={`guess-value ${i && !guess ? "is-hidden" : ""}`} x={xs[i]} y={base + 48} textAnchor="middle">₹{lakhCrore(v as number)} lakh crore</text>
                            </g>
                        ))}
                    </svg>
                )}
            </div>
            <aside className="split-card">
                {children}
                <div className="guess-choices" role="group" aria-label="Your guess">
                    {([ [ "down", "Fallen" ], [ "same", "About the same" ], [ "up", "Risen" ] ] as [ Guess, string ][]).map(([ g, label ]) => (
                        <button key={g} type="button" className={guess === g ? "is-on" : ""} aria-pressed={guess === g} onClick={() => setGuess(g)}>{label}</button>
                    ))}
                </div>
                <p className={`guess-answer ${guess ? "is-shown" : ""}`} aria-live="polite">
                    {guess && <>
                        <b>{VERDICT[guess]} {TIMES.toFixed(1)}x,</b> from ₹{lakhCrore(MARCH_2016)} lakh crore in March 2016 to
                        ₹{lakhCrore(MARCH_LAST)} lakh crore in March {LAST_YEAR}.
                        <span className="guess-unit">Each bundle stands for ₹1 lakh crore of currency in circulation.</span>
                    </>}
                </p>
            </aside>
        </div>
    );
};

// THE TIDE ============================================================================================================
// Cash with the public as a share of GDP, by financial year, in two panels with a break between them: on the left the
// long run from 1951-52 to the ebb of 2016-17, on the right the return from 2016-17 to the latest year, drawn wider so
// its years can be read. The left draws in first, then the right; the marked years label themselves as the line
// reaches them, and the official record's events stand as pins on the right.
export interface TideMark { fy : string; at : "right" | "below" | "above" | "under-right"; accent? : boolean; pulse? : boolean; note? : string }
export const TideStep = ({ layout, breakAt, marks, events, children } : { layout? : Layout; breakAt : string; marks : TideMark[]; events? : StepEvent[]; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const n = TIDE.length, b = TIDE_FYS.indexOf(breakAt);
    const narrow = w < 560;
    const pad = { l : 44, r : narrow ? 54 : 74, t : 56, b : 40 }, gap = narrow ? 18 : 34;
    const span = w - pad.l - pad.r - gap, wl = span * (narrow ? 0.5 : 0.56), wr = span - wl;
    const XL = (i : number) => pad.l + i / b * wl;
    const XR = (i : number) => pad.l + wl + gap + (i - b) / (n - 1 - b) * wr;
    const X = (i : number, side : "l" | "r" = i < b ? "l" : "r") => side === "l" ? XL(i) : XR(i);
    const Y = (v : number) => pad.t + (1 - v / 15) * (h - pad.t - pad.b);
    const line = (from : number, to : number, side : "l" | "r") => TIDE.slice(from, to + 1).map((v, k) => `${X(from + k, side).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const area = (from : number, to : number, side : "l" | "r") => `${X(from, side)},${Y(0)} ${line(from, to, side)} ${X(to, side)},${Y(0)}`;
    const LEFT_FOR = 2.0, RIGHT_AT = 2.1, RIGHT_FOR = 1.6;
    const markAt = (i : number, side : "l" | "r") => side === "l" ? LEFT_FOR * i / b + 0.2 : RIGHT_AT + RIGHT_FOR * (i - b) / (n - 1 - b) + 0.2;
    const leftYears = [ "1951-52", "1971-72", "1991-92", "2011-12" ].map(f => TIDE_FYS.indexOf(f)).filter(i => i <= b - 3);
    const rightYears = TIDE_FYS.map((f, i) => i).filter(i => i >= b && (!narrow || (i - b) % 2 === 0));
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = px < pad.l + wl + gap / 2
            ? Math.max(0, Math.min(b, Math.round((px - pad.l) / wl * b)))
            : Math.max(b, Math.min(n - 1, b + Math.round((px - pad.l - wl - gap) / wr * (n - 1 - b))));
        return { x : X(i, i <= b && px < pad.l + wl + gap / 2 ? "l" : "r"), y : Y(TIDE[i]), head : TIDE_FYS[i], lines : [ `${TIDE[i].toFixed(1)}% of GDP held as cash by the public` ] };
    });
    const pins = (events ?? []).filter(e => e.k >= b).map(e => ({ ...e, x : XR(e.k), y : Y(TIDE[e.k]), delay : markAt(e.k, "r") + 0.1 }));
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage tide-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Cash with the public as a share of GDP. ${TIDE_FYS[0]} to ${breakAt}: from ${TIDE[0]}% to ${TIDE[b]}%. ${breakAt} to ${TIDE_FYS[n - 1]}: ${marks.map(m => `${TIDE[TIDE_FYS.indexOf(m.fy)]}% in ${m.fy}`).join("; ")}.`}>
                        <defs>
                            <linearGradient id={`${uid}-fill`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor="#864fe3" stopOpacity="0.28" />
                                <stop offset="1" stopColor="#864fe3" stopOpacity="0.02" />
                            </linearGradient>
                            <clipPath id={`${uid}-l`}><rect className="tide-wipe" x={0} y={0} width={pad.l + wl + 1} height={h} style={{ transform : drawn ? "none" : "scaleX(0)", transitionDuration : `${LEFT_FOR}s` }} /></clipPath>
                            <clipPath id={`${uid}-r`}><rect className="tide-wipe" x={pad.l + wl + gap - 1} y={0} width={wr + pad.r} height={h} style={{ transform : drawn ? "none" : "scaleX(0)", transitionDuration : `${RIGHT_FOR}s`, transitionDelay : drawn ? `${RIGHT_AT}s` : "0s" }} /></clipPath>
                        </defs>
                        <text className="tide-panel" x={pad.l} y={22}>{TIDE_FYS[0]} to {breakAt}</text>
                        <text className="tide-panel is-right" x={pad.l + wl + gap} y={22}>{narrow ? `${breakAt.slice(0, 4)}–${TIDE_FYS[n - 1].slice(2, 4)}` : `${breakAt} to ${TIDE_FYS[n - 1]}, every year`}</text>
                        {[ 4, 8, 12 ].map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={pad.l + wl} y1={Y(v)} y2={Y(v)} />
                                <line x1={pad.l + wl + gap} x2={w - pad.r + 30} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{v}%</text>
                            </g>
                        ))}
                        {/* the break: two short slants across the baseline, and the ebb's level carried across */}
                        <g className="tide-break">
                            <line x1={pad.l + wl + gap / 2 - 7} x2={pad.l + wl + gap / 2 - 1} y1={Y(0) + 7} y2={Y(0) - 7} />
                            <line x1={pad.l + wl + gap / 2 + 1} x2={pad.l + wl + gap / 2 + 7} y1={Y(0) + 7} y2={Y(0) - 7} />
                            <line className="tide-carry" x1={XL(b)} x2={XR(b)} y1={Y(TIDE[b])} y2={Y(TIDE[b])} />
                        </g>
                        {leftYears.map(i => <text key={i} className="tide-year" x={XL(i)} y={h - pad.b + 22} textAnchor="middle">{TIDE_FYS[i].slice(0, 4)}</text>)}
                        {rightYears.map(i => <text key={i} className="tide-year" x={XR(i)} y={h - pad.b + 22} textAnchor="middle">{narrow ? `’${TIDE_FYS[i].slice(2, 4)}` : TIDE_FYS[i].slice(0, 4)}</text>)}
                        <g clipPath={`url(#${uid}-l)`}>
                            <polygon className="tide-area" fill={`url(#${uid}-fill)`} points={area(0, b, "l")} />
                            <polyline className="tide-line" points={line(0, b, "l")} />
                        </g>
                        <g clipPath={`url(#${uid}-r)`}>
                            <polygon className="tide-area" fill={`url(#${uid}-fill)`} points={area(b, n - 1, "r")} />
                            <polyline className="tide-line" points={line(b, n - 1, "r")} />
                        </g>
                        {marks.map(m => {
                            const i = TIDE_FYS.indexOf(m.fy), side = i < b || (i === b && m.at !== "below") ? "l" : "r";
                            const x = X(i, side), y = Y(TIDE[i]);
                            const [ tx, ty, anchor ] : [ number, number, "start" | "middle" ] = m.at === "right" ? [ x + 14, y + 5, "start" ]
                                : m.at === "below" ? [ x, y + 26, "middle" ] : m.at === "above" ? [ x, y - 30, "middle" ] : [ x + 10, y + 24, "start" ];
                            return (
                                <g key={m.fy + side} className={`tide-mark ${m.accent ? "is-ebb" : ""} ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${markAt(i, side)}s` }}>
                                    {m.pulse && <circle className="tide-pulse" cx={x} cy={y} r={6} />}
                                    <circle cx={x} cy={y} r={m.accent ? 5 : 4} />
                                    <text x={tx} y={ty} textAnchor={anchor}>{TIDE[i].toFixed(1)}%</text>
                                    <text className="tide-sub" x={tx} y={ty + 17} textAnchor={anchor}>{m.note ?? m.fy}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// THE CARD WENT FIRST =================================================================================================
// UPI payments and debit-card payments, month by month from November 2019, on a log scale (so a fall to a quarter and
// a rise of 19 times both read as the distances they are), in crore a month or as an index of November 2019. The lines
// draw in when the step comes on screen; each ends in its latest value.
const LINES = [
    { key : "upi", label : "UPI", cls : "is-upi", values : PAY.upi.volume },
    { key : "debit", label : "Debit cards", cls : "is-debit", values : PAY.debit.volume },
];
const fmtVal = (v : number) => v >= 100 ? Math.round(v).toLocaleString("en-IN") : v.toFixed(1);
export const PayStep = ({ layout, events, children } : { layout? : Layout; events? : StepEvent[]; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    const [ index, setIndex ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const pad = { l : 52, r : 120, t : 28, b : 52 };
    const series = LINES.map(l => ({ ...l, shown : index ? l.values.map(v => v / l.values[0] * 100) : l.values }));
    const ticks = index ? [ 10, 100, 1000 ] : [ 1, 10, 100, 1000 ];
    const lo = Math.log10(index ? 10 : 5), hi = Math.log10(index ? 3000 : 3500);
    const X = (i : number) => pad.l + i / (PAY_MONTHS.length - 1) * (w - pad.l - pad.r);
    const Y = (v : number) => pad.t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (h - pad.t - pad.b);
    // a label each January; on a narrow stage, every other one
    const years = PAY_MONTHS.map((m, i) => [ m, i ] as const).filter(([ m ]) => m.endsWith("-01") && (w > 520 || +m.slice(0, 4) % 2 === 0));
    const last = PAY_MONTHS.length - 1;
    // the readout gives both lines for the month; the pins stand on the debit-card line, which they are about
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = Math.max(0, Math.min(last, Math.round((px - pad.l) / (w - pad.l - pad.r) * last)));
        return { x : X(i), y : Y(series[0].shown[i]), head : monthName(PAY_MONTHS[i]),
            lines : series.map(sr => `${sr.label}: ${index ? fmtVal(sr.shown[i]) : `${fmtVal(sr.shown[i])} crore payments`}`) };
    });
    const pins = (events ?? []).map(e => ({ ...e, x : X(e.k), y : Y(series[1].shown[e.k]), delay : 2.4 * e.k / last + 0.3 }));
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage pay-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Payments a month, November 2019 to ${PAY_MONTHS[last]}: UPI from ${fmtVal(PAY.upi.volume[0])} to ${fmtVal(PAY.upi.volume[last])} crore; debit cards from ${fmtVal(PAY.debit.volume[0])} to ${fmtVal(PAY.debit.volume[last])} crore.`}>
                        <defs>
                            <clipPath id={`${uid}-draw`}><rect className="tide-wipe" x={0} y={0} width={w} height={h} style={{ transform : drawn ? "none" : "scaleX(0)" }} /></clipPath>
                        </defs>
                        {ticks.map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r + 40} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{v.toLocaleString("en-IN")}</text>
                            </g>
                        ))}
                        {index && <line className="pay-base" x1={pad.l} x2={w - pad.r + 40} y1={Y(100)} y2={Y(100)} />}
                        {years.map(([ m, i ]) => <text key={m} className="tide-year" x={X(i)} y={h - pad.b + 22} textAnchor="middle">{m.slice(0, 4)}</text>)}
                        <g clipPath={`url(#${uid}-draw)`}>
                            {series.map(sr => <polyline key={sr.key} className={`pay-line ${sr.cls}`} points={sr.shown.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} />)}
                        </g>
                        {series.map(sr => (
                            <g key={sr.key} className={`pay-end ${sr.cls} ${drawn ? "is-shown" : ""}`}>
                                <circle cx={X(last)} cy={Y(sr.shown[last])} r={4} />
                                <text x={X(last) + 10} y={Y(sr.shown[last]) - 2}>{sr.label}</text>
                                <text className="pay-num" x={X(last) + 10} y={Y(sr.shown[last]) + 15}>{index ? fmtVal(sr.shown[last]) : `${fmtVal(sr.shown[last])} crore`}</text>
                            </g>
                        ))}
                        <text className="tide-year" x={pad.l} y={pad.t - 12}>{index ? "Index, November 2019 = 100 (log scale)" : "Crore payments a month (log scale)"}</text>
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">
                {children}
                <div className="hands-mode" role="group" aria-label="Show as">
                    <button type="button" className={index ? "" : "is-on"} aria-pressed={!index} onClick={() => setIndex(false)}>Crore a month</button>
                    <button type="button" className={index ? "is-on" : ""} aria-pressed={index} onClick={() => setIndex(true)}>Index, Nov 2019 = 100</button>
                </div>
            </aside>
        </div>
    );
};

// THE NOTE WALL =======================================================================================================
// The banknotes in circulation at the end of each March, from 2015, as a wall of notes, each ₹10,000 crore of value,
// grouped and coloured by denomination: the ₹2,000 first, then the ₹1,000, the ₹500, the ₹200, the ₹100 and everything
// smaller. The year moves on by itself once the step is on screen, or by the slider.
const BRICK = 10000;                                              // ₹ crore a note on the wall
// The ₹500 is two groups: the old series, until it was withdrawn on 08-11-2016, and the new series after it. The RBI
// prints one ₹500 row, so the row is the old series to March 2016 and the new from March 2017.
const NEW_500 = "2017-03";
const DENOMS = [
    { key : "2000", label : "₹2,000", value : "2000", match : [ "2000" ], cls : "d-2000" },
    { key : "1000", label : "₹1,000", value : "1000", match : [ "1000" ], cls : "d-1000" },
    { key : "500old", label : "₹500 (old)", value : "500", match : [ "500" ], until : NEW_500, cls : "d-500old" },
    { key : "500", label : "₹500", value : "500", match : [ "500" ], from : NEW_500, cls : "d-500" },
    { key : "200", label : "₹200", value : "200", match : [ "200" ], cls : "d-200" },
    { key : "100", label : "₹100", value : "100", match : [ "100" ], cls : "d-100" },
    { key : "small", label : "₹50 and below", value : "", match : [ "50", "20", "10", "2 and 5" ], cls : "d-small" },
] as { key : string; label : string; value : string; match : string[]; from? : string; until? : string; cls : string }[];
const YEARS = NOTE_YEARS ?? [];
const WALL = YEARS.map(y => {
    const values = DENOMS.map(d => (d.from && y.march < d.from) || (d.until && y.march >= d.until) ? 0
        : y.notes.filter(n => d.match.includes(n.denom)).reduce((a, n) => a + n.value, 0));
    const total = values.reduce((a, b) => a + b, 0);
    // each group's notes, rounded on the running total so the groups always add up to the wall
    let run = 0;
    const ends = values.map(v => Math.round((run += v) / BRICK));
    return { march : y.march, total, values, shares : values.map(v => v / total), ends };
});
const MOST = Math.max(...WALL.map(y => y.ends[y.ends.length - 1]));
const fmtLakhCrore = (crore : number) => `₹${(crore / 1e5).toFixed(1)} lakh crore`;
// Each note on the wall keeps its identity from year to year (its denomination and its place in that denomination's
// pile), so when the notes below it go, it falls into the gap, as in Tetris; new notes drop in from above, and notes
// that go flash and vanish. The wall holds a moment longer on a year a denomination clears.
interface Brick { id : string; g : number; pos : number; fresh? : boolean; leaving? : boolean }
const bricksOf = (y : (typeof WALL)[number]) => {
    const out : Brick[] = [];
    let pos = 0;
    y.ends.forEach((end, g) => {
        const start = g ? y.ends[g - 1] : 0;
        for (let j = 0; j < end - start; j++) out.push({ id : `${DENOMS[g].key}-${j}`, g, pos : pos++ });
    });
    return out;
};
export const NoteWallStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ k, setK ] = useState(YEARS.length - 1);
    const [ playing, setPlaying ] = useState(false);
    const [ bricks, setBricks ] = useState<Brick[]>([]);
    const started = useRef(false);
    useEffect(() => {
        if (!seen || started.current || reducedMotion()) return;
        started.current = true; setK(0); setPlaying(true);
    }, [ seen ]);
    // the year's bricks: the ones staying move to their new places, new ones come in, and the ones going stay a moment
    // (flashing) before they are removed
    useEffect(() => {
        const year = WALL[k];
        // the wall stays empty until the step is seen, so its first frame is March 2015's notes falling in (with reduced
        // motion, the latest year shows at once)
        if (!year || (!started.current && !reducedMotion())) return;
        const next = bricksOf(year), keep = new Set(next.map(b => b.id));
        setBricks(prev => {
            const had = new Set(prev.filter(b => !b.leaving).map(b => b.id));
            return [ ...next.map(b => ({ ...b, fresh : started.current && !had.has(b.id) })), ...prev.filter(b => !keep.has(b.id) && !b.leaving).map(b => ({ ...b, leaving : true })) ];
        });
        const t = setTimeout(() => setBricks(bs => bs.filter(b => !b.leaving)), 800);
        return () => clearTimeout(t);
    }, [ k ]);
    useEffect(() => {
        if (!playing) return;
        if (k >= YEARS.length - 1) { setPlaying(false); return; }
        // a longer pause after a year in which a denomination cleared off the wall
        const cleared = k > 0 && WALL[k].ends.some((e, g) => (e - (g ? WALL[k].ends[g - 1] : 0)) < 0.2 * (WALL[k - 1].ends[g] - (g ? WALL[k - 1].ends[g - 1] : 0)));
        const t = setTimeout(() => setK(k + 1), k === 0 ? 1600 : cleared ? 2400 : 1300);
        return () => clearTimeout(t);
    }, [ playing, k ]);
    const { w, h } = size;
    const year = WALL[k];
    if (!year) return null;
    // the wall: a grid shaped to the stage, big enough for the largest year, laid row by row from the bottom up
    // each place on the wall is a note's shape (177 × 73), as on the close
    const RATIO = 73 / 177;
    const cols = Math.max(12, Math.round(Math.sqrt(MOST * RATIO * (w || 1) / (h || 1))));
    const rows = Math.ceil(MOST / cols);
    const cell = Math.max(4, Math.min((w - 8) / cols, (h - 40) / rows / RATIO));
    const nw = cell, nh = cell * RATIO, x0 = (w - cols * nw) / 2, y0 = h - 8;
    const place = (pos : number) => [ x0 + (pos % cols) * nw, y0 - (Math.floor(pos / cols) + 1) * nh ] as const;
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage wall-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Banknotes in circulation, March ${year.march.slice(0, 4)}: ${fmtLakhCrore(year.total)}. ${DENOMS.map((d, j) => `${d.label} ${(year.shares[j] * 100).toFixed(1)}%`).join(", ")} of the value.`}>
                        {Array.from({ length : rows * cols }, (_, i) => { const [ x, y ] = place(i); return <rect key={i} className="wall-slot" x={x + 1} y={y + 1} width={nw - 2} height={nh - 2} rx={1.5} />; })}
                        {bricks.map(b => {
                            const [ x, y ] = place(b.pos);
                            return (
                                <g key={b.id} className={`wall-brick ${b.leaving ? "is-leaving" : ""}`} style={{ transform : `translate(${x}px, ${y}px)` }}>
                                    <g className={b.fresh ? "is-new" : ""} style={{ "--from" : `${-(y + nh + 20)}px`, animationDelay : `${(b.pos % cols) * 0.012}s` } as React.CSSProperties}>
                                        <NoteFace x={1.5} y={1.5} w={nw - 3} h={nh - 3} denom={DENOMS[b.g].key} value={DENOMS[b.g].value} detail={DENOMS[b.g].value ? "full" : "low"} />
                                    </g>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
            <aside className="split-card">
                {children}
                <div className="wall-readout">
                    <span className="rain-month">March {year.march.slice(0, 4)} · {fmtLakhCrore(year.total)} in notes</span>
                    <ul className="wall-key">
                        {DENOMS.map((d, j) => (
                            <li key={d.key} className={year.shares[j] < 0.0005 ? "is-gone" : ""}>
                                <NoteIcon denom={d.key} value={d.value} width={30} />{d.label}<b>{(year.shares[j] * 100).toFixed(1)}%</b>
                            </li>
                        ))}
                    </ul>
                    <span className="rain-key">Each note on the wall stands for ₹10,000 crore of the value of banknotes in circulation at the end of March. The RBI prints one ₹500 row: the old series to March 2016, the new from March 2017.</span>
                </div>
                <div className="rain-time">
                    <button type="button" onClick={() => { if (playing) setPlaying(false); else { if (k >= YEARS.length - 1) setK(0); setPlaying(true); } }} aria-label={playing ? "Pause" : "Play the years"}>{playing ? "❚❚" : "▶"}</button>
                    <input type="range" min={0} max={YEARS.length - 1} step={1} value={k} aria-label="Year" aria-valuetext={`March ${year.march.slice(0, 4)}`}
                        onChange={e => { started.current = true; setPlaying(false); setK(+e.target.value); }} />
                    <span className="rain-years"><span>{YEARS[0]?.march.slice(0, 4)}</span><span>{YEARS[YEARS.length - 1]?.march.slice(0, 4)}</span></span>
                </div>
            </aside>
        </div>
    );
};

// PAYING AND KEEPING ==================================================================================================
// The close: the header, then the two multiples side by side, each with its large icon and, under it, a row of small
// ones, one for each time the first figure fits into the last (the last one cut to the fraction); then six of the
// story's figures, and a line of the RBI's. Static.
export interface CloseSide { tone : "paying" | "keeping"; times : number; icon : ReactNode; unit : (w : number) => ReactNode; unitWidth : number; each : string; caption : string }
const UnitRow = ({ times, unit, w } : { times : number; unit : (w : number) => ReactNode; w : number }) => {
    const whole = Math.floor(times), part = times - whole;
    return (
        <div className="close-units" aria-hidden="true">
            {Array.from({ length : whole }, (_, k) => <span key={k} className="close-unit">{unit(w)}</span>)}
            {part > 0.05 && <span className="close-unit is-part" style={{ width : w * part }}>{unit(w)}</span>}
        </div>
    );
};
export const CloseStep = ({ sides, facts, note, children } : { sides : CloseSide[]; facts? : { value : string; label : string }[]; note? : ReactNode; children : ReactNode }) => (
    <div className="close">
        <div className="close-words">{children}</div>
        <div className="close-pair">
            {sides.map(sd => (
                <div key={sd.tone} className={`close-side is-${sd.tone}`}>
                    <div className="close-big">{sd.icon}<b>{sd.times.toFixed(1)}x</b></div>
                    <UnitRow times={sd.times} unit={sd.unit} w={sd.unitWidth} />
                    <span className="close-each">{sd.each}</span>
                    <span className="close-caption">{sd.caption}</span>
                </div>
            ))}
        </div>
        {facts && (
            <ul className="close-facts">
                {facts.map(f => <li key={f.label}><b>{f.value}</b><span>{f.label}</span></li>)}
            </ul>
        )}
        {note && <div className="close-words">{note}</div>}
    </div>
);

// A MONTHLY LINE ======================================================================================================
// One series by month, drawn in when the step comes on screen, with an optional dashed reference level, marked months
// (each labelled with its value and a note), and numbered events from the official record beneath the line.
export interface LineMark { month : string; at : "right" | "below" | "above" | "under-right"; accent? : boolean; pulse? : boolean; note? : string }
export const LineStep = ({ layout, months, values, fmt, ticks, lo, hi, tone, axis, marks, level, events, read, children } : {
    layout? : Layout; months : string[]; values : number[]; fmt : (v : number) => string; ticks : number[]; lo : number; hi : number;
    tone : "neem" | "terracotta" | "indivara"; axis : string; marks : LineMark[]; level? : { value : number; label : string };
    events? : StepEvent[]; read? : (i : number) => string[]; children : ReactNode;
}) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const pad = { l : 64, r : 96, t : 40, b : 52 };
    const n = months.length;
    const X = (i : number) => pad.l + i / (n - 1) * (w - pad.l - pad.r);
    const Y = (v : number) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
    const years = months.map((m, i) => [ m, i ] as const).filter(([ m ]) => m.endsWith("-01") && (w > 520 || +m.slice(0, 4) % 2 === 0));
    const pts = values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - pad.l) / (w - pad.l - pad.r) * (n - 1))));
        return { x : X(i), y : Y(values[i]), head : monthName(months[i]), lines : read ? read(i) : [ fmt(values[i]) ] };
    });
    const pins = (events ?? []).filter(e => months.includes(e.month)).map(e => {
        const i = months.indexOf(e.month);
        return { ...e, x : X(i), y : Y(values[i]), delay : 2.4 * i / n + 0.3 };
    });
    return (
        <div className={splitClass(layout)}>
            <div className={`split-stage line-stage is-${tone}`} ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`${axis}, ${months[0]} to ${months[n - 1]}: ${marks.map(m => `${fmt(values[months.indexOf(m.month)])} in ${m.month}`).join("; ")}.`}>
                        <defs>
                            <clipPath id={`${uid}-draw`}><rect className="tide-wipe" x={0} y={0} width={w} height={h} style={{ transform : drawn ? "none" : "scaleX(0)" }} /></clipPath>
                        </defs>
                        {ticks.map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r + 40} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{fmt(v)}</text>
                            </g>
                        ))}
                        {years.map(([ m, i ]) => <text key={m} className="tide-year" x={X(i)} y={h - pad.b + 22} textAnchor="middle">{m.slice(0, 4)}</text>)}
                        <text className="tide-year" x={pad.l} y={pad.t - 18}>{axis}</text>
                        {level && <g className="line-level">
                            <line x1={pad.l} x2={w - pad.r + 40} y1={Y(level.value)} y2={Y(level.value)} />
                            <text x={w - pad.r + 40} y={Y(level.value) - 6} textAnchor="end">{level.label}</text>
                        </g>}
                        <g clipPath={`url(#${uid}-draw)`}><polyline className="line-path" points={pts} /></g>
                        {marks.map(m => {
                            const i = months.indexOf(m.month), x = X(i), y = Y(values[i]);
                            const [ tx, ty, anchor ] : [ number, number, "start" | "middle" ] = m.at === "right" ? [ x + 14, y + 5, "start" ]
                                : m.at === "below" ? [ x, y + 26, "middle" ] : m.at === "above" ? [ x, y - 30, "middle" ] : [ x + 10, y + 24, "start" ];
                            return (
                                <g key={m.month} className={`tide-mark line-mark ${m.accent ? "is-ebb" : ""} ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${2.4 * i / n + 0.2}s` }}>
                                    {m.pulse && <circle className="tide-pulse" cx={x} cy={y} r={6} />}
                                    <circle cx={x} cy={y} r={m.accent ? 5 : 4} />
                                    <text x={tx} y={ty} textAnchor={anchor}>{fmt(values[i])}</text>
                                    <text className="tide-sub" x={tx} y={ty + 17} textAnchor={anchor}>{m.note ?? m.month}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// CASH HAS A SEASON ==================================================================================================
// A year as a clock, January at the top: for each month a petal, outward from the ring for the average growth of the
// currency in circulation in that month, inward for a fall. Round the outside, the RBI's own reading of each quarter
// (pointing at one shows its words and source). The petals open one after another, clockwise, like a hand going round.
// each quarter's colour, by its first month: summer and sowing turmeric, the monsoon lavender, the festive months
// terracotta, the rabi harvest Neem
const QUARTER_TINT : Record<number, string> = { 4 : "#eaaa3a", 7 : "#864fe3", 10 : "#ba644f", 1 : "#6b8e23" };
const QUARTER_INK : Record<number, string> = { 4 : "#a8741a", 7 : "#6a3cbd", 10 : "#9a4f3c", 1 : "#55721b" };
export interface SeasonPart { from : number; to : number; label : string; note : string; source : string; url : string }   // months 1–12, inclusive
export const SeasonStep = ({ layout, values, parts, children } : { layout? : Layout; values : Record<string, number>; parts : SeasonPart[]; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const [ over, setOver ] = useState<number | null>(null);
    const [ part, setPart ] = useState<number | null>(null);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const narrow = w < 560;
    const cx = w / 2, cy = h / 2 + 6, R = Math.max(60, Math.min(w / 2 - (narrow ? 30 : 190), h / 2 - (narrow ? 40 : 60)));   // room for the quarters' names
    const r0 = R * 0.42, most = Math.max(...Object.values(values).map(Math.abs));
    const k = (R * 0.94 - r0) / most;
    const ang = (m : number) => (-90 + (m - 1) * 30) * Math.PI / 180;           // month 1 (January) at the top
    const pt = (r : number, a : number) => [ cx + r * Math.cos(a), cy + r * Math.sin(a) ] as const;
    const sector = (ra : number, rb : number, a0 : number, a1 : number) => {
        const [ x0, y0 ] = pt(ra, a0), [ x1, y1 ] = pt(rb, a0), [ x2, y2 ] = pt(rb, a1), [ x3, y3 ] = pt(ra, a1);
        return `M${x0},${y0} L${x1},${y1} A${rb},${rb} 0 0 1 ${x2},${y2} L${x3},${y3} A${ra},${ra} 0 0 0 ${x0},${y0} Z`;
    };
    const months = Array.from({ length : 12 }, (_, i) => i + 1);
    const name = (m : number, style : "short" | "long") => new Date(2020, m - 1, 1).toLocaleString("en-GB", { month : style });
    const val = (m : number) => values[String(m).padStart(2, "0")];
    const peak = months.reduce((a, m) => (val(m) > val(a) ? m : a), 1);
    const focus = over ?? peak;
    const ringR = R + (narrow ? 14 : 30);
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage season-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Average change in currency in circulation in each month: ${months.map(m => `${name(m, "long")} ${val(m) > 0 ? "+" : ""}${val(m).toFixed(1)}%`).join(", ")}.`}>
                        {/* the quarters, as the RBI reads them: each a band behind its three months' petals, shading outward in
                            its own colour, its name outside */}
                        <defs>
                            {parts.map((p, i) => (
                                <radialGradient key={i} id={`${uid}-q${i}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={ringR}>
                                    <stop offset={r0 * 0.6 / ringR} stopColor={QUARTER_TINT[p.from] ?? "#e1d5bc"} stopOpacity={0.04} />
                                    <stop offset={1} stopColor={QUARTER_TINT[p.from] ?? "#e1d5bc"} stopOpacity={0.42} />
                                </radialGradient>
                            ))}
                        </defs>
                        {parts.map((p, i) => {
                            const a0 = ang(p.from) - Math.PI / 12 + 0.012, a1 = ang(p.to) + Math.PI / 12 - 0.012;
                            const [ lx, ly ] = pt(ringR + 16, (a0 + a1) / 2);
                            return (
                                <g key={p.label} className={`season-part ${part === i ? "is-on" : ""}`} onPointerEnter={() => setPart(i)} onPointerLeave={() => setPart(null)} onClick={() => setPart(o => (o === i ? null : i))}>
                                    <path d={sector(r0 * 0.6, ringR + 4, a0, a1)} fill={`url(#${uid}-q${i})`} />
                                    {!narrow && <text x={lx} y={ly} textAnchor={lx < cx - 20 ? "end" : lx > cx + 20 ? "start" : "middle"} style={{ "--q-ink" : QUARTER_INK[p.from], "--q-tint" : QUARTER_TINT[p.from] } as React.CSSProperties}>{p.label}</text>}
                                </g>
                            );
                        })}
                        <circle className="season-zero" cx={cx} cy={cy} r={r0} />
                        {[ 1, 2 ].filter(v => v <= most).map(v => <circle key={v} className="season-ring" cx={cx} cy={cy} r={r0 + v * k} />)}
                        {months.map((m, i) => {
                            const v = val(m), a = ang(m), rb = r0 + v * k;
                            const [ vx, vy ] = pt(v >= 0 ? rb + 12 : rb - 12, a);
                            return (
                                <g key={m} onPointerEnter={() => setOver(m)} onPointerLeave={() => setOver(null)} onClick={() => setOver(o => (o === m ? null : m))}>
                                    <path className={`season-petal ${v >= 0 ? "is-up" : "is-down"} ${drawn ? "is-drawn" : ""} ${over === m ? "is-on" : ""}`}
                                        d={sector(Math.min(r0, rb), Math.max(r0, rb), a - 0.2, a + 0.2)}
                                        style={{ transitionDelay : `${i * 0.11}s`, transformOrigin : `${cx}px ${cy}px` }} />
                                    <text className={`season-val ${drawn ? "is-shown" : ""}`} x={vx} y={vy + 4} textAnchor="middle" style={{ transitionDelay : `${i * 0.11 + 0.4}s` }}>{v > 0 ? "+" : ""}{v.toFixed(1)}</text>
                                </g>
                            );
                        })}
                        {months.map(m => { const [ lx, ly ] = pt(r0 - 14, ang(m)); return <text key={m} className="season-month" x={lx} y={ly + 4} textAnchor="middle">{name(m, "short").slice(0, narrow ? 1 : 3)}</text>; })}
                        <g className="season-centre">
                            <text x={cx} y={cy - 4} textAnchor="middle" className="is-big">{val(focus) > 0 ? "+" : ""}{val(focus).toFixed(1)}%</text>
                            <text x={cx} y={cy + 16} textAnchor="middle">{name(focus, "long")}</text>
                        </g>
                    </svg>
                )}
                {part !== null && parts[part] && (
                    <div className="chart-tip is-season">
                        <strong>{parts[part].label}</strong>
                        <span>{parts[part].note}</span>
                        <a href={parts[part].url} target="_blank" rel="noopener">{parts[part].source} ↗</a>
                    </div>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// THE FESTIVE WEEKS ===================================================================================================
// One ridge a year, 2012 at the top: the cash drawn out above that year's normal pace, from six weeks before Diwali to
// six weeks after, all on one scale, so the ridges' heights compare; a dashed line runs down through the week of Diwali.
// The ridges draw in one after another; pointing at a year (or a tap) gives its numbers. Left-out years are marked.
export const FestiveStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const [ over, setOver ] = useState<number | null>(null);
    const { w, h } = size;
    const narrow = w < 560;
    const first = FESTIVE.years[0].year, lastYr = FESTIVE.years[FESTIVE.years.length - 1].year;
    const years = Array.from({ length : lastYr - first + 1 }, (_, i) => first + i);
    const byYear = new Map(FESTIVE.years.map(y => [ y.year, y ]));
    const pad = { l : narrow ? 34 : 56, r : narrow ? 44 : 70, t : 70, b : 40 };
    const rh = (h - pad.t - pad.b) / years.length;
    const top = Math.max(...FESTIVE.years.flatMap(y => y.path));
    const amp = rh * 2.2 / top;                                              // ridges may rise into the row above
    const XW = (j : number) => pad.l + j / 12 * (w - pad.l - pad.r);
    const base = (i : number) => pad.t + (i + 1) * rh;
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage festive-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Cash drawn out around Diwali above the normal pace, one ridge a year: ${FESTIVE.years.map(y => `${y.year} ${y.before}% in the three weeks before`).join(", ")}.`}>
                        <text className="tide-year" x={pad.l} y={22}>{narrow ? "Extra cash drawn around Diwali, each year" : "Extra cash drawn out around Diwali, each year, above the usual pace"}</text>
                        <line className="festive-day" x1={XW(6)} x2={XW(6)} y1={pad.t - 30} y2={h - pad.b + 4} />
                        <text className="festive-daylabel" x={XW(6)} y={pad.t - 36} textAnchor="middle">Diwali week</text>
                        {[ 0, 12 ].map(j => <text key={j} className="tide-year" x={XW(j)} y={h - pad.b + 22} textAnchor={j ? "end" : "start"}>{j ? "6 weeks after" : "6 weeks before"}</text>)}
                        {years.map((yr, i) => {
                            const y = byYear.get(yr), b0 = base(i);
                            if (!y) return (
                                <g key={yr} className="festive-gone">
                                    <line x1={XW(0)} x2={XW(12)} y1={b0} y2={b0} />
                                    <text className="tide-year" x={pad.l - 8} y={b0 + 4} textAnchor="end">{narrow ? `’${String(yr).slice(2)}` : yr}</text>
                                    {!narrow && <text className="tide-year" x={XW(12) + 8} y={b0 + 4}>left out</text>}
                                </g>
                            );
                            const pts = y.path.map((v, j) => `${XW(j).toFixed(1)},${(b0 - Math.max(-rh * 0.4, v * amp)).toFixed(1)}`);
                            const line = pts.join(" "), fill = `${XW(0)},${b0} ${line} ${XW(12)},${b0}`;
                            return (
                                <g key={yr} className={`festive-ridge ${drawn ? "is-drawn" : ""} ${over === yr ? "is-on" : ""}`} style={{ "--d" : `${i * 0.12}s` } as React.CSSProperties}
                                    onPointerEnter={() => setOver(yr)} onPointerLeave={() => setOver(null)} onClick={() => setOver(o => (o === yr ? null : yr))}>
                                    <rect className="festive-hit" x={0} y={b0 - rh} width={w} height={rh} />
                                    <polygon className="festive-fill" points={fill} />
                                    <polyline className="festive-line" points={line} />
                                    <text className="tide-year" x={pad.l - 8} y={b0 + 4} textAnchor="end">{narrow ? `’${String(yr).slice(2)}` : yr}</text>
                                    <text className="festive-val" x={XW(12) + 8} y={b0 + 4}>+{y.before.toFixed(1)}%</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
                {over !== null && byYear.get(over) && (() => {
                    const y = byYear.get(over)!, i = years.indexOf(over);
                    return (
                        <div className="chart-tip" style={{ transform : `translate(${Math.min(w - 230, XW(6) + 16)}px, ${Math.max(4, base(i) - rh - 70)}px)` }}>
                            <strong>Diwali {y.year}, {new Date(`${y.diwali}T00:00:00`).toLocaleDateString("en-GB", { day : "numeric", month : "long" })}</strong>
                            <span>Three weeks before: {y.before.toFixed(2)}% above the usual pace (₹{y.crore.toLocaleString("en-IN")} crore drawn in all)</span>
                            <span>Four weeks after: {y.after > 0 ? "+" : ""}{y.after.toFixed(2)}%</span>
                        </div>
                    );
                })()}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};
