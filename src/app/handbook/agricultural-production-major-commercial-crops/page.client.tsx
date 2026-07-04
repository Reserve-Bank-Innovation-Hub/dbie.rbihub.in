"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AgriculturalProductionMajorCommercialCropsGrid from "@/components/tables/AgriculturalProductionMajorCommercialCropsGrid";
import AgriculturalProductionMajorCommercialCropsChart from "@/components/charts/AgriculturalProductionMajorCommercialCropsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AgriculturalProductionMajorCommercialCrops } from "@/lib/api/tables/agricultural-production-major-commercial-crops";


interface AgriculturalProductionMajorCommercialCropsPageProps {
    tableData : AgriculturalProductionMajorCommercialCrops;
}

const AgriculturalProductionMajorCommercialCropsPage : React.FC<AgriculturalProductionMajorCommercialCropsPageProps> = ({ tableData }) => {
    const latest = tableData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear        : latest?.year || "—",
            latestSugarcane   : fmt(latest?.sugarcane ?? null),
            latestTotalOils   : fmt(latest?.total_oilseeds ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="agricultural-production-major-commercial-crops-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Agricultural production of major commercial crops
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Oilseeds, sugarcane, cotton, jute, tea and coffee — {tableData.units.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Annual production of major commercial crops across India from 1950-51, covering
                    oilseeds (groundnut, rapeseed & mustard, soyabean), sugarcane, cotton lint,
                    raw jute & mesta, tea and coffee. Source: Ministry of Agriculture & Farmers
                    Welfare, Government of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Agriculture & Farmers Welfare"
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

            {/* LATEST STATS //////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Sugarcane</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestSugarcane} lakh T`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total oilseeds</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestTotalOils} lakh T`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <AgriculturalProductionMajorCommercialCropsChart
                    data={tableData.data}
                    units={tableData.units}
                    title="Agricultural production of major commercial crops over time"
                    height={600}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <AgriculturalProductionMajorCommercialCropsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default AgriculturalProductionMajorCommercialCropsPage;
