"use client";

// REACT CORE ==========================================================================================================
import { useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE, hBarPath } from "./chartKit";
import { BAND_NAMES, BAND_SHORT, BANDS, LINE_INR, bandShares, crore, lakhCrore, pct, rupees } from "./data";
import { useSize } from "./useSize";

// Every loan account stacked by the size of its limit, largest band at the top: accounts to the left of the spine,
// money to the right, the bars growing out from the spine. The ₹2 lakh line is an ink rule across the gap above the
// bands it bounds.
const ROW = 32;
const PAD_TOP = 30, PAD_BOTTOM = 8, GAP = 26;
const MAX_SHARE = 55;

export const PyramidChart = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hover, setHover ] = useState<number | null>(null);
    const narrow = width < 560;
    const spine = narrow ? 92 : 170;
    const half = Math.max(0, (width - spine) / 2);
    const scale = (half - 50) / MAX_SHARE;
    const height = PAD_TOP + ROW * BANDS.length + GAP + PAD_BOTTOM;
    const cx = width / 2;
    const below = (i : number) => BANDS[i].hi !== null && BANDS[i].hi! <= LINE_INR;
    const rows = BANDS.map((b, i) => ({ i, ...bandShares(i), y : PAD_TOP + ROW * (BANDS.length - 1 - i) + (below(i) ? GAP : 0) }));
    const lineRow = rows.find(r => BANDS[r.i].hi === LINE_INR);
    const lineY = lineRow ? lineRow.y - GAP / 2 : 0;
    const barH = 18;

    return (
        <div className="pyramid-wrap" ref={ref} onPointerLeave={() => setHover(null)}>
            {!!width && (
                <motion.svg
                    className="pyramid-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
                    role="img" aria-label="Bank loans and the money lent on them, by size of loan, March 2026"
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.25 }}
                >
                    <text className="axis-title" x={4} y={16}>share of loans</text>
                    <text className="axis-title" x={width - 4} y={16} textAnchor="end">share of the money</text>
                    {rows.map((r, idx) => {
                        const dim = hover !== null && hover !== r.i;
                        const delay = idx * 0.05;
                        return (
                            <g key={r.i} className={`pyramid-row ${dim ? "is-dim" : ""}`} onPointerEnter={() => setHover(r.i)}>
                                <rect className="row-hit" x={0} y={r.y} width={width} height={ROW} />
                                <motion.path
                                    className="bar-accounts" d={hBarPath(cx - spine / 2, r.y + (ROW - barH) / 2, r.accounts * scale, barH, -1)}
                                    style={{ transformBox : "fill-box", transformOrigin : "100% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 0.9, ease : EASE, delay } } }}
                                />
                                <motion.path
                                    className="bar-money" d={hBarPath(cx + spine / 2, r.y + (ROW - barH) / 2, r.outstanding * scale, barH, 1)}
                                    style={{ transformBox : "fill-box", transformOrigin : "0% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 0.9, ease : EASE, delay : delay + 0.15 } } }}
                                />
                                <text className="bar-value" x={cx - spine / 2 - r.accounts * scale - 6} y={r.y + ROW / 2 + 4} textAnchor="end">{r.accounts >= 0.05 ? pct(r.accounts) : "<0.1%"}</text>
                                <text className="bar-value" x={cx + spine / 2 + r.outstanding * scale + 6} y={r.y + ROW / 2 + 4}>{pct(r.outstanding)}</text>
                                <text className="band-label" x={cx} y={r.y + ROW / 2 + 4} textAnchor="middle">{narrow ? BAND_SHORT[r.i] : BAND_NAMES[r.i]}</text>
                            </g>
                        );
                    })}
                    <motion.line
                        className="the-rule" x1={0} x2={width} y1={lineY} y2={lineY}
                        variants={{ hidden : { pathLength : 0 }, shown : { pathLength : 1, transition : { duration : 1.2, ease : EASE, delay : 0.4 } } }}
                    />
                    <text className="rule-label" x={cx} y={lineY + 4} textAnchor="middle">the ₹2 lakh line</text>
                </motion.svg>
            )}
            {hover !== null && (
                <ChartTip
                    x={cx} y={(rows.find(r => r.i === hover)?.y ?? 0) + ROW + 4} width={width}
                    head={`Loans of ${BAND_NAMES[hover]}`}
                    lines={[
                        `${crore(BANDS[hover].accounts)} loans, ${pct(bandShares(hover).accounts)} of all loans`,
                        `${lakhCrore(BANDS[hover].outstanding)} lent, ${pct(bandShares(hover).outstanding)} of all the money`,
                        `about ${rupees(bandShares(hover).averageLoan)} each on average${BANDS[hover].weightedRate !== null ? `, at about ${BANDS[hover].weightedRate!.toFixed(1)}% a year` : ""}`,
                    ]}
                />
            )}
        </div>
    );
};
