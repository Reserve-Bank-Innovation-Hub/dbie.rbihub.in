"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import OtherConsumerPriceIndicesGrid from "@/components/tables/OtherConsumerPriceIndicesGrid";
import OtherConsumerPriceIndicesChart from "./OtherConsumerPriceIndicesChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedOtherConsumerPriceIndices } from "@/lib/api/tables/other-consumer-price-indices";

// STYLES ==============================================================================================================

interface OtherConsumerPriceIndicesPageProps {
    otherCPIData : ParsedOtherConsumerPriceIndices;
}

// The headline series driving the line chart: CPI for Industrial Workers, current base.
const HEADLINE_KEY = "cpiIW_2016";

const OtherConsumerPriceIndicesPage : React.FC<OtherConsumerPriceIndicesPageProps> = ({ otherCPIData }) => {
    const stats = useMemo(() => {
        return {
            totalRecords : otherCPIData.data.length,
            seriesCount  : otherCPIData.series.length,
            latestMonth  : otherCPIData.data[0]?.monthLabel || "N/A",
        };
    }, [ otherCPIData ]);

    return (
        <Article id="other-consumer-price-indices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Other consumer price indices
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Consumer Price Index for Industrial Workers, Agricultural Labourers and Rural Labourers,
                    across their respective base years
                </Heading6>
            </Div>

            <Div
                id="meta-card"
                className="grid-cell" padding="micro"
            >
                <DataUnit
                    label="Source"
                    value="Labour Bureau, Ministry of Labour and Employment"
                />

                <DataUnit
                    label="Series"
                    value={stats.seriesCount.toLocaleString()}
                />

                <DataUnit
                    label="Total records"
                    value={stats.totalRecords.toLocaleString()}
                />

                <DataUnit
                    label="Latest data"
                    value={stats.latestMonth}
                />
            </Div>

            {/* HEADLINE CHART /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <OtherConsumerPriceIndicesChart
                    data={otherCPIData.data}
                    seriesKey={HEADLINE_KEY}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <OtherConsumerPriceIndicesGrid
                    data={otherCPIData.data}
                    series={otherCPIData.series}
                />
            </Div>
        </Article>
    );
};

export default OtherConsumerPriceIndicesPage;
