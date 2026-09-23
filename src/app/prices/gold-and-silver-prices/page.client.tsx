"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import GoldAndSilverPricesGrid from "@/components/tables/GoldAndSilverPricesGrid";
import GoldAndSilverPricesChart from "@/components/charts/GoldAndSilverPricesChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { newestWith } from "@/lib/tables/latest";
import { GoldAndSilverPrices } from "@/lib/api/tables/gold-and-silver-prices";

// STYLES ==============================================================================================================

interface GoldAndSilverPricesPageProps {
    pricesData : GoldAndSilverPrices;
}

const GoldAndSilverPricesPage : React.FC<GoldAndSilverPricesPageProps> = ({ pricesData }) => {
    // The file is newest-first, so the first row is the latest month.
    const latest = pricesData.data[0];

    const stats = useMemo(() => {
        // Each card takes the newest row that carries its own field: DBIE can publish one column a period
        // behind the rest, and a card off row 0 would read "—" (src/lib/tables/latest.ts).
        const latestGoldRow = newestWith(pricesData.data, (r) => r.gold);
        const latestSilverRow = newestWith(pricesData.data, (r) => r.silver);
        const rupees = (v : number | null) => (v == null ? "—" : `₹${v.toLocaleString("en-IN")}`);
        return {
            latestMonth      : latest?.month || "—",
            latestGold       : rupees(latestGoldRow?.gold ?? null),
            latestGoldDate   : latestGoldRow?.month || "—",
            latestSilver     : rupees(latestSilverRow?.silver ?? null),
            latestSilverDate : latestSilverRow?.month || "—",
        };
    }, [ latest, pricesData ]);

    return (
        <Article id="gold-and-silver-prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <PageCrumbs />

                    <Heading4 weight="700" marginBottom="nano">
                        Monthly average price of gold and silver in Mumbai
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Standard gold in {pricesData.units.gold.toLowerCase()}; silver in {pricesData.units.silver.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly average bullion prices in Mumbai. Standard gold is quoted per 10 grams and silver
                    per kilogram, so the two series are plotted on separate axes.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Total records"
                    value={`${pricesData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* LATEST PRICE STATS ///////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Standard gold</Text>
                <DataUnit
                    label={`Latest (${stats.latestGoldDate})`}
                    value={stats.latestGold}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{pricesData.units.gold}</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Silver</Text>
                <DataUnit
                    label={`Latest (${stats.latestSilverDate})`}
                    value={stats.latestSilver}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{pricesData.units.silver}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <GoldAndSilverPricesChart
                    data={pricesData.data}
                    units={pricesData.units}
                    title="Gold and silver prices over time"
                    height={600}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <GoldAndSilverPricesGrid
                    data={pricesData.data}
                    units={pricesData.units}
                />
            </Div>
        </Article>
    );
};

export default GoldAndSilverPricesPage;
