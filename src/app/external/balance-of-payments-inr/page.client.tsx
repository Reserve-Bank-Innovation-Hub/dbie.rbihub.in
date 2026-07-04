"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import BalanceOfPaymentsGrid from "@/components/tables/BalanceOfPaymentsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { BalanceOfPaymentsInr } from "@/lib/api/tables/balance-of-payments-inr";


interface BalanceOfPaymentsInrPageProps {
    data : BalanceOfPaymentsInr;
}

const BalanceOfPaymentsInrPage : React.FC<BalanceOfPaymentsInrPageProps> = ({ data }) => {
    const latestPeriod = data.periods[0] ?? "—";

    // Current account net (item code "1") for the latest quarter.
    const currentAccountNet = useMemo(() => {
        const idx = data.items.findIndex((it) => it.code === "1");
        if (idx === -1) return null;
        const entry = data.data.find((e) => e.period === latestPeriod && e.type === "Net");
        return entry ? entry.values[idx] : null;
    }, [ data, latestPeriod ]);

    const fmtNet = (v : number | null) => {
        if (v == null) return "—";
        const abs = Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits : 0 });
        return `${v < 0 ? "−" : "+"}₹${abs} cr.`;
    };

    return (
        <Article id="balance-of-payments-inr-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Balance of payments — overall presentation (₹ crore)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Quarterly BoP for India (overall presentation); Credit, Debit and Net for each component
                    </Heading6>
                </Div>

                <Text>
                    India's overall balance of payments covering the current account (merchandise and
                    invisibles including services, transfers and income), the capital account (foreign
                    investment, loans, banking capital), errors and omissions, and monetary movements.
                    Rupee equivalent of Table 40 (US$); data from 1990-91 onwards.
                    Source: Reserve Bank of India Bulletin Table 41.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India (Table 41)"
                />

                <DataUnit
                    label="Latest quarter"
                    value={latestPeriod}
                />

                <DataUnit
                    label={`Current account net (${latestPeriod})`}
                    value={fmtNet(currentAccountNet)}
                />

                <DataUnit
                    label="Quarters covered"
                    value={data.periods.length.toLocaleString()}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <BalanceOfPaymentsGrid
                    items={data.items}
                    data={data.data}
                    periods={data.periods}
                    unit={data.unit}
                />
            </Div>
        </Article>
    );
};

export default BalanceOfPaymentsInrPage;
