// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getNewCapitalIssues } from "@/lib/api/tables/new-capital-issues";

// OTHER ===============================================================================================================
import NewCapitalIssuesPage from "./page.client";

export const metadata : Metadata = {
    title       : "New capital issues | Markets — Database on Indian Economy",
    description : "Monthly new capital issues by non-government public limited companies in India — equity shares (public and rights) and bonds/debentures. Source: SEBI via RBI Bulletin Table 31.",
    keywords    : [
        "new capital issues",
        "equity shares",
        "public issue",
        "rights issue",
        "bonds",
        "debentures",
        "SEBI",
        "RBI",
        "capital market",
        "India",
    ],
    openGraph   : {
        title       : "New capital issues | Markets — Database on Indian Economy",
        description : "Monthly new capital issues by non-government public limited companies in India — equity shares (public and rights) and bonds/debentures.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "New capital issues | Markets — Database on Indian Economy",
        description : "Monthly new capital issues by non-government public limited companies in India — equity shares (public and rights) and bonds/debentures.",
    },
};

export default async function Page() {
    // Fetch new capital issues matrix (Server Component)
    const data = await getNewCapitalIssues();

    return <NewCapitalIssuesPage data={data} />;
}
