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

// A brass plaque hung under each pan, engraved like a weighing machine's reading: India's rolls up, the partners'
// stays at 100. A price index, not money, so it carries no currency sign.
const Plaque = ({ india, later } : { india : boolean; later : boolean }) => (
    <g className={`scale-plaque ${india ? "is-india" : "is-abroad"}`}>
        <rect x={14} y={-24} width={86} height={40} rx={7} fill="url(#ps-plate)" stroke="#6b4c12" strokeWidth={0.9} />
        <rect x={19} y={-19} width={76} height={30} rx={4} className="plaque-inset" />
        <rect x={19} y={-19} width={76} height={10} rx={4} fill="#fff" fillOpacity={0.35} />
        <circle cx={22} cy={-17} r={1.6} fill="#6b4c12" /><circle cx={92} cy={-17} r={1.6} fill="#6b4c12" />
        <circle cx={22} cy={9} r={1.6} fill="#6b4c12" /><circle cx={92} cy={9} r={1.6} fill="#6b4c12" />
        {india && LATER >= 100 && LATER <= 199 ? (
            <g>
                <text x={44} y={5} textAnchor="end" className="tag-price">1</text>
                <Roll x={52} to={later ? Math.floor(LATER / 10) % 10 : 0} turns={0} run={later} />
                <Roll x={65} to={later ? LATER % 10 : 0} turns={later ? 1 : 0} run={later} />
            </g>
        ) : <text x={56} y={5} textAnchor="middle" className="tag-price">{india && later ? LATER : 100}</text>}
    </g>
);

// A pan hung at (hx, 220) from the beam's end: a hook, three chains of links, and a polished bowl with the goods sitting
// in it; it counter-turns so it stays level as the beam tips.
const Pan = ({ hx, india, later } : { hx : number; india : boolean; later : boolean }) => (
    <g className="pan" style={{ transformOrigin : `${hx}px 220px`, transform : `rotate(${later ? -TILT : 0}deg)` }}>
        {/* hook and ring */}
        <path d={`M${hx} 222 v10`} stroke="url(#ps-col)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={hx} cy={238} r={6} fill="none" stroke="url(#ps-col)" strokeWidth={3} />
        {/* chains: a dark core and a bright dashed overlay read as links */}
        {[ [ -76, 0 ], [ 0, 0 ], [ 76, 0 ] ].map(([ dx ]) => (
            <g key={dx}>
                <path d={`M${hx} 243 L${hx + dx} 316`} stroke="#6b4c12" strokeWidth={3.2} strokeLinecap="round" />
                <path d={`M${hx} 243 L${hx + dx} 316`} stroke="#f3d98a" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
            </g>
        ))}
        {/* the bowl: its dark inside, its polished outside and rim, then the goods */}
        <ellipse cx={hx} cy={318} rx={88} ry={13} fill="url(#ps-bowl-in)" />
        <path d={`M${hx - 88} 318 Q${hx - 80} 362 ${hx} 364 Q${hx + 80} 362 ${hx + 88} 318 Q${hx} 334 ${hx - 88} 318 Z`} fill="url(#ps-bowl)" stroke="#6b4c12" strokeWidth={0.8} />
        <path d={`M${hx - 70} 330 Q${hx - 56} 352 ${hx - 22} 357`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={hx} cy={318} rx={88} ry={13} fill="none" stroke="url(#ps-rim)" strokeWidth={3.2} />
        {/* the goods sit in the bowl, drawn over its rim so nothing cuts across them */}
        {GOODS.map((g, k) => (
            <text key={g} x={hx - 56 + k * 28} y={k % 2 ? 320 : 316} textAnchor="middle" className="goods">{g}</text>
        ))}
        {/* the reading, hung under the bowl */}
        <path d={`M${hx} 364 v8`} stroke="#6b4c12" strokeWidth={1.4} />
        <g transform={`translate(${hx - 57} 396)`}><Plaque india={india} later={later} /></g>
        <text x={hx} y={436} textAnchor="middle" className="pan-label">{india ? "India’s prices" : "Partners’ prices"}</text>
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
            <svg viewBox="40 96 720 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                    <clipPath id="ps-window"><rect x={45} y={-14} width={27} height={24} /></clipPath>
                    {/* polished brass: bright specular bands on a deep gold, across for upright parts, down for flat ones */}
                    <linearGradient id="ps-col" x1="0" x2="1">
                        <stop offset="0" stopColor="#5a3d0c" /><stop offset="0.22" stopColor="#b78a2c" /><stop offset="0.4" stopColor="#fff3c4" />
                        <stop offset="0.55" stopColor="#e7bf55" /><stop offset="0.8" stopColor="#9a7120" /><stop offset="1" stopColor="#5a3d0c" />
                    </linearGradient>
                    <linearGradient id="ps-beam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff5cf" /><stop offset="0.35" stopColor="#ecc65c" /><stop offset="0.7" stopColor="#a87d24" /><stop offset="1" stopColor="#5f420f" />
                    </linearGradient>
                    <linearGradient id="ps-bowl" x1="0" x2="1">
                        <stop offset="0" stopColor="#6b4c12" /><stop offset="0.25" stopColor="#d4aa45" /><stop offset="0.42" stopColor="#fff1bd" />
                        <stop offset="0.6" stopColor="#e2b94e" /><stop offset="1" stopColor="#6b4c12" />
                    </linearGradient>
                    <radialGradient id="ps-bowl-in" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#7a5714" /><stop offset="0.7" stopColor="#b8902f" /><stop offset="1" stopColor="#e8c86a" /></radialGradient>
                    <linearGradient id="ps-rim" x1="0" x2="1"><stop offset="0" stopColor="#8a6418" /><stop offset="0.45" stopColor="#fff6d4" /><stop offset="1" stopColor="#8a6418" /></linearGradient>
                    <linearGradient id="ps-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dc8e" /><stop offset="1" stopColor="#9a7120" /></linearGradient>
                    <linearGradient id="ps-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a4f2e" /><stop offset="0.15" stopColor="#5b3a22" /><stop offset="1" stopColor="#2a190d" /></linearGradient>
                    <radialGradient id="ps-jewel" cx="35%" cy="30%"><stop offset="0" stopColor="#ffd2c8" /><stop offset="0.5" stopColor="#d63d2f" /><stop offset="1" stopColor="#7a160e" /></radialGradient>
                    <radialGradient id="ps-spot" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.1" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
                    <filter id="ps-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
                </defs>

                {/* a soft spotlight behind, and the counter with the scale's shadow */}
                <ellipse cx={400} cy={300} rx={380} ry={220} fill="url(#ps-spot)" />
                <line x1={40} x2={760} y1={470} y2={470} className="counter" />
                <ellipse cx={400} cy={472} rx={170} ry={10} fill="#000" fillOpacity={0.28} filter="url(#ps-soft)" />

                {/* the plinth: walnut, with a bevelled top edge */}
                <rect x={300} y={444} width={200} height={26} rx={5} fill="url(#ps-wood)" />
                <rect x={302} y={444} width={196} height={3} rx={1.5} fill="#c99a6a" fillOpacity={0.7} />
                {/* the brass foot in two tiers, the column with its collars, the finial */}
                <path d="M338 444 Q342 428 360 426 H440 Q458 428 462 444 Z" fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                <path d="M366 426 Q370 414 382 412 H418 Q430 414 434 426 Z" fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                <path d="M392 412 L394 232 H406 L408 412 Z" fill="url(#ps-col)" />
                {[ 404, 300, 240 ].map(y => <rect key={y} x={386} y={y} width={28} height={7} rx={3} fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.5} />)}
                <circle cx={400} cy={182} r={8} fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.5} />
                <path d="M397 190 L400 206 L403 190 Z" fill="url(#ps-col)" />

                {/* the dial above the pivot: an arc of marks that the beam's needle reads */}
                <path d="M352 196 A 62 62 0 0 1 448 196" fill="none" stroke="url(#ps-rim)" strokeWidth={2} />
                {Array.from({ length : 9 }, (_, k) => {
                    const a = (-28 + k * 7) * Math.PI / 180, r0 = 58, r1 = k === 4 ? 49 : 53;
                    return <line key={k} x1={400 + r0 * Math.sin(a)} y1={220 - r0 * Math.cos(a)} x2={400 + r1 * Math.sin(a)} y2={220 - r1 * Math.cos(a)} stroke="#6b4c12" strokeWidth={k === 4 ? 1.6 : 1} />;
                })}

                {/* the beam and its pans: India on the left, the partners on the right */}
                <g className="beam" style={{ transformOrigin : "400px 220px", transform : `rotate(${later ? TILT : 0}deg)` }}>
                    <path d="M400 222 L400 172" stroke="#3d2a08" strokeWidth={2} strokeLinecap="round" />
                    <path d="M176 217 Q290 211 400 209 Q510 211 624 217 L624 223 Q510 229 400 231 Q290 229 176 223 Z" fill="url(#ps-beam)" stroke="#5f420f" strokeWidth={0.8} />
                    <path d="M190 215 Q300 210.5 400 209.5" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} />
                    <circle cx={176} cy={220} r={6} fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                    <circle cx={624} cy={220} r={6} fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                    <circle cx={400} cy={220} r={10} fill="url(#ps-col)" stroke="#5a3d0c" strokeWidth={0.8} />
                    <circle cx={400} cy={220} r={5} fill="url(#ps-jewel)" />
                    <Pan hx={180} india later={later} />
                    <Pan hx={620} india={false} later={later} />
                </g>

                {later && <text x={400} y={118} textAnchor="middle" className="time-jump">⏩ 22 years later</text>}
                <text x={400} y={146} textAnchor="middle" className="scale-month">{later ? monthName(MONTHS[N - 1]) : monthName(MONTHS[0])}</text>
                {/* what the numbers are */}
                <text x={400} y={492} textAnchor="middle" className="scale-caption">Not rupees: a price index. Both sides start at 100 in {monthName(MONTHS[0])}.</text>
            </svg>
        </div>
    );
};

export default PriceScale;
