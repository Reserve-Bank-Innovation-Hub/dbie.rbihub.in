"use client";

// The basket of currencies, made literal: a basket holding one coin for each of the 40 partners' currencies, each coin
// as large as that currency's weight in the index (RBI's 2015-16 trade weights), and a wallet of rupee notes that pays
// for it. In April 2004 the basket costs ₹100: one ₹100 note. In July 2026 the same basket costs ₹178 (the NEER's first
// value over its latest, × 100): a ₹100 note, a ₹50 and three ₹10s, with ₹2 back. Drawn over the stage while the
// dots are away; the chart of the basket's price comes next.
//
// The notes are illustrations in the colours of the current series (lavender ₹100, fluorescent blue ₹50, chocolate
// ₹10), with their value and nothing else of the real design: the Reserve Bank's rules restrict reproducing banknotes.

// REACT CORE ==========================================================================================================
import { CSSProperties, useEffect, useRef, useState } from "react";

// DATA ================================================================================================================
import { COST, MONTHS, N, PARTNERS, monthName } from "./data";
import type { SceneId } from "./RupeeStage";

const isCoins = (s : SceneId) => s === "coins" || s === "coins26";

// THE COINS ===========================================================================================================
// Each partner's currency sign, by RBI's currency code.
const SIGN : Record<string, string> = {
    EUR : "€", CNY : "¥", AED : "د.إ", USD : "$", SAR : "﷼", CHF : "Fr", HKD : "HK$", IDR : "Rp", SGD : "S$", IQD : "ع.د",
    KRW : "₩", KWD : "د.ك", JPY : "¥", QAR : "ر.ق", NGN : "₦", GBP : "£", MYR : "RM", IRR : "﷼", AUD : "A$", ZAR : "R",
    BRL : "R$", THB : "฿", VND : "₫", BDT : "৳", TWD : "NT$", AOA : "Kz", RUB : "₽", TRY : "₺", MXN : "Mex$", ILS : "₪",
    LKR : "Rs", CAD : "C$", EGP : "E£", OMR : "ر.ع.", NPR : "रू", KES : "KSh", TZS : "TSh", CLP : "CLP$", UAH : "₴", GHS : "₵",
};
const METAL = [ "gold", "silver", "bronze" ] as const;
const MAX_W = PARTNERS[0]?.weight ?? 1;

// The pile: the largest coins first, each dropped where it can rest lowest without overlapping those already placed
// (a little overlap allowed, as in a real heap), inside a heap that narrows as it rises from the basket's mouth. Every
// coin finds its own place: there is no fallback spot for coins to stack on.
interface Coin { code : string; name : string; weight : number; r : number; x : number; y : number; metal : typeof METAL[number] }
export const packCoins = (weights : { iso : string; country : string; weight : number }[]) : Coin[] => {
    const cx = 300, half = 160, floor = 318, slope = 0.35, maxW = weights[0]?.weight ?? 1;
    const placed : Coin[] = [];
    weights.forEach((p, k) => {
        const r = 7 + 23 * Math.sqrt(p.weight / maxW);
        let best : { x : number; y : number } | null = null;
        for (let x = cx - half; x <= cx + half; x += 2) {
            // the lowest free height at this x: scan up from the floor to the first spot clear of every coin
            for (let y = floor - r; y > floor - 300; y -= 2) {
                if (Math.abs(x - cx) > half - (floor - y) * slope - r) break;          // outside the heap's slope
                if (placed.some(c => Math.hypot(c.x - x, c.y - y) < c.r + r - 2)) continue;
                const better = !best || y > best.y + 0.5 || (Math.abs(y - best.y) <= 0.5 && Math.abs(x - cx) < Math.abs(best.x - cx));
                if (better) best = { x, y };
                break;
            }
        }
        if (!best) throw new Error(`no room in the basket for ${p.country}`);
        placed.push({ code : p.iso, name : p.country, weight : p.weight, r, x : best.x, y : best.y, metal : METAL[k % 3] });
    });
    return placed;
};
export const COINS = packCoins(PARTNERS);

// THE NOTES ===========================================================================================================
// Back to front in the wallet; where each sits there, and where it lands when paid (beside the price tag).
interface Note { id : string; value : 100 | 50 | 10; wallet : [ number, number ]; paid : [ number, number, number ]; delay : number }
const NOTES : Note[] = [
    { id : "ten-c",  value : 10,  wallet : [ 590, 356 ], paid : [ 534, 178, -4 ], delay : 1.45 },
    { id : "ten-b",  value : 10,  wallet : [ 586, 350 ], paid : [ 520, 164, 6 ],  delay : 1.2 },
    { id : "ten-a",  value : 10,  wallet : [ 582, 344 ], paid : [ 506, 150, -3 ], delay : 0.95 },
    { id : "fifty",  value : 50,  wallet : [ 578, 338 ], paid : [ 488, 136, 4 ],  delay : 0.6 },
    { id : "hundred", value : 100, wallet : [ 574, 332 ], paid : [ 470, 120, -6 ], delay : 0.25 },
];
const NOTE_COLOUR = { 100 : [ "#c5b3e6", "#8f76c2" ], 50 : [ "#9fdde8", "#4fa9bd" ], 10 : [ "#d7ad84", "#9a6a43" ] } as const;
const NOTE_WORDS = { 100 : "एक सौ रुपये", 50 : "पचास रुपये", 10 : "दस रुपये" } as const;
const NOTE_ENGLISH = { 100 : "ONE HUNDRED RUPEES", 50 : "FIFTY RUPEES", 10 : "TEN RUPEES" } as const;

// A note: its colour, a border, a rosette, a plain oval window, the value in English and in Hindi and in figures, and a
// sheen across it. No portrait.
const NoteArt = ({ value } : { value : 100 | 50 | 10 }) => {
    const [ face, ink ] = NOTE_COLOUR[value];
    return (
        <g>
            <rect width={160} height={70} rx={4} fill={face} stroke={ink} strokeWidth={1.2} />
            <rect x={5} y={5} width={150} height={60} rx={2} fill="none" stroke={ink} strokeOpacity={0.45} strokeDasharray="2 2" />
            <circle cx={36} cy={33} r={17} fill="none" stroke={ink} strokeOpacity={0.45} />
            <circle cx={36} cy={33} r={11} fill="none" stroke={ink} strokeOpacity={0.3} strokeDasharray="1.5 1.5" />
            {/* the watermark window, left plain */}
            <ellipse cx={86} cy={34} rx={18} ry={23} fill="#ffffff" fillOpacity={0.38} stroke={ink} strokeOpacity={0.35} />
            <text x={12} y={14} fontSize={6.6} fontWeight={700} letterSpacing={0.4} fill={ink}>{NOTE_ENGLISH[value]}</text>
            <text x={12} y={64} fontSize={8.5} fill={ink}>{NOTE_WORDS[value]}</text>
            <text x={150} y={58} textAnchor="end" fontSize={22} fontWeight={700} fill={ink}>₹{value}</text>
            <rect width={160} height={70} rx={4} fill="url(#note-sheen)" />
        </g>
    );
};

// THE TAG'S PRICE ====================================================================================================
// "₹1" stays; the tens and the units roll like a meter from 00 to the later price's last two digits, the units going
// once round first. Each rolling digit is a strip of figures behind a window, moved up by whole figures.
const DIGIT_H = 26;                                                  // one figure's step in the strip
const RollDigit = ({ x, to, turns, later } : { x : number; to : number; turns : number; later : boolean }) => {
    const n = turns * 10 + to;                                       // figures passed on the way
    return (
        <g clipPath="url(#tag-window)">
            <g className="roll" style={{ "--to" : `${-n * DIGIT_H}px` } as CSSProperties} data-on={later}>
                {Array.from({ length : n + 1 }, (_, k) => (
                    <text key={k} x={x} y={6 + k * DIGIT_H} textAnchor="middle" className="tag-price">{k % 10}</text>
                ))}
            </g>
        </g>
    );
};
const PriceRoll = ({ later } : { later : boolean }) => {
    // the roll needs a three-figure price starting with 1; anything else is shown plainly
    if (PRICE_2026 < 100 || PRICE_2026 > 199) return <text x={-60} y={6} textAnchor="middle" className="tag-price">₹{later ? PRICE_2026 : 100}</text>;
    const tens = Math.floor(PRICE_2026 / 10) % 10, units = PRICE_2026 % 10;
    return (
        <g>
            <text x={-60} y={6} textAnchor="end" className="tag-price">₹1</text>
            <RollDigit x={-52.5} to={later ? tens : 0} turns={0} later={later} />
            <RollDigit x={-37.5} to={later ? units : 0} turns={later ? 1 : 0} later={later} />
        </g>
    );
};

// THE SCENE ===========================================================================================================
const PRICE_2026 = Math.round(COST.neer[N - 1]);
// the drawing's frame: everything from the "22 years later" line to the caption under the counter, so the scene fills
// the stage rather than leaving its top empty
export const VIEW_TOP = 70, VIEW_H = 440;
const PAID_2026 = 180, CHANGE = PAID_2026 - PRICE_2026;

export const CoinBasket = ({ scene, box } : { scene : SceneId; box : { x0 : number; x1 : number; y0 : number; y1 : number } }) => {
    const on = isCoins(scene), later = scene === "coins26";
    // the coins drop in each time the basket comes into view from elsewhere; the notes pay each time a year is shown
    const [ run, setRun ] = useState(0);
    const was = useRef<SceneId>(scene);
    useEffect(() => {
        if (on && !isCoins(was.current)) setRun(r => r + 1);
        was.current = scene;
    }, [ scene, on ]);
    const [ hover, setHover ] = useState<Coin | null>(null);

    const paying = (n : Note) => on && (later || n.value === 100);
    return (
        <div className={`coin-scene ${on ? "is-on" : ""} ${later ? "is-later" : ""}`}
            style={{ left : box.x0, top : box.y0, width : box.x1 - box.x0, height : box.y1 - box.y0 }}>
            <svg viewBox={`0 ${VIEW_TOP} 800 ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                    <radialGradient id="metal-gold" cx="35%" cy="30%"><stop offset="0" stopColor="#fff6d6" /><stop offset="0.5" stopColor="#e6bf55" /><stop offset="0.85" stopColor="#b98a2a" /><stop offset="1" stopColor="#8a6418" /></radialGradient>
                    <radialGradient id="metal-silver" cx="35%" cy="30%"><stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#d6dbe1" /><stop offset="0.85" stopColor="#9aa3ad" /><stop offset="1" stopColor="#6f7780" /></radialGradient>
                    <radialGradient id="metal-bronze" cx="35%" cy="30%"><stop offset="0" stopColor="#ffe6d2" /><stop offset="0.5" stopColor="#d89a6c" /><stop offset="0.85" stopColor="#a5663a" /><stop offset="1" stopColor="#7b4524" /></radialGradient>
                    {/* the basket: upright stakes with weavers over and under them, lit from the left */}
                    <pattern id="weave" width="24" height="14" patternUnits="userSpaceOnUse">
                        <rect width="24" height="14" fill="#c99a57" />
                        <path d="M0 3.5 C6 0 6 0 12 3.5 S18 7 24 3.5" fill="none" stroke="#e6c38a" strokeWidth="4.5" />
                        <path d="M0 3.5 C6 0 6 0 12 3.5 S18 7 24 3.5" fill="none" stroke="#a7783c" strokeWidth="0.8" transform="translate(0 2.4)" />
                        <path d="M0 10.5 C6 14 6 14 12 10.5 S18 7 24 10.5" fill="none" stroke="#d8ae6c" strokeWidth="4.5" />
                        <path d="M0 10.5 C6 14 6 14 12 10.5 S18 7 24 10.5" fill="none" stroke="#9a6c32" strokeWidth="0.8" transform="translate(0 2.4)" />
                        <rect x="11" width="2" height="14" fill="#8a5f2c" fillOpacity="0.55" />
                    </pattern>
                    <linearGradient id="basket-shade" x1="0" x2="1">
                        <stop offset="0" stopColor="#000" stopOpacity="0.38" /><stop offset="0.28" stopColor="#000" stopOpacity="0" />
                        <stop offset="0.42" stopColor="#fff" stopOpacity="0.16" /><stop offset="0.75" stopColor="#000" stopOpacity="0" />
                        <stop offset="1" stopColor="#000" stopOpacity="0.45" />
                    </linearGradient>
                    <linearGradient id="basket-depth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#000" stopOpacity="0.25" /><stop offset="0.3" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="handle" x1="0" x2="1"><stop offset="0" stopColor="#8a5f2c" /><stop offset="0.5" stopColor="#d6a965" /><stop offset="1" stopColor="#7a5225" /></linearGradient>
                    {/* the wallet: brown leather, its grain from noise, a soft shine along its top edges */}
                    <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d5034" /><stop offset="1" stopColor="#4a2c1a" /></linearGradient>
                    <linearGradient id="leather-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f5d3d" /><stop offset="0.12" stopColor="#7a4d30" /><stop offset="1" stopColor="#53321e" /></linearGradient>
                    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.35" stopColor="#fff" stopOpacity="0" /></linearGradient>
                    {/* the window the tag's rolling figures show through */}
                    <clipPath id="tag-window"><rect x={-61} y={-14} width={32} height={25} /></clipPath>
                    <linearGradient id="tag-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ec5547" /><stop offset="1" stopColor="#b8261c" /></linearGradient>
                    <linearGradient id="note-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.32" /><stop offset="0.4" stopColor="#fff" stopOpacity="0" /><stop offset="0.7" stopColor="#fff" stopOpacity="0.1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                    <filter id="grain" x="0" y="0" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="noise" />
                        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.55 0 0 0 0" result="dark" />
                        <feComposite in="dark" in2="SourceGraphic" operator="in" result="speck" />
                        <feBlend in="SourceGraphic" in2="speck" mode="multiply" />
                    </filter>
                    <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
                </defs>

                {/* the counter they sit on, and their shadows on it */}
                <line x1={20} x2={780} y1={462} y2={462} className="counter" />
                <ellipse cx={302} cy={464} rx={150} ry={10} fill="#000" fillOpacity={0.22} filter="url(#soft-shadow)" />
                <ellipse cx={662} cy={464} rx={104} ry={8} fill="#000" fillOpacity={0.24} filter="url(#soft-shadow)" />

                {/* the basket: its handle and dark inside, the coins, then its woven front, rim and shading */}
                <path d="M152 312 C150 116, 450 116, 448 312" fill="none" stroke="url(#handle)" strokeWidth={11} strokeLinecap="round" />
                <path d="M158 300 C160 128, 440 128, 442 300" fill="none" stroke="#f3d6a2" strokeOpacity={0.5} strokeWidth={1.5} />
                <ellipse cx={300} cy={316} rx={160} ry={22} fill="#4b3214" />
                <g key={`coins-${run}`}>
                    {COINS.map((c, i) => (
                        <g key={c.code} className="coin" style={{ "--d" : `${(0.15 + i * 0.035).toFixed(3)}s` } as CSSProperties}
                            transform={`translate(${c.x} ${c.y})`}
                            onPointerEnter={() => setHover(c)} onPointerLeave={() => setHover(h => (h === c ? null : h))}>
                            <circle r={c.r} cy={c.r * 0.12} fill="#000" fillOpacity={0.25} />
                            <circle r={c.r} fill={`url(#metal-${c.metal})`} className={`coin-face is-${c.metal}`} />
                            <circle r={c.r * 0.8} fill="none" className={`coin-ring is-${c.metal}`} />
                            <text y={c.r * 0.33} textAnchor="middle" fontSize={Math.max(6, c.r * (SIGN[c.code].length > 2 ? 0.5 : SIGN[c.code].length > 1 ? 0.7 : 0.95))}
                                className={`coin-sign is-${c.metal}`}>{SIGN[c.code]}</text>
                            <ellipse cx={-c.r * 0.35} cy={-c.r * 0.42} rx={c.r * 0.42} ry={c.r * 0.2} transform={`rotate(-30 ${-c.r * 0.35} ${-c.r * 0.42})`} fill="#fff" fillOpacity={0.55} />
                        </g>
                    ))}
                </g>
                <path d="M138 318 L462 318 L434 452 Q432 460 424 460 L176 460 Q168 460 166 452 Z" fill="url(#weave)" />
                <path d="M138 318 L462 318 L434 452 Q432 460 424 460 L176 460 Q168 460 166 452 Z" fill="url(#basket-shade)" />
                <path d="M138 318 L462 318 L434 452 Q432 460 424 460 L176 460 Q168 460 166 452 Z" fill="url(#basket-depth)" stroke="#6e4a20" strokeWidth={1.5} />
                <path d="M136 318 L464 318" stroke="#8a5f2c" strokeWidth={10} strokeLinecap="round" />
                <path d="M136 318 L464 318" stroke="#d6a965" strokeWidth={10} strokeLinecap="round" strokeDasharray="7 5" />
                <path d="M140 314.5 L460 314.5" stroke="#fbe3b5" strokeOpacity={0.55} strokeWidth={1.2} />
                <path d="M170 446 L430 446" stroke="#6e4a20" strokeWidth={6} strokeLinecap="round" strokeOpacity={0.8} />

                {/* what the basket is */}
                <text x={300} y={492} textAnchor="middle" className="basket-caption">A basket of 40 currencies, in the mix India trades</text>

                {/* the price tag: a red shop tag with an angled end and a reinforced hole, on a string tied to the
                    basket's left rim, hanging out from the basket; it swings when the year changes */}
                <path d="M140 321 Q120 334 124 366" fill="none" className="tag-string" />
                <g transform="translate(124 368) rotate(-13)">
                    <g className={`price-tag ${later ? "is-swinging" : ""}`} key={`tag-${later}`}>
                        <path d="M12 2 L-8 -30 H-110 Q-116 -30 -116 -24 V28 Q-116 34 -110 34 H-8 Z" fill="#000" fillOpacity={0.22} transform="translate(3 5)" />
                        <path d="M12 2 L-8 -30 H-110 Q-116 -30 -116 -24 V28 Q-116 34 -110 34 H-8 Z" fill="url(#tag-red)" stroke="#8e1d15" strokeWidth={1} />
                        <path d="M-10 -26 H-108 Q-112 -26 -112 -22 V24 Q-112 30 -108 30 H-10" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="3 2" />
                        <circle cx={-2} cy={2} r={6.5} fill="#f4e9d8" stroke="#b8941f" strokeWidth={1.5} />
                        <circle cx={-2} cy={2} r={3.2} fill="var(--fig-bg)" />
                        <PriceRoll later={later} />
                        <text x={-60} y={24} textAnchor="middle" className="tag-month">{later ? monthName(MONTHS[N - 1]) : monthName(MONTHS[0])}</text>
                    </g>
                </g>

                {/* the wallet: its back, the notes, its front pocket, all leather with a grain and a shine */}
                <rect x={560} y={326} width={200} height={132} rx={16} fill="url(#leather)" filter="url(#grain)" />
                <rect x={564} y={330} width={192} height={124} rx={13} fill="none" stroke="#d9b48c" strokeOpacity={0.55} strokeWidth={1.1} strokeDasharray="4 3" />
                {NOTES.map(n => {
                    const pay = paying(n);
                    const [ wx, wy ] = n.wallet, [ px, py, pr ] = n.paid;
                    return (
                        <g key={`${n.id}-${run}-${later}`} className={`note ${pay ? "is-paying" : ""}`}
                            style={{ "--wx" : `${wx}px`, "--wy" : `${wy}px`, "--px" : `${px}px`, "--py" : `${py}px`, "--pr" : `${pr}deg`, "--d" : `${(later ? n.delay + 1.0 : 2.0)}s`, transform : `translate(${wx}px, ${wy}px)` } as CSSProperties}>
                            <NoteArt value={n.value} />
                        </g>
                    );
                })}
                <path d="M560 386 H760 V442 Q760 458 744 458 H576 Q560 458 560 442 Z" fill="url(#leather-front)" filter="url(#grain)" />
                <path d="M560 386 H760 V442 Q760 458 744 458 H576 Q560 458 560 442 Z" fill="url(#shine)" />
                <path d="M561 387 H759" stroke="#c48f63" strokeWidth={1.6} strokeOpacity={0.8} />
                <path d="M570 397 H750 V440 Q750 448 742 448 H578 Q570 448 570 440 Z" fill="none" stroke="#e2c29a" strokeOpacity={0.65} strokeWidth={1.1} strokeDasharray="5 3.5" />
                <g transform="translate(730 420)">
                    <circle r={11} fill="#3f2414" />
                    <circle r={8.5} fill="url(#metal-gold)" stroke="#8a6418" strokeWidth={0.8} />
                    <ellipse cx={-2.5} cy={-3} rx={3} ry={1.6} fill="#fff" fillOpacity={0.7} transform="rotate(-30 -2.5 -3)" />
                </g>

                {/* the change: a ₹2 coin back into the wallet in 2026 */}
                {later && (
                    <g key={`change-${run}`} className="change-coin" transform="translate(520 205)">
                        <circle r={14} fill="url(#metal-silver)" stroke="#8b949e" />
                        <text y={5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#4b535c">₹{CHANGE}</text>
                    </g>
                )}

                {/* what was paid */}
                <text x={540} y={100} textAnchor="middle" className={`paid-note ${on ? "is-on" : ""}`} key={`paid-${later}-${run}`}>
                    {later ? `Paid ₹${PAID_2026}, ₹${CHANGE} back` : "Paid ₹100"}
                </text>
                {later && <text x={300} y={96} textAnchor="middle" className="time-jump" key={`jump-${run}`}>⏩ 22 years later</text>}
            </svg>
            {hover && (
                <div className="coin-tip" style={{ left : `${(hover.x / 800) * 100}%`, top : `${((hover.y - VIEW_TOP) / VIEW_H) * 100}%` }}>
                    <strong>{SIGN[hover.code]} {hover.name}</strong>
                    <span>{hover.weight.toFixed(1)}% of the basket</span>
                </div>
            )}
        </div>
    );
};

export default CoinBasket;
