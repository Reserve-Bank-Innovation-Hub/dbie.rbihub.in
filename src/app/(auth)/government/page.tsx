// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import GovernmentPage from "./page.client";

export const metadata : Metadata = {
    title       : "Government — Database on Indian Economy",
    description : "Government finance statistics — union government accounts, treasury bill ownership and auction results.",
    openGraph   : {
        title       : "Government — Database on Indian Economy",
        description : "Government finance statistics — union government accounts, treasury bill ownership and auction results.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

export default function Page() {
    return <GovernmentPage />;
}
