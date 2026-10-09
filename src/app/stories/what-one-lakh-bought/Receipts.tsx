"use client";

// LOCAL COMPONENTS ====================================================================================================
import { DisplayUnit } from "./Showcase";

// DATA ================================================================================================================
import { FACTORS, FIRST, FROM_YEAR, HEADLINE, MASON_LAST, NOW, SUM, TO_YEAR, WHEAT_LAST, grams, inr, kg, pieceOf, rs, times } from "./data";
import { emo } from "./emoji";

// One receipt in two columns: the first year's bill for the sum beside the last year's bill for the same goods,
// re-priced by the workers' price index; and, apart, the gold, which the index does not bring back, as the set it was.

const Line = ({ label, note, a, b, total = false } : { label : string; note ? : string; a : string; b : string; total ? : boolean }) => (
    <div className={`receipt-row ${total ? "is-total" : ""}`}>
        <span className="receipt-label">{typeof label === "string" ? emo(label) : label}{note && <span className="receipt-note">{note}</span>}</span>
        <span className="receipt-value">{a}</span>
        <span className="receipt-value">{b}</span>
    </div>
);

export const Receipt = ({ indexSpan } : { indexSpan : string }) => (
    <div className="receipt receipt-two r2" role="group" aria-label={`A receipt in two columns: ₹${inr(SUM)} in ${FROM_YEAR}, and the same goods at ${TO_YEAR}'s prices, ${rs(HEADLINE.worthNow)}`}>
        <div className="receipt-row receipt-head-row">
            <span /><span>{FROM_YEAR}</span><span>{TO_YEAR}</span>
        </div>
        <Line label="The sum" note={`one lakh rupees in ${FROM_YEAR}; the same goods at ${TO_YEAR}'s prices, ${indexSpan}`} a={rs(SUM)} b={rs(HEADLINE.worthNow)} />
        <Line label="Workers' price index" note="2016 = 100, chained across its bases" a={`${FIRST.index.value}`} b={`${NOW.index.value}`} />
        <Line label="Total" note={`${times(HEADLINE.priceRise)} the ${FROM_YEAR} figure`} a={rs(SUM)} b={rs(HEADLINE.worthNow)} total />
        <p className="receipt-foot">
            The index is the consumer price index for industrial workers, its 1982, 2001 and 2016 bases joined with the Labour Bureau’s factors {FACTORS.to2001} and {FACTORS.to2016}.
        </p>
    </div>
);

// A plain receipt of what the sum bought on the other shelves, the first year against the last each series reaches:
// the mason's last is the last the Labour Bureau has published, wheat's the last marketing year.
export const ShelvesReceipt = () => (
    <div className="receipt receipt-two is-plain r1" role="group" aria-label={`What ₹${inr(SUM)} bought in ${FROM_YEAR} and in the last year of each series`}>
        <div className="receipt-row receipt-head-row">
            <span /><span>{FROM_YEAR}</span><span>{TO_YEAR}</span>
        </div>
        <Line label="🪙 Silver" a={kg(FIRST.silver.kg)} b={kg(NOW.silver.kg)} />
        <Line label="👷 A mason’s work" a={`${inr(FIRST.mason!.days)} days`} b={`${inr(MASON_LAST.mason.days)} days`} />
        <Line label="💵 US dollars" a={`$${inr(FIRST.usd.dollars)}`} b={`$${inr(NOW.usd.dollars)}`} />
        <Line label="🌾 Wheat at MSP, quintals" a={FIRST.wheat!.quintals.toFixed(1)} b={WHEAT_LAST.wheat.quintals.toFixed(1)} />
    </div>
);

// The gold as the display case it filled, the sum it cost on the plate struck through and what it costs at the last
// year's price written beside it.
export const GoldSet = () => (
    <div className="gold-set r3">
        <DisplayUnit label={`The display case of ${FROM_YEAR}: ${pieceOf(FIRST.gold.grams)}, ${grams(FIRST.gold.grams)}, which cost ₹${inr(SUM)} and costs ${rs(HEADLINE.necklaceNow)} at ${TO_YEAR}'s price, ${times(HEADLINE.ranAhead.gold)} what the index would give`}
            pc={{ year : FROM_YEAR, grams : grams(FIRST.gold.grams), piece : pieceOf(FIRST.gold.grams).replace(/^./, c => c.toUpperCase()), note : "", kind : "bridal", noYear : true,
                price : { was : rs(SUM), now : rs(HEADLINE.necklaceNow) } }} />
    </div>
);
