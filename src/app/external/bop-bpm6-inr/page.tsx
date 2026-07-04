// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBopBpm6Inr } from "@/lib/api/tables/bop-bpm6-inr";

// OTHER ===============================================================================================================
import BopBpm6InrPage from "./page.client";

export const metadata : Metadata = {
    title       : "BoP — BPM6 standard presentation (₹ crore) | External — Database on Indian Economy",
    description : "Quarterly balance of payments for India as per the BPM6 standard presentation in ₹ crore — current account, capital account, financial account, and net errors and omissions. Source: RBI Bulletin Table 43.",
    keywords    : [
        "balance of payments",
        "BPM6",
        "current account",
        "capital account",
        "financial account",
        "India",
        "RBI",
        "rupee",
        "quarterly",
    ],
    openGraph   : {
        title       : "BoP — BPM6 standard presentation (₹ crore) | External — Database on Indian Economy",
        description : "Quarterly balance of payments for India as per the BPM6 standard presentation in ₹ crore.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "BoP — BPM6 standard presentation (₹ crore) | External — Database on Indian Economy",
        description : "Quarterly balance of payments for India as per the BPM6 standard presentation in ₹ crore.",
    },
};

export default async function Page() {
    const data = await getBopBpm6Inr();
    return <BopBpm6InrPage data={data} />;
}
