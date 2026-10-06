"use client";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE, hBarPath } from "./chartKit";
import { Q_LAST, Q_PEAK, SMALL_CARDS, croreN } from "./data";
import { useSize } from "./useSize";

// The small loans at the peak and at the latest quarter, each bar split into credit cards and every other small loan:
// the cards hold or grow while the rest of the bar shrinks. Drawn inside a step card, so it is narrow and labels
// itself; the bars grow out from the left when the card comes into view.
const ROW = 40, BAR = 18, TOP = 26;

export const SmallCardsChart = ({ active } : { active : boolean }) => {
    const { ref, width } = useSize<HTMLDivElement>();
    const rows = [ Q_PEAK, Q_LAST ].map(q => {
        const cards = SMALL_CARDS.find(c => c.key === q.key)?.accounts ?? 0;
        return { key : q.key, label : q.quarter, total : q.total.small, cards, other : q.total.small - cards };
    });
    const lw = 70, endRoom = 84;
    const plot = Math.max(0, width - lw - endRoom);
    const scale = plot / Math.max(...rows.map(r => r.total));
    const height = TOP + ROW * rows.length + 38;
    const delta = (k : "other" | "cards") => rows[1][k] - rows[0][k];
    const signed = (v : number) => `${v < 0 ? "−" : "+"}${croreN(Math.abs(v))} crore`;

    return (
        <div className="cards-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="cards-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Small loans at ${rows[0].label} and ${rows[1].label}, split into credit cards and other small loans`}
                    initial="hidden" animate={active ? "shown" : "hidden"}
                >
                    <g className="legend">
                        <rect className="seg-other" x={lw} y={4} width={12} height={10} rx={2} />
                        <text className="legend-label" x={lw + 18} y={13}>other small loans</text>
                        <rect className="seg-cards" x={lw + 134} y={4} width={12} height={10} rx={2} />
                        <text className="legend-label" x={lw + 152} y={13}>credit cards</text>
                    </g>
                    {rows.map((r, i) => {
                        const y = TOP + i * ROW + (ROW - BAR) / 2;
                        const wOther = r.other * scale, wCards = r.cards * scale;
                        return (
                            <g key={r.key}>
                                <text className="row-label" x={lw - 10} y={y + BAR / 2 + 4} textAnchor="end">{r.label}</text>
                                <motion.path
                                    className="seg-other" d={hBarPath(lw, y, wOther - 1, BAR, 1, 0)}
                                    style={{ transformBox : "fill-box", transformOrigin : "0% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 0.9, ease : EASE, delay : i * 0.15 } } }}
                                />
                                <motion.path
                                    className="seg-cards" d={hBarPath(lw + wOther + 1, y, wCards - 1, BAR, 1)}
                                    style={{ transformBox : "fill-box", transformOrigin : "0% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 0.7, ease : EASE, delay : 0.6 + i * 0.15 } } }}
                                />
                                <motion.g variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.5, delay : 0.9 + i * 0.15 } } }}>
                                    <text className="seg-value on-bar" x={lw + 8} y={y + BAR / 2 + 4}>{croreN(r.other)}</text>
                                    <text className="seg-value on-bar" x={lw + wOther + 8} y={y + BAR / 2 + 4}>{croreN(r.cards)}</text>
                                    <text className="bar-value" x={lw + wOther + wCards + 8} y={y + BAR / 2 + 4}>{croreN(r.total)} crore</text>
                                </motion.g>
                            </g>
                        );
                    })}
                    <motion.g variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.5, delay : 1.4 } } }}>
                        <text className="row-note" x={lw} y={height - 22}>other small loans {signed(delta("other"))}</text>
                        <text className="row-note" x={lw} y={height - 6}>credit cards {signed(delta("cards"))}</text>
                    </motion.g>
                </motion.svg>
            )}
        </div>
    );
};
