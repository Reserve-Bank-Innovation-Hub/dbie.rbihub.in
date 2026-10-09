// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { RupeeAndWorldPage } from "./page.client";

export const metadata : Metadata = {
    title       : "How do you measure a rupee? | Stories — Database on Indian Economy",
    description : "A dollar costs more than twice as many rupees as in 2004, yet Indian goods cost buyers abroad about what they did then. Three ways to measure the rupee, and the question each one answers.",
};

export default function Page() {
    return <RupeeAndWorldPage />;
}
