// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import UsingTheSitePage from "./page.client";

export const metadata: Metadata = {
    title       : "Using the site | Docs — Database on Indian Economy",
    description : "Finding tables and series, reading the charts and grids, searching from anywhere, and interpreting units and observation dates",
    keywords    : [
        "documentation",
        "help",
        "search",
        "charts",
        "tables",
        "grids",
        "DBIE",
    ],
    openGraph   : {
        title       : "Using the site | Docs — Database on Indian Economy",
        description : "Finding tables and series, reading the charts and grids, and searching from anywhere",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Using the site | Docs — Database on Indian Economy",
        description : "Finding tables and series, reading the charts and grids, and searching from anywhere",
    },
};

export default function Page() {
    return <UsingTheSitePage />;
}
