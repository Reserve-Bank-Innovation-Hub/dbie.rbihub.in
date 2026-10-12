"use client";

// What every chart in the story shares, laid over its SVG in HTML so it stays sharp and can hold links: the events as
// pins on the line (as in S1: a numbered mark on a stem, its name beside it on a wide screen, and on pointing at it, or
// a tap, a note with its official source), and a readout that follows the pointer (or a finger) along the series.

// REACT CORE ==========================================================================================================
import { PointerEvent as RPointerEvent, ReactNode, useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { monthName, type StepEvent } from "./record";

export interface Pin extends StepEvent { x : number; y : number; delay : number }

// The pins. Each stands on its point of the line on a dashed stem, raised to one of a few heights so that neighbours'
// names do not touch; a note opens on pointing (leaving waits a moment, so the pointer can reach the link) or a tap.
export const Pins = ({ pins, w, shown } : { pins : Pin[]; w : number; shown : boolean }) => {
    const [ open, setOpen ] = useState<number | null>(null);
    const letGo = useRef(0);
    const show = (n : number | null) => {
        clearTimeout(letGo.current);
        if (n !== null) setOpen(n); else letGo.current = window.setTimeout(() => setOpen(null), 300);
    };
    useEffect(() => () => clearTimeout(letGo.current), []);
    const narrow = w < 560;
    // heights: a pin rises a level at a time until its mark and name clear every earlier pin's, where they would sit
    // on the screen (a name is about 150 px wide; on a phone only the marks show)
    const levels : number[] = [], tops : number[] = [];
    const liftOf = (l : number) => 30 + l * 26;
    pins.forEach((p, i) => {
        let l = 0;
        const clash = (lv : number) => pins.some((q, j) => j < i && Math.abs(q.x - p.x) < (narrow ? 26 : 160) && Math.abs(tops[j] - (p.y - liftOf(lv))) < 24);
        while (clash(l) && l < 8) l++;
        levels.push(l); tops.push(p.y - liftOf(l));
    });
    return (
        <div className="pins">
            {pins.map((p, i) => {
                const lift = liftOf(levels[i]), down = p.y - lift < 24;      // near the top, a pin hangs below
                const right = p.x > w / 2, isOpen = open === p.n;
                return (
                    <div key={p.n} className={`pin ${shown ? "is-shown" : ""} ${isOpen ? "is-open" : ""} ${right ? "is-right" : ""} ${down ? "is-down" : ""}`}
                        style={{ transform : `translate(${p.x}px, ${p.y}px)`, "--d" : `${p.delay.toFixed(2)}s`, "--lift" : `${lift}px` } as React.CSSProperties}
                        onPointerEnter={e => { if (e.pointerType === "mouse") show(p.n); }} onPointerLeave={e => { if (e.pointerType === "mouse") show(null); }}>
                        <span className="pin-stem" />
                        <button type="button" className="pin-mark" aria-expanded={isOpen} aria-label={`${p.label}, ${monthName(p.month)}`}
                            onClick={() => setOpen(o => (o === p.n ? null : p.n))} onFocus={() => show(p.n)} onBlur={() => show(null)}>{p.n}</button>
                        {!narrow && <span className="pin-label">{p.label}</span>}
                        {isOpen && (
                            <div className="pin-note" role="note">
                                <strong>{monthName(p.month)} · {p.label}</strong>
                                <span>{p.note}</span>
                                <a href={p.url} target="_blank" rel="noopener">{p.source} ↗</a>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// The readout that follows the pointer: the nearest point of the series, a hairline at it, and a box with its numbers.
// A finger works the same, by touching or dragging along the chart.
export interface Reading { x : number; y : number; head : string; lines : string[] }
export function useReadout(read : (px : number) => Reading | null) {
    const [ tip, setTip ] = useState<Reading | null>(null);
    const on = (e : RPointerEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest(".pin")) { setTip(null); return; }
        const r = e.currentTarget.getBoundingClientRect();
        setTip(read(e.clientX - r.left));
    };
    const bind = {
        onPointerMove : on,
        onPointerDown : on,
        onPointerLeave : (e : RPointerEvent<HTMLElement>) => { if (e.pointerType === "mouse") setTip(null); },
    };
    return { tip, bind, clear : () => setTip(null) };
}

export const Readout = ({ tip, w, top, bottom } : { tip : Reading | null; w : number; top : number; bottom : number }) => tip ? (
    <>
        <span className="hairline" style={{ transform : `translate(${tip.x}px, ${top}px)`, height : bottom - top }} />
        <span className="hair-dot" style={{ transform : `translate(${tip.x}px, ${tip.y}px)` }} />
        <div className="chart-tip" style={{ transform : `translate(${Math.max(4, Math.min(tip.x + 14, w - 220))}px, ${Math.max(4, tip.y - 76)}px)` }}>
            <strong>{tip.head}</strong>
            {tip.lines.map(l => <span key={l}>{l}</span>)}
        </div>
    </>
) : null;

// A stage that carries both: the chart (SVG) as its child, the pins and the readout over it.
export const ChartLayer = ({ children } : { children : ReactNode }) => <div className="chart-layer">{children}</div>;
