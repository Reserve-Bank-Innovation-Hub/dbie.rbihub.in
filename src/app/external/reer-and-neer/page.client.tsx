"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ReerAndNeerGrid from "@/components/tables/ReerAndNeerGrid";
import ReerAndNeerChart from "@/components/charts/ReerAndNeerChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ReerAndNeer } from "@/lib/api/tables/reer-and-neer";


interface ReerAndNeerPageProps {
    reerNeerData : ReerAndNeer;
}

const ReerAndNeerPage : React.FC<ReerAndNeerPageProps> = ({ reerNeerData }) => {
    // The file is newest-first; find the first row with a non-null REER value for stat cards.
    const latestRow = reerNeerData.data[0];

    const stats = useMemo(() => {
        const latestWithTradeReer  = reerNeerData.data.find((r) => r.trade_reer  != null);
        const latestWithExportReer = reerNeerData.data.find((r) => r.export_reer != null);

        const fmt = (v : number | null) =>
            v == null ? "—" : v.toLocaleString("en-IN", {
                minimumFractionDigits : 2,
                maximumFractionDigits : 2,
            });

        return {
            latestMonth  : latestRow?.month || "—",
            tradeReer    : fmt(latestWithTradeReer?.trade_reer  ?? null),
            tradeReerMonth  : latestWithTradeReer?.month  || "—",
            exportReer   : fmt(latestWithExportReer?.export_reer ?? null),
            exportReerMonth : latestWithExportReer?.month || "—",
        };
    }, [ latestRow, reerNeerData.data ]);

    return (
        <Article id="reer-and-neer-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Indices of NEER and REER of the Indian rupee
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        40-currency basket; base 2015-16 = 100
                    </Heading6>
                </Div>

                <Text>
                    The Nominal Effective Exchange Rate (NEER) measures the value of the rupee
                    against a basket of currencies, weighted by trade shares. The Real Effective
                    Exchange Rate (REER) adjusts NEER for relative inflation differentials and
                    reflects international competitiveness. A rise in REER indicates appreciation
                    (loss of competitiveness) and a fall indicates depreciation (gain of competitiveness).
                    Both trade-weighted and export-weighted variants are shown.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Total records"
                    value={`${reerNeerData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="stat-trade-reer" className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Trade REER</Text>
                <DataUnit
                    label={`Latest (${stats.tradeReerMonth})`}
                    value={stats.tradeReer}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Index, base 2015-16 = 100</Text>
            </Div>

            <Div id="stat-export-reer" className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Export REER</Text>
                <DataUnit
                    label={`Latest (${stats.exportReerMonth})`}
                    value={stats.exportReer}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Index, base 2015-16 = 100</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <ReerAndNeerChart
                    data={reerNeerData.data}
                    title="NEER and REER of the Indian rupee over time"
                    height={600}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ReerAndNeerGrid data={reerNeerData.data} />
            </Div>
        </Article>
    );
};

export default ReerAndNeerPage;
