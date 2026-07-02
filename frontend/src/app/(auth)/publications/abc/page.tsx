// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getCreditClassification } from "@/lib/api/publications";

// OTHER ===============================================================================================================
import CreditClassificationPage from "./page.client";

export const metadata: Metadata = {
    title       : "Credit Classification | Publications — Database on Indian Economy",
    description : "Organisation-wise classification of outstanding credit of scheduled commercial banks according to occupation",
    keywords    : [
        "credit classification",
        "bank credit",
        "SCB credit",
        "occupation wise credit",
        "organization credit",
        "banking statistics",
        "RBI"
    ],
    openGraph   : {
        title       : "Credit Classification | Publications — Database on Indian Economy",
        description : "Organisation-wise classification of outstanding credit of scheduled commercial banks according to occupation",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Credit Classification | Publications — Database on Indian Economy",
        description : "Organisation-wise classification of outstanding credit of scheduled commercial banks according to occupation",
    },
};

export default async function Page() {
    // Fetch credit classification data from Go API (Server Component)
    const creditData = await getCreditClassification();

    return <CreditClassificationPage creditData={creditData} />;
}
