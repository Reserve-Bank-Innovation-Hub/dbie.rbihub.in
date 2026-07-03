// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getDatedSecuritiesOwnership } from "@/lib/api/tables/dated-securities-ownership";

// OTHER ===============================================================================================================
import DatedSecuritiesOwnershipPage from "./page.client";

export const metadata : Metadata = {
    title       : "Ownership pattern of government securities | Government — Database on Indian Economy",
    description : "Quarterly ownership pattern of Government of India dated securities, state government securities, and treasury bills — percentage shares by holder category. Source: RBI Bulletin table 47.",
    keywords    : [
        "government securities",
        "dated securities",
        "treasury bills",
        "state government securities",
        "ownership pattern",
        "commercial banks",
        "insurance companies",
        "RBI",
        "India",
        "government debt",
    ],
    openGraph   : {
        title       : "Ownership pattern of government securities | Government — Database on Indian Economy",
        description : "Quarterly ownership pattern of Government of India dated securities, state government securities, and treasury bills — percentage shares by holder category.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Ownership pattern of government securities | Government — Database on Indian Economy",
        description : "Quarterly ownership pattern of Government of India dated securities, state government securities, and treasury bills — percentage shares by holder category.",
    },
};

export default async function Page() {
    // Fetch ownership pattern data (Server Component)
    const data = await getDatedSecuritiesOwnership();

    return <DatedSecuritiesOwnershipPage data={data} />;
}
