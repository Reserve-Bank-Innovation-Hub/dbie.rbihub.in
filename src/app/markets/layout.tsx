"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { MarketsSidebar } from "@components/PageSidebars/MarketsSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <MarketsSidebar />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
