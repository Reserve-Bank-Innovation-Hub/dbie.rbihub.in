// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getDailyCallMoneyRates } from "@/lib/api/tables/daily-call-money-rates";

// OTHER ===============================================================================================================
import DailyCallMoneyRatesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Daily call money rates | Markets — Database on Indian Economy",
    description : "Daily weighted average call and notice money rates in India, showing minimum and maximum rates for borrowings and lendings, from 2005 onwards.",
    keywords    : [
        "call money rates",
        "notice money rates",
        "overnight rates",
        "money market",
        "RBI",
        "India",
        "interbank rates",
    ],
    openGraph   : {
        title       : "Daily call money rates | Markets — Database on Indian Economy",
        description : "Daily weighted average call and notice money rates in India, showing minimum and maximum rates for borrowings and lendings, from 2005 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Daily call money rates | Markets — Database on Indian Economy",
        description : "Daily weighted average call and notice money rates in India, showing minimum and maximum rates for borrowings and lendings, from 2005 onwards.",
    },
};

export default async function Page() {
    // Fetch daily call money rates (Server Component)
    const ratesData = await getDailyCallMoneyRates();

    return <DailyCallMoneyRatesPage ratesData={ratesData} />;
}
