"use client";

// The story's three sections, as a slim marker at the top of the screen in place of a label on every slide: the
// section of the slide in view is lit, and each name takes the reader to its first slide. It shows only while a slide
// that belongs to a section is in view (not on the title, the close or the notes on the data).

// REACT CORE ==========================================================================================================
import { useEffect, useState } from "react";

export const SECTIONS = [ "UPI and cash", "Drawing cash", "The notes" ] as const;

export const SectionRail = () => {
    const [ now, setNow ] = useState<number | null>(null);
    useEffect(() => {
        const slides = [ ...document.querySelectorAll<HTMLElement>("#the-phone-pays-the-cash-stays-page [data-slide]") ];
        // the slide whose middle is nearest the middle of the screen
        const pick = () => {
            let best : HTMLElement | null = null, gap = Infinity;
            for (const el of slides) {
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
        const first = document.querySelector<HTMLElement>(`#the-phone-pays-the-cash-stays-page [data-section="${k}"]`);
        first?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    return (
        <nav className={`section-rail ${now ? "is-shown" : ""}`} aria-label="Sections of the story">
            {SECTIONS.map((name, i) => (
                <button key={name} type="button" className={now === i + 1 ? "is-on" : ""} aria-current={now === i + 1 ? "true" : undefined} onClick={() => go(i + 1)}>
                    <span className="rail-n">{i + 1}</span><span className="rail-name">{name}</span>
                </button>
            ))}
        </nav>
    );
};
