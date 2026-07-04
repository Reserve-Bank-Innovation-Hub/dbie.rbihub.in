"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import TreasuryBillAuctionsGrid from "@/components/tables/TreasuryBillAuctionsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { TreasuryBillAuctions } from "@/lib/api/tables/treasury-bill-auctions";


interface TreasuryBillAuctionsPageProps {
    data : TreasuryBillAuctions;
}

const TreasuryBillAuctionsPageClient : React.FC<TreasuryBillAuctionsPageProps> = ({ data }) => {
    // Derive summary stats from the most recent auction row (first item, newest-first).
    const latestRow = data.data[0] ?? null;

    const stats = useMemo(() => {
        if (!latestRow) {
            return { date: "—", tenor: "—", cutoffPrice: "—", implicitYield: "—", totalIssue: "—" };
        }
        const fmt4 = (v : number | null) => v == null ? "—" : Number(v).toFixed(4);
        const fmtAmt = (v : number | null) =>
            v == null ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })} cr`;
        return {
            date          : latestRow.auction_date,
            tenor         : latestRow.tenor,
            cutoffPrice   : fmt4(latestRow.cutoff_price),
            implicitYield : latestRow.implicit_yield == null ? "—" : `${fmt4(latestRow.implicit_yield)}%`,
            totalIssue    : fmtAmt(latestRow.total_issue),
        };
    }, [ latestRow ]);

    return (
        <Article id="treasury-bill-auctions-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Auctions of Government of India treasury bills
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Auction-wise results for 91, 182 and 364-day bills; amounts in ₹ crore
                    </Heading6>
                </Div>

                <Text>
                    Per-auction data on Government of India treasury bill issuances — notified amounts,
                    bids received and accepted (competitive and non-competitive), cut-off prices,
                    implicit yields at cut-off, and weighted average prices.
                    Source: Reserve Bank of India Monthly Bulletin.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest auction"
                    value={`${stats.date} (${stats.tenor})`}
                />

                <DataUnit
                    label={`Total issue (${stats.date})`}
                    value={stats.totalIssue}
                />

                <DataUnit
                    label={`Implicit yield (${stats.date})`}
                    value={stats.implicitYield}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <TreasuryBillAuctionsGrid
                    data={data.data}
                    notes={data.notes}
                />
            </Div>
        </Article>
    );
};

export default TreasuryBillAuctionsPageClient;
