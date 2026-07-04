// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBalanceOfPaymentsUsd } from "@/lib/api/tables/balance-of-payments-usd";

// OTHER ===============================================================================================================
import BalanceOfPaymentsUsdPage from "./page.client";

export const metadata : Metadata = {
    title       : "Balance of payments — overall (US$) | External — Database on Indian Economy",
    description : "Quarterly balance of payments for India (overall presentation) in US$ million — current account, merchandise trade, invisibles, capital account, and monetary movements. Source: RBI Bulletin Table 40.",
    keywords    : [
        "balance of payments",
        "current account",
        "capital account",
        "merchandise trade",
        "invisibles",
        "foreign investment",
        "India",
        "RBI",
        "US dollar",
        "quarterly",
    ],
    openGraph   : {
        title       : "Balance of payments — overall (US$) | External — Database on Indian Economy",
        description : "Quarterly overall balance of payments for India in US$ million — current account, capital account, and monetary movements.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Balance of payments — overall (US$) | External — Database on Indian Economy",
        description : "Quarterly overall balance of payments for India in US$ million — current account, capital account, and monetary movements.",
    },
};

export default async function Page() {
    const data = await getBalanceOfPaymentsUsd();
    return <BalanceOfPaymentsUsdPage data={data} />;
}
