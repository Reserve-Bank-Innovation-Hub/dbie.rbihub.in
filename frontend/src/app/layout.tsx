// REACT CORE ==========================================================================================================
import React, { ReactNode } from "react";
import type { Metadata } from "next";

// OTHER ===============================================================================================================
import { RootLayoutClient } from "./layout.client";

export const metadata : Metadata = {
    title       : "DBIE — Database of the Indian Economy",
    description :
        "Comprehensive economic data and indicators from the Reserve Bank of India. Access exchange rates, interest rates, inflation data, and more.",
    keywords    : [
        "RBI", "Reserve Bank of India", "Indian economy", "economic data",
        "exchange rates", "inflation", "GDP", "statistics", "financial indicators"
    ],
    openGraph   : {
        title       : "DBIE — Database of the Indian Economy",
        description :
            "Comprehensive economic data and indicators from the Reserve Bank of India.",
        siteName    : "Database of the Indian Economy",
        locale      : "en_IN",
        type        : "website",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "DBIE — Database of the Indian Economy",
        description :
            "Comprehensive economic data and indicators from the Reserve Bank of India.",
    },
    icons       : {
        shortcut : "/favicon.ico",
        icon     : [
            {
                url   : "/favicon.ico",
                sizes : "any",
                type  : "image/x-icon",
            },
        ],
    },
};

export default function RootLayout({children} : { children : ReactNode }) {
    return <RootLayoutClient>{children}</RootLayoutClient>;
}
