// REACT CORE ==========================================================================================================
import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// LOCAL COMPONENTS ====================================================================================================
import { WhatOneLakhBoughtPage } from "./page.client";
import type { NoteArt } from "./NoteGrid";

// DATA ================================================================================================================
import { FROM_YEAR, TO_YEAR } from "./data";

export const metadata : Metadata = {
    title       : "What ₹1 lakh could buy | Stories — Database on Indian Economy",
    description : `One sum, ₹1 lakh, carried from ${FROM_YEAR} to ${TO_YEAR}: what it bought each year in gold, silver, a mason’s days, dollars and wheat, and what it is worth today. Built from the prices published on the Reserve Bank’s DBIE.`,
};

// The hero's ₹1,000 note, read from note-1000.svg beside this file at build time: its viewBox and everything inside the
// <svg> element, which the grid inlines as one symbol. Replacing the file replaces the note.
const noteArt = () : NoteArt => {
    const raw = readFileSync(join(process.cwd(), "src/app/stories/what-one-lakh-bought/note-1000.svg"), "utf8");
    const viewBox = /<svg[^>]*\sviewBox="([^"]+)"/.exec(raw)?.[1];
    const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1];
    if (!viewBox || !inner) throw new Error("note-1000.svg needs an <svg> element with a viewBox");
    return { viewBox, markup : inner.trim() };
};

export default function Page() {
    return <WhatOneLakhBoughtPage note={noteArt()} />;
}
