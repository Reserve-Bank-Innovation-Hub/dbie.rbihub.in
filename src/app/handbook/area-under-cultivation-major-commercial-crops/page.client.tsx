"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AreaUnderCultivationMajorCommercialCropsGrid from "@/components/tables/AreaUnderCultivationMajorCommercialCropsGrid";
import AreaUnderCultivationMajorCommercialCropsChart from "@/components/charts/AreaUnderCultivationMajorCommercialCropsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AreaUnderCultivationMajorCommercialCrops } from "@/lib/api/tables/area-under-cultivation-major-commercial-crops";

// STYLES ==============================================================================================================
import "./area-under-cultivation-major-commercial-crops-page.css";

interface AreaUnderCultivationMajorCommercialCropsPageProps {
    tableData : AreaUnderCultivationMajorCommercialCrops;
}

const AreaUnderCultivationMajorCommercialCropsPage : React.FC<AreaUnderCultivationMajorCommercialCropsPageProps> = ({ tableData }) => {
    const latest = tableData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear      : latest?.year || "—",
            latestOilseeds  : fmt(latest?.total_oilseeds ?? null),
            latestCotton    : fmt(latest?.cotton_lint ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="area-under-cultivation-major-commercial-crops-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Area under cultivation of major commercial crops
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Oilseeds, sugarcane, cotton, jute, tea, coffee and tobacco — {tableData.units.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Annual area under cultivation of major commercial crops across India from
                    1950-51, covering oilseeds (groundnut, rapeseed & mustard, soyabean),
                    sugarcane, cotton lint, raw jute & mesta, tea, coffee and tobacco. Source:
                    Ministry of Agriculture & Farmers Welfare, Government of India.
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
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Total oilseeds area</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestOilseeds} lakh ha`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Cotton lint area</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestCotton} lakh ha`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <AreaUnderCultivationMajorCommercialCropsChart
                data={tableData.data}
                units={tableData.units}
                title="Area under cultivation of major commercial crops over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="area-under-cultivation-major-commercial-crops-grid">
                <AreaUnderCultivationMajorCommercialCropsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default AreaUnderCultivationMajorCommercialCropsPage;
