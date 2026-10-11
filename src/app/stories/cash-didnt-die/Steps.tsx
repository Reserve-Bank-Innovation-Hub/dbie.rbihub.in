"use client";

// The story's flat steps, drawn in SVG: the guess (how much cash, before and after) and the tide (cash with the public
// as a share of GDP since 1951-52). Each starts its motion the first time it is mostly on screen; with reduced motion
// each is drawn at once.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, TIDE, TIDE_FYS } from "./data.gen";

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
const VERDICT : Record<Guess, string> = { down : "Not down.", same : "Not the same.", up : "Yes, up." };

const Pile = ({ lakh, x, base, slab, width, rise, delay } : { lakh : number; x : number; base : number; slab : number; width : number; rise : boolean; delay : number }) => {
    const whole = Math.floor(lakh), part = lakh - whole;
    const notes = Array.from({ length : whole + (part > 0.05 ? 1 : 0) }, (_, k) => k);
    return (
        <g>
            {notes.map(k => {
                const h = (k === whole ? part : 1) * (slab - 2);
                const y = base - (k + 1) * slab + (slab - 2 - h);
                const skew = Math.sin(k * 2.3) * width * 0.025;      // a pile is never quite straight
                return (
                    <rect key={k} className={`pile-note ${rise ? "is-up" : ""}`} x={x - width / 2 + skew} y={y} width={width} height={Math.max(1, h)} rx={2}
                        style={{ transitionDelay : `${delay + k * 0.035}s` }} />
                );
            })}
        </g>
    );
};

export const GuessStep = ({ children } : { children : ReactNode }) => {
    const { ref, size } = useStage<HTMLDivElement>();
    const [ guess, setGuess ] = useState<Guess | null>(null);
    const { w, h } = size;
    const top = 40, bottom = 64;
    const slab = Math.max(3, Math.min(16, (h - top - bottom) / Math.ceil(MARCH_LAST / 1e5)));
    const width = Math.min(220, w * 0.3), base = h - bottom;
    const xs = [ w * 0.3, w * 0.7 ];
    return (
        <div className="split">
            <div className="split-stage guess-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={guess ? `Currency in circulation: ₹${lakhCrore(MARCH_2016)} lakh crore in March 2016, ₹${lakhCrore(MARCH_LAST)} lakh crore in March ${LAST_YEAR}, each note ₹1 lakh crore.` : `Currency in circulation in March 2016: ₹${lakhCrore(MARCH_2016)} lakh crore, a pile of notes; March ${LAST_YEAR} is a question.`}>
                        <Pile lakh={MARCH_2016 / 1e5} x={xs[0]} base={base} slab={slab} width={width} rise delay={0} />
                        <Pile lakh={MARCH_LAST / 1e5} x={xs[1]} base={base} slab={slab} width={width} rise={!!guess} delay={0.1} />
                        {!guess && <text className="guess-mark" x={xs[1]} y={base - 60} textAnchor="middle">?</text>}
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
                    {([ [ "down", "Gone down" ], [ "same", "About the same" ], [ "up", "Gone up" ] ] as [ Guess, string ][]).map(([ g, label ]) => (
                        <button key={g} type="button" className={guess === g ? "is-on" : ""} aria-pressed={guess === g} onClick={() => setGuess(g)}>{label}</button>
                    ))}
                </div>
                <p className={`guess-answer ${guess ? "is-shown" : ""}`} aria-live="polite">
                    {guess && <>
                        <b>{VERDICT[guess]}</b> It went up {TIMES.toFixed(1)} times: ₹{lakhCrore(MARCH_2016)} lakh crore in March 2016,
                        ₹{lakhCrore(MARCH_LAST)} lakh crore in March {LAST_YEAR}. Each note in the piles is ₹1 lakh crore of currency in circulation.
                    </>}
                </p>
            </aside>
        </div>
    );
};

// THE TIDE ============================================================================================================
// Cash with the public as a share of GDP, by financial year from 1951-52, drawn in from the left up to `upto` (the
// ebb of 2016-17 on this step). Marked: where it starts, and the year of the ebb.
export const TideStep = ({ upto, children } : { upto : string; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const { w, h } = size;
    const n = TIDE_FYS.indexOf(upto) + 1;
    const pad = { l : 44, r : 24, t : 28, b : 40 };
    // the years shown fill the width, so the line always ends at the right edge, where the story has got to
    const X = (i : number) => pad.l + i / (n - 1) * (w - pad.l - pad.r - 70);
    const Y = (v : number) => pad.t + (1 - v / 14) * (h - pad.t - pad.b);
    const pts = TIDE.slice(0, n).map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    const ebb = n - 1, start = 0;
    const years = [ "1951-52", "1971-72", "1991-92", "2011-12" ].map(f => TIDE_FYS.indexOf(f)).filter(i => i < n - 4);
    return (
        <div className="split">
            <div className="split-stage tide-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Cash with the public as a share of GDP, ${TIDE_FYS[0]} to ${upto}: ${TIDE[0]}% at the start; ${TIDE[ebb]}% in ${upto}.`}>
                        <defs>
                            <linearGradient id="tide-fill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor="#864fe3" stopOpacity="0.28" />
                                <stop offset="1" stopColor="#864fe3" stopOpacity="0.02" />
                            </linearGradient>
                            <clipPath id="tide-draw"><rect className={`tide-wipe ${drawn ? "is-drawn" : ""}`} x={0} y={0} width={w} height={h} /></clipPath>
                        </defs>
                        {[ 4, 8, 12 ].map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{v}%</text>
                            </g>
                        ))}
                        {years.map(i => <text key={i} className="tide-year" x={X(i)} y={h - pad.b + 22} textAnchor="middle">{TIDE_FYS[i].slice(0, 4)}</text>)}
                        <g clipPath="url(#tide-draw)">
                            <polygon className="tide-area" points={`${X(0)},${Y(0)} ${pts.join(" ")} ${X(ebb)},${Y(0)}`} />
                            <polyline className="tide-line" points={pts.join(" ")} />
                        </g>
                        <g className={`tide-mark ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : "0.2s" }}>
                            <circle cx={X(start)} cy={Y(TIDE[start])} r={4} />
                            <text x={X(start) + 10} y={Y(TIDE[start]) + 24}>{TIDE[start].toFixed(1)}% in {TIDE_FYS[start]}</text>
                        </g>
                        <g className={`tide-mark is-ebb ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : "2.6s" }}>
                            <circle className="tide-pulse" cx={X(ebb)} cy={Y(TIDE[ebb])} r={6} />
                            <circle cx={X(ebb)} cy={Y(TIDE[ebb])} r={5} />
                            <text x={X(ebb) + 14} y={Y(TIDE[ebb]) + 5}>{TIDE[ebb].toFixed(1)}%</text>
                            <text className="tide-sub" x={X(ebb) + 14} y={Y(TIDE[ebb]) + 22}>{upto}</text>
                        </g>
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};
