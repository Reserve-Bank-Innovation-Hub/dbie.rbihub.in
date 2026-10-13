// The official record for each step: the events in data/sources/mimo-events.json (through data.gen.ts), numbered in
// date order and placed at their month (or financial year) in the step's series.

// DATA ================================================================================================================
import { EVENTS } from "./data.gen";

export interface StepEvent { n : number; k : number; day : string; month : string; label : string; note : string; source : string; url : string }

// 24-03-2020, as the story writes dates
export const dayName = (d : string) => `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`;
export const monthName = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });
export const fyOf = (d : string) => { const y = +d.slice(0, 4), m = +d.slice(5, 7); const s = m >= 4 ? y : y - 1; return `${s}-${String((s + 1) % 100).padStart(2, "0")}`; };

// `at` places an event in the step's series: its month among months, or its financial year among years; null leaves it out
export const eventsFor = (slide : string, at : (day : string) => number | null) : StepEvent[] =>
    EVENTS.filter(e => e.slide === slide)
        .sort((a, b) => a.day.localeCompare(b.day))
        .map(e => ({ ...e, month : e.day.slice(0, 7), k : at(e.day) }))
        .filter((e) : e is typeof e & { k : number } => e.k !== null && e.k >= 0)
        .map((e, i) => ({ ...e, n : i + 1 }));
