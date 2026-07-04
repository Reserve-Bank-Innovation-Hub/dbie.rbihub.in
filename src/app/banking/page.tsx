// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import SectionPage from "./page.client";

export const metadata : Metadata = {
    title       : "Banking — Database on Indian Economy",
    description : "Monetary aggregates, surveys and bank credit.",
};

export default function Page() {
    return <SectionPage />;
}
