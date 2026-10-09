"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useId, useState } from "react";

// DATA ================================================================================================================
import { FROM_YEAR, HEADLINE, MASON_LAST, NOW, SUM, TO_YEAR, WHEAT_LAST, YEARS, inr, kg, grams, monthName, rs } from "./data";
import { emo } from "./emoji";

// The reader's own bill: any year and any sum, and the five shelves are worked out for it, since each scales with the
// sum; under each quantity is what that quantity costs at the last price DBIE carries, the mason's and wheat's being a
// year behind the rest. The state is in the address, so the page can be shared as it stands.
const MIN = 10_000, MAX = 10_00_000, STEP = 1_000;
const clampSum = (v : number) => Math.min(MAX, Math.max(MIN, Math.round(v / STEP) * STEP));

export const OwnBill = () => {
    const [ year, setYear ] = useState(FROM_YEAR);
    const [ sum, setSum ]   = useState(SUM);
    const idY = useId(), idS = useId();

    // The address's year and sum, read once in the browser; writes go back as the reader changes them.
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const y = +(q.get("year") ?? ""), s = +(q.get("amount") ?? "");
        if (y >= FROM_YEAR && y <= TO_YEAR) setYear(y);
        if (s >= MIN && s <= MAX) setSum(clampSum(s));
    }, []);
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        if (year === FROM_YEAR && sum === SUM) { q.delete("year"); q.delete("amount"); } else { q.set("year", `${year}`); q.set("amount", `${sum}`); }
        const qs = q.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    }, [ year, sum ]);

    const row = YEARS.find(y => y.year === year)!;
    const k = sum / SUM;
    // The quantity priced at the last year's price: a value with the year it is priced in.
    const Worth = ({ value, year : at } : { value : number; year : number }) => <span className="receipt-worth">{rs(Math.round(value))} in {at} prices</span>;
    return (
        <div className="own-bill" role="group" aria-label="Your own bill: choose a year and a sum">
            <div className="bill-controls r1">
                <div className="bill-fields">
                    <label htmlFor={idY}><span>Year</span>
                        <select id={idY} value={year} onChange={e => setYear(+e.target.value)}>{YEARS.map(y => <option key={y.year} value={y.year}>{y.year}</option>)}</select>
                    </label>
                    <label htmlFor={idS}><span>Sum in rupees, ₹{inr(MIN)} to ₹{inr(MAX)}</span>
                        <input id={idS} type="number" inputMode="numeric" min={MIN} max={MAX} step={STEP} value={sum} onChange={e => setSum(+e.target.value || MIN)} onBlur={e => setSum(clampSum(+e.target.value || MIN))} />
                    </label>
                </div>
            </div>
            <div className="bill r2">
                <p className="bill-title">What {rs(sum)} could buy you in the year {year}</p>
                <div className="receipt-line"><span className="receipt-label">{emo("🪎 Gold")}<span className="receipt-note">Mumbai, {rs(row.gold.price)} per 10 g{row.gold.months < 12 ? `, ${row.gold.months} months` : ""}</span></span><span className="receipt-value">{grams(row.gold.grams * k)}<Worth value={row.gold.grams * k / 10 * NOW.gold.price} year={NOW.year} /></span></div>
                <div className="receipt-line"><span className="receipt-label">{emo("🪙 Silver")}<span className="receipt-note">Mumbai, {rs(row.silver.price)} per kg</span></span><span className="receipt-value">{kg(row.silver.kg * k)}<Worth value={row.silver.kg * k * NOW.silver.price} year={NOW.year} /></span></div>
                <div className="receipt-line"><span className="receipt-label">{emo("👷 A mason’s work")}<span className="receipt-note">{row.mason ? `rural men’s wage, ${rs(row.mason.wage)} a day` : "not yet published for this year"}</span></span><span className="receipt-value">{row.mason ? <>{`${inr(Math.round(row.mason.days * k))} days`}<Worth value={row.mason.days * k * MASON_LAST.mason.wage} year={MASON_LAST.year} /></> : "–"}</span></div>
                <div className="receipt-line"><span className="receipt-label">{emo("💵 US dollars")}<span className="receipt-note">₹{row.usd.rate} a dollar, yearly average</span></span><span className="receipt-value">${inr(Math.round(row.usd.dollars * k))}<Worth value={row.usd.dollars * k * NOW.usd.rate} year={NOW.year} /></span></div>
                <div className="receipt-line"><span className="receipt-label">{emo("🌾 Wheat at MSP")}<span className="receipt-note">{row.wheat ? `${rs(row.wheat.price)} a quintal, ${row.wheat.cropYear}` : "not yet published for this year"}</span></span><span className="receipt-value">{row.wheat ? <>{`${(row.wheat.quintals * k).toFixed(1)} quintals`}<Worth value={row.wheat.quintals * k * WHEAT_LAST.wheat.price} year={WHEAT_LAST.year} /></> : "–"}</span></div>
                <p className="bill-foot">Prices as published on DBIE: gold to {monthName(HEADLINE.last.gold)}, the index to {monthName(HEADLINE.last.index)}, the mason’s wage to {monthName(HEADLINE.last.mason)}, the dollar to {HEADLINE.last.usd}, wheat to {HEADLINE.last.wheat}.</p>
            </div>
        </div>
    );
};
