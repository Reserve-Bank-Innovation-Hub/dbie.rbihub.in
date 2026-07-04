// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getPublicDistributionSystemData } from "@/lib/api/tables/public-distribution-system-procurement-off-take-and-stocks";

// OTHER ===============================================================================================================
import PublicDistributionSystemPage from "./page.client";

export const metadata : Metadata = {
    title       : "Public distribution system — procurement, off-take and stocks | Handbook — Database on Indian Economy",
    description : "Annual data on public distribution system procurement, off-take and stocks of rice and wheat in India (lakhs tonnes).",
    keywords    : [
        "public distribution system",
        "PDS",
        "procurement",
        "off-take",
        "stocks",
        "rice",
        "wheat",
        "foodgrain",
        "food security",
        "India",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Public distribution system — procurement, off-take and stocks | Handbook — Database on Indian Economy",
        description : "Annual data on public distribution system procurement, off-take and stocks of rice and wheat in India (lakhs tonnes).",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Public distribution system — procurement, off-take and stocks | Handbook — Database on Indian Economy",
        description : "Annual data on public distribution system procurement, off-take and stocks of rice and wheat in India (lakhs tonnes).",
    },
};

export default function Page() {
    const data = getPublicDistributionSystemData();

    return <PublicDistributionSystemPage data={data} />;
}
