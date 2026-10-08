"use client";

// Your basket: the wholesale index's own basket as the reader's object. The 29 groups carry their official weights,
// which add to ₹100; the reader moves a slider and the other groups give or take to keep the hundred conserved, and
// the reader's own index, worked the way the index itself is (a weighted average of the groups' indices), walks away
// from the official one in front of them, month by month over the whole run. "The official basket" and "Start from
// zero" are the two starting points.
//
// The mechanics and the layout follow the "your basket" interactive on Time Series of India's read on the consumer
// price index (timeseriesofindia.com/economy/read/price-of-nearly-everything), rebuilt here for the wholesale basket:
// one card, the groups' sliders down the left, the readout on the right (held in view while the rows pass on a
// desktop, first on a phone), and a note across the foot.

// REACT CORE ==========================================================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { Button } from "fictoan-react";

// LOCAL ===============================================================================================================
import { ALL, GROUPS, HEADLINE, MAJORS, MAJOR_PLAIN, MONTHS, monthName, rs, shortMonth, signed } from "./data";
import { useSize } from "./useSize";

// STYLES ==============================================================================================================
import "./basket.css";

const OFFICIAL = GROUPS.map(g => g.weight);
const sum = (xs : number[]) => xs.reduce((s, v) => s + v, 0);

// The index's own arithmetic: a weighted average of the groups' indices at the reader's weights.
const yoursAt = (vals : number[], k : number) => {
    const sw = sum(vals);
    if (sw < 1e-9) return null;
    let acc = 0;
    GROUPS.forEach((g, i) => { acc += vals[i] * g.series[k]; });
    return acc / sw;
};
// The latest month, the end of the line, so the big numbers and the line say the same thing.
const LAST = MONTHS.length - 1;
const yoursNow = (vals : number[]) => yoursAt(vals, LAST);

// A short name for a group, from DBIE's label, in sentence case as every label on the page is. The pharmaceuticals
// group keeps its first word, so every name fits one line beside its slider.
const shortName = (label : string) => {
    const s = label
        .replace(/^Manufacture of /i, "")
        .replace(/Manufacture of /gi, "")
        .replace(/\/.*$/, "")
        .replace(/, Except .*$/i, "")
        .replace(/^(Pharmaceuticals), .*$/i, "$1")
        .replace(/^Wood and of Products of Wood and Cork$/i, "Wood and cork products")
        .replace(/Minral/g, "Mineral")
        .replace(/\s*-\s*/g, "-")
        .trim();
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const BasketWidget = () => {
    const [ vals, setVals ] = useState<number[]>(() => [ ...OFFICIAL ]);
    const prevSum = useRef(100);
    const [ hot, setHot ] = useState<number | null>(null);
    const [ lab, setLab ] = useState<number | null>(null);                   // the label's group, kept while it fades
    const hotTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { ref : tsRef, width : tsW } = useSize<HTMLDivElement>();
    const { ref : barRef, width : barW } = useSize<HTMLDivElement>();
    const labRef = useRef<HTMLSpanElement>(null);

    const mine = yoursNow(vals);
    const official = ALL[LAST];
    const when = shortMonth(HEADLINE.lastMonth);
    const sw = sum(vals);
    const untouched = vals.every((v, i) => Math.abs(v - OFFICIAL[i]) < 1e-6);
    const atZero = sw < 1e-6;
    const full = sw >= 99.995;

    // Keep the hundred conserved: with a full basket, moving one slider scales the others to absorb the change; while a
    // from-zero build is short of a hundred the drag is free, and conservation takes over the moment it is spent.
    const move = useCallback((i : number, v : number) => {
        setVals(prev => {
            const next = [ ...prev ];
            next[i] = Math.max(0, Math.min(100, v));
            const others = next.reduce((s, x, k) => (k === i ? s : s + x), 0);
            const wasFull = prevSum.current >= 99.995;
            const target = wasFull ? 100 - next[i] : Math.min(others, 100 - next[i]);
            if (Math.abs(target - others) > 1e-9) {
                if (others > 1e-9) { const f = target / others; next.forEach((x, k) => { if (k !== i) next[k] = x * f; }); }
                else if (target > 0) { const share = target / (next.length - 1); next.forEach((_, k) => { if (k !== i) next[k] = share; }); }
            }
            prevSum.current = sum(next);
            return next;
        });
    }, []);
    const light = (i : number) => { clearTimeout(hotTimer.current); setHot(i); setLab(i); };
    const fade = () => { hotTimer.current = setTimeout(() => setHot(null), 700); };
    const reset = () => { setVals([ ...OFFICIAL ]); prevSum.current = 100; };
    const zero = () => { setVals(OFFICIAL.map(() => 0)); prevSum.current = 0; };
    useEffect(() => () => clearTimeout(hotTimer.current), []);

    const phrase =
        atZero ? "The basket is empty. Give a few groups a share of your ₹100."
            : untouched ? "This is the official basket. Move a slider to make it yours."
                : !full ? `₹${sw.toFixed(0)} of the ₹100 placed; the hatched stretch of the bar is still unspent.`
                    : mine !== null && Math.abs(mine - official) < 0.5 ? "Your basket costs almost exactly what the official one does."
                        : mine !== null && mine > official ? `Your ₹100 of ${HEADLINE.baseFy} goods costs ₹${(mine - official).toFixed(0)} more than the official basket’s.`
                            : `Your ₹100 of ${HEADLINE.baseFy} goods costs ₹${(official - (mine ?? 0)).toFixed(0)} less than the official basket’s.`;

    // The two lines back in time. On a narrow chart the end labels take two lines each, so the plot keeps its width.
    const yoursSeries = useMemo(() => MONTHS.map((_, k) => yoursAt(vals, k)), [ vals ]);
    const ts = useMemo(() => {
        const w = tsW || 480, narrow = w < 440, h = narrow ? 144 : 176;
        const padL = 0, padR = narrow ? 112 : 144, padT = 8, padB = 24;
        const n = MONTHS.length;
        const all = [ 100, ...ALL, ...yoursSeries.filter((v) : v is number => v !== null) ];
        const lo = Math.min(...all), hi = Math.max(...all);
        const pad = Math.max(2, (hi - lo) * 0.08);
        const X = (k : number) => padL + (k / (n - 1)) * (w - padL - padR);
        const Y = (v : number) => padT + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (h - padT - padB);
        const line = (vs : (number | null)[]) => vs.map((v, k) => (v === null ? "" : `${X(k).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean).join(" ");
        const labs = [ { v : ALL[n - 1], y : Y(ALL[n - 1]), cls : "is-head", word : "the official basket" } ];
        const yl = yoursSeries[n - 1];
        if (yl !== null) labs.push({ v : yl, y : Y(yl), cls : "is-you", word : "your basket" });
        // A label's height: one line of 12px type, or two on a narrow chart; dodge the pair apart when they meet.
        const lh = narrow ? 30 : 16;
        if (labs.length === 2 && Math.abs(labs[0].y - labs[1].y) < lh) {
            const mid = (labs[0].y + labs[1].y) / 2;
            const [ up, dn ] = labs[0].y <= labs[1].y ? [ labs[0], labs[1] ] : [ labs[1], labs[0] ];
            up.y = mid - lh / 2; dn.y = mid + lh / 2;
        }
        // Keep both inside the frame, the pair shifted together if one would leave it.
        const top = padT + 4, bottom = h - padB - (narrow ? 14 : 0);
        const minY = Math.min(...labs.map(l => l.y)), maxY = Math.max(...labs.map(l => l.y));
        const shift = minY < top ? top - minY : maxY > bottom ? bottom - maxY : 0;
        labs.forEach(l => { l.y += shift; });
        return { w, h, narrow, padL, padR, padT, padB, X, Y, line, labs };
    }, [ tsW, yoursSeries ]);

    let before = 0;
    const segs = vals.map(v => { const s = { left : before, w : v }; before += v; return s; });
    const hotLabel = lab !== null ? `${shortName(GROUPS[lab].label)} · ₹${vals[lab].toFixed(0)} of 100` : "";
    const hotCentre = lab !== null ? segs[lab].left + segs[lab].w / 2 : 0;

    // The label over the bar sits centred on its segment, held inside the bar's ends.
    useLayoutEffect(() => {
        const el = labRef.current;
        if (!el || !barW) return;
        const lw = Math.min(el.offsetWidth, barW);
        const x = Math.max(0, Math.min(barW - lw, (hotCentre / 100) * barW - lw / 2));
        el.style.transform = `translateX(${x.toFixed(1)}px)`;
    }, [ hotCentre, hotLabel, barW ]);

    return (
        <div className="bk">
            <div className="bk-body">
                <div className="bk-out">
                    <div className="bk-read">
                        <div className="bk-num is-you">
                            <span className="bk-kick">
                                Your basket<span className="bk-kick-sep">,</span>{" "}<span className="bk-kick-month">{when}</span>
                            </span>
                            <strong className="bk-big">{mine === null ? "—" : rs(mine)}</strong>
                        </div>
                        <div className="bk-num is-head">
                            <span className="bk-kick">
                                The official basket<span className="bk-kick-sep">,</span>{" "}<span className="bk-kick-month">{when}</span>
                            </span>
                            <strong className="bk-big">{rs(official)}</strong>
                        </div>
                    </div>
                    <p className="bk-for">{`for ₹100 of ${HEADLINE.baseFy} goods`}</p>

                    <div className="bk-ts" ref={tsRef}>
                        <svg className="bk-ts-svg" viewBox={`0 0 ${ts.w} ${ts.h}`} style={{ height : ts.h }} aria-hidden="true">
                            <line className="bk-ts-base" x1={ts.padL} x2={ts.w - ts.padR} y1={ts.Y(100)} y2={ts.Y(100)} />
                            {yoursSeries[0] !== null && <polyline className="bk-ts-you" points={ts.line(yoursSeries)} />}
                            <polyline className="bk-ts-head" points={ts.line(ALL)} />
                            {ts.labs.map(l => (
                                ts.narrow ? (
                                    <text key={l.word} className={`bk-ts-lab ${l.cls}`} x={ts.w - ts.padR + 8} y={l.y - 2}>
                                        <tspan className="bk-ts-val">{`${rs(l.v)} `}</tspan>
                                        <tspan x={ts.w - ts.padR + 8} dy={14}>{l.word}</tspan>
                                    </text>
                                ) : (
                                    <text key={l.word} className={`bk-ts-lab ${l.cls}`} x={ts.w - ts.padR + 8} y={l.y + 4}>
                                        <tspan className="bk-ts-val">{rs(l.v)}</tspan>{` ${l.word}`}
                                    </text>
                                )
                            ))}
                            <text className="bk-ts-tick" x={ts.padL} y={ts.h - 6}>{shortMonth(MONTHS[0])}</text>
                            <text className="bk-ts-tick" x={ts.w - ts.padR} y={ts.h - 6} textAnchor="end">{shortMonth(MONTHS[LAST])}</text>
                        </svg>
                    </div>

                    <p className="bk-phrase" aria-live="polite">{phrase}</p>

                    <div className="bk-btns">
                        <Button kind="secondary" size="small" disabled={untouched} onClick={reset}>The official basket</Button>
                        <Button kind="secondary" size="small" disabled={atZero} onClick={zero}>Start from zero</Button>
                    </div>

                    <div className="bk-barwrap">
                        <span ref={labRef} className={`bk-hotlab ${hot !== null ? "is-shown" : ""}`} aria-hidden="true">{hotLabel}</span>
                        <div className={`bk-bar ${hot !== null ? "has-hot" : ""}`} ref={barRef} aria-hidden="true">
                            {segs.map((s, i) => (
                                <span
                                    key={GROUPS[i].code} className={`bk-seg bk-m${GROUPS[i].major} ${hot === i ? "is-hot" : ""}`}
                                    style={{ flexBasis : `${s.w.toFixed(2)}%`, borderLeftWidth : s.w < 0.05 || s.left < 0.05 ? 0 : undefined }}
                                />
                            ))}
                            <span className="bk-seg bk-unspent" style={{ flexBasis : `${Math.max(0, 100 - sw).toFixed(2)}%`, borderLeftWidth : sw > 99.95 || sw < 0.05 ? 0 : undefined }} />
                        </div>
                    </div>
                </div>

                <div className="bk-rows">
                    {MAJORS.map((m, mi) => (
                        <div key={m.code} className={`bk-major bk-m${mi}`}>
                            <div className="bk-major-name">{MAJOR_PLAIN[mi]}</div>
                            {GROUPS.map((g, i) => g.major === mi && (
                                <div key={g.code} className="bk-row">
                                    <span className="bk-name">
                                        <span className="bk-label">{shortName(g.label)}</span>{" "}
                                        <span className="bk-rate">{signed(g.now)}</span>
                                    </span>
                                    <span className="bk-slide" style={{ "--f" : vals[i] / 100 } as React.CSSProperties}>
                                        <span className="bk-track" aria-hidden="true"><span className="bk-fill" /></span>
                                        <input
                                            type="range" min={0} max={100} step={0.05} value={vals[i]} className="bk-input" style={{ touchAction : "pan-y" }}
                                            aria-label={`Your share of ₹100 on ${shortName(g.label).toLowerCase()}`}
                                            onChange={e => { light(i); move(i, +e.target.value); }}
                                            onPointerDown={() => light(i)} onPointerUp={fade} onBlur={fade}
                                        />
                                    </span>
                                    <span className="bk-val">₹{vals[i].toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <p className="bk-note">
                {`The official basket, yours to reweight. Each slider is a group’s share of ₹100; the line is your basket worked the way the index works, a weighted average of its ${GROUPS.length} groups. It changes the weights, not the prices. Office of the Economic Adviser, ${monthName(HEADLINE.lastMonth).replace(" ", "\u00a0")}.`}
            </p>
        </div>
    );
};
