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
    title       : "External — Database on Indian Economy",
    description : "Trade, reserves, investment flows and the balance of payments.",
};

// The theme is the set of DBIE tables the site's curated pages under /external/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/external";
const SUBTITLE = "Trade, reserves, investment flows and the balance of payments.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="external" />}>
            <SectorPage
                id="external-page"
                path={PATH}
                label="External"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
