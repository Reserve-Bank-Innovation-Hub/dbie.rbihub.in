"use client";

// The currency constellation: the rupee at the centre, and every other currency at a distance from it that is what it
// costs in rupees, from 100 in April 2004 (the dashed ring). The basket of 40 currencies is a ring of coins, each as
// large as its trade weight; the four currencies RBI sets a reference rate for (the dollar, the euro, the pound and the
// yen) are planets on their own paths, from DBIE's monthly averages. Play runs the 268 months; the slider picks one.
// It is two of the story's steps on the stage: first in rupees, played from 2004; then, after the answer, turned to
// prices, so the reader watches the ring settle back on the dashed one.
// "Adjusted for prices" turns the basket's ring into what Indian goods cost abroad (the REER from 100): the ring
// settles back on the dashed one. The four planets have no price adjustment on DBIE (that needs each country's own
// prices), so they fade in that view rather than be guessed at. Drawn flat: plain discs, no shading or shadows.

// REACT CORE ==========================================================================================================
import { CSSProperties, useEffect, useMemo, useState } from "react";

// ANIMATION ===========================================================================================================
import { useReducedMotion } from "framer-motion";

// DATA ================================================================================================================
import { Basket, MONTHS, N, PARTNERS, RATES, SERIES_OF, USD, monthName } from "./data";

const SIGN : Record<string, string> = {
    EUR : "€", CNY : "¥", AED : "د.إ", USD : "$", SAR : "﷼", CHF : "Fr", HKD : "HK$", IDR : "Rp", SGD : "S$", IQD : "ع.د",
    KRW : "₩", KWD : "د.ك", JPY : "¥", QAR : "ر.ق", NGN : "₦", GBP : "£", MYR : "RM", IRR : "﷼", AUD : "A$", ZAR : "R",
    BRL : "R$", THB : "฿", VND : "₫", BDT : "৳", TWD : "NT$", AOA : "Kz", RUB : "₽", TRY : "₺", MXN : "Mex$", ILS : "₪",
    LKR : "Rs", CAD : "C$", EGP : "E£", OMR : "ر.ع.", NPR : "रू", KES : "KSh", TZS : "TSh", CLP : "CLP$", UAH : "₴", GHS : "₵",
};
const from100 = (xs : number[]) => xs.map(v => 100 * v / xs[0]);

// The four planets: rupees for one unit (the yen per 100), from 100 in April 2004; each on its own bearing.
const PLANETS = [
    { code : "USD", name : "US dollar",     series : from100(USD as number[]), angle : -62,  metal : "gold" },
    { code : "EUR", name : "Euro",          series : from100(RATES.EUR),       angle : 28,   metal : "gold" },
    { code : "GBP", name : "Pound sterling", series : from100(RATES.GBP),      angle : 152,  metal : "silver" },
    { code : "JPY", name : "Yen",           series : from100(RATES.JPY),       angle : 228,  metal : "silver" },
] as const;

// The scale: 100 sits on the dashed ring; the farthest any currency goes is the dollar's 218.
const C = 300, R100 = 112, rOf = (v : number) => R100 * v / 100;
const MAX_W = PARTNERS[0]?.weight ?? 1;
const pol = (r : number, deg : number) => [ C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180) ] as const;

export const Constellation = ({ active, realView } : { active : boolean; realView : boolean }) => {
    const reduced = useReducedMotion();
    const [ m, setM ] = useState(N - 1);
    const [ playing, setPlaying ] = useState(false);
    const [ real, setReal ] = useState(realView);
    const basket = "40t" as Basket;
    const [ hover, setHover ] = useState<{ x : number; y : number; head : string; line : string } | null>(null);

    // on arrival: the first visit plays the 268 months in rupees; the second starts in rupees at the latest month and,
    // a moment later, turns the ring to prices
    useEffect(() => {
        if (!active) { setPlaying(false); return; }
        if (!realView) { setReal(false); if (reduced) setM(N - 1); else { setM(0); setPlaying(true); } return; }
        setPlaying(false); setM(N - 1); setReal(false);
        const t = window.setTimeout(() => setReal(true), reduced ? 0 : 900);
        return () => clearTimeout(t);
    }, [ active, realView, reduced ]);
    useEffect(() => {
        if (!playing) return;
        let raf = 0, last = performance.now(), acc = 0;
        const tick = (t : number) => {
            acc += (t - last) / 1000 * 34; last = t;                   // about 34 months a second: 8 s for the run
            if (acc >= 1) {
                const step = Math.floor(acc); acc -= step;
                setM(v => { const n = Math.min(N - 1, v + step); if (n === N - 1) setPlaying(false); return n; });
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [ playing ]);

    const neer = SERIES_OF[basket].neer, reer = SERIES_OF[basket].reer;
    const basketNow = 100 * neer[0] / neer[m];                         // the basket's rupee price, from 100
    const realNow = 100 * reer[m] / reer[0];                            // what Indian goods cost abroad, from 100
    const ringV = real ? realNow : basketNow;
    const ringR = rOf(ringV);

    // the basket's coins, evenly round the ring, the heaviest at the top; the 6-currency basket draws only its six
    const ringCoins = useMemo(() => {
        const six = [ "USD", "EUR", "GBP", "JPY", "CNY", "HKD" ];
        const list = basket === "6" ? PARTNERS.filter(p => six.includes(p.iso)) : PARTNERS;
        // round the ring from just right of the top, leaving a gap at the top for the scale's labels
        return list.map((p, k) => ({ ...p, angle : -76 + (k / Math.max(1, list.length - 1)) * 332, r : 4 + 9 * Math.sqrt(p.weight / MAX_W) }));
    }, [ basket ]);

    // each planet's path from the dashed ring at 100 to where it is now, a straight dashed spoke
    const trail = (series : readonly number[], angle : number) => {
        const [ x0, y0 ] = pol(R100, angle), [ x1, y1 ] = pol(rOf(series[m]), angle);
        return `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };

    const toggle = () => {
        if (m === N - 1 && !playing) { setM(0); setPlaying(true); return; }
        setPlaying(p => !p);
    };

    return (
        <div className={`constellation is-embedded ${real ? "is-real" : ""}`}>
            {/* the month's reading and the switch between views, over the top-left corner */}
            <div className="cn-side">
                <div className="cn-readout">
                    <span className="cn-month">{monthName(MONTHS[m])}</span>
                    <span className="cn-basket-value" style={{ "--c" : real ? "var(--c-reer)" : "var(--c-neer)" } as CSSProperties}>
                        {real ? Math.round(ringV) : `₹${Math.round(ringV)}`}
                    </span>
                    <span className="cn-basket-label">{real ? "the ring, adjusted for prices: what Indian goods cost abroad" : "the ring: the basket that cost ₹100 in April 2004"}</span>
                    {real && <span className="cn-faded-note">The four planets fade: DBIE carries no price adjustment for each country on its own.</span>}
                </div>
                <div className="seg" role="radiogroup" aria-label="Measure">
                    <button type="button" role="radio" aria-checked={!real} className={!real ? "is-on" : ""} onClick={() => setReal(false)}>In rupees</button>
                    <button type="button" role="radio" aria-checked={real} className={real ? "is-on" : ""} onClick={() => setReal(true)}>Adjusted for prices</button>
                </div>
            </div>

            <div className="cn-stage">
                <svg viewBox="0 0 600 600" className="cn-svg" role="img"
                    aria-label={`${monthName(MONTHS[m])}: the basket at ${Math.round(ringV)}${real ? " adjusted for prices" : " rupees"}; dollar ${Math.round(PLANETS[0].series[m])}, euro ${Math.round(PLANETS[1].series[m])}, pound ${Math.round(PLANETS[2].series[m])}, yen ${Math.round(PLANETS[3].series[m])}, all from 100 in April 2004.`}>


                    {/* the scale: faint rings every 50, the dashed ring at 100 */}
                    {[ 50, 150, 200 ].map(v => (
                        <g key={v} className="cn-ring-guide">
                            <circle cx={C} cy={C} r={rOf(v)} />
                            <text x={C} y={C - rOf(v) - 4} textAnchor="middle">{v}</text>
                        </g>
                    ))}
                    <circle cx={C} cy={C} r={R100} className="cn-ring-100" />
                    <text x={C} y={C - R100 - 5} textAnchor="middle" className="cn-ring-100-label">100 · April 2004</text>

                    {/* the basket's ring and its coins */}
                    <circle cx={C} cy={C} r={ringR} className={`cn-basket-ring ${real ? "is-real" : ""}`} />
                    {ringCoins.map(c => {
                        const [ x, y ] = pol(ringR, c.angle);
                        return (
                            <g key={c.iso} className="cn-coin" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                                onPointerEnter={() => setHover({ x, y, head : `${SIGN[c.iso]} ${c.country}`, line : `${c.weight.toFixed(1)}% of the basket` })}
                                onPointerLeave={() => setHover(null)}>
                                <circle r={c.r} className={c.weight > 2 ? "is-gold" : "is-silver"} />
                                {c.r > 7 && <text y={c.r * 0.36} textAnchor="middle" fontSize={c.r * (SIGN[c.iso].length > 1 ? 0.62 : 1)}>{SIGN[c.iso]}</text>}
                            </g>
                        );
                    })}

                    {/* the four planets, their trails, and their readings */}
                    {PLANETS.map(p => {
                        const [ x, y ] = pol(rOf(p.series[m]), p.angle);
                        const right = Math.cos(p.angle * Math.PI / 180) >= 0;
                        return (
                            <g key={p.code} className={`cn-planet ${real ? "is-faded" : ""}`}>
                                <path d={trail(p.series, p.angle)} className="cn-trail" />
                                <circle cx={x} cy={y} r={17} className={`cn-planet-body is-${p.metal}`} />
                                <text x={x} y={y + 6.5} textAnchor="middle" className="cn-planet-sign">{SIGN[p.code]}</text>
                                <text x={x + (right ? 24 : -24)} y={y - 3} textAnchor={right ? "start" : "end"} className="cn-planet-name">{p.name}</text>
                                <text x={x + (right ? 24 : -24)} y={y + 14} textAnchor={right ? "start" : "end"} className="cn-planet-value">{Math.round(p.series[m])}</text>
                            </g>
                        );
                    })}

                    {/* the rupee */}
                    <circle cx={C} cy={C} r={26} className="cn-rupee" />
                    <text x={C} y={C + 9} textAnchor="middle" className="cn-rupee-sign">₹</text>
                </svg>

                {hover && (
                    <div className="cn-tip" style={{ left : `${(hover.x / 600) * 100}%`, top : `${(hover.y / 600) * 100}%` }}>
                        <strong>{hover.head}</strong><span>{hover.line}</span>
                    </div>
                )}
            </div>

            <div className="cn-time">
                <button type="button" className="cn-play" onClick={toggle} aria-label={playing ? "Pause" : "Play the months"}>{playing ? "❚❚" : "▶"}</button>
                <input type="range" min={0} max={N - 1} step={1} value={m} aria-label="Month" aria-valuetext={monthName(MONTHS[m])}
                    onChange={e => { setPlaying(false); setM(+e.target.value); }} />
                <span className="cn-years"><span>{MONTHS[0].slice(0, 4)}</span><span>{MONTHS[N - 1].slice(0, 4)}</span></span>
            </div>
        </div>
    );
};

export default Constellation;
