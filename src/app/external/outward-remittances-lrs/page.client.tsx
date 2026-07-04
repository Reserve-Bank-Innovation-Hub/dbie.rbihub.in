"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import OutwardRemittancesLRSGrid from "@/components/tables/OutwardRemittancesLRSGrid";
import OutwardRemittancesLRSChart from "@/components/charts/OutwardRemittancesLRSChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { OutwardRemittancesLRS } from "@/lib/api/tables/outward-remittances-lrs";


interface OutwardRemittancesLRSPageProps {
    lrsData : OutwardRemittancesLRS;
}

const OutwardRemittancesLRSPage : React.FC<OutwardRemittancesLRSPageProps> = ({ lrsData }) => {
    // Data is newest-first; the first row is the latest month.
    const latest = lrsData.data[0];

    const stats = useMemo(() => {
        const fmt = (v : number | null) => (v == null ? "—" : `US$ ${v.toLocaleString("en-IN", { minimumFractionDigits : 2, maximumFractionDigits : 2 })}M`);
        return {
            latestMonth   : latest?.month ?? "—",
            totalLRS      : fmt(latest?.values[0] ?? null),
            studiesAbroad : fmt(latest?.values[9] ?? null),
            travel        : fmt(latest?.values[6] ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="outward-remittances-lrs-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Outward remittances under the Liberalised Remittance Scheme
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Resident individuals; amounts in {lrsData.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on outward remittances by Indian resident individuals under the LRS, broken
                    down by purpose — deposit, purchase of immovable property, investment in equity or debt,
                    gift, donations, travel, maintenance of close relatives, medical treatment, studies abroad,
                    and others. Data available from April 2008.
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
                    value={`${lrsData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* LATEST STATS //////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total outward remittances</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.totalLRS}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{lrsData.unit}</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Studies abroad</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.studiesAbroad}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{lrsData.unit}</Text>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Travel</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.travel}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{lrsData.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <OutwardRemittancesLRSChart
                    data={lrsData.data}
                    unit={lrsData.unit}
                    title="Outward remittances under the LRS — purpose breakdown"
                    height={520}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <OutwardRemittancesLRSGrid
                    data={lrsData.data}
                    categories={lrsData.categories}
                    unit={lrsData.unit}
                />
            </Div>
        </Article>
    );
};

export default OutwardRemittancesLRSPage;
