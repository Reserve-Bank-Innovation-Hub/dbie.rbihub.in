// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getUnionGovernmentAccounts } from "@/lib/api/tables/union-government-accounts";

// OTHER ===============================================================================================================
import UnionGovernmentAccountsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Union Government accounts at a glance | Government — Database on Indian Economy",
    description : "Monthly cumulative figures for Union Government receipts, expenditure, revenue deficit, fiscal deficit, and gross primary deficit in Rupees Crores. Source: Monthly RBI Bulletin Table 24.",
    keywords    : [
        "union government accounts",
        "fiscal deficit",
        "revenue deficit",
        "gross primary deficit",
        "revenue receipts",
        "capital expenditure",
        "government expenditure",
        "RBI",
        "India",
        "public finance",
    ],
    openGraph   : {
        title       : "Union Government accounts at a glance | Government — Database on Indian Economy",
        description : "Monthly cumulative figures for Union Government receipts, expenditure, revenue deficit, fiscal deficit, and gross primary deficit.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Union Government accounts at a glance | Government — Database on Indian Economy",
        description : "Monthly cumulative figures for Union Government receipts, expenditure, revenue deficit, fiscal deficit, and gross primary deficit.",
    },
};

export default async function Page() {
    // Fetch Union Government Accounts data (Server Component)
    const data = await getUnionGovernmentAccounts();

    return <UnionGovernmentAccountsPage data={data} />;
}
