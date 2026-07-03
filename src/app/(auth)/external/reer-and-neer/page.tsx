// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getReerAndNeer } from "@/lib/api/tables/reer-and-neer";

// OTHER ===============================================================================================================
import ReerAndNeerPage from "./page.client";

export const metadata : Metadata = {
    title       : "REER and NEER | External sector — Database on Indian Economy",
    description : "Monthly indices of NEER and REER of the Indian rupee (40-currency basket, base 2015-16=100), trade-weighted and export-weighted.",
    keywords    : [
        "REER",
        "NEER",
        "real effective exchange rate",
        "nominal effective exchange rate",
        "Indian rupee",
        "external sector",
        "RBI",
    ],
    openGraph   : {
        title       : "REER and NEER | External sector — Database on Indian Economy",
        description : "Monthly indices of NEER and REER of the Indian rupee (40-currency basket, base 2015-16=100), trade-weighted and export-weighted.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "REER and NEER | External sector — Database on Indian Economy",
        description : "Monthly indices of NEER and REER of the Indian rupee (40-currency basket, base 2015-16=100), trade-weighted and export-weighted.",
    },
};

export default async function Page() {
    // Fetch monthly NEER and REER indices (Server Component)
    const reerNeerData = await getReerAndNeer();

    return <ReerAndNeerPage reerNeerData={reerNeerData} />;
}
