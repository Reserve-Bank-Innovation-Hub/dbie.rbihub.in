// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }    from "@components/Loading/Loading";
import { SectorPage } from "@components/SectorPage/SectorPage";

// LIB =================================================================================================================
import { menuOrder } from "@/lib/dbie-menu";

// OTHER ===============================================================================================================
import curatedPages from "../tables/curated-pages.json";

export const metadata : Metadata = {
    title       : "Payments — Database on Indian Economy",
    description : "Payment and settlement system statistics — volumes and values across RTGS, UPI, cards and more.",
    openGraph   : {
        title       : "Payments — Database on Indian Economy",
        description : "Payment and settlement system statistics — volumes and values across RTGS, UPI, cards and more.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

// The theme is the set of DBIE tables the site's curated pages under /payments/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/payments";
const SUBTITLE = "Payment and settlement system statistics.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="payments" />}>
            <SectorPage
                id="payments-page"
                path={PATH}
                label="Payments"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
