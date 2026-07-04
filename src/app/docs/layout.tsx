"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { DocsSidebar } from "@components/PageSidebars/DocsSidebar";

// STYLES ==============================================================================================================
import "./docs.css";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <DocsSidebar />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
