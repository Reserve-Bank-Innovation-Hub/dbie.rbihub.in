"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useId, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { useInView, useReducedMotion } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { Figure } from "./chartKit";

// DATA ================================================================================================================
import { HEADLINE, SUM, TO_YEAR, YEARS, grams, gramsFor, inr, partYear, pieceOf, rs, yearOf } from "./data";

// The wedding year: the reader picks a year and a sum, and a necklace of beads, one bead a gram, shows what the sum
// bought at that year's average Mumbai price. The years then run on their own from the chosen one to the latest, and
// the necklace loses its beads, the inner strands first and then the outer strand from its ends, down to what the
// same rupees buy now; any touch on the controls pauses the run.

const MIN = 10_000, MAX = 1_000_000, STEP_SUM = 10_000;
const STEP = 900, HOLD = 2400;                                                  // ms between years, and at either end
const clampSum = (n : number) => Math.max(MIN, Math.min(MAX, Math.round(n / STEP_SUM) * STEP_SUM));

// The beads lie on strands, the outer strand first, each an arc of an ellipse open at the top where the strands
// gather to a clasp; a bead's size shrinks only when the strands could not otherwise hold the count. The beads are
// laid for the most the run will need and ordered so that hiding the last ones empties the inner strands first and
// then shortens the outer strand from both ends.
const W = 600, H = 420, CX = 300, CY = 182, RX = 212, RY = 172, STRAND_GAP = 15, MAX_STRANDS = 12;
const ARC_FROM = -Math.PI * 0.12, ARC_TO = Math.PI * 1.12;                    // open at the top, through the bottom
const CLASP = { x : CX, y : 14 };
const arcLength = (rx : number, ry : number) => Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) * ((ARC_TO - ARC_FROM) / (2 * Math.PI));
const strandOf = (s : number) => ({ rx : RX - STRAND_GAP * s, ry : RY - STRAND_GAP * s });
const layout = (n : number) => {
    const room = Array.from({ length : MAX_STRANDS }, (_, s) => arcLength(strandOf(s).rx, strandOf(s).ry)).reduce((a, b) => a + b, 0);
    const r = Math.max(1.6, Math.min(5.5, room / (n * 2.2)));
    const beads : { x : number; y : number; s : number }[] = [];
    let left = n, strands = 0;
    for (let s = 0; s < MAX_STRANDS && left > 0; s++) {
        const { rx, ry } = strandOf(s);
        const cap = Math.max(1, Math.floor(arcLength(rx, ry) / (r * 2.2)));
        const k = Math.min(cap, left);
        const span = Math.min(1, k / cap);
        const strand = Array.from({ length : k }, (_, i) => {
            const t = k === 1 ? 0.5 : i / (k - 1);
            const th = ARC_FROM + (ARC_TO - ARC_FROM) * (0.5 + (t - 0.5) * span);
            return { x : CX + rx * Math.cos(th), y : CY + ry * Math.sin(th), s, d : Math.abs(t - 0.5) };
        }).sort((a, b) => a.d - b.d);                                       // the centre first, the ends last
        beads.push(...strand);
        left -= k; strands++;
    }
    return { beads, r, strands };
};

const TABLE_FOR = (sum : number) => ({
    head    : [ "Year", "Gold, ₹ per 10 g", `Grams for ₹${inr(sum)}`, "By weight" ],
    numeric : [ false, true, true, false ],
    rows    : YEARS.map(y => [ y.year, inr(y.gold.price), grams(gramsFor(y.year, sum)), pieceOf(gramsFor(y.year, sum)) ]),
});

export const Necklace = () => {
    const [ startYear, setStartYear ] = useState(HEADLINE.againstFrom);
    const [ sum, setSum ] = useState(SUM);
    const [ year, setYear ] = useState(HEADLINE.againstFrom);
    const [ playing, setPlaying ] = useState(true);
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useInView(rootRef, { amount : 0.4 });
    const prefersReduced = !!useReducedMotion();
    const idY = useId(), idS = useId(), idR = useId(), idG = useId();

    // the years run from the chosen one to the latest, hold, and start again
    useEffect(() => {
        if (!playing || !inView || prefersReduced) return;
        const t = setTimeout(() => setYear(y => y >= TO_YEAR ? startYear : y + 1), year >= TO_YEAR || year === startYear ? HOLD : STEP);
        return () => clearTimeout(t);
    }, [ playing, inView, prefersReduced, year, startYear ]);
    const pause = () => setPlaying(false);
    const chooseStart = (y : number) => { setStartYear(y); setYear(y); };

    const g = gramsFor(year, sum), g0 = gramsFor(startYear, sum);
    const n = Math.max(1, Math.round(g));
    // the most beads the run from the chosen year will need: the layout is made once for that, and hidden down to n
    const most = useMemo(() => Math.max(1, ...YEARS.filter(y => y.year >= startYear).map(y => Math.round(gramsFor(y.year, sum)))), [ startYear, sum ]);
    const { beads, r, strands } = useMemo(() => layout(most), [ most ]);
    const row = yearOf(year);
    const table = useMemo(() => TABLE_FOR(sum), [ sum ]);
    const open = (s : number) => { const { rx, ry } = strandOf(s); return [ { x : CX + rx * Math.cos(ARC_FROM), y : CY + ry * Math.sin(ARC_FROM) }, { x : CX + rx * Math.cos(ARC_TO), y : CY + ry * Math.sin(ARC_TO) } ]; };

    return (
        <div ref={rootRef} className="necklace-figure" onPointerDownCapture={pause} onKeyDownCapture={pause}>
            <Figure title={`What ₹${inr(sum)} buys in gold, bead by bead`} className="figure-large" table={table}
                note={`One bead a gram, at the year's average Mumbai price of standard gold, before making charges and tax. The jewellery named is a guide to the weight, by the story's own thresholds, not a measure. ${TO_YEAR} is ${partYear(TO_YEAR, yearOf(TO_YEAR).gold.months)}.`}>
                <div className="necklace-fields">
                    <label htmlFor={idY}><span>Your year</span>
                        <select id={idY} value={startYear} onChange={e => chooseStart(+e.target.value)}>{YEARS.map(y => <option key={y.year} value={y.year}>{y.year}</option>)}</select>
                    </label>
                    <label htmlFor={idS}><span>Your sum, ₹{inr(MIN)} to ₹{inr(MAX)}</span>
                        <input id={idS} type="number" inputMode="numeric" min={MIN} max={MAX} step={STEP_SUM} value={sum} onChange={e => setSum(+e.target.value || MIN)} onBlur={e => setSum(clampSum(+e.target.value || MIN))} />
                    </label>
                </div>
                <div className="necklace-control">
                    <label htmlFor={idR}>Year</label>
                    <input id={idR} type="range" min={startYear} max={TO_YEAR} step={1} value={year} onChange={e => { pause(); setYear(+e.target.value); }} aria-valuetext={`${year}`} />
                    <output className="necklace-year" htmlFor={idR}>{year}</output>
                    {!prefersReduced && <button type="button" className={`play-pill ${playing ? "is-playing" : ""}`} aria-pressed={playing} onClick={() => setPlaying(p => !p)}>{playing ? "Pause" : "Play the years"}</button>}
                </div>
                <div className="necklace-stage">
                    <svg className="necklace-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A necklace of ${n} beads, one a gram: what ₹${inr(sum)} bought in ${year}`}>
                        <defs>
                            <radialGradient id={idG} cx="0.35" cy="0.3" r="0.75">
                                <stop offset="0" className="bead-light" />
                                <stop offset="0.6" className="bead-mid" />
                                <stop offset="1" className="bead-deep" />
                            </radialGradient>
                        </defs>
                        {/* the strands' threads run up to the clasp, so a part-filled strand still hangs; a strand with no
                            beads left loses its thread too */}
                        {Array.from({ length : strands }, (_, s) => {
                            const { rx, ry } = strandOf(s); const [ a, b ] = open(s);
                            const alive = beads.some((bd, i) => bd.s === s && i < n);
                            return (
                                <g key={s} className={`necklace-thread ${alive ? "" : "is-off"}`}>
                                    <path d={`M${a.x.toFixed(1)},${a.y.toFixed(1)} A${rx},${ry} 0 1 1 ${b.x.toFixed(1)},${b.y.toFixed(1)}`} />
                                    <path d={`M${a.x.toFixed(1)},${a.y.toFixed(1)} L${CLASP.x + 5},${CLASP.y + 6}`} />
                                    <path d={`M${b.x.toFixed(1)},${b.y.toFixed(1)} L${CLASP.x - 5},${CLASP.y + 6}`} />
                                </g>
                            );
                        })}
                        <circle className="necklace-clasp" cx={CLASP.x} cy={CLASP.y} r={7} />
                        {beads.map((b, i) => <circle key={i} className={`necklace-bead ${i < n ? "" : "is-off"}`} cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={r.toFixed(2)} fill={`url(#${idG})`} />)}
                    </svg>
                    <div className="necklace-readout" aria-live="polite">
                        <p className="necklace-count"><strong>{grams(g)}</strong><span>in {year}</span></p>
                        <p className="necklace-line">{pieceOf(g).charAt(0).toUpperCase() + pieceOf(g).slice(1)}, by weight, at {rs(row.gold.price)} for 10 g{row.gold.months < 12 ? `, ${partYear(year, row.gold.months)}` : ""}.</p>
                        {year !== startYear && <p className="necklace-line is-soft">In {startYear} the same sum bought <strong>{grams(g0)}</strong>, {pieceOf(g0)}.</p>}
                    </div>
                </div>
            </Figure>
        </div>
    );
};
