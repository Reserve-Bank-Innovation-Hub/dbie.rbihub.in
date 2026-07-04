"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { Badge, Div } from "fictoan-react";

// DATA ================================================================================================================
import { DEBT_SERIES, DEBT_EVENTS } from "./data";

// GEOMETRY ============================================================================================================
const PAD = { top : 0, bottom : 44 }; // vertical breathing room; full bleed left/right

const YEAR_MIN = DEBT_SERIES[0].year;
const YEAR_MAX = DEBT_SERIES[DEBT_SERIES.length - 1].year;

// Left scale — external Debt Service Ratio (%);  right scale — govt debt-to-GDP (%)
const DSR_MIN = 0,  DSR_MAX = 40;
const GG_MIN = 60,  GG_MAX = 90;

const clamp = (v : number, lo : number, hi : number) => Math.max(lo, Math.min(hi, v));

// Series values are at consecutive integer years, so a fractional year interpolates linearly.
const valueAt = (year : number, acc : (d : typeof DEBT_SERIES[number]) => number) => {
    const yr = clamp(year, YEAR_MIN, YEAR_MAX);
    const idx = yr - YEAR_MIN;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return acc(DEBT_SERIES[lo]);
    const t = idx - lo;
    return acc(DEBT_SERIES[lo]) * (1 - t) + acc(DEBT_SERIES[hi]) * t;
};

interface DebtChartProps {
    currentYear : number;
}

export const DebtChart = ({ currentYear } : DebtChartProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });

    // Measure the container so the chart works in real pixel space — no viewBox letterboxing.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([ entry ]) => {
            const { width, height } = entry.contentRect;
            setSize({ w : width, h : height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { w, h } = size;

    const xOf = (year : number) => ((clamp(year, YEAR_MIN, YEAR_MAX) - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * w;
    const yOf = (v : number, min : number, max : number) =>
        (h - PAD.bottom) - ((v - min) / (max - min)) * (h - PAD.top - PAD.bottom);
    const yDsr = (v : number) => yOf(v, DSR_MIN, DSR_MAX);
    const yGg = (v : number) => yOf(v, GG_MIN, GG_MAX);

    const { dsrLine, ggLine, dsrArea, ggArea } = useMemo(() => {
        if (!w || !h) return { dsrLine : "", ggLine : "", dsrArea : "", ggArea : "" };

        const line = (acc : (d : typeof DEBT_SERIES[number]) => number) =>
            DEBT_SERIES.map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(d.year).toFixed(2)} ${acc(d).toFixed(2)}`).join(" ");

        // Area = line, then down to the very bottom edge (h) and back — bleeds off the bottom.
        const area = (acc : (d : typeof DEBT_SERIES[number]) => number) =>
            `${line(acc)} L ${xOf(YEAR_MAX).toFixed(2)} ${h} L ${xOf(YEAR_MIN).toFixed(2)} ${h} Z`;

        return {
            dsrLine : line((d) => yDsr(d.dsr)),
            ggLine  : line((d) => yGg(d.ggDebtToGdp)),
            dsrArea : area((d) => yDsr(d.dsr)),
            ggArea  : area((d) => yGg(d.ggDebtToGdp)),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ w, h ]);

    // Everything below reads from the single source of truth: currentYear.
    const px = xOf(currentYear);
    const dsrVal = valueAt(currentYear, (d) => d.dsr);
    const ggVal = valueAt(currentYear, (d) => d.ggDebtToGdp);
    const dsrCy = yDsr(dsrVal);
    const ggCy = yGg(ggVal);
    const labelX = clamp(px, 42, Math.max(42, w - 42));
    const markerX = clamp(px, 28, Math.max(28, w - 28));

    const xTicks = [ 1991, 2000, 2010, 2020, 2025 ];

    return (
        <Div className="debt-chart-wrap" ref={wrapRef}>
            <svg
                id="debt-chart"
                width="100%" height="100%"
                viewBox={`0 0 ${w || 1} ${h || 1}`}
                preserveAspectRatio="none"
                role="img"
                aria-label="India's external debt service ratio and general-government debt-to-GDP, 1991 to 2025"
            >
                <defs>
                    <linearGradient id="dsr-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="grad-dsr-top" />
                        <stop offset="100%" className="grad-dsr-bottom" />
                    </linearGradient>
                    <linearGradient id="gg-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="grad-gg-top" />
                        <stop offset="100%" className="grad-gg-bottom" />
                    </linearGradient>
                    <clipPath id="reveal-clip">
                        <rect x="0" y="0" height={h || 1} width={px} />
                    </clipPath>
                </defs>

                {/* LINES + AREA FILLS (revealed up to the current year) === */}
                <g clipPath="url(#reveal-clip)">
                    <path className="area-gg" d={ggArea} fill="url(#gg-fill)" />
                    <path className="area-dsr" d={dsrArea} fill="url(#dsr-fill)" />
                    <path className="line-gg" d={ggLine} fill="none" />
                    <path className="line-dsr" d={dsrLine} fill="none" />

                    {/* Milestone markers — years that have an event card */}
                    {!!w && DEBT_EVENTS.map((ev) => {
                        const d = DEBT_SERIES.find((s) => s.year === ev.year);
                        if (!d) return null;
                        const ex = xOf(ev.year);
                        return (
                            <g key={ev.year} className="event-marker">
                                <circle className="event-dot-gg" cx={ex} cy={yGg(d.ggDebtToGdp)} r={4} />
                                <circle className="event-dot-dsr" cx={ex} cy={yDsr(d.dsr)} r={4} />
                            </g>
                        );
                    })}
                </g>

                {/* YEAR AXIS LABELS ======================================= */}
                <g className="axis-labels">
                    {!!w && xTicks.map((t) => (
                        <text key={t} x={clamp(xOf(t), 18, w - 18)} y={h - 16} textAnchor="middle">{t}</text>
                    ))}
                </g>

                {/* PLAYHEAD — the current-year edge, dots and marker all share px == xOf(currentYear) */}
                <line className="reveal-edge" x1={px} x2={px} y1={PAD.top - 16} y2={h - PAD.bottom + 8} />

                <circle className="focus-dot-gg" r={7} cx={px} cy={ggCy} />
                <circle className="focus-dot-dsr" r={7} cx={px} cy={dsrCy} />
            </svg>

            {/* Line-value markers — Fictoan Badges floating above each dot */}
            <Badge
                className="value-badge value-badge-dsr"
                size="small" shape="curved"
                style={{ left : labelX, top : dsrCy }}
            >
                {dsrVal.toFixed(1)}%
            </Badge>

            <Badge
                className="value-badge value-badge-gg"
                size="small" shape="curved"
                style={{ left : labelX, top : ggCy }}
            >
                {ggVal.toFixed(0)}%
            </Badge>

            {/* Current-year marker — Fictoan Badge tracking the reveal edge */}
            <Badge
                className="edge-year-badge"
                size="small" shape="curved"
                style={{ left : markerX }}
            >
                {Math.round(currentYear)}
            </Badge>
        </Div>
    );
};
