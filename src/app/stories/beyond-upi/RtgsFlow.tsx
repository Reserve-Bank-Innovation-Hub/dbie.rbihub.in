"use client";

// RTGS, step by step, as a clean isometric flowchart (RtgsIso.tsx) on a plain indivara ground: the sender, the
// sender's bank, the RBI, the beneficiary's bank and the recipient on one zigzag track, "RTGS" in a ring at the centre,
// each station's name and what it does lying flat beside it (after the RBI's RTGS FAQ). ₹500 bundles travel the track
// and stop a beat at the RBI, whose plinth glows. The years play from 2015-16: each year the traffic runs faster and
// denser, in proportion to that year's RTGS value, and the readout gives the year's average day. With reduced motion
// it is a still frame of the latest year.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { TimeBar } from "./Steps";
import { RtgsIso } from "./RtgsIso";
import { reducedMotion, useStage } from "./stage";

// DATA ================================================================================================================
import { EVENTS, FYS, PAY } from "./data.gen";

// STYLES ==============================================================================================================
import "./rtgs-flow.css";

const LAST = FYS.length - 1, YEAR_S = 1.7;                                 // seconds a year holds while playing
const V0 = PAY.rtgs.value[0] ?? 1;
const factor = (i : number) => (PAY.rtgs.value[i] ?? V0) / V0;
const EV = EVENTS.find(e => e.slide === "rtgs" && e.day.startsWith("2020"));
const EV_FROM = FYS.indexOf("2020-21");

// the RBI's own words on the 30 minutes, with its source, for the readout
const THIRTY = EVENTS.find(e => e.label === "Credit within 30 minutes");

export const RtgsFlowStep = ({ children } : { children : ReactNode }) => {
    const { ref, seen, size } = useStage<HTMLDivElement>();
    const [ yi, setYi ] = useState(0), [ playing, setPlaying ] = useState(false);
    const yRef = useRef(0);
    yRef.current = yi;
    // phones get the tall zigzag; the stage's own width says which
    const narrow = size.w > 0 && size.w < 640;

    // the year run: starts when the stage is mostly on screen
    useEffect(() => {
        if (reducedMotion()) { setYi(LAST); return; }
        if (seen) { setYi(0); setPlaying(true); }
    }, [ seen ]);
    useEffect(() => {
        if (!playing) return;
        if (yi >= LAST) { setPlaying(false); return; }
        const t = setTimeout(() => setYi(yi + 1), YEAR_S * 1000);
        return () => clearTimeout(t);
    }, [ playing, yi ]);

    const day = (PAY.rtgs.value[yi] ?? 0) / 365 / 1e5, count = (PAY.rtgs.volume[yi] ?? 0) / 365, times = factor(yi);
    return (
        <div className={`rf ${narrow ? "is-phone" : ""}`}>
            <div className="stage-words rf-words">{children}</div>
            <div className="rf-stage" ref={ref}>
                <RtgsIso narrow={narrow} factor={() => factor(yRef.current)}
                    label={`An isometric flowchart: an RTGS payment goes from the sender to the sender's bank, to the RBI, where it settles, to the beneficiary's bank, which must credit the recipient within 30 minutes. In ${FYS[yi]}, an average day carried ₹${day.toFixed(2)} lakh crore in ${count.toFixed(1)} lakh payments.`} />
            </div>
            <div className="rf-foot">
                <div className="rf-read" aria-live="polite">
                    <span className="read-month">{FYS[yi]}</span>
                    <span><b>₹{day.toFixed(2)}</b> lakh crore a day</span>
                    <span><b>{count.toFixed(1)}</b> lakh payments a day</span>
                    <span><b>{times.toFixed(1)}x</b> the value of {FYS[0]}</span>
                </div>
                <div className="rf-time">
                    <TimeBar i={yi} n={FYS.length} playing={playing}
                        toggle={() => { if (!playing && yi >= LAST) setYi(0); setPlaying(!playing); }}
                        seek={k => { setPlaying(false); setYi(k); }} ends={[ FYS[0], FYS[LAST] ]} name={k => FYS[k]} />
                    <p className="rf-unit">Faster and denser as the value grows: speed is in proportion to the year’s RTGS value.</p>
                    {THIRTY && <p className="event-line">The RBI: “{THIRTY.quote}” <a href={THIRTY.url}>Source</a></p>}
                    {EV && <p className={`event-line rf-event ${yi >= EV_FROM ? "is-shown" : ""}`}>{EV.note} <a href={EV.url}>Source</a></p>}
                </div>
            </div>
        </div>
    );
};
