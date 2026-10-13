"use client";

// REACT CORE ==========================================================================================================
import { CSSProperties, ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Portion, Row } from "fictoan-react";
import { useInView, useReducedMotion } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { Figure, FigureView, ViewToggle } from "./chartKit";

// DATA ================================================================================================================
import { HEADLINE, TO_YEAR, YEARS, times, timesWords, yearOf } from "./data";

// Gold against prices from the story's start year, as two piles that grow with the years, in 3D: one gold coin for
// every time the Mumbai price of gold has multiplied since the start year, stacked as coins are, and one crate of
// everyday things for every time prices in general have, by the industrial workers' index, stacked one on the next.
// The years run on their own while the chapter is in view, and any touch on the controls pauses them. What the past
// did from that year, not advice. The chapter's text comes in as `lead`; the running year and the
// chart-or-table toggle sit above the piles. The piles are drawn by RaceStage, loaded in the browser only.

const STEP = 700, HOLD = 2200;                                                  // ms between years, and at either end
const RaceStage = dynamic(() => import("./RaceStage"), { ssr : false, loading : () => <div className="race-stage is-loading" /> });

export const Race = ({ lead } : { lead : ReactNode }) => {
    const start = HEADLINE.againstFrom;                                        // the race runs from the story's default year
    const [ year, setYear ] = useState(HEADLINE.againstFrom);
    const [ playing, setPlaying ] = useState(true);
    const [ view, setView ] = useState<FigureView>("chart");
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useInView(rootRef, { amount : 0.4 });
    const prefersReduced = !!useReducedMotion();
    const idR = useId();
    const base = yearOf(start);
    const pts = useMemo(() => YEARS.filter(y => y.year >= start).map(y => ({ year : y.year, gold : y.gold.price / base.gold.price, prices : y.index.value / base.index.value })), [ start, base ]);
    const last = pts[pts.length - 1];
    const at = prefersReduced ? last : (pts.find(p => p.year === year) ?? last);

    // the years run from the chosen one to the latest, hold, and start again
    useEffect(() => {
        if (!playing || !inView || prefersReduced || view !== "chart") return;
        const t = setTimeout(() => setYear(y => y >= TO_YEAR ? start : y + 1), year >= TO_YEAR || year === start ? HOLD : STEP);
        return () => clearTimeout(t);
    }, [ playing, inView, prefersReduced, view, year, start ]);
    const pause = () => setPlaying(false);

    const table = {
        head    : [ "Year", `Gold, ${start} = 1`, `Prices, ${start} = 1` ],
        numeric : [ false, true, true ],
        strong  : [ pts.length - 1 ],                                            // the latest year
        rows    : pts.map(p => [ p.year, times(p.gold), times(p.prices) ]),
    };

    return (
        <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
            <Portion desktopSpan="9">
                {lead}
                <div className="race-card r1" aria-live="polite" aria-label={`From ${start} to ${TO_YEAR}, gold rose by ${times(last.gold)}, prices rose by ${times(last.prices)}: gold outpaced prices by ${timesWords(last.gold / last.prices)}.`}>
                    <p className="race-head">From {start} to {TO_YEAR},</p>
                    <p className="race-stats">
                        <span className="race-stat is-gold"><span>gold rose by</span><strong>{times(last.gold)}</strong></span>
                        <span className="race-stat is-prices"><span>prices rose by</span><strong>{times(last.prices)}</strong></span>
                        <span className="race-stat is-ratio"><span>gold outpaced prices by</span><strong>{times(last.gold / last.prices)}</strong></span>
                    </p>
                </div>
            </Portion>
            <Portion desktopSpan="1" />
            <Portion desktopSpan="14">
                <div ref={rootRef} onPointerDownCapture={pause} onKeyDownCapture={pause}>
                    <div className="race-controls r1">
                        {view === "chart" ? <div className="year-control">
                            {!prefersReduced && <button type="button" className={`play-dot ${playing ? "is-playing" : ""}`} aria-pressed={playing} aria-label={playing ? "Pause the years" : "Play the years"} onClick={() => setPlaying(p => !p)}>{playing ? "❚❚" : "▶"}</button>}
                            {/* the slider as a scrubber: a thin track filled to the year, the fives and the ends named beneath */}
                            <div className="timeline" style={{ "--pct" : `${(at.year - start) / Math.max(1, TO_YEAR - start) * 100}%` } as CSSProperties}>
                                <input id={idR} type="range" min={start} max={TO_YEAR} step={1} value={at.year} onChange={e => { pause(); setYear(+e.target.value); }} aria-label="Year" aria-valuetext={`${at.year}`} disabled={prefersReduced} />
                                <div className="timeline-ticks" aria-hidden="true">
                                    {pts.filter(p => p.year === start || p.year === TO_YEAR || (p.year % 5 === 0 && p.year - start >= 3 && TO_YEAR - p.year >= 3)).map(p => (
                                        <span key={p.year} className="tick" style={{ left : `${(p.year - start) / Math.max(1, TO_YEAR - start) * 100}%` }}><i>{p.year}</i></span>
                                    ))}
                                </div>
                            </div>
                            <output className="year-readout" htmlFor={idR}>{at.year}</output>
                        </div> : <span />}
                        <ViewToggle view={view} onView={setView} />
                    </div>
                    <Figure className="figure-large" table={table} view={view}>
                        <div className="r1">
                            <RaceStage gold={at.gold} prices={at.prices} max={{ gold : last.gold, prices : last.prices }}
                                piles={[ { count : times(at.gold), name : "Ten grams of gold", sub : "at the Mumbai price" }, { count : times(at.prices), name : "A crate of everyday things", sub : "by the industrial workers’ price index" } ]} />
                        </div>
                    </Figure>
                </div>
            </Portion>
        </Row>
    );
};
