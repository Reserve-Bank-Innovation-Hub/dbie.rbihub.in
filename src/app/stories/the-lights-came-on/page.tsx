// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TheLightsCameOnPage } from "./page.client";

// DATA ================================================================================================================
import { HEADLINE } from "./data.gen";

// The description is written from the same figures as the page, so a refresh of the data rewrites it.
const first = HEADLINE.marches.find(m => m.year === 2015) ?? HEADLINE.marches[0];
const month = (key : string) => new Date(`${key}-01T00:00:00Z`).toLocaleString("en-GB", { month : "long", year : "numeric", timeZone : "UTC" });

export const metadata : Metadata = {
    title       : "How households took over the bank loan book | Stories — Database on Indian Economy",
    description : `In ${month(HEADLINE.latest.quarter)} individuals owed ₹${Math.round(HEADLINE.latest.individuals)} of every ₹100 Indian banks had lent and private companies ₹${Math.round(HEADLINE.latest.privateCompanies)}, against ₹${Math.round(first.individuals)} and ₹${Math.round(first.privateCompanies)} in March 2015. Individuals' loan accounts tripled while the average loan, after prices, did not grow. A data story from the Reserve Bank's Basic Statistical Returns.`,
};

export default function Page() {
    return <TheLightsCameOnPage />;
}
