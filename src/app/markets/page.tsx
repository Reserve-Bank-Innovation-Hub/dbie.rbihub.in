// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import MarketsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Markets — Database on Indian Economy",
    description : "Money, government securities, equity, corporate debt and forex markets",
    keywords    : [ "financial markets", "money market", "G-Sec", "equity", "forex", "India" ],
    openGraph   : {
        title       : "Markets — Database on Indian Economy",
        description : "Money, government securities, equity, corporate debt and forex markets",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Markets — Database on Indian Economy",
        description : "Money, government securities, equity, corporate debt and forex markets",
    },
};

export default function Page() {
    return <MarketsPage />;
}
