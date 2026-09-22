"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// Charts have to know how wide they actually are: it decides how many rows a legend wraps
// into and how big a title can be before Plotly clips it. Plotly itself only reports this
// after it has drawn, so the card is measured instead.

const DEFAULT_WIDTH = 560;

export function useChartWidth() : [ React.RefObject<HTMLDivElement | null>, number ] {
    const ref = useRef<HTMLDivElement>(null);
    const [ width, setWidth ] = useState(DEFAULT_WIDTH);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(entries => {
            const measured = entries[0]?.contentRect.width;
            if (measured && Math.abs(measured - width) > 8) setWidth(measured);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [ width ]);

    return [ ref, width ];
}

// Plotly never wraps a category label, so a long one takes its width out of the plot. On a
// narrow card the label is broken across lines on word boundaries instead.
export function wrapLabel(label : string, maxChars : number) : string {
    if (label.length <= maxChars) return label;
    const lines : string[] = [];
    let line = "";
    for (const word of label.split(" ")) {
        if (line && (line + " " + word).length > maxChars) { lines.push(line); line = word; }
        else line = line ? line + " " + word : word;
    }
    if (line) lines.push(line);
    return lines.join("<br>");
}

// A title Plotly cannot wrap has to fit the card it sits in, so it steps down on narrow ones.
export function titleFontSize(width : number) : number {
    if (width < 420) return 15;
    if (width < 560) return 17;
    return 20;
}
