// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import StoriesPage from "./page.client";

export const metadata: Metadata = {
    title       : "Stories — Database on Indian Economy",
    description : "Data-led stories from the Database on Indian Economy — interactive narratives built on the same verified datasets as the tables, each ending with the question that matters: so what?",
    keywords    : [
        "data stories",
        "so what",
        "editorial",
        "RBI",
        "Indian economy",
        "scrollytelling",
        "DBIE",
    ],
    openGraph   : {
        title       : "Stories — Database on Indian Economy",
        description : "Data-led stories from the Database on Indian Economy — each one ends with: so what?",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Stories — Database on Indian Economy",
        description : "Data-led stories from the Database on Indian Economy — each one ends with: so what?",
    },
};

export default function Page() {
    return <StoriesPage />;
}
