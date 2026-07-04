// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getSelectEconomicIndicators } from "@/lib/api/tables/select-economic-indicators";

// OTHER ===============================================================================================================
import SelectEconomicIndicatorsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Select economic indicators | Banking — Database on Indian Economy",
    description : "Monthly snapshot of India's key economic indicators — industrial production, money and banking, interest rates, inflation and foreign trade. Source: RBI Bulletin Table 1.",
    keywords    : [
        "select economic indicators",
        "IIP",
        "money supply",
        "interest rates",
        "inflation",
        "CPI",
        "WPI",
        "repo rate",
        "RBI",
        "India",
        "monthly",
    ],
    openGraph   : {
        title       : "Select economic indicators | Banking — Database on Indian Economy",
        description : "Monthly snapshot of India's key economic indicators — industrial production, money and banking, interest rates, inflation and foreign trade.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Select economic indicators | Banking — Database on Indian Economy",
        description : "Monthly snapshot of India's key economic indicators — industrial production, money and banking, interest rates, inflation and foreign trade.",
    },
};

export default async function Page() {
    // Fetch select economic indicators (Server Component)
    const data = await getSelectEconomicIndicators();

    return <SelectEconomicIndicatorsPage data={data} />;
}
