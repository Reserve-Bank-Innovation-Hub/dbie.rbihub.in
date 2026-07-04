"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import IndexOfIndustrialProductionGrid from "@/components/tables/IndexOfIndustrialProductionGrid";
import IndexOfIndustrialProductionChart from "@/components/charts/IndexOfIndustrialProductionChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedIndexOfIndustrialProduction } from "@/lib/api/tables/index-of-industrial-production";

// STYLES ==============================================================================================================

interface IndexOfIndustrialProductionPageProps {
    iipData : ParsedIndexOfIndustrialProduction;
}

const IndexOfIndustrialProductionPage : React.FC<IndexOfIndustrialProductionPageProps> = ({ iipData }) => {
    const stats = useMemo(() => {
        const latest = iipData.data[0];
        const generalIndexLatest = latest?.index.generalIndex;
        const generalGrowthLatest = latest?.growth.generalIndex;
        return {
            totalRecords : iipData.data.length,
            latestPeriod : latest?.label ?? "N/A",
            generalIndex : generalIndexLatest != null
                ? generalIndexLatest.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : "N/A",
            generalGrowth : generalGrowthLatest != null ? `${generalGrowthLatest.toFixed(2)}%` : "N/A",
        };
    }, [ iipData.data ]);

    return (
        <Article id="index-of-industrial-production-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Index of industrial production
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Monthly index of industrial production (base {iipData.base}), by sectoral and use-based
                        classification, with year-on-year growth rates
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office, MoSPI"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.latestPeriod}
                />

                <DataUnit
                    label={`General index (${stats.latestPeriod})`}
                    value={stats.generalIndex}
                />

                <DataUnit
                    label="General index YoY growth"
                    value={stats.generalGrowth}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <IndexOfIndustrialProductionChart data={iipData.data} />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <IndexOfIndustrialProductionGrid
                    data={iipData.data}
                    categories={iipData.categories}
                />
            </Div>
        </Article>
    );
};

export default IndexOfIndustrialProductionPage;
