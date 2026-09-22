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
    title       : "Prices — Database on Indian Economy",
    description : "Price statistics for India — consumer and wholesale price indices, and gold and silver prices.",
    openGraph   : {
        title       : "Prices — Database on Indian Economy",
        description : "Price statistics for India — consumer and wholesale price indices, and gold and silver prices.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

// The theme is the set of DBIE tables the site's curated pages under /prices/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/prices";
const SUBTITLE = "Price statistics — consumer and wholesale indices, and bullion prices.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="prices" />}>
            <SectorPage
                id="prices-page"
                path={PATH}
                label="Prices"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
