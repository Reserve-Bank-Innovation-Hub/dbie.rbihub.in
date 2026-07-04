"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import UnionGovernmentAccountsGrid from "@/components/tables/UnionGovernmentAccountsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { UnionGovernmentAccounts } from "@/lib/api/tables/union-government-accounts";


interface UnionGovernmentAccountsPageProps {
    data : UnionGovernmentAccounts;
}

const UnionGovernmentAccountsPage : React.FC<UnionGovernmentAccountsPageProps> = ({ data }) => {
    // The first row is the latest month (newest-first ordering).
    const latestRow = data.data[0];

    const fmtCrore = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    return (
        <Article id="union-government-accounts-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Union Government accounts at a glance
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Monthly cumulative figures within the fiscal year, ₹ crore — monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Monthly cumulative fiscal-year data on Union Government receipts (revenue and capital),
                    expenditure (revenue and capital), and key deficit indicators — revenue deficit, fiscal
                    deficit, and gross primary deficit. Budget Estimates and Revised Estimates are shown
                    alongside actuals where available. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestRow?.month ?? "—"}
                />

                <DataUnit
                    label={`Fiscal deficit (${latestRow?.month ?? "—"})`}
                    value={fmtCrore(latestRow?.fd_actual ?? null)}
                />

                <DataUnit
                    label={`Revenue receipts (${latestRow?.month ?? "—"})`}
                    value={fmtCrore(latestRow?.rr_actual ?? null)}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <UnionGovernmentAccountsGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default UnionGovernmentAccountsPage;
