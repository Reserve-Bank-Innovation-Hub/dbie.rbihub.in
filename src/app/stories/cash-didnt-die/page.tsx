// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { CashDidntDiePage } from "./page.client";

export const metadata : Metadata = {
    title       : "Cash didn't die | Stories — Database on Indian Economy",
    description : "UPI payments grew nineteenfold between November 2019 and July 2026, and the cash Indians hold kept growing too.",
};

export default function Page() {
    return <CashDidntDiePage />;
}
