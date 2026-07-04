"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ScbInvestmentsGrid from "@/components/tables/ScbInvestmentsGrid";
import ScbInvestmentsChart from "@/components/charts/ScbInvestmentsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ScbInvestments } from "@/lib/api/tables/scb-investments";



interface ScbInvestmentsPageClientProps {
    data : ScbInvestments;
}

const ScbInvestmentsPageClient : React.FC<ScbInvestmentsPageClientProps> = ({ data }) => {
    const latest = data.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;

        // Total across all non-null series for the latest row.
        const seriesCodes = data.columns.map(c => c.code) as (keyof typeof latest)[];
        const latestTotal = latest
            ? seriesCodes.reduce<number>((sum, code) => {
                const v = latest[code];
                return typeof v === "number" ? sum + v : sum;
              }, 0)
            : null;

        return {
            latestFortnight : latest?.fortnight ?? "—",
            latestSlr       : fmt(latest?.slr ?? null),
            latestTotal     : latestTotal != null ? fmt(latestTotal) : "—",
            totalRecords    : data.data.length,
        };
    }, [ latest, data.columns ]);

    return (
        <Article id="scb-investments-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Scheduled commercial banks&#39; investments
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        {data.units} — fortnightly, newest first
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest fortnight"
                    value={stats.latestFortnight}
                />

                <DataUnit
                    label="Total records"
                    value={`${stats.totalRecords.toLocaleString()} fortnights`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">SLR securities</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestSlr}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.units}</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total investments</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestTotal}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Sum of all non-null series</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <ScbInvestmentsChart
                    data={data.data}
                    title="SLR securities holdings over time"
                    height={600}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ScbInvestmentsGrid
                    data={data.data}
                    columns={data.columns}
                />
            </Div>
        </Article>
    );
};

export default ScbInvestmentsPageClient;
