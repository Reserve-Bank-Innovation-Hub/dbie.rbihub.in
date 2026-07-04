// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getStateFinancialAccommodation } from "@/lib/api/tables/state-financial-accommodation";

// OTHER ===============================================================================================================
import StateFinancialAccommodationPage from "./page.client";

export const metadata : Metadata = {
    title       : "State financial accommodation | Government — Database on Indian Economy",
    description : "State-wise use of Special Drawing Facility, Ways and Means Advances, and Overdraft extended by the Reserve Bank of India to state governments. Monthly data from the RBI Bulletin.",
    keywords    : [
        "state government",
        "financial accommodation",
        "Special Drawing Facility",
        "SDF",
        "Ways and Means Advances",
        "WMA",
        "Overdraft",
        "OD",
        "RBI",
        "state finances",
        "India",
    ],
    openGraph   : {
        title       : "State financial accommodation | Government — Database on Indian Economy",
        description : "State-wise use of Special Drawing Facility, Ways and Means Advances, and Overdraft from the RBI. Monthly data.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "State financial accommodation | Government — Database on Indian Economy",
        description : "State-wise use of Special Drawing Facility, Ways and Means Advances, and Overdraft from the RBI. Monthly data.",
    },
};

export default async function Page() {
    const data = await getStateFinancialAccommodation();

    return <StateFinancialAccommodationPage data={data} />;
}
