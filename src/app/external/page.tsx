// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import SectionPage from "./page.client";

export const metadata : Metadata = {
    title       : "External — Database on Indian Economy",
    description : "Trade, reserves, investment flows and the balance of payments.",
};

export default function Page() {
    return <SectionPage />;
}
