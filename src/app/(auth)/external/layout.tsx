"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { ExternalSidebar } from "@components/PageSidebars/ExternalSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            <ExternalSidebar />

            <Main>
                {children}
            </Main>
        </Article>
    );
}
