// REACT CORE ==========================================================================================================
import React, { ReactNode } from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import { AuthLayoutClient } from "./layout.client";

export const metadata : Metadata = {
    title       : `Dashboard — DBIE v2`,
    description :
        "Access your DBIE v2 dashboard to manage and test Digital Public Infrastructure solutions.",
    openGraph   : {
        title       : `Dashboard — DBIE v2`,
        description :
            "Access your DBIE v2 dashboard to manage and test Digital Public Infrastructure solutions.",
        url         : "https://pratirupa.rbih.in/dashboard",
        siteName    : "DBIE v2",
        locale      : "en_IN",
        type        : "website",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : `Dashboard — DBIE v2`,
        description :
            "Access your DBIE v2 dashboard to manage and test Digital Public Infrastructure solutions.",
    },
};

export default function AuthLayout({children} : { children : ReactNode }) {
    return (
        <AuthLayoutClient>{children}</AuthLayoutClient>
    );
}