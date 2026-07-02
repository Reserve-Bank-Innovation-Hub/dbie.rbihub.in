// REACT CORE ==========================================================================================================
import { Metadata } from "next";

// LIB =================================================================================================================
import { getExternalDebt } from "@/lib/api/publications";

// OTHER ===============================================================================================================
import ExternalDebtPage from "./page.client";

export const metadata: Metadata = {
    title       : "India’s External Debt",
    description : "India’s External Debt data in Rupees (end-March)",
};

export default async function Page() {
    const data = await getExternalDebt();
    return <ExternalDebtPage data={data} />;
}
