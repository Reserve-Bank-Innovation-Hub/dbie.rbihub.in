"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SourcesOfMoneyStockGrid from "@/components/tables/SourcesOfMoneyStockGrid";
import SourcesOfMoneyStockChart from "@/components/charts/SourcesOfMoneyStockChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SourcesOfMoneyStock } from "@/lib/api/tables/sources-of-money-stock";

// STYLES ==============================================================================================================
import "./sources-of-money-stock-page.css";

interface SourcesOfMoneyStockPageProps {
    sourcesData : SourcesOfMoneyStock;
}

const SourcesOfMoneyStockPage : React.FC<SourcesOfMoneyStockPageProps> = ({ sourcesData }) => {
    // Data is newest-first; first row is the latest observation.
    const latest = sourcesData.data[0];

    const stats = useMemo(() => {
        const crores = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr`;
        return {
            latestDate   : latest?.date || "—",
            latestM3     : crores(latest?.values["m3"] ?? null),
            latestNBCGov : crores(latest?.values["netBankCreditToGovernment"] ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="sources-of-money-stock-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Sources of money stock (M3)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Fortnightly supply-side breakdown · {sourcesData.units}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly breakdown of the sources of M3 — net bank credit to government,
                    bank credit to the commercial sector, net foreign exchange assets of the banking
                    sector, government currency liabilities, and net non-monetary liabilities —
                    published by the Reserve Bank of India since 1951.
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
                    value={`${sourcesData.data.length.toLocaleString()} fortnights`}
                />
            </Div>

            {/* AGGREGATE STATS //////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">M3</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestM3}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{sourcesData.units}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Net bank credit to government</Text>
                <DataUnit
                    label={`Latest (${stats.latestDate})`}
                    value={stats.latestNBCGov}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{sourcesData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <SourcesOfMoneyStockChart
                data={sourcesData.data}
                title="Sources of money stock (M3) over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="sources-of-money-stock-grid">
                <SourcesOfMoneyStockGrid
                    data={sourcesData.data}
                    columns={sourcesData.columns}
                />
            </Div>
        </Article>
    );
};

export default SourcesOfMoneyStockPage;
