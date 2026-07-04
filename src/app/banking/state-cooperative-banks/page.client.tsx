"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import StateCooperativeBanksGrid from "@/components/tables/StateCooperativeBanksGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { StateCooperativeBanks } from "@/lib/api/tables/state-cooperative-banks";



interface StateCooperativeBanksPageProps {
    data : StateCooperativeBanks;
}

const StateCooperativeBanksPage : React.FC<StateCooperativeBanksPageProps> = ({ data }) => {
    // Stats derived from the latest period.
    const stats = useMemo(() => {
        const latest = data.periods[0];
        if (!latest) return { date: "—", numBanks: "—", aggDeposits: "—", bankCredit: "—" };

        const fmt = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

        // columns[0] = "1 Aggregate Deposits", columns[21] = "9 Bank Credit (10.1+11)"
        return {
            date        : latest.date,
            numBanks    : latest.numBanks?.toLocaleString("en-IN") ?? "—",
            aggDeposits : fmt(latest.values[0] ?? null),
            bankCredit  : fmt(latest.values[21] ?? null),
        };
    }, [ data.periods ]);

    return (
        <Article id="state-cooperative-banks-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        State co-operative banks maintaining accounts with the Reserve Bank of India
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Fortnightly balance-sheet data; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly aggregates of deposits, demand and time liabilities, borrowings, cash balances,
                    investments in government securities, and bank credit for state co-operative banks that
                    maintain accounts with the Reserve Bank of India. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={stats.date}
                />

                <DataUnit
                    label={`Reporting banks (${stats.date})`}
                    value={stats.numBanks}
                />

                <DataUnit
                    label={`Aggregate deposits (${stats.date})`}
                    value={stats.aggDeposits}
                />

                <DataUnit
                    label={`Bank credit (${stats.date})`}
                    value={stats.bankCredit}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <StateCooperativeBanksGrid
                    columns={data.columns}
                    periods={data.periods}
                    unit={data.unit}
                />
            </Div>
        </Article>
    );
};

export default StateCooperativeBanksPage;
