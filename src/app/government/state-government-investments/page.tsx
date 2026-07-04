// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getStateGovernmentInvestments } from "@/lib/api/tables/state-government-investments";

// OTHER ===============================================================================================================
import StateGovernmentInvestmentsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Investments by state governments | Government — Database on Indian Economy",
    description : "Monthly state-wise investments in Consolidated Sinking Fund (CSF), Guarantee Redemption Fund (GRF), Auction Treasury Bills (ATBs) and Budget Stabilisation Fund (BSF) in ₹ Crores. Source: Reserve Bank of India Bulletin Table 50.",
    keywords    : [
        "state government investments",
        "Consolidated Sinking Fund",
        "CSF",
        "Guarantee Redemption Fund",
        "GRF",
        "Auction Treasury Bills",
        "ATBs",
        "Budget Stabilisation Fund",
        "BSF",
        "state finances",
        "RBI",
        "India",
        "public finance",
    ],
    openGraph   : {
        title       : "Investments by state governments | Government — Database on Indian Economy",
        description : "Monthly state-wise investments in sinking, redemption and stabilisation funds and treasury bills, ₹ Crore.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Investments by state governments | Government — Database on Indian Economy",
        description : "Monthly state-wise investments in sinking, redemption and stabilisation funds and treasury bills, ₹ Crore.",
    },
};

export default async function Page() {
    // Fetch state government investments matrix (Server Component)
    const data = await getStateGovernmentInvestments();

    return <StateGovernmentInvestmentsPage data={data} />;
}
