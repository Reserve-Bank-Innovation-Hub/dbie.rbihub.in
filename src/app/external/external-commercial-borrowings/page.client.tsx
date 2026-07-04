"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ExternalCommercialBorrowingsGrid from "@/components/tables/ExternalCommercialBorrowingsGrid";
import ExternalCommercialBorrowingsChart from "@/components/charts/ExternalCommercialBorrowingsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ExternalCommercialBorrowings } from "@/lib/api/tables/external-commercial-borrowings";

// STYLES ==============================================================================================================
import "./external-commercial-borrowings-page.css";

interface ExternalCommercialBorrowingsPageProps {
    ecbData : ExternalCommercialBorrowings;
}

const ExternalCommercialBorrowingsPage : React.FC<ExternalCommercialBorrowingsPageProps> = ({ ecbData }) => {
    // Rows come oldest-first; latest row is the last entry.
    const latest = ecbData.rows[ecbData.rows.length - 1];

    // FYs covered (unique, in order).
    const fyList = useMemo(() => [ ...new Set(ecbData.rows.map(r => r.fy)) ], [ ecbData.rows ]);

    const stats = useMemo(() => {
        if (!latest) return { period : "—", totalAmount : "—", totalNo : "—", maturity : "—" };
        // values: [4]=total no., [5]=total amount, [6]=weighted avg maturity
        const totalNo  = latest.values[4];
        const totalAmt = latest.values[5];
        const maturity = latest.values[6];
        return {
            period      : `${latest.fy}  ${latest.month}`,
            totalAmount : totalAmt == null ? "—" : `US$ ${totalAmt.toLocaleString("en-IN")}M`,
            totalNo     : totalNo  == null ? "—" : totalNo.toLocaleString("en-IN"),
            maturity    : maturity == null ? "—" : `${maturity} years`,
        };
    }, [ latest ]);

    return (
        <Article id="external-commercial-borrowings-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        External commercial borrowings — monthly registrations
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Automatic and approval routes; amounts in {ecbData.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly ECB registrations by Indian entities under the automatic and approval routes.
                    Covers the number and amount of registrations, weighted average maturity, interest rate
                    indicators, and a borrower-category breakdown across corporates, banks, NBFCs, and others.
                    Data available from 2019–20.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={stats.period}
                />

                <DataUnit
                    label="FYs covered"
                    value={`${fyList[0]} – ${fyList[fyList.length - 1]}`}
                />
            </Div>

            {/* LATEST STATS //////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell ecb-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Total registrations</Text>
                <DataUnit
                    label={`Latest (${stats.period})`}
                    value={stats.totalNo}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">number of registrations</Text>
            </Div>

            <Div className="grid-cell ecb-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Total amount registered</Text>
                <DataUnit
                    label={`Latest (${stats.period})`}
                    value={stats.totalAmount}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{ecbData.unit}</Text>
            </Div>

            <Div className="grid-cell ecb-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Weighted average maturity</Text>
                <DataUnit
                    label={`Latest (${stats.period})`}
                    value={stats.maturity}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">years</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <ExternalCommercialBorrowingsChart
                rows={ecbData.rows}
                unit={ecbData.unit}
                title="ECB registrations — amount and number of registrations"
                height={520}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="external-commercial-borrowings-grid grid-cell">
                <ExternalCommercialBorrowingsGrid
                    columns={ecbData.columns}
                    rows={ecbData.rows}
                    unit={ecbData.unit}
                />
            </Div>
        </Article>
    );
};

export default ExternalCommercialBorrowingsPage;
