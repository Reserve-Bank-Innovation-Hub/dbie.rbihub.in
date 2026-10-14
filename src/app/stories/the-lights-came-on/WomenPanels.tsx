"use client";

// REACT CORE ==========================================================================================================
import { useState, type PointerEvent as RPointerEvent } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE } from "./chartKit";
import { HEADLINE, WOMEN_SERIES, monthName, shortMonth } from "./data";
import { useSize } from "./useSize";

// Two panels on one time axis: women's loan accounts in crore, with their peak marked, and women's share of
// individuals' accounts and of the money lent to individuals, per cent. A crosshair reads both at any quarter.
// The axis is the quarters DBIE publishes, so the gap after March 2014 (no June or September 2014) is one step.
const N = WOMEN_SERIES.length;
const H1 = 150, H2 = 150, GAP = 46, TOP = 26, AXIS = 30;

export const WomenPanels = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ k, setK ] = useState<number | null>(null);
    const padL = 36, padR = 96;
    const W = Math.max(0, width - padL - padR);
    const countMax = Math.ceil(Math.max(...WOMEN_SERIES.map(p => p.accounts)) / 1e7 / 4) * 4;
    const shareMax = Math.ceil(Math.max(...WOMEN_SERIES.map(p => Math.max(p.accountsShare, p.moneyShare))) / 10) * 10;
    const x = (i : number) => padL + (i / (N - 1)) * W;
    const y1 = (v : number) => TOP + H1 - (v / countMax) * H1;
    const top2 = TOP + H1 + GAP;
    const y2 = (v : number) => top2 + H2 - (v / shareMax) * H2;
    const height = top2 + H2 + AXIS;
    const path = (f : (p : typeof WOMEN_SERIES[number]) => number, y : (v : number) => number) => WOMEN_SERIES.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(f(p)).toFixed(1)}`).join(" ");
    const peak = WOMEN_SERIES.findIndex(p => p.key === HEADLINE.women.peak.quarter);
    const last = WOMEN_SERIES[N - 1];
    const ticks = WOMEN_SERIES.map((p, i) => ({ p, i })).filter(({ p }) => p.key.endsWith("-03") && +p.key.slice(0, 4) % (width < 560 ? 4 : 2) === 0);
    const draw = (delay : number) => ({ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.6, ease : EASE, delay } } });
    const fade = (delay : number) => ({ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.6, delay } } });
    const endA = y2(last.accountsShare), endM = y2(last.moneyShare);
    const apart = Math.abs(endA - endM) < 16 ? (16 - Math.abs(endA - endM)) / 2 : 0;

    const onMove = (e : RPointerEvent<SVGSVGElement>) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - padL) / Math.max(1, W)) * (N - 1));
        setK(i >= 0 && i < N ? i : null);
    };

    return (
        <div className="women-panels" ref={ref}>
            {!!width && (
                <motion.svg
                    width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Women's loan accounts, and women's share of individuals' accounts and money, ${monthName(WOMEN_SERIES[0].key)} to ${monthName(last.key)}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                    onPointerMove={onMove} onPointerLeave={() => setK(null)}
                >
                    <text className="panel-title" x={padL} y={TOP - 12}>Women’s loan accounts, crore</text>
                    {Array.from({ length : countMax / 4 }, (_, i) => (i + 1) * 4).map(v => (
                        <g key={v}><line className="grid" x1={padL} x2={padL + W} y1={y1(v)} y2={y1(v)} /><text className="tick" x={padL - 8} y={y1(v) + 4} textAnchor="end">{v}</text></g>
                    ))}
                    <line className="baseline" x1={padL} x2={padL + W} y1={y1(0)} y2={y1(0)} />
                    <motion.path className="line-women" d={path(p => p.accounts / 1e7, y1)} variants={draw(0)} />
                    {peak >= 0 && (
                        <motion.g variants={fade(1.2)}>
                            <line className="mark-line" x1={x(peak)} x2={x(peak)} y1={TOP} y2={y2(0)} />
                            <circle className="dot-women" cx={x(peak)} cy={y1(WOMEN_SERIES[peak].accounts / 1e7)} r={4} />
                            <text className="end-label" x={x(peak) - 8} y={y1(WOMEN_SERIES[peak].accounts / 1e7) + 20} textAnchor="end">peak, {shortMonth(WOMEN_SERIES[peak].key)}, {(WOMEN_SERIES[peak].accounts / 1e7).toFixed(1)}</text>
                        </motion.g>
                    )}
                    <motion.g variants={fade(1.2)}>
                        <circle className="dot-women" cx={x(N - 1)} cy={y1(last.accounts / 1e7)} r={4} />
                        <text className="end-label" x={x(N - 1) + 8} y={y1(last.accounts / 1e7) + 4}>{(last.accounts / 1e7).toFixed(1)}</text>
                    </motion.g>

                    <text className="panel-title" x={padL} y={top2 - 12}>Women’s share of individuals’ loans, per cent</text>
                    {Array.from({ length : shareMax / 10 }, (_, i) => (i + 1) * 10).map(v => (
                        <g key={v}><line className="grid" x1={padL} x2={padL + W} y1={y2(v)} y2={y2(v)} /><text className="tick" x={padL - 8} y={y2(v) + 4} textAnchor="end">{v}</text></g>
                    ))}
                    <line className="baseline" x1={padL} x2={padL + W} y1={y2(0)} y2={y2(0)} />
                    <motion.path className="line-acc-share" d={path(p => p.accountsShare, y2)} variants={draw(0.2)} />
                    <motion.path className="line-money-share" d={path(p => p.moneyShare, y2)} variants={draw(0.35)} />
                    <motion.g variants={fade(1.3)}>
                        {/* the quarter the end labels are for, as the prose quotes March */}
                        <text className="end-label" x={x(N - 1) + 8} y={Math.min(endA, endM) - apart - 12}>{shortMonth(last.key)}</text>
                        <text className="end-label end-acc" x={x(N - 1) + 8} y={endA + 4 - (endA <= endM ? apart : -apart)}>accounts {last.accountsShare.toFixed(1)}</text>
                        <text className="end-label end-money" x={x(N - 1) + 8} y={endM + 4 + (endA <= endM ? apart : -apart)}>money {last.moneyShare.toFixed(1)}</text>
                    </motion.g>

                    {ticks.map(({ p, i }) => <text key={p.key} className="tick" x={x(i)} y={height - 8} textAnchor="middle">{width < 560 ? `’${p.key.slice(2, 4)}` : p.key.slice(0, 4)}</text>)}

                    {k !== null && (
                        <g className="crosshair">
                            <line x1={x(k)} x2={x(k)} y1={TOP - 4} y2={y2(0)} />
                            <circle className="dot-women" cx={x(k)} cy={y1(WOMEN_SERIES[k].accounts / 1e7)} r={4.5} />
                            <circle className="dot-acc-share" cx={x(k)} cy={y2(WOMEN_SERIES[k].accountsShare)} r={4.5} />
                            <circle className="dot-money-share" cx={x(k)} cy={y2(WOMEN_SERIES[k].moneyShare)} r={4.5} />
                        </g>
                    )}
                </motion.svg>
            )}
            {k !== null && (
                <ChartTip
                    x={x(k)} y={TOP + 8} width={width} head={monthName(WOMEN_SERIES[k].key)}
                    lines={[
                        `${(WOMEN_SERIES[k].accounts / 1e7).toFixed(2)} crore accounts held by women`,
                        `${WOMEN_SERIES[k].accountsShare.toFixed(1)}% of individuals’ accounts`,
                        `${WOMEN_SERIES[k].moneyShare.toFixed(1)}% of the money lent to individuals`,
                    ]}
                />
            )}
        </div>
    );
};
