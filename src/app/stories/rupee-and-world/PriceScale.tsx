"use client";

// The other half, made literal: a balance scale with the same goods on both pans, India's prices on one and its
// partners' on the other, each in its own currency and both 100 in April 2004. A moment after the scene comes into
// view it moves on to July 2026: holding the partners' side at 100, India's side sinks and its tag rolls up to India's
// prices against its partners' (REER ÷ NEER over its first value, × 100: COST.rel in data.ts). It is a ratio of price
// levels, not rupees: the readings are plaques with no currency sign, and a caption under the scale says so.

// REACT CORE ==========================================================================================================
import { CSSProperties, useEffect, useState } from "react";

// DATA ================================================================================================================
import { COST, MONTHS, N, monthName } from "./data";
import type { SceneId } from "./RupeeStage";

const LATER = Math.round(COST.rel[N - 1]);
const TILT = -9;                                                     // degrees: India's side (the left) goes down
const GOODS = [ "👞", "👕", "☕", "🍚", "💊" ];
const DIGIT_H = 24;

// One rolling figure behind a window: a strip of figures moved up by whole figures.
const Roll = ({ x, to, turns, run } : { x : number; to : number; turns : number; run : boolean }) => {
    const n = turns * 10 + to;
    return (
        <g clipPath="url(#ps-window)">
            <g className="roll" data-on={run} style={{ "--to" : `${-n * DIGIT_H}px` } as CSSProperties}>
                {Array.from({ length : n + 1 }, (_, k) => <text key={k} x={x} y={5 + k * DIGIT_H} textAnchor="middle" className="tag-price">{k % 10}</text>)}
            </g>
        </g>
    );
};

// A brass plaque on the pan, like a weighing machine's reading: India's rolls up, the partners' stays at 100. A price
// index, not money, so it carries no currency sign and looks nothing like a shop's price tag.
const Plaque = ({ india, later } : { india : boolean; later : boolean }) => (
    <g className={`scale-plaque ${india ? "is-india" : "is-abroad"}`}>
        <rect x={18} y={-21} width={78} height={34} rx={6} className="plaque-body" />
        <rect x={21} y={-18} width={72} height={28} rx={4} className="plaque-inset" />
        {india && LATER >= 100 && LATER <= 199 ? (
            <g>
                <text x={44} y={5} textAnchor="end" className="tag-price">1</text>
                <Roll x={52} to={later ? Math.floor(LATER / 10) % 10 : 0} turns={0} run={later} />
                <Roll x={65} to={later ? LATER % 10 : 0} turns={later ? 1 : 0} run={later} />
            </g>
        ) : <text x={56} y={5} textAnchor="middle" className="tag-price">{india && later ? LATER : 100}</text>}
    </g>
);

// A pan with its chains and goods, hung at (hx, 220) from the beam; it counter-turns so it stays level.
const Pan = ({ hx, india, later } : { hx : number; india : boolean; later : boolean }) => (
    <g className="pan" style={{ transformOrigin : `${hx}px 220px`, transform : `rotate(${later ? -TILT : 0}deg)` }}>
        <path d={`M${hx} 222 L${hx - 70} 330 M${hx} 222 L${hx + 70} 330 M${hx} 222 L${hx} 330`} className="chain" />
        {GOODS.map((g, k) => (
            <text key={g} x={hx - 52 + k * 26} y={k % 2 ? 322 : 318} textAnchor="middle" className="goods">{g}</text>
        ))}
        <path d={`M${hx - 80} 328 Q${hx} 372 ${hx + 80} 328 Z`} className="pan-dish" />
        <path d={`M${hx - 80} 328 H${hx + 80}`} className="pan-rim" />
        <g transform={`translate(${hx - 57} 360)`}><Plaque india={india} later={later} /></g>
        <text x={hx} y={398} textAnchor="middle" className="pan-label">{india ? "India’s prices" : "Partners’ prices"}</text>
    </g>
);

export const PriceScale = ({ scene, box } : { scene : SceneId; box : { x0 : number; x1 : number; y0 : number; y1 : number } }) => {
    const on = scene === "scale";
    // the scene opens on 2004 and moves itself on to 2026 a moment later
    const [ later, setLater ] = useState(false);
    useEffect(() => {
        if (!on) { setLater(false); return; }
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const t = window.setTimeout(() => setLater(true), reduced ? 0 : 1700);
        return () => clearTimeout(t);
    }, [ on ]);

    return (
        <div className={`coin-scene scale-scene ${on ? "is-on" : ""}`} style={{ left : box.x0, top : box.y0, width : box.x1 - box.x0, height : box.y1 - box.y0 }}>
            {/* framed on the scale itself, from the "22 years later" line to the counter, tags included */}
            <svg viewBox="60 96 680 410" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                    <clipPath id="ps-window"><rect x={45} y={-14} width={27} height={24} /></clipPath>
                    <linearGradient id="ps-brass" x1="0" x2="1"><stop offset="0" stopColor="#8a6418" /><stop offset="0.45" stopColor="#f1d27a" /><stop offset="1" stopColor="#8a6418" /></linearGradient>
                    <linearGradient id="ps-brass-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1d27a" /><stop offset="1" stopColor="#9a7120" /></linearGradient>
                    <linearGradient id="ps-dish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dc8e" /><stop offset="1" stopColor="#a87a22" /></linearGradient>
                    <filter id="ps-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
                </defs>
                <line x1={20} x2={780} y1={462} y2={462} className="counter" />
                <ellipse cx={400} cy={464} rx={120} ry={8} fill="#000" fillOpacity={0.2} filter="url(#ps-soft)" />

                {/* the stand */}
                <path d="M330 460 Q400 430 470 460 Z" fill="url(#ps-brass-v)" stroke="#7a5512" strokeWidth={1} />
                <rect x={393} y={222} width={14} height={222} rx={4} fill="url(#ps-brass)" />
                <circle cx={400} cy={206} r={11} fill="url(#ps-dish)" stroke="#7a5512" />

                {/* the beam and its pans: India on the left, the partners on the right */}
                <g className="beam" style={{ transformOrigin : "400px 220px", transform : `rotate(${later ? TILT : 0}deg)` }}>
                    <rect x={170} y={214} width={460} height={12} rx={6} fill="url(#ps-brass-v)" stroke="#7a5512" strokeWidth={0.8} />
                    <circle cx={400} cy={220} r={7} fill="#7a5512" />
                    <Pan hx={180} india later={later} />
                    <Pan hx={620} india={false} later={later} />
                </g>

                {later && <text x={400} y={110} textAnchor="middle" className="time-jump">⏩ 22 years later</text>}
                <text x={400} y={140} textAnchor="middle" className="scale-month">{later ? monthName(MONTHS[N - 1]) : monthName(MONTHS[0])}</text>
                {/* what the numbers are */}
                <text x={400} y={492} textAnchor="middle" className="scale-caption">Not rupees: a price index. Both sides start at 100 in {monthName(MONTHS[0])}.</text>
            </svg>
        </div>
    );
};

export default PriceScale;
