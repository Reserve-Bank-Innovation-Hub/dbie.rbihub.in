"use client";

// REACT CORE ==========================================================================================================
import { ReactNode, useRef, useState } from "react";

// UI ==================================================================================================================
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { useSize } from "./useSize";

// A chapter that holds the screen while its parts come in: the section is tall, its frame sticks, and as the reader
// scrolls the step count rises from one to `steps`. Anything inside marked r1, r2, … fades in once the step reaches
// its number, so the text comes first and the figure's parts follow. On a phone, or without motion, nothing sticks
// and everything is shown.
const PER_STEP = 55;                                    // svh of scroll per step

export const Pinned = ({ steps, id, className, children } : { steps : number; id ? : string; className ? : string; children : ReactNode }) => {
    const ref = useRef<HTMLElement>(null);
    const { ref : frameRef, width } = useSize<HTMLDivElement>();
    const reduced = !!useReducedMotion();
    const [ step, setStep ] = useState(1);
    const { scrollYProgress } = useScroll({ target : ref, offset : [ "start start", "end end" ] });
    useMotionValueEvent(scrollYProgress, "change", p => setStep(Math.max(1, Math.min(steps, 1 + Math.floor(p * steps)))));

    const still = reduced || (width > 0 && width < 900);
    const at = still ? steps : step;
    const cls = Array.from({ length : at }, (_, i) => `s${i + 1}`).join(" ");
    return (
        <section ref={ref} id={id} className={`chapter pinned ${className ?? ""} ${still ? "is-still" : ""} ${cls}`} style={still ? undefined : { height : `${100 + steps * PER_STEP}svh` }}>
            <div ref={frameRef} className="pinned-frame">{children}</div>
        </section>
    );
};
