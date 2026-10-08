"use client";

// The ₹1 lakh lens: what ₹1 lakh fetched in US dollars at each financial year's average rate, drawn as $100 notes,
// with the first year's notes left as outlines so the ones lost stay in view. The other way round, what a $1,000 fee
// cost in rupees. Each note is $100; the last one is cut to the remainder.

// REACT CORE ==========================================================================================================
import { useState } from "react";

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE } from "./chartKit";
import { AnimatedNumber } from "./Motion";
import { YEARLY, inr } from "./data";

const FIRST = YEARLY[0];
const NOTES0 = Math.ceil(1e5 / FIRST.usd / 100);

export const LakhDollars = () => {
    const [ k, setK ] = useState(YEARLY.length - 1);
    const y = YEARLY[k];
    const dollars = 1e5 / y.usd;
    const whole = Math.floor(dollars / 100), part = dollars / 100 - whole;
    return (
        <div className="lakh">
            <div className="lakh-head">
                <p className="lakh-big">
                    ₹1 lakh = <strong>$<AnimatedNumber value={Math.round(dollars)} format={v => inr(Math.round(v))} /></strong>
                    <span> in {y.fy}</span>
                </p>
                <p className="lakh-side">
                    A $1,000 fee: <strong>₹<AnimatedNumber value={Math.round(1000 * y.usd)} format={v => inr(Math.round(v))} /></strong>
                    <span>{` (₹${inr(Math.round(1000 * FIRST.usd))} in ${FIRST.fy})`}</span>
                </p>
            </div>
            <div className="lakh-notes" role="img" aria-label={`₹1 lakh bought $${inr(Math.round(dollars))} in ${y.fy}, against $${inr(Math.round(1e5 / FIRST.usd))} in ${FIRST.fy}; each note is $100`}>
                {Array.from({ length : NOTES0 }, (_, i) => {
                    const fill = i < whole ? 1 : i === whole ? part : 0;
                    return (
                        <div key={i} className="lakh-note">
                            <motion.div className="lakh-note-fill" initial={false} animate={{ scaleX : fill }} transition={{ duration : 0.6, ease : EASE, delay : 0.015 * (NOTES0 - i) }} />
                            <span>$100</span>
                        </div>
                    );
                })}
            </div>
            <input className="lakh-range" type="range" min={0} max={YEARLY.length - 1} value={k} onChange={e => setK(+e.target.value)}
                aria-label="Financial year" aria-valuetext={y.fy} />
            <div className="lakh-years"><span>{FIRST.fy}</span><span>{YEARLY.at(-1)!.fy}</span></div>
            <p className="lakh-note-text">{`Each note is $100 at the year’s average rate, from ₹${FIRST.usd.toFixed(2)} a dollar in ${FIRST.fy} to ₹${y.usd.toFixed(2)} in ${y.fy}. Outlines are the notes ₹1 lakh fetched in ${FIRST.fy}. Prices in India rose over the same years, so ₹1 lakh also bought less at home; this counts only what it fetched in dollars.`}</p>
        </div>
    );
};
