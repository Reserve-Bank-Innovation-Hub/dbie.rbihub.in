"use client";

// REACT CORE ==========================================================================================================
import { ReactNode, useState } from "react";

// UI ==================================================================================================================
import { ThemeProvider } from "fictoan-react";

// STYLES ==============================================================================================================
import "@styles/globals.css";

function RootLayoutContent({children} : { children : ReactNode }) {
    return children;
}

export const RootLayoutClient = ({children} : { children : ReactNode }) => {
    const listOfThemes = [ "theme-light", "theme-dark" ];

    return (
        <html lang="en">
        <body>
        <ThemeProvider
            themeList={listOfThemes}
            currentTheme="theme-light"
        >
            <RootLayoutContent>{children}</RootLayoutContent>
        </ThemeProvider>
        </body>
        </html>
    );
};
