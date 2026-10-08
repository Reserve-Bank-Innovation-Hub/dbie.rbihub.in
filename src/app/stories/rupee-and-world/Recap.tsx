"use client";

// The close of the story: the three measures side by side, each with the picture it had in the opening (a dollar coin,
// the basket of currency coins, the batch of shoes on a brass plaque), the question it answers, its line from April
// 2004 drawn small, and its first and latest value. The cards rise in one after another as they come into view.

// REACT CORE ==========================================================================================================
import { CSSProperties, ReactNode, useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// DATA ================================================================================================================
import { COST, MONTHS, N, USD, monthName } from "./data";

const EASE_OUT = [ 0.16, 1, 0.3, 1 ] as const;

// A line drawn small, with a soft fill under it and a dot at its end; it draws itself in when the card shows. All three
// share one scale (April 2004 = 100, from the lowest to the highest of the three), so the dollar climbs, the basket
// climbs less, and the shoes stay near where they began, as they did: a scale of its own would make each look alike.
const SHARED = [ ...COST.usd, ...COST.neer, ...COST.reer ];
const LO = Math.min(...SHARED), HI = Math.max(...SHARED);
const Spark = ({ values, colour } : { values : number[]; colour : string }) => {
    const w = 260, h = 64, lo = LO, hi = HI;
    const pts = values.map((v, i) => [ 4 + (w - 8) * i / (values.length - 1), h - 6 - (h - 14) * (v - lo) / (hi - lo || 1) ]);
    const d = pts.map(([ x, y ], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const [ ex, ey ] = pts[pts.length - 1];
    return (
        <svg className="recap-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ "--c" : colour } as CSSProperties}>
            <path d={`${d} L${ex} ${h} L4 ${h} Z`} className="spark-fill" />
            <motion.path d={d} className="spark-line" initial={{ pathLength : 0 }} whileInView={{ pathLength : 1 }}
                viewport={{ once : true, amount : 0.6 }} transition={{ duration : 1.4, ease : EASE_OUT, delay : 0.3 }} />
            <circle cx={ex} cy={ey} r={3.5} className="spark-dot" />
        </svg>
    );
};

// The three pictures, drawn small.
const DollarCoin = () => (
    <svg viewBox="0 0 80 80" className="recap-art" aria-hidden="true">
        <defs><radialGradient id="rc-gold" cx="35%" cy="30%"><stop offset="0" stopColor="#fff6d6" /><stop offset="0.5" stopColor="#e6bf55" /><stop offset="0.85" stopColor="#b98a2a" /><stop offset="1" stopColor="#8a6418" /></radialGradient></defs>
        <ellipse cx={40} cy={72} rx={22} ry={4} fill="#000" fillOpacity={0.15} />
        <circle cx={40} cy={38} r={28} fill="url(#rc-gold)" stroke="#8a6418" />
        <circle cx={40} cy={38} r={22} fill="none" stroke="#94691b" strokeOpacity={0.5} />
        <text x={40} y={48} textAnchor="middle" fontSize={30} fontWeight={800} fill="#7a5512">$</text>
        <ellipse cx={30} cy={25} rx={9} ry={4} fill="#fff" fillOpacity={0.55} transform="rotate(-30 30 25)" />
    </svg>
);
const MiniBasket = () => (
    <svg viewBox="0 0 80 80" className="recap-art" aria-hidden="true">
        <defs>
            <pattern id="rc-weave" width="10" height="7" patternUnits="userSpaceOnUse">
                <rect width="10" height="7" fill="#c99a57" /><path d="M0 2 Q2.5 0 5 2 T10 2" fill="none" stroke="#e6c38a" strokeWidth="2.2" /><path d="M0 5.5 Q2.5 7 5 5.5 T10 5.5" fill="none" stroke="#a7783c" strokeWidth="1.4" />
            </pattern>
        </defs>
        <ellipse cx={40} cy={74} rx={26} ry={4} fill="#000" fillOpacity={0.15} />
        <path d="M14 38 C14 6, 66 6, 66 38" fill="none" stroke="#b08445" strokeWidth={3.5} />
        {[ [ 27, 34, 9, "#e6bf55", "€" ], [ 42, 31, 8, "#cfd5dc", "¥" ], [ 54, 35, 7, "#d39468", "$" ], [ 35, 26, 6, "#d39468", "£" ], [ 48, 24, 5, "#e6bf55", "₩" ] ].map(([ x, y, r, f, t ]) => (
            <g key={String(t)}><circle cx={x as number} cy={y as number} r={r as number} fill={f as string} stroke="#00000033" /><text x={x as number} y={(y as number) + (r as number) * 0.35} textAnchor="middle" fontSize={(r as number) * 1.1} fontWeight={800} fill="#00000088">{t}</text></g>
        ))}
        <path d="M10 38 L70 38 L64 70 Q63 72 61 72 L19 72 Q17 72 16 70 Z" fill="url(#rc-weave)" stroke="#8d6631" />
        <path d="M9 38 H71" stroke="#8a5f2c" strokeWidth={4} strokeLinecap="round" />
    </svg>
);
const ShoesOnPlaque = () => (
    <svg viewBox="0 0 80 80" className="recap-art" aria-hidden="true">
        <defs><linearGradient id="rc-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1d27a" /><stop offset="1" stopColor="#9a7120" /></linearGradient></defs>
        <ellipse cx={40} cy={74} rx={24} ry={4} fill="#000" fillOpacity={0.15} />
        <text x={40} y={44} textAnchor="middle" fontSize={34}>👞</text>
        <rect x={20} y={50} width={40} height={20} rx={4} fill="url(#rc-brass)" stroke="#7a5512" />
        <rect x={22} y={52} width={36} height={16} rx={3} fill="#fde4df" stroke="#d06a5c" strokeWidth={0.8} />
        <text x={40} y={64} textAnchor="middle" fontSize={11} fontWeight={800} fill="#a3261a">{Math.round(COST.reer[N - 1])}</text>
    </svg>
);

interface RecapCard { art : ReactNode; kicker : string; question : string; from : string; to : string; note : string; values : number[]; colour : string; back : { how : string; source : string; url : string } }

// A card that turns over on a click, a tap or Enter: the front shows the measure, the back how it is made and where it
// comes from. Every card's rows line up with the others' (the grid's subgrid), so the small charts share one baseline.
const FlipCard = ({ c, i } : { c : RecapCard; i : number }) => {
    const [ flipped, setFlipped ] = useState(false);
    return (
        <motion.div role="listitem" className={`recap-card ${flipped ? "is-flipped" : ""}`} style={{ "--c" : c.colour } as CSSProperties}
            initial={{ opacity : 0, y : 36 }} whileInView={{ opacity : 1, y : 0 }} viewport={{ once : true, amount : 0.3 }}
            transition={{ duration : 0.8, ease : EASE_OUT, delay : i * 0.15 }}>
            <div className="recap-inner">
                <div className="recap-face recap-front" aria-hidden={flipped}>
                    <div className="recap-top">{c.art}<span className="recap-kicker">{c.kicker}</span></div>
                    <p className="recap-question">{c.question}</p>
                    <div>
                        <p className="recap-figures"><span className="recap-from">{c.from}</span><span className="recap-arrow" aria-label="to">→</span><span className="recap-to">{c.to}</span></p>
                        <p className="recap-when">{monthName(MONTHS[0])} to {monthName(MONTHS[N - 1])}</p>
                    </div>
                    <Spark values={c.values} colour={c.colour} />
                    <p className="recap-note">{c.note}</p>
                    <button type="button" className="recap-flip" onClick={() => setFlipped(true)} tabIndex={flipped ? -1 : 0}>How it is measured ↻</button>
                </div>
                <div className="recap-face recap-back" aria-hidden={!flipped}>
                    <span className="recap-kicker">{c.kicker}</span>
                    <p className="recap-back-title">How it is measured</p>
                    <p className="recap-back-text">{c.back.how}</p>
                    <a className="recap-source" href={c.back.url} target="_blank" rel="noopener" tabIndex={flipped ? 0 : -1}>{c.back.source} ↗</a>
                    <button type="button" className="recap-flip" onClick={() => setFlipped(false)} tabIndex={flipped ? 0 : -1}>↺ Back</button>
                </div>
            </div>
        </motion.div>
    );
};

export const Recap = ({ colours } : { colours : { usd : string; neer : string; reer : string } }) => {
    const usd = USD as number[];
    const CARDS : RecapCard[] = [
        { art : <DollarCoin />, kicker : "Measure 1 · rupees per dollar", question : "What does a dollar cost?",
          from : `₹${usd[0].toFixed(2)}`, to : `₹${usd[N - 1].toFixed(2)}`, values : COST.usd, colour : colours.usd,
          note : "For anyone paying in dollars: a student’s fees, an import bill, a holiday. Part of every move is the dollar’s own.",
          back : { how : "The Reserve Bank’s reference rate for the US dollar, averaged over each month’s working days. One currency, no weights, no prices: the number in the headlines.",
                   source : "Exchange rate of the Indian rupee, on DBIE", url : "/external/reer-and-neer" } },
        { art : <MiniBasket />, kicker : "Measure 2 · a basket of currencies", question : "What do India’s 40 trading partners’ currencies cost, all at once?",
          from : "₹100", to : `₹${Math.round(COST.neer[N - 1])}`, values : COST.neer, colour : colours.neer,
          note : "The rupee against the whole world it trades with, each currency weighted by trade: the NEER.",
          back : { how : "A weighted average of the rupee’s rate against 40 currencies, each weighted by its share of India’s trade (exports and imports). The Reserve Bank publishes it as an index, 2015-16 = 100; here it is turned into the basket’s rupee price.",
                   source : "RBI Bulletin, January 2021: the 40-currency indices", url : "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=20020" } },
        { art : <ShoesOnPlaque />, kicker : "Measure 3 · Indian goods, priced abroad", question : "Did Indian goods get cheaper for the countries that buy them?",
          from : "100", to : `${Math.round(COST.reer[N - 1])}`, values : COST.reer, colour : colours.reer,
          note : "The basket and India’s prices together: the REER. Over 22 years the two halves cancel; in between, they swing.",
          back : { how : "The basket’s rate, adjusted for consumer prices in India against those in the 40 partners, weighted the same way. The Reserve Bank publishes it, with the NEER, as an indicator of external competitiveness.",
                   source : "RBI Bulletin, December 2005: “used as indicators of external competitiveness”", url : "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=7129" } },
    ];
    return <div className="recap" role="list">{CARDS.map((c, i) => <FlipCard key={c.kicker} c={c} i={i} />)}</div>;
};

export default Recap;
