"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import PublicDistributionSystemGrid from "@/components/tables/PublicDistributionSystemGrid";
import PublicDistributionSystemChart from "@/components/charts/PublicDistributionSystemChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { newestWith } from "@/lib/tables/latest";
import { PublicDistributionSystemData } from "@/lib/api/tables/public-distribution-system-procurement-off-take-and-stocks";

// STYLES ==============================================================================================================

interface PublicDistributionSystemPageProps {
    data : PublicDistributionSystemData;
}

const PublicDistributionSystemPage : React.FC<PublicDistributionSystemPageProps> = ({ data }) => {
    // Data is newest-first; the first row is the latest year.
    const latest = data.data[0];

    const stats = useMemo(() => {
        // Each card takes the newest row that carries its own field: DBIE can publish one column a period
        // behind the rest, and a card off row 0 would read "—" (src/lib/tables/latest.ts).
        const procTotalRow = newestWith(data.data, (r) => r.proc_total);
        const offtTotalRow = newestWith(data.data, (r) => r.offt_total);
        const stckTotalRow = newestWith(data.data, (r) => r.stck_total);
        const lakhT = (v : number | null) =>
            v == null ? "—" : `${v.toLocaleString("en-IN")} lakh T`;
        return {
            latestYear    : latest?.year || "—",
            procTotal     : lakhT(procTotalRow?.proc_total ?? null),
            procTotalDate : procTotalRow?.year || "—",
            offtTotal     : lakhT(offtTotalRow?.offt_total ?? null),
            offtTotalDate : offtTotalRow?.year || "—",
            stckTotal     : lakhT(stckTotalRow?.stck_total ?? null),
            stckTotalDate : stckTotalRow?.year || "—",
        };
    }, [ latest, data ]);

    return (
        <Article id="pds-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Public distribution system — procurement, off-take and stocks
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Foodgrains (rice and wheat); lakhs tonnes
                    </Heading6>
                </Div>

                <Text>
                    Annual data on central government procurement, off-take, and buffer stocks of rice and
                    wheat under the public distribution system (PDS) in India. Source: Ministry of Food,
                    Consumer Affairs and Public Distribution.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Food, Consumer Affairs and Public Distribution, GoI"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${data.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* LATEST YEAR STAT CARDS ///////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total procurement</Text>
                <DataUnit
                    label={`Latest (${stats.procTotalDate})`}
                    value={stats.procTotal}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Lakhs tonnes</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total off-take</Text>
                <DataUnit
                    label={`Latest (${stats.offtTotalDate})`}
                    value={stats.offtTotal}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Lakhs tonnes</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total stocks</Text>
                <DataUnit
                    label={`Latest (${stats.stckTotalDate})`}
                    value={stats.stckTotal}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Lakhs tonnes</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell">
                <PublicDistributionSystemChart
                    data={data.data}
                    title="Public distribution system — procurement, off-take and stocks over time"
                    height={600}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <PublicDistributionSystemGrid
                    data={data.data}
                    units={data.units}
                />
            </Div>
        </Article>
    );
};

export default PublicDistributionSystemPage;
