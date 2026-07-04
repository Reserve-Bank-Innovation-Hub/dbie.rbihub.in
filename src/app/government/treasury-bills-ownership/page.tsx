// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getTreasuryBillsOwnership } from "@/lib/api/tables/treasury-bills-ownership";

// OTHER ===============================================================================================================
import TreasuryBillsOwnershipPage from "./page.client";

export const metadata : Metadata = {
    title       : "Treasury bills ownership pattern | Government — Database on Indian Economy",
    description : "Weekly outstanding amounts of Government of India treasury bills by holder category (banks, primary dealers, state governments, others) across 91-day, 182-day, 364-day, 14-day intermediate, and cash management bill tenors. Source: RBI Bulletin Table 25.",
    keywords    : [
        "treasury bills",
        "T-bills",
        "91-day",
        "182-day",
        "364-day",
        "cash management bills",
        "CMB",
        "ownership pattern",
        "Government of India",
        "RBI",
        "India",
    ],
    openGraph   : {
        title       : "Treasury bills ownership pattern | Government — Database on Indian Economy",
        description : "Weekly outstanding amounts of Government of India treasury bills by holder category across all tenors.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Treasury bills ownership pattern | Government — Database on Indian Economy",
        description : "Weekly outstanding amounts of Government of India treasury bills by holder category across all tenors.",
    },
};

export default async function Page() {
    // Fetch treasury bills ownership data (Server Component)
    const data = await getTreasuryBillsOwnership();

    return <TreasuryBillsOwnershipPage data={data} />;
}
