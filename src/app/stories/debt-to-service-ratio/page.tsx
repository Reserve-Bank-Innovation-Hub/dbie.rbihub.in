// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { DebtToServiceRatioPage } from "./page.client";

export const metadata : Metadata = {
    title       : "The long walk back from 1991 | Stories — Database on Indian Economy",
    description : "In 1991 India spent a third of her export earnings servicing external debt; today it is near 6% — the timeline of how an acute external crisis was resolved, and how a quieter internal constraint took its place.",
};

export default function Page() {
    return <DebtToServiceRatioPage />;
}
