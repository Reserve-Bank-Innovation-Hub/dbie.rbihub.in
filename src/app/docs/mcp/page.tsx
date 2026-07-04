// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import McpDocsPage from "./page.client";

export const metadata: Metadata = {
    title       : "AI access via MCP | Docs — Database on Indian Economy",
    description : "Connect Claude or any MCP client to this site's data — search, browse and fetch all 335 RBI economic data tables and series from an AI assistant",
    keywords    : [
        "MCP",
        "model context protocol",
        "AI",
        "Claude",
        "API",
        "DBIE",
        "RBI data",
    ],
    openGraph   : {
        title       : "AI access via MCP | Docs — Database on Indian Economy",
        description : "Connect Claude or any MCP client to this site's data",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "AI access via MCP | Docs — Database on Indian Economy",
        description : "Connect Claude or any MCP client to this site's data",
    },
};

export default function Page() {
    return <McpDocsPage />;
}
