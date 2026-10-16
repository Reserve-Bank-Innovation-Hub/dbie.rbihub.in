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

// Runs `frame` on every animation frame, but only while `el` is on screen and the tab is visible, so the story's many
// moving pictures cost nothing once scrolled past. `frame` gets the seconds since the last frame (0 to 0.2). Returns a
// stop function.
export function loopOnScreen(el : Element, frame : (dt : number) => void) {
    let raf = 0, on = false, last = 0, seen = false;
    const tick = (now : number) => { const dt = Math.max(0, Math.min(0.2, (now - last) / 1000)); last = now; frame(dt); raf = requestAnimationFrame(tick); };
    const start = () => { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(([ e ]) => { seen = e.isIntersecting; if (seen && !document.hidden) start(); else stop(); });
    io.observe(el);
    const vis = () => { if (document.hidden) stop(); else if (seen) start(); };
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
}

// An SVG drawn once into a bitmap the size a canvas will use it (at the screen's density), so a canvas that paints it
// on every frame copies pixels instead of drawing the SVG again. `get` is null until the image has loaded.
export function rasterise(src : string, w : number, h : number) {
    if (typeof document === "undefined") return { get : () => null as HTMLCanvasElement | null };
    const k = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement("canvas");
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    let ready = false;
    const img = new Image();
    img.onload = () => { cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height); ready = true; };
    img.src = src;
    return { get : () => (ready ? cv : null) };
}
