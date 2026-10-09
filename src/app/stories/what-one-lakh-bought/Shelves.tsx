"use client";

// REACT CORE ==========================================================================================================
import { useId, useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { Figure } from "./chartKit";

// DATA ================================================================================================================
import { FROM_YEAR, SUM, TO_YEAR, YEARS, Year, inr, kg, grams } from "./data";

// Five shelves, one per thing, each holding what the sum bought in units: lumps of gold, bars of silver, fortnights of a
// mason's work, hundred-dollar notes, sacks of wheat. A year control runs from the first year to the last; the piles
// shrink or grow at their own rate as it moves, and the first year's pile stays as a ghost behind. A thing DBIE has no
// figure for in the chosen year says so.

interface Shelf { key : string; name : string; unit : string; per : number; of : (y : Year) => number | null; label : (y : Year) => string; }
const SHELVES : Shelf[] = [
    { key : "gold",   name : "🪙 Gold",          unit : "10 g each",   per : 10,  of : y => y.gold.grams,            label : y => grams(y.gold.grams) },
    { key : "silver", name : "🥈 Silver",        unit : "1 kg each",   per : 1,   of : y => y.silver.kg,             label : y => kg(y.silver.kg) },
    { key : "mason",  name : "👷 A mason’s work", unit : "fortnights of 12 days", per : 12, of : y => y.mason?.days ?? null, label : y => y.mason ? `${inr(y.mason.days)} days` : "not yet published" },
    { key : "usd",    name : "💵 US dollars",    unit : "$100 notes",  per : 100, of : y => y.usd.dollars,           label : y => `$${inr(y.usd.dollars)}` },
    { key : "wheat",  name : "🌾 Wheat at MSP",  unit : "10 quintals each", per : 10, of : y => y.wheat?.quintals ?? null, label : y => y.wheat ? `${y.wheat.quintals.toFixed(1)} quintals` : "not yet published" },
];

// A unit on a shelf: the shape by thing, and how much of it is there (a part unit is cut on the right).
const Unit = ({ k, fill } : { k : string; fill : number }) => (
    <svg className={`unit unit-${k}`} viewBox="0 0 14 14" width={14} height={14} aria-hidden="true">
        <defs><clipPath id={`u-${k}-${Math.round(fill * 100)}`}><rect x={0} y={0} width={14 * fill} height={14} /></clipPath></defs>
        <g className="unit-ghost"><UnitShape k={k} /></g>
        <g clipPath={`url(#u-${k}-${Math.round(fill * 100)})`}><UnitShape k={k} /></g>
    </svg>
);
const UnitShape = ({ k } : { k : string }) => k === "gold" ? <path d="M3 4h8l2 7H1z" />
    : k === "silver" ? <rect x={1.5} y={4} width={11} height={6} rx={1} />
    : k === "mason" ? <rect x={1.5} y={1.5} width={11} height={11} rx={1.5} />
    : k === "usd" ? <rect x={0.5} y={3.5} width={13} height={7} rx={1} />
    : <path d="M7 1.5c3 0 5 3 5 7 0 2.5-1 4-5 4s-5-1.5-5-4c0-4 2-7 5-7z" />;

const TABLE = {
    head    : [ "Year", ...SHELVES.map(s => s.name) ],
    numeric : [ false, true, true, true, true, true ],
    rows    : YEARS.map(y => [ y.year, ...SHELVES.map(s => s.label(y)) ]),
};

export const Shelves = () => {
    const [ year, setYear ] = useState(FROM_YEAR);
    const id = useId();
    const row = YEARS.find(y => y.year === year)!, first = YEARS[0];

    return (
        <Figure title={`What ₹${inr(SUM)} bought, shelf by shelf`} units="drag the year; the ghost is the first year's pile" table={TABLE}
            note="Mumbai silver per kilogram; the Labour Bureau's daily wage for men, mason; the yearly average rupee–dollar rate; the support price for wheat by marketing year. The last year is a part year.">
            <div className="shelves">
                <div className="shelf-control r1">
                    <label htmlFor={id}>Year</label>
                    <input id={id} type="range" min={FROM_YEAR} max={TO_YEAR} step={1} value={year} onChange={e => setYear(+e.target.value)} aria-valuetext={`${year}`} />
                    <output htmlFor={id} className="shelf-year">{year}</output>
                </div>
                {SHELVES.map((s, i) => {
                    const now = s.of(row), was = s.of(first) ?? 0;
                    const nUnits = Math.ceil(was / s.per);
                    const have = now === null ? 0 : now / s.per;
                    return (
                        <div key={s.key} className={`shelf-row r${i + 2} ${now === null ? "is-missing" : ""}`}>
                            <div className="shelf-name"><span>{s.name}</span><span className="shelf-unit">{s.unit}</span></div>
                            <div className="shelf-units" aria-hidden="true">
                                {Array.from({ length : nUnits }, (_, i) => <Unit key={i} k={s.key} fill={Math.max(0, Math.min(1, have - i))} />)}
                            </div>
                            <div className="shelf-count">{s.label(row)}</div>
                        </div>
                    );
                })}
            </div>
        </Figure>
    );
};
