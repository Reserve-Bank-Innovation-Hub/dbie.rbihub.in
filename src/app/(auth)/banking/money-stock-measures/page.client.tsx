"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import MoneyStockMeasuresGrid from "@/components/tables/MoneyStockMeasuresGrid";
import MoneyStockMeasuresChart from "@/components/charts/MoneyStockMeasuresChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { MoneyStockMeasures } from "@/lib/api/tables/money-stock-measures";

// STYLES ==============================================================================================================
import "./money-stock-measures-page.css";

interface MoneyStockMeasuresPageProps {
    moneyStockData : MoneyStockMeasures;
}

const MoneyStockMeasuresPage : React.FC<MoneyStockMeasuresPageProps> = ({ moneyStockData }) => {
    // Data is newest-first; first row is the latest observation.
    const latest = moneyStockData.data[0];

    const stats = useMemo(() => {
        const crores = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr`;
        return {
            latestDate : latest?.date || "—",
            latestM3   : crores(latest?.values["m3"] ?? null),
            latestM1   : crores(latest?.values["m1"] ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="money-stock-measures-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Money stock measures
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Fortnightly components and aggregates (M1–M4) · {moneyStockData.units}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly data on money stock components — currency with the public, deposit
                    money, time deposits — and the derived aggregates M1, M2, M3, and M4, published
                    by the Reserve Bank of India since 1951.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={stats.latestDate}
                />

                <DataUnit
                    label="Total records"
                    value={`${moneyStockData.data.length.toLocaleString()} fortnights`}
                />
            </Div>

            {/* AGGREGATE STATS //////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">M3 (broad money)</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestM3}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{moneyStockData.units}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">M1 (narrow money)</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestM1}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{moneyStockData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <MoneyStockMeasuresChart
                data={moneyStockData.data}
                title="Money stock aggregates over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="money-stock-measures-grid">
                <MoneyStockMeasuresGrid
                    data={moneyStockData.data}
                    columns={moneyStockData.columns}
                />
            </Div>
        </Article>
    );
};

export default MoneyStockMeasuresPage;
