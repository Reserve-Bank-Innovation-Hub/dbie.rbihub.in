"use client";

// REACT CORE ==========================================================================================================
import { useState, type PointerEvent as RPointerEvent } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE } from "./chartKit";
import { INDEX, TO, monthName, shortMonth } from "./data";
import { useSize } from "./useSize";

// Individuals' loan accounts, the money lent to them, and that money in the latest March's rupees, each indexed to
// March 2015 = 100, every quarter. The latest March is marked, since the multiples in the prose run to it; a
// crosshair reads all three at any quarter.
const N = INDEX.length;
const H = 260, TOP = 18, AXIS = 30;
const SERIES = [
    { key : "money", label : "Money", cls : "line-money" },
    { key : "accounts", label : "Accounts", cls : "line-accounts" },
    { key : "real", label : "After prices", cls : "line-real" },
] as const;

export const IndexLines = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ k, setK ] = useState<number | null>(null);
    const padL = 36, padR = width < 560 ? 104 : 124;
    const W = Math.max(0, width - padL - padR);
    const top = Math.ceil(Math.max(...INDEX.map(p => Math.max(p.accounts, p.money, p.real))) / 100) * 100;
    const x = (i : number) => padL + (i / (N - 1)) * W;
    const y = (v : number) => TOP + H - (v / top) * H;
    const height = TOP + H + AXIS;
    const toIndex = INDEX.findIndex(p => p.key === TO.quarter);
    const line = (key : typeof SERIES[number]["key"]) => INDEX.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
    const grid = Array.from({ length : top / 100 + 1 }, (_, i) => i * 100);
    const ticks = INDEX.map((p, i) => ({ p, i })).filter(({ p }) => p.key.endsWith("-03") && (+p.key.slice(0, 4) - 2015) % (width < 560 ? 4 : 2) === 0);
    // the end labels, spread apart where two lines end close together
    const ends = SERIES.map(s => ({ ...s, v : INDEX[N - 1][s.key], y : y(INDEX[N - 1][s.key]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 16);

    const onMove = (e : RPointerEvent<SVGSVGElement>) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - padL) / Math.max(1, W)) * (N - 1));
        setK(i >= 0 && i < N ? i : null);
    };

    return (
        <div className="index-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="index-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Individuals' loan accounts, money lent and money after prices, indexed to ${monthName(INDEX[0].key)} = 100, to ${monthName(INDEX[N - 1].key)}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                    onPointerMove={onMove} onPointerLeave={() => setK(null)}
                >
                    {grid.map(v => (
                        <g key={v}>
                            <line className={v === 100 ? "base-100" : "grid"} x1={padL} x2={padL + W} y1={y(v)} y2={y(v)} />
                            <text className="tick" x={padL - 8} y={y(v) + 4} textAnchor="end">{v}</text>
                        </g>
                    ))}
                    {toIndex >= 0 && (
                        <g>
                            <line className="mark-line" x1={x(toIndex)} x2={x(toIndex)} y1={TOP} y2={y(0)} />
                            <text className="mark-label" x={x(toIndex) - 6} y={TOP + 10} textAnchor="end">{shortMonth(TO.quarter)}</text>
                        </g>
                    )}
                    {SERIES.map((s, j) => (
                        <motion.path
                            key={s.key} className={s.cls} d={line(s.key)}
                            // the dashed line fades in, since drawing it by pathLength would replace its dashes
                            variants={s.key === "real"
                                ? { hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.8, delay : 0.2 * j + 0.8 } } }
                                : { hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.6, ease : EASE, delay : 0.2 * j } } }}
                        />
                    ))}
                    {toIndex >= 0 && SERIES.map(s => <circle key={s.key} className={`dot-${s.key}`} cx={x(toIndex)} cy={y(INDEX[toIndex][s.key])} r={4} />)}
                    {ends.map(s => (
                        <text key={s.key} className={`end-label end-${s.key}`} x={padL + W + 8} y={s.y + 4}>{s.label} {Math.round(s.v)}</text>
                    ))}
                    {ticks.map(({ p, i }) => <text key={p.key} className="tick" x={x(i)} y={height - 8} textAnchor="middle">{width < 560 ? `’${p.key.slice(2, 4)}` : p.key.slice(0, 4)}</text>)}
                    {k !== null && (
                        <g className="crosshair">
                            <line x1={x(k)} x2={x(k)} y1={TOP} y2={y(0)} />
                            {SERIES.map(s => <circle key={s.key} className={`dot-${s.key}`} cx={x(k)} cy={y(INDEX[k][s.key])} r={4.5} />)}
                        </g>
                    )}
                </motion.svg>
            )}
            {k !== null && (
                <ChartTip
                    x={x(k)} y={TOP} width={width} head={monthName(INDEX[k].key)}
                    lines={SERIES.map(s => `${s.label}: ${Math.round(INDEX[k][s.key])}`)}
                />
            )}
        </div>
    );
};
