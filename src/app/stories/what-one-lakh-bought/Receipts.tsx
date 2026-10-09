"use client";

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

// DATA ================================================================================================================
import { FACTORS, FIRST, FROM_YEAR, HEADLINE, NOW, SUM, TO_YEAR, grams, inr, rs, times } from "./data";

// Two receipts, side by side: the first year's bill for the sum, and the last year's bill for the same goods, re-priced
// by the workers' price index; and beneath them one line for the gold, which the index does not bring back.

const Line = ({ label, value, note, total = false } : { label : ReactNode; value : string; note ? : string; total ? : boolean }) => (
    <div className={`receipt-line ${total ? "is-total" : ""}`}>
        <span className="receipt-label">{label}{note && <span className="receipt-note">{note}</span>}</span>
        <span className="receipt-value">{value}</span>
    </div>
);

export const Receipts = ({ indexSpan } : { indexSpan : string }) => (
    <div className="receipts" role="group" aria-label={`Two receipts: ₹${inr(SUM)} in ${FROM_YEAR}, and the same goods at ${TO_YEAR}'s prices, ${rs(HEADLINE.worthNow)}`}>
        <div className="receipt r1">
            <div className="receipt-head"><span>Receipt</span><span>{FROM_YEAR}</span></div>
            <Line label="A sum of money" value={rs(SUM)} note="one lakh rupees, in the year's own prices" />
            <Line label="Workers' price index" value={`${FIRST.index.value}`} note="2016 = 100, chained" />
            <Line label="Total" value={rs(SUM)} total />
        </div>
        <div className="receipt r2">
            <div className="receipt-head"><span>Receipt</span><span>{TO_YEAR}</span></div>
            <Line label="The same goods" value={rs(HEADLINE.worthNow)} note={`at ${TO_YEAR}'s prices, ${indexSpan}`} />
            <Line label="Workers' price index" value={`${NOW.index.value}`} note={`${times(HEADLINE.priceRise)} the ${FROM_YEAR} figure`} />
            <Line label="Total" value={rs(HEADLINE.worthNow)} total />
        </div>
        <div className="receipt receipt-gold r3">
            <Line label={`📿 The gold, ${grams(FIRST.gold.grams)}`} value={rs(HEADLINE.necklaceNow)} note={`at ${TO_YEAR}'s price, ${rs(NOW.gold.price)} per 10 g: ${times(HEADLINE.ranAhead.gold)} what the index would give`} />
        </div>
        <p className="receipt-foot r3">
            The index is the consumer price index for industrial workers, its 1982, 2001 and 2016 bases joined with the Labour Bureau’s factors {FACTORS.to2001} and {FACTORS.to2016}.
        </p>
    </div>
);
