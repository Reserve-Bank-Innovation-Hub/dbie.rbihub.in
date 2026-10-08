"use client";

// Since 1982: the basket as a whole and its three major groups, yearly averages on a log scale, the four older bases
// linked onto 2011-12 = 100. A crosshair reads any year.

// REACT CORE ==========================================================================================================
import { useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { LONG, MAJOR_PLAIN } from "./data";
import { ChartTip, EASE } from "./chartKit";
import { useSize } from "./useSize";

const KEYS = [ "primary", "fuel", "manufactured" ] as const;
const TICKS = [ 10, 20, 50, 100, 200 ];

export const LongChart = ({ ariaLabel } : { ariaLabel : string }) => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hover, setHover ] = useState<number | null>(null);
    const narrow = width < 560;
    const H = narrow ? 300 : 360;
    const padL = narrow ? 36 : 44, padR = narrow ? 110 : 150, padT = 12, padB = 26;
    const plotW = Math.max(0, width - padL - padR), plotH = H - padT - padB;
    const lo = 8, hi = 220;
    const yOf = (v : number) => padT + (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * plotH;
    const xOf = (k : number) => padL + (k / (LONG.length - 1)) * plotW;
    const path = (key : "all" | typeof KEYS[number]) => LONG.map((l, k) => `${k ? "L" : "M"}${xOf(k).toFixed(1)} ${yOf(l[key]).toFixed(1)}`).join(" ");
    const years = LONG.map((l, k) => ({ l, k })).filter(({ l }) => +l.fy.slice(0, 4) % (narrow ? 10 : 5) === 0);
    const last = LONG[LONG.length - 1];
    const endYs = [ yOf(last.all), ...KEYS.map(k => yOf(last[k])) ];
    // labels pushed apart
    const order = [ ...endYs.keys() ].sort((a, b) => endYs[a] - endYs[b]);
    const labelY = [ ...endYs ];
    let prev = -Infinity;
    for (const i of order) { labelY[i] = Math.max(labelY[i], prev + 15); prev = labelY[i]; }

    const onPointer = (e : React.PointerEvent<HTMLDivElement>) => {
        if (!ref.current || !plotW) return;
        const px = e.clientX - ref.current.getBoundingClientRect().left;
        const k = Math.round(((px - padL) / plotW) * (LONG.length - 1));
        setHover(k >= 0 && k < LONG.length ? k : null);
    };

    return (
        <div className="long-wrap" ref={ref} onPointerMove={onPointer} onPointerLeave={() => setHover(null)}>
            {!!width && (
                <>
                    <motion.svg className="long-chart" width="100%" height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={ariaLabel} initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}>
                        {TICKS.map(t => (
                            <g key={t}>
                                <line className={`grid ${t === 100 ? "is-base" : ""}`} x1={padL} x2={padL + plotW} y1={yOf(t)} y2={yOf(t)} />
                                <text className="tick" x={padL - 6} y={yOf(t) + 4} textAnchor="end">₹{t}</text>
                            </g>
                        ))}
                        {years.map(({ l, k }) => <text key={l.fy} className="tick" x={xOf(k)} y={H - 8} textAnchor="middle">{l.fy.slice(0, 4)}</text>)}
                        {KEYS.map((key, i) => (
                            <motion.path key={key} className={`long-line major-${i}`} d={path(key)} pathLength={1} variants={{ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.8, ease : EASE, delay : 0.1 * i } } }} />
                        ))}
                        <motion.path className="long-all" d={path("all")} pathLength={1} variants={{ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.8, ease : EASE } } }} />
                        {hover !== null && <line className="crosshair" x1={xOf(hover)} x2={xOf(hover)} y1={padT} y2={padT + plotH} />}
                        {hover !== null && [ "all" as const, ...KEYS ].map((key, i) => <circle key={key} className={`long-dot ${key === "all" ? "is-all" : `major-${i - 1}`}`} cx={xOf(hover)} cy={yOf(LONG[hover][key])} r={3.5} />)}
                    </motion.svg>
                    <div className="long-label is-all" style={{ left : padL + plotW + 8, top : labelY[0] }}>The basket as a whole</div>
                    {KEYS.map((key, i) => <div key={key} className={`long-label major-${i}`} style={{ left : padL + plotW + 8, top : labelY[i + 1] }}>{MAJOR_PLAIN[i]}</div>)}
                    {hover !== null && (
                        <ChartTip
                            x={xOf(hover)} y={padT + plotH - 10} width={width} head={LONG[hover].fy}
                            lines={[ `all goods ₹${LONG[hover].all.toFixed(1)}`, ...KEYS.map((k, i) => `${MAJOR_PLAIN[i].toLowerCase()} ₹${LONG[hover][k].toFixed(1)}`) ]}
                        />
                    )}
                </>
            )}
        </div>
    );
};
