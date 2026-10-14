"use client";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE } from "./chartKit";
import { FROM, OCC_LABELS, SLOPE, TO, yearOf } from "./data";
import { useSize } from "./useSize";

// Women's share of the money lent to individuals, by occupation, March 2015 against the latest March: one line per
// occupation between two axes on one linear scale. Occupations under 1% of individuals' credit are in
// "All others" (data.ts, SLOPE). Agriculture, the line the prose names, is drawn in the accent colour.
const H = 250, TOP = 30, BOTTOM = 12;
// shorter names for the labels on a phone
const SHORT : Partial<Record<string, string>> = { services : "Services", transport : "Transport" };

export const WomenSlope = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const labelW = width < 560 ? 112 : 190;
    const xL = 44, xR = Math.max(xL + 60, width - labelW - 52);
    // a linear scale over the values' own range, in steps of 5, so the lines are not crowded at the bottom
    const max = Math.ceil(Math.max(...SLOPE.flatMap(s => [ s.then, s.now ])) / 5) * 5;
    const min = Math.floor(Math.min(...SLOPE.flatMap(s => [ s.then, s.now ])) / 5) * 5;
    const y = (v : number) => TOP + H - ((v - min) / (max - min)) * H;
    const height = TOP + H + BOTTOM;
    // the labels on each side, pushed apart so none overlap
    const spread = (vals : { key : string; y : number }[]) => {
        const out = [ ...vals ].sort((a, b) => a.y - b.y);
        for (let i = 1; i < out.length; i++) out[i].y = Math.max(out[i].y, out[i - 1].y + 15);
        return Object.fromEntries(out.map(o => [ o.key, o.y ]));
    };
    const leftY = spread(SLOPE.map(s => ({ key : s.key, y : y(s.then) })));
    const rightY = spread(SLOPE.map(s => ({ key : s.key, y : y(s.now) })));

    return (
        <div className="slope-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="slope-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Women's share of the money lent to individuals, by occupation, March ${yearOf(FROM.quarter)} and March ${yearOf(TO.quarter)}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.4 }}
                >
                    <text className="axis-title" x={xL} y={12} textAnchor="middle">{yearOf(FROM.quarter)}</text>
                    <text className="axis-title" x={xR} y={12} textAnchor="middle">{yearOf(TO.quarter)}</text>
                    <line className="axis" x1={xL} x2={xL} y1={TOP - 6} y2={TOP + H} />
                    <line className="axis" x1={xR} x2={xR} y1={TOP - 6} y2={TOP + H} />
                    {SLOPE.map((s, i) => (
                        <motion.g
                            key={s.key} className={`slope-row ${s.key === "agriculture" ? "is-accent" : ""}`}
                            variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.6, ease : EASE, delay : 0.06 * i } } }}
                        >
                            <line className="slope-line" x1={xL} x2={xR} y1={y(s.then)} y2={y(s.now)} />
                            <circle className="slope-dot" cx={xL} cy={y(s.then)} r={4} />
                            <circle className="slope-dot" cx={xR} cy={y(s.now)} r={4} />
                            <text className="bar-value" x={xL - 8} y={leftY[s.key] + 4} textAnchor="end">{s.then.toFixed(1)}</text>
                            <text className="bar-value" x={xR + 8} y={rightY[s.key] + 4}>{s.now.toFixed(1)}</text>
                            <text className="row-label" x={xR + 44} y={rightY[s.key] + 4}>{width < 560 ? (SHORT[s.key] ?? OCC_LABELS[s.key]) : OCC_LABELS[s.key]}</text>
                        </motion.g>
                    ))}
                </motion.svg>
            )}
        </div>
    );
};
