// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import IndicatorsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Indicators — Database on Indian Economy",
    description : "Key economic parameters like GDP, inflation, and financial market trends.",
    keywords    : [
        "indicators", "GDP", "inflation", "financial markets", "economic parameters", "India economy", "RBI"
    ],
    openGraph   : {
        title       : "Indicators — Database on Indian Economy",
        description : "Key economic parameters like GDP, inflation, and financial market trends.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Indicators — Database on Indian Economy",
        description : "Key economic parameters like GDP, inflation, and financial market trends.",
    },
};

export default function Page() {
    return <IndicatorsPage />;
}
