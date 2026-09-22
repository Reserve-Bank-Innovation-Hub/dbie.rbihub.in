// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }    from "@components/Loading/Loading";
import { SectorPage } from "@components/SectorPage/SectorPage";

// LIB =================================================================================================================
import { findSector, menuOrder, seriesSlugs, statisticsMenu } from "@/lib/dbie-menu";
import { sentenceCase } from "@/lib/tables/titles";

// OTHER ===============================================================================================================
import curatedPages from "../../tables/curated-pages.json";

// One route per sector of DBIE's Statistics menu, from its menu at build time; nothing else resolves.
export const dynamicParams = false;

export function generateStaticParams() : { sector : string }[] {
    return statisticsMenu().sectors.map(s => ({ sector : s.slug }));
}

type Params = { params : Promise<{ sector : string }> };

export async function generateMetadata({ params } : Params) : Promise<Metadata> {
    const { sector } = await params;
    const found = findSector(sector);
    if (!found) return {};

    const name        = sentenceCase(found.label);
    const title       = `${name} | Statistics — Database on Indian Economy`;
    const description = `${name}: its report tables and Data Query datasets, sub-section by sub-section, as DBIE files them.`;

    return {
        title,
        description,
        openGraph : {
            title,
            description,
            type     : "website",
            siteName : "Database on Indian Economy",
        },
        twitter   : {
            card : "summary_large_image",
            title,
            description,
        },
    };
}

export default async function Page({ params } : Params) {
    const { sector } = await params;
    const found = findSector(sector);
    if (!found) notFound();

    // The client reads ?table= to open a table in place, and useSearchParams needs a Suspense boundary on a
    // statically generated route.
    return (
        <Suspense fallback={<Loading name={sentenceCase(found.label)} />}>
            <SectorPage
                id="sector-page"
                path={`/statistics/${found.slug}`}
                label={found.label}
                menuKey="statistics"
                slug={found.slug}
                curated={curatedPages}
                seriesSlugs={seriesSlugs()}
                order={menuOrder()}
            />
        </Suspense>
    );
}
