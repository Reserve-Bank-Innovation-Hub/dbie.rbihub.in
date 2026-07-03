// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getBusinessOfScheduledBanks } from "@/lib/api/tables/business-of-scheduled-banks";

// OTHER ===============================================================================================================
import BusinessOfScheduledBanksPage from "./page.client";

export const metadata : Metadata = {
    title       : "Business of scheduled banks | Banking — Database on Indian Economy",
    description : "Fortnightly balance-sheet aggregates for all scheduled banks and all scheduled commercial banks in India — liabilities, deposits, borrowings, investments and bank credit. Source: RBI Bulletin Table 14.",
    keywords    : [
        "scheduled banks",
        "scheduled commercial banks",
        "bank credit",
        "aggregate deposits",
        "liabilities",
        "investments",
        "RBI",
        "banking data",
        "India",
    ],
    openGraph   : {
        title       : "Business of scheduled banks | Banking — Database on Indian Economy",
        description : "Fortnightly balance-sheet aggregates for all scheduled banks and all scheduled commercial banks in India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Business of scheduled banks | Banking — Database on Indian Economy",
        description : "Fortnightly balance-sheet aggregates for all scheduled banks and all scheduled commercial banks in India.",
    },
};

export default async function Page() {
    // Fetch both bank-group sheets (Server Component)
    const data = await getBusinessOfScheduledBanks();

    return <BusinessOfScheduledBanksPage data={data} />;
}
