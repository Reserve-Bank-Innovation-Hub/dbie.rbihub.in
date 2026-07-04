"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import IndexNumbersTwentyThreeMajorIndustryGroupsGrid from "@/components/tables/IndexNumbersTwentyThreeMajorIndustryGroupsGrid";
import IndexNumbersTwentyThreeMajorIndustryGroupsChart from "@/components/charts/IndexNumbersTwentyThreeMajorIndustryGroupsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { IndexNumbersTwentyThreeMajorIndustryGroups } from "@/lib/api/tables/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing";

// STYLES ==============================================================================================================
import "./index-numbers-page.css";

interface IndexNumbersTwentyThreeMajorIndustryGroupsPageProps {
    data : IndexNumbersTwentyThreeMajorIndustryGroups;
}

const IndexNumbersTwentyThreeMajorIndustryGroupsPage : React.FC<IndexNumbersTwentyThreeMajorIndustryGroupsPageProps> = ({ data }) => {
    // Default to the first (newest) base year — 2011-12.
    const [ activeBaseIdx, setActiveBaseIdx ] = useState(0);
    const activeBase = data.bases[activeBaseIdx] ?? data.bases[0];

    const stats = useMemo(() => {
        const latestYear   = activeBase.data[0]?.year ?? "N/A";
        const totalRows    = activeBase.data.length;
        const industryCount = activeBase.industries.length;
        return { latestYear, totalRows, industryCount };
    }, [ activeBase ]);

    return (
        <Article id="index-numbers-twenty-three-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index numbers of twenty-three major industry groups of manufacturing sector
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Base: 2011-12 = 100; annual data
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Central Statistics Office (CSO), GoI"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Data rows"
                    value={stats.totalRows.toLocaleString()}
                />

                <DataUnit
                    label="Industry groups"
                    value={stats.industryCount.toLocaleString()}
                />
            </Div>

            {/* BASE SELECTOR ////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="base-selector" className="controls-cell grid-cell" padding="micro">
                <Text size="small" isSubtext marginBottom="nano">Base year</Text>

                <Div className="base-tab-group">
                    {data.bases.map((base, i) => (
                        <button
                            key={base.base}
                            className={`base-tab${i === activeBaseIdx ? " base-tab--active" : ""}`}
                            onClick={() => setActiveBaseIdx(i)}
                        >
                            {base.label}
                        </button>
                    ))}
                </Div>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <IndexNumbersTwentyThreeMajorIndustryGroupsChart
                    data={activeBase.data}
                    industries={activeBase.industries}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <IndexNumbersTwentyThreeMajorIndustryGroupsGrid
                    data={activeBase.data}
                    industries={activeBase.industries}
                />
            </Div>
        </Article>
    );
};

export default IndexNumbersTwentyThreeMajorIndustryGroupsPage;
