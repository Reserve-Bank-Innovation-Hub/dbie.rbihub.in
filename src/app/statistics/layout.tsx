// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";
import { ChartColumn, Layers } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { MenuSidebar } from "@components/PageSidebars/MenuSidebar";

// LIB =================================================================================================================
import { statisticsMenu } from "@/lib/dbie-menu";

// The sidebar's sectors come from DBIE's Statistics menu at build time (src/lib/dbie-menu.ts), so the layout is a
// server component; the sidebar is a client component, for its active link.
export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    const { sectors } = statisticsMenu();

    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <MenuSidebar
                id="statistics-sidebar"
                headerIcon={<ChartColumn />}
                headerLabel="Statistics"
                groupTitle="Sectors"
                itemIcon={<Layers />}
                base="/statistics"
                items={sectors}
            />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
