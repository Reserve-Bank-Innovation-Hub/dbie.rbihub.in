// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// LIB =================================================================================================================
import { getSdmxSeries } from "@/lib/api/tables/sdmx-series";

// OTHER ===============================================================================================================
import SdmxSeriesPageClient from "./page.client";

// All SDMX slugs are generated from the catalogue at build time — no fallback.
export const dynamicParams = false;

// =====================================================================================================================
// generateStaticParams
// Read the committed catalogue, filter source === "sdmx", derive slug from path basename.
// =====================================================================================================================
interface CatalogueEntry {
    id     : string;
    source : "sdmx" | "rbib";
    path   : string;
}

export function generateStaticParams() : { slug : string }[] {
    const cataloguePath = path.join(process.cwd(), "data", "catalogue.json");
    const catalogue     = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));

    return (catalogue.entries as CatalogueEntry[])
        .filter(e => e.source === "sdmx")
        .map(e => ({
            slug : path.basename(e.path, ".csv"),
        }));
}

// =====================================================================================================================
// Metadata — dynamic per-series title and description
// =====================================================================================================================
export async function generateMetadata(
    { params } : { params : Promise<{ slug : string }> },
) : Promise<Metadata> {
    const { slug }  = await params;
    const payload   = getSdmxSeries(slug);
    const title     = `${payload.label} — Database on Indian Economy`;
    const desc      = `${payload.sector} · ${payload.subSector} · ${payload.frequency} — ${payload.label}. Source: Reserve Bank of India (DBIE).`;

    return {
        title,
        description : desc,
        openGraph   : {
            title,
            description : desc,
            type        : "website",
            siteName    : "Database on Indian Economy",
        },
        twitter     : {
            card        : "summary_large_image",
            title,
            description : desc,
        },
    };
}

// =====================================================================================================================
// Page
// =====================================================================================================================
export default async function Page(
    { params } : { params : Promise<{ slug : string }> },
) {
    const { slug } = await params;
    const payload  = getSdmxSeries(slug);

    return <SdmxSeriesPageClient payload={payload} />;
}
