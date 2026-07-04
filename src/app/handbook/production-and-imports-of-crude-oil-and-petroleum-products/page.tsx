// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";

// LIB =================================================================================================================
import { getProductionAndImportsOfCrudeOilAndPetroleumProducts } from "@/lib/api/tables/production-and-imports-of-crude-oil-and-petroleum-products";

// OTHER ===============================================================================================================
import ProductionAndImportsOfCrudeOilPage from "./page.client";

export const metadata : Metadata = {
    title       : "Production and imports of crude oil and petroleum products | Handbook — Database on Indian Economy",
    description : "Annual production and imports of crude oil and petroleum oil lubricant (POL) products in millions metric tonnes (MMT).",
    keywords    : [
        "crude oil production",
        "petroleum products",
        "POL products",
        "crude oil imports",
        "MMT",
        "Ministry of Petroleum",
        "India energy",
        "RBI handbook",
    ],
    openGraph   : {
        title       : "Production and imports of crude oil and petroleum products | Handbook — Database on Indian Economy",
        description : "Annual production and imports of crude oil and petroleum oil lubricant (POL) products in millions metric tonnes (MMT).",
        type        : "website",
        siteName    : "Database on Indian Economy",
    },
    twitter     : {
        card       : "summary_large_image",
        title      : "Production and imports of crude oil and petroleum products | Handbook — Database on Indian Economy",
        description: "Annual production and imports of crude oil and petroleum oil lubricant (POL) products in millions metric tonnes (MMT).",
    },
};

export default function Page() {
    const data = getProductionAndImportsOfCrudeOilAndPetroleumProducts();

    return <ProductionAndImportsOfCrudeOilPage data={data} />;
}
