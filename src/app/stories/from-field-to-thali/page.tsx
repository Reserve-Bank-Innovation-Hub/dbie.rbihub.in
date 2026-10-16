// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { FromFieldToThaliPage } from "./page.client";

export const metadata : Metadata = {
    title       : "From field to thali | Stories — Database on Indian Economy",
    description : "What India grows and where, what the government buys at the minimum support price, and what India sells abroad and buys from abroad. A data story from the Reserve Bank’s Database on Indian Economy.",
};

export default function Page() {
    return <FromFieldToThaliPage />;
}
