// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";
import { BookOpen, Newspaper } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { MenuSidebar } from "@components/PageSidebars/MenuSidebar";

// LIB =================================================================================================================
import { publicationsMenu } from "@/lib/dbie-menu";

// The sidebar's publications come from DBIE's menu at build time (src/lib/dbie-menu.ts), so the layout is a server
// component; the sidebar is a client component, for its active link.
export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    const { category, publications } = publicationsMenu();

    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <MenuSidebar
                id="publications-sidebar"
                headerIcon={<Newspaper />}
                headerLabel="Publications"
                groupTitle={category}
                itemIcon={<BookOpen />}
                base="/publications"
                items={publications}
            />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
