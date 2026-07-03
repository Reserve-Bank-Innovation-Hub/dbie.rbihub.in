// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getImplementationOfCentralSectorProjects } from "@/lib/api/tables/implementation-of-central-sector-projects-status-end-march";

// OTHER ===============================================================================================================
import ImplementationOfCentralSectorProjectsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Implementation of central sector projects — status (end-March) | Handbook — Database on Indian Economy",
    description : "Status of implementation of central sector projects (ahead, on schedule, delayed, without date of completion) across 17 sectors, end-March.",
    keywords    : [
        "central sector projects",
        "infrastructure projects",
        "project implementation",
        "cost overrun",
        "atomic energy",
        "railways",
        "power",
        "RBI",
        "HSIE",
    ],
    openGraph   : {
        title       : "Implementation of central sector projects — status (end-March) | Handbook — Database on Indian Economy",
        description : "Status of implementation of central sector projects (ahead, on schedule, delayed, without date of completion) across 17 sectors, end-March.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Implementation of central sector projects — status (end-March) | Handbook — Database on Indian Economy",
        description : "Status of implementation of central sector projects (ahead, on schedule, delayed, without date of completion) across 17 sectors, end-March.",
    },
};

export default async function Page() {
    const tableData = await getImplementationOfCentralSectorProjects();
    return <ImplementationOfCentralSectorProjectsPage tableData={tableData} />;
}
