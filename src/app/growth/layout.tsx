"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { GrowthSidebar } from "@components/PageSidebars/GrowthSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <GrowthSidebar />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
