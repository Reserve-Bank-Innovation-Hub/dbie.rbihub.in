"use client";

// REACT CORE ==========================================================================================================
import { ReactNode } from "react";

// UI ==================================================================================================================
import { Div, Main, ThemeProvider } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { Analytics } from "@components/Analytics/Analytics";
import { PrimaryNav } from "@components/PrimaryNav/PrimaryNav";

// STYLES ==============================================================================================================
import "@styles/globals.css";

export const RootLayoutClient = ({children} : { children : ReactNode }) => {
    const listOfThemes = [ "theme-light", "theme-dark" ];

    return (
        <html lang="en" suppressHydrationWarning>
        <body>
        <ThemeProvider
            themeList={listOfThemes}
            currentTheme="theme-light"
            storageKey="dbie-theme"
        >
            {/* The frame: the primary nav's column, then the page. A page that renders more than one root element
                still lands in one grid cell, since the Main is that cell. */}
            <Div id="dbie-layout">
                <PrimaryNav />

                <Main id="dbie-content">{children}</Main>
            </Div>

            <Analytics />
        </ThemeProvider>
        </body>
        </html>
    );
};
