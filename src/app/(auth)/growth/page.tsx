// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import GrowthPage from "./page.client";

export const metadata : Metadata = {
    title       : "Growth — Database on Indian Economy",
    description : "Growth statistics for India — industrial production and output indicators.",
    openGraph   : {
        title       : "Growth — Database on Indian Economy",
        description : "Growth statistics for India — industrial production and output indicators.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

export default function Page() {
    return <GrowthPage />;
}
