// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import UnitLevelDataPage from "./page.client";

export const metadata : Metadata = {
    title       : "Unit Level Data — Database on Indian Economy",
    description : "Granular, disaggregated datasets from surveys and micro-level data for detailed analysis.",
    keywords    : [ "unit level data", "micro data", "granular data", "surveys", "disaggregated data", "India data", "RBI" ],
    openGraph   : {
        title       : "Unit Level Data — Database on Indian Economy",
        description : "Granular, disaggregated datasets from surveys and micro-level data for detailed analysis.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Unit Level Data — Database on Indian Economy",
        description : "Granular, disaggregated datasets from surveys and micro-level data for detailed analysis.",
    },
};

export default function Page() {
    return <UnitLevelDataPage />;
}
