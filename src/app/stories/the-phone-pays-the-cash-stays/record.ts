// The official record for each step: the events in data/sources/cash-events.json (through data.gen.ts), numbered in
// date order and placed at their month in the step's series.

// DATA ================================================================================================================
import { EVENTS, PAY_MONTHS, TIDE_FYS } from "./data.gen";

export interface StepEvent { n : number; k : number; month : string; label : string; note : string; source : string; url : string }

export const eventsFor = (slide : string, months : string[] = PAY_MONTHS) : StepEvent[] =>
    EVENTS.filter(e => e.slide === slide && e.month && months.includes(e.month))
        .sort((a, b) => (a.month as string).localeCompare(b.month as string))
        .map((e, i) => ({ ...e, month : e.month as string, n : i + 1, k : months.indexOf(e.month as string) }));

export const monthName = (ym : string) => new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month : "long", year : "numeric" });

// For a yearly series: each event's month falls in a financial year (April to March), and is placed at that year.
const fyOf = (ym : string) => { const y = +ym.slice(0, 4), m = +ym.slice(5); const s = m >= 4 ? y : y - 1; return `${s}-${String((s + 1) % 100).padStart(2, "0")}`; };
export const eventsForYears = (slide : string, years : string[] = TIDE_FYS) : StepEvent[] =>
    EVENTS.filter(e => e.slide === slide && e.month && years.includes(fyOf(e.month)))
        .sort((a, b) => (a.month as string).localeCompare(b.month as string))
        .map((e, i) => ({ ...e, month : e.month as string, n : i + 1, k : years.indexOf(fyOf(e.month as string)) }));

// Patterns with no month (the season): what the record says, in order.
export const patternsFor = (slide : string) => EVENTS.filter(e => e.slide === slide && !e.month);
