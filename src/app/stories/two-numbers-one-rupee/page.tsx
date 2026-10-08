// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TwoNumbersOneRupeePage } from "./page.client";
import { HEADLINE } from "./data.gen";

const { usd, range } = HEADLINE;

export const metadata : Metadata = {
    title       : "Two numbers, one rupee | Stories — Database on Indian Economy",
    description : `The rupee fell from ₹${usd.fy0.toFixed(2)} a dollar in ${HEADLINE.fy0} to ₹${usd.fyN.toFixed(2)} in ${HEADLINE.fyN}. Against the 40 currencies India trades in, adjusted for prices, it stayed between ${range.min.toFixed(1)} and ${range.max.toFixed(1)}. One rupee, seen from three sides: a data story from the Reserve Bank’s own figures.`,
};

export default function Page() {
    return <TwoNumbersOneRupeePage />;
}
