// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// OTHER ===============================================================================================================
import HandbookPage from "./page.client";

export const metadata : Metadata = {
    title       : "Handbook of statistics — Database on Indian Economy",
    description : "Annual series from the RBI's Handbook of Statistics on Indian Economy — output, prices, national income, saving and employment.",
};

export default function Page() {
    return <HandbookPage />;
}
