// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getStateCooperativeBanks } from "@/lib/api/tables/state-cooperative-banks";

// OTHER ===============================================================================================================
import StateCooperativeBanksPage from "./page.client";

export const metadata : Metadata = {
    title       : "State co-operative banks | Banking — Database on Indian Economy",
    description : "Fortnightly balance-sheet data for state co-operative banks maintaining accounts with the Reserve Bank of India — deposits, liabilities, borrowings, investments and bank credit. Source: RBI Bulletin Table 17.",
    keywords    : [
        "state co-operative banks",
        "cooperative banks",
        "aggregate deposits",
        "bank credit",
        "investments",
        "RBI",
        "banking data",
        "India",
    ],
    openGraph   : {
        title       : "State co-operative banks | Banking — Database on Indian Economy",
        description : "Fortnightly balance-sheet data for state co-operative banks maintaining accounts with the Reserve Bank of India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "State co-operative banks | Banking — Database on Indian Economy",
        description : "Fortnightly balance-sheet data for state co-operative banks maintaining accounts with the Reserve Bank of India.",
    },
};

export default async function Page() {
    // Fetch state co-operative banks data (Server Component)
    const data = await getStateCooperativeBanks();

    return <StateCooperativeBanksPage data={data} />;
}
