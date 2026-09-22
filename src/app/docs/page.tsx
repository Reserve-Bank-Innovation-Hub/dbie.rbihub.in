// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import DocsOverviewPage from "./page.client";

export const metadata: Metadata = {
    title       : "Docs — Database on Indian Economy",
    description : "How this site works — RBI's Database on Indian Economy scraped in full into one database, served as curated pages and a read-only data API — and how to use it, query it with AI, or run the pipeline yourself",
    keywords    : [
        "documentation",
        "help",
        "DBIE",
        "RBI",
        "database on Indian economy",
    ],
    openGraph   : {
        title       : "Docs — Database on Indian Economy",
        description : "How this site works, and how to use it, call its data API, query it with AI, or run the pipeline yourself",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Docs — Database on Indian Economy",
        description : "How this site works, and how to use it, call its data API, query it with AI, or run the pipeline yourself",
    },
};

export default function Page() {
    return <DocsOverviewPage />;
}
