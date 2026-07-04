// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getRbiLiabilitiesAndAssets } from "@/lib/api/tables/rbi-liabilities-and-assets";

// OTHER ===============================================================================================================
import RbiLiabilitiesAndAssetsPage from "./page.client";

export const metadata : Metadata = {
    title       : "RBI liabilities and assets | Banking — Database on Indian Economy",
    description : "Weekly balance sheet of the Reserve Bank of India — issue department and banking department liabilities and assets in Rupees Crores. Source: RBI Bulletin Table 2.",
    keywords    : [
        "Reserve Bank of India",
        "RBI balance sheet",
        "liabilities and assets",
        "issue department",
        "banking department",
        "notes in circulation",
        "gold",
        "deposits",
        "loans and advances",
        "RBI Bulletin",
        "India",
    ],
    openGraph   : {
        title       : "RBI liabilities and assets | Banking — Database on Indian Economy",
        description : "Weekly balance sheet of the Reserve Bank of India — issue and banking department liabilities and assets, ₹ crore.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "RBI liabilities and assets | Banking — Database on Indian Economy",
        description : "Weekly balance sheet of the Reserve Bank of India — issue and banking department liabilities and assets, ₹ crore.",
    },
};

export default async function Page() {
    const data = await getRbiLiabilitiesAndAssets();
    return <RbiLiabilitiesAndAssetsPage data={data} />;
}
