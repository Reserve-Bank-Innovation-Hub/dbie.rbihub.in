// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMoneyStockMeasures } from "@/lib/api/tables/money-stock-measures";

// OTHER ===============================================================================================================
import MoneyStockMeasuresPage from "./page.client";

export const metadata : Metadata = {
    title       : "Money stock measures | Banking — Database on Indian Economy",
    description : "Fortnightly money stock components and aggregates (M1, M2, M3, M4) published by the Reserve Bank of India, from 1951 onwards.",
    keywords    : [
        "money stock",
        "M1",
        "M2",
        "M3",
        "M4",
        "currency with the public",
        "demand deposits",
        "time deposits",
        "monetary aggregates",
        "RBI",
        "money supply",
    ],
    openGraph   : {
        title       : "Money stock measures | Banking — Database on Indian Economy",
        description : "Fortnightly money stock components and aggregates (M1, M2, M3, M4) published by the Reserve Bank of India, from 1951 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Money stock measures | Banking — Database on Indian Economy",
        description : "Fortnightly money stock components and aggregates (M1, M2, M3, M4) published by the Reserve Bank of India, from 1951 onwards.",
    },
};

export default async function Page() {
    const moneyStockData = await getMoneyStockMeasures();

    return <MoneyStockMeasuresPage moneyStockData={moneyStockData} />;
}
