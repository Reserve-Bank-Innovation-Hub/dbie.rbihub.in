// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import PublicationsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Publications — Database on Indian Economy",
    description : "RBI's regular reports and statistical releases and various sector-specific reports with context and commentary.",
    keywords    : [ "publications", "RBI reports", "statistical releases", "sector reports", "economic reports", "India economy", "RBI" ],
    openGraph   : {
        title       : "Publications — Database on Indian Economy",
        description : "RBI's regular reports and statistical releases and various sector-specific reports with context and commentary.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Publications — Database on Indian Economy",
        description : "RBI's regular reports and statistical releases and various sector-specific reports with context and commentary.",
    },
};

export default function Page() {
    return <PublicationsPage />;
}
