"use client";

// The story's flat steps, drawn in SVG: the guess (how much cash, before and after), the tide (cash with the public as a
// share of GDP since 1951-52), UPI against debit cards, the wall of notes by denomination, and the close. Each starts its motion the first time it is mostly on screen; with reduced motion
// each is drawn at once.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useId, useRef, useState } from "react";

// DATA ================================================================================================================
import { CIC, CIC_MONTHS, FESTIVE, NOTE_YEARS, PAY, PAY_MONTHS, TIDE, TIDE_FYS } from "./data.gen";
import { monthName, type StepEvent } from "./record";

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
// Cash with the public as a share of GDP, by financial year from 1951-52, up to `upto`, the years shown filling the
// width so the line ends at the right edge, where the story has got to. It draws in from `from` (the line before it is
// there already, as the reader left it on the earlier step), and the marked years come in once it has.
export interface TideMark { fy : string; at : "right" | "below" | "above" | "under-right"; accent? : boolean; pulse? : boolean; note? : string }
export const TideStep = ({ upto, from, marks, events, children } : { upto : string; from? : string; marks : TideMark[]; events? : StepEvent[]; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const n = TIDE_FYS.indexOf(upto) + 1, f0 = from ? TIDE_FYS.indexOf(from) : 0;
    const pad = { l : 44, r : 24, t : 28, b : 40 };
    const X = (i : number) => pad.l + i / (n - 1) * (w - pad.l - pad.r - 70);
    const Y = (v : number) => pad.t + (1 - v / 14) * (h - pad.t - pad.b);
    const pts = TIDE.slice(0, n).map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    const years = [ "1951-52", "1971-72", "1991-92", "2011-12" ].map(f => TIDE_FYS.indexOf(f)).filter(i => i < n - 4);
    const startAt = w ? X(f0) / w : 0;
    const drawFor = 2.4 * (1 - startAt);
    return (
        <div className="split">
            <div className="split-stage tide-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Cash with the public as a share of GDP, ${TIDE_FYS[0]} to ${upto}: ${marks.map(m => `${TIDE[TIDE_FYS.indexOf(m.fy)]}% in ${m.fy}`).join("; ")}.`}>
                        <defs>
                            <linearGradient id={`${uid}-fill`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor="#864fe3" stopOpacity="0.28" />
                                <stop offset="1" stopColor="#864fe3" stopOpacity="0.02" />
                            </linearGradient>
                            <clipPath id={`${uid}-draw`}>
                                <rect className="tide-wipe" x={0} y={0} width={w} height={h}
                                    style={{ transform : drawn ? "none" : `scaleX(${startAt})`, transitionDuration : `${drawFor}s` }} />
                            </clipPath>
                        </defs>
                        {[ 4, 8, 12 ].map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{v}%</text>
                            </g>
                        ))}
                        {years.map(i => <text key={i} className="tide-year" x={X(i)} y={h - pad.b + 22} textAnchor="middle">{TIDE_FYS[i].slice(0, 4)}</text>)}
                        <g clipPath={`url(#${uid}-draw)`}>
                            <polygon className="tide-area" fill={`url(#${uid}-fill)`} points={`${X(0)},${Y(0)} ${pts.join(" ")} ${X(n - 1)},${Y(0)}`} />
                            <polyline className="tide-line" points={pts.join(" ")} />
                        </g>
                        {(() => { const ev = (events ?? []).filter(e => e.k < n), rows = eventRows(ev.map(e => X(e.k))); return ev.map((e, j) => (
                            <g key={e.n} className={`line-event ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${e.k <= f0 ? 0.3 : drawFor * (X(e.k) / w - startAt) / (1 - startAt) + 0.3}s` }}>
                                <title>{e.label}</title>
                                <line x1={X(e.k)} x2={X(e.k)} y1={Y(TIDE[e.k]) + 8} y2={h - pad.b - 6} />
                                <circle cx={X(e.k)} cy={h - pad.b - 14 - rows[j] * 22} r={9} />
                                <text x={X(e.k)} y={h - pad.b - 10 - rows[j] * 22} textAnchor="middle">{e.n}</text>
                            </g>
                        )); })()}
                        {marks.map(m => {
                            const i = TIDE_FYS.indexOf(m.fy), x = X(i), y = Y(TIDE[i]);
                            // a mark shows as soon as the line reaches it
                            const delay = i <= f0 ? 0.2 : drawFor * (x / w - startAt) / (1 - startAt) + 0.2;
                            const [ tx, ty, anchor ] : [ number, number, "start" | "middle" ] = m.at === "right" ? [ x + 14, y + 5, "start" ]
                                : m.at === "below" ? [ x, y + 26, "middle" ] : m.at === "above" ? [ x, y - 30, "middle" ] : [ x + 10, y + 24, "start" ];
                            return (
                                <g key={m.fy} className={`tide-mark ${m.accent ? "is-ebb" : ""} ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${delay}s` }}>
                                    {m.pulse && <circle className="tide-pulse" cx={x} cy={y} r={6} />}
                                    <circle cx={x} cy={y} r={m.accent ? 5 : 4} />
                                    <text x={tx} y={ty} textAnchor={anchor}>{TIDE[i].toFixed(1)}%</text>
                                    <text className="tide-sub" x={tx} y={ty + 17} textAnchor={anchor}>{m.note ?? m.fy}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// Event markers close together stack upward instead of overlapping: each gets a row, 0 at the bottom.
const eventRows = (xs : number[]) => {
    const rows : number[] = [];
    xs.forEach((x, i) => { let r = 0; while (xs.some((x2, j) => j < i && rows[j] === r && Math.abs(x2 - x) < 22)) r++; rows.push(r); });
    return rows;
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
export const PayStep = ({ events, children } : { events? : StepEvent[]; children : ReactNode }) => {
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
    return (
        <div className="split">
            <div className="split-stage pay-stage" ref={ref}>
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
                        {(() => { const ev = events ?? [], rows = eventRows(ev.map(e => X(e.k))); return ev.map((e, j) => (
                            <g key={e.n} className={`line-event ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${2.4 * e.k / last + 0.3}s` }}>
                                <title>{e.label}</title>
                                <line x1={X(e.k)} x2={X(e.k)} y1={pad.t} y2={h - pad.b - 6} />
                                <circle cx={X(e.k)} cy={h - pad.b - 14 - rows[j] * 22} r={9} />
                                <text x={X(e.k)} y={h - pad.b - 10 - rows[j] * 22} textAnchor="middle">{e.n}</text>
                            </g>
                        )); })()}
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
const DENOMS = [
    { key : "2000", label : "₹2,000", match : [ "2000" ], cls : "d-2000" },
    { key : "1000", label : "₹1,000", match : [ "1000" ], cls : "d-1000" },
    { key : "500", label : "₹500", match : [ "500" ], cls : "d-500" },
    { key : "200", label : "₹200", match : [ "200" ], cls : "d-200" },
    { key : "100", label : "₹100", match : [ "100" ], cls : "d-100" },
    { key : "small", label : "₹50 and below", match : [ "50", "20", "10", "2 and 5" ], cls : "d-small" },
];
const YEARS = NOTE_YEARS ?? [];
const WALL = YEARS.map(y => {
    const values = DENOMS.map(d => y.notes.filter(n => d.match.includes(n.denom)).reduce((a, n) => a + n.value, 0));
    const total = values.reduce((a, b) => a + b, 0);
    // each group's notes, rounded on the running total so the groups always add up to the wall
    let run = 0;
    const ends = values.map(v => Math.round((run += v) / BRICK));
    return { march : y.march, total, values, shares : values.map(v => v / total), ends };
});
const MOST = Math.max(...WALL.map(y => y.ends[y.ends.length - 1]));
const fmtLakhCrore = (crore : number) => `₹${(crore / 1e5).toFixed(1)} lakh crore`;
export const NoteWallStep = ({ children } : { children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ k, setK ] = useState(YEARS.length - 1);
    const [ playing, setPlaying ] = useState(false);
    const started = useRef(false);
    useEffect(() => {
        if (!seen || started.current || reducedMotion()) return;
        started.current = true; setK(0); setPlaying(true);
    }, [ seen ]);
    useEffect(() => {
        if (!playing) return;
        if (k >= YEARS.length - 1) { setPlaying(false); return; }
        const t = setTimeout(() => setK(k + 1), k === 0 ? 1600 : 1100);
        return () => clearTimeout(t);
    }, [ playing, k ]);
    const { w, h } = size;
    const year = WALL[k];
    if (!year) return null;
    // the wall: a fixed grid big enough for the largest year, notes laid row by row from the bottom up
    const cols = Math.max(12, Math.round(Math.sqrt(MOST * 0.62 * (w || 1) / (h || 1))));   // shaped to the stage
    const rows = Math.ceil(MOST / cols);
    const cell = Math.max(4, Math.min((w - 8) / cols, (h - 40) / rows / 0.62));
    const nw = cell, nh = cell * 0.62, x0 = (w - cols * nw) / 2, y0 = h - 8;
    const count = year.ends[year.ends.length - 1];
    const groupOf = (i : number) => year.ends.findIndex(e => i < e);
    return (
        <div className="split">
            <div className="split-stage wall-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Banknotes in circulation, March ${year.march.slice(0, 4)}: ${fmtLakhCrore(year.total)}. ${DENOMS.map((d, j) => `${d.label} ${(year.shares[j] * 100).toFixed(1)}%`).join(", ")} of the value.`}>
                        {Array.from({ length : rows * cols }, (_, i) => {
                            const g = i < count ? groupOf(i) : -1;
                            const x = x0 + (i % cols) * nw, y = y0 - (Math.floor(i / cols) + 1) * nh;
                            return <rect key={i} className={`wall-note ${g >= 0 ? DENOMS[g].cls : "is-empty"}`} x={x + 1} y={y + 1} width={nw - 2} height={nh - 2} rx={1.5} />;
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
                                <i className={`wall-chip ${d.cls}`} aria-hidden="true" />{d.label}<b>{(year.shares[j] * 100).toFixed(1)}%</b>
                            </li>
                        ))}
                    </ul>
                    <span className="rain-key">Each note on the wall is ₹10,000 crore of the value of banknotes in circulation at the end of March.</span>
                </div>
                <div className="rain-time">
                    <button type="button" onClick={() => { if (playing) setPlaying(false); else { if (k >= YEARS.length - 1) setK(0); setPlaying(true); } }} aria-label={playing ? "Pause" : "Play the years"}>{playing ? "❚❚" : "▶"}</button>
                    <input type="range" min={0} max={YEARS.length - 1} step={1} value={k} aria-label="Year" aria-valuetext={`March ${year.march.slice(0, 4)}`}
                        onChange={e => { setPlaying(false); setK(+e.target.value); }} />
                    <span className="rain-years"><span>{YEARS[0]?.march.slice(0, 4)}</span><span>{YEARS[YEARS.length - 1]?.march.slice(0, 4)}</span></span>
                </div>
            </aside>
        </div>
    );
};

// PAYING AND KEEPING ==================================================================================================
// The close: the two jobs side by side, each as one number against where it started.
export const CloseStep = ({ paying, keeping, children } : { paying : ReactNode; keeping : ReactNode; children : ReactNode }) => (
    <div className="close">
        <div className="close-pair">
            <div className="close-half is-paying">{paying}</div>
            <div className="close-half is-keeping">{keeping}</div>
        </div>
        <div className="close-words">{children}</div>
    </div>
);

// A MONTHLY LINE ======================================================================================================
// One series by month, drawn in when the step comes on screen, with an optional dashed reference level, marked months
// (each labelled with its value and a note), and numbered events from the official record beneath the line.
export interface LineMark { month : string; at : "right" | "below" | "above" | "under-right"; accent? : boolean; pulse? : boolean; note? : string }
export const LineStep = ({ months, values, fmt, ticks, lo, hi, tone, axis, marks, level, events, children } : {
    months : string[]; values : number[]; fmt : (v : number) => string; ticks : number[]; lo : number; hi : number;
    tone : "neem" | "terracotta" | "indivara"; axis : string; marks : LineMark[]; level? : { value : number; label : string };
    events? : StepEvent[]; children : ReactNode;
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
    return (
        <div className="split">
            <div className={`split-stage line-stage is-${tone}`} ref={ref}>
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
                        {(events ?? []).map((e, j, all) => {
                            const i = months.indexOf(e.month);
                            if (i < 0) return null;
                            const row = eventRows(all.map(x => X(months.indexOf(x.month))))[j];
                            return (
                                <g key={e.n} className={`line-event ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${2.4 * i / n + 0.3}s` }}>
                                    <title>{e.label}</title>
                                    <line x1={X(i)} x2={X(i)} y1={Y(values[i]) + 8} y2={h - pad.b - 6} />
                                    <circle cx={X(i)} cy={h - pad.b - 14 - row * 22} r={9} />
                                    <text x={X(i)} y={h - pad.b - 10 - row * 22} textAnchor="middle">{e.n}</text>
                                </g>
                            );
                        })}
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
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// CASH HAS A SEASON ===================================================================================================
// The average change in currency in circulation from one month's end to the next, for each month of the year, from
// June round to May: growth above the line, shrinking below.
export const SeasonStep = ({ labels, values, children } : { labels : string[]; values : number[]; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const { w, h } = size;
    const pad = { l : 52, r : 16, t : 40, b : 52 };
    const top = Math.max(2.5, Math.ceil(Math.max(...values) * 2) / 2), bottom = Math.min(-1, Math.floor(Math.min(...values) * 2) / 2);
    const Y = (v : number) => pad.t + (top - v) / (top - bottom) * (h - pad.t - pad.b);
    const bw = (w - pad.l - pad.r) / values.length;
    const ticks = [ bottom, 0, 1, 2, top ].filter((v, i, a) => a.indexOf(v) === i && v >= bottom && v <= top);
    return (
        <div className="split">
            <div className="split-stage season-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Average change in currency in circulation by month: ${labels.map((l, i) => `${l} ${values[i] > 0 ? "+" : ""}${values[i].toFixed(1)}%`).join(", ")}.`}>
                        <text className="tide-year" x={pad.l} y={pad.t - 18}>Average change in the month, % (currency in circulation)</text>
                        {ticks.map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} className={v === 0 ? "is-zero" : ""} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">{v > 0 ? "+" : ""}{v}%</text>
                            </g>
                        ))}
                        {values.map((v, i) => {
                            const x = pad.l + i * bw + bw * 0.16, y = Math.min(Y(v), Y(0)), hh = Math.abs(Y(v) - Y(0));
                            return (
                                <g key={i}>
                                    <rect className={`season-bar ${v >= 0 ? "is-up" : "is-down"} ${drawn ? "is-drawn" : ""}`} x={x} y={y} width={bw * 0.68} height={Math.max(1, hh)} rx={3}
                                        style={{ transitionDelay : `${i * 0.08}s`, transformOrigin : `center ${Y(0)}px` }} />
                                    <text className={`season-val ${drawn ? "is-shown" : ""}`} x={x + bw * 0.34} y={v >= 0 ? y - 8 : y + hh + 16} textAnchor="middle" style={{ transitionDelay : `${i * 0.08 + 0.4}s` }}>
                                        {v > 0 ? "+" : ""}{v.toFixed(1)}
                                    </text>
                                    <text className="tide-year" x={x + bw * 0.34} y={h - pad.b + 22} textAnchor="middle">{labels[i]}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// THE RECORD UNDER A CHART ============================================================================================
// The step's events, numbered as on its chart: the month, what the record says, and a link to it.
// The note itself shows on pointing at an item (and is read out); the list stays short enough for the card.
export const EventList = ({ events } : { events : StepEvent[] }) => events.length ? (
    <ul className="event-list" aria-label="What the official record says">
        {events.map(e => (
            <li key={e.n} title={e.note}><i>{e.n}</i><b>{monthName(e.month)}</b> <span>{e.label}</span> <a href={e.url} aria-label={`${e.label}: source, ${e.source}`}>Source</a>
                <span className="sr-only">{e.note}</span></li>
        ))}
    </ul>
) : null;
// The record for a pattern with no month: each finding and its source.
export const PatternList = ({ items } : { items : { label : string; note : string; source : string; url : string }[] }) => items.length ? (
    <ul className="event-list is-patterns" aria-label="What the official record says">
        {items.map(e => <li key={e.label} title={e.note}><b>{e.label}.</b> <a href={e.url}>{e.source.split(",")[0]}</a><span className="sr-only">{e.note}</span></li>)}
    </ul>
) : null;

// THE FESTIVE WEEKS ===================================================================================================
// Above, one bar a year: the cash drawn out in the three weeks up to Diwali, over and above that year's normal pace (the
// years left out marked as such). Below, the average path from six weeks before Diwali to six weeks after: up into the
// festival, easing back after.
export const FestiveStep = ({ children } : { children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    const { w, h } = size;
    const years = Array.from({ length : FESTIVE.years[FESTIVE.years.length - 1].year - FESTIVE.years[0].year + 1 }, (_, i) => FESTIVE.years[0].year + i);
    const byYear = new Map(FESTIVE.years.map(y => [ y.year, y ]));
    const top = Math.ceil(Math.max(...FESTIVE.years.map(y => y.before)));
    // the bars take the upper part of the stage, the path the lower
    const pad = { l : 44, r : 16, t : 40 };
    const barsH = h * 0.58, pathTop = barsH + 70, pathH = h - pathTop - 36;
    const bw = (w - pad.l - pad.r) / years.length;
    const YB = (v : number) => pad.t + (1 - v / top) * (barsH - pad.t - 30);
    const pMax = Math.max(...FESTIVE.path) * 1.15, pMin = Math.min(0, ...FESTIVE.path);
    const XP = (j : number) => pad.l + j / 12 * (w - pad.l - pad.r);
    const YP = (v : number) => pathTop + (1 - (v - pMin) / (pMax - pMin)) * pathH;
    return (
        <div className="split">
            <div className="split-stage festive-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={`Cash drawn in the three weeks up to Diwali, above the normal pace: ${FESTIVE.years.map(y => `${y.year} ${y.before}%`).join(", ")}.`}>
                        <text className="tide-year" x={pad.l} y={pad.t - 18}>{w < 520 ? "Extra cash drawn before Diwali, %" : "Extra cash drawn in the three weeks up to Diwali, % of currency in circulation"}</text>
                        {[ 0, 1, 2, 3, 4 ].filter(v => v <= top).map(v => (
                            <g key={v} className="tide-grid">
                                <line x1={pad.l} x2={w - pad.r} y1={YB(v)} y2={YB(v)} className={v === 0 ? "is-zero" : ""} />
                                <text x={pad.l - 8} y={YB(v) + 4} textAnchor="end">{v}%</text>
                            </g>
                        ))}
                        {years.map((yr, i) => {
                            const y = byYear.get(yr), x = pad.l + i * bw + bw * 0.18;
                            return (
                                <g key={yr}>
                                    {y ? <>
                                        <rect className={`season-bar is-up ${drawn ? "is-drawn" : ""}`} x={x} y={YB(y.before)} width={bw * 0.64} height={YB(0) - YB(y.before)} rx={3}
                                            style={{ transitionDelay : `${i * 0.07}s`, transformOrigin : `center ${YB(0)}px` }}>
                                            <title>{`${yr}: ${y.before}% above the normal pace, ₹${y.crore.toLocaleString("en-IN")} crore added in the three weeks`}</title>
                                        </rect>
                                        <text className={`season-val ${drawn ? "is-shown" : ""}`} x={x + bw * 0.32} y={YB(y.before) - 7} textAnchor="middle" style={{ transitionDelay : `${i * 0.07 + 0.4}s` }}>{y.before.toFixed(1)}</text>
                                    </> : <text className="festive-out" x={x + bw * 0.32} y={YB(0) - 8} textAnchor="middle">–</text>}
                                    <text className="tide-year" x={x + bw * 0.32} y={YB(0) + 18} textAnchor="middle">{w < 520 ? `’${String(yr).slice(2)}` : yr}</text>
                                </g>
                            );
                        })}
                        <text className="tide-year" x={pad.l} y={pathTop - 18}>{w < 520 ? "The average path around Diwali" : "The average path: weeks before and after Diwali, cumulative % above the normal pace"}</text>
                        <line className="festive-day" x1={XP(6)} x2={XP(6)} y1={pathTop - 6} y2={pathTop + pathH} />
                        <text className="festive-daylabel" x={XP(6) + 6} y={pathTop + 6}>Diwali week</text>
                        <polyline className={`festive-path ${drawn ? "is-drawn" : ""}`} points={FESTIVE.path.map((v, j) => `${XP(j).toFixed(1)},${YP(v).toFixed(1)}`).join(" ")} />
                        {[ 0, 6, 12 ].map(j => <text key={j} className="tide-year" x={XP(j)} y={pathTop + pathH + 20} textAnchor="middle">{j === 6 ? "0" : `${j - 6 > 0 ? "+" : ""}${j - 6} weeks`}</text>)}
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};
