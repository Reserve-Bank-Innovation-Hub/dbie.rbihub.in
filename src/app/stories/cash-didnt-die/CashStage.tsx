"use client";

// The story's 3D stages: the title's ATM, the crowd of phones month by month, and the fields of machines month by month. Loaded
// through next/dynamic with SSR off (page.client.tsx), so three.js reaches only this story's bundle. Without WebGL a
// stage shows a line of text; with reduced motion each draws one still frame.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { mountAtmScene, type AtmScene } from "./atmScene";
import { mountFieldsScene } from "./fieldsScene";
import { type Band, mountRainScene } from "./rainScene";

// DATA ================================================================================================================
import { MACHINES, PAY, PAY_MONTHS, USERS, USER_POINTS } from "./data.gen";

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
        // machine comes to rest
        const opening = ref.current.closest(".opening");
        let s : AtmScene | null = null;
        try {
            s = mountAtmScene(ref.current, { reduced : reducedMotion(), onReveal : () => opening?.classList.remove("is-intro") });
        } catch { opening?.classList.remove("is-intro"); setFailed(true); }
        return () => s?.dispose();                      // the words keep waiting for the next mount (or the CSS timer)
    }, []);
    return (
        <div className="cash-stage is-title">
            <canvas ref={ref} role="img" aria-label="A cash machine pays out ₹500 notes in a stream that does not stop; they flutter forward and fall out of view. Its screen reads: Cash didn’t die." />
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

const TimeBar = ({ m, playing, toggle, seek } : { m : number; playing : boolean; toggle : () => void; seek : (i : number) => void }) => (
    <div className="rain-time">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play the months"}>{playing ? "❚❚" : "▶"}</button>
        <input type="range" min={0} max={LAST} step={1} value={m} aria-label="Month" aria-valuetext={monthName(PAY_MONTHS[m])}
            onChange={e => seek(+e.target.value)} />
        <span className="rain-years"><span>{PAY_MONTHS[0].slice(0, 4)}</span><span>{PAY_MONTHS[LAST].slice(0, 4)}</span></span>
    </div>
);
const Readout = ({ children } : { children : ReactNode }) => <div className="rain-readout">{children}</div>;

// THE MACHINES, MONTH BY MONTH ========================================================================================
// One machine on screen for every 10,000; one person in a queue for every 10 withdrawals a day at a machine, so a
// field's people are its month's withdrawals: crore a month × 1e7 ÷ days ÷ 10 ÷ 10,000 = crore × 100 ÷ days.
const PER_ICON = 1e4, PER_PERSON_DAY = 10;
const daysIn = (ym : string) => { const [ y, mo ] = ym.split("-").map(Number); return new Date(y, mo, 0).getDate(); };
// withdrawals per machine a day, that month
const perDay = (crore : number, lakhMachines : number, ym : string) => crore * 1e7 / (lakhMachines * 1e5) / daysIn(ym);
const icons = (lakh : number[]) => lakh.map(l => l * 1e5 / PER_ICON);
const peopleOf = (crore : number[]) => crore.map((c, i) => c * 1e7 / daysIn(PAY_MONTHS[i]) / PER_PERSON_DAY / PER_ICON);

export const MachinesStage = () => {
    const p = useMonthPlayer((canvas, cb) => mountFieldsScene(canvas, {
        reduced : cb.reduced, atmN : icons(MACHINES.atm), microN : icons(MACHINES.micro),
        atmPeople : peopleOf(PAY.atm.volume), microPeople : peopleOf(PAY.micro.volume), onMonth : cb.onMonth, onEnd : cb.onEnd,
    }));
    const ym = PAY_MONTHS[p.m];
    const atmDay = perDay(PAY.atm.volume[p.m], MACHINES.atm[p.m], ym), microDay = perDay(PAY.micro.volume[p.m], MACHINES.micro[p.m], ym);
    return (
        <div className="cash-stage is-machines">
            <canvas ref={p.ref} role="img"
                aria-label={`${monthName(ym)}: ${MACHINES.atm[p.m].toFixed(2)} lakh ATMs, about ${Math.round(atmDay)} withdrawals each a day; ${MACHINES.micro[p.m].toFixed(2)} lakh micro-ATMs with banking agents, about ${microDay.toFixed(1)} each a day. One machine on screen for every 10,000, one person for every 10 withdrawals a day.`} />
            {p.failed && <p className="stage-fallback">{NO_GL}</p>}
            <Readout>
                <span className="rain-month">{monthName(ym)}</span>
                <span className="rain-row"><i className="key-atm" aria-hidden="true" /><b>{MACHINES.atm[p.m].toFixed(2)}</b> lakh ATMs</span>
                <span className="rain-sub">{Math.round(atmDay)} withdrawals a machine a day; {fmt(PAY.atm.volume[p.m])} crore in the month</span>
                <span className="rain-row"><i className="key-agent" aria-hidden="true" /><b>{MACHINES.micro[p.m].toFixed(2)}</b> lakh micro-ATMs</span>
                <span className="rain-sub">{microDay.toFixed(1)} withdrawals a machine a day; {PAY.micro.volume[p.m].toFixed(1)} crore in the month</span>
                <span className="rain-key">
                    Each machine on screen is 10,000 machines; each person in a queue is 10 withdrawals a day at a machine.
                    Micro-ATMs are handheld machines that banking agents carry, the same scale as the ATMs.
                </span>
            </Readout>
            <TimeBar {...p} />
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
                </Readout>
                <TimeBar {...p} />
            </aside>
        </div>
    );
};
