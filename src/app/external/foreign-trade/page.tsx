// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getForeignTrade } from "@/lib/api/tables/foreign-trade";

// OTHER ===============================================================================================================
import ForeignTradePage from "./page.client";

export const metadata : Metadata = {
    title       : "Foreign trade | External sector — Database on Indian Economy",
    description : "Monthly India foreign trade data — exports, imports and trade balance in ₹ crore and US$ millions, with oil and non-oil breakdowns. RBI Bulletin Table 32.",
    keywords    : [
        "India foreign trade",
        "exports",
        "imports",
        "trade balance",
        "oil exports",
        "non-oil exports",
        "RBI",
        "external sector",
    ],
    openGraph   : {
        title       : "Foreign trade | External sector — Database on Indian Economy",
        description : "Monthly India foreign trade data — exports, imports and trade balance in ₹ crore and US$ millions, with oil and non-oil breakdowns.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Foreign trade | External sector — Database on Indian Economy",
        description : "Monthly India foreign trade data — exports, imports and trade balance in ₹ crore and US$ millions, with oil and non-oil breakdowns.",
    },
};

export default async function Page() {
    const tradeData = await getForeignTrade();

    return <ForeignTradePage tradeData={tradeData} />;
}
