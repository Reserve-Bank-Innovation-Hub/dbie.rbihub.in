// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getFinancialMarketsTurnover } from "@/lib/api/tables/financial-markets-turnover";

// OTHER ===============================================================================================================
import FinancialMarketsTurnoverPage from "./page.client";

export const metadata : Metadata = {
    title       : "Financial markets turnover | Markets — Database on Indian Economy",
    description : "Average daily turnover (₹ Crores) in select Indian financial markets — call money, repo, forex, government securities and treasury bills — from 2008 onwards.",
    keywords    : [
        "financial markets",
        "call money market",
        "money market turnover",
        "triparty repo",
        "market repo",
        "government securities",
        "treasury bills",
        "forex turnover",
        "RBI Bulletin Table 30",
    ],
    openGraph   : {
        title       : "Financial markets turnover | Markets — Database on Indian Economy",
        description : "Average daily turnover (₹ Crores) in select Indian financial markets — call money, repo, forex, government securities and treasury bills — from 2008 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Financial markets turnover | Markets — Database on Indian Economy",
        description : "Average daily turnover (₹ Crores) in select Indian financial markets — call money, repo, forex, government securities and treasury bills — from 2008 onwards.",
    },
};

export default async function Page() {
    // Fetch turnover data (Server Component)
    const turnoverData = await getFinancialMarketsTurnover();

    return <FinancialMarketsTurnoverPage turnoverData={turnoverData} />;
}
