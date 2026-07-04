"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { IndicatorsSidebar } from "@components/PageSidebars/IndicatorsSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <IndicatorsSidebar />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
