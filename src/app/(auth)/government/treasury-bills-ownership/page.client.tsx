"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import TreasuryBillsOwnershipGrid from "@/components/tables/TreasuryBillsOwnershipGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { TreasuryBillsOwnership } from "@/lib/api/tables/treasury-bills-ownership";

// STYLES ==============================================================================================================
import "./treasury-bills-ownership-page.css";

interface TreasuryBillsOwnershipPageProps {
    data : TreasuryBillsOwnership;
}

const TreasuryBillsOwnershipPage : React.FC<TreasuryBillsOwnershipPageProps> = ({ data }) => {
    // Latest row is the first row (newest-first ordering).
    const latestRow = data.data[0];

    const stats = useMemo(() => {
        if (!latestRow) return { week: "—", t91Total: "—", t182Total: "—", t364Total: "—" };
        const fmt = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;
        return {
            week      : latestRow.week,
            t91Total  : fmt(latestRow.t91_total),
            t182Total : fmt(latestRow.t182_total),
            t364Total : fmt(latestRow.t364_total),
        };
    }, [ latestRow ]);

    return (
        <Article id="treasury-bills-ownership-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Government of India: treasury bills outstanding
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Weekly outstanding amounts by holder category, ₹ crore, from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Weekly data on Government of India treasury bills outstanding, broken down by holder category
                    (banks, primary dealers, state governments, others) across five tenors: 91-day, 182-day, 364-day,
                    14-day intermediate, and cash management bills. Source: Reserve Bank of India Bulletin.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest week"
                    value={stats.week}
                />

                <DataUnit
                    label={`91-day total (${stats.week})`}
                    value={stats.t91Total}
                />

                <DataUnit
                    label={`182-day total (${stats.week})`}
                    value={stats.t182Total}
                />

                <DataUnit
                    label={`364-day total (${stats.week})`}
                    value={stats.t364Total}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="treasury-bills-ownership-grid grid-cell">
                <TreasuryBillsOwnershipGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default TreasuryBillsOwnershipPage;
