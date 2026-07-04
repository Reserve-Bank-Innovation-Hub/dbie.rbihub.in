"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// DATA ================================================================================================================
import { WOMEN_BY_SECTOR, WOMEN_OVERALL_2026 } from "./data";

// Chart 11 — women's share of each sector's individual credit (by value), March 2026, with a
// faint March-2015 ghost tick per bar so the rise itself is visible. Reference line at the
// all-sector average. Individual borrowers only — no gender split exists on corporate credit.
const PAD = { top : 18, bottom : 34, left : 168, right : 56 };
const ROW_H = 42;
const X_MAX = 40;

export const WomenShareBars = () => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [ w, setW ] = useState(0);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => setW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const h = PAD.top + WOMEN_BY_SECTOR.length * ROW_H + PAD.bottom;
    const xOf = (v : number) => PAD.left + (v / X_MAX) * (w - PAD.left - PAD.right);

    return (
        <div ref={wrapRef} className="tloc-chart women-chart" style={{ height : h }}>
            {w > 0 && (
                <svg width={w} height={h}>
                    {/* reference line: overall average */}
                    <line
                        x1={xOf(WOMEN_OVERALL_2026)} y1={PAD.top - 6}
                        x2={xOf(WOMEN_OVERALL_2026)} y2={h - PAD.bottom + 6}
                        className="ref-line" strokeDasharray="5 4"
                    />
                    <text x={xOf(WOMEN_OVERALL_2026)} y={h - 8} textAnchor="middle" className="axis-label">
                        all sectors {WOMEN_OVERALL_2026}%
                    </text>

                    {WOMEN_BY_SECTOR.map((row, i) => {
                        const y = PAD.top + i * ROW_H + ROW_H / 2;
                        return (
                            <g key={row.name}>
                                <text x={PAD.left - 12} y={y + 4} textAnchor="end" className="slope-label">
                                    {row.name}
                                </text>
                                <rect
                                    x={xOf(0)} y={y - 9} width={Math.max(1, xOf(row.y2026) - xOf(0))} height={18}
                                    rx={3} fill="hsl(var(--vermilion))" opacity={0.92}
                                />
                                {/* 2015 ghost */}
                                <line
                                    x1={xOf(row.y2015)} y1={y - 13} x2={xOf(row.y2015)} y2={y + 13}
                                    className="ghost-tick"
                                />
                                <text x={xOf(row.y2026) + 8} y={y + 4} className="series-label">
                                    {row.y2026.toFixed(1)}%
                                </text>
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
};
