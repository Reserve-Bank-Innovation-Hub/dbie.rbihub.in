"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import YieldPerHectareMajorCommercialCropsGrid from "@/components/tables/YieldPerHectareMajorCommercialCropsGrid";
import YieldPerHectareMajorCommercialCropsChart from "@/components/charts/YieldPerHectareMajorCommercialCropsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { YieldPerHectareMajorCommercialCrops } from "@/lib/api/tables/yield-per-hectare-major-commercial-crops";

// STYLES ==============================================================================================================
import "./yield-per-hectare-major-commercial-crops-page.css";

interface YieldPerHectareMajorCommercialCropsPageProps {
    tableData : YieldPerHectareMajorCommercialCrops;
}

const YieldPerHectareMajorCommercialCropsPage : React.FC<YieldPerHectareMajorCommercialCropsPageProps> = ({ tableData }) => {
    const latest = tableData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear       : latest?.year || "—",
            latestOilseeds   : fmt(latest?.totalOilseeds ?? null),
            latestSugarcane  : fmt(latest?.sugarcane ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="yield-per-hectare-major-commercial-crops-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Yield per hectare — major commercial crops
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.unit}
                    </Heading6>
                </Div>

                <Text>
                    Annual crop yield per hectare for major commercial crops in India — oilseeds (groundnut,
                    rapeseed &amp; mustard, soyabean), sugarcane, tea, coffee, cotton lint, raw jute &amp; mesta,
                    and tobacco. Data from the Ministry of Agriculture &amp; Farmers Welfare, compiled by RBI.
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
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Total oilseeds</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestOilseeds} ${tableData.unit}`}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Sugarcane</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestSugarcane} ${tableData.unit}`}
                    size="large"
                    align="right"
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <YieldPerHectareMajorCommercialCropsChart
                data={tableData.data}
                unit={tableData.unit}
                title="Yield per hectare — major commercial crops (annual)"
                height={500}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="yield-per-hectare-major-commercial-crops-grid">
                <YieldPerHectareMajorCommercialCropsGrid
                    data={tableData.data}
                    columns={tableData.columns}
                    unit={tableData.unit}
                />
            </Div>
        </Article>
    );
};

export default YieldPerHectareMajorCommercialCropsPage;
