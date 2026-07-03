"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div, Button } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AgriProductionMajorCropsGrid from "@/components/tables/AgriProductionMajorCropsGrid";
import AgriProductionMajorCropsChart from "@/components/charts/AgriProductionMajorCropsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AgriProductionMajorCrops } from "@/lib/api/tables/index-numbers-of-agricultural-production-major-crops";

// STYLES ==============================================================================================================
import "./index-numbers-of-agricultural-production-major-crops-page.css";

interface AgriProductionMajorCropsPageProps {
    tableData : AgriProductionMajorCrops;
}

const AgriProductionMajorCropsPage : React.FC<AgriProductionMajorCropsPageProps> = ({ tableData }) => {
    // Default to the newest-base series (index 0, sorted newest-base-first in the processor).
    const [ selectedSeriesIdx, setSelectedSeriesIdx ] = useState(0);

    const activeSeries = tableData.series[selectedSeriesIdx];
    const latest = activeSeries?.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : v.toLocaleString("en-IN"));
        return {
            latestYear     : latest?.year || "—",
            latestAllCrops : fmt(latest?.allCrops ?? null),
            latestFood     : fmt(latest?.foodGrains ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="agri-production-major-crops-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of agricultural production — major crops
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base: triennium ending {activeSeries?.base || "…"} = 100
                    </Heading6>
                </Div>

                <Text>
                    Annual index numbers of agricultural production for major crops — foodgrains, oilseeds,
                    fibres, cash crops and more. Three base periods are available; select a series below.
                    Data from the Ministry of Agriculture, compiled by RBI.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Agriculture / RBI"
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
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">All crops</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestAllCrops}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Food-grains</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestFood}
                    size="large"
                    align="right"
                />
            </Div>

            {/* SERIES SELECTOR /////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="series-selector" className="grid-cell" padding="micro">
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
                <AgriProductionMajorCropsChart
                    data={activeSeries.data}
                    base={activeSeries.base}
                    title={`Index numbers of agricultural production — major crops (base ${activeSeries.base})`}
                    height={500}
                />
            )}

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            {activeSeries && (
                <Div className="agri-production-major-crops-grid">
                    <AgriProductionMajorCropsGrid
                        data={activeSeries.data}
                        columns={tableData.columns}
                        base={activeSeries.base}
                    />
                </Div>
            )}
        </Article>
    );
};

export default AgriProductionMajorCropsPage;
