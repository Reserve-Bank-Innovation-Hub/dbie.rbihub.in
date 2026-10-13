"use client";

// Money out: the staircase of the LRS limit since 2004, the suitcase the money out packs (2024-25 by purpose), the
// study band lifted out of the years, and the ticker of months with the tax changes pinned on it.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useId, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Gift, GraduationCap, Package, Plane, TrendingUp, Users } from "lucide-react";

// DATA ================================================================================================================
import { HEADLINE, LRS_FY, LRS_FYS, LRS_M, LRS_MONTHS } from "./data.gen";
import { dayName, type StepEvent } from "./record";
import { Pins, Readout, useReadout } from "./ChartBits";
import type { StageShelf } from "./LrsStage";
import type { ShelfKey } from "./lrsScene";
import { Layout, monthShort, pct, reducedMotion, signed, splitClass, useStage, usd } from "./stage";

// THE STAIRCASE =======================================================================================================
// How much one resident may send abroad in a year under the LRS, $ thousand, from 04-02-2004 to now. The RBI's
// circulars (Master Direction on the LRS, list of circulars): $25,000 from 04-02-2004, $50,000 from 20-12-2006, $100,000
// from 08-05-2007, $200,000 from 26-09-2007, $75,000 from 14-08-2013, $125,000 from 03-06-2014, $250,000 from 01-06-2015.
export const LIMITS : [ string, number ][] = [
    [ "2004-02-04", 25 ], [ "2006-12-20", 50 ], [ "2007-05-08", 100 ], [ "2007-09-26", 200 ],
    [ "2013-08-14", 75 ], [ "2014-06-03", 125 ], [ "2015-06-01", 250 ],
];

// The limit as a real staircase: one block for each limit, in order, as tall as the limit, drawn in oblique
// perspective with shaded faces (a lit top, a front that darkens towards the floor, a shadowed side), standing on a
// floor that recedes behind it and casting a soft shadow. The steps rise from $25,000, drop once in August 2013 and rise
// again to $250,000, one after another; the record's pins stand on the steps they belong to.
export const StairsStep = ({ layout, events, children } : { layout? : Layout; events : StepEvent[]; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const { w, h } = size;
    const narrow = w < 560;
    const n = LIMITS.length, pad = { l : narrow ? 8 : 24, r : narrow ? 30 : 70, t : 80, b : narrow ? 54 : 64 };
    const depth = { x : narrow ? 16 : 38, y : narrow ? 11 : 24 };
    const sw = (w - pad.l - pad.r - depth.x) / n, floor = h - pad.b;
    const top = (v : number) => floor - v / 260 * (floor - pad.t);
    const X = (i : number) => pad.l + i * sw;
    const pins = events.map(e => { const i = LIMITS.findIndex(l => l[0] === e.day); return { ...e, x : X(i) + sw * 0.18 + depth.x * 0.5, y : top(LIMITS[i][1]) - depth.y * 0.5, delay : 0.6 + i * 0.12 }; }).filter(p => p.x > 0);
    const x0 = X(0), x1 = X(n - 1) + sw;
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage stairs-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`The LRS limit, step by step: ${LIMITS.map(([ dd, v ]) => `$${v},000 from ${dayName(dd)}`).join("; ")}.`}>
                        <defs>
                            <linearGradient id="step-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--step-hi)" /><stop offset="1" stopColor="var(--step-lo)" /></linearGradient>
                            <linearGradient id="step-front-cut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--cut-hi)" /><stop offset="1" stopColor="var(--cut-lo)" /></linearGradient>
                            <linearGradient id="step-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--side-hi)" /><stop offset="1" stopColor="var(--side-lo)" /></linearGradient>
                            <filter id="step-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
                        </defs>
                        {/* the floor, receding, and the staircase's shadow on it */}
                        <path className="stairs-floor" d={`M${x0 - 20},${floor} L${x0 - 20 + depth.x * 2},${floor - depth.y * 2} L${x1 + depth.x * 2 + 20},${floor - depth.y * 2} L${x1 + 20},${floor} Z`} />
                        <ellipse className="stairs-shadow" cx={(x0 + x1) / 2 + depth.x} cy={floor - depth.y * 0.4} rx={(x1 - x0) / 2} ry={depth.y * 0.9} filter="url(#step-blur)" />
                        {LIMITS.map(([ day, v ], i) => {
                            const x = X(i), y = top(v), cut = i === 4;
                            return (
                                <g key={day} className={`step ${cut ? "is-cut" : ""} ${drawn ? "is-up" : ""}`} style={{ transitionDelay : `${0.1 + i * 0.12}s`, transformOrigin : `${x}px ${floor}px` }}>
                                    <path className="step-side" d={`M${x + sw},${y} L${x + sw + depth.x},${y - depth.y} L${x + sw + depth.x},${floor - depth.y} L${x + sw},${floor} Z`} fill="url(#step-side)" />
                                    <path className="step-top" d={`M${x},${y} L${x + depth.x},${y - depth.y} L${x + sw + depth.x},${y - depth.y} L${x + sw},${y} Z`} />
                                    <rect className="step-front" x={x} y={y} width={sw} height={floor - y} fill={`url(#step-front${cut ? "-cut" : ""})`} />
                                    <line className="step-edge" x1={x} x2={x + sw} y1={y} y2={y} />
                                    <line className="step-edge-back" x1={x + depth.x} x2={x + sw + depth.x} y1={y - depth.y} y2={y - depth.y} />
                                    <text className="step-value" x={x + sw / 2} y={y + (narrow ? 18 : 28)} textAnchor="middle">${narrow ? `${v}k` : `${v},000`}</text>
                                    {cut && <text className="step-arrow" x={x + sw / 2} y={y + (narrow ? 36 : 52)} textAnchor="middle">▼ cut</text>}
                                    <text className="step-date" x={x + sw / 2} y={floor + 20} textAnchor="middle">{narrow ? day.slice(0, 4) : dayName(day)}</text>
                                </g>
                            );
                        })}
                        {!narrow && <text className="stairs-note" x={pad.l} y={h - 8}>Each step is the yearly limit for one resident, in US dollars, from the date under it</text>}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// THE SUITCASE ========================================================================================================
// What the money sent abroad under the LRS paid for. Each purpose carries an icon, its name and what it covers, in the
// words of the RBI's purpose codes; the key sits in the card.
export const PACK = [
    { key : "travel", label : "Travel", Icon : Plane, means : "Trips abroad, for private visits or business" },
    { key : "relatives", label : "Family abroad", Icon : Users, means : "Upkeep of close relatives living abroad" },
    { key : "gifts", label : "Gifts", Icon : Gift, means : "Gifts sent to people abroad" },
    { key : "study", label : "Study", Icon : GraduationCap, means : "Fees and living costs of studying abroad" },
    { key : "investment", label : "Investment", Icon : TrendingUp, means : "Shares and debt bought abroad" },
] as const;
export const PACK_REST = { key : "rest", label : "Other", Icon : Package, means : "Property, medical treatment, deposits, donations and the rest" } as const;

// The shelves, after the ₹1 lakh story's "Silver, a mason's days, dollars and wheat" slide: a row on the ground for each
// purpose, holding the year's money in units of $250 million (planes, houses, gifts, mortarboards, coins, cartons), the
// row's largest year a ghost behind. A year control runs from the first full year to the latest: the years play on
// their own while the slide is on screen, a year at a time, round again after a pause at the end; a touch of the
// slider pauses them and the button sets them going again. A tag at each end of a row names it and gives the year's sum.
const LrsStage = dynamic(() => import("./LrsStage"), { ssr : false, loading : () => <div className="shelves-stage is-loading" /> });
const UNIT_BN = 0.25, STEP_MS = 1100, HOLD_MS = 2600;
const EMOJI : Record<string, string> = { travel : "✈️", relatives : "👪", gifts : "🎁", study : "🎓", investment : "📈", rest : "📦" };
export const PackStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, seen } = useStage<HTMLDivElement>();
    const [ k, setK ] = useState(0);
    const [ playing, setPlaying ] = useState(true);
    const [ visible, setVisible ] = useState(false);
    const id = useId();
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([ e ]) => setVisible(e.intersectionRatio > 0.4), { threshold : [ 0, 0.4 ] });
        io.observe(el);
        return () => io.disconnect();
    }, [ ref ]);
    const reduced = typeof window !== "undefined" && reducedMotion();
    const last = LRS_FYS.length - 1;
    useEffect(() => {
        if (!playing || !visible || reduced) return;
        const t = setTimeout(() => setK(v => v >= last ? 0 : v + 1), k >= last || k === 0 ? HOLD_MS : STEP_MS);
        return () => clearTimeout(t);
    }, [ playing, visible, reduced, k, last ]);
    // with reduced motion the slide opens on the latest year
    useEffect(() => { if (reduced && seen) setK(last); }, [ reduced, seen, last ]);
    const pause = () => setPlaying(false);
    // a touch anywhere on the slide pauses the years, except on the play button, which toggles them itself (the capture
    // runs before the button's own handler, so without this a press on Pause would pause and then play again)
    const pauseUnlessPlay = (e : { target : EventTarget }) => { if (!(e.target as HTMLElement).closest(".shelf-play")) pause(); };
    const purposes = [ ...PACK, PACK_REST ];
    const valueOf = (y : (typeof LRS_FY)[number], key : string) => key === "rest" ? y.total - PACK.reduce((a, p) => a + y[p.key], 0) : y[key as (typeof PACK)[number]["key"]];
    const year = LRS_FY[k];
    const stage = useMemo<StageShelf[]>(() => purposes.map(p => {
        const top = Math.max(...LRS_FY.map(y => valueOf(y, p.key)));
        const now = valueOf(year, p.key);
        return { key : p.key as ShelfKey, name : <span className="named"><span className="emo" aria-hidden="true">{EMOJI[p.key]}</span> {p.label}</span>, unit : p.means,
            count : `${usd(now)} · ${pct(now / year.total * 100, 0)}`, have : now / UNIT_BN, max : Math.ceil(top / UNIT_BN), missing : false };
    }), [ k ]);                                                                  // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage lrs-shelves" ref={ref} onPointerDownCapture={pauseUnlessPlay} onKeyDownCapture={pauseUnlessPlay}
                role="img" aria-label={`Money sent abroad under the LRS, ${LRS_FYS[k]}: ${purposes.map(p => `${p.label} ${usd(valueOf(year, p.key))}`).join(", ")}; ${usd(year.total)} in all.`}>
                <div className="shelf-control">
                    <label htmlFor={id}>Year</label>
                    <input id={id} type="range" min={0} max={last} step={1} value={k} onChange={e => { pause(); setK(+e.target.value); }} aria-valuetext={LRS_FYS[k]} />
                    <output htmlFor={id} className="shelf-year">{LRS_FYS[k]}</output>
                    <span className="shelf-total">{usd(year.total)}{k > 0 ? ` · ${(year.total / LRS_FY[0].total).toFixed(1)}x ${LRS_FYS[0]}` : ""}</span>
                    {!reduced && (
                        <button type="button" className={`shelf-play ${playing ? "is-playing" : ""}`}
                            onClick={() => setPlaying(v => !v)} aria-pressed={playing} aria-label={playing ? "Pause the years" : "Play the years"}>{playing ? "Pause" : "Play"}</button>
                    )}
                </div>
                <LrsStage shelves={stage} />
                <p className="shelf-note">Each object on a row is $250 million sent abroad; the faint ones behind are the row’s largest year.</p>
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// STUDY ABROAD ========================================================================================================
// LRS by purpose, each financial year from 2015-16, with the study band lifted out and the rest set back.
const STACK = [ "study", "travel", "relatives", "gifts", "investment" ] as const;
export const StudyStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const { w, h } = size;
    const n = LRS_FYS.length, pad = { l : 48, r : 16, t : 40, b : 40 };
    const bw = (w - pad.l - pad.r) / n;
    const Y = (v : number) => pad.t + (1 - v / 35) * (h - pad.t - pad.b);
    const peak = LRS_FY.reduce((b, d, i) => (d.study > LRS_FY[b].study ? i : b), 0);
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = Math.max(0, Math.min(n - 1, Math.floor((px - pad.l) / bw)));
        const d = LRS_FY[i];
        return { x : pad.l + (i + 0.5) * bw, y : Y(d.study), head : LRS_FYS[i], lines : [ `${usd(d.study, 2)} for study abroad`, `${usd(d.total)} under the LRS in all` ] };
    });
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage study-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`LRS for study abroad: ${LRS_FYS.map((fy, i) => `${fy} ${usd(LRS_FY[i].study)}`).join(", ")}.`}>
                        {[ 0, 10, 20, 30 ].map(v => (
                            <g key={v} className="grid">
                                <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end">${v}</text>
                            </g>
                        ))}
                        {LRS_FY.map((d, i) => {
                            let acc = 0;
                            const x = pad.l + i * bw + bw * 0.16, bwi = bw * 0.68;
                            return (
                                <g key={i} className={`col ${drawn ? "is-up" : ""}`} style={{ transitionDelay : `${0.1 + i * 0.08}s` }}>
                                    {[ ...STACK, "rest" ].map(k => {
                                        const v = k === "rest" ? d.total - STACK.reduce((a, s) => a + d[s], 0) : d[k as typeof STACK[number]];
                                        const y0 = Y(acc), y1 = Y(acc + v); acc += v;
                                        return <rect key={k} className={`part is-${k}`} x={x} y={y1} width={bwi} height={Math.max(0, y0 - y1)} />;
                                    })}
                                    <text className={`study-value ${i === peak || i === n - 1 ? "is-key" : ""}`} x={x + bwi / 2} y={Y(d.study) - 6} textAnchor="middle">{w < 560 && i !== peak && i !== n - 1 ? "" : d.study.toFixed(1)}</text>
                                    <text className="axis-year" x={x + bwi / 2} y={h - pad.b + 20} textAnchor="middle">{w < 560 ? `’${LRS_FYS[i].slice(2, 4)}` : LRS_FYS[i]}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">
                {children}
                <p className="study-key"><i className="sw is-study" /> study abroad <i className="sw is-faded" /> everything else under the LRS</p>
            </aside>
        </div>
    );
};

// THE TICKER ==========================================================================================================
// Every month's LRS remittances since June 2015, as a strip of bars that runs in from the left; the lockdown and the
// tax changes stand as pins on their months.
export const TickerStep = ({ layout, events, children } : { layout? : Layout; events : StepEvent[]; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const { w, h } = size;
    const n = LRS_M.length, pad = { l : 44, r : 12, t : 30, b : 36 };
    const bw = (w - pad.l - pad.r) / n;
    const Y = (v : number) => pad.t + (1 - v / 4.4) * (h - pad.t - pad.b);
    const pinned = new Set(events.map(e => e.k));
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = Math.max(0, Math.min(n - 1, Math.floor((px - pad.l) / bw)));
        return { x : pad.l + (i + 0.5) * bw, y : Y(LRS_M[i]), head : monthShort(LRS_MONTHS[i]), lines : [ `${usd(LRS_M[i], 2)} sent abroad under the LRS`, i ? `${signed((LRS_M[i] / LRS_M[i - 1] - 1) * 100)} on the month before` : "" ].filter(Boolean) };
    });
    const pins = events.map(e => ({ ...e, x : pad.l + (e.k + 0.5) * bw, y : Y(LRS_M[e.k]), delay : 0.3 + 2 * e.k / n }));
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage ticker-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`LRS remittances each month, ${monthShort(LRS_MONTHS[0])} to ${monthShort(LRS_MONTHS[n - 1])}; ${events.map(e => `${e.label} (${dayName(e.day)}): ${usd(LRS_M[e.k], 2)} that month`).join("; ")}.`}>
                        {[ 0, 1, 2, 3, 4 ].map(v => (
                            <g key={v} className="grid">
                                <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} />
                                <text x={pad.l - 6} y={Y(v) + 4} textAnchor="end">${v}</text>
                            </g>
                        ))}
                        {LRS_M.map((v, i) => (
                            <rect key={i} className={`tick ${pinned.has(i) ? "is-pinned" : ""} ${drawn ? "is-up" : ""}`} style={{ transitionDelay : `${0.2 + 2 * i / n}s` }}
                                x={pad.l + i * bw + 0.5} y={Y(v)} width={Math.max(1, bw - 1.2)} height={Y(0) - Y(v)} />
                        ))}
                        {LRS_MONTHS.map((m, i) => m.endsWith("-01") && +m.slice(0, 4) % (w < 560 ? 4 : 2) === 0 ? <text key={m} className="axis-year" x={pad.l + i * bw} y={h - pad.b + 20} textAnchor="middle">{m.slice(0, 4)}</text> : null)}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};
