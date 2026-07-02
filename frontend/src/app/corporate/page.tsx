// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import CorporatePage from "./page.client";

export const metadata : Metadata = {
    title       : "Corporate — Database on Indian Economy",
    description : "Company finances, balance sheets, profitability and corporate sector performance",
    keywords    : [ "corporate sector", "company finances", "balance sheet", "profitability", "FDI", "India" ],
    openGraph   : {
        title       : "Corporate — Database on Indian Economy",
        description : "Company finances, balance sheets, profitability and corporate sector performance",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Corporate — Database on Indian Economy",
        description : "Company finances, balance sheets, profitability and corporate sector performance",
    },
};

export default function Page() {
    return <CorporatePage />;
}
