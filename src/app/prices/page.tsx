// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import PricesPage from "./page.client";

export const metadata : Metadata = {
    title       : "Prices — Database on Indian Economy",
    description : "Price statistics for India — consumer and wholesale price indices, and gold and silver prices.",
    openGraph   : {
        title       : "Prices — Database on Indian Economy",
        description : "Price statistics for India — consumer and wholesale price indices, and gold and silver prices.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

export default function Page() {
    return <PricesPage />;
}
