"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import BusinessOfScheduledBanksGrid from "@/components/tables/BusinessOfScheduledBanksGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { BusinessOfScheduledBanks } from "@/lib/api/tables/business-of-scheduled-banks";



interface BusinessOfScheduledBanksPageProps {
    data : BusinessOfScheduledBanks;
}

const BusinessOfScheduledBanksPage : React.FC<BusinessOfScheduledBanksPageProps> = ({ data }) => {
    // Active sheet selection (default: first sheet = all scheduled banks).
    const [ activeSheetIdx, setActiveSheetIdx ] = useState(0);
    const activeSheet = data.sheets[activeSheetIdx];

    // Stats derived from the latest period of the active sheet.
    const stats = useMemo(() => {
        const latest = activeSheet?.periods[0];
        if (!latest) return { date: "—", numBanks: "—", bankCredit: "—", aggDeposits: "—" };

        const fmt = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

        // items[6] = "2.1 Aggregate Deposits", items[26] = "7 Bank Credit"
        // (indices within the items array; all sheets share the same structure)
        return {
            date        : latest.date,
            numBanks    : latest.numBanks?.toLocaleString("en-IN") ?? "—",
            aggDeposits : fmt(latest.values[6] ?? null),
            bankCredit  : fmt(latest.values[26] ?? null),
        };
    }, [ activeSheet ]);

    return (
        <Article id="business-of-scheduled-banks-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Business in India — scheduled banks
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Fortnightly balance-sheet aggregates; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly liabilities and assets of banks in India: deposits, borrowings, investments,
                    bank credit, and balances with the Reserve Bank. Covers all scheduled banks and all
                    scheduled commercial banks separately. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={stats.date}
                />

                <DataUnit
                    label={`Reporting banks (${stats.date})`}
                    value={stats.numBanks}
                />

                <DataUnit
                    label={`Aggregate deposits (${stats.date})`}
                    value={stats.aggDeposits}
                />

                <DataUnit
                    label={`Bank credit (${stats.date})`}
                    value={stats.bankCredit}
                />
            </Div>

            {/* SHEET SELECTOR ///////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="sheet-selector" className="controls-cell grid-cell" padding="micro">
                {data.sheets.map((sheet, i) => (
                    <button
                        key={sheet.sheetName}
                        className={`sheet-tab${i === activeSheetIdx ? " sheet-tab--active" : ""}`}
                        onClick={() => setActiveSheetIdx(i)}
                    >
                        {sheet.sheetName}
                    </button>
                ))}
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <BusinessOfScheduledBanksGrid
                    items={activeSheet.items}
                    periods={activeSheet.periods}
                    unit={data.unit}
                />
            </Div>
        </Article>
    );
};

export default BusinessOfScheduledBanksPage;
