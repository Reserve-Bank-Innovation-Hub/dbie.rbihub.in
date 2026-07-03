// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getRbiSurvey } from "@/lib/api/tables/rbi-survey";

// OTHER ===============================================================================================================
import RbiSurveyPage from "./page.client";

export const metadata : Metadata = {
    title       : "Reserve Bank of India survey | Banking — Database on Indian Economy",
    description : "Fortnightly RBI balance-sheet survey covering reserve money and its components — currency in circulation, bankers' deposits, RBI domestic credit, government securities, foreign assets and capital account. Source: RBI Bulletin Table 10.",
    keywords    : [
        "Reserve Bank of India survey",
        "reserve money",
        "currency in circulation",
        "bankers deposits",
        "RBI credit",
        "government securities",
        "foreign assets",
        "RBI Bulletin",
        "India",
    ],
    openGraph   : {
        title       : "Reserve Bank of India survey | Banking — Database on Indian Economy",
        description : "Fortnightly reserve money and RBI balance-sheet components — currency, deposits, domestic credit, government securities and foreign assets.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Reserve Bank of India survey | Banking — Database on Indian Economy",
        description : "Fortnightly reserve money and RBI balance-sheet components — currency, deposits, domestic credit, government securities and foreign assets.",
    },
};

export default async function Page() {
    const data = await getRbiSurvey();
    return <RbiSurveyPage data={data} />;
}
