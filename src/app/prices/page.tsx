// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import PricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Prices — Database on Indian Economy",
    description : "Consumer and wholesale price indices, inflation and commodity prices",
    keywords    : [ "prices", "CPI", "WPI", "inflation", "commodity prices", "India" ],
    openGraph   : {
        title       : "Prices — Database on Indian Economy",
        description : "Consumer and wholesale price indices, inflation and commodity prices",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Prices — Database on Indian Economy",
        description : "Consumer and wholesale price indices, inflation and commodity prices",
    },
};

export default function Page() {
    return <PricesPage />;
}
