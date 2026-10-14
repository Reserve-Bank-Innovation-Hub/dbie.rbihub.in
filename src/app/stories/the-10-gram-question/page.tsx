// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TenGramQuestionPage } from "./page.client";

// DATA ================================================================================================================
import { HEADLINE, monthName, rs, timesWords } from "./data";

export const metadata : Metadata = {
    title       : "The 10-gram question | Stories — Database on Indian Economy",
    description : `Ten grams of gold cost ${rs(HEADLINE.first.price)} in Mumbai in ${monthName(HEADLINE.first.ym)} and ${rs(HEADLINE.last.price)} in ${monthName(HEADLINE.last.ym)}, ${timesWords(HEADLINE.times)} as much. How much of that is gold, how much the rupee, and how much the gap between the world price and Mumbai’s. Built from the prices and reserves published on the Reserve Bank’s DBIE.`,
};

export default function Page() {
    return <TenGramQuestionPage />;
}
