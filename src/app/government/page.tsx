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
    title       : "Government — Database on Indian Economy",
    description : "Government finance statistics — union government accounts, treasury bill ownership and auction results.",
    openGraph   : {
        title       : "Government — Database on Indian Economy",
        description : "Government finance statistics — union government accounts, treasury bill ownership and auction results.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

// The theme is the set of DBIE tables the site's curated pages under /government/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/government";
const SUBTITLE = "Union government accounts and treasury bill statistics.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="government" />}>
            <SectorPage
                id="government-page"
                path={PATH}
                label="Government"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
