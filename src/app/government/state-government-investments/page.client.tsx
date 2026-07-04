"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import StateGovernmentInvestmentsGrid from "@/components/tables/StateGovernmentInvestmentsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { StateGovernmentInvestments } from "@/lib/api/tables/state-government-investments";

// STYLES ==============================================================================================================
import "./state-government-investments-page.css";

interface StateGovernmentInvestmentsPageProps {
    data : StateGovernmentInvestments;
}

const StateGovernmentInvestmentsPage : React.FC<StateGovernmentInvestmentsPageProps> = ({ data }) => {
    // Latest month is the first month group in columns (newest first).
    const latestMonth = useMemo(() => data.columns[0]?.month ?? "—", [ data.columns ]);

    // Total row (last data row) CSF value for latest month as a headline stat.
    const totalRow    = useMemo(() => data.data.find(r => r.state === "Total"), [ data.data ]);
    const latestCSFIndex = useMemo(
        () => data.columns.findIndex(c => c.month === latestMonth && c.fund.includes("CSF")),
        [ data.columns, latestMonth ],
    );
    const totalCSF = useMemo(
        () => (totalRow && latestCSFIndex >= 0 ? totalRow.values[latestCSFIndex] : null),
        [ totalRow, latestCSFIndex ],
    );

    const fmtCrore = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    return (
        <Article id="state-government-investments-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Investments by state governments
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        State-wise investments in sinking, redemption and stabilisation funds and treasury bills, ₹ crore
                    </Heading6>
                </Div>

                <Text>
                    Monthly investments by state governments and union territories in the Consolidated Sinking
                    Fund (CSF), Guarantee Redemption Fund (GRF), Auction Treasury Bills (ATBs) and Budget
                    Stabilisation Fund (BSF). CSF, GRF and BSF are reserve funds maintained with the RBI.
                    Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestMonth}
                />

                <DataUnit
                    label={`Total CSF (${latestMonth})`}
                    value={fmtCrore(totalCSF)}
                />

                <DataUnit
                    label="States / UTs"
                    value={String(data.data.filter(r => r.state !== "Total").length)}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="state-government-investments-grid grid-cell">
                <StateGovernmentInvestmentsGrid
                    columns={data.columns}
                    data={data.data}
                    unit={data.unit}
                    notes={data.notes}
                />
            </Div>
        </Article>
    );
};

export default StateGovernmentInvestmentsPage;
