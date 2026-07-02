// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import GovernmentPage from "./page.client";

export const metadata : Metadata = {
    title       : "Government — Database on Indian Economy",
    description : "Central and state government finances, receipts, expenditure and deficits",
    keywords    : [ "government finance", "central government", "state finances", "fiscal", "deficit", "India" ],
    openGraph   : {
        title       : "Government — Database on Indian Economy",
        description : "Central and state government finances, receipts, expenditure and deficits",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Government — Database on Indian Economy",
        description : "Central and state government finances, receipts, expenditure and deficits",
    },
};

export default function Page() {
    return <GovernmentPage />;
}
