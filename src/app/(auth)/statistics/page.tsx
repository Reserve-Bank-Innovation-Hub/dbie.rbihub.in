// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import StatisticsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Statistics — Database on Indian Economy",
    description : "Comprehensive time-series data organised by subject areas",
    keywords    : [ "statistics", "time-series data", "economic data", "India statistics", "RBI data", "subject areas" ],
    openGraph   : {
        title       : "Statistics — Database on Indian Economy",
        description : "Comprehensive time-series data organised by subject areas",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Statistics — Database on Indian Economy",
        description : "Comprehensive time-series data organised by subject areas",
    },
};

export default function Page() {
    return <StatisticsPage />;
}
