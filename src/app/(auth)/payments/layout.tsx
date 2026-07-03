"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PaymentsSidebar } from "@components/PageSidebars/PaymentsSidebar";

export default function PageWithSidebarLayout({children} : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* SIDEBAR //////////////////////////////////////////////////////////////////////////////////////////// */}
            <PaymentsSidebar />

            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
