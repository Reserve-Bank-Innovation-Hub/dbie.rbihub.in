"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import InternationalInvestmentPositionGrid from "@/components/tables/InternationalInvestmentPositionGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { InternationalInvestmentPosition } from "@/lib/api/tables/international-investment-position";


interface InternationalInvestmentPositionPageProps {
    data : InternationalInvestmentPosition;
}

// Format a US$ million value for display in a stat card.
function fmtUsd(value : number | null | undefined) : string {
    if (value == null) return "—";
    const abs = Math.abs(Math.round(value));
    return `US$${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })} mn`;
}

const InternationalInvestmentPositionPage : React.FC<InternationalInvestmentPositionPageProps> = ({ data }) => {
    const { quarters, data: values } = data;

    // Latest quarter is the first entry (newest-first ordering).
    const latestQuarter = quarters[0] ?? "—";

    const stats = useMemo(() => {
        const aVals   = values["A"]   ?? [];
        const bVals   = values["B"]   ?? [];
        const netVals = values["NET"] ?? [];

        const totalAssets      = aVals[0]   ?? null;
        const totalLiabilities = bVals[0]   ?? null;
        const netIip           = netVals[0] ?? null;

        const assetsFmt = fmtUsd(totalAssets);
        const liabFmt   = fmtUsd(totalLiabilities);

        // Net IIP: show negative sign explicitly using a minus character.
        let netFmt = "—";
        if (netIip != null) {
            const abs = Math.abs(Math.round(netIip));
            const sign = netIip < 0 ? "−" : "";
            netFmt = `${sign}US$${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })} mn`;
        }

        return { totalAssets: assetsFmt, totalLiabilities: liabFmt, netIip: netFmt, netIsNegative: (netIip ?? 0) < 0 };
    }, [ values ]);

    return (
        <Article id="international-investment-position-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        International investment position of India
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        External assets and liabilities; US$ millions (BPM6)
                    </Heading6>
                </Div>

                <Text>
                    Quarterly IIP of India compiled in accordance with the IMF Balance of Payments and
                    International Investment Position Manual, sixth edition (BPM6). Covers total external
                    assets (direct investment, portfolio investment, other investment, and reserves) and
                    total external liabilities, with net IIP derived as assets minus liabilities.
                    Data are provisional for the most recent quarters.
                </Text>
            </Div>

            {/* META CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="RBI / IMF BPM6"
                />

                <DataUnit
                    label="Latest quarter"
                    value={latestQuarter}
                />

                <DataUnit
                    label="Total periods"
                    value={`${quarters.length} quarters`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="statAssets" className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total assets</Text>
                <DataUnit
                    label={`Latest (${latestQuarter})`}
                    value={stats.totalAssets}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">External assets, US$ millions</Text>
            </Div>

            <Div id="statLiab" className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Total liabilities</Text>
                <DataUnit
                    label={`Latest (${latestQuarter})`}
                    value={stats.totalLiabilities}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">External liabilities, US$ millions</Text>
            </Div>

            <Div id="statNet" className="grid-cell stat-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Net IIP</Text>
                <DataUnit
                    label={`Latest (${latestQuarter})`}
                    value={
                        <span style={{ color: stats.netIsNegative ? "#d12d1b" : "inherit" }}>
                            {stats.netIip}
                        </span>
                    }
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Assets minus liabilities, US$ millions</Text>
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <InternationalInvestmentPositionGrid data={data} />
            </Div>
        </Article>
    );
};

export default InternationalInvestmentPositionPage;
