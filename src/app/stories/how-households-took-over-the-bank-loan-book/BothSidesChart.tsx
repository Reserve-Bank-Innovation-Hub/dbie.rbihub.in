"use client";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE, hBarPath } from "./chartKit";
import { BOTH_SIDES, FROM, TO, yearOf } from "./data";
import { useSize } from "./useSize";

// Rupees lent to private companies and to individuals, March 2015 against the latest March, both in the latest
// March's rupees: one row for each, the earlier year's bar above the later one, on one linear scale from zero.
const BAR = 22, INNER = 6, ROW_GAP = 30, TOP = 8, LABEL = 22;

export const BothSidesChart = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const padL = 0, padR = 128;
    const W = Math.max(0, width - padL - padR);
    const max = Math.max(...BOTH_SIDES.flatMap(r => [ r.thenReal, r.nowReal ]));
    const len = (v : number) => (v / max) * W;
    const rowH = LABEL + BAR * 2 + INNER;
    const height = TOP + BOTH_SIDES.length * rowH + (BOTH_SIDES.length - 1) * ROW_GAP + 4;
    const fmt = (v : number) => `₹${(v / 1e5).toFixed(1)} lakh crore`;

    return (
        <div className="both-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="both-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Bank credit to private companies and to individuals, March ${yearOf(FROM.quarter)} and March ${yearOf(TO.quarter)}, in March ${yearOf(TO.quarter)} rupees`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.4 }}
                >
                    {BOTH_SIDES.map((r, i) => {
                        const y0 = TOP + i * (rowH + ROW_GAP);
                        const bars = [
                            { when : yearOf(FROM.quarter), v : r.thenReal, cls : "bar-then" },
                            { when : yearOf(TO.quarter), v : r.nowReal, cls : `bar-now is-${r.key}` },
                        ];
                        return (
                            <g key={r.key}>
                                <text className="row-label" x={padL} y={y0 + 14}>{r.label}</text>
                                {bars.map((b, j) => {
                                    const y = y0 + LABEL + j * (BAR + INNER);
                                    return (
                                        <g key={b.when}>
                                            <motion.path
                                                className={b.cls} d={hBarPath(padL, y, len(b.v), BAR)}
                                                style={{ transformOrigin : `${padL}px ${y}px` }}
                                                variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 1.1, ease : EASE, delay : 0.15 * (2 * i + j) } } }}
                                            />
                                            <text className="bar-value" x={padL + len(b.v) + 8} y={y + BAR / 2 + 4}>{fmt(b.v)}</text>
                                            {len(b.v) > 52 && <text className={`bar-year ${j ? "on-bar" : ""}`} x={padL + 8} y={y + BAR / 2 + 4}>{b.when}</text>}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </motion.svg>
            )}
        </div>
    );
};
