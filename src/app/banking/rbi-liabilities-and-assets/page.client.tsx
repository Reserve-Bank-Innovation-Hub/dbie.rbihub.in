"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import RbiLiabilitiesAndAssetsGrid from "@/components/tables/RbiLiabilitiesAndAssetsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { RbiLiabilitiesAndAssets } from "@/lib/api/tables/rbi-liabilities-and-assets";

// STYLES ==============================================================================================================
import "./rbi-liabilities-and-assets-page.css";

interface RbiLiabilitiesAndAssetsPageProps {
    data : RbiLiabilitiesAndAssets;
}

const RbiLiabilitiesAndAssetsPage : React.FC<RbiLiabilitiesAndAssetsPageProps> = ({ data }) => {
    const latestRow = data.data[0];

    const fmt = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits : 0 })} cr.`;

    const latestStats = useMemo(() => {
        if (!latestRow) return { period : "—", notesInCirculation : "—", bankingDeptTotal : "—" };
        return {
            period              : latestRow.week,
            notesInCirculation  : fmt(latestRow.notes_in_circulation),
            bankingDeptTotal    : fmt(latestRow.banking_dept_total),
        };
    }, [ latestRow ]);

    return (
        <Article id="rbi-liabilities-and-assets-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Reserve Bank of India — liabilities and assets
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Weekly balance sheet; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Weekly balance sheet of the Reserve Bank of India covering the issue department (notes in
                    circulation, gold, foreign securities) and the banking department (deposits from the central
                    and state governments, scheduled commercial banks, and other entities; loans and advances;
                    investments; and other assets). Source: Reserve Bank of India Monthly Bulletin, Table 2.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest week"
                    value={latestStats.period}
                />

                <DataUnit
                    label="Total weeks"
                    value={`${data.data.length.toLocaleString("en-IN")} weeks`}
                />

                <DataUnit
                    label={`Notes in circulation (${latestStats.period})`}
                    value={latestStats.notesInCirculation}
                />

                <DataUnit
                    label={`Banking dept total (${latestStats.period})`}
                    value={latestStats.bankingDeptTotal}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="rbi-liabilities-and-assets-grid grid-cell">
                <RbiLiabilitiesAndAssetsGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default RbiLiabilitiesAndAssetsPage;
