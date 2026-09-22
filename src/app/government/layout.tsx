"use client";

// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";
import { Building2 } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { ThemeSidebar } from "@components/PageSidebars/ThemeSidebar";

// OTHER ===============================================================================================================
import curatedPages from "../tables/curated-pages.json";

// The sidebar lists the theme's own tables, which it reads from the data API's catalogue, so it is a client
// component; it also reads ?table= to mark the table on show, which needs a Suspense boundary on a static route.
export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <Suspense>
                <ThemeSidebar
                    id="government-sidebar"
                    headerIcon={<Building2 />}
                    headerLabel="Government"
                    path="/government"
                    curated={curatedPages}
                />
            </Suspense>

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
