"use client";

// Shared pieces for the page's figures: the easing every chart moves on, a bar with a rounded data end and a square
// baseline, the figure frame (title, units, chart, table view, note), and a tooltip.

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

export const EASE = [ 0.16, 1, 0.3, 1 ] as const;

// A horizontal bar from x0 running len pixels in dir (1 right, -1 left), h tall at y, rounded only at its data end.
export const hBarPath = (x0 : number, y : number, len : number, h : number, dir : 1 | -1 = 1, rad = 4) => {
    if (len <= 0.5) return "";
    const r = Math.min(rad, len, h / 2);
    const x1 = x0 + dir * len;
    return dir === 1
        ? `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 - r},${y + h} H${x0} Z`
        : `M${x0},${y} H${x1 + r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 + r},${y + h} H${x0} Z`;
};

// A column from a baseline at y0 up to y0 - len, w wide at x, rounded only at its top.
export const vBarPath = (x : number, y0 : number, len : number, w : number, rad = 4) => {
    if (len <= 0.5) return "";
    const r = Math.min(rad, len, w / 2), y1 = y0 - len;
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 + r} V${y0} Z`;
};

interface FigureProps {
    title     : string;
    units ?   : string;
    children  : ReactNode;
    table ?   : { head : string[]; rows : (string | number)[][]; numeric ? : boolean[] };
    note ?    : ReactNode;
    className ? : string;
}

// A figure on its own panel: sentence-case title, the units, the chart, a table view to read every value without
// hovering, and a note.
export const Figure = ({ title, units, children, table, note, className } : FigureProps) => (
    <figure className={`story-figure ${className ?? ""}`}>
        <figcaption>
            <span className="figure-title">{title}</span>
            {units && <span className="figure-units">{units}</span>}
        </figcaption>
        {children}
        {table && (
            <details className="table-view">
                <summary>Table view</summary>
                <div className="table-scroll">
                    <table>
                        <thead><tr>{table.head.map((h, i) => <th key={i} className={table.numeric?.[i] ? "num" : ""}>{h}</th>)}</tr></thead>
                        <tbody>
                            {table.rows.map((r, i) => (
                                <tr key={i}>{r.map((c, j) => <td key={j} className={table.numeric?.[j] ? "num" : ""}>{c}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        )}
        {note && <p className="figure-note">{note}</p>}
    </figure>
);

// A tooltip at a point inside a chart: the value leads, the label follows.
export const ChartTip = ({ x, y, head, lines, width } : { x : number; y : number; head : string; lines : string[]; width : number }) => (
    <div className="chart-tip" style={{ left : Math.min(Math.max(x, 110), Math.max(110, width - 110)), top : y }}>
        <strong>{head}</strong>
        {lines.map(l => <span key={l}>{l}</span>)}
    </div>
);
