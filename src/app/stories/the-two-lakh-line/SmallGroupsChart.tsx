"use client";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE } from "./chartKit";
import { WHERE_THEY_WENT, croreN } from "./data";
import { useSize } from "./useSize";

// Where the accounts below the line went between the peak and the latest quarter. Each row is a dumbbell: the
// peak's hollow ring stays put and the latest dot slides away from it as the chart comes into view, trailing the
// change. Population groups first, then the kinds of loan that moved most.
export const SmallGroupsChart = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const narrow = width < 560;
    const ROW = narrow ? 48 : 34;
    const lw = narrow ? 8 : 226, noteW = narrow ? 8 : 214;
    const plot = Math.max(0, width - lw - noteW - 14);
    const rows = [
        ...WHERE_THEY_WENT.groups.map(g => ({ ...g, section : false })),
        { key : "of-which", label : "of which", then : 0, now : 0, section : true },
        ...WHERE_THEY_WENT.purposes.map(p => ({ ...p, section : false })),
    ];
    const top = Math.max(...rows.map(r => Math.max(r.then, r.now)));
    const x = (v : number) => lw + 7 + (v / top) * plot;
    const height = ROW * rows.length + 34;
    const thenKey = `${WHERE_THEY_WENT.from}, the high point`;

    return (
        <div className="groups-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="groups-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
                    role="img" aria-label={`Small loans of ₹2 lakh or less at the high point, ${WHERE_THEY_WENT.from}, and in ${WHERE_THEY_WENT.to}, by place and kind of loan`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                >
                    <g className="legend">
                        <circle className="dot-then" cx={lw + 12} cy={10} r={5} />
                        <text className="legend-label" x={lw + 22} y={14}>{thenKey}</text>
                        <circle className="dot-now" cx={lw + 22 + thenKey.length * 7 + 22} cy={10} r={5} />
                        <text className="legend-label" x={lw + 22 + thenKey.length * 7 + 32} y={14}>{WHERE_THEY_WENT.to}</text>
                    </g>
                    {rows.map((r, i) => {
                        const y = 34 + i * ROW + (narrow ? ROW - 12 : ROW / 2);
                        const ty = narrow ? y - 20 : y + 4;
                        if (r.section) return <text key={r.key} className="section-label" x={narrow ? lw : lw - 10} y={narrow ? y : ty} textAnchor={narrow ? "start" : "end"}>{r.label}</text>;
                        const d = r.now - r.then;
                        const delay = 0.2 + i * 0.08;
                        return (
                            <g key={r.key} className={`dumbbell ${d < 0 ? "fell" : "rose"}`}>
                                <text className="row-label" x={narrow ? lw : lw - 10} y={ty} textAnchor={narrow ? "start" : "end"}>{r.label}</text>
                                <motion.line
                                    className="link" y1={y} y2={y}
                                    variants={{ hidden : { x1 : x(r.then), x2 : x(r.then) }, shown : { x1 : x(r.then), x2 : x(r.now), transition : { duration : 1.1, ease : EASE, delay } } }}
                                />
                                <circle className="dot-then" cx={x(r.then)} cy={y} r={5} />
                                <motion.circle
                                    className="dot-now" cy={y} r={5}
                                    variants={{ hidden : { cx : x(r.then) }, shown : { cx : x(r.now), transition : { duration : 1.1, ease : EASE, delay } } }}
                                />
                                <motion.text
                                    className="row-note" x={width - (narrow ? 8 : 0)} y={ty} textAnchor="end"
                                    variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.5, delay : delay + 0.6 } } }}
                                >
                                    {croreN(r.then)} → {croreN(r.now)} crore ({d < 0 ? "−" : "+"}{croreN(Math.abs(d))})
                                </motion.text>
                            </g>
                        );
                    })}
                </motion.svg>
            )}
        </div>
    );
};
