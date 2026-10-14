"use client";

// What every step shares: where its words sit beside its picture, the stage's size and whether it has yet been mostly
// on screen (each step starts its motion then), reduced motion, and the story's number formats.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// Where a step's words sit beside its picture: on the right (the default), on the left, or above it across the width.
// The steps vary it, so the story does not read as one template.
export type Layout = "right" | "left" | "top";
export const splitClass = (layout? : Layout) => `split is-${layout ?? "right"}`;
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useStage<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [ size, setSize ] = useState({ w : 0, h : 0 });
    const [ seen, setSeen ] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ w : el.clientWidth, h : el.clientHeight }));
        ro.observe(el);
        const io = new IntersectionObserver(([ e ]) => { if (e.intersectionRatio > 0.55) { setSeen(true); io.disconnect(); } }, { threshold : [ 0.55 ] });
        io.observe(el);
        return () => { ro.disconnect(); io.disconnect(); };
    }, []);
    // with reduced motion a step is drawn at once
    const [ drawn, setDrawn ] = useState(false);
    useEffect(() => { if (seen || reducedMotion()) setDrawn(true); }, [ seen ]);
    return { ref, size, seen, drawn };
}

// $135.4 bn; $0.2 bn
export const usd = (bn : number, dp = 1) => `$${bn.toFixed(dp)} bn`;
export const pct = (v : number, dp = 1) => `${v.toFixed(dp)}%`;
export const signed = (v : number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
export const monthShort = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "short", year : "numeric" });
