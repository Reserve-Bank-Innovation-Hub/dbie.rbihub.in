// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBopBpm6Usd } from "@/lib/api/tables/bop-bpm6-usd";

// OTHER ===============================================================================================================
import BopBpm6UsdPage from "./page.client";

export const metadata : Metadata = {
    title       : "BoP — BPM6 standard presentation (US$) | External — Database on Indian Economy",
    description : "Quarterly balance of payments for India as per the BPM6 standard presentation in US$ million — current account, capital account, financial account, and net errors and omissions. Source: RBI Bulletin Table 42.",
    keywords    : [
        "balance of payments",
        "BPM6",
        "current account",
        "capital account",
        "financial account",
        "India",
        "RBI",
        "US dollar",
        "quarterly",
    ],
    openGraph   : {
        title       : "BoP — BPM6 standard presentation (US$) | External — Database on Indian Economy",
        description : "Quarterly balance of payments for India as per the BPM6 standard presentation in US$ million.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "BoP — BPM6 standard presentation (US$) | External — Database on Indian Economy",
        description : "Quarterly balance of payments for India as per the BPM6 standard presentation in US$ million.",
    },
};

export default async function Page() {
    const data = await getBopBpm6Usd();
    return <BopBpm6UsdPage data={data} />;
}
