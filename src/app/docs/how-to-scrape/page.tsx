// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import HowToScrapePage from "./page.client";

export const metadata: Metadata = {
    title       : "How to scrape | Docs — Database on Indian Economy",
    description : "Running the DBIE scrapers over plain HTTP, loading Postgres as the system of record, publishing a verified data release, and reading the database through the data API",
    keywords    : [
        "scraper",
        "SDMX",
        "BusinessObjects",
        "Postgres",
        "data API",
        "data pipeline",
        "processors",
        "oracles",
        "DBIE",
    ],
    openGraph   : {
        title       : "How to scrape | Docs — Database on Indian Economy",
        description : "Running the DBIE scrapers, loading the database, publishing a data release, and the data API",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "How to scrape | Docs — Database on Indian Economy",
        description : "Running the DBIE scrapers, loading the database, publishing a data release, and the data API",
    },
};

export default function Page() {
    return <HowToScrapePage />;
}
