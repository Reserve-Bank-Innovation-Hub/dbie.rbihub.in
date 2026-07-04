"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import FinancialMarketsTurnoverGrid from "@/components/tables/FinancialMarketsTurnoverGrid";
import FinancialMarketsTurnoverChart from "@/components/charts/FinancialMarketsTurnoverChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { FinancialMarketsTurnover } from "@/lib/api/tables/financial-markets-turnover";

// STYLES ==============================================================================================================

interface FinancialMarketsTurnoverPageProps {
    turnoverData : FinancialMarketsTurnover;
}

const FinancialMarketsTurnoverPage : React.FC<FinancialMarketsTurnoverPageProps> = ({ turnoverData }) => {
    // Data is newest-first, so the first row is the latest period.
    const latest = turnoverData.data[0];

    const stats = useMemo(() => {
        const cr = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;

        return {
            latestPeriod     : latest?.period ?? "—",
            latestCallMoney  : cr(latest?.values["call_money"] ?? null),
            latestTriparty   : cr(latest?.values["triparty_repo"] ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="financial-markets-turnover-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Average daily turnover in select financial markets
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Weekly data, {turnoverData.unit.toLowerCase()} (except Forex, which is US $ million)
                    </Heading6>
                </Div>

                <Text>
                    Weekly average daily turnover across India's key financial markets — call/notice/term money,
                    triparty and market repo, forex, government securities, and treasury bills — published in
                    the RBI Monthly Bulletin (Table 30).
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.latestPeriod}
                />

                <DataUnit
                    label="Total records"
                    value={`${turnoverData.data.length.toLocaleString()} weeks`}
                />

                <DataUnit
                    label="Market columns"
                    value={`${turnoverData.markets.length} markets`}
                />
            </Div>

            {/* LATEST STATS ////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Call money</Text>
                <DataUnit
                    label={`Latest (${stats.latestPeriod})`}
                    value={stats.latestCallMoney}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Average daily turnover, Rupees Crores</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Triparty repo</Text>
                <DataUnit
                    label={`Latest (${stats.latestPeriod})`}
                    value={stats.latestTriparty}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Average daily turnover, Rupees Crores</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <FinancialMarketsTurnoverChart
                    data={turnoverData.data}
                    markets={turnoverData.markets}
                    title="Daily turnover in select financial markets"
                    height={600}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <FinancialMarketsTurnoverGrid
                    data={turnoverData.data}
                    markets={turnoverData.markets}
                />
            </Div>
        </Article>
    );
};

export default FinancialMarketsTurnoverPage;
