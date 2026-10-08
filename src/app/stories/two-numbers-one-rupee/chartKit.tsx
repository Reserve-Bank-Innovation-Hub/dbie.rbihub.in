"use client";

// Shared pieces for the page's figures: the easing every chart moves on, the figure frame (title, units, chart,
// table view, note), and a tooltip.

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

export const EASE = [ 0.16, 1, 0.3, 1 ] as const;



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
