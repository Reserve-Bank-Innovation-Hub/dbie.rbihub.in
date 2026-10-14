"use client";

// The survey timeline over the 3D plots: the survey's number, kind and months on the left, then the site's shared
// Timeline scrubber (as in the 10-gram question's "Gold against prices"), with the first and last survey named under
// its ends, and on a wide screen a note that two surveys share January to June 2024. The plots' engine (mountStoryBody)
// owns the state and the clock: it publishes where the story is through a small bus, and takes the reader's play,
// pause and scrub back through it.

// REACT CORE ==========================================================================================================
import { useSyncExternalStore } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { Timeline } from "@components/Timeline/Timeline";
import { FIRST, LAST, OVERLAPS, RURAL, monthSpan, shortOf, yearOf } from "./data";

export interface TlState { i : number; meet : boolean; playing : boolean; }
export interface TlBus {
    get       : () => TlState;
    set       : (next : TlState) => void;
    subscribe : (fn : () => void) => () => void;
    onChange  : (i : number) => void;          // set by the engine
    onPlay    : (playing : boolean) => void;   // set by the engine
}

export const createTlBus = () : TlBus => {
    let state : TlState = { i : 0, meet : true, playing : false };
    const subs = new Set<() => void>();
    return {
        get       : () => state,
        set       : next => {
            if (next.i === state.i && next.meet === state.meet && next.playing === state.playing) return;
            state = next; subs.forEach(fn => fn());
        },
        subscribe : fn => { subs.add(fn); return () => { subs.delete(fn); }; },
        onChange  : () => {},
        onPlay    : () => {},
    };
};

const LAST_I = RURAL.length - 1;
const kindOf = (i : number) => /^PLFS/.test(RURAL[i].round) ? "PLFS" : `NSS round ${RURAL[i].round}`;

export const SurveyTimeline = ({ bus } : { bus : TlBus }) => {
    const { i, meet, playing } = useSyncExternalStore(bus.subscribe, bus.get, bus.get);
    return (
        <>
            <div className="tl-head" aria-live="polite">
                <span className="tl-kicker">{meet ? `${RURAL.length} surveys, ${shortOf(FIRST)} to ${shortOf(LAST)}` : `Survey ${i + 1} of ${RURAL.length} · ${kindOf(i)}`}</span>
                <strong className="tl-now">{meet ? "Everyone starts in the field" : RURAL[i].period.replace(/-/g, "–")}</strong>
            </div>
            <Timeline
                className="tl-scrub" min={0} max={LAST_I} value={i} label="Survey"
                onChange={v => bus.onChange(v)} playing={playing} onPlay={p => bus.onPlay(p)}
                named={v => v === 0 || v === LAST_I} format={v => yearOf(RURAL[v])}
            />
            <p className="tl-note">
                {OVERLAPS.map(o => `${shortOf(o.a)} and ${shortOf(o.b)} share ${monthSpan(o.from, o.to)}: the PLFS moved from July-to-June years to calendar years.`).join(" ")}
            </p>
        </>
    );
};
