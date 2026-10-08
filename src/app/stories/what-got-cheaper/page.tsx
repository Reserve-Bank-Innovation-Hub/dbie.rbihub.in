// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { WhatGotCheaperPage } from "./page.client";

// DATA ================================================================================================================
import { COUNTS, FOLLOWED, HEADLINE, ITEMS } from "./data.gen";

// The description is built from the processor's figures, so a refresh of the data refreshes it.
const itemNow = (name : string) => ITEMS.find(i => i.code === FOLLOWED.find(f => f.name === name)?.code)?.now ?? 100;
const solar = itemNow("Solar power systems"), jasmine = itemNow("Jasmine");
const timesWord = (v : number) => ([ "", "", "twice", "three", "four", "five", "six", "seven", "eight" ][Math.round(v)] ?? `${Math.round(v)}`) + (Math.round(v) >= 3 ? " times" : "");

export const metadata : Metadata = {
    title       : "What got cheaper | Stories — Database on Indian Economy",
    description : `Of the ${COUNTS.items} goods in India’s wholesale price index, ${COUNTS.cheaper} cost less in ${HEADLINE.nowFy} than in ${HEADLINE.baseFy} and ${COUNTS.doubled} cost at least twice as much. Solar power systems ${solar < 50 ? "fell by more than half" : "fell"}, and jasmine costs ${timesWord(jasmine / 100)} what it did. Built from the Office of the Economic Adviser’s index as published on the Reserve Bank’s DBIE.`,
};

export default function Page() {
    return <WhatGotCheaperPage />;
}
