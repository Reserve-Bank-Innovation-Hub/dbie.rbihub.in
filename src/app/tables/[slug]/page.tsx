// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// OTHER ===============================================================================================================
import SdmxSeriesPageClient from "./page.client";

// All SDMX slugs are generated from the catalogue at build time — no fallback.
export const dynamicParams = false;

// =====================================================================================================================
// Catalogue types
// =====================================================================================================================
interface CatalogueEntry {
    id        : string;
    source    : "sdmx" | "rbib";
    path      : string;
    label     : string;
    sector    : string;
    subSector : string;
    frequency : string;
}

function readCatalogue() : CatalogueEntry[] {
    const cataloguePath = path.join(process.cwd(), "data", "catalogue.json");
    const catalogue     = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
    return catalogue.entries as CatalogueEntry[];
}

function findEntry(slug : string) : CatalogueEntry | undefined {
    return readCatalogue().find(
        e => e.source === "sdmx" && path.basename(e.path, ".csv") === slug,
    );
}

// =====================================================================================================================
// generateStaticParams
// =====================================================================================================================
export function generateStaticParams() : { slug : string }[] {
    return readCatalogue()
        .filter(e => e.source === "sdmx")
        .map(e => ({ slug : path.basename(e.path, ".csv") }));
}

// =====================================================================================================================
// Metadata — read from catalogue (no payload load)
// =====================================================================================================================
export async function generateMetadata(
    { params } : { params : Promise<{ slug : string }> },
) : Promise<Metadata> {
    const { slug }  = await params;
    const entry     = findEntry(slug);
    const label     = entry?.label     ?? slug;
    const sector    = entry?.sector    ?? "";
    const subSector = entry?.subSector ?? "";
    const frequency = entry?.frequency ?? "";

    const title = `${label} — Database on Indian Economy`;
    const desc  = `${sector} · ${subSector} · ${frequency} — ${label}. Source: Reserve Bank of India (DBIE).`;

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
// Page — pass only catalogue fields; payload is fetched client-side
// =====================================================================================================================
export default async function Page(
    { params } : { params : Promise<{ slug : string }> },
) {
    const { slug }  = await params;
    const entry     = findEntry(slug);

    return (
        <SdmxSeriesPageClient
            slug       = {slug}
            label      = {entry?.label     ?? slug}
            sector     = {entry?.sector    ?? ""}
            subSector  = {entry?.subSector ?? ""}
            frequency  = {entry?.frequency ?? ""}
        />
    );
}
