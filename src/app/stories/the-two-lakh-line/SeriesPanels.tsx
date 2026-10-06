"use client";

// REACT CORE ==========================================================================================================
import { useState, type PointerEvent as RPointerEvent } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE } from "./chartKit";
import { PEAK_INDEX, SERIES_DOTS, monthName } from "./data";
import { useSize } from "./useSize";

// The quarterly series as two panels on one time axis rather than two scales on one plot: the accounts below the
// line (crore), and their share of all the money lent (₹ of every ₹100). A crosshair reads both at any quarter.
const N = SERIES_DOTS.length;
const H1 = 200, H2 = 96, GAP = 44, TOP = 26, AXIS = 30;
const COUNT_MAX = 30, SHARE_MAX = 10;

export const SeriesPanels = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ k, setK ] = useState<number | null>(null);
    const padL = 36, padR = 18;
    const W = Math.max(0, width - padL - padR);
    const x = (i : number) => padL + (i / (N - 1)) * W;
    const y1 = (v : number) => TOP + H1 - (v / COUNT_MAX) * H1;
    const top2 = TOP + H1 + GAP;
    const y2 = (v : number) => top2 + H2 - (v / SHARE_MAX) * H2;
    const height = top2 + H2 + AXIS;

    const countLine = SERIES_DOTS.map((q, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y1(q.value).toFixed(1)}`).join(" ");
    const countArea = `${countLine} L${x(N - 1)} ${y1(0)} L${x(0)} ${y1(0)} Z`;
    const shareLine = SERIES_DOTS.map((q, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y2(q.share).toFixed(1)}`).join(" ");
    const shareArea = `${shareLine} L${x(N - 1)} ${y2(0)} L${x(0)} ${y2(0)} Z`;
    const ticks = SERIES_DOTS.map((q, i) => ({ q, i })).filter(({ q }) => q.key.endsWith("-03") && +q.key.slice(0, 4) % (width < 560 ? 3 : 2) === 0);

    const onMove = (e : RPointerEvent<SVGSVGElement>) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - padL) / Math.max(1, W)) * (N - 1));
        setK(i >= 0 && i < N ? i : null);
    };
    const draw = (delay : number) => ({ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.6, ease : EASE, delay } } });
    const fade = (delay : number) => ({ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.8, delay } } });

    return (
        <div className="series-panels" ref={ref}>
            {!!width && (
                <motion.svg
                    width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Small loans of ₹2 lakh or less, in crore, and their share of all the money banks lend, ${monthName(SERIES_DOTS[0].quarter)} to ${monthName(SERIES_DOTS[N - 1].quarter)}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                    onPointerMove={onMove} onPointerLeave={() => setK(null)}
                >
                    <text className="panel-title" x={padL} y={TOP - 12}>Small loans, crore</text>
                    {[ 10, 20, 30 ].map(v => (
                        <g key={v}><line className="grid" x1={padL} x2={padL + W} y1={y1(v)} y2={y1(v)} /><text className="tick" x={padL - 8} y={y1(v) + 4} textAnchor="end">{v}</text></g>
                    ))}
                    <line className="baseline" x1={padL} x2={padL + W} y1={y1(0)} y2={y1(0)} />
                    <motion.path className="area-count" d={countArea} variants={fade(0.4)} />
                    <motion.path className="line-count" d={countLine} variants={draw(0)} />

                    <text className="panel-title" x={padL} y={top2 - 12}>Their share of all the money lent, ₹ of every ₹100</text>
                    {[ 5, 10 ].map(v => (
                        <g key={v}><line className="grid" x1={padL} x2={padL + W} y1={y2(v)} y2={y2(v)} /><text className="tick" x={padL - 8} y={y2(v) + 4} textAnchor="end">{v}</text></g>
                    ))}
                    <line className="baseline" x1={padL} x2={padL + W} y1={y2(0)} y2={y2(0)} />
                    <motion.path className="area-share" d={shareArea} variants={fade(0.6)} />
                    <motion.path className="line-share" d={shareLine} variants={draw(0.25)} />

                    <motion.g variants={fade(1.2)}>
                        <circle className="end-dot-count" cx={x(PEAK_INDEX)} cy={y1(SERIES_DOTS[PEAK_INDEX].value)} r={4} />
                        <text className="end-label" x={x(PEAK_INDEX)} y={y1(SERIES_DOTS[PEAK_INDEX].value) - 10} textAnchor="middle">high point {SERIES_DOTS[PEAK_INDEX].value.toFixed(1)}</text>
                        <circle className="end-dot-count" cx={x(N - 1)} cy={y1(SERIES_DOTS[N - 1].value)} r={4} />
                        <text className="end-label" x={x(N - 1)} y={y1(SERIES_DOTS[N - 1].value) + 18} textAnchor="end">{SERIES_DOTS[N - 1].value.toFixed(1)}</text>
                        <circle className="end-dot-share" cx={x(N - 1)} cy={y2(SERIES_DOTS[N - 1].share)} r={4} />
                        <text className="end-label" x={x(N - 1)} y={y2(SERIES_DOTS[N - 1].share) - 10} textAnchor="end">₹{SERIES_DOTS[N - 1].share.toFixed(1)}</text>
                    </motion.g>

                    {ticks.map(({ q, i }) => <text key={q.key} className="tick" x={x(i)} y={height - 8} textAnchor="middle">{width < 560 ? `’${q.key.slice(2, 4)}` : q.quarter}</text>)}

                    {k !== null && (
                        <g className="crosshair">
                            <line x1={x(k)} x2={x(k)} y1={TOP - 4} y2={y2(0)} />
                            <circle className="end-dot-count" cx={x(k)} cy={y1(SERIES_DOTS[k].value)} r={4.5} />
                            <circle className="end-dot-share" cx={x(k)} cy={y2(SERIES_DOTS[k].share)} r={4.5} />
                        </g>
                    )}
                </motion.svg>
            )}
            {k !== null && (
                <ChartTip
                    x={x(k)} y={TOP + 8} width={width} head={SERIES_DOTS[k].quarter}
                    lines={[ `${SERIES_DOTS[k].value.toFixed(1)} crore small loans`, `${SERIES_DOTS[k].borrowers.toFixed(0)} in every 100 loans`, `₹${SERIES_DOTS[k].share.toFixed(1)} of every ₹100 lent` ]}
                />
            )}
        </div>
    );
};
