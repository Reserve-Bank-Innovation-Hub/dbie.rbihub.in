// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getAnnualSurveyOfIndustriesPrincipalCharacteristics } from "@/lib/api/tables/annual-survey-of-industries-principal-characteristics";

// OTHER ===============================================================================================================
import AnnualSurveyOfIndustriesPrincipalCharacteristicsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Annual survey of industries — principal characteristics | Handbook — Database on Indian Economy",
    description : "Annual Survey of Industries principal characteristics from 1990-91 onwards: factories, employment, capital, output, value added, and gross capital formation.",
    keywords    : [
        "annual survey of industries",
        "ASI",
        "industrial statistics",
        "factories",
        "value added",
        "gross capital formation",
        "employment",
        "MoSPI",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Annual survey of industries — principal characteristics | Handbook — Database on Indian Economy",
        description : "Annual Survey of Industries principal characteristics from 1990-91 onwards: factories, employment, capital, output, value added, and gross capital formation.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Annual survey of industries — principal characteristics | Handbook — Database on Indian Economy",
        description : "Annual Survey of Industries principal characteristics from 1990-91 onwards: factories, employment, capital, output, value added, and gross capital formation.",
    },
};

export default function Page() {
    // Load ASI principal characteristics data (server component — loadData is sync)
    const asiData = getAnnualSurveyOfIndustriesPrincipalCharacteristics();

    return <AnnualSurveyOfIndustriesPrincipalCharacteristicsPage asiData={asiData} />;
}
