// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getHouseholdFinancialStocks } from "@/lib/api/tables/household-financial-stocks";

// OTHER ===============================================================================================================
import HouseholdFinancialStocksPage from "./page.client";

export const metadata : Metadata = {
    title       : "Household financial stocks | Banking — Database on Indian Economy",
    description : "Quarter-end stocks of financial assets and liabilities of households in India — bank deposits, life insurance funds, currency, mutual funds, pension funds, small savings, and borrowings. Source: RBI Bulletin Table 52(b).",
    keywords    : [
        "household financial assets",
        "household financial liabilities",
        "bank deposits",
        "life insurance funds",
        "mutual funds",
        "pension funds",
        "small savings",
        "household savings",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Household financial stocks | Banking — Database on Indian Economy",
        description : "Quarter-end stocks of financial assets and liabilities of households in India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Household financial stocks | Banking — Database on Indian Economy",
        description : "Quarter-end stocks of financial assets and liabilities of households in India.",
    },
};

export default async function Page() {
    // Fetch household financial stocks matrix (Server Component)
    const data = await getHouseholdFinancialStocks();

    return <HouseholdFinancialStocksPage data={data} />;
}
