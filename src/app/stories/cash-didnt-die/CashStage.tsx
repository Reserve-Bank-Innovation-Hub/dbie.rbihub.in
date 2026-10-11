"use client";

// The story's stages: the title's phone and note (3D), the crowd of phones month by month, and the fields of machines month by month. Loaded
// through next/dynamic with SSR off (page.client.tsx), so three.js reaches only this story's bundle. Without WebGL a
// stage shows a line of text; with reduced motion each draws one still frame.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { mountPhoneScene, type PhoneScene } from "./phoneScene";
import { type GridHalf, mountGridsScene } from "./gridsScene";
import { type Band, mountRainScene } from "./rainScene";

// DATA ================================================================================================================
import { MACHINES, NOTE_YEARS, PAY, PAY_MONTHS, USERS, USER_POINTS } from "./data.gen";
import { eventsFor, type StepEvent } from "./record";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NO_GL = "This 3D scene needs WebGL, which this browser has turned off.";
const monthName = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
const fmt = (v : number) => v.toLocaleString("en-IN", { maximumFractionDigits : 0 });
const LAST = PAY_MONTHS.length - 1;

// THE TITLE ===========================================================================================================
export const TitleStage = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const [ failed, setFailed ] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        // the page's words wait, hidden (the page is served that way), while the opening plays, and come in as the
        // phone lands
        const opening = ref.current.closest(".opening");
        let s : PhoneScene | null = null;
        try {
            s = mountPhoneScene(ref.current, { reduced : reducedMotion(), onReveal : () => opening?.classList.remove("is-intro") });
        } catch { opening?.classList.remove("is-intro"); setFailed(true); }
        return () => s?.dispose();                      // the words keep waiting for the next mount (or the CSS timer)
    }, []);
    return (
        <div className="cash-stage is-title">
            <canvas ref={ref} role="img" aria-label="At a chai stall, a phone scans the stall's QR code and pays ₹50 by UPI; the payment joins the day's list. The phone is set face down on the table: folded behind it, in its clear case, is a ₹500 note. The payments go on, lighting the table green from under the phone, while the note stays." />
            {failed && <p className="stage-fallback">{NO_GL}</p>}
        </div>
    );
};

// A MONTH PLAYER ======================================================================================================
// What the two month-by-month stages share: a scene with play, pause and setMonth, started the first time the stage
// is mostly on screen, and the play button and slider under it.
interface Player { play : () => void; pause : () => void; setMonth : (m : number) => void; dispose : () => void }
const useMonthPlayer = (mount : (canvas : HTMLCanvasElement, cb : { onMonth : (m : number) => void; onEnd : () => void; reduced : boolean }) => Player) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const scene = useRef<Player | null>(null);
    const [ failed, setFailed ] = useState(false);
    const [ m, setM ] = useState(0);
    const [ playing, setPlaying ] = useState(false);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const reduced = reducedMotion();
        try { scene.current = mount(canvas, { onMonth : setM, onEnd : () => setPlaying(false), reduced }); }
        catch { setFailed(true); return; }
        if (reduced) setM(LAST);
        const io = new IntersectionObserver(([ e ]) => {
            if (e.intersectionRatio > 0.6 && !reduced) { scene.current?.play(); setPlaying(true); io.disconnect(); }
        }, { threshold : [ 0.6 ] });
        io.observe(canvas);
        return () => { io.disconnect(); scene.current?.dispose(); scene.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const toggle = () => {
        if (playing) { scene.current?.pause(); setPlaying(false); return; }
        if (m >= LAST) setM(0);
        scene.current?.play(); setPlaying(true);
    };
    const seek = (i : number) => { scene.current?.pause(); setPlaying(false); setM(i); scene.current?.setMonth(i); };
    return { ref, failed, m, playing, toggle, seek };
};

// THE RECORD ==========================================================================================================
// The latest event the months have reached, under the readout: its number, month and what the record says.
export const EventNow = ({ events, m } : { events : StepEvent[]; m : number }) => {
    const e = [ ...events ].reverse().find(x => x.k <= m);
    return (
        <p className={`event-now ${e ? "is-shown" : ""}`} aria-live="polite">
            {e && <><i>{e.n}</i><b>{monthName(e.month)}</b> {e.note} <a href={e.url}>Source</a></>}
        </p>
    );
};

const TimeBar = ({ m, playing, toggle, seek, events } : { m : number; playing : boolean; toggle : () => void; seek : (i : number) => void; events? : StepEvent[] }) => (
    <div className="rain-time">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play the months"}>{playing ? "❚❚" : "▶"}</button>
        <div className="time-track">
            <input type="range" min={0} max={LAST} step={1} value={m} aria-label="Month" aria-valuetext={monthName(PAY_MONTHS[m])}
                onChange={e => seek(+e.target.value)} />
            {(events ?? []).map(e => (
                <button key={e.n} type="button" className={`time-tick ${e.k <= m ? "is-passed" : ""}`} style={{ left : `${e.k / LAST * 100}%` }}
                    title={`${monthName(e.month)}: ${e.label}`} aria-label={`Go to ${monthName(e.month)}: ${e.label}`} onClick={() => seek(e.k)}>{e.n}</button>
            ))}
        </div>
        <span className="rain-years"><span>{PAY_MONTHS[0].slice(0, 4)}</span><span>{PAY_MONTHS[LAST].slice(0, 4)}</span></span>
    </div>
);
const Readout = ({ children } : { children : ReactNode }) => <div className="rain-readout">{children}</div>;

// THE MACHINES, MONTH BY MONTH ========================================================================================
// In 2D: ATMs on the left, micro-ATMs on the right, two grids in each half. The first step shows the machines and the
// withdrawals made at them, the second the withdrawals and the cash they took out. A square is the same on both sides:
// 10,000 machines, 50 lakh withdrawals in the month, or ₹2,500 crore withdrawn in the month; large enough a unit that
// the squares are the size of the UPI wall's hands, not dots.
const PER_MACHINES = 10000, PER_WITHDRAWALS = 0.5, PER_VALUE = 2500;  // machines; crore withdrawals; ₹ crore
const daysIn = (ym : string) => { const [ y, mo ] = ym.split("-").map(Number); return new Date(y, mo, 0).getDate(); };
// withdrawals per machine a day, that month; the average withdrawal, in rupees
const perDay = (crore : number, lakhMachines : number, ym : string) => crore * 1e7 / (lakhMachines * 1e5) / daysIn(ym);
const average = (valueCrore : number, volumeCrore : number) => valueCrore / volumeCrore;
const rupees = (crore : number) => crore >= 1e5 ? `₹${(crore / 1e5).toFixed(2)} lakh crore` : `₹${fmt(crore)} crore`;
const machinesSeries = (lakh : number[], kind : "atm" | "micro") =>
    ({ cells : lakh.map(l => l * 1e5 / PER_MACHINES), kind, label : (m : number) => `Machines · ${lakh[m].toFixed(2)} lakh` });
const withdrawalsSeries = (crore : number[]) =>
    ({ cells : crore.map(c => c / PER_WITHDRAWALS), kind : "withdrawal" as const, label : (m : number) => `Withdrawals in the month · ${crore[m].toFixed(crore[m] < 20 ? 2 : 1)} crore` });
const valueSeries = (crore : number[]) =>
    ({ cells : crore.map(c => c / PER_VALUE), kind : "cash" as const, label : (m : number) => `Cash withdrawn in the month · ${rupees(crore[m])}` });

// The cash withdrawn is drawn as notes, coloured in the mix of ₹100 and larger banknotes in circulation, by number, at the latest
// March on or before each month (RBI Annual Report, Table VIII.1): ₹500, ₹100, ₹200 and ₹2,000. Smaller notes are left
// out, since cash machines pay out mostly ₹100 and above.
const NOTE_DENOMS = [ "500", "100", "200", "2000" ];
const NOTE_MIX = PAY_MONTHS.map(ym => {
    const year = [ ...(NOTE_YEARS ?? []) ].reverse().find(y => y.march <= ym) ?? (NOTE_YEARS ?? [])[0];
    if (!year) return [ 0.5, 0.25, 0.25, 0 ];
    const count = (d : string) => year.notes.find(n => n.denom === d)?.volume ?? 0;
    const total = NOTE_DENOMS.reduce((a, d) => a + count(d), 0);
    return NOTE_DENOMS.map(d => count(d) / total);
});
const LATEST_NOTES = (NOTE_YEARS ?? [])[(NOTE_YEARS ?? []).length - 1];

const VIEWS : Record<"machines" | "value", { left : GridHalf; right : GridHalf }> = {
    machines : {
        left  : { title : "ATMs", lead : "atm", top : machinesSeries(MACHINES.atm, "atm"), bottom : withdrawalsSeries(PAY.atm.volume) },
        right : { title : "Micro-ATMs", lead : "micro", top : machinesSeries(MACHINES.micro, "micro"), bottom : withdrawalsSeries(PAY.micro.volume) },
    },
    value : {
        left  : { title : "ATMs", lead : "atm", top : withdrawalsSeries(PAY.atm.volume), bottom : valueSeries(PAY.atm.value) },
        right : { title : "Micro-ATMs", lead : "micro", top : withdrawalsSeries(PAY.micro.volume), bottom : valueSeries(PAY.micro.value) },
    },
};
// the most squares any grid needs, across both steps, so both steps lay out alike
const FIT_MAX = Math.max(...Object.values(VIEWS).flatMap(v => [ v.left, v.right ]).flatMap(h => [ ...h.top.cells, ...h.bottom.cells ]));

export const GridsStage = ({ view, children } : { view : "machines" | "value"; children : ReactNode }) => {
    const events = eventsFor(view === "machines" ? "machines" : "cash");
    const p = useMonthPlayer((canvas, cb) => mountGridsScene(canvas, { reduced : cb.reduced, ...VIEWS[view], fitMax : FIT_MAX, noteMix : NOTE_MIX, onMonth : cb.onMonth, onEnd : cb.onEnd }));
    const ym = PAY_MONTHS[p.m];
    const atmDay = perDay(PAY.atm.volume[p.m], MACHINES.atm[p.m], ym), microDay = perDay(PAY.micro.volume[p.m], MACHINES.micro[p.m], ym);
    const atmAvg = average(PAY.atm.value[p.m], PAY.atm.volume[p.m]), microAvg = average(PAY.micro.value[p.m], PAY.micro.volume[p.m]);
    const label = view === "machines"
        ? `${monthName(ym)}. ATMs: ${MACHINES.atm[p.m].toFixed(2)} lakh machines, ${PAY.atm.volume[p.m].toFixed(1)} crore withdrawals in the month. Micro-ATMs: ${MACHINES.micro[p.m].toFixed(2)} lakh machines, ${PAY.micro.volume[p.m].toFixed(2)} crore withdrawals.`
        : `${monthName(ym)}. ATMs: ${PAY.atm.volume[p.m].toFixed(1)} crore withdrawals taking out ${rupees(PAY.atm.value[p.m])}. Micro-ATMs: ${PAY.micro.volume[p.m].toFixed(2)} crore withdrawals taking out ${rupees(PAY.micro.value[p.m])}.`;
    return (
        <div className="grids">
            <div className="grids-words">{children}</div>
            <div className="grids-stage">
                <canvas ref={p.ref} role="img" aria-label={label} />
            </div>
            <div className="grids-foot">
                <div className="grids-now">
                    <p className="grids-readout">
                        <b>{monthName(ym)}</b>
                        {view === "machines"
                            ? <>An ATM: about {Math.round(atmDay)} withdrawals a day. A micro-ATM: about {microDay.toFixed(1)}.</>
                            : <>The average withdrawal: ₹{fmt(atmAvg)} at an ATM, ₹{fmt(microAvg)} at a micro-ATM.</>}
                    </p>
                    <EventNow events={events} m={p.m} />
                </div>
                <TimeBar {...p} events={events} />
                <p className="grids-key">
                    Each square, on both sides: {view === "machines" ? "10,000 machines, or 50 lakh withdrawals in the month" : "50 lakh withdrawals, or ₹2,500 crore withdrawn, in the month"}.
                    Micro-ATMs are the handheld machines banking agents carry. Squares fill from one corner only to show size; it is not a map.
                    Notes are coloured in the mix of ₹100 and larger banknotes in circulation each March, by number, from the RBI{"'"}s{" "}
                    {LATEST_NOTES ? <a href={LATEST_NOTES.url}>Annual Report</a> : "Annual Report"}: ₹500 green, ₹200 turmeric,
                    ₹100 lavender, ₹2,000 pink. The RBI does not publish which notes the machines pay out.
                </p>
            </div>
        </div>
    );
};

// THE TAPS, MONTH BY MONTH ============================================================================================
// A wall of hands in a grid of about 600 cells, filling from the bottom-left: each hand 10 lakh unique UPI users (official
// counts at eight dates, joined by straight lines). Each green flash on a screen is 30 crore payments, so as payments
// per user grow, the hands flash faster. The scene on the left, the words and the readout in a card on the right.
const USERS_PER_HAND = 0.1;                                      // crore
const PER_FLASH = 30;                                            // crore payments
const HANDS = USERS.map(u => u / USERS_PER_HAND);
// the latest month's payments in a blink (taken as a third of a second), and the round thousand above it for the
// sign on the wall
const PER_SECOND = PAY.upi.volume[LAST] * 1e7 / (daysIn(PAY_MONTHS[LAST]) * 86400);
const PER_BLINK = PER_SECOND / 3;
const NEARLY = Math.ceil(PER_BLINK / 1000) * 1000;

const SIGN = `~${NEARLY.toLocaleString("en-IN")} UPI payments were made while you blinked`;
const CAPTION = `Nearly ${NEARLY.toLocaleString("en-IN")} UPI payments are made in the time it takes you to blink.`;

const RAIN_EVENTS = eventsFor("rain");

export const RainStage = ({ children } : { children : ReactNode }) => {
    // after the LED sign, its message as a full sentence in plain type on a band over the wall's middle rows
    const [ band, setBand ] = useState<Band | null>(null);
    const p = useMonthPlayer((canvas, cb) => mountRainScene(canvas, {
        reduced : cb.reduced, unit : PER_FLASH, upi : PAY.upi.volume, hands : HANDS, onMonth : cb.onMonth, onEnd : cb.onEnd,
        marquee : SIGN, onCaption : setBand,
    }));
    const ym = PAY_MONTHS[p.m];
    const sourced = USER_POINTS.some(q => q.month === ym);
    return (
        <div className="split">
            <div className="split-stage">
                <canvas ref={p.ref} role="img"
                    aria-label={`Hands holding phones fill a grid from the bottom-left. ${monthName(ym)}: ${USERS[p.m].toFixed(1)} crore UPI users, ${Math.round(HANDS[p.m])} hands; ${fmt(PAY.upi.volume[p.m])} crore payments, each green flash ${PER_FLASH} crore of them.`} />
                {p.failed && <p className="stage-fallback">{NO_GL}</p>}
                {band && <p className="rain-caption" style={{ ...band, fontSize : Math.max(14, Math.min(24, band.height * 0.36, band.width / 36)) }}>{CAPTION}</p>}
            </div>
            <aside className="split-card">
                {children}
                <Readout>
                    <span className="rain-month">{monthName(ym)}</span>
                    <span className="rain-row"><i className="key-hand" aria-hidden="true">✋</i><b>{USERS[p.m].toFixed(1)}</b> crore UPI users{sourced ? "" : "*"}</span>
                    <span className="rain-row is-upi"><i className="key-tick" aria-hidden="true">✓</i><b>{fmt(PAY.upi.volume[p.m])}</b> crore payments</span>
                    <span className="rain-row"><i className="key-hand" aria-hidden="true" /><b>{Math.round(PAY.upi.volume[p.m] / USERS[p.m])}</b> payments a user, a month</span>
                    <span className="rain-key">
                        Each hand is {USERS_PER_HAND * 100} lakh UPI users: unique users onboarded, as NPCI counts them (not monthly active
                        users), from PIB, RBI and Parliament at eight dates; *between them, a straight line, and after
                        {" "}{monthName(USER_POINTS[USER_POINTS.length - 1].month)}, the latest count held. Each green flash is {PER_FLASH} crore{" "}
                        payments. The grid fills from one corner only to show growth; it is not a map. About{" "}
                        {NEARLY.toLocaleString("en-IN")} payments in a blink is from {monthName(PAY_MONTHS[LAST])}: {fmt(PAY.upi.volume[LAST])} crore payments over{" "}
                        {daysIn(PAY_MONTHS[LAST])} days is about {Math.round(PER_SECOND).toLocaleString("en-IN")} a second, or{" "}
                        {Math.round(PER_BLINK).toLocaleString("en-IN")} in a blink of a third of a second.
                    </span>
                    <EventNow events={RAIN_EVENTS} m={p.m} />
                </Readout>
                <TimeBar {...p} events={RAIN_EVENTS} />
            </aside>
        </div>
    );
};
