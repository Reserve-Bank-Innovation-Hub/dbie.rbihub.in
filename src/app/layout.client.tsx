"use client";

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

// UI ==================================================================================================================
import { Main, ThemeProvider } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { Analytics } from "@components/Analytics/Analytics";
import { PrimaryNav } from "@components/PrimaryNav/PrimaryNav";

// STYLES ==============================================================================================================
import "@styles/globals.css";

export const RootLayoutClient = ({children} : { children : ReactNode }) => {
    const listOfThemes = [ "theme-light", "theme-dark" ];

    return (
        <html lang="en">
        <body>
        <ThemeProvider
            themeList={listOfThemes}
            currentTheme="theme-light"
            storageKey="dbie-theme"
        >
            <PrimaryNav />

            <Main id="component-main">{children}</Main>

            <Analytics />
        </ThemeProvider>
        </body>
        </html>
    );
};
