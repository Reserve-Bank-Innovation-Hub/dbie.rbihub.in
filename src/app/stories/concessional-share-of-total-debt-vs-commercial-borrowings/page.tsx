// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { ConcessionalVsCommercialPage } from "./page.client";

export const metadata : Metadata = {
    title       : "From aid recipient to market borrower | Stories — Database on Indian Economy",
    description : "How India's external debt shifted from concessional, aid-style money to market-rate commercial borrowing.",
};

export default function Page() {
    return <ConcessionalVsCommercialPage />;
}
