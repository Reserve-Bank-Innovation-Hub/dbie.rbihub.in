// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { BeyondUpiPage } from "./page.client";

export const metadata : Metadata = {
    title       : "Beyond UPI: everything else India pays with | Stories — Database on Indian Economy",
    description : "In 2025-26 an RTGS payment averaged ₹65.0 lakh, a cheque ₹1.28 lakh and a UPI payment ₹1,301; RTGS carried 68.4% of all payment value in 0.12% of payments. Built from the data published on the Reserve Bank’s DBIE.",
};

export default function Page() {
    return <BeyondUpiPage />;
}
