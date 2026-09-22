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
    title       : "Markets — Database on Indian Economy",
    description : "Financial market statistics — money market rates, certificates of deposit, commercial paper, turnover and capital issues.",
    openGraph   : {
        title       : "Markets — Database on Indian Economy",
        description : "Financial market statistics — money market rates, certificates of deposit, commercial paper, turnover and capital issues.",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
};

// The theme is the set of DBIE tables the site's curated pages under /markets/ cover (src/app/tables/curated-pages.json);
// the page lays them out under DBIE's own sections and opens any of them in place at ?table=<schema>.<table>.
const PATH     = "/markets";
const SUBTITLE = "Money market, debt instruments, turnover and primary market activity.";

export default function Page() {
    return (
        <Suspense fallback={<Loading name="markets" />}>
            <SectorPage
                id="markets-page"
                path={PATH}
                label="Markets"
                theme
                subtitle={SUBTITLE}
                noun="theme"
                curated={curatedPages}
                order={menuOrder()}
            />
        </Suspense>
    );
}
