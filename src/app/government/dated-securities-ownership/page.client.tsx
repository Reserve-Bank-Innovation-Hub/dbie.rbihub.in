"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading5, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import DatedSecuritiesOwnershipGrid from "@/components/tables/DatedSecuritiesOwnershipGrids";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { DatedSecuritiesOwnership } from "@/lib/api/tables/dated-securities-ownership";


interface DatedSecuritiesOwnershipPageProps {
    data : DatedSecuritiesOwnership;
}

const DatedSecuritiesOwnershipPage : React.FC<DatedSecuritiesOwnershipPageProps> = ({ data }) => {
    // Stats derived from the latest (first) row of the GoI dated-securities section.
    const goiSection = data.sections.find(s => s.key === "goi_dated");
    const latestRow  = goiSection?.data[0];

    const stats = useMemo(() => {
        if (!latestRow) return { period: "—", total: "—", commercialBanks: "—", insurance: "—" };
        const total        = latestRow.values[0];
        const commBanks    = latestRow.values[1];  // "1 Commercial Banks"
        const insurance    = latestRow.values[4];  // "4 Insurance Companies"
        const fmtCr  = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;
        const fmtPct = (v : number | null) => v == null ? "—" : `${v.toFixed(2)}%`;
        return {
            period         : latestRow.period,
            total          : fmtCr(total),
            commercialBanks : fmtPct(commBanks),
            insurance      : fmtPct(insurance),
        };
    }, [ latestRow ]);

    return (
        <Article id="dated-securities-ownership-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Ownership pattern of government of India dated securities
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Quarterly ownership shares of central and state government securities and treasury bills,
                        per cent (totals in ₹ crore), from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Quarterly data on the ownership pattern of Government of India dated securities, state government
                    securities, and treasury bills by holder category — commercial banks, insurance companies,
                    provident and pension funds, mutual funds, foreign portfolio investors, RBI, and others.
                    Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest quarter"
                    value={stats.period}
                />

                <DataUnit
                    label={`GoI dated securities total (${stats.period})`}
                    value={stats.total}
                />

                <DataUnit
                    label={`Commercial banks share (${stats.period})`}
                    value={stats.commercialBanks}
                />

                <DataUnit
                    label={`Insurance companies share (${stats.period})`}
                    value={stats.insurance}
                />
            </Div>

            {/* SECTION 1: GOI DATED SECURITIES /////////////////////////////////////////////////////////////////////// */}
            {data.sections.map(section => (
                <React.Fragment key={section.key}>
                    <Div className="section-header grid-cell" padding="micro">
                        <Heading5 weight="600">
                            {section.title}
                        </Heading5>
                    </Div>

                    <Div className="table-cell grid-cell">
                        <DatedSecuritiesOwnershipGrid section={section} />
                    </Div>
                </React.Fragment>
            ))}
        </Article>
    );
};

export default DatedSecuritiesOwnershipPage;
