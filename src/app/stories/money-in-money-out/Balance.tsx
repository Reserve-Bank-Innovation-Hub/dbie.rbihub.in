"use client";

// The balance: S1's brass scale, $100 sent home in one pan and the $22 sent out under the LRS in the other; the bundles
// drop in and the beam settles toward the heavier pan. Then the close: the board again.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useState } from "react";

// DATA ================================================================================================================
import { HEADLINE } from "./data.gen";
import { Board, type BoardRow } from "./Board";
import { Layout, reducedMotion, splitClass, useStage } from "./stage";

// The scale is S1's brass balance (rupee-and-world/PriceScale.tsx), drawn the same way: a walnut plinth, a brass column
// with collars, a beam with a jewel at the pivot, and two polished bowls on chains with an engraved plaque under each.
// Here the bowls hold bundles of notes, each $10 of every $100: ten on the left for money sent home, 2.2 on the right
// for money sent out under the LRS. The bundles drop in, then the beam tips toward the heavier side.
const TILT = -8;                                                     // degrees: the left (money sent home) goes down

// bundles stacked in a bowl as a small pyramid, from the bottom row up; a part bundle is drawn short
const pile = (n : number) => {
    const out : { x : number; y : number; w : number }[] = [];
    let left = n, row = 0;
    const perRow = [ 4, 3, 2, 1, 1 ];
    while (left > 0.01 && row < perRow.length) {
        const k = Math.min(perRow[row], Math.ceil(left));
        for (let j = 0; j < k; j++) {
            const w = Math.min(1, left);
            out.push({ x : (j - (k - 1) / 2) * 36 + (w < 1 ? -(1 - w) * 15 : 0), y : -row * 11, w });
            left -= w;
            if (left <= 0.01) break;
        }
        row++;
    }
    return out;
};

const Pan = ({ hx, bundles, tone, value, label, later, drop } : { hx : number; bundles : number; tone : string; value : string; label : string; later : boolean; drop : boolean }) => (
    <g className="pan" style={{ transformOrigin : `${hx}px 220px`, transform : `rotate(${later ? -TILT : 0}deg)` }}>
        <path d={`M${hx} 222 v10`} stroke="url(#sc-col)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={hx} cy={238} r={6} fill="none" stroke="url(#sc-col)" strokeWidth={3} />
        {[ -76, 0, 76 ].map(dx => (
            <g key={dx}>
                <path d={`M${hx} 243 L${hx + dx} 316`} stroke="#6b4c12" strokeWidth={3.2} strokeLinecap="round" />
                <path d={`M${hx} 243 L${hx + dx} 316`} stroke="#f3d98a" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
            </g>
        ))}
        <ellipse cx={hx} cy={318} rx={88} ry={13} fill="url(#sc-bowl-in)" />
        <path d={`M${hx - 88} 318 Q${hx - 80} 362 ${hx} 364 Q${hx + 80} 362 ${hx + 88} 318 Q${hx} 334 ${hx - 88} 318 Z`} fill="url(#sc-bowl)" stroke="#6b4c12" strokeWidth={0.8} />
        <path d={`M${hx - 70} 330 Q${hx - 56} 352 ${hx - 22} 357`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={hx} cy={318} rx={88} ry={13} fill="none" stroke="url(#sc-rim)" strokeWidth={3.2} />
        {/* the bundles, over the rim: each falls in from above, one after another from the bottom row */}
        <g className={`bundles ${tone}`}>
            {pile(bundles).map((b, k) => (
                <g key={k} className={`sc-bundle ${drop ? "is-in" : ""}`} style={{ animationDelay : `${(tone === "is-in" ? 0.2 : 1.1) + k * 0.12}s` }}>
                    <rect x={hx + b.x - 16 * b.w} y={306 + b.y} width={32 * b.w} height={9} rx={1.5} className="sc-note" />
                    <rect x={hx + b.x - 3} y={306 + b.y} width={6} height={9} className="sc-band" />
                </g>
            ))}
        </g>
        <path d={`M${hx} 364 v8`} stroke="#6b4c12" strokeWidth={1.4} />
        <g transform={`translate(${hx - 57} 396)`}>
            <g className={`scale-plaque ${tone}`}>
                <rect x={14} y={-24} width={86} height={40} rx={7} fill="url(#sc-plate)" stroke="#6b4c12" strokeWidth={0.9} />
                <rect x={19} y={-19} width={76} height={30} rx={4} className="plaque-inset" />
                <rect x={19} y={-19} width={76} height={10} rx={4} fill="#fff" fillOpacity={0.35} />
                {[ [ 22, -17 ], [ 92, -17 ], [ 22, 9 ], [ 92, 9 ] ].map(([ cx, cy ]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={1.6} fill="#6b4c12" />)}
                <text x={57} y={5} textAnchor="middle" className="tag-price">{value}</text>
            </g>
        </g>
        <text x={hx} y={436} textAnchor="middle" className="pan-label">{label}</text>
    </g>
);

export const ScaleStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, drawn } = useStage<HTMLDivElement>();
    const [ later, setLater ] = useState(false);
    useEffect(() => {
        if (!drawn) return;
        const id = window.setTimeout(() => setLater(true), reducedMotion() ? 0 : 2400);
        return () => clearTimeout(id);
    }, [ drawn ]);
    const b = HEADLINE.balance;
    return (
        <div className={splitClass(layout)}>
            <div className="split-stage scale-stage" ref={ref}>
                <svg viewBox="40 150 720 350" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`For every $100 that came into India from Indians abroad in ${HEADLINE.lastFy}, $${b} went out of India under the LRS.`}>
                    <defs>
                        <linearGradient id="sc-col" x1="0" x2="1">
                            <stop offset="0" stopColor="#5a3d0c" /><stop offset="0.22" stopColor="#b78a2c" /><stop offset="0.4" stopColor="#fff3c4" />
                            <stop offset="0.55" stopColor="#e7bf55" /><stop offset="0.8" stopColor="#9a7120" /><stop offset="1" stopColor="#5a3d0c" />
                        </linearGradient>
                        <linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#fff5cf" /><stop offset="0.35" stopColor="#ecc65c" /><stop offset="0.7" stopColor="#a87d24" /><stop offset="1" stopColor="#5f420f" />
                        </linearGradient>
                        <linearGradient id="sc-bowl" x1="0" x2="1">
                            <stop offset="0" stopColor="#6b4c12" /><stop offset="0.25" stopColor="#d4aa45" /><stop offset="0.42" stopColor="#fff1bd" />
                            <stop offset="0.6" stopColor="#e2b94e" /><stop offset="1" stopColor="#6b4c12" />
                        </linearGradient>
                        <radialGradient id="sc-bowl-in" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#7a5714" /><stop offset="0.7" stopColor="#b8902f" /><stop offset="1" stopColor="#e8c86a" /></radialGradient>
                        <linearGradient id="sc-rim" x1="0" x2="1"><stop offset="0" stopColor="#8a6418" /><stop offset="0.45" stopColor="#fff6d4" /><stop offset="1" stopColor="#8a6418" /></linearGradient>
                        <linearGradient id="sc-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dc8e" /><stop offset="1" stopColor="#9a7120" /></linearGradient>
                        <linearGradient id="sc-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a4f2e" /><stop offset="0.15" stopColor="#5b3a22" /><stop offset="1" stopColor="#2a190d" /></linearGradient>
                        <radialGradient id="sc-jewel" cx="35%" cy="30%"><stop offset="0" stopColor="#ffd2c8" /><stop offset="0.5" stopColor="#d63d2f" /><stop offset="1" stopColor="#7a160e" /></radialGradient>
                        <radialGradient id="sc-spot" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.1" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
                        <filter id="sc-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
                    </defs>
                    <ellipse cx={400} cy={300} rx={380} ry={220} fill="url(#sc-spot)" />
                    <line x1={40} x2={760} y1={470} y2={470} className="counter" />
                    <ellipse cx={400} cy={472} rx={170} ry={10} fill="#000" fillOpacity={0.28} filter="url(#sc-soft)" />
                    <rect x={300} y={444} width={200} height={26} rx={5} fill="url(#sc-wood)" />
                    <rect x={302} y={444} width={196} height={3} rx={1.5} fill="#c99a6a" fillOpacity={0.7} />
                    <path d="M338 444 Q342 428 360 426 H440 Q458 428 462 444 Z" fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                    <path d="M366 426 Q370 414 382 412 H418 Q430 414 434 426 Z" fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                    <path d="M392 412 L394 232 H406 L408 412 Z" fill="url(#sc-col)" />
                    {[ 404, 300, 240 ].map(y => <rect key={y} x={386} y={y} width={28} height={7} rx={3} fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.5} />)}
                    <circle cx={400} cy={182} r={8} fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.5} />
                    <path d="M397 190 L400 206 L403 190 Z" fill="url(#sc-col)" />
                    <path d="M352 196 A 62 62 0 0 1 448 196" fill="none" stroke="url(#sc-rim)" strokeWidth={2} />
                    {Array.from({ length : 9 }, (_, k) => {
                        const a = (-28 + k * 7) * Math.PI / 180, r0 = 58, r1 = k === 4 ? 49 : 53;
                        return <line key={k} x1={400 + r0 * Math.sin(a)} y1={220 - r0 * Math.cos(a)} x2={400 + r1 * Math.sin(a)} y2={220 - r1 * Math.cos(a)} stroke="#6b4c12" strokeWidth={k === 4 ? 1.6 : 1} />;
                    })}
                    <g className="beam" style={{ transformOrigin : "400px 220px", transform : `rotate(${later ? TILT : 0}deg)` }}>
                        <path d="M400 222 L400 172" stroke="#3d2a08" strokeWidth={2} strokeLinecap="round" />
                        <path d="M176 217 Q290 211 400 209 Q510 211 624 217 L624 223 Q510 229 400 231 Q290 229 176 223 Z" fill="url(#sc-beam)" stroke="#5f420f" strokeWidth={0.8} />
                        <path d="M190 215 Q300 210.5 400 209.5" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} />
                        <circle cx={176} cy={220} r={6} fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                        <circle cx={624} cy={220} r={6} fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.6} />
                        <circle cx={400} cy={220} r={10} fill="url(#sc-col)" stroke="#5a3d0c" strokeWidth={0.8} />
                        <circle cx={400} cy={220} r={5} fill="url(#sc-jewel)" />
                        <Pan hx={180} bundles={10} tone="is-in" value="$100" label="Into India, from Indians abroad" later={later} drop={drawn} />
                        <Pan hx={620} bundles={b / 10} tone="is-out" value={`$${b}`} label="Out of India, under the LRS" later={later} drop={drawn} />
                    </g>
                    <text x={400} y={492} textAnchor="middle" className="scale-caption">Each bundle is $10 of every $100 that came in, {HEADLINE.lastFy}.</text>
                </svg>
            </div>
            <aside className="split-card">{children}</aside>
        </div>
    );
};

export const CloseStep = ({ rows, facts, note, children } : { rows : BoardRow[]; facts : { value : string; label : string }[]; note : ReactNode; children : ReactNode }) => (
    <div className="close">
        <div className="close-head">{children}</div>
        <Board rows={rows} label={rows.map(r => `${r.tag ?? ""} ${r.text}`).join("; ")} />
        <dl className="close-facts">
            {facts.map(f => <div key={f.label}><dt>{f.value}</dt><dd>{f.label}</dd></div>)}
        </dl>
        <div className="close-words">{note}</div>
    </div>
);

