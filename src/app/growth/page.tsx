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
    title       : "Growth — Database on Indian Economy",
    description : "Growth statistics for India — industrial production and output indicators.",
    openGraph   : {
        title       : "Growth — Database on Indian Economy",
        description : "Growth statistics for India — industrial production and output indicators.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

// The theme is the set of DBIE tables the site's curated pages under /growth/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/growth";
const SUBTITLE = "Output and production indicators.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="growth" />}>
            <SectorPage
                id="growth-page"
                path={PATH}
                label="Growth"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
