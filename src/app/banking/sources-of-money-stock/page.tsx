// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getSourcesOfMoneyStock } from "@/lib/api/tables/sources-of-money-stock";

// OTHER ===============================================================================================================
import SourcesOfMoneyStockPage from "./page.client";

export const metadata : Metadata = {
    title       : "Sources of money stock (M3) | Banking — Database on Indian Economy",
    description : "Fortnightly sources of M3 money stock — net bank credit to government, bank credit to commercial sector, net foreign exchange assets, and non-monetary liabilities — published by the Reserve Bank of India.",
    keywords    : [
        "sources of money stock",
        "M3",
        "net bank credit to government",
        "bank credit to commercial sector",
        "net foreign exchange assets",
        "non-monetary liabilities",
        "monetary survey",
        "RBI",
        "money supply",
    ],
    openGraph   : {
        title       : "Sources of money stock (M3) | Banking — Database on Indian Economy",
        description : "Fortnightly sources of M3 money stock published by the Reserve Bank of India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Sources of money stock (M3) | Banking — Database on Indian Economy",
        description : "Fortnightly sources of M3 money stock published by the Reserve Bank of India.",
    },
};

export default async function Page() {
    const sourcesData = await getSourcesOfMoneyStock();

    return <SourcesOfMoneyStockPage sourcesData={sourcesData} />;
}
