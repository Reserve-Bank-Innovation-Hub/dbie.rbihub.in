"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import NewCapitalIssuesGrid from "@/components/tables/NewCapitalIssuesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { NewCapitalIssues } from "@/lib/api/tables/new-capital-issues";

// STYLES ==============================================================================================================

interface NewCapitalIssuesPageProps {
    data : NewCapitalIssues;
}

const NewCapitalIssuesPage : React.FC<NewCapitalIssuesPageProps> = ({ data }) => {
    // The first row is the earliest month of the most recent FY; find the latest by year.
    const latestRow = useMemo(() => {
        // Rows come in source order (Apr → latest month within each FY, then prior FY).
        // The most recent period is the last row in the current FY block.
        const currentFy = data.rows[0]?.year ?? "";
        const fyRows = data.rows.filter(r => r.year === currentFy || r.year === "");
        return fyRows[fyRows.length - 1] ?? data.rows[0];
    }, [ data.rows ]);

    const stats = useMemo(() => {
        if (!latestRow) return { period: "—", equityAmount: "—", totalIssues: "—" };
        // Column layout: index 1 = equity amount, index 8 = total no. of issues, index 9 = total amount
        const equityAmt  = latestRow.values[1];
        const totalIssues = latestRow.values[8];
        const fmt = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;
        return {
            period       : `${latestRow.year} ${latestRow.month}`,
            equityAmount : fmt(equityAmt),
            totalIssues  : totalIssues == null ? "—" : totalIssues.toLocaleString("en-IN"),
        };
    }, [ latestRow ]);

    return (
        <Article id="new-capital-issues-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        New capital issues by non-government public limited companies
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Equity shares and bonds/debentures; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on new capital raised by non-government public limited companies through
                    equity shares (public and rights issues) and public issues of bonds/debentures.
                    Data are provisional for the current financial year. Source: Securities and Exchange Board of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="SEBI / Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.period}
                />

                <DataUnit
                    label={`Total issues (${stats.period})`}
                    value={stats.totalIssues}
                />

                <DataUnit
                    label={`Equity amount (${stats.period})`}
                    value={stats.equityAmount}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <NewCapitalIssuesGrid
                    columns={data.columns}
                    rows={data.rows}
                    unit={data.unit}
                />
            </Div>
        </Article>
    );
};

export default NewCapitalIssuesPage;
