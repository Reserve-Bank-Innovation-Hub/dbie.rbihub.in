// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getStateMarketBorrowings } from "@/lib/api/tables/state-market-borrowings";

// OTHER ===============================================================================================================
import StateMarketBorrowingsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Market borrowings of state governments | Government — Database on Indian Economy",
    description : "State-wise gross and net market borrowings by state governments in India, in ₹ crore — annual (fiscal-year) and monthly data. Source: Monthly RBI Bulletin Table 51.",
    keywords    : [
        "state market borrowings",
        "state government debt",
        "gross amount raised",
        "net amount raised",
        "state borrowings",
        "fiscal year",
        "RBI Bulletin",
        "India",
        "public finance",
        "state governments",
    ],
    openGraph   : {
        title       : "Market borrowings of state governments | Government — Database on Indian Economy",
        description : "State-wise gross and net market borrowings by state governments in India — annual and monthly data in ₹ crore.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Market borrowings of state governments | Government — Database on Indian Economy",
        description : "State-wise gross and net market borrowings by state governments in India — annual and monthly data in ₹ crore.",
    },
};

export default async function Page() {
    // Fetch state market borrowings data (Server Component)
    const data = await getStateMarketBorrowings();

    return <StateMarketBorrowingsPage data={data} />;
}
