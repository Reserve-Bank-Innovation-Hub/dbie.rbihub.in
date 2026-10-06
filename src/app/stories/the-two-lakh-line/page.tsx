// REACT CORE ==========================================================================================================
import type { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { TheTwoLakhLinePage } from "./page.client";

export const metadata : Metadata = {
    title       : "The ₹2 lakh line | Stories — Database on Indian Economy",
    description : "Nearly two in every three bank loans in India have a limit of ₹2 lakh or less. They hold ₹6 of every ₹100 banks have lent, carry the highest interest rates in the banks’ books, and there are about 4 crore fewer of them at banks than at the end of 2024. A data story from the Reserve Bank’s own figures.",
};

export default function Page() {
    return <TheTwoLakhLinePage />;
}
