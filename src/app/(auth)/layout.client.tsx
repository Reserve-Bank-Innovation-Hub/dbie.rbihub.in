"use client";

// REACT CORE ==========================================================================================================
import React, { ReactNode } from "react";

// UI ==================================================================================================================
import { Main } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PrimaryNav } from "@components/PrimaryNav/PrimaryNav";

export const AuthLayoutClient = ({children} : { children : ReactNode }) => {
    return (
        <>
            {/* <SiteHeader /> */}

            <PrimaryNav />

            <Main id="component-main">{children}</Main>
        </>
    );
};
