"use client";

// The story's three sections, one for each measure, as a slim marker at the top of the screen in place of a label on
// every card: the section of the step in view is lit, and each name takes the reader to its first step. It shows only
// while a step that belongs to a section is in view.

// REACT CORE ==========================================================================================================
import { useEffect, useState } from "react";

export const SectionRail = ({ names } : { names : string[] }) => {
    const [ now, setNow ] = useState<number | null>(null);
    useEffect(() => {
        const steps = [ ...document.querySelectorAll<HTMLElement>("#rupee-and-world-page [data-scene], #rupee-and-world-page [data-page-stop]") ];
        // the step whose middle is nearest the middle of the screen
        const pick = () => {
            let best : HTMLElement | null = null, gap = Infinity;
            for (const el of steps) {
                const r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight / 2);
                if (d < gap) { gap = d; best = el; }
            }
            const s = best && gap < innerHeight * 0.5 ? best.dataset.section : undefined;
            setNow(s ? +s : null);
        };
        pick();
        addEventListener("scroll", pick, { passive : true });
        addEventListener("resize", pick);
        return () => { removeEventListener("scroll", pick); removeEventListener("resize", pick); };
    }, []);
    const go = (k : number) => {
        const first = document.querySelector<HTMLElement>(`#rupee-and-world-page [data-section="${k}"]`);
        first?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block : "center" });
    };
    return (
        <nav className={`section-rail ${now ? "is-shown" : ""}`} aria-label="Sections of the story">
            {names.map((name, i) => (
                <button key={name} type="button" className={now === i + 1 ? "is-on" : ""} aria-current={now === i + 1 ? "true" : undefined} onClick={() => go(i + 1)}>
                    <span className="rail-n">{i + 1}</span><span className="rail-name">{name}</span>
                </button>
            ))}
        </nav>
    );
};
