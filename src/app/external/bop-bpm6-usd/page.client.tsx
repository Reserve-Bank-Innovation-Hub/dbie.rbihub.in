"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import BopBpm6UsdGrid from "@/components/tables/BopBpm6UsdGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { BopBpm6Usd } from "@/lib/api/tables/bop-bpm6-usd";


interface BopBpm6UsdPageProps {
    data : BopBpm6Usd;
}

const BopBpm6UsdPage : React.FC<BopBpm6UsdPageProps> = ({ data }) => {
    // Latest quarter = first in the newest-first list.
    const latestQuarter = data.quarters[0];

    // Current account net for the latest quarter (item code "1").
    const currentAccountNet = useMemo(() => {
        const idx = data.items.findIndex(it => it.code === "1");
        if (idx === -1 || !data.values[idx]?.[0]) return null;
        return data.values[idx][0][2]; // net = index 2
    }, [ data ]);

    const fmtNet = (v : number | null) =>
        v == null ? "—" : `$${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits : 0 })} mn`;

    return (
        <Article id="bop-bpm6-usd-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Balance of payments — BPM6 standard presentation (US$ million)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Quarterly BoP for India per BPM6 methodology; Credit, Debit and Net for each item
                    </Heading6>
                </Div>

                <Text>
                    Standard presentation of India's balance of payments as per the sixth edition of the
                    IMF Balance of Payments and International Investment Position Manual (BPM6). Covers
                    the current account, capital account, financial account (including direct investment,
                    portfolio investment, and reserve assets), and net errors and omissions.
                    Data are provisional / partially revised for recent quarters. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest quarter"
                    value={latestQuarter
                        ? `${latestQuarter.label}${latestQuarter.status ? ` (${latestQuarter.status})` : ""}`
                        : "—"}
                />

                <DataUnit
                    label="Current account net"
                    value={currentAccountNet == null
                        ? "—"
                        : `${currentAccountNet < 0 ? "−" : "+"}${fmtNet(currentAccountNet)}`}
                />

                <DataUnit
                    label="Quarters covered"
                    value={data.quarters.length.toLocaleString()}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <BopBpm6UsdGrid
                    items={data.items}
                    quarters={data.quarters}
                    values={data.values}
                />
            </Div>
        </Article>
    );
};

export default BopBpm6UsdPage;
