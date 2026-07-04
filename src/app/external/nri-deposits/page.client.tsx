"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import NriDepositsGrid from "@/components/tables/NriDepositsGrid";
import NriDepositsChart from "@/components/charts/NriDepositsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { NriDeposits } from "@/lib/api/tables/nri-deposits";


interface NriDepositsPageProps {
    depositsData : NriDeposits;
}

// Format a "YYYY-MM" key as "Mon YYYY".
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatMonth(key : string) : string {
    const m = key.match(/^(\d{4})-(\d{2})$/);
    if (!m) return key;
    const mon = MONTH_LABELS[Number(m[2]) - 1] ?? m[2];
    return `${mon} ${m[1]}`;
}

const NriDepositsPage : React.FC<NriDepositsPageProps> = ({ depositsData }) => {
    const latest = depositsData.data[0];

    const stats = useMemo(() => {
        const usd = (v : number | null) =>
            v == null ? "—" : `US$ ${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} mn`;
        return {
            latestMonth      : formatMonth(latest?.month ?? ""),
            outstandingTotal : usd(latest?.outstanding_total ?? null),
            fcnrb            : usd(latest?.outstanding_fcnrb ?? null),
            nrera            : usd(latest?.outstanding_nrera ?? null),
        };
    }, [latest]);

    return (
        <Article id="nri-deposits-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        NRI deposits — outstandings and inflows/outflows
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        FCNR(B), NR(E)RA and NRO schemes; {depositsData.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly outstanding balances and net inflows/outflows for non-resident Indian deposit
                    schemes: Foreign Currency Non-Resident (Banks) (FCNR(B)), Non-Resident (External) Rupee
                    Accounts (NR(E)RA) and Non-Resident Ordinary (NRO) accounts. FCNR(B) was introduced in May
                    1993. Source: Reserve Bank of India.
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
                    value={`${depositsData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* LATEST STATS /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total NRI outstanding</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.outstandingTotal}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">FCNR(B) outstanding</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.fcnrb}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">NR(E)RA outstanding</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.nrera}
                    size="large"
                    align="right"
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <NriDepositsChart
                    data={depositsData.data}
                    unit={depositsData.unit}
                    title="NRI deposits — outstanding balances by scheme"
                    height={500}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <NriDepositsGrid
                    data={depositsData.data}
                    unit={depositsData.unit}
                />
            </Div>
        </Article>
    );
};

export default NriDepositsPage;
