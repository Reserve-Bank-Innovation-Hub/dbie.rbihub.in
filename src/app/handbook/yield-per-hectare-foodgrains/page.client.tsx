"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import YieldPerHectareFoodgrainsGrid from "@/components/tables/YieldPerHectareFoodgrainsGrid";
import YieldPerHectareFoodgrainsChart from "@/components/charts/YieldPerHectareFoodgrainsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { YieldPerHectareFoodgrains } from "@/lib/api/tables/yield-per-hectare-foodgrains";

// STYLES ==============================================================================================================

interface YieldPerHectareFoodgrainsPageProps {
    tableData : YieldPerHectareFoodgrains;
}

const YieldPerHectareFoodgrainsPage : React.FC<YieldPerHectareFoodgrainsPageProps> = ({ tableData }) => {
    const latest = tableData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear  : latest?.year || "—",
            latestRice  : fmt(latest?.rice ?? null),
            latestWheat : fmt(latest?.wheat ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="yield-per-hectare-foodgrains-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Yield per hectare — foodgrains
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.unit}
                    </Heading6>
                </Div>

                <Text>
                    Annual crop yield per hectare for major foodgrains in India — rice, wheat, coarse cereals,
                    total cereals and pulses. Data from the Ministry of Agriculture &amp; Farmers Welfare,
                    compiled by RBI.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Agriculture & Farmers Welfare / RBI"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${tableData.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* HEADLINE STAT CARDS //////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Rice</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestRice} ${tableData.unit}`}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Wheat</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestWheat !== "—" ? `${stats.latestWheat} ${tableData.unit}` : "—"}
                    size="large"
                    align="right"
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell">
                <YieldPerHectareFoodgrainsChart
                    data={tableData.data}
                    unit={tableData.unit}
                    title="Yield per hectare — foodgrains (annual)"
                    height={500}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <YieldPerHectareFoodgrainsGrid
                    data={tableData.data}
                    columns={tableData.columns}
                    unit={tableData.unit}
                />
            </Div>
        </Article>
    );
};

export default YieldPerHectareFoodgrainsPage;
