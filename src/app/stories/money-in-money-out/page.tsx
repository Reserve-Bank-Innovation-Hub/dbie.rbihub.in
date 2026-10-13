// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { MoneyPage } from "./page.client";

export const metadata : Metadata = {
    title       : "Money in, money out | Stories — Database on Indian Economy",
    description : "Indians abroad sent home $135.4 billion in 2024-25, and kept $165.7 billion in Indian banks. Indians at home sent $29.6 billion abroad. Built from the data published on the Reserve Bank’s DBIE.",
};

export default function Page() {
    return <MoneyPage />;
}
