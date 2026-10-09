"use client";

// REACT CORE ==========================================================================================================
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { useInView, useReducedMotion } from "framer-motion";

// A chapter that fills the screen and whose parts come in one after another: once the chapter has scrolled into view
// the step count rises from one to `steps` on a timer, and anything inside marked r1, r2, … fades in once the step
// reaches its number, so the text comes first and the figure's parts follow. With `pin` the chapter also holds the
// screen for a stretch of scroll before the page moves on. Without motion everything is shown and nothing holds.
const BEAT = 650;                                       // ms between steps
const HOLD = 80;                                        // svh of scroll a pinned chapter holds for

export const Pinned = ({ steps, id, className, pin = false, children } : { steps : number; id ? : string; className ? : string; pin ? : boolean; children : ReactNode }) => {
    const ref = useRef<HTMLElement>(null);
    const reduced = !!useReducedMotion();
    const inView = useInView(ref, { once : true, amount : 0.3 });
    const [ step, setStep ] = useState(1);

    useEffect(() => {
        if (!inView || reduced) return;
        let n = 1;
        const t = setInterval(() => { n += 1; setStep(n); if (n >= steps) clearInterval(t); }, BEAT);
        return () => clearInterval(t);
    }, [ inView, reduced, steps ]);

    const at = reduced ? steps : step;
    const cls = Array.from({ length : at }, (_, i) => `s${i + 1}`).join(" ");
    return (
        <section ref={ref} id={id} className={`chapter pinned ${className ?? ""} ${pin && !reduced ? "is-pinned" : ""} ${reduced ? "is-still" : ""} ${cls}`} style={pin && !reduced ? { "--hold" : `${100 + HOLD}svh` } as CSSProperties : undefined}>
            <div className="pinned-frame">{children}</div>
        </section>
    );
};
