"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import LiquidityAggregatesGrid from "@/components/tables/LiquidityAggregatesGrid";
import LiquidityAggregatesChart from "@/components/charts/LiquidityAggregatesChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { LiquidityAggregates } from "@/lib/api/tables/liquidity-aggregates";



interface LiquidityAggregatesPageProps {
    data : LiquidityAggregates;
}

const LiquidityAggregatesPage : React.FC<LiquidityAggregatesPageProps> = ({ data }) => {
    // Data is newest-first, so the first row is the latest period.
    const latestPeriod = data.data[0]?.period ?? "—";

    return (
        <Article id="liquidity-aggregates-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Liquidity aggregates
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {data.unit} — NM3, L1, L2 and sub-components
                    </Heading6>
                </Div>

                <Text>
                    Monthly liquidity aggregate measures published by the Reserve Bank of India.
                    L1 comprises NM3 plus postal deposits; L2 adds liabilities of financial institutions
                    (term money borrowings, certificates of deposit and term deposits). Public deposits with
                    non-banking financial companies (NBFCs) are shown separately as measure 6.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestPeriod}
                />

                <DataUnit
                    label="Total records"
                    value={`${data.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <LiquidityAggregatesChart
                    data={data.data}
                    title="NM3, L1 and L2 over time"
                    height={480}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <LiquidityAggregatesGrid
                    columns={data.columns}
                    data={data.data}
                />
            </Div>
        </Article>
    );
};

export default LiquidityAggregatesPage;
