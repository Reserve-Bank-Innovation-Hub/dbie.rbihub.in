"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// DATA ================================================================================================================
import { BOOK_MIX } from "./data";

// Chart 9 — where every ₹100 of bank credit sits, March 2015 → March 2026. One stacked bar per
// year; the warm band is personal loans to individuals, nearly doubling from ₹16.5 to ₹30.9 while
// private companies shrink from ₹40 to ₹26.5. Same ₹100 basis as Acts I and III.
const PAD = { top : 16, bottom : 32, left : 44, right : 190 };

const SEGS = [
    { key : "pl"   as const, label : "Personal loans to individuals", colour : "hsl(var(--turmeric))",  opacity : 1 },
    { key : "oi"   as const, label : "Other loans to individuals",    colour : "hsl(var(--turmeric))",  opacity : 0.42 },
    { key : "pc"   as const, label : "Private companies",            colour : "hsl(var(--charcoal))",  opacity : 0.55 },
    { key : "rest" as const, label : "Everyone else",                colour : "hsl(var(--charcoal))",  opacity : 0.22 },
];

export const StackedShare = () => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => {
            setSize({ w : entry.contentRect.width, h : entry.contentRect.height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { w, h } = size;
    const plotW = w - PAD.left - PAD.right;
    const step = plotW / BOOK_MIX.length;
    const barW = step * 0.68;
    const yOf = (v : number) => (h - PAD.bottom) - (v / 100) * (h - PAD.top - PAD.bottom);
    const narrow = w < 700;

    const last = BOOK_MIX[BOOK_MIX.length - 1];

    return (
        <div ref={wrapRef} className="tloc-chart stacked-chart">
            {w > 0 && (
                <svg width={w} height={h}>
                    {/* y gridlines */}
                    {[ 0, 25, 50, 75, 100 ].map((v) => (
                        <g key={v}>
                            <line x1={PAD.left} y1={yOf(v)} x2={w - PAD.right} y2={yOf(v)} className="grid-line" />
                            <text x={PAD.left - 8} y={yOf(v) + 4} textAnchor="end" className="axis-label">₹{v}</text>
                        </g>
                    ))}

                    {BOOK_MIX.map((row, i) => {
                        const x = PAD.left + i * step + (step - barW) / 2;
                        let acc = 0;
                        return (
                            <g key={row.y}>
                                {SEGS.map((s) => {
                                    const v = row[s.key];
                                    const yTop = yOf(acc + v);
                                    const segH = yOf(acc) - yTop;
                                    acc += v;
                                    return (
                                        <rect
                                            key={s.key}
                                            x={x} y={yTop} width={barW} height={Math.max(0.5, segH)}
                                            fill={s.colour} opacity={s.opacity}
                                        />
                                    );
                                })}
                                {(!narrow || i % 2 === 1 || i === 0) && (
                                    <text x={x + barW / 2} y={h - 10} textAnchor="middle" className="axis-label">
                                        {narrow ? `'${String(row.y).slice(2)}` : row.y}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* first-bar values inside the two key bands */}
                    <text
                        x={PAD.left + (step - barW) / 2 + barW / 2} y={yOf(BOOK_MIX[0].pl / 2) + 4}
                        textAnchor="middle" className="bar-value on-warm"
                    >
                        ₹{BOOK_MIX[0].pl.toFixed(1)}
                    </text>
                    <text
                        x={PAD.left + (step - barW) / 2 + barW / 2}
                        y={yOf(BOOK_MIX[0].pl + BOOK_MIX[0].oi + BOOK_MIX[0].pc / 2) + 4}
                        textAnchor="middle" className="bar-value"
                    >
                        ₹{BOOK_MIX[0].pc.toFixed(0)}
                    </text>

                    {/* legend, anchored to the last bar's segments */}
                    {(() => {
                        let acc = 0;
                        const xEnd = PAD.left + (BOOK_MIX.length - 1) * step + (step - barW) / 2 + barW;
                        return SEGS.map((s) => {
                            const v = last[s.key];
                            const yMid = yOf(acc + v / 2);
                            acc += v;
                            return (
                                <g key={s.key}>
                                    <line x1={xEnd + 4} y1={yMid} x2={xEnd + 12} y2={yMid} className="grid-line" />
                                    <text x={xEnd + 16} y={yMid - 3} className="series-label">
                                        ₹{v.toFixed(1)}
                                    </text>
                                    <text x={xEnd + 16} y={yMid + 11} className="legend-label">
                                        {s.label}
                                    </text>
                                </g>
                            );
                        });
                    })()}
                </svg>
            )}
        </div>
    );
};
