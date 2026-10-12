// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { PhonePaysPage } from "./page.client";

export const metadata : Metadata = {
    title       : "The phone pays, but the cash stays | Stories — Database on Indian Economy",
    description : "UPI payments grew 19.4 times between November 2019 and July 2026. Currency in circulation grew 2.5 times between March 2016 and March 2026. Built from the data published on the Reserve Bank’s DBIE.",
};

export default function Page() {
    return <PhonePaysPage />;
}
