// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getUsdSalePurchase } from "@/lib/api/tables/usd-sale-purchase";

// OTHER ===============================================================================================================
import UsdSalePurchasePage from "./page.client";

export const metadata : Metadata = {
    title       : "USD sale/purchase by RBI | Banking — Database on Indian Economy",
    description : "Monthly RBI foreign exchange intervention data — outright sale/purchase of US dollars, operations in currency forwards, and maturity breakdown of outstanding forward positions. Source: RBI Monthly Bulletin Table 4.",
    keywords    : [
        "RBI",
        "USD",
        "foreign exchange",
        "forex intervention",
        "currency forwards",
        "forward contracts",
        "maturity breakdown",
        "Reserve Bank of India",
        "US dollar",
        "India",
    ],
    openGraph   : {
        title       : "USD sale/purchase by RBI | Banking — Database on Indian Economy",
        description : "Monthly RBI foreign exchange intervention data — outright sale/purchase of US dollars, currency forwards, and maturity breakdown of outstanding forwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "USD sale/purchase by RBI | Banking — Database on Indian Economy",
        description : "Monthly RBI foreign exchange intervention data — outright sale/purchase of US dollars, currency forwards, and maturity breakdown of outstanding forwards.",
    },
};

export default function Page() {
    const data = getUsdSalePurchase();

    return <UsdSalePurchasePage data={data} />;
}
