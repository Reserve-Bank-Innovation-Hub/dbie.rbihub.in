// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getCommercialBankSurvey } from "@/lib/api/tables/commercial-bank-survey";

// OTHER ===============================================================================================================
import CommercialBankSurveyPage from "./page.client";

export const metadata : Metadata = {
    title       : "Commercial bank survey | Banking — Database on Indian Economy",
    description : "Fortnightly commercial bank survey data covering aggregate deposits, domestic credit, foreign-currency assets, bank reserves and capital, from 1999 onwards.",
    keywords    : [
        "commercial bank survey",
        "aggregate deposits",
        "domestic credit",
        "bank reserves",
        "money and banking",
        "fortnightly",
        "RBI",
    ],
    openGraph   : {
        title       : "Commercial bank survey | Banking — Database on Indian Economy",
        description : "Fortnightly commercial bank survey data covering aggregate deposits, domestic credit, foreign-currency assets, bank reserves and capital, from 1999 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Commercial bank survey | Banking — Database on Indian Economy",
        description : "Fortnightly commercial bank survey data covering aggregate deposits, domestic credit, foreign-currency assets, bank reserves and capital, from 1999 onwards.",
    },
};

export default async function Page() {
    const surveyData = await getCommercialBankSurvey();

    return <CommercialBankSurveyPage surveyData={surveyData} />;
}
