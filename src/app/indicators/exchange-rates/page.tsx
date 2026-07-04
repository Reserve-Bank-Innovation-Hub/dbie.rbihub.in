// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getExchangeRates } from "@/lib/api/indicators";

// OTHER ===============================================================================================================
import ExchangeRatesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Exchange Rates | Indicators — Database on Indian Economy",
    description : "Daily exchange rates of the Indian Rupee against major foreign currencies including US Dollar, Pound Sterling, Euro, and Japanese Yen.",
    keywords    : ["exchange rates", "Indian Rupee", "INR", "USD", "GBP", "EUR", "JPY", "foreign exchange", "forex", "currency rates", "RBI"],
    openGraph   : {
        title       : "Exchange Rates | Indicators — Database on Indian Economy",
        description : "Daily exchange rates of the Indian Rupee against major foreign currencies including US Dollar, Pound Sterling, Euro, and Japanese Yen.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Exchange Rates | Indicators — Database on Indian Economy",
        description : "Daily exchange rates of the Indian Rupee against major foreign currencies including US Dollar, Pound Sterling, Euro, and Japanese Yen.",
    },
};

export default async function Page() {
    // Fetch exchange rate data from Go API (Server Component)
    const exchangeRateData = await getExchangeRates();

    // Serialize dates for client component
    const serializedData = {
        ...exchangeRateData,
        data: exchangeRateData.data.map(item => ({
            ...item,
            date: item.date.toISOString(),
        }))
    };

    return <ExchangeRatesPage exchangeRateData={serializedData} />;
}
