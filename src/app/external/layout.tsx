"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Main } from "fictoan-react";

export default function ExternalLayout({ children } : { children : React.ReactNode; }) {
    return (
        <Article className="page-with-sidebar">
            {/* PAGE CONTENT ======================================================================================= */}
            <Main>
                {children}
            </Main>
        </Article>
    );
}
