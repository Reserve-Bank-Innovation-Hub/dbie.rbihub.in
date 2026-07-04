// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import HowToScrapePage from "./page.client";

export const metadata: Metadata = {
    title       : "How to scrape | Docs — Database on Indian Economy",
    description : "Running the DBIE scraper, and how the data pipeline works — processors turn scraped files into page JSON, and oracles verify every output before deploy",
    keywords    : [
        "scraper",
        "Playwright",
        "SDMX",
        "data pipeline",
        "processors",
        "oracles",
        "DBIE",
    ],
    openGraph   : {
        title       : "How to scrape | Docs — Database on Indian Economy",
        description : "Running the DBIE scraper, and how processors and oracles keep the data honest",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "How to scrape | Docs — Database on Indian Economy",
        description : "Running the DBIE scraper, and how processors and oracles keep the data honest",
    },
};

export default function Page() {
    return <HowToScrapePage />;
}
