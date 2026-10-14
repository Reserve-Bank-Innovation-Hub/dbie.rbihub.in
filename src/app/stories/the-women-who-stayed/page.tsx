// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TheWomenWhoStayedPage } from "./page.client";

export const metadata : Metadata = {
    title       : "The women who stayed | Stories — Database on Indian Economy",
    description : "Since 2000-01, more and more rural men in India have moved from farming into construction, factories and shops, while most rural women who work are still in farming. A data story from the Reserve Bank’s Database on Indian Economy.",
};

export default function Page() {
    return <TheWomenWhoStayedPage />;
}
