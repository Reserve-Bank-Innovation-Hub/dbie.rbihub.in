// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getScbInvestments } from "@/lib/api/tables/scb-investments";

// OTHER ===============================================================================================================
import ScbInvestmentsPageClient from "./page.client";

export const metadata : Metadata = {
    title       : "Scheduled commercial banks' investments | Banking — Database on Indian Economy",
    description : "Fortnightly investment data for scheduled commercial banks across SLR securities, non-SLR government securities, commercial paper, shares, bonds/debentures and mutual funds. Source: RBI Bulletin Table 13.",
    keywords    : [
        "scheduled commercial banks",
        "SCB investments",
        "SLR securities",
        "non-SLR",
        "commercial paper",
        "bonds",
        "debentures",
        "mutual funds",
        "Reserve Bank of India",
        "RBI Bulletin",
        "India",
    ],
    openGraph   : {
        title       : "Scheduled commercial banks' investments | Banking — Database on Indian Economy",
        description : "Fortnightly investment data for scheduled commercial banks across SLR securities, non-SLR government securities, commercial paper, shares, bonds/debentures and mutual funds.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Scheduled commercial banks' investments | Banking — Database on Indian Economy",
        description : "Fortnightly investment data for scheduled commercial banks across SLR securities, non-SLR government securities, commercial paper, shares, bonds/debentures and mutual funds.",
    },
};

export default async function Page() {
    const data = await getScbInvestments();
    return <ScbInvestmentsPageClient data={data} />;
}
