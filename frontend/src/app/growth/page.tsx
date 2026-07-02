// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import GrowthPage from "./page.client";

export const metadata : Metadata = {
    title       : "Growth — Database on Indian Economy",
    description : "GDP, industrial production and real-sector growth indicators",
    keywords    : [ "growth", "GDP", "IIP", "industrial production", "real sector", "India" ],
    openGraph   : {
        title       : "Growth — Database on Indian Economy",
        description : "GDP, industrial production and real-sector growth indicators",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Growth — Database on Indian Economy",
        description : "GDP, industrial production and real-sector growth indicators",
    },
};

export default function Page() {
    return <GrowthPage />;
}
