// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBalanceOfPaymentsInr } from "@/lib/api/tables/balance-of-payments-inr";

// OTHER ===============================================================================================================
import BalanceOfPaymentsInrPage from "./page.client";

export const metadata : Metadata = {
    title       : "Balance of payments — overall (₹ crore) | External — Database on Indian Economy",
    description : "Quarterly balance of payments for India (overall presentation) in ₹ crore — current account, merchandise trade, invisibles, capital account, and monetary movements. Source: RBI Bulletin Table 41.",
    keywords    : [
        "balance of payments",
        "current account",
        "capital account",
        "merchandise trade",
        "invisibles",
        "foreign investment",
        "India",
        "RBI",
        "rupee",
        "crore",
        "quarterly",
    ],
    openGraph   : {
        title       : "Balance of payments — overall (₹ crore) | External — Database on Indian Economy",
        description : "Quarterly overall balance of payments for India in ₹ crore — current account, capital account, and monetary movements.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Balance of payments — overall (₹ crore) | External — Database on Indian Economy",
        description : "Quarterly overall balance of payments for India in ₹ crore — current account, capital account, and monetary movements.",
    },
};

export default async function Page() {
    const data = await getBalanceOfPaymentsInr();
    return <BalanceOfPaymentsInrPage data={data} />;
}
