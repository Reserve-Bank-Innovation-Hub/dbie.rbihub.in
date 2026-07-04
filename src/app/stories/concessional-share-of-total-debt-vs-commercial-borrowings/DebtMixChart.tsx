"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { Badge } from "fictoan-react";

// DATA ================================================================================================================
import { DEBT_MIX_SERIES, DEBT_MIX_EVENTS } from "./data";

// GEOMETRY ============================================================================================================
const PAD = { top : 56, bottom : 44 };       // vertical breathing room; full bleed left/right

const YEAR_MIN = DEBT_MIX_SERIES[0].year;
const YEAR_MAX = DEBT_MIX_SERIES[DEBT_MIX_SERIES.length - 1].year;

// Left scale — concessional share (%);  right scale — commercial borrowing (₹ lakh crore)
const CONC_MIN = 0,  CONC_MAX = 50;
const COMM_MIN = 0,  COMM_MAX = 26;

const clamp = (v : number, lo : number, hi : number) => Math.max(lo, Math.min(hi, v));

// Commercial borrowing is stored in ₹ crore; plot it in ₹ lakh crore.
const concOf = (d : typeof DEBT_MIX_SERIES[number]) => d.concessionalShare;
const commOf = (d : typeof DEBT_MIX_SERIES[number]) => d.commercialBorrowing / 1e5;

// Series values are at consecutive integer years, so a fractional year interpolates linearly.
const valueAt = (year : number, acc : (d : typeof DEBT_MIX_SERIES[number]) => number) => {
    const yr = clamp(year, YEAR_MIN, YEAR_MAX);
    const idx = yr - YEAR_MIN;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return acc(DEBT_MIX_SERIES[lo]);
    const t = idx - lo;
    return acc(DEBT_MIX_SERIES[lo]) * (1 - t) + acc(DEBT_MIX_SERIES[hi]) * t;
};

interface DebtMixChartProps {
    currentYear : number;
}

export const DebtMixChart = ({ currentYear } : DebtMixChartProps) => {
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
    const yConc = (v : number) => yOf(v, CONC_MIN, CONC_MAX);
    const yComm = (v : number) => yOf(v, COMM_MIN, COMM_MAX);

    const { concLine, commLine, concArea, commArea } = useMemo(() => {
        if (!w || !h) return { concLine : "", commLine : "", concArea : "", commArea : "" };

        const line = (acc : (d : typeof DEBT_MIX_SERIES[number]) => number, y : (v : number) => number) =>
            DEBT_MIX_SERIES.map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(d.year).toFixed(2)} ${y(acc(d)).toFixed(2)}`).join(" ");

        // Area = line, then down to the very bottom edge (h) and back — bleeds off the bottom.
        const area = (acc : (d : typeof DEBT_MIX_SERIES[number]) => number, y : (v : number) => number) =>
            `${line(acc, y)} L ${xOf(YEAR_MAX).toFixed(2)} ${h} L ${xOf(YEAR_MIN).toFixed(2)} ${h} Z`;

        return {
            concLine : line(concOf, yConc),
            commLine : line(commOf, yComm),
            concArea : area(concOf, yConc),
            commArea : area(commOf, yComm),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ w, h ]);

    // Everything below reads from the single source of truth: currentYear.
    const px = xOf(currentYear);
    const concVal = valueAt(currentYear, concOf);
    const commVal = valueAt(currentYear, commOf);   // ₹ lakh crore
    const concCy = yConc(concVal);
    const commCy = yComm(commVal);
    const labelX = clamp(px, 42, Math.max(42, w - 42));
    const markerX = clamp(px, 28, Math.max(28, w - 28));

    const xTicks = [ 1991, 2000, 2010, 2020, 2025 ];

    return (
        <div className="debt-chart-wrap" ref={wrapRef}>
            <svg
                id="debt-chart"
                width="100%" height="100%"
                viewBox={`0 0 ${w || 1} ${h || 1}`}
                preserveAspectRatio="none"
                role="img"
                aria-label="India's concessional share of external debt vs commercial borrowing, 1991 to 2025"
            >
                <defs>
                    <linearGradient id="conc-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="grad-conc-top" />
                        <stop offset="100%" className="grad-conc-bottom" />
                    </linearGradient>
                    <linearGradient id="comm-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="grad-comm-top" />
                        <stop offset="100%" className="grad-comm-bottom" />
                    </linearGradient>
                    <clipPath id="reveal-clip">
                        <rect x="0" y="0" height={h || 1} width={px} />
                    </clipPath>
                </defs>

                {/* LINES + AREA FILLS (revealed up to the current year) =========== */}
                <g clipPath="url(#reveal-clip)">
                    <path className="area-comm" d={commArea} fill="url(#comm-fill)" />
                    <path className="area-conc" d={concArea} fill="url(#conc-fill)" />
                    <path className="line-comm" d={commLine} fill="none" />
                    <path className="line-conc" d={concLine} fill="none" />

                    {/* Milestone markers — years that have an event card */}
                    {!!w && DEBT_MIX_EVENTS.map((ev) => {
                        const d = DEBT_MIX_SERIES.find((s) => s.year === ev.year);
                        if (!d) return null;
                        const ex = xOf(ev.year);
                        return (
                            <g key={ev.year} className="event-marker">
                                <circle className="event-dot-comm" cx={ex} cy={yComm(commOf(d))} r={4} />
                                <circle className="event-dot-conc" cx={ex} cy={yConc(concOf(d))} r={4} />
                            </g>
                        );
                    })}
                </g>

                {/* YEAR AXIS LABELS ============================================= */}
                <g className="axis-labels">
                    {!!w && xTicks.map((t) => (
                        <text key={t} x={clamp(xOf(t), 18, w - 18)} y={h - 16} textAnchor="middle">{t}</text>
                    ))}
                </g>

                {/* PLAYHEAD — the current-year edge, dots and marker all share px == xOf(currentYear) */}
                <line className="reveal-edge" x1={px} x2={px} y1={PAD.top - 16} y2={h - PAD.bottom + 8} />

                <circle className="focus-dot-comm" r={7} cx={px} cy={commCy} />
                <circle className="focus-dot-conc" r={7} cx={px} cy={concCy} />
            </svg>

            {/* Line-value markers — Fictoan Badges floating above each dot */}
            <Badge
                className="value-badge value-badge-conc"
                size="small" shape="curved"
                style={{ left : labelX, top : concCy }}
            >
                {concVal.toFixed(1)}%
            </Badge>

            <Badge
                className="value-badge value-badge-comm"
                size="small" shape="curved"
                style={{ left : labelX, top : commCy }}
            >
                ₹{commVal.toFixed(1)}L
            </Badge>

            {/* Current-year marker — Fictoan Badge tracking the reveal edge */}
            <Badge
                className="edge-year-badge"
                size="small" shape="curved"
                style={{ left : markerX }}
            >
                {Math.round(currentYear)}
            </Badge>
        </div>
    );
};
