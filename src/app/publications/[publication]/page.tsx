// REACT CORE ==========================================================================================================
import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// LOCAL COMPONENTS ====================================================================================================
import { Loading }    from "@components/Loading/Loading";
import { SectorPage } from "@components/SectorPage/SectorPage";

// LIB =================================================================================================================
import { findPublication, publicationsMenu } from "@/lib/dbie-menu";
import { sentenceCase } from "@/lib/tables/titles";

// OTHER ===============================================================================================================
import curatedPages from "../../tables/curated-pages.json";

// One route per publication DBIE gives tables, from its menu at build time; nothing else resolves.
export const dynamicParams = false;

export function generateStaticParams() : { publication : string }[] {
    return publicationsMenu().publications.map(p => ({ publication : p.slug }));
}

type Params = { params : Promise<{ publication : string }> };

export async function generateMetadata({ params } : Params) : Promise<Metadata> {
    const { publication } = await params;
    const found = findPublication(publication);
    if (!found) return {};

    const name        = sentenceCase(found.label);
    const title       = `${name} | Publications — Database on Indian Economy`;
    const description = `${name}: its tables, section by section, as DBIE files them.`;

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
    const { publication } = await params;
    const found = findPublication(publication);
    if (!found) notFound();

    // The client reads ?table= to open a table in place, and useSearchParams needs a Suspense boundary on a
    // statically generated route.
    return (
        <Suspense fallback={<Loading name={sentenceCase(found.label)} />}>
            <SectorPage
                id="publication-page"
                path={`/publications/${found.slug}`}
                label={found.label}
                menuKey="publication"
                slug={found.slug}
                noun="publication"
                curated={curatedPages}
            />
        </Suspense>
    );
}
