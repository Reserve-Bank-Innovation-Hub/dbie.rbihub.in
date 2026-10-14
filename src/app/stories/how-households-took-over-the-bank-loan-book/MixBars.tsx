"use client";

// REACT CORE ==========================================================================================================
import { useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE } from "./chartKit";
import { FROM, OCC_LABELS, PERSONAL_LABELS, TO, mixOf, yearOf, type OccKey, type PersonalKey } from "./data";
import { useSize } from "./useSize";

// Individuals' ₹100 by occupation in March 2015 and the latest March: two bars of the same length, the six kinds of
// personal loan first in shades of the indivara, then the occupations in the warm greys. A segment wide enough
// carries its value; the legend under the bars names every segment, and hovering either names it in both bars.
const BAR = 34, GAP = 34, TOP = 22;
const ROWS = [ FROM, TO ].map(q => ({ year : yearOf(q.quarter), mix : mixOf(q) }));
const labelOf = (key : string, personal : boolean) => personal ? PERSONAL_LABELS[key as PersonalKey] : OCC_LABELS[key as OccKey];

export const MixBars = () => {
    const { ref, width } = useSize<HTMLDivElement>();
    const [ hover, setHover ] = useState<string | null>(null);
    const padL = 44;
    const W = Math.max(0, width - padL);
    const height = TOP + ROWS.length * BAR + (ROWS.length - 1) * GAP + 6;

    return (
        <div className="mix-wrap" ref={ref}>
            {!!width && (
                <motion.svg
                    className="mix-chart" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`What individuals' bank loans are for, ₹ of every ₹100, March ${ROWS[0].year} and March ${ROWS[1].year}`}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.4 }}
                >
                    <text className="section-label" x={padL} y={12}>personal loans</text>
                    {ROWS.map((r, i) => {
                        const y = TOP + i * (BAR + GAP);
                        let at = padL;
                        return (
                            <g key={r.year}>
                                <text className="row-label" x={0} y={y + BAR / 2 + 4}>{r.year}</text>
                                {r.mix.map((s, j) => {
                                    const w = (s.value / 100) * W, x0 = at;
                                    at += w;
                                    return (
                                        <motion.g
                                            key={s.key} className={`seg seg-${s.key} ${hover && hover !== s.key ? "is-dim" : ""}`}
                                            variants={{ hidden : { opacity : 0 }, shown : { opacity : 1, transition : { duration : 0.5, ease : EASE, delay : 0.04 * j + 0.2 * i } } }}
                                            onPointerEnter={() => setHover(s.key)} onPointerLeave={() => setHover(null)}
                                        >
                                            <rect x={x0} y={y} width={Math.max(0, w - 1)} height={BAR}><title>{`${labelOf(s.key, s.personal)}, March ${r.year}: ₹${s.value.toFixed(1)} of every ₹100`}</title></rect>
                                            {w > 34 && <text className="seg-value" x={x0 + 6} y={y + BAR / 2 + 4}>{s.value.toFixed(1)}</text>}
                                        </motion.g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </motion.svg>
            )}
            <ul className="mix-legend">
                {ROWS[1].mix.map(s => (
                    <li key={s.key} className={hover && hover !== s.key ? "is-dim" : ""} onPointerEnter={() => setHover(s.key)} onPointerLeave={() => setHover(null)}>
                        <i className={`swatch seg-${s.key}`} />{labelOf(s.key, s.personal)}
                    </li>
                ))}
            </ul>
        </div>
    );
};
