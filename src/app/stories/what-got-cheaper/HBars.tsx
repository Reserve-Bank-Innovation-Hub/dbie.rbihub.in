"use client";

// REACT CORE ==========================================================================================================
import { useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { ChartTip, EASE, hBarPath } from "./chartKit";
import { useSize } from "./useSize";

// A row of horizontal bars, one a label, grown from the baseline when the chart scrolls into view. `diverging` puts
// zero down the middle so falls run left and rises run right. The value sits at each bar's tip; hovering a row lifts
// it and shows its tip lines.
export interface HBarRow {
    key    : string;
    label  : string;
    value  : number;
    note ? : string;                                         // text at the right edge
    kind ? : "accent" | "fall" | "rise" | "muted" | "money" | "second" | "third" | "total";
    tip ?  : string[];
}

interface HBarsProps {
    rows          : HBarRow[];
    format        : (v : number) => string;
    max ?         : number;
    diverging ?   : boolean;
    rowHeight ?   : number;
    labelWidth ?  : number;
    noteWidth ?   : number;
    ariaLabel     : string;
}

export const HBars = ({ rows, format, max, diverging = false, rowHeight = 28, labelWidth = 150, noteWidth = 0, ariaLabel } : HBarsProps) => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hover, setHover ] = useState<number | null>(null);
    const narrow = width < 520;
    const lw = narrow ? Math.min(labelWidth, 116) : labelWidth;
    const nw = narrow ? 0 : noteWidth;
    const top = max ?? Math.max(...rows.map(r => Math.abs(r.value)), 1e-9);
    const valueRoom = Math.max(...rows.map(r => format(r.value).length)) * 7.4 + 14;
    const plot = Math.max(0, width - lw - nw - valueRoom - (diverging ? valueRoom : 0));
    const zero = lw + (diverging ? valueRoom + plot / 2 : 0);
    const scale = (diverging ? plot / 2 : plot) / top;
    const barH = Math.min(18, rowHeight - 8);
    const height = rowHeight * rows.length + 6;

    return (
        <div className="hbars-wrap" ref={ref} onPointerLeave={() => setHover(null)}>
            {!!width && (
                <motion.svg
                    className="hbars" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.25 }}
                >
                    {diverging && <line className="zero-line" x1={zero} x2={zero} y1={0} y2={height} />}
                    {rows.map((r, i) => {
                        const y = 3 + i * rowHeight;
                        const len = Math.abs(r.value) * scale;
                        const dir = r.value < 0 ? -1 : 1;
                        const kind = r.kind ?? (r.value < 0 ? "fall" : "accent");
                        const dim = hover !== null && hover !== i;
                        return (
                            <g key={r.key} className={`hbar-row kind-${kind} ${dim ? "is-dim" : ""}`} onPointerEnter={() => setHover(i)}>
                                <rect className="row-hit" x={0} y={y} width={width} height={rowHeight} />
                                <text className="row-label" x={lw - 10} y={y + rowHeight / 2 + 4} textAnchor="end">{r.label}</text>
                                <motion.path
                                    className="bar" d={hBarPath(zero, y + (rowHeight - barH) / 2, len, barH, dir as 1 | -1)}
                                    style={{ transformBox : "fill-box", transformOrigin : dir === 1 ? "0% 50%" : "100% 50%" }}
                                    variants={{ hidden : { scaleX : 0 }, shown : { scaleX : 1, transition : { duration : 0.9, ease : EASE, delay : i * 0.045 } } }}
                                />
                                <motion.text
                                    className="bar-value" x={zero + dir * (len + 6)} y={y + rowHeight / 2 + 4} textAnchor={dir === 1 ? "start" : "end"}
                                    variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.4, delay : 0.5 + i * 0.045 } } }}
                                >
                                    {format(r.value)}
                                </motion.text>
                                {r.note && !narrow && <text className="row-note" x={width} y={y + rowHeight / 2 + 4} textAnchor="end">{r.note}</text>}
                            </g>
                        );
                    })}
                </motion.svg>
            )}
            {hover !== null && rows[hover] && (
                <ChartTip
                    x={zero} y={3 + hover * rowHeight + rowHeight + 4} width={width}
                    head={`${rows[hover].label}: ${format(rows[hover].value)}`} lines={rows[hover].tip ?? (rows[hover].note ? [ rows[hover].note! ] : [])}
                />
            )}
        </div>
    );
};
