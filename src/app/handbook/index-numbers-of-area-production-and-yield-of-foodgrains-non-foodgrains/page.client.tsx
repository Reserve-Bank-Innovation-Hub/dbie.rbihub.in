"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div, Button } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AreaProductionYieldFoodgrainsGrid from "@/components/tables/AreaProductionYieldFoodgrainsGrid";
import AreaProductionYieldFoodgrainsChart from "@/components/charts/AreaProductionYieldFoodgrainsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AreaProductionYieldFoodgrainsNonFoodgrains } from "@/lib/api/tables/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains";


interface AreaProductionYieldFoodgrainsPageProps {
    tableData : AreaProductionYieldFoodgrainsNonFoodgrains;
}

const AreaProductionYieldFoodgrainsPage : React.FC<AreaProductionYieldFoodgrainsPageProps> = ({ tableData }) => {
    // Default to the newest-base series (index 0, sorted newest-base-first).
    const [ selectedSeriesIdx, setSelectedSeriesIdx ] = useState(0);

    const activeSeries = tableData.series[selectedSeriesIdx];
    const latest = activeSeries?.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear        : latest?.year || "—",
            latestAllProdn    : fmt(latest?.allCropsProduction ?? null),
            latestFoodGrains  : fmt(latest?.foodGrainsProduction ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="area-production-yield-foodgrains-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of area, production and yield — foodgrains &amp; non-foodgrains
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base: triennium ending {activeSeries?.base || "…"} = 100
                    </Heading6>
                </Div>

                <Text>
                    Annual index numbers of area sown, total production and yield per hectare for foodgrains,
                    non-foodgrains and all crops combined. Three base periods span 1949-50 to present.
                    Data from the Ministry of Agriculture &amp; Farmers Welfare, compiled by RBI.
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
                    label="Series records"
                    value={`${activeSeries?.data.length.toLocaleString() ?? "—"} years`}
                />
            </Div>

            {/* LATEST STAT CARDS ////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">All crops — production</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestAllProdn}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Foodgrains — production</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestFoodGrains}
                    size="large"
                    align="right"
                />
            </Div>

            {/* SERIES SELECTOR /////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="series-selector" className="controls-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Base period</Text>
                <Div className="series-buttons">
                    {tableData.series.map((s, idx) => (
                        <Button
                            key={s.base}
                            kind={idx === selectedSeriesIdx ? "primary" : "secondary"}
                            size="small"
                            onClick={() => setSelectedSeriesIdx(idx)}
                        >
                            {s.base}
                        </Button>
                    ))}
                </Div>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            {activeSeries && (
                <Div className="chart-cell grid-cell">
                    <AreaProductionYieldFoodgrainsChart
                        data={activeSeries.data}
                        base={activeSeries.base}
                        title={`Area, production and yield — all crops (base ${activeSeries.base})`}
                        height={500}
                    />
                </Div>
            )}

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            {activeSeries && (
                <Div className="table-cell grid-cell">
                    <AreaProductionYieldFoodgrainsGrid
                        data={activeSeries.data}
                        columns={tableData.columns}
                        base={activeSeries.base}
                    />
                </Div>
            )}
        </Article>
    );
};

export default AreaProductionYieldFoodgrainsPage;
