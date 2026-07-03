// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getMonetarySurvey } from "@/lib/api/tables/monetary-survey";

// OTHER ===============================================================================================================
import MonetarySurveyPage from "./page.client";

export const metadata : Metadata = {
    title       : "Monetary survey | Banking — Database on Indian Economy",
    description : "Fortnightly monetary survey data covering money stock aggregates (NM1, NM2, NM3) and their components — currency, deposits, domestic credit and foreign assets. Source: RBI Bulletin Table 8.",
    keywords    : [
        "monetary survey",
        "money stock",
        "NM1",
        "NM2",
        "NM3",
        "currency",
        "deposits",
        "domestic credit",
        "Reserve Bank of India",
        "RBI Bulletin",
        "India",
    ],
    openGraph   : {
        title       : "Monetary survey | Banking — Database on Indian Economy",
        description : "Fortnightly money stock aggregates and components — NM1, NM2, NM3, currency, deposits, domestic credit and foreign assets.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Monetary survey | Banking — Database on Indian Economy",
        description : "Fortnightly money stock aggregates and components — NM1, NM2, NM3, currency, deposits, domestic credit and foreign assets.",
    },
};

export default async function Page() {
    const data = await getMonetarySurvey();
    return <MonetarySurveyPage data={data} />;
}
