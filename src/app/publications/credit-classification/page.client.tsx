"use client";

// REACT CORE ==========================================================================================================
import React, { useState, useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import CreditClassificationGrid from "@/components/tables/CreditClassificationGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedCreditClassification } from "@/lib/api/publications";


interface CreditClassificationPageProps {
    creditData : ParsedCreditClassification;
}

const CreditClassificationPage : React.FC<CreditClassificationPageProps> = ({creditData}) => {
    // Get stats for display
    const stats = useMemo(() => {
        const periods = [ ...new Set(creditData.data.map(row => row.period)) ].filter(p => p !== "");
        return {
            totalRows    : creditData.data.length,
            periodsCount : periods.length,
            latestPeriod : periods.sort().reverse()[0] || "N/A",
        };
    }, [ creditData.data ]);

    return (
        <Article id="credit-classification-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Organisation-wise classification of outstanding credit of scheduled commercial banks according to
                    occupation
                </Heading4>
            </Div>

            <Div
                id="meta-card"
                className="grid-cell" padding="micro"
            >
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Total records"
                    value={stats.totalRows.toLocaleString()}
                />

                <DataUnit
                    label="Latest data"
                    value={stats.latestPeriod}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <CreditClassificationGrid
                    data={creditData.data}
                    organizations={creditData.organizations}
                />
            </Div>
        </Article>
    );
};

export default CreditClassificationPage;
