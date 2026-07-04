// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getInternationalInvestmentPosition } from "@/lib/api/tables/international-investment-position";

// OTHER ===============================================================================================================
import InternationalInvestmentPositionPage from "./page.client";

export const metadata : Metadata = {
    title       : "International investment position | External sector — Database on Indian Economy",
    description : "Quarterly international investment position (IIP) of India — external assets and liabilities per IMF BPM6, in US$ millions.",
    keywords    : [
        "international investment position",
        "IIP",
        "external assets",
        "external liabilities",
        "BPM6",
        "IMF",
        "RBI",
        "India",
        "balance of payments",
        "net IIP",
    ],
    openGraph   : {
        title       : "International investment position | External sector — Database on Indian Economy",
        description : "Quarterly international investment position (IIP) of India — external assets and liabilities per IMF BPM6, in US$ millions.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "International investment position | External sector — Database on Indian Economy",
        description : "Quarterly international investment position (IIP) of India — external assets and liabilities per IMF BPM6, in US$ millions.",
    },
};

export default async function Page() {
    // Fetch IIP matrix (Server Component)
    const data = await getInternationalInvestmentPosition();

    return <InternationalInvestmentPositionPage data={data} />;
}
