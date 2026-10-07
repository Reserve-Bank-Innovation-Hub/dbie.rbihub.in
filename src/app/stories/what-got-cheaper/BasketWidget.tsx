"use client";

// Your basket: the wholesale index's own basket as the reader's object. The 29 groups carry their official weights,
// which add to ₹100; the reader moves a slider and the other groups give or take to keep the hundred conserved, and
// the reader's own index, worked the way the index itself is (a weighted average of the groups' indices), walks away
// from the official one in front of them, month by month since April 2011. "The official basket" and "Start from
// zero" are the two starting points.
//
// The mechanics follow the "your basket" interactive on Time Series of India's read on the consumer price index
// (timeseriesofindia.com/economy/read/price-of-nearly-everything), rebuilt here for the wholesale basket.

// REACT CORE ==========================================================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { Button } from "fictoan-react";

// LOCAL ===============================================================================================================
import { ALL, GROUPS, HEADLINE, MAJORS, MAJOR_PLAIN, MONTHS, rs, shortMonth } from "./data";
import { useSize } from "./useSize";

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

// A short name for a group, from DBIE's label.
const shortName = (label : string) => label
    .replace(/^Manufacture of /i, "")
    .replace(/Manufacture of /gi, "")
    .replace(/\/.*$/, "")
    .replace(/, Except .*$/i, "")
    .replace(/Minral/g, "Mineral")
    .replace(/ - /g, "-")
    .replace(/Non-Food/i, "Non-food")
    .trim();

export const BasketWidget = () => {
    const [ vals, setVals ] = useState<number[]>(() => [ ...OFFICIAL ]);
    const prevSum = useRef(100);
    const [ hot, setHot ] = useState<number | null>(null);
    const hotTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { ref : tsRef, width : tsW } = useSize<HTMLDivElement>();

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
    const light = (i : number) => { clearTimeout(hotTimer.current); setHot(i); };
    const fade = () => { hotTimer.current = setTimeout(() => setHot(null), 700); };
    const reset = () => { setVals([ ...OFFICIAL ]); prevSum.current = 100; };
    const zero = () => { setVals(OFFICIAL.map(() => 0)); prevSum.current = 0; };
    useEffect(() => () => clearTimeout(hotTimer.current), []);

    const phrase =
        atZero ? "The basket is empty. Give a few groups a share of your ₹100."
            : untouched ? "This is the official basket. Move a slider to make it yours."
                : !full ? `₹${sw.toFixed(0)} of the ₹100 placed; the hatched stretch of the bar is still unspent.`
                    : mine !== null && Math.abs(mine - official) < 0.5 ? "Your basket costs almost exactly what the official one does."
                        : mine !== null && mine > official ? `Your ₹100 of 2011-12 goods costs ₹${(mine - official).toFixed(0)} more than the official basket’s.`
                            : `Your ₹100 of 2011-12 goods costs ₹${(official - (mine ?? 0)).toFixed(0)} less than the official basket’s.`;

    // The two lines back in time.
    const yoursSeries = useMemo(() => MONTHS.map((_, k) => yoursAt(vals, k)), [ vals ]);
    const ts = useMemo(() => {
        const w = tsW || 640, narrow = w < 480, h = narrow ? 120 : 180;
        const padL = 8, padR = narrow ? 112 : 136, padT = 14, padB = 22;
        const n = MONTHS.length;
        const all = [ ...ALL, ...yoursSeries.filter((v) : v is number => v !== null) ];
        const lo = Math.min(...all), hi = Math.max(...all);
        const pad = Math.max(2, (hi - lo) * 0.12);
        const X = (k : number) => padL + (k / (n - 1)) * (w - padL - padR);
        const Y = (v : number) => padT + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (h - padT - padB);
        const line = (vals : (number | null)[]) => vals.map((v, k) => (v === null ? "" : `${X(k).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean).join(" ");
        const labs = [ { v : ALL[n - 1], y : Y(ALL[n - 1]), cls : "is-head", word : "the official basket" } ];
        const yl = yoursSeries[n - 1];
        if (yl !== null) labs.push({ v : yl, y : Y(yl), cls : "is-you", word : "your basket" });
        if (labs.length === 2 && Math.abs(labs[0].y - labs[1].y) < 13) {
            const mid = (labs[0].y + labs[1].y) / 2;
            const [ up, dn ] = labs[0].y <= labs[1].y ? [ labs[0], labs[1] ] : [ labs[1], labs[0] ];
            up.y = mid - 6.5; dn.y = mid + 6.5;
        }
        return { w, h, narrow, padL, padR, padT, padB, X, Y, line, labs };
    }, [ tsW, yoursSeries ]);

    let before = 0;
    const segs = vals.map((v, i) => { const s = { left : before, w : v }; before += v; return s; });
    const hotLabel = hot !== null ? `${shortName(GROUPS[hot].label)} · ₹${vals[hot].toFixed(0)} of 100` : "";
    const hotCentre = hot !== null ? segs[hot].left + segs[hot].w / 2 : 0;

    return (
        <div className="basket">
            <div className="basket-out">
                <div className="basket-read">
                    <div className="basket-num is-you"><span className="basket-lbl">{`your basket, ${when}`}</span><strong className="basket-big">{mine === null ? "—" : rs(mine)}</strong></div>
                    <div className="basket-num is-head"><span className="basket-lbl">{`the official basket, ${when}`}</span><strong className="basket-big">{rs(official)}</strong></div>
                </div>
                <div className="basket-ts" ref={tsRef}>
                    <svg className={`basket-ts-svg ${ts.narrow ? "narrow" : ""}`} viewBox={`0 0 ${ts.w} ${ts.h}`} style={{ height : ts.h }} aria-hidden="true">
                        <line className="basket-ts-base" x1={ts.padL} x2={ts.w - ts.padR} y1={ts.Y(100)} y2={ts.Y(100)} />
                        {yoursSeries[0] !== null && <polyline className="basket-ts-you" points={ts.line(yoursSeries)} />}
                        <polyline className="basket-ts-head" points={ts.line(ALL)} />
                        {ts.labs.map(l => (
                            <text key={l.word} className={`basket-ts-lab ${l.cls}`} x={ts.w - ts.padR + 8} y={Math.max(ts.padT + 4, Math.min(ts.h - ts.padB, l.y + 3.5))}>
                                {`${rs(l.v)} ${l.word}`}
                            </text>
                        ))}
                        <text className="basket-ts-tick" x={ts.padL} y={ts.h - 6}>{shortMonth(MONTHS[0])}</text>
                        <text className="basket-ts-tick" x={ts.w - ts.padR} y={ts.h - 6} textAnchor="end">{shortMonth(MONTHS[MONTHS.length - 1])}</text>
                    </svg>
                </div>
                <p className="basket-phrase" aria-live="polite">{phrase}</p>
                <div className="basket-btns">
                    <Button kind={untouched ? "primary" : "secondary"} size="small" disabled={untouched} onClick={reset}>The official basket</Button>
                    <Button kind={atZero ? "primary" : "secondary"} size="small" disabled={atZero} onClick={zero}>Start from zero</Button>
                </div>
                <div className="basket-barwrap">
                    <span className={`basket-hotlab ${hot !== null ? "show" : ""}`} aria-hidden="true" style={{ left : `${Math.max(12, Math.min(88, hotCentre))}%` }}>{hotLabel}</span>
                    <div className="basket-bar" aria-hidden="true">
                        {segs.map((s, i) => <span key={GROUPS[i].code} className={`basket-seg major-${GROUPS[i].major} ${hot === i ? "hot" : ""}`} style={{ flexBasis : `${s.w.toFixed(2)}%`, borderLeft : s.w < 0.05 ? "none" : undefined }} />)}
                        <span className="basket-seg basket-unspent" style={{ flexBasis : `${Math.max(0, 100 - sw).toFixed(2)}%`, borderLeft : sw > 99.95 ? "none" : undefined }} />
                    </div>
                </div>
            </div>
            <div className="basket-rows">
                {MAJORS.map((m, mi) => (
                    <div key={m.code} className="basket-major">
                        <div className="basket-major-name"><i className={`key-dot major-${mi}`} />{MAJOR_PLAIN[mi]}</div>
                        {GROUPS.map((g, i) => g.major === mi && (
                            <div key={g.code} className="basket-row">
                                <span className="basket-name">{shortName(g.label)}<span className="basket-rate">{rs(g.now)}</span></span>
                                <input
                                    type="range" min={0} max={100} step={0.05} value={vals[i]} className="basket-slider" style={{ "--p" : `${vals[i]}%`, touchAction : "pan-y" } as React.CSSProperties}
                                    aria-label={`Your share of ₹100 on ${shortName(g.label)}`}
                                    onChange={e => { light(i); move(i, +e.target.value); }}
                                    onPointerDown={() => light(i)} onPointerUp={fade} onBlur={fade}
                                />
                                <span className="basket-val">₹{vals[i].toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
