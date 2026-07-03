// REACT CORE ==========================================================================================================
import React from "react";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// OTHER ===============================================================================================================
import TablesPage, { TableGroup } from "./page.client";

export const metadata : Metadata = {
    title       : "Tables — Database on Indian Economy",
    description : "Every data table available on the platform — SDMX series and RBI Bulletin tables, grouped by sector.",
};

interface CatalogueEntry {
    id          : string;
    source      : "sdmx" | "rbib";
    label       : string;
    frequency ? : string;
    sector ?    : string;
    subSector ? : string;
    publication ? : string;
    topic ?     : string;
}

// Catalogue entries that have a live page on the site
const LIVE_PAGES : Record<string, string> = {
    "sdmx:FOREX_RATE_D_RN" : "/indicators/exchange-rates",
    "sdmx:FR_EXG_RESV_RN"  : "/indicators/forex-reserves",
    "rbib:19"              : "/prices/consumer-price-index",
    "rbib:20"              : "/prices/other-consumer-price-indices",
    "rbib:21"              : "/prices/gold-and-silver-prices",
    "rbib:22"              : "/prices/wholesale-price-index",
    "rbib:23"              : "/growth/index-of-industrial-production",
    "rbib:27"              : "/markets/daily-call-money-rates",
    "rbib:28"              : "/markets/certificates-of-deposit",
    "rbib:29"              : "/markets/commercial-paper",
    "rbib:30"              : "/markets/financial-markets-turnover",
    "rbib:31"              : "/markets/new-capital-issues",
    "rbib:06"              : "/banking/money-stock-measures",
    "rbib:07"              : "/banking/sources-of-money-stock",
    "rbib:08"              : "/banking/monetary-survey",
    "rbib:09"              : "/banking/liquidity-aggregates",
    "rbib:10"              : "/banking/rbi-survey",
    "rbib:11"              : "/banking/reserve-money",
    "rbib:12"              : "/banking/commercial-bank-survey",
    "rbib:13"              : "/banking/scb-investments",
    "rbib:14"              : "/banking/business-of-scheduled-banks",
    "rbib:15"              : "/banking/bank-credit-by-sector",
    "rbib:16"              : "/banking/bank-credit-by-industry",
    "rbib:17"              : "/banking/state-cooperative-banks",
    "rbib:32"              : "/external/foreign-trade",
    "rbib:33"              : "/external/forex-reserves-weekly",
    "rbib:34"              : "/external/nri-deposits",
    "rbib:35"              : "/external/foreign-investment-inflows-bulletin",
    "rbib:36"              : "/external/outward-remittances-lrs",
    "rbib:37"              : "/external/reer-and-neer",
    "rbib:38"              : "/external/external-commercial-borrowings",
    "rbib:40"              : "/external/balance-of-payments-usd",
    "rbib:41"              : "/external/balance-of-payments-inr",
    "rbib:42"              : "/external/bop-bpm6-usd",
    "rbib:43"              : "/external/bop-bpm6-inr",
    "rbib:44"              : "/external/international-investment-position",
};

export default function Page() {
    // The catalogue is committed alongside the data — read it at build time (SSG)
    const cataloguePath = path.join(process.cwd(), "data", "catalogue.json");
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));

    // Normalise both sources into sector → sub-sector → tables
    const groups = new Map<string, Map<string, { label : string; frequency : string; linkTo ? : string }[]>>();

    for (const entry of catalogue.entries as CatalogueEntry[]) {
        const sector    = entry.sector ?? entry.publication ?? "Other";
        const subSector = entry.subSector ?? entry.topic ?? "";

        if (!groups.has(sector)) groups.set(sector, new Map());
        const subGroups = groups.get(sector)!;
        if (!subGroups.has(subSector)) subGroups.set(subSector, []);
        subGroups.get(subSector)!.push({
            label     : entry.label,
            frequency : entry.frequency ?? "",
            linkTo    : LIVE_PAGES[entry.id],
        });
    }

    const tableGroups : TableGroup[] = [ ...groups.entries() ].map(([ sector, subGroups ]) => ({
        sector,
        subGroups : [ ...subGroups.entries() ].map(([ subSector, tables ]) => ({
            subSector,
            tables : tables.sort((a, b) => a.label.localeCompare(b.label)),
        })),
    }));

    const total     = (catalogue.entries as CatalogueEntry[]).length;
    const liveCount = Object.keys(LIVE_PAGES).length;

    return <TablesPage groups={tableGroups} total={total} liveCount={liveCount} />;
}
