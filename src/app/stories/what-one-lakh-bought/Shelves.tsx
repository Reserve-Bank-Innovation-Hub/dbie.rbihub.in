"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";

// LOCAL COMPONENTS ====================================================================================================
import { Timeline } from "@components/Timeline/Timeline";
import { Figure } from "./chartKit";
import { FlatShelves } from "./FlatShelves";

// DATA ================================================================================================================
import { FROM_YEAR, SUM, TO_YEAR, YEARS, Year, inr, kg, grams } from "./data";
import { emo } from "./emoji";
import type { ShelfKey } from "./shelvesScene";
import type { StageShelf } from "./ShelvesStage";

// The 3D rack reaches the browser only, with three.js, the way the-women-who-stayed loads its farm.
const ShelvesStage = dynamic(() => import("./ShelvesStage"), { ssr : false, loading : () => <div className="shelves-stage is-loading" /> });

// Five shelves, one per thing, each holding what the sum bought in units: lumps of gold, bars of silver, fortnights of a
// mason's work, hundred-dollar notes, sacks of wheat. A year control runs from the first year to the last; the piles
// shrink or grow at their own rate as it moves, and the first year's pile stays as a ghost behind. A thing DBIE has no
// figure for in the chosen year shows an empty shelf and says so.

interface Shelf { key : ShelfKey; name : string; unit : string; per : number; of : (y : Year) => number | null; label : (y : Year) => string; }
const SHELVES : Shelf[] = [
    { key : "gold",   name : "🪎 Gold",          unit : "10 g each",   per : 10,  of : y => y.gold.grams,            label : y => grams(y.gold.grams) },
    { key : "silver", name : "🪙 Silver",        unit : "1 kg each",   per : 1,   of : y => y.silver.kg,             label : y => kg(y.silver.kg) },
    { key : "mason",  name : "👷 A mason’s work", unit : "fortnights of 12 days", per : 12, of : y => y.mason?.days ?? null, label : y => y.mason ? `${inr(y.mason.days)} days` : "not yet published" },
    { key : "usd",    name : "💵 US dollars",    unit : "$100 notes",  per : 100, of : y => y.usd.dollars,           label : y => `$${inr(y.usd.dollars)}` },
    { key : "wheat",  name : "🌾 Wheat at MSP",  unit : "10 quintals each", per : 10, of : y => y.wheat?.quintals ?? null, label : y => y.wheat ? `${y.wheat.quintals.toFixed(1)} quintals` : "not yet published" },
];

const TABLE = {
    head    : [ "Year", ...SHELVES.map(s => s.name) ],
    numeric : [ false, true, true, true, true, true ],
    rows    : YEARS.map(y => [ y.year, ...SHELVES.map(s => s.label(y)) ]),
};

// The years play on their own while the figure is on screen, a year at a time, round again after a pause at the
// end; a touch of the slider or the view toggle pauses them, and a play button sets them going again.
const STEP = 1100, HOLD = 2600;
// the receipt's card carries the figure's note, in both views
const NOTE = "Mumbai silver per kilogram; the Labour Bureau's daily wage for men, mason; the yearly average rupee–dollar rate; the support price for wheat by marketing year. The last year is a part year.";

// The receipt the page passes in sits in the figure's left column, under the slider and the note.
export const Shelves = ({ receipt } : { receipt ? : ReactNode }) => {
    const [ year, setYear ] = useState(FROM_YEAR);
    const [ playing, setPlaying ] = useState(true);
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useInView(rootRef, { amount : 0.4 });
    const prefersReduced = !!useReducedMotion();

    useEffect(() => {
        if (!playing || !inView || prefersReduced) return;
        const t = setTimeout(() => setYear(y => y >= TO_YEAR ? FROM_YEAR : y + 1), year >= TO_YEAR || year === FROM_YEAR ? HOLD : STEP);
        return () => clearTimeout(t);
    }, [ playing, inView, prefersReduced, year ]);
    const pause = () => setPlaying(false);
    // a phone gets the flat grid in place of the isometric rack, the page's own breakpoint
    const [ phone, setPhone ] = useState(false);
    useEffect(() => {
        const mq = matchMedia("(max-width: 900px)");
        const on = () => setPhone(mq.matches);
        on(); mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    const row = YEARS.find(y => y.year === year)!, first = YEARS[0];
    // each shelf's units this year, against the first year's pile, for the rack and its tags
    const stage = useMemo<StageShelf[]>(() => SHELVES.map(s => {
        const now = s.of(row), was = s.of(first) ?? 0;
        return { key : s.key, name : emo(s.name), unit : s.unit, count : s.label(row), have : now === null ? 0 : now / s.per, max : Math.ceil(was / s.per), missing : now === null };
    }), [ row, first ]);

    return (
        <div ref={rootRef} className="shelves-figure" onPointerDownCapture={e => { if (!(e.target as HTMLElement).closest(".timeline-play")) pause(); }} onKeyDownCapture={e => { if (!(e.target as HTMLElement).closest(".timeline-play")) pause(); }}>
        <Figure title={`What ₹${inr(SUM)} could buy, shelf by shelf`} className="figure-large figure-split" table={TABLE}
            aside={<div className="shelves-aside">{receipt}<p className="figure-note">{NOTE}</p></div>}>
            <div className="shelves">
                <div className="shelf-control r1">
                    <Timeline min={FROM_YEAR} max={TO_YEAR} value={year} onChange={v => { pause(); setYear(v); }} playing={playing} onPlay={prefersReduced ? undefined : setPlaying} />
                </div>
                {phone ? <FlatShelves shelves={stage} /> : <ShelvesStage shelves={stage} />}
            </div>
        </Figure>
        </div>
    );
};
