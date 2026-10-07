"use client";

// The fan: the goods the story follows, each a line from April 2011 to the latest month on a log scale, with the basket
// as a whole in ink, and a name and a value at every line's end. The lines are drawn on as the figure scrolls into
// view; hovering a line or its name lifts it and dims the rest.

// REACT CORE ==========================================================================================================
import { useMemo, useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ALL, FOLLOWED, HEADLINE, MONTHS, followedNamed, monthName, rs, shortMonth } from "./data";
import { EASE } from "./chartKit";
import { useSize } from "./useSize";

interface FanChartProps {
    names      : string[];          // the followed items to draw, by the story's names
    ariaLabel  : string;
    height ?   : number;
}

const TICKS = [ 50, 75, 100, 150, 200, 300, 400, 600 ];

// Labels pushed apart to a minimum gap, in value order, and pushed back inside the plot.
const dodge = (ys : number[], gap : number, top : number, bottom : number) => {
    const order = [ ...ys.keys() ].sort((a, b) => ys[a] - ys[b]);
    const out = [ ...ys ];
    let prev = -Infinity;
    for (const i of order) { out[i] = Math.max(out[i], prev + gap, top); prev = out[i]; }
    let next = bottom;
    for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; out[i] = Math.min(out[i], next); next = out[i] - gap; }
    return out;
};

export const FanChart = ({ names, ariaLabel, height } : FanChartProps) => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hover, setHover ] = useState<string | null>(null);
    const narrow = width < 560;
    const H = height ?? (narrow ? 420 : 520);
    const padL = narrow ? 40 : 48, padR = narrow ? 128 : 190, padT = 16, padB = 28;
    const plotW = Math.max(0, width - padL - padR), plotH = H - padT - padB;

    const series = useMemo(() => names.map(n => followedNamed(n)), [ names ]);
    const lo = Math.min(40, ...series.map(s => Math.min(...s.series.filter(v => v > 0)))), hi = Math.max(220, ...series.map(s => Math.max(...s.series)));
    const yOf = (v : number) => padT + (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * plotH;
    const xOf = (k : number) => padL + (k / (MONTHS.length - 1)) * plotW;
    const path = (vals : number[]) => {
        let d = "", pen = false;
        vals.forEach((v, k) => { if (v > 0) { d += `${pen ? "L" : "M"}${xOf(k).toFixed(1)} ${yOf(v).toFixed(1)} `; pen = true; } else pen = false; });
        return d;
    };
    const ends = series.map(s => { const v = [ ...s.series ].reverse().find(x => x > 0) ?? 100; return yOf(v); });
    const allEnd = yOf(ALL[ALL.length - 1]);
    const labelYs = dodge([ ...ends, allEnd ], narrow ? 13 : 15, padT + 16, padT + plotH - 2);
    const yearTicks = MONTHS.map((m, k) => ({ m, k })).filter(({ m }) => m.endsWith("-04") && +m.slice(0, 4) % (narrow ? 4 : 2) === 0);
    const on = (name : string) => hover === null || hover === name;

    return (
        <div className="fan-wrap" ref={ref} onPointerLeave={() => setHover(null)}>
            {!!width && (
                <>
                    <motion.svg
                        className="fan-chart" width="100%" height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={ariaLabel}
                        initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                    >
                        {TICKS.filter(t => t >= lo && t <= hi).map(t => (
                            <g key={t}>
                                <line className={`grid ${t === 100 ? "is-base" : ""}`} x1={padL} x2={padL + plotW} y1={yOf(t)} y2={yOf(t)} />
                                <text className="tick" x={padL - 6} y={yOf(t) + 4} textAnchor="end">₹{t}</text>
                            </g>
                        ))}
                        {yearTicks.map(({ m, k }) => (
                            <text key={m} className="tick" x={xOf(k)} y={H - 8} textAnchor={k === 0 ? "start" : "middle"}>{m.slice(0, 4)}</text>
                        ))}
                        <motion.path
                            className={`fan-all ${on("all") ? "" : "is-dim"}`} d={path(ALL)} pathLength={1}
                            variants={{ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.6, ease : EASE } } }}
                            onPointerEnter={() => setHover("all")}
                        />
                        {series.map((s, i) => (
                            <motion.path
                                key={s.code} className={`fan-line major-${s.major} ${on(s.name) ? "" : "is-dim"} ${hover === s.name ? "is-hot" : ""}`} d={path(s.series)} pathLength={1}
                                variants={{ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.6, ease : EASE, delay : 0.08 + i * 0.05 } } }}
                                onPointerEnter={() => setHover(s.name)}
                            />
                        ))}
                        {series.map((s, i) => (
                            <line key={s.code} className={`fan-leader ${on(s.name) ? "" : "is-dim"}`} x1={padL + plotW} x2={padL + plotW + 8} y1={ends[i]} y2={labelYs[i]} />
                        ))}
                        <line className="fan-leader" x1={padL + plotW} x2={padL + plotW + 8} y1={allEnd} y2={labelYs[labelYs.length - 1]} />
                    </motion.svg>
                    {series.map((s, i) => (
                        <div
                            key={s.code} className={`fan-label major-${s.major} ${on(s.name) ? "" : "is-dim"} ${hover === s.name ? "is-hot" : ""}`}
                            style={{ left : padL + plotW + 10, top : labelYs[i], maxWidth : padR - 12 }}
                            onPointerEnter={() => setHover(s.name)}
                        >
                            <span className="fan-label-name">{s.name}</span>
                            <span className="fan-label-value">{rs([ ...s.series ].reverse().find(x => x > 0) ?? 0)}</span>
                        </div>
                    ))}
                    <div className={`fan-label is-all ${on("all") ? "" : "is-dim"}`} style={{ left : padL + plotW + 10, top : labelYs[labelYs.length - 1], maxWidth : padR - 12 }} onPointerEnter={() => setHover("all")}>
                        <span className="fan-label-name">{narrow ? "All goods" : "The basket as a whole"}</span>
                        <span className="fan-label-value">{rs(ALL[ALL.length - 1])}</span>
                    </div>
                    <div className="fan-label is-head" style={{ left : padL + plotW + 10, top : padT - 6, maxWidth : padR - 12 }} aria-hidden="true">
                        <span className="fan-label-value">{`${shortMonth(HEADLINE.lastMonth)}, provisional`}</span>
                    </div>
                    <div className="fan-note">{`Monthly, ${monthName(MONTHS[0])} to ${monthName(HEADLINE.lastMonth)}; 2011-12 = ₹100; log scale. The end labels are the last month, which the Office has yet to finalise; the prose and the table use the ${HEADLINE.nowFy} average.`}</div>
                </>
            )}
        </div>
    );
};

export const FOLLOWED_NAMES = FOLLOWED.map(f => f.name);
