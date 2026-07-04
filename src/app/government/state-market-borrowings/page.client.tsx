"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading5, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { AnnualGrid, MonthlyGrid } from "@/components/tables/StateMarketBorrowingsGrids";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { StateMarketBorrowings } from "@/lib/api/tables/state-market-borrowings";

// STYLES ==============================================================================================================
import "./state-market-borrowings-page.css";

interface StateMarketBorrowingsPageProps {
    data : StateMarketBorrowings;
}

const StateMarketBorrowingsPage : React.FC<StateMarketBorrowingsPageProps> = ({ data }) => {
    // Most recent annual period is the first column's period.
    const latestAnnualPeriod  = data.annual.columns[0]?.period  ?? "—";
    // Most recent monthly period is the first monthly column's period.
    const latestMonthlyPeriod = data.monthly.columns[0]?.period ?? "—";

    // Total row gross for latest annual period.
    const totalRow      = data.annual.data.find(r => r.state === "Total");
    const grossColIdx   = data.annual.columns.findIndex(c => c.period === latestAnnualPeriod && c.measure === "gross");
    const totalGross    = (totalRow && grossColIdx >= 0) ? totalRow.values[grossColIdx] : null;
    const fmtCrore      = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits : 0 })} cr.`;

    return (
        <Article id="state-market-borrowings-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Market borrowings of state governments
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        State-wise gross and net market borrowings, ₹ crore — monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Annual and monthly data on gross and net market borrowings by individual state
                    governments and union territories. Covers all states from Andhra Pradesh to West Bengal.
                    Net amount equals gross borrowings less repayments. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest annual period"
                    value={latestAnnualPeriod}
                />

                <DataUnit
                    label="Latest monthly period"
                    value={latestMonthlyPeriod}
                />

                <DataUnit
                    label={`Total gross borrowings (${latestAnnualPeriod})`}
                    value={fmtCrore(totalGross)}
                />
            </Div>

            {/* ANNUAL GRID //////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="state-market-borrowings-grid grid-cell">
                <Heading5 weight="600" marginBottom="nano">Annual</Heading5>
                <AnnualGrid columns={data.annual.columns} data={data.annual.data} />
            </Div>

            {/* MONTHLY GRID /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="state-market-borrowings-grid grid-cell">
                <Heading5 weight="600" marginBottom="nano">Monthly</Heading5>
                <MonthlyGrid columns={data.monthly.columns} data={data.monthly.data} />
            </Div>
        </Article>
    );
};

export default StateMarketBorrowingsPage;
