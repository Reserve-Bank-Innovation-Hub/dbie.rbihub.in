"use client";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE, hBarPath } from "./chartKit";
import { SAVE_BORROW, croreN } from "./data";
import { useSize } from "./useSize";

// Deposit accounts against loan accounts, by population group, on one scale: two bars a group, grown in on view.
const ROW = 60;

export const SaveBorrowChart = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const narrow = width < 520;
    const lw = narrow ? 88 : 120, noteW = narrow ? 0 : 104;
    const plot = Math.max(0, width - lw - noteW - 86);
    const top = Math.max(...SAVE_BORROW.rows.map(r => r.depositAccounts));
    const scale = plot / top;
    const height = ROW * SAVE_BORROW.rows.length + 30;

    return (
        <div className="save-borrow-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="save-borrow" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
                    role="img" aria-label={`Deposit accounts and loans in villages, small towns, cities and big cities, March ${SAVE_BORROW.year}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                >
                    <g className="legend">
                        <rect className="bar-deposit" x={lw} y={4} width={12} height={10} rx={2} />
                        <text className="legend-label" x={lw + 18} y={13}>deposit accounts</text>
                        <rect className="bar-credit" x={lw + 142} y={4} width={12} height={10} rx={2} />
                        <text className="legend-label" x={lw + 160} y={13}>loans</text>
                    </g>
                    {SAVE_BORROW.rows.map((r, i) => {
                        const y = 30 + i * ROW;
                        return (
                            <g key={r.label}>
                                <text className="row-label" x={lw - 10} y={y + 25} textAnchor="end">{r.label}</text>
                                <motion.path
                                    className="bar-deposit" d={hBarPath(lw, y + 6, r.depositAccounts * scale, 16)}
                                    style={{ transformBox : "fill-box", transformOrigin : "0% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 1, ease : EASE, delay : i * 0.08 } } }}
                                />
                                <text className="bar-value" x={lw + r.depositAccounts * scale + 6} y={y + 18}>{croreN(r.depositAccounts)} crore</text>
                                <motion.path
                                    className="bar-credit" d={hBarPath(lw, y + 26, r.creditAccounts * scale, 16)}
                                    style={{ transformBox : "fill-box", transformOrigin : "0% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 1, ease : EASE, delay : 0.35 + i * 0.08 } } }}
                                />
                                <text className="bar-value" x={lw + r.creditAccounts * scale + 6} y={y + 38}>{croreN(r.creditAccounts)} crore</text>
                                {!narrow && <text className="row-note" x={width} y={y + 30} textAnchor="end">{Math.round(r.ratio)} to each loan</text>}
                            </g>
                        );
                    })}
                </motion.svg>
            )}
        </div>
    );
};
