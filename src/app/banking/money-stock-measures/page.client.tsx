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
import { newestWith } from "@/lib/tables/latest";
import { MoneyStockMeasures } from "@/lib/api/tables/money-stock-measures";



interface MoneyStockMeasuresPageProps {
    moneyStockData : MoneyStockMeasures;
}

const MoneyStockMeasuresPage : React.FC<MoneyStockMeasuresPageProps> = ({ moneyStockData }) => {
    // Data is newest-first; first row is the latest observation.
    const latest = moneyStockData.data[0];

    const stats = useMemo(() => {
        // Each card takes the newest row that carries its own field: DBIE can publish one column a period
        // behind the rest, and a card off row 0 would read "—" (src/lib/tables/latest.ts).
        const latestM3Row = newestWith(moneyStockData.data, (r) => r.values["m3"]);
        const latestM1Row = newestWith(moneyStockData.data, (r) => r.values["m1"]);
        const crores = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr`;
        return {
            latestDate   : latest?.date || "—",
            latestM3     : crores(latestM3Row?.values["m3"] ?? null),
            latestM3Date : latestM3Row?.date || "—",
            latestM1     : crores(latestM1Row?.values["m1"] ?? null),
            latestM1Date : latestM1Row?.date || "—",
        };
    }, [ latest, moneyStockData ]);

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
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">M3 (broad money)</Text>
                <DataUnit
                    label={`Latest (${stats.latestM3Date})`}
                    value={stats.latestM3}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{moneyStockData.units}</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">M1 (narrow money)</Text>
                <DataUnit
                    label={`Latest (${stats.latestM1Date})`}
                    value={stats.latestM1}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{moneyStockData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <MoneyStockMeasuresChart
                    data={moneyStockData.data}
                    title="Money stock aggregates over time"
                    height={600}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <MoneyStockMeasuresGrid
                    data={moneyStockData.data}
                    columns={moneyStockData.columns}
                />
            </Div>
        </Article>
    );
};

export default MoneyStockMeasuresPage;
