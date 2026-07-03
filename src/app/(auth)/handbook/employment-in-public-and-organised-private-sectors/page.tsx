// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getEmploymentInPublicAndOrganisedPrivateSectors } from "@/lib/api/tables/employment-in-public-and-organised-private-sectors";

// OTHER ===============================================================================================================
import EmploymentInPublicAndOrganisedPrivateSectorsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Employment in public and organised private sectors | National income — Database on Indian Economy",
    description : "Annual employment figures for the public and organised private sectors in India (in lakhs), from 1970-71 onwards.",
    keywords    : [
        "employment",
        "public sector employment",
        "private sector employment",
        "organised sector",
        "India employment",
        "annual employment",
        "RBI",
        "HSIE",
    ],
    openGraph   : {
        title       : "Employment in public and organised private sectors | National income — Database on Indian Economy",
        description : "Annual employment figures for the public and organised private sectors in India (in lakhs), from 1970-71 onwards.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Employment in public and organised private sectors | National income — Database on Indian Economy",
        description : "Annual employment figures for the public and organised private sectors in India (in lakhs), from 1970-71 onwards.",
    },
};

export default async function Page() {
    const employmentData = await getEmploymentInPublicAndOrganisedPrivateSectors();

    return <EmploymentInPublicAndOrganisedPrivateSectorsPage employmentData={employmentData} />;
}
