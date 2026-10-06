"use client";

// REACT CORE ==========================================================================================================
import { useState, type PointerEvent as RPointerEvent } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE } from "./chartKit";
import { DISTRICT_SHARES, pct } from "./data";
import { useSize } from "./useSize";

// Every district, largest first, on one axis of rank, in two panels: above, the running share of all bank credit
// the districts up to that rank hold; below, each district's own share as a thin bar. Both sweep in from the left.
const H1 = 190, H2 = 86, GAP = 40, TOP = 26, AXIS = 26;

export const DistrictsChart = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ k, setK ] = useState<number | null>(null);
    const rows = DISTRICT_SHARES.shares;
    const n = rows.length;
    const padL = 40, padR = 14;
    const W = Math.max(0, width - padL - padR);
    const x = (i : number) => padL + (i / (n - 1)) * W;
    const y1 = (v : number) => TOP + H1 - (v / 100) * H1;
    const top2 = TOP + H1 + GAP;
    const maxShare = rows[0].outstandingShare;
    const y2 = (v : number) => top2 + H2 - (v / maxShare) * H2;
    const height = top2 + H2 + AXIS;
    const tailStart = n - DISTRICT_SHARES.tail.count;
    const tenth = 9;

    const curve = rows.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y1(d.cumulative).toFixed(1)}`).join(" ");
    const area = `M${x(0)} ${y1(0)} ${curve.replace(/^M/, "L")} L${x(n - 1)} ${y1(0)} Z`;
    const bw = Math.max(0.6, W / n - 0.25);

    const onMove = (e : RPointerEvent<SVGSVGElement>) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - padL) / Math.max(1, W)) * (n - 1));
        setK(i >= 0 && i < n ? i : null);
    };

    return (
        <div className="districts-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="districts-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
                    role="img" aria-label="Districts ranked by bank credit, March 2026: the running total of all credit, and each district's own share"
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                    onPointerMove={onMove} onPointerLeave={() => setK(null)}
                >
                    <defs>
                        <clipPath id="districts-sweep">
                            <motion.rect x={0} y={0} height={height} variants={{ hidden : { width : 0 }, shown : { width, transition : { duration : 1.8, ease : EASE } } }} />
                        </clipPath>
                    </defs>
                    <text className="panel-title" x={padL} y={TOP - 12}>Running total of all bank credit, biggest districts first</text>
                    {[ 25, 50, 75, 100 ].map(v => (
                        <g key={v}><line className="grid" x1={padL} x2={padL + W} y1={y1(v)} y2={y1(v)} /><text className="tick" x={padL - 8} y={y1(v) + 4} textAnchor="end">{v}%</text></g>
                    ))}
                    <line className="baseline" x1={padL} x2={padL + W} y1={y1(0)} y2={y1(0)} />
                    <g clipPath="url(#districts-sweep)">
                        <path className="area-curve" d={area} />
                        <path className="line-curve" d={curve} />
                    </g>
                    <motion.g variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { delay : 1.3, duration : 0.6 } } }}>
                        <circle className="curve-dot" cx={x(tenth)} cy={y1(rows[tenth].cumulative)} r={4.5} />
                        <text className="curve-label" x={x(tenth) + 10} y={y1(rows[tenth].cumulative) + 4}>the top 10: {pct(rows[tenth].cumulative, 0)} of all credit</text>
                        <circle className="curve-dot" cx={x(tailStart - 1)} cy={y1(rows[tailStart - 1].cumulative)} r={4.5} />
                        <text className="curve-label" x={x(tailStart - 1)} y={y1(rows[tailStart - 1].cumulative) + 22} textAnchor="middle">the last {DISTRICT_SHARES.tail.count}: {pct(DISTRICT_SHARES.tail.outstandingShare, 0)}</text>
                    </motion.g>

                    <text className="panel-title" x={padL} y={top2 - 12}>Each district&rsquo;s own share</text>
                    <line className="baseline" x1={padL} x2={padL + W} y1={y2(0)} y2={y2(0)} />
                    <g clipPath="url(#districts-sweep)">
                        {rows.map((d, i) => (
                            <rect key={`${d.state}-${d.district}`} className={i <= tenth ? "bar-top" : "bar-rest"} x={x(i) - bw / 2} y={y2(d.outstandingShare)} width={bw} height={Math.max(0.8, y2(0) - y2(d.outstandingShare))} />
                        ))}
                    </g>
                    {[ 1, 100, 200, 300, 400, 500, 600, 700 ].filter(r => r <= n).map(r => <text key={r} className="tick" x={x(r - 1)} y={height - 8} textAnchor="middle">{r === 1 ? "rank 1" : r}</text>)}
                    {k !== null && (
                        <g className="crosshair">
                            <line x1={x(k)} x2={x(k)} y1={TOP - 4} y2={y2(0)} />
                            <circle className="curve-dot" cx={x(k)} cy={y1(rows[k].cumulative)} r={4.5} />
                        </g>
                    )}
                </motion.svg>
            )}
            {k !== null && (
                <ChartTip
                    x={x(k)} y={TOP + 8} width={width} head={`${k + 1}. ${rows[k].district}, ${rows[k].state}`}
                    lines={[ `${pct(rows[k].outstandingShare, 2)} of all bank credit`, `${pct(rows[k].accountShare, 2)} of all loans`, `the top ${k + 1} together: ${pct(rows[k].cumulative)}` ]}
                />
            )}
        </div>
    );
};
