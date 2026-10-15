"use client";

// The story's 2D steps: the guess in ₹500 bundles; number against value as two walls that turn over; the NEFT batch
// board beside IMPS; the cheque wall since 1970-71; the cheque with its amount written out; the card wall; the shop
// counter's QR codes; the toll plaza; and the close, the title's ladder tilted by ten years. Each starts its motion the
// first time it is mostly on screen; with reduced motion each opens on its last frame.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { allot, diagonalOrder, mountWall, type Wall, type WallStep } from "./walls";
import { FACE, bundleSvg, chequeSvg, dataUri, type MethodKey } from "./instruments";
import { CAR_COUNT, carSvg, cardSvg, fastagCardSvg, posKeypadSvg, standeeSvg } from "./objects";
import { LADDER, METHOD, inr, monthName, rupees } from "./methods";
import { Layout, loopOnScreen, rasterise, reducedMotion, splitClass, useStage } from "./stage";

// DATA ================================================================================================================
import { CARDS, CHEQUE_FYS, CHEQUE_N, EVENTS, FYS, HEADLINE, MONTHS, MPAY, PAY, POS, UPI_QR } from "./data.gen";

const H = HEADLINE, LAST = FYS.length - 1, LM = MONTHS.length - 1;
const avg = (k : keyof typeof PAY, i : number) => { const v = PAY[k].value[i], n = PAY[k].volume[i]; return v != null && n ? v * 1e7 / (n * 1e5) : null; };
const event = (slide : string) => EVENTS.find(e => e.slide === slide);

// THE TIME BAR ========================================================================================================
// A play button and a slider over the steps (months or years), with an event's mark where it falls.
export interface Tick { at : number; label : string }
export const TimeBar = ({ i, n, playing, toggle, seek, ends, name, ticks = [] } : { i : number; n : number; playing : boolean; toggle : () => void; seek : (k : number) => void; ends : [ string, string ]; name : (k : number) => string; ticks? : Tick[] }) => (
    <div className="time-bar">
        <button type="button" className="time-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : "▶"}</button>
        <div className="time-track">
            <input type="range" min={0} max={n - 1} step={1} value={i} aria-label="Time" aria-valuetext={name(i)} onChange={e => seek(+e.target.value)} />
            {ticks.map(t => <button key={t.label} type="button" className={`time-tick ${t.at <= i ? "is-passed" : ""}`} style={{ left : `${t.at / (n - 1) * 100}%` }} title={t.label} aria-label={`Go to ${t.label}`} onClick={() => seek(t.at)} />)}
        </div>
        <span className="time-ends"><span>{ends[0]}</span><span>{ends[1]}</span></span>
    </div>
);

// A wall on a canvas, played once when mostly on screen, with play, pause and seek for its time bar.
function useWall(make : (canvas : HTMLCanvasElement, cb : { onStep : (i : number) => void; onEnd : () => void; reduced : boolean }) => Wall, n : number) {
    const ref = useRef<HTMLCanvasElement>(null), wall = useRef<Wall | null>(null);
    const [ i, setI ] = useState(0), [ playing, setPlaying ] = useState(false), [ ended, setEnded ] = useState(false);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const reduced = reducedMotion();
        wall.current = make(canvas, { onStep : setI, onEnd : () => { setPlaying(false); setEnded(true); }, reduced });
        if (reduced) { setI(n - 1); setEnded(true); }
        const io = new IntersectionObserver(([ e ]) => { if (e.intersectionRatio > 0.6 && !reduced) { wall.current?.play(); setPlaying(true); io.disconnect(); } }, { threshold : [ 0.6 ] });
        io.observe(canvas);
        return () => { io.disconnect(); wall.current?.dispose(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const toggle = () => { if (playing) { wall.current?.pause(); setPlaying(false); } else { setEnded(false); wall.current?.play(); setPlaying(true); } };
    const seek = (k : number) => { setPlaying(false); setI(k); wall.current?.setStep(k); };
    return { ref, wall, i, playing, ended, toggle, seek };
}

// a method's colour, read from the page's tokens for a canvas
const toneOf = (el : Element, k : string) => getComputedStyle(el).getPropertyValue(`--${k === "netc" ? "toll" : k}`).trim() || "#999";

// THE GUESS ===========================================================================================================
// The guess is made in ₹500 bundles of 100 notes (₹50,000): drag, and a stack grows on the table; lock it, and RTGS's
// average lands beside it, with UPI's few notes at its foot. The slider runs on a ratio scale, ₹1,000 to ₹5 crore.
const G_LO = Math.log10(1000), G_HI = Math.log10(5e7);
export const GUESS_EVENT = "beyond-upi-guess";
const BUNDLE_IMG = dataUri(bundleSvg());
// a stack of bundles: columns of 20, a brick for each bundle; less than a bundle shows as a thin slice of notes
const Stack = ({ amount, x, base, brick, tone, delay = 0 } : { amount : number; x : number; base : number; brick : { w : number; h : number }; tone : string; delay? : number }) => {
    const bundles = Math.floor(amount / 50000), rest = (amount - bundles * 50000) / 50000, per = 20;
    const out : ReactNode[] = [];
    for (let b = 0; b < bundles; b++) {
        const c = Math.floor(b / per), r = b % per;
        out.push(<image key={b} href={BUNDLE_IMG} x={x + c * (brick.w + 2)} y={base - (r + 1) * brick.h} width={brick.w} height={brick.h} preserveAspectRatio="none"
            className="brick" style={{ animationDelay : `${delay + b * Math.min(0.012, 1.2 / Math.max(1, bundles))}s` }} />);
    }
    if (rest > 0.002) {
        const c = Math.floor(bundles / per), r = bundles % per, hh = Math.max(1.5, rest * brick.h);
        out.push(<rect key="rest" x={x + c * (brick.w + 2)} y={base - r * brick.h - hh} width={brick.w} height={hh} rx={1} fill={tone} className="brick" style={{ animationDelay : `${delay + 0.2}s` }} />);
    }
    return <g>{out}</g>;
};
const notesText = (v : number) => { const b = v / 50000; return b >= 1 ? `${b >= 10 ? Math.round(b) : b.toFixed(1)} bundles of ₹500` : `${(v / 500).toFixed(1)} notes of ₹500`; };
export const GuessStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size } = useStage<HTMLDivElement>();
    const [ pos, setPos ] = useState(0.55), [ locked, setLocked ] = useState(false);
    const guess = Math.pow(10, G_LO + pos * (G_HI - G_LO));
    const nice = guess >= 1e5 ? Math.round(guess / 1e4) * 1e4 : Math.round(guess / 100) * 100;
    const rtgs = LADDER.find(r => r.key === "rtgs")!.avg, upi = H.upiAvg;
    const { w, h } = size, narrow = w < 560;
    const base = h - 46, brick = { w : narrow ? 30 : 54, h : Math.max(5, Math.min(18, (h - 110) / 21)) };
    const off = Math.abs(Math.log10(nice / rtgs));
    const lock = () => { setLocked(true); window.dispatchEvent(new CustomEvent(GUESS_EVENT, { detail : nice })); (window as unknown as { __beyondUpiGuess? : number }).__beyondUpiGuess = nice; };
    // the verdict, in one short line: close, or how many times too small or too big
    const verdict = off < 0.15 ? "Close." : nice < rtgs ? (rtgs / nice >= 2 ? `${inr(rtgs / nice)} times too small.` : "A little too small.") : (nice / rtgs >= 2 ? `${inr(nice / rtgs)} times too big.` : "A little too big.");
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                <div className="guess-control">
                    <label htmlFor="rtgs-guess">Your guess: <b>{rupees(nice)}</b> <span className="guess-sub">{notesText(nice)}</span></label>
                    <input id="rtgs-guess" type="range" min={0} max={1} step={0.001} value={pos} disabled={locked} onChange={e => setPos(+e.target.value)} aria-valuetext={rupees(nice)} />
                    <button type="button" className="lock" onClick={lock} disabled={locked}>{locked ? "Locked" : "Lock my guess"}</button>
                </div>
                <div className={`guess-answer ${locked ? "is-shown" : ""}`} aria-live="polite">
                    {locked && <>
                        <span className="ga-label">The answer</span>
                        <b className="ga-value">{rupees(rtgs)}</b>
                        <span className="ga-line">You guessed {rupees(nice)}. {verdict}</span>
                    </>}
                </div>
            </div>
            <div className="split-stage guess-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Your guess, ${rupees(nice)}, as a stack of ₹500 bundles${locked ? `; beside it the average RTGS payment, ${rupees(rtgs)}, ${Math.round(rtgs / 50000)} bundles, and a UPI payment, ${rupees(upi)}` : ""}.`}>
                        <line className="table-line" x1={0} x2={w} y1={base} y2={base} />
                        <Stack amount={nice} x={narrow ? 8 : w * 0.06} base={base} brick={brick} tone="var(--note)" />
                        <text className="stack-name" x={narrow ? 8 : w * 0.06} y={base + 22}>Your guess · {rupees(nice)}</text>
                        {locked && <>
                            <Stack amount={rtgs} x={w * 0.5} base={base} brick={brick} tone="var(--rtgs)" delay={0.2} />
                            <text className="stack-name is-rtgs" x={w * 0.5} y={base + 22}>RTGS · {rupees(rtgs)}</text>
                            <rect x={w - (narrow ? 34 : 56)} y={base - 3} width={narrow ? 26 : 40} height={3} fill="var(--note-dark)" className="brick" style={{ animationDelay : "1.6s" }} />
                            <text className="stack-name is-upi" x={w - 4} y={base + 22} textAnchor="end">UPI · {rupees(upi)}</text>
                        </>}
                    </svg>
                )}
            </div>
        </div>
    );
};

// THE SIZES: ONE ROW EACH ============================================================================================
// The nine ways of paying, one row each, largest average payment first. Each row's bar runs along a ratio scale from
// ₹100 to its method's average payment in the latest year, and its thickness shows the method's share of all payment
// value (the square root of the share, so area tracks value). The instruments fall in from above, as if from the
// title, land where their bars end, and the bars draw out to meet them.
const SZ_LO = 2, SZ_HI = 7, SZ_TICKS = [ 100, 1000, 1e4, 1e5, 1e6, 1e7 ];
const szName = (v : number) => (v >= 1e7 ? "₹1 crore" : v >= 1e5 ? `₹${v / 1e5} lakh` : `₹${inr(v)}`);
const TOTAL_V = PAY.total.value[LAST] ?? 1;
const SZ_ROWS = LADDER.map(r => ({ ...r, share : 100 * r.value / TOTAL_V, img : FACE[r.key] }));
export const SizesStep = ({ children } : { children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const imgs = useMemo(() => Object.fromEntries(SZ_ROWS.map(r => [ r.key, dataUri(r.img.svg()) ])), []);
    const { w, h } = size, narrow = w < 640;
    const labelW = narrow ? 104 : 230, pad = { l : labelW + 12, r : narrow ? 30 : 60, t : 6, b : 30 };
    const X = (v : number) => pad.l + (Math.log10(v) - SZ_LO) / (SZ_HI - SZ_LO) * (w - pad.l - pad.r);
    const rh = (h - pad.t - pad.b) / SZ_ROWS.length, most = SZ_ROWS[0].share;
    return (
        <div className="sizes">
            <div className="sizes-head">{children}</div>
            <div className="sizes-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Average payment in ${H.fy}, on a ratio scale, and share of all payment value: ${SZ_ROWS.map(r => `${METHOD[r.key].short} ${rupees(r.avg)}, ${r.share.toFixed(1)}%`).join("; ")}.`}>
                        {SZ_TICKS.map(v => (
                            <g key={v} className="sz-tick">
                                <line x1={X(v)} x2={X(v)} y1={pad.t} y2={h - pad.b + 4} />
                                <text x={X(v)} y={h - 8} textAnchor="middle">{szName(v)}</text>
                            </g>
                        ))}
                        {SZ_ROWS.map((r, i) => {
                            const cy = pad.t + rh * (i + 0.5), t = Math.max(3, Math.sqrt(r.share / most) * Math.min(rh * 0.5, 30));
                            const ih = Math.min(rh * 0.82, narrow ? 34 : 54), iw = Math.min(ih * r.img.w / r.img.h, narrow ? 46 : 92), ex = X(r.avg);
                            return (
                                <g key={r.key} className={`sz-row ${drawn ? "is-drawn" : ""}`} style={{ "--tone" : METHOD[r.key].tone, "--i" : i } as React.CSSProperties}>
                                    <text className="sz-name" x={labelW} y={cy - (narrow ? 2 : 3)} textAnchor="end">{METHOD[r.key].short}</text>
                                    <text className="sz-val" x={labelW} y={cy + (narrow ? 11 : 15)} textAnchor="end">
                                        {rupees(r.avg)}{narrow ? "" : ` · ${r.share < 0.1 ? "under 0.1" : r.share.toFixed(r.share < 1 ? 2 : 1)}% of value`}
                                    </text>
                                    <rect className="sz-bar" x={X(100)} y={cy - t / 2} width={Math.max(0, ex - X(100))} height={t} rx={Math.min(t / 2, 4)} />
                                    <g className="sz-fall"><image href={imgs[r.key]} x={Math.min(w - iw, Math.max(pad.l + 6, ex - iw / 2))} y={cy - ih / 2} width={iw} height={ih} /></g>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
        </div>
    );
};

// TWO WALLS: NUMBER AGAINST VALUE =====================================================================================
// Each month from November 2019, the payments of every method as tiles: on the left one tile for each 10 crore
// payments, on the right one for each ₹1 lakh crore. They fill along diagonals from the bottom-left, RTGS first and UPI
// last; the time bar plays both together.
const WALL_COLS = 24, WALL_ROWS = 16, UNIT_N = 1000, UNIT_V = 1e5;                     // lakh payments; ₹ crore
const WALL_KINDS = [ "rtgs", "neft", "imps", "paper", "credit", "debit", "ppi", "netc", "other", "upi" ] as const;
const ORDER = diagonalOrder(WALL_COLS, WALL_ROWS);
const parts = (m : number, by : "volume" | "value") => {
    const known = (k : keyof typeof MPAY) => MPAY[k][by][m] ?? 0;
    const named = WALL_KINDS.filter(k => k !== "other").map(k => [ k, known(k as keyof typeof MPAY) ] as [ string, number ]);
    const other = Math.max(0, known("total") - named.reduce((a, [ , v ]) => a + v, 0));
    return WALL_KINDS.map(k => (k === "other" ? [ "other", other ] : named.find(x => x[0] === k)!) as [ string, number ]);
};
const place = (kinds : string[]) => { const cells : (string | null)[] = Array(WALL_COLS * WALL_ROWS).fill(null); kinds.forEach((k, j) => { cells[ORDER[j]] = k; }); return cells; };
const wallSteps = (by : "volume" | "value") : WallStep[] => MONTHS.map((_, m) => {
    const total = (MPAY.total[by][m] ?? 0) / (by === "volume" ? UNIT_N : UNIT_V);
    const kinds = allot(Math.round(total), parts(m, by));
    const flashes : Record<string, number> = {};
    kinds.forEach(k => { flashes[k] = (flashes[k] ?? 0) + 0.5; });
    return { cells : place(kinds), flashes };
});
// each method's letter, on its tiles and in the key: the first letter of its name, two where two names share one
export const LETTER : Record<string, string> = { rtgs : "R", neft : "N", imps : "I", paper : "Ch", credit : "Cr", debit : "D", ppi : "P", netc : "T", other : "O", upi : "U" };
const LIGHT = new Set([ "other", "ppi", "netc" ]);
const tileDraw = (tones : Record<string, string>) => (g : CanvasRenderingContext2D, kind : string, x : number, y : number, w : number, h : number, lit : number) => {
    g.fillStyle = tones[kind]; g.beginPath(); g.roundRect(x, y, w, h, Math.min(w, h) * 0.18); g.fill();
    if (lit > 0) { g.fillStyle = `rgba(255,255,255,${0.55 * lit})`; g.fill(); }
    // the letter, where the tile is big enough to read it
    if (w >= 13 && h >= 13) {
        g.fillStyle = LIGHT.has(kind) ? "rgba(47,47,47,0.75)" : "rgba(255,255,255,0.92)";
        g.font = `700 ${Math.round(h * (LETTER[kind].length > 1 ? 0.42 : 0.52))}px system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(LETTER[kind], x + w / 2, y + h / 2 + 0.5);
    }
};
type Make = (canvas : HTMLCanvasElement, cb : { onStep : (i : number) => void; onEnd : () => void; reduced : boolean }) => Wall;
const makeTiles = (by : "volume" | "value") : Make => (canvas, cb) => {
    const tones = Object.fromEntries(WALL_KINDS.map(k => [ k, toneOf(canvas, k) ]));
    return mountWall(canvas, { cols : WALL_COLS, rows : WALL_ROWS, aspect : 1, steps : wallSteps(by), journey : 10, reduced : cb.reduced, draw : tileDraw(tones), onStep : cb.onStep, onEnd : cb.onEnd });
};
export const WallsStep = ({ children } : { children : ReactNode }) => {
    const L = useWall(makeTiles("volume"), MONTHS.length), R = useWall(makeTiles("value"), MONTHS.length);
    const m = L.i;
    const both = { playing : L.playing || R.playing, toggle : () => { L.toggle(); R.toggle(); }, seek : (k : number) => { L.seek(k); R.seek(k); } };
    const share = (k : keyof typeof MPAY, by : "volume" | "value") => 100 * (MPAY[k][by][m] ?? 0) / (MPAY.total[by][m] ?? 1);
    return (
        <div className="walls">
            <div className="walls-head">{children}</div>
            <div className="walls-pair">
                <figure className="wall">
                    <figcaption><b>By number</b><span>a tile for each 10 crore payments</span></figcaption>
                    <div className="wall-box"><canvas ref={L.ref} role="img" aria-label={`${monthName(MONTHS[m])}: ${inr((MPAY.total.volume[m] ?? 0) / 100)} crore payments; UPI ${share("upi", "volume").toFixed(1)}% of them, RTGS ${share("rtgs", "volume").toFixed(2)}%.`} /></div>
                </figure>
                <figure className="wall">
                    <figcaption><b>By value</b><span>a tile for each ₹1 lakh crore</span></figcaption>
                    <div className="wall-box"><canvas ref={R.ref} role="img" aria-label={`${monthName(MONTHS[m])}: ₹${((MPAY.total.value[m] ?? 0) / 1e5).toFixed(1)} lakh crore; RTGS ${share("rtgs", "value").toFixed(1)}% of it, UPI ${share("upi", "value").toFixed(1)}%.`} /></div>
                </figure>
            </div>
            <div className="walls-foot">
                <ul className="key">{WALL_KINDS.map(k => <li key={k} className={LIGHT.has(k) ? "is-light" : ""} style={{ "--tone" : k === "other" ? "var(--other)" : METHOD[k as MethodKey].tone } as React.CSSProperties}><i>{LETTER[k]}</i>{k === "other" ? "Other" : METHOD[k as MethodKey].short}</li>)}</ul>
                <div className="walls-read">
                    <span className="read-month">{monthName(MONTHS[m])}</span>
                    <span><b>{inr((MPAY.total.volume[m] ?? 0) / 100)}</b> crore payments, UPI <b>{share("upi", "volume").toFixed(1)}%</b></span>
                    <span><b>₹{((MPAY.total.value[m] ?? 0) / 1e5).toFixed(1)}</b> lakh crore, RTGS <b>{share("rtgs", "value").toFixed(1)}%</b></span>
                </div>
                <TimeBar i={m} n={MONTHS.length} {...both} ends={[ MONTHS[0].slice(0, 4), MONTHS[LM].slice(0, 4) ]} name={k => monthName(MONTHS[k])} />
            </div>
        </div>
    );
};

// THE CHEQUE WALL =====================================================================================================
// One leaf for each crore cheques cleared, year by year from 1970-71: the wall fills to the 2007-08 peak, then leaves
// lift away.
const CQ_COLS = 10, CQ_ROWS = 15;
// each leaf is the story's cheque (instruments.ts), drawn small; a plain leaf stands in until its image has loaded
const LEAF_IMG = rasterise(dataUri(chequeSvg()), 200, 90);
const leafDraw = (paper : string, edge : string) => (g : CanvasRenderingContext2D, _k : string, x : number, y : number, w : number, h : number, lit : number) => {
    const leaf = LEAF_IMG.get();
    if (leaf) { g.drawImage(leaf, x, y, w, h); g.strokeStyle = edge; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
    else { g.fillStyle = paper; g.strokeStyle = edge; g.lineWidth = 1; g.beginPath(); g.roundRect(x, y, w, h, 2); g.fill(); g.stroke(); }
    if (lit > 0) { g.fillStyle = `rgba(255,255,255,${0.5 * lit})`; g.fillRect(x, y, w, h); }
};
const CQ_STEPS : WallStep[] = CHEQUE_N.map(n => { const cells : (string | null)[] = Array(CQ_COLS * CQ_ROWS).fill(null); for (let j = 0; j < Math.round(n); j++) cells[j] = "leaf"; return { cells }; });
const PEAK_I = CHEQUE_N.indexOf(Math.max(...CHEQUE_N));
export const ChequeWallStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const W = useWall((canvas, cb) => mountWall(canvas, { cols : CQ_COLS, rows : CQ_ROWS, aspect : 2.2, steps : CQ_STEPS, journey : 12, reduced : cb.reduced,
        draw : leafDraw("#f7ecdb", toneOf(canvas, "paper")), onStep : cb.onStep, onEnd : cb.onEnd }), CHEQUE_FYS.length);
    const k = W.i;
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                <div className="wall-read">
                    <span className="read-month">{CHEQUE_FYS[k]}</span>
                    <span><b>{CHEQUE_N[k].toFixed(1)}</b> crore cheques and other paper{k === PEAK_I ? ", the peak" : ""}</span>
                </div>
                <TimeBar i={k} n={CHEQUE_FYS.length} playing={W.playing} toggle={W.toggle} seek={W.seek} ends={[ CHEQUE_FYS[0], CHEQUE_FYS[CHEQUE_FYS.length - 1] ]} name={i => CHEQUE_FYS[i]} ticks={[ { at : PEAK_I, label : `${CHEQUE_FYS[PEAK_I]}, the peak` } ]} />
                <p className="step-note">Each leaf stands for one crore cheques and other paper instruments cleared in the year.</p>
            </div>
            <div className="split-stage cheque-wall">
                <canvas ref={W.ref} role="img" aria-label={`${CHEQUE_FYS[k]}: ${CHEQUE_N[k].toFixed(1)} crore cheques, one leaf for each crore.`} />
            </div>
        </div>
    );
};

// AMOUNTS IN WORDS ====================================================================================================
// Indian grouping, lakh and thousand, as a cheque is written: "Rupees one lakh twenty-seven thousand nine hundred and
// nine only".
const ONES = [ "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen" ];
const TENS = [ "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety" ];
const two = (n : number) => n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;
const three = (n : number) => [ n >= 100 ? `${ONES[Math.floor(n / 100)]} hundred` : "", n % 100 ? `${n >= 100 ? "and " : ""}${two(n % 100)}` : "" ].filter(Boolean).join(" ");
export const inWords = (v : number) => {
    const n = Math.round(v), lakh = Math.floor(n / 1e5), thou = Math.floor((n % 1e5) / 1000), rest = n % 1000;
    const s = [ lakh ? `${two(lakh)} lakh` : "", thou ? `${two(thou)} thousand` : "", rest ? three(rest) : "" ].filter(Boolean).join(" ");
    return `Rupees ${s} only`;
};

// THE CARD WALL =======================================================================================================
// One card for each crore cards in issue at the month's end, debit filling from the bottom-left and credit from the
// top-right; each flash is 5 crore card payments in the month. From November 2019 the light moves to the credit cards.
const CARD_COLS = 13, PER_FLASH = 5;
const CARD_N = Math.max(...MONTHS.map((_, m) => Math.round((CARDS.debit[m] ?? 0) / 100) + Math.round((CARDS.credit[m] ?? 0) / 100)));
const CARD_ROWS = Math.ceil(CARD_N / CARD_COLS) + 1;
const CARD_STEPS : WallStep[] = MONTHS.map((_, m) => {
    const cells : (string | null)[] = Array(CARD_COLS * CARD_ROWS).fill(null);
    const d = Math.round((CARDS.debit[m] ?? 0) / 100), c = Math.round((CARDS.credit[m] ?? 0) / 100);
    for (let j = 0; j < d; j++) cells[j] = "debit";
    for (let j = 0; j < c; j++) cells[cells.length - 1 - j] = "credit";
    return { cells, flashes : { debit : (MPAY.debit.volume[m] ?? 0) / 100 / PER_FLASH, credit : (MPAY.credit.volume[m] ?? 0) / 100 / PER_FLASH } };
});
const CROSS = MONTHS.indexOf(H.cardRatio.crossMonth);
// each cell is the realistic card (objects.ts), dim until a payment lights it
const CARD_IMG = { debit : rasterise(dataUri(cardSvg("debit").svg), 120, 75), credit : rasterise(dataUri(cardSvg("credit").svg), 120, 75) };
const cardDraw = (tones : Record<string, string>) => (g : CanvasRenderingContext2D, kind : string, x : number, y : number, w : number, h : number, lit : number) => {
    const img = CARD_IMG[kind as "debit" | "credit"]?.get(), a = g.globalAlpha;
    g.globalAlpha = a * (0.45 + 0.55 * lit);
    if (img) g.drawImage(img, x, y, w, h);
    else { g.fillStyle = tones[kind]; g.beginPath(); g.roundRect(x, y, w, h, h * 0.16); g.fill(); }
    g.globalAlpha = a;
    if (lit > 0.3) { g.strokeStyle = `rgba(255,255,255,${lit})`; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, h * 0.1); g.stroke(); }
};
export const CardWallStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const W = useWall((canvas, cb) => mountWall(canvas, { cols : CARD_COLS, rows : CARD_ROWS, aspect : 1.58, steps : CARD_STEPS, journey : 12, reduced : cb.reduced,
        draw : cardDraw({ debit : toneOf(canvas, "debit"), credit : toneOf(canvas, "credit") }), onStep : cb.onStep, onEnd : cb.onEnd }), MONTHS.length);
    const m = W.i, ev = event("cards");
    const crore = (s : (number | null)[]) => ((s[m] ?? 0) / 100);
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                <div className="card-read">
                    <span className="read-month">{monthName(MONTHS[m])}</span>
                    <span className="is-debit"><i /> <b>{crore(CARDS.debit).toFixed(1)}</b> crore debit cards, <b>{crore(MPAY.debit.volume).toFixed(1)}</b> crore payments</span>
                    <span className="is-credit"><i /> <b>{crore(CARDS.credit).toFixed(1)}</b> crore credit cards, <b>{crore(MPAY.credit.volume).toFixed(1)}</b> crore payments</span>
                </div>
                <TimeBar i={m} n={MONTHS.length} playing={W.playing} toggle={W.toggle} seek={W.seek} ends={[ MONTHS[0].slice(0, 4), MONTHS[LM].slice(0, 4) ]} name={k => monthName(MONTHS[k])}
                    ticks={[ { at : CROSS, label : `${monthName(H.cardRatio.crossMonth)}: credit-card payments first pass debit-card payments` } ]} />
                <p className="step-note">Each card is one crore cards in issue at the month’s end; each flash, {PER_FLASH} crore card payments in the month.</p>
                {ev && <p className={`event-line ${m >= CROSS ? "is-shown" : ""}`}>The RBI: “{ev.quote}”. <a href={ev.url}>Source</a></p>}
            </div>
            <div className="split-stage card-wall">
                <canvas ref={W.ref} role="img" aria-label={`${monthName(MONTHS[m])}: ${crore(CARDS.debit).toFixed(1)} crore debit cards made ${crore(MPAY.debit.volume).toFixed(1)} crore payments; ${crore(CARDS.credit).toFixed(1)} crore credit cards made ${crore(MPAY.credit.volume).toFixed(1)} crore.`} />
            </div>
        </div>
    );
};

// THE SHOP COUNTER ====================================================================================================
// One PoS machine, and the UPI QR codes there were for each PoS machine, month by month from the first month with a
// count (September 2020): they gather round it.
const QR_FROM = UPI_QR.findIndex(v => v != null);
const RATIO = MONTHS.map((_, m) => (UPI_QR[m] != null && POS[m] ? (UPI_QR[m] as number) / (POS[m] as number) : null));
const STANDEES = ([ "tent", "acrylic", "card" ] as const).map(k => dataUri(standeeSvg(k).svg)), POS_IMG = dataUri(posKeypadSvg("3,922").svg);
// the standees spiral out from a clear ring round the PoS machine (CLEAR, in steps of the spiral), so the machine stands apart
const CLEAR = 3.3;
const spiral = (j : number) => { const a = j * 2.399963, r = CLEAR + Math.sqrt(j) * 0.92; return { x : Math.cos(a) * r, y : Math.sin(a) * r }; };
export const CounterStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, seen } = useStage<HTMLDivElement>();
    const [ m, setM ] = useState(LM), [ playing, setPlaying ] = useState(false);
    useEffect(() => { if (seen && !reducedMotion()) { setM(QR_FROM); setPlaying(true); } }, [ seen ]);
    useEffect(() => { if (!playing) return; if (m >= LM) { setPlaying(false); return; } const t = setTimeout(() => setM(m + 1), 110); return () => clearTimeout(t); }, [ playing, m ]);
    const r = RATIO[m] ?? 0, n = Math.round(r), { w, h } = size;
    // the spiral's step fits the most standees any month has inside the stage; a standee is a little wider than a step
    const most = Math.max(...RATIO.map(v => v ?? 0)), reach = CLEAR + Math.sqrt(most) * 0.92 + 0.7;
    const cx = w / 2, cy = h / 2, step = Math.min(w / 2 / reach, h / 2 / reach / 1.05) * 0.99, qs = step * 1.45;
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                <div className="wall-read">
                    <span className="read-month">{monthName(MONTHS[m])}</span>
                    <span><b>{r.toFixed(1)}</b> UPI QR codes for each PoS machine</span>
                    <span><b>{((UPI_QR[m] ?? 0) / 100).toFixed(2)}</b> crore QR codes, <b>{(POS[m] ?? 0).toFixed(1)}</b> lakh PoS machines</span>
                </div>
                <TimeBar i={m - QR_FROM} n={LM - QR_FROM + 1} playing={playing} toggle={() => { if (!playing && m >= LM) setM(QR_FROM); setPlaying(!playing); }} seek={i => { setPlaying(false); setM(QR_FROM + i); }}
                    ends={[ MONTHS[QR_FROM].slice(0, 4), MONTHS[LM].slice(0, 4) ]} name={i => monthName(MONTHS[QR_FROM + i])} />
            </div>
            <div className="split-stage counter-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`${monthName(MONTHS[m])}: one PoS machine with ${n} UPI QR standees round it.`}>
                        <defs><radialGradient id="pos-halo"><stop offset="0.6" stopColor="var(--card)" stopOpacity="0.95" /><stop offset="1" stopColor="var(--card)" stopOpacity="0" /></radialGradient></defs>
                        <ellipse cx={cx} cy={cy} rx={step * (CLEAR - 0.2)} ry={step * (CLEAR - 0.2) * 1.05} fill="url(#pos-halo)" />
                        {Array.from({ length : n }, (_, j) => { const p = spiral(j); return <image key={j} className="qr-pop" href={STANDEES[j % 3]} x={cx + p.x * step - qs / 2} y={cy + p.y * step * 1.05 - qs * 0.69} width={qs} height={qs * 1.375} />; })}
                        <image href={POS_IMG} x={cx - qs * 1.55} y={cy - qs * 2.25} width={qs * 3.1} height={qs * 4.5} />
                    </svg>
                )}
            </div>
        </div>
    );
};

// THE TOLL PLAZA ======================================================================================================
// A toll plaza from above, cars of every kind passing through FASTag lanes, each read at the booth with ₹133 rising
// off it; beside it a FASTag card. The cars are a picture, not a count: the readout carries the numbers.
const CAR_IMGS = Array.from({ length : CAR_COUNT }, (_, i) => rasterise(dataUri(carSvg(i).svg), 120, 56));
const FASTAG_IMG = dataUri(fastagCardSvg().svg);
export const TollStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const cv = ref.current; if (!cv) return;
        const g = cv.getContext("2d")!, reduced = reducedMotion(), fee = H.small.netcAvg, lanes = 5;
        type Car = { lane : number; x : number; v : number; i : number; paid : boolean };
        const cars : Car[] = [], chips : { x : number; y : number; t : number }[] = [];
        // the cars come in a fixed mixed order, so no colour bunches up
        const MIX = [ 1, 4, 0, 6, 2, 7, 3, 5 ];
        let W = 0, Ht = 0, spawn = 0, seed = 3, spawned = 0;
        // each lane's boom barrier, from 0 (down, across the lane) to 1 (raised)
        const boom = Array(lanes).fill(0);
        const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
        const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2); W = r.width; Ht = r.height; cv.width = W * d; cv.height = Ht * d; g.setTransform(d, 0, 0, d, 0, 0); };
        const ro = new ResizeObserver(size); ro.observe(cv); size();
        const css = getComputedStyle(cv), ink = css.getPropertyValue("--ink").trim() || "#2f2f2f", toll = css.getPropertyValue("--toll").trim() || "#94836c";
        const draw = (dt : number) => {
            const lh = Ht * 0.84 / lanes, top = Ht * 0.08, bx = W * 0.56, cw = Math.min(120, lh * 2.1), chh = cw * 56 / 120;
            spawn -= dt;
            if (spawn <= 0) {
                const lane = Math.floor(rnd() * lanes);
                if (!cars.some(c => c.lane === lane && c.x < cw * 0.4)) cars.push({ lane, x : -cw - 10, v : W * (0.16 + rnd() * 0.05), i : MIX[spawned++ % MIX.length] % CAR_COUNT, paid : false });
                spawn = 0.28 + rnd() * 0.35;
            }
            g.clearRect(0, 0, W, Ht);
            // the road, its lanes and the booths
            g.fillStyle = "rgba(60,58,54,0.10)"; g.fillRect(0, top, W, lh * lanes);
            g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 2; g.setLineDash([ 16, 14 ]);
            for (let l = 1; l < lanes; l++) { g.beginPath(); g.moveTo(0, top + l * lh); g.lineTo(bx - 40, top + l * lh); g.moveTo(bx + 40, top + l * lh); g.lineTo(W, top + l * lh); g.stroke(); }
            g.setLineDash([]);
            g.fillStyle = "rgba(120,110,95,0.18)"; g.fillRect(bx - 30, top - 14, 60, lh * lanes + 28);
            for (let l = 0; l <= lanes; l++) { g.fillStyle = toll; g.beginPath(); g.roundRect(bx - 10, top + l * lh - 10, 20, 20, 4); g.fill(); }
            // the cars, each slowing through its booth and paying as its tag is read
            cars.sort((a, b) => a.lane - b.lane);
            for (let k = cars.length - 1; k >= 0; k--) {
                const c = cars[k], y = top + c.lane * lh + lh / 2;
                const ahead = cars.filter(o => o.lane === c.lane && o.x > c.x).reduce((m, o) => Math.min(m, o.x), Infinity);
                const near = Math.abs(c.x + cw * 0.75 - bx) < cw * 0.6;
                // a car waits at its lane's boom until the boom is up
                const stop = boom[c.lane] < 0.85 && c.x + cw < bx + 22 ? bx + 18 - cw : Infinity;
                c.x = Math.min(c.x + c.v * dt * (near ? 0.35 : 1), ahead - cw - 8, stop);
                if (!c.paid && c.x + cw * 0.75 > bx) { c.paid = true; chips.push({ x : bx + 22, y : y - chh * 0.6, t : 0 }); }
                const img = CAR_IMGS[c.i].get();
                if (img) g.drawImage(img, c.x, y - chh / 2, cw, chh);
                if (c.x > W + 20) cars.splice(k, 1);
            }
            // the booms: up while a car is at or passing through the booth, down again behind it; seen from above, a
            // raised boom foreshortens towards its pivot
            for (let l = 0; l < lanes; l++) {
                const busy = cars.some(c => c.lane === l && c.x + cw > bx - cw * 0.35 && c.x < bx + 34);
                boom[l] = Math.max(0, Math.min(1, boom[l] + (busy ? 3 : -2) * dt));
                const px = bx + 22, py = top + l * lh + 7, len = (lh - 14) * (1 - 0.82 * boom[l]), seg = 9;
                for (let o = 0; o < len; o += seg) { g.fillStyle = Math.floor(o / seg) % 2 ? "#ffffff" : "#de4635"; g.fillRect(px - 2.5, py + o, 5, Math.min(seg, len - o)); }
                g.strokeStyle = "rgba(47,47,47,0.35)"; g.lineWidth = 0.6; g.strokeRect(px - 2.5, py, 5, len);
                g.fillStyle = "#2f2f2f"; g.beginPath(); g.arc(px, py, 4, 0, Math.PI * 2); g.fill();
            }
            g.font = "700 13px system-ui, sans-serif"; g.textAlign = "left";
            for (let k = chips.length - 1; k >= 0; k--) {
                const p = chips[k]; p.t += dt; const f = p.t / 1.3;
                if (f >= 1) { chips.splice(k, 1); continue; }
                g.globalAlpha = 1 - f; g.fillStyle = ink; g.fillText(`₹${fee}`, p.x, p.y - f * 26); g.globalAlpha = 1;
            }
        };
        if (reduced) { for (let k = 0; k < 90; k++) draw(0.1); return () => ro.disconnect(); }
        const stop = loopOnScreen(cv, draw);                                                     // only while on screen
        return () => { stop(); ro.disconnect(); };
    }, []);
    const ev = event("toll");
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage toll-stage">
                <canvas ref={ref} role="img" aria-label={`A toll plaza from above: cars pass through FASTag lanes and each pays a toll; tolls from bank accounts averaged ₹${H.small.netcAvg} in ${H.fy}.`} />
                <img className="toll-card" src={FASTAG_IMG} alt="" />
            </div>
            <div className="split-card">
                {children}
                <div className="wall-read">
                    <span><b>{H.day.tollLakh.toFixed(2)}</b> lakh toll payments from bank accounts on an average day of {H.fy}</span>
                    <span><b>₹{H.small.netcAvg}</b> each, on average</span>
                </div>
                {ev && <p className="event-line">{ev.note} <a href={ev.url}>Source</a></p>}
            </div>
        </div>
    );
};

// PREPAID PAYMENT INSTRUMENTS (PPI) ===================================================================================
// A prepaid card taps a PoS machine again and again, the day's count running up beside it: an average day of the
// latest year, run in 12 seconds. Beside it, the instruments in issue at the end of March 2026, wallets and cards.
const PREPAID = dataUri(cardSvg("prepaid").svg), READER = dataUri(posKeypadSvg(String(H.small.ppiAvg)).svg);
export const PrepaidStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, seen } = useStage<HTMLDivElement>();
    const [ t, setT ] = useState(9);
    useEffect(() => {
        if (!seen) return;
        if (reducedMotion()) { setT(12); return; }
        return ref.current ? loopOnScreen(ref.current, dt => setT(x => (x + dt) % 12)) : undefined;
    }, [ seen ]);
    const wallets = H.ppi.allCrore - H.ppi.cardsCrore;
    return (
        <div className={splitClass(layout)}>
            <div className="split-card">
                {children}
                <div className="day-progress" role="progressbar" aria-label={`An average day of ${H.fy}`} aria-valuemin={0} aria-valuemax={24} aria-valuenow={Math.floor(t / 12 * 24)}>
                    <span className="day-head"><span>An average day of {H.fy}</span><b>{String(Math.floor(t / 12 * 24)).padStart(2, "0")}:{String(Math.floor(t / 12 * 1440) % 60).padStart(2, "0")}</b></span>
                    <span className="day-track"><i style={{ width : `${t / 12 * 100}%` }} /></span>
                    <span className="day-ticks"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></span>
                    <span className="day-count"><b>{(H.ppi.dayCrore * t / 12).toFixed(2)}</b> crore PPI payments so far, ₹{H.small.ppiAvg} each on average</span>
                </div>
            </div>
            <div className="split-stage prepaid-stage" ref={ref}>
                <div className="tap" aria-hidden="true">
                    <img className="tap-reader" src={READER} alt="" />
                    <img className="tap-card" src={PREPAID} alt="" />
                    <span className="tap-ring" />
                </div>
                <div className="ppi-split" role="img" aria-label={`${H.ppi.allCrore.toFixed(1)} crore PPIs at the end of March 2026: ${wallets.toFixed(1)} crore wallets and ${H.ppi.cardsCrore.toFixed(1)} crore cards.`}>
                    <span className="ppi-total"><b>{H.ppi.allCrore.toFixed(1)}</b> crore PPIs in issue, March 2026</span>
                    <span className="ppi-bar"><i style={{ width : `${wallets / H.ppi.allCrore * 100}%` }} /><i style={{ width : `${H.ppi.cardsCrore / H.ppi.allCrore * 100}%` }} /></span>
                    <span className="ppi-key"><span><b>{wallets.toFixed(1)}</b> crore wallets</span><span><b>{H.ppi.cardsCrore.toFixed(1)}</b> crore cards</span></span>
                </div>
            </div>
        </div>
    );
};

// THE CLOSE: TEN YEARS ON THE LADDER ==================================================================================
// Each method's average payment in its first year with a count (2015-16 for most) and in 2025-26, as a slope on the
// title's ratio scale, drawn the way Money in, money out draws its countries: each line fades in from the left, a ring
// at its start and a disc at its end, the values either side and a chip with the change. The reader's guess sits by
// RTGS.
const LO = Math.log10(80), HI = Math.log10(2e7), TICKS = [ 100, 1000, 1e4, 1e5, 1e6, 1e7 ];
const tickName = (v : number) => (v >= 1e7 ? "₹1 crore" : v >= 1e5 ? `₹${v / 1e5} lakh` : `₹${inr(v)}`);
export const TiltStep = ({ children } : { children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ guess, setGuess ] = useState<number | null>(null), [ on, setOn ] = useState<string | null>(null);
    useEffect(() => {
        setGuess((window as unknown as { __beyondUpiGuess? : number }).__beyondUpiGuess ?? null);
        const hear = (e : Event) => setGuess((e as CustomEvent<number>).detail);
        window.addEventListener(GUESS_EVENT, hear); return () => window.removeEventListener(GUESS_EVENT, hear);
    }, []);
    const rows = useMemo(() => LADDER.map(r => {
        const first = FYS.findIndex((_, i) => avg(r.key, i) != null);
        return { ...r, from : avg(r.key, first) as number, fromFy : FYS[first] };
    }), []);
    const { w, h } = size, narrow = w < 600;
    const pad = { t : 52, b : 20 }, Y = (v : number) => pad.t + (1 - (Math.log10(v) - LO) / (HI - LO)) * (h - pad.t - pad.b);
    const x0 = narrow ? w * 0.36 : w * 0.3, x1 = narrow ? w * 0.6 : w * 0.58;
    // labels in value order, pushed apart where they would touch
    const spread = (vals : number[]) => {
        const order = vals.map((v, i) => [ Y(v) + 4, i ] as const).sort((a, b) => a[0] - b[0]), out : number[] = [];
        let last = -1e9;
        for (const [ y, i ] of order) { last = Math.max(y, last + 18); out[i] = last; }
        return out;
    };
    const ly = spread(rows.map(r => r.from)), ry = spread(rows.map(r => r.avg));
    const chipX = x1 + (narrow ? 0 : 150);
    return (
        <div className="tilt">
            <div className="tilt-head">{children}</div>
            <div className="tilt-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Each method's average payment, ${FYS[0]} to ${FYS[LAST]}: ${rows.map(r => `${METHOD[r.key].short} ${rupees(r.from)} to ${rupees(r.avg)}`).join("; ")}.`}>
                        <defs>
                            {rows.map(r => (
                                <linearGradient key={r.key} id={`tilt-${r.key}`} x1="0" x2="1">
                                    <stop offset="0" stopColor={METHOD[r.key].tone} stopOpacity="0.25" />
                                    <stop offset="1" stopColor={METHOD[r.key].tone} stopOpacity="1" />
                                </linearGradient>
                            ))}
                        </defs>
                        {TICKS.map(v => (
                            <g key={v} className="grid">
                                <line x1={x0 - 6} x2={x1 + 6} y1={Y(v)} y2={Y(v)} />
                                <text x={(x0 + x1) / 2} y={Y(v) - 4} textAnchor="middle">{tickName(v)}</text>
                            </g>
                        ))}
                        {[ [ x0, FYS[0] ], [ x1, FYS[LAST] ] ].map(([ x, fy ]) => (
                            <g key={fy as string} className="tilt-axis">
                                <line x1={x as number} x2={x as number} y1={pad.t - 10} y2={h - pad.b} />
                                <rect x={(x as number) - 38} y={pad.t - 44} width={76} height={24} rx={12} />
                                <text x={x as number} y={pad.t - 27} textAnchor="middle">{fy as string}</text>
                            </g>
                        ))}
                        {rows.map((r, i) => {
                            const t = r.avg / r.from, up = t >= 1;
                            const cls = `tilt-row ${drawn ? "is-drawn" : ""} ${on === r.key ? "is-on" : on ? "is-dim" : ""}`;
                            return (
                                <g key={r.key} className={cls} style={{ "--tone" : METHOD[r.key].tone, transitionDelay : `${0.2 + i * 0.12}s` } as React.CSSProperties}
                                    onPointerEnter={() => setOn(r.key)} onPointerLeave={() => setOn(null)}>
                                    <line className="tilt-hit" x1={x0} x2={x1} y1={Y(r.from)} y2={Y(r.avg)} />
                                    <line className="tilt-line" x1={x0} x2={x1} y1={Y(r.from)} y2={Y(r.avg) + 0.01} pathLength={1} stroke={`url(#tilt-${r.key})`} />
                                    <circle className="tilt-start" cx={x0} cy={Y(r.from)} r={4.5} />
                                    <circle className="tilt-disc" cx={x1} cy={Y(r.avg)} r={6} />
                                    <text className="tilt-name" x={x0 - 12} y={ly[i]} textAnchor="end">{narrow ? "" : `${METHOD[r.key].short} `}<tspan className="tilt-val">{rupees(r.from)}</tspan>{r.fromFy !== FYS[0] && !narrow ? <tspan className="tilt-sub"> ({r.fromFy})</tspan> : null}</text>
                                    <g className="tilt-end">
                                        <text className="tilt-name" x={x1 + 12} y={ry[i]}><tspan className="tilt-val">{rupees(r.avg)}</tspan> {METHOD[r.key].short}</text>
                                        {!narrow && (
                                            <g transform={`translate(${chipX} ${ry[i] - 12})`}>
                                                <rect className={`chip ${up ? "is-up" : "is-down"}`} width={64} height={17} rx={8.5} />
                                                <text className="chip-text" x={32} y={12.5} textAnchor="middle">{up ? `▲ ${t.toFixed(1)}x` : `▼ ${((1 - t) * 100).toFixed(0)}%`}</text>
                                            </g>
                                        )}
                                    </g>
                                </g>
                            );
                        })}
                        {guess != null && <g className="tilt-guess"><line x1={x1 - 26} x2={x1 + 2} y1={Y(guess)} y2={Y(guess)} /><text x={x1 - 30} y={Y(guess) + 4} textAnchor="end">your guess, {rupees(guess)}</text></g>}
                    </svg>
                )}
            </div>
        </div>
    );
};
