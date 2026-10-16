"use client";

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import { Portion, Row } from "fictoan-react";
import { useInView, useReducedMotion } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { Timeline } from "@components/Timeline/Timeline";
import { Figure, type FigureView } from "./chartKit";
import { DisplayUnit, type Kind } from "./Showcase";

// DATA ================================================================================================================
import { FROM_YEAR, HEADLINE, SUM, TO_YEAR, YEARS, grams, gramsFor, inr, partYear, pieceOf, rs, yearOf } from "./data";

// The wedding year: the reader picks a year, and one display case, drawn as the jeweller's cases of "What ₹1 lakh
// could buy", shows what ₹1 lakh bought in gold that year: the piece its weight would make by the story's own
// thresholds, its weight and the piece on the plate. The case changes with the year, fading in afresh; the
// years run only once the play button is pressed, and a touch of the timeline pauses them. The chapter's title
// comes in as `lead`; the years' timeline and the view toggle sit under it, the case on the right.

// The design each year's case holds, set year by year: a year with no entry shows the case empty, its plate still
// carrying the year's figures, until its design is drawn.
// A design may carry its own name for the plate; one without names the piece by its weight, as pieceOf does.
const DESIGNS : Partial<Record<number, { kind : Kind; parts? : number; name? : string; band? : number; layers? : number; omit? : string[]; bangles? : number; extra? : string[] }>> = {
    1990 : { kind : "bridal", parts : 1, layers : 4, extra : [ "bajuband" ] },                  // the heaviest year, a fourth strand
    1991 : { kind : "bridal", parts : 1 },
    1992 : { kind : "bridal", parts : 1 },
    1993 : { kind : "bridal", parts : 1, omit : [ "ring" ] },
    1994 : { kind : "bridal", parts : 1, omit : [ "ring", "studs" ] },
    1995 : { kind : "bridal", parts : 1, omit : [ "ring", "studs", "tikka" ] },
    1996 : { kind : "bridal", parts : 1, omit : [ "ring", "studs", "tikka" ], bangles : 2 },
    2012 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },    // the 30s g years, the bands broader
    2013 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2014 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2015 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2016 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2017 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2018 : { kind : "bangles", name : "a pair of bangles", band : 8.5 },
    2019 : { kind : "bangles", name : "a pair of bangles" },
    2020 : { kind : "chain", name : "a chain with a pendant" },          // the chain with its flower pendant
    2021 : { kind : "chain", name : "a chain with a pendant" },
    2022 : { kind : "chain", name : "a chain with a pendant" },
    2023 : { kind : "fine-chain", parts : 1.4, name : "a chain" },     // the thin chain, thicker
    2024 : { kind : "fine-chain", name : "a thin chain" },
    2025 : { kind : "fine-chain", name : "a thin chain" },
    2026 : { kind : "ring" },
};
const designOf = (year : number) => DESIGNS[year] ?? { kind : "empty" as Kind, parts : undefined, name : undefined, band : undefined, layers : undefined, omit : undefined, bangles : undefined, extra : undefined };
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);


// What a year's case holds, in words, for the table: the bridal set by what it leaves out or adds, any other piece by
// its name; a year whose case is empty is left empty.
const PIECE_WORDS : Record<string, string> = { ring : "ring", studs : "studs", tikka : "tikka" };
const SHORT : Record<string, string> = { "a pair of bangles" : "Pair of bangles", "a chain with a pendant" : "Pendant chain", "a thin chain" : "Thin chain" };
const describe = (year : number, g : number) => {
    const d = DESIGNS[year];
    if (!d) return "";
    if (d.kind !== "bridal") { const n = d.name ?? pieceOf(g); return SHORT[n] ?? cap(n.replace(/^an? /, "")); }
    if (d.layers && d.layers > 3) return "Heavy bridal set, armlet";
    const without = (d.omit ?? []).map(k => PIECE_WORDS[k]);
    if (!without.length && d.bangles === undefined) return "Full bridal set";
    return [ "Bridal set", without.length ? `no ${without.join(", ")}` : "", d.bangles !== undefined ? `${d.bangles} bangles` : "" ].filter(Boolean).join(", ");
};
const TABLE_FOR = (sum : number) => ({
    head    : [ "Year", "Gold, ₹ per 10 g", `Grams for ₹${inr(sum)}`, "In the case" ],
    numeric : [ false, true, true, false ],
    rows    : YEARS.map(y => [ y.year, inr(y.gold.price), grams(gramsFor(y.year, sum)), describe(y.year, gramsFor(y.year, sum)) ]),
});

export const WeddingYear = ({ lead } : { lead : ReactNode }) => {
    const [ year, setYear ] = useState(HEADLINE.againstFrom);
    const sum = SUM;
    const [ playing, setPlaying ] = useState(false);                     // the years wait for the play button
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useInView(rootRef, { amount : 0.4 });
    const reduced = !!useReducedMotion();
    const [ view, setView ] = useState<FigureView>("chart");
    // the years run from the first to the latest a year at a time, hold at either end, and start again
    useEffect(() => {
        if (!playing || !inView || reduced || view !== "chart") return;
        const t = setTimeout(() => setYear(y => y >= TO_YEAR ? FROM_YEAR : y + 1), year >= TO_YEAR || year === FROM_YEAR ? 2200 : 900);
        return () => clearTimeout(t);
    }, [ playing, inView, reduced, view, year ]);
    const then = gramsFor(year, sum);
    const table = useMemo(() => TABLE_FOR(sum), [ sum ]);
    const last = yearOf(TO_YEAR);

    return (
        <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
            <Portion desktopSpan="9">
                <div ref={rootRef}>
                    {lead}
                    {/* the timeline only with the case; the table shows every year at once */}
                    {view === "chart" && (
                        <div className="wedding-timeline r1">
                            <Timeline min={FROM_YEAR} max={TO_YEAR} value={year} onChange={v => { setPlaying(false); setYear(v); }}
                                playing={playing} onPlay={reduced ? undefined : setPlaying} />
                        </div>
                    )}
                    <span className="view-toggle wedding-toggle r1" role="group" aria-label="Visual or table">
                        <button type="button" className={view === "chart" ? "is-on" : ""} aria-pressed={view === "chart"} onClick={() => setView("chart")}>See visual representation</button>
                        <button type="button" className={view === "table" ? "is-on" : ""} aria-pressed={view === "table"} onClick={() => setView("table")}>See table</button>
                    </span>
                </div>
            </Portion>
            <Portion desktopSpan="1" />
            <Portion desktopSpan="14">
        <Figure className="figure-large wedding-figure" table={table} view={view}
            note={`At the year's average Mumbai price of standard gold, before making charges and tax. The piece named is a guide to the weight, by the story's own thresholds, not a measure. ${TO_YEAR} is ${partYear(TO_YEAR, last.gold.months)}.`}>
            {/* keyed on the piece and the year, so a change fades the new case in */}
            <div className="wedding-case r1" key={year}>
                <DisplayUnit label={`${year}: ₹${inr(sum)} bought ${grams(then)} of gold, ${designOf(year).name ?? pieceOf(then)}`}
                    pc={{ year, grams : grams(then), piece : cap(designOf(year).name ?? pieceOf(then)), note : "", kind : designOf(year).kind, parts : designOf(year).parts, band : designOf(year).band, layers : designOf(year).layers, omit : designOf(year).omit, bangles : designOf(year).bangles, extra : designOf(year).extra }} />
            </div>
        </Figure>
            </Portion>
        </Row>
    );
};
