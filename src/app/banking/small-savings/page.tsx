// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getSmallSavings } from "@/lib/api/tables/small-savings";

// OTHER ===============================================================================================================
import SmallSavingsPage from "./page.client";

export const metadata : Metadata = {
    title       : "Small savings | Banking — Database on Indian Economy",
    description : "Monthly and annual receipts and outstanding balances across small savings schemes in India — post office deposits, saving certificates, and public provident fund. Source: RBI Bulletin Table 46.",
    keywords    : [
        "small savings",
        "post office savings",
        "public provident fund",
        "PPF",
        "national savings certificate",
        "NSC",
        "Kisan Vikas Patra",
        "Sukanya Samriddhi",
        "senior citizen scheme",
        "RBI",
        "India",
        "banking",
    ],
    openGraph   : {
        title       : "Small savings | Banking — Database on Indian Economy",
        description : "Monthly and annual receipts and outstanding balances across small savings schemes in India.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card        : "summary_large_image",
        title       : "Small savings | Banking — Database on Indian Economy",
        description : "Monthly and annual receipts and outstanding balances across small savings schemes in India.",
    },
};

export default function Page() {
    const data = getSmallSavings();

    return <SmallSavingsPage data={data} />;
}
