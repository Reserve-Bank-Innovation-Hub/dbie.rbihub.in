// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import ExternalPage from "./page.client";

export const metadata : Metadata = {
    title       : "External — Database on Indian Economy",
    description : "Balance of payments, foreign trade, forex reserves and external debt",
    keywords    : [ "external sector", "balance of payments", "trade", "forex reserves", "external debt", "India" ],
    openGraph   : {
        title       : "External — Database on Indian Economy",
        description : "Balance of payments, foreign trade, forex reserves and external debt",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "External — Database on Indian Economy",
        description : "Balance of payments, foreign trade, forex reserves and external debt",
    },
};

export default function Page() {
    return <ExternalPage />;
}
