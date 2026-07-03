"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { HandbookSidebar } from "@components/PageSidebars/HandbookSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            <HandbookSidebar />

            <Main>
                {children}
            </Main>
        </Article>
    );
}
