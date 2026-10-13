"use client";

// Money in: the guess (two suitcases), the line since 1950-51, the spread of yearly changes, and who sends the money
// (a slope between two survey rounds). Where it lands is Landing.tsx.

// REACT CORE ==========================================================================================================
import { ReactNode, useId, useState } from "react";

// DATA ================================================================================================================
import { FDI, FDI_FYS, HEADLINE, PRIVATE, PRIVATE_FYS, SURVEY } from "./data.gen";
import { type StepEvent } from "./record";
import { Pins, Readout, useReadout } from "./ChartBits";
import { Layout, splitClass, useStage, usd, pct, signed } from "./stage";

// THE GUESS ===========================================================================================================
// Two closed suitcases, one for each stream, the same size until the reader chooses. Then both lids swing open, the
// money spills out: bundles arc out of each case and stack up beside it, a bundle for every $10 bn, to scale.
type Pick = "fdi" | "home" | "same";
const BUNDLE = 10;

// the bundles beside a case: each starts in the case's mouth and arcs out to its place in the stack
const Spill = ({ bn, x, base, width, slab, open, delay, tone, mouth } : { bn : number; x : number; base : number; width : number; slab : number; open : boolean; delay : number; tone : string; mouth : { x : number; y : number } }) => {
    const whole = Math.floor(bn / BUNDLE), part = bn / BUNDLE - whole;
    return (
        <g className={`stack ${tone}`}>
            {Array.from({ length : whole + (part > 0.05 ? 1 : 0) }, (_, k) => {
                const hh = (k === whole ? part : 1) * (slab - 2), y = base - (k + 1) * slab + (slab - 2 - hh);
                const skew = Math.sin(k * 2.1) * width * 0.04, x0 = x - width / 2 + skew;
                const fx = mouth.x - (x0 + width / 2), fy = mouth.y - (y + hh / 2);
                return (
                    <g key={k} className={`bundle ${open ? "is-out" : ""}`}
                        style={{ animationDelay : `${delay + k * 0.11}s`, "--fx" : `${fx}px`, "--fy" : `${fy}px`, "--peak" : `${Math.min(fy, 0) - 70 - k * 4}px`, "--spin" : `${(k % 2 ? 1 : -1) * (18 + k * 3)}deg` } as React.CSSProperties}>
                        <rect className="bundle-body" x={x0} y={y} width={width} height={Math.max(1, hh)} rx={2} />
                        {hh > 6 && <line className="bundle-edge" x1={x0 + 3} x2={x0 + width - 3} y1={y + hh / 2} y2={y + hh / 2} />}
                        <rect className="bundle-band" x={x0 + width * 0.42} y={y - 0.5} width={width * 0.16} height={Math.max(1, hh + 1)} />
                    </g>
                );
            })}
        </g>
    );
};

// A hard-shell trolley case seen from the front: the shell (shaded for its curve), raised ribs, corner guards, two
// latches, a badge, a side handle with a tag, the telescopic handle and two wheels. Open, its front door swings down
// towards the reader on a hinge at the bottom: the shell face folds away and the door's lined inside drops into view,
// showing the packed interior (lining, elastic straps) the money comes out of.
const Suitcase = ({ x, base, w, h, open, label, tone, tag } : { x : number; base : number; w : number; h : number; open : boolean; label : string; tone : string; tag : string }) => {
    const uid = `case-${tone}`;
    const wheel = Math.max(5, w * 0.045), bottom = base - wheel * 2, top = bottom - h, x0 = x - w / 2, x1 = x + w / 2;
    const inset = w * 0.05, fx0 = x0 + inset, fx1 = x1 - inset, fy0 = top + inset, fy1 = bottom - inset, fw = fx1 - fx0, fh = fy1 - fy0;
    const ribs = [ 0.2, 0.4, 0.6, 0.8 ].map(f => fx0 + fw * f);
    const guard = w * 0.11;
    return (
        <g className={`case ${tone} ${open ? "is-open" : ""}`}>
            <defs>
                <linearGradient id={`${uid}-shell`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--shell-dark)" /><stop offset="0.18" stopColor="var(--shell)" /><stop offset="0.45" stopColor="var(--shell-light)" />
                    <stop offset="0.7" stopColor="var(--shell)" /><stop offset="1" stopColor="var(--shell-dark)" />
                </linearGradient>
                <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.35" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <linearGradient id={`${uid}-metal`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f4f2ea" /><stop offset="0.5" stopColor="#a9a69c" /><stop offset="1" stopColor="#6d6a62" /></linearGradient>
            </defs>
            {/* the floor shadow, the wheels */}
            <ellipse className="case-shadow" cx={x} cy={base + 1} rx={w * 0.62} ry={wheel * 0.9} />
            {[ x0 + w * 0.16, x1 - w * 0.16 ].map(wx => (
                <g key={wx} className="case-wheel">
                    <rect x={wx - wheel * 0.7} y={bottom - 2} width={wheel * 1.4} height={wheel} rx={2} />
                    <circle cx={wx} cy={base - wheel} r={wheel} /><circle className="hub" cx={wx} cy={base - wheel} r={wheel * 0.38} />
                </g>
            ))}
            {/* the telescopic handle */}
            <g className="case-trolley">
                {[ x - w * 0.22, x + w * 0.22 ].map(rx => <rect key={rx} x={rx - 3} y={top - h * 0.34} width={6} height={h * 0.34 + 4} rx={2} fill={`url(#${uid}-metal)`} />)}
                <rect x={x - w * 0.28} y={top - h * 0.34 - 12} width={w * 0.56} height={14} rx={7} className="grip" />
                <rect x={x - w * 0.3} y={top - 5} width={w * 0.6} height={8} rx={3} className="collar" />
            </g>
            {/* the back shell and its rim, the interior behind the door */}
            <rect className="case-rim" x={x0} y={top} width={w} height={h} rx={w * 0.09} fill={`url(#${uid}-shell)`} />
            <g className="case-inside">
                <rect x={fx0} y={fy0} width={fw} height={fh} rx={w * 0.06} className="lining" />
                <path d={`M${fx0 + 6},${fy0 + fh * 0.2} L${fx1 - 6},${fy0 + fh * 0.75} M${fx1 - 6},${fy0 + fh * 0.2} L${fx0 + 6},${fy0 + fh * 0.75}`} className="strap" />
                <rect x={x - 7} y={fy0 + fh * 0.47 - 5} width={14} height={10} rx={2} className="buckle" />
                <rect x={fx0 + 6} y={fy0 + 6} width={fw - 12} height={fh * 0.16} rx={4} className="pocket" />
            </g>
            {/* the side handle and the tag */}
            <path className="case-side" d={`M${x1 - 1},${top + h * 0.38} q${w * 0.08},0 ${w * 0.08},${h * 0.07} v${h * 0.1} q0,${h * 0.07} -${w * 0.08},${h * 0.07}`} />
            <g className="case-tag">
                <path d={`M${x1 + w * 0.06},${top + h * 0.47} q${w * 0.05},${h * 0.06} ${w * 0.03},${h * 0.15}`} className="tag-string" />
                <g transform={`rotate(8 ${x1 + w * 0.09} ${top + h * 0.62})`}>
                    <rect x={x1 + w * 0.02} y={top + h * 0.62} width={w * 0.16} height={w * 0.24} rx={3} className="tag-card" />
                    <circle cx={x1 + w * 0.1} cy={top + h * 0.62 + 6} r={2.2} className="tag-hole" />
                    <text x={x1 + w * 0.1} y={top + h * 0.62 + w * 0.17} textAnchor="middle" className="tag-text">{tag}</text>
                </g>
            </g>
            {/* the door: the shell face, hinged at the bottom; it folds down when open */}
            <g className="case-door" style={{ transformOrigin : `${x}px ${fy1}px` }}>
                <rect x={fx0} y={fy0} width={fw} height={fh} rx={w * 0.06} fill={`url(#${uid}-shell)`} className="door-face" />
                {ribs.map(rx => (
                    <g key={rx}>
                        <line x1={rx - 1.5} x2={rx - 1.5} y1={fy0 + fh * 0.06} y2={fy1 - fh * 0.06} className="rib-shade" />
                        <line x1={rx + 1} x2={rx + 1} y1={fy0 + fh * 0.06} y2={fy1 - fh * 0.06} className="rib-light" />
                    </g>
                ))}
                <rect x={fx0} y={fy0} width={fw} height={fh} rx={w * 0.06} fill={`url(#${uid}-gloss)`} />
                {[ [ fx0, fy0, 1, 1 ], [ fx1, fy0, -1, 1 ], [ fx0, fy1, 1, -1 ], [ fx1, fy1, -1, -1 ] ].map(([ cx, cy, sx, sy ]) => (
                    <path key={`${cx}${cy}`} className="guard" d={`M${cx},${cy + sy * guard} V${cy + sy * 6} Q${cx},${cy} ${cx + sx * 6},${cy} H${cx + sx * guard} L${cx + sx * guard * 0.6},${cy + sy * guard * 0.6} Z`} />
                ))}
                {[ x - fw * 0.26, x + fw * 0.26 ].map(lx => (
                    <g key={lx} className="latch">
                        <rect x={lx - w * 0.06} y={fy0 + fh * 0.06} width={w * 0.12} height={h * 0.07} rx={3} fill={`url(#${uid}-metal)`} />
                        <rect x={lx - w * 0.025} y={fy0 + fh * 0.06 + h * 0.025} width={w * 0.05} height={h * 0.02} rx={1} className="latch-slot" />
                    </g>
                ))}
                <rect x={x - w * 0.09} y={fy1 - fh * 0.16} width={w * 0.18} height={h * 0.05} rx={3} className="badge" />
                <line x1={fx0 + 4} x2={fx1 - 4} y1={fy1 - 2} y2={fy1 - 2} className="hinge" />
            </g>
            {/* the door's inside, dropping towards the reader */}
            <g className="case-flap" style={{ transformOrigin : `${x}px ${fy1}px` }}>
                <path d={`M${fx0},${fy1} L${fx1},${fy1} L${fx1 + w * 0.08},${fy1 + fh * 0.2} L${fx0 - w * 0.08},${fy1 + fh * 0.2} Z`} className="flap-out" />
                <path d={`M${fx0 + 5},${fy1 + 3} L${fx1 - 5},${fy1 + 3} L${fx1 + w * 0.05},${fy1 + fh * 0.18} L${fx0 - w * 0.05},${fy1 + fh * 0.18} Z`} className="flap-lining" />
                <path d={`M${fx0 + w * 0.05},${fy1 + fh * 0.09} H${fx1 - w * 0.05}`} className="flap-zip" />
            </g>
            <text className="case-label" x={x} y={fy1 + fh * 0.2 + 22} textAnchor="middle">{label}</text>
        </g>
    );
};

export const GuessStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size } = useStage<HTMLDivElement>();
    const [ pick, setPick ] = useState<Pick | null>(null);
    const { w, h } = size;
    const narrow = w < 560;
    const home = HEADLINE.privateBoth, fdi = HEADLINE.fdiBoth, fy = HEADLINE.bothFy;
    const base = h - 70, caseW = Math.min(230, w * (narrow ? 0.27 : 0.2)), caseH = Math.min(caseW * 1.3, h * 0.42);
    const slab = Math.max(6, Math.min(30, (base - 60) / Math.ceil(home / BUNDLE)));
    const stackW = caseW * (narrow ? 0.62 : 0.66);
    // each stream: its case on the left of its half, the stack beside it on the right
    const halves = (narrow ? [ w * 0.27, w * 0.75 ] : [ w * 0.25, w * 0.75 ]).map(gx => ({ cx : gx - caseW * 0.42, sx : gx + caseW * 0.62 }));
    const open = !!pick;
    const mouth = (i : number) => ({ x : halves[i].cx, y : base - caseH * 0.45 });
    const items = [ { v : fdi, tone : "is-fdi", label : narrow ? "Foreign companies" : "Foreign companies investing" }, { v : home, tone : "is-in", label : narrow ? "Indians abroad" : "Indians abroad sending money home" } ];
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage guess-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img"
                        aria-label={open ? `${fy}: gross FDI ${usd(fdi)}, money sent home ${usd(home)}; each bundle $10 bn.` : `Two closed suitcases: gross FDI and money sent home, ${fy}.`}>
                        <line className="guess-floor" x1={0} x2={w} y1={base + 1} y2={base + 1} />
                        {items.map((it, i) => (
                            <g key={it.tone}>
                                <Suitcase x={halves[i].cx} base={base} w={caseW} h={caseH} open={open} label={it.label} tone={it.tone} tag={it.tone === "is-in" ? "HOME" : "FDI"} />
                                <Spill bn={it.v} x={halves[i].sx} base={base} width={stackW} slab={slab} open={open} delay={0.55 + i * 0.15} tone={it.tone} mouth={mouth(i)} />
                                <text className={`case-value ${open ? "is-shown" : ""}`} x={halves[i].sx} y={base + 48} textAnchor="middle">{usd(it.v)}</text>
                            </g>
                        ))}
                        {open && (() => {
                            const top = (v : number) => base - v / BUNDLE * slab, x = halves[1].sx + stackW / 2 + 16;
                            return (
                                <g className="guess-scale" style={{ animationDelay : `${1.2 + Math.ceil(home / BUNDLE) * 0.11}s` }}>
                                    <line className="guess-carry" x1={halves[0].sx - stackW / 2} x2={x} y1={top(fdi)} y2={top(fdi)} />
                                    <line x1={x} x2={x} y1={top(fdi)} y2={top(home)} />
                                    <text className="is-top" x={narrow ? x : x + 8} y={narrow ? top(home) - 10 : (top(fdi) + top(home)) / 2 + 7} textAnchor={narrow ? "end" : "start"}>{HEADLINE.times.toFixed(2)}x</text>
                                </g>
                            );
                        })()}
                    </svg>
                )}
            </div>
            <aside className="split-card">
                {children}
                <div className="guess-choices" role="group" aria-label="Your guess">
                    {([ [ "fdi", "Foreign companies" ], [ "same", "About the same" ], [ "home", "Indians abroad" ] ] as [ Pick, string ][]).map(([ g, label ]) => (
                        <button key={g} type="button" className={pick === g ? "is-on" : ""} aria-pressed={pick === g} onClick={() => setPick(g)}>{label}</button>
                    ))}
                </div>
                <p className={`guess-answer ${pick ? "is-shown" : ""}`} aria-live="polite">
                    {pick && <>
                        <b>{pick === "home" ? "Yes:" : "It was"} Indians abroad, {HEADLINE.times.toFixed(2)}x.</b> They sent home {usd(home)} in {fy}; foreign
                        companies brought {usd(fdi)} of gross foreign direct investment (FDI).
                        <span className="guess-unit">Each bundle is $10 bn. Money sent home is private transfers in India’s balance of payments.</span>
                    </>}
                </p>
            </aside>
        </div>
    );
};

// THE LONG LINE =======================================================================================================
// Money sent home since 1950-51, in dollars or on a ratio scale (where each doubling is the same height, so the 1970s
// show). The line draws in; the 1970s are shaded; the record's events stand as pins.
export const HistoryStep = ({ layout, events, children } : { layout? : Layout; events : StepEvent[]; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ ratio, setRatio ] = useState(false);
    const uid = useId().replace(/:/g, "");
    const { w, h } = size;
    const n = PRIVATE.length;
    const pad = { l : 52, r : w < 560 ? 70 : 96, t : 40, b : 40 };
    const X = (i : number) => pad.l + i / (n - 1) * (w - pad.l - pad.r);
    const lo = Math.log10(0.05), hi = Math.log10(200);
    const Y = (v : number) => ratio ? pad.t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (h - pad.t - pad.b) : pad.t + (1 - v / 145) * (h - pad.t - pad.b);
    const ticks = ratio ? [ 0.1, 1, 10, 100 ] : [ 0, 40, 80, 120 ];
    const i73 = PRIVATE_FYS.indexOf("1973-74"), i80 = PRIVATE_FYS.indexOf("1980-81"), i91 = PRIVATE_FYS.indexOf("1991-92");
    const marks = [ [ i73, "below" ], [ i80, "above" ], [ n - 1, "right" ] ] as const;
    const { tip, bind } = useReadout(px => {
        if (!w) return null;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - pad.l) / (w - pad.l - pad.r) * (n - 1))));
        return { x : X(i), y : Y(PRIVATE[i]), head : PRIVATE_FYS[i], lines : [ `${usd(PRIVATE[i], PRIVATE[i] < 10 ? 2 : 1)} sent home`, i ? `${signed((PRIVATE[i] / PRIVATE[i - 1] - 1) * 100)} on the year before` : "" ].filter(Boolean) };
    });
    const pins = events.map(e => ({ ...e, x : X(e.k), y : Y(PRIVATE[e.k]), delay : 0.4 + 2.2 * e.k / (n - 1) }));
    const years = [ "1950-51", "1970-71", "1990-91", "2010-11", PRIVATE_FYS[n - 1] ];
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage line-stage" ref={ref} {...bind}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Money sent home, ${PRIVATE_FYS[0]} to ${PRIVATE_FYS[n - 1]}: ${usd(PRIVATE[i73])} in 1973-74, ${usd(PRIVATE[i80])} in 1980-81, ${usd(PRIVATE[n - 1])} in ${PRIVATE_FYS[n - 1]}.`}>
                        <defs>
                            <clipPath id={`${uid}-wipe`}><rect className="wipe" x={0} y={0} width={w} height={h} style={{ transform : drawn ? "none" : "scaleX(0)" }} /></clipPath>
                            <linearGradient id={`${uid}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--in)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--in)" stopOpacity="0.02" /></linearGradient>
                        </defs>
                        <rect className="era" x={X(i73)} y={pad.t} width={X(i80) - X(i73)} height={h - pad.t - pad.b} />
                        <text className="era-label" x={X(i73) + 6} y={pad.t + 16}>1973-74 to 1980-81</text>
                        <line className="era-line" x1={X(i91)} x2={X(i91)} y1={pad.t} y2={h - pad.b} />
                        <text className="era-label" x={X(i91) + 6} y={pad.t + 16}>1991</text>
                        {ticks.map(v => (
                            <g key={v} className="grid">
                                <line x1={pad.l} x2={w - pad.r + 20} y1={Y(v || 0.0001)} y2={Y(v || 0.0001)} />
                                <text x={pad.l - 8} y={Y(v || 0.0001) + 4} textAnchor="end">${v}</text>
                            </g>
                        ))}
                        {years.map(fy => <text key={fy} className="axis-year" x={X(PRIVATE_FYS.indexOf(fy))} y={h - pad.b + 22} textAnchor="middle">{w < 560 ? fy.slice(0, 4) : fy}</text>)}
                        <g clipPath={`url(#${uid}-wipe)`}>
                            <polygon fill={`url(#${uid}-fill)`} points={`${X(0)},${Y(ratio ? 0.05 : 0)} ${PRIVATE.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} ${X(n - 1)},${Y(ratio ? 0.05 : 0)}`} />
                            <polyline className="series is-in" points={PRIVATE.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} />
                        </g>
                        {marks.map(([ i, at ]) => {
                            const x = X(i), y = Y(PRIVATE[i]);
                            const [ tx, ty, anchor ] : [ number, number, "start" | "middle" | "end" ] = at === "right" ? [ x + 12, y + 5, "start" ] : at === "below" ? [ x + 8, y + 22, "start" ] : [ x, y - 14, "middle" ];
                            return (
                                <g key={i} className={`mark ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : `${0.4 + 2.2 * i / (n - 1)}s` }}>
                                    {i === n - 1 && <circle className="pulse" cx={x} cy={y} r={6} />}
                                    <circle cx={x} cy={y} r={4.5} />
                                    <text x={tx} y={ty} textAnchor={anchor}>{usd(PRIVATE[i], PRIVATE[i] < 10 ? 1 : 1)}</text>
                                    <text className="mark-sub" x={tx} y={ty + 16} textAnchor={anchor}>{PRIVATE_FYS[i]}</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
                {w > 0 && <Pins pins={pins} w={w} shown={drawn} />}
                <Readout tip={tip} w={w} top={pad.t} bottom={h - pad.b} />
            </div>
            <aside className="split-card">
                {children}
                <div className="toggle" role="group" aria-label="Scale">
                    <button type="button" className={!ratio ? "is-on" : ""} aria-pressed={!ratio} onClick={() => setRatio(false)}>Dollars</button>
                    <button type="button" className={ratio ? "is-on" : ""} aria-pressed={ratio} onClick={() => setRatio(true)}>Ratio scale</button>
                </div>
            </aside>
        </div>
    );
};

// THE SPREAD ==========================================================================================================
// Each year's change on the year before, as a dot on a strip, one strip for money sent home and one for gross FDI, on
// one scale. A shaded band marks a typical year (the average change, give or take one standard deviation): money sent
// home sits in a narrow band, FDI is scattered across a wide one. The dots drop in one by one; pointing at a dot names
// its year.
const change = (vals : number[], fys : string[], fy : string) => { const i = fys.indexOf(fy); return (vals[i] / vals[i - 1] - 1) * 100; };
export const SpreadStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ on, setOn ] = useState<{ r : number; i : number } | null>(null);
    const { w, h } = size;
    const narrow = w < 560;
    const fys = FDI_FYS.filter(fy => fy >= HEADLINE.steady.from && fy <= HEADLINE.steady.to);
    const rows = [
        { key : "in", label : "Money sent home", sd : HEADLINE.steady.private, vals : fys.map(fy => change(PRIVATE, PRIVATE_FYS, fy)) },
        { key : "fdi", label : "Gross FDI", sd : HEADLINE.steady.fdi, vals : fys.map(fy => change(FDI, FDI_FYS, fy)) },
    ];
    const pad = { l : narrow ? 14 : 170, r : 24, t : narrow ? 56 : 44, b : 40 };
    const lo = -40, hi = 140;
    const X = (v : number) => pad.l + (v - lo) / (hi - lo) * (w - pad.l - pad.r);
    const lane = (h - pad.t - pad.b) / 2, mid = (r : number) => pad.t + lane * (r + 0.5);
    const rad = narrow ? 9 : 15;
    // a simple swarm: each dot takes the first height, alternating above and below the line, where it touches no
    // dot already placed
    const placed = rows.map(r => {
        const out : { x : number; dy : number }[] = [];
        r.vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v).forEach(({ v, i }) => {
            const x = X(v);
            for (let k = 0; k < 40; k++) {
                const dy = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * rad * 1.05;
                if (out.every((p, j) => j === i || p === undefined || Math.hypot(p.x - x, p.dy - dy) >= rad * 2.05)) { out[i] = { x, dy }; break; }
            }
        });
        return out;
    });
    const mean = (vs : number[]) => vs.reduce((a, b) => a + b, 0) / vs.length;
    const pandemic = fys.indexOf("2020-21");
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage spread-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Each year's change, ${fys[0]} to ${fys[fys.length - 1]}: money sent home moved ${pct(HEADLINE.steady.private)} in a typical year, gross FDI ${pct(HEADLINE.steady.fdi)}.`}>
                        {(narrow ? [ 0, 50, 100 ] : [ -25, 0, 25, 50, 75, 100, 125 ]).map(v => (
                            <g key={v} className={`grid ${v === 0 ? "is-zero" : ""}`}>
                                <line x1={X(v)} x2={X(v)} y1={pad.t - 8} y2={h - pad.b} />
                                <text x={X(v)} y={h - pad.b + 20} textAnchor="middle">{v > 0 ? "+" : ""}{v}%</text>
                            </g>
                        ))}
                        {rows.map((r, ri) => {
                            const m = mean(r.vals), y = mid(ri);
                            return (
                                <g key={r.key} className={`strip is-${r.key}`}>
                                    <rect className={`band ${drawn ? "is-shown" : ""}`} x={X(m - r.sd)} y={y - lane * 0.4} width={X(m + r.sd) - X(m - r.sd)} height={lane * 0.8} rx={lane * 0.12} />
                                    <line className="strip-line" x1={pad.l} x2={w - pad.r} y1={y} y2={y} />
                                    {!narrow ? <>
                                        <text className="lane-label" x={0} y={y - 6}>{r.label}</text>
                                        <text className="lane-sub" x={0} y={y + 13}>a typical year: {pct(r.sd)}</text>
                                    </> : <text className="lane-label" x={pad.l} y={y - lane * 0.4 - 6}>{r.label} · a typical year: {pct(r.sd)}</text>}
                                    <text className={`band-label ${drawn ? "is-shown" : ""}`} x={X(m + r.sd) + 6} y={y - lane * 0.4 + 14}>±{pct(r.sd, 0)}</text>
                                    {r.vals.map((v, i) => {
                                        const p = placed[ri][i];
                                        if (!p) return null;
                                        const isOn = on && on.r === ri && on.i === i;
                                        return (
                                            <g key={i} className={`yr ${drawn ? "is-in" : ""} ${isOn ? "is-on" : ""}`} style={{ animationDelay : `${0.2 + ri * 0.9 + i * 0.045}s` }}
                                                onPointerEnter={() => setOn({ r : ri, i })} onPointerLeave={() => setOn(null)}>
                                                <circle cx={p.x} cy={y + p.dy} r={rad} />
                                                {!narrow && <text x={p.x} y={y + p.dy + 4.5} textAnchor="middle">{`’${fys[i].slice(2, 4)}`}</text>}
                                            </g>
                                        );
                                    })}
                                    {ri === 0 && pandemic >= 0 && placed[0][pandemic] && (
                                        <g className={`mark is-event ${drawn ? "is-shown" : ""}`} style={{ transitionDelay : "1.6s" }}>
                                            <text x={narrow ? placed[0][pandemic].x + rad + 4 : placed[0][pandemic].x - rad - 6} y={y + placed[0][pandemic].dy + (narrow ? -rad - 4 : 4)} textAnchor={narrow ? "start" : "end"}>2020-21: {signed(r.vals[pandemic])}</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                        {on && (() => {
                            const r = rows[on.r], p = placed[on.r][on.i], y = mid(on.r) + p.dy;
                            return (
                                <g className="spread-tip" transform={`translate(${Math.min(p.x, w - 150)} ${y - rad - 12})`}>
                                    <text textAnchor="middle">{fys[on.i]}: {signed(r.vals[on.i])}</text>
                                </g>
                            );
                        })()}
                        <text className="axis-note" x={pad.l} y={h - 4}>Change on the year before, each financial year {fys[0]} to {fys[fys.length - 1]}</text>
                        {/* the key: what the dots and the bands are */}
                        <g className="spread-key" transform={`translate(${narrow ? 4 : pad.l} 6)`}>
                            {(narrow
                                ? [ [ "dot is-in", "money home, a year" ], [ "dot is-fdi", "FDI, a year" ], [ "key-band is-in", "typical, money home" ], [ "key-band is-fdi", "typical, FDI" ] ] as const
                                : [ [ "dot is-in", "money sent home, one year" ], [ "dot is-fdi", "gross FDI, one year" ], [ "key-band is-in", "typical range, money sent home" ], [ "key-band is-fdi", "typical range, FDI" ] ] as const)
                                .map(([ cls, label ], i) => {
                                    const x = narrow ? (i % 2) * 175 : i * 220, y = narrow ? Math.floor(i / 2) * 20 : 0;
                                    return (
                                        <g key={label} transform={`translate(${x} ${y})`}>
                                            {cls.startsWith("dot") ? <circle className={cls} cx={7} cy={6} r={6} /> : <rect className={cls} x={0} y={0} width={18} height={12} rx={3} />}
                                            <text x={24} y={10}>{label}</text>
                                        </g>
                                    );
                                })}
                        </g>
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

// WHO SENDS IT ========================================================================================================
// Country shares in the survey's 2016-17 round and its 2023-24 round, as a slope: each country's line runs from its
// share then to its share now, fading in from the left, its end a disc sized by the share. A chip gives the change in
// percentage points; the Gulf countries (turmeric) are bracketed with the RBI's own total for them. Pointing at a
// country lifts its line.
export const SlopeStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, size, drawn } = useStage<HTMLDivElement>();
    const [ on, setOn ] = useState<string | null>(null);
    const { w, h } = size;
    const narrow = w < 560;
    const rows = SURVEY.countries.filter(c => c.shares[0] !== null && c.shares[2] !== null && c.short !== "Canada");
    const pad = { t : 56, b : 34 }, x0 = w * (narrow ? 0.3 : 0.28), x1 = w * (narrow ? 0.66 : 0.6);
    const Y = (v : number) => pad.t + (1 - v / 30) * (h - pad.t - pad.b);
    // labels in value order, pushed apart where they would touch
    const spread = (vals : number[]) => {
        const order = vals.map((v, i) => [ Y(v) + 5, i ] as const).sort((a, b) => a[0] - b[0]), out : number[] = [];
        let last = -1e9;
        for (const [ y, i ] of order) { last = Math.max(y, last + 19); out[i] = last; }
        return out;
    };
    const ly = spread(rows.map(c => c.shares[0] as number)), ry = spread(rows.map(c => c.shares[2] as number));
    const big = new Set([ "US", "UAE", "UK" ]);
    const disc = (v : number) => 3 + Math.sqrt(v) * (narrow ? 1.6 : 2.2);
    const gulfIdx = rows.map((c, i) => c.gcc ? i : -1).filter(i => i >= 0);
    const gTop = Math.min(...gulfIdx.map(i => ry[i])) - 12, gBot = Math.max(...gulfIdx.map(i => ry[i])) + 4;
    const chipX = x1 + 132, bx = narrow ? x1 + 96 : chipX + 70;
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage slope-stage" ref={ref}>
                {w > 0 && (
                    <svg width={w} height={h} role="img" aria-label={`Shares of India's remittances, ${SURVEY.rounds[0]} to ${SURVEY.rounds[2]}: ${rows.map(c => `${c.short} ${c.shares[0]}% to ${c.shares[2]}%`).join("; ")}.`}>
                        <defs>
                            {[ "in", "gulf" ].map(k => (
                                <linearGradient key={k} id={`slope-${k}`} x1="0" x2="1">
                                    <stop offset="0" stopColor={k === "in" ? "var(--in)" : "var(--gulf)"} stopOpacity="0.25" />
                                    <stop offset="1" stopColor={k === "in" ? "var(--in)" : "var(--gulf)"} stopOpacity="1" />
                                </linearGradient>
                            ))}
                        </defs>
                        {[ 0, 10, 20, 30 ].map(v => (
                            <g key={v} className="grid">
                                <line x1={x0 - 6} x2={x1 + 6} y1={Y(v)} y2={Y(v)} />
                                <text x={(x0 + x1) / 2} y={Y(v) - 5} textAnchor="middle">{v}%</text>
                            </g>
                        ))}
                        {[ [ x0, SURVEY.rounds[0] ], [ x1, SURVEY.rounds[2] ] ].map(([ x, r ]) => (
                            <g key={r as string} className="slope-axis">
                                <line x1={x as number} x2={x as number} y1={pad.t - 10} y2={h - pad.b} />
                                <rect x={(x as number) - 38} y={pad.t - 42} width={76} height={24} rx={12} />
                                <text x={x as number} y={pad.t - 25} textAnchor="middle">{r as string}</text>
                            </g>
                        ))}
                        {rows.map((c, i) => {
                            const a = c.shares[0] as number, b = c.shares[2] as number, d = b - a;
                            const cls = `slope ${c.gcc ? "is-gulf" : "is-other"} ${big.has(c.short) ? "is-big" : ""} ${on === c.short ? "is-on" : on ? "is-dim" : ""} ${drawn ? "is-drawn" : ""}`;
                            return (
                                <g key={c.short} className={cls} style={{ transitionDelay : `${0.2 + i * 0.12}s` }} onPointerEnter={() => setOn(c.short)} onPointerLeave={() => setOn(null)}>
                                    <line className="slope-hit" x1={x0} x2={x1} y1={Y(a)} y2={Y(b)} />
                                    <line className="slope-line" x1={x0} x2={x1} y1={Y(a)} y2={Y(b) + 0.01} pathLength={1} stroke={`url(#slope-${c.gcc ? "gulf" : "in"})`} />
                                    <circle className="slope-start" cx={x0} cy={Y(a)} r={disc(a) * 0.7} />
                                    <circle className="slope-end" cx={x1} cy={Y(b)} r={disc(b)} />
                                    <text className="slope-name" x={x0 - disc(a) - 8} y={ly[i]} textAnchor="end">{c.short} <tspan className="slope-val">{a.toFixed(1)}%</tspan></text>
                                    <g className="slope-end">
                                        <text className="slope-name" x={x1 + disc(b) + 8} y={ry[i]}><tspan className="slope-val">{b.toFixed(1)}%</tspan> {c.short}</text>
                                        {!narrow && (
                                            <g transform={`translate(${chipX} ${ry[i] - 12})`}>
                                                <rect className={`chip ${d >= 0 ? "is-up" : "is-down"}`} width={56} height={17} rx={8.5} />
                                                <text className="chip-text" x={28} y={12.5} textAnchor="middle">{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)} pts</text>
                                            </g>
                                        )}
                                    </g>
                                </g>
                            );
                        })}
                        {!narrow && gulfIdx.length > 1 && (
                            <g className={`gulf-bracket ${drawn ? "is-shown" : ""}`}>
                                <path d={`M${bx},${gTop} h8 V${gBot} h-8`} />
                                <text x={bx + 16} y={(gTop + gBot) / 2 - 4}>Gulf countries</text>
                                <text className="gulf-total" x={bx + 16} y={(gTop + gBot) / 2 + 16}>{SURVEY.gcc}% together</text>
                            </g>
                        )}
                        <text className="slope-key" x={8} y={h - 6}><tspan className="is-gulf">●</tspan> Gulf countries <tspan className="is-other" dx={10}>●</tspan> others · disc size: share in that round</text>
                    </svg>
                )}
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};
