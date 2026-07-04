// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TheLightsCameOnPage } from "./page.client";

export const metadata : Metadata = {
    title       : "The lights came on | Stories — Database on Indian Economy",
    description : "India's bank credit, 2015 vs now — how the system went from lending to a few companies to seeing crores of households, told dot by dot from RBI's BSR Table 3.2.",
};

export default function Page() {
    return <TheLightsCameOnPage />;
}
