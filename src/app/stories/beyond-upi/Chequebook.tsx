"use client";

// The average cheque, year by year, as a chequebook. The film opens on the book lying on a desk at an angle; the
// camera comes round to face it, the cover opens, and for each year from 2015-16 the top leaf is written for that
// year's average cheque (date, a payee, the amount in words and in figures, a signature), ripped along the perforation
// and dropped out of the frame; the counterfoil keeps a note of each one. Every field is written before the rip starts.
// The time bar plays, pauses and seeks; a sought year shows its cheque written, with nothing torn. With reduced motion
// the book is open, face on, on the last year's cheque. The payees are made up.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";
import { Kalam } from "next/font/google";

// LOCAL ===============================================================================================================
import { TimeBar, inWords } from "./Steps";
import { chequeSvg, dataUri } from "./instruments";
import { inr } from "./methods";
import { Layout, reducedMotion, splitClass, useStage } from "./stage";

// DATA ================================================================================================================
import { EVENTS, FYS, PAY } from "./data.gen";

// STYLES ==============================================================================================================
import "./chequebook.css";

// an Indian handwriting face, legible at a cheque's small sizes
const kalam = Kalam({ weight : [ "400", "700" ], subsets : [ "latin" ] });

const LAST = FYS.length - 1;
const AVG = FYS.map((_, i) => { const v = PAY.paper.value[i], n = PAY.paper.volume[i]; return v != null && n ? v * 1e7 / (n * 1e5) : 0; });
const BLANK = dataUri(chequeSvg());
// the film's beats, in milliseconds: the camera's move, the cover, the ink (done by 1.3 s), the rip, the fall
const PAN_MS = 1700, OPEN_MS = 1200, WRITE_MS = 1550, RIP_MS = 380, FALL_MS = 1500;
// made-up payees, one a year; none is meant to be a real firm or person
const PAYEES = [ "MK Traders Pvt Ltd", "Rajat Chauhan", "Shree Balaji Enterprises", "Neha Iyer", "Sai Krishna Hardware", "Anjali Deshmukh",
    "Om Logistics LLP", "Farhan Qureshi", "Gupta & Sons", "Kavya Textiles", "Prakash Medicals" ];
const payee = (k : number) => PAYEES[k % PAYEES.length];

// the amount in words over the cheque's two RUPEES lines
const twoLines = (v : number) : [ string, string ] => {
    const words = inWords(v).replace(/^Rupees /, "").split(" ");
    let a = "";
    while (words.length && `${a} ${words[0]}`.trim().length <= 34) a = `${a} ${words.shift()}`.trim();
    return [ a, words.join(" ") ];
};
const dateOf = (fy : string) => `3103${fy.slice(0, 2)}${fy.slice(5, 7)}`;
// the torn edge along the perforation: small teeth down the leaf's left side
const TEETH = `polygon(${Array.from({ length : 25 }, (_, i) => `${i % 2 ? 1.2 : 0}% ${i / 24 * 100}%`).join(", ")}, 100% 100%, 100% 0)`;

type Phase = "desk" | "front" | "write" | "rip" | "static";

// the ink on one leaf, drawn over the blank cheque in its own 400 × 180 units
const Ink = ({ k, animate } : { k : number; animate : boolean }) => {
    const [ w1, w2 ] = twoLines(AVG[k]);
    return (
        <svg viewBox="0 0 400 180" className={`cb-ink ${animate ? "is-writing" : ""}`} aria-hidden="true">
            <text className="cb-date" x="289" y="20.5">{dateOf(FYS[k])}</text>
            <text className="cb-hand cb-payee" x="44" y="54">{payee(k)}</text>
            <text className="cb-hand cb-w1" x="56" y="76">{w1}</text>
            <text className="cb-hand cb-w2" x="20" y="96">{w2}</text>
            <text className="cb-hand cb-fig" x="302" y="89.5">{inr(AVG[k])}/-</text>
            <path className="cb-sign" d={k % 2 ? "M290 121 c5 -12 11 -12 9 -1 s7 -11 11 -3 s3 7 9 -3 s7 -3 9 3 s9 -7 15 -3" : "M292 118 c8 4 4 -12 12 -6 s-2 10 8 4 c6 -4 4 -10 10 -6 s4 8 12 2 c4 -3 8 -2 10 0"} />
        </svg>
    );
};

export const ChequebookStep = ({ layout, children } : { layout? : Layout; children : ReactNode }) => {
    const { ref, seen } = useStage<HTMLDivElement>();
    const [ phase, setPhase ] = useState<Phase>("desk");
    const [ open, setOpen ] = useState(false);
    const [ k, setK ] = useState(0);
    const [ playing, setPlaying ] = useState(false);
    const [ falling, setFalling ] = useState<{ k : number; id : number }[]>([]);
    const fid = useRef(0);

    // with reduced motion: face on, open, on the last year's cheque
    useEffect(() => { if (reducedMotion()) { setOpen(true); setK(LAST); setPhase("static"); } }, []);
    // the first time the stage is mostly on screen: the camera comes round, the cover opens, the years play
    useEffect(() => {
        if (!seen || reducedMotion() || phase !== "desk") return;
        const t0 = setTimeout(() => setPhase("front"), 300);
        const t1 = setTimeout(() => setOpen(true), 300 + PAN_MS);
        const t2 = setTimeout(() => { setK(0); setPhase("write"); setPlaying(true); }, 300 + PAN_MS + OPEN_MS);
        return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ seen ]);
    // the film: write; then rip (not the last), drop the leaf, and write the next year
    useEffect(() => {
        if (!playing) return;
        if (phase === "write") {
            const t = setTimeout(() => { if (k >= LAST) { setPlaying(false); setPhase("static"); } else setPhase("rip"); }, WRITE_MS);
            return () => clearTimeout(t);
        }
        if (phase === "rip") {
            const t = setTimeout(() => { const id = ++fid.current; setFalling(f => [ ...f, { k, id } ]); setK(k + 1); setPhase("write"); }, RIP_MS);
            return () => clearTimeout(t);
        }
    }, [ playing, phase, k ]);
    // a fallen leaf leaves the page once it is out of the frame
    useEffect(() => {
        if (!falling.length) return;
        const t = setTimeout(() => setFalling(f => f.slice(1)), FALL_MS + 100);
        return () => clearTimeout(t);
    }, [ falling ]);

    const toggle = () => {
        if (playing) { setPlaying(false); setPhase("static"); return; }
        setOpen(true);
        if (k >= LAST) setK(0);
        setPhase("write"); setPlaying(true);
    };
    const seek = (i : number) => { setPlaying(false); setOpen(true); setK(i); setPhase("static"); setFalling([]); };

    // the counterfoil's notes: every cheque already torn off
    const torn = Array.from({ length : k }, (_, i) => i);
    const ev = EVENTS.find(e => e.slide === "cheque");
    const inked = phase === "write" || phase === "rip" || phase === "static";
    return (
        <div className={`${splitClass(layout)} cb-split`}>
            <div className="split-card">
                {children}
                <TimeBar i={k} n={FYS.length} playing={playing} toggle={toggle} seek={seek} ends={[ FYS[0], FYS[LAST] ]} name={i => FYS[i]} />
                {ev && <p className="event-line">{ev.note} <a href={ev.url}>Source</a></p>}
            </div>
            <div className="split-stage cb-stage" ref={ref}>
                <div className={`cb-scene ${phase === "desk" ? "is-desk" : ""}`}>
                    <div className={`cb-book ${open ? "is-open" : ""}`} role="img" style={{ "--cb-hand" : kalam.style.fontFamily } as React.CSSProperties}
                        aria-label={`A chequebook, open on a cheque for the average cheque of ${FYS[k]}: ₹${inr(AVG[k])}, ${inWords(AVG[k])}.`}>
                        <div className="cb-inside">
                            <div className="cb-stub">
                                <span className="cb-stub-head">Counterfoil</span>
                                <ol className="cb-notes">
                                    {torn.slice(-8).map(i => <li key={i} className="cb-note"><span>{FYS[i]}</span><b>₹{inr(AVG[i])}</b></li>)}
                                </ol>
                            </div>
                            <div className="cb-perf" />
                            <div className="cb-under is-2"><img src={BLANK} alt="" /></div>
                            <div className="cb-under"><img src={BLANK} alt="" /></div>
                            <div key={k} className={`cb-leaf ${phase === "rip" ? "is-ripping" : ""}`} style={{ clipPath : TEETH }}>
                                <img src={BLANK} alt="" />
                                {inked && <Ink k={k} animate={phase === "write" || phase === "rip"} />}
                            </div>
                            {falling.map(f => (
                                <div key={f.id} className="cb-leaf is-falling" style={{ clipPath : TEETH }} aria-hidden="true">
                                    <img src={BLANK} alt="" /><Ink k={f.k} animate={false} />
                                </div>
                            ))}
                        </div>
                        <div className="cb-cover" aria-hidden="true">
                            <span className="cb-emblem">₹</span>
                            <span className="cb-bank">NATIONAL BANK</span>
                            <span className="cb-title">Cheque book</span>
                            <span className="cb-leaves">25 leaves · CTS-2010</span>
                        </div>
                    </div>
                </div>
                <p className="cb-caption" aria-live="polite">{inked ? <><b>{FYS[k]}</b> · the average cheque <b>₹{inr(AVG[k])}</b></> : " "}</p>
            </div>
        </div>
    );
};
