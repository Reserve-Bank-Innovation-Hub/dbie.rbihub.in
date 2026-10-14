"use client";

// The arrivals and departures board: rows of split-flap cells, as at an airport, each flipping through letters until it
// settles on its own. It opens the story and closes it. The board flips the first time it is mostly on screen; a tap
// on it flips it again. With reduced motion it is drawn settled.


// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// `short` is the row on a narrow board (a phone), where the full row's cells would be too small to read; a row with
// no `short` is left off there.
export interface BoardRow { tag? : string; tone : "in" | "kept" | "out" | "plain"; text : string; short? : string }

const FLAPS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,%-";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Board = ({ rows, label, delay = 0, big = false, head } : { rows : BoardRow[]; label : string; delay? : number; big? : boolean; head? : [ string, string ] }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [ narrow, setNarrow ] = useState(false);
    const shown = narrow ? rows.filter(r => r.short).map(r => ({ ...r, text : r.short as string })) : rows;
    const cols = Math.max(...shown.map(r => r.text.length));
    const [ cell, setCell ] = useState(20);
    const [ run, setRun ] = useState(0);
    // the cells' width follows the board's: as large as fits, between 9 and 26 px
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const fit = () => {
            const small = el.clientWidth < 560, room = el.clientWidth - (small ? 0 : 118) - 24;
            setNarrow(small);
            setCell(Math.max(9, Math.min(big ? 46 : 26, Math.floor(room / cols) - (big ? 4 : 3))));
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(el);
        const io = new IntersectionObserver(([ e ]) => { if (e.intersectionRatio > 0.5) { setRun(r => r || 1); io.disconnect(); } }, { threshold : [ 0.5 ] });
        io.observe(el);
        return () => { ro.disconnect(); io.disconnect(); };
    }, [ cols, big ]);
    // each run: every cell flips through a few letters, a few more the further right it is, then lands
    useEffect(() => {
        const el = ref.current;
        if (!el || !run) return;
        const cells = [ ...el.querySelectorAll<HTMLSpanElement>(".flap") ];
        if (reducedMotion()) { cells.forEach(c => (c.textContent = c.dataset.to ?? " ")); return; }
        const timers : number[] = [];
        cells.forEach((c, i) => {
            const col = +(c.dataset.col ?? 0), row = +(c.dataset.row ?? 0);
            let k = 0;
            const n = 5 + Math.round(col * 0.45) + row * 2 + ((i * 7) % 5);
            const start = window.setTimeout(() => {
                const t = window.setInterval(() => {
                    k++;
                    c.classList.remove("is-flip"); void c.offsetWidth; c.classList.add("is-flip");
                    c.textContent = k >= n ? (c.dataset.to ?? " ") : FLAPS[(Math.random() * FLAPS.length) | 0];
                    if (k >= n) clearInterval(t);
                }, 62);
                timers.push(t);
            }, delay * 1000 + row * 90);
            timers.push(start);
        });
        return () => timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    }, [ run, delay, narrow ]);
    return (
        <div className={`board ${big ? "is-big" : ""}`} ref={ref} role="img" aria-label={label} style={{ "--cell" : `${cell}px` } as React.CSSProperties}
            onClick={() => setRun(r => r + 1)}>
            {head && <div className="board-head"><span>{head[0]}</span><span>{head[1]}</span></div>}
            {shown.map((r, ri) => (
                <div key={ri} className={`board-row is-${r.tone}`}>
                    <span className="board-tag">{r.tag ?? ""}</span>
                    <span className="board-cells" aria-hidden="true">
                        {r.text.padEnd(cols).split("").map((ch, ci) => (
                            <span key={ci} className="flap" data-to={ch} data-col={ci} data-row={ri}>{run ? " " : ch}</span>
                        ))}
                    </span>
                </div>
            ))}
        </div>
    );
};
