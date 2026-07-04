"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AgriculturalProductionFoodgrainsGrid from "@/components/tables/AgriculturalProductionFoodgrainsGrid";
import AgriculturalProductionFoodgrainsChart from "@/components/charts/AgriculturalProductionFoodgrainsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AgriculturalProductionFoodgrains } from "@/lib/api/tables/agricultural-production-foodgrains";

// STYLES ==============================================================================================================
import "./agricultural-production-foodgrains-page.css";

interface AgriculturalProductionFoodgrainsPageProps {
    tableData : AgriculturalProductionFoodgrains;
}

const AgriculturalProductionFoodgrainsPage : React.FC<AgriculturalProductionFoodgrainsPageProps> = ({ tableData }) => {
    // The file is newest-first, so the first row is the latest year.
    const latest = tableData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear     : latest?.year || "—",
            latestTotal    : fmt(latest?.total_cereals ?? null),
            latestPulses   : fmt(latest?.pulses ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="agricultural-production-foodgrains-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Agricultural production of foodgrains
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Rice, wheat, coarse cereals and pulses — {tableData.units.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Annual production of foodgrains across India from 1950-51, covering cereals
                    (rice, wheat and coarse cereals) and pulses. Source: Ministry of Agriculture
                    & Farmers Welfare, Government of India.
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
                <Text weight="600" marginBottom="nano">Total cereals</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestTotal} lakh T`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Pulses</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={`${stats.latestPulses} lakh T`}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{tableData.units}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <AgriculturalProductionFoodgrainsChart
                data={tableData.data}
                units={tableData.units}
                title="Agricultural production of foodgrains over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="agricultural-production-foodgrains-grid">
                <AgriculturalProductionFoodgrainsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default AgriculturalProductionFoodgrainsPage;
