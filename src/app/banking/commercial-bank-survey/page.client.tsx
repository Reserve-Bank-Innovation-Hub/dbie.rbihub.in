"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import CommercialBankSurveyGrid from "@/components/tables/CommercialBankSurveyGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { CommercialBankSurvey } from "@/lib/api/tables/commercial-bank-survey";



interface CommercialBankSurveyPageProps {
    surveyData : CommercialBankSurvey;
}

const CommercialBankSurveyPage : React.FC<CommercialBankSurveyPageProps> = ({ surveyData }) => {
    const latest = surveyData.data[0];

    const stats = useMemo(() => {
        const crores = (v : number | null | string) =>
            (typeof v === "number" && v != null)
                ? `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—";

        return {
            latestFortnight    : latest?.fortnight ?? "—",
            aggregateDeposits  : crores(latest?.ci ?? null),
            domesticCredit     : crores(latest?.si ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="commercial-bank-survey-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Commercial bank survey
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Fortnightly survey of commercial banks — {surveyData.units.toLowerCase()}
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest fortnight"
                    value={stats.latestFortnight}
                />

                <DataUnit
                    label="Total records"
                    value={`${surveyData.data.length.toLocaleString()} fortnights`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-cell" padding="micro">
                <DataUnit
                    label={`Aggregate deposits of residents (${stats.latestFortnight})`}
                    value={stats.aggregateDeposits}
                    size="large"
                    align="right"
                />
                <Div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "auto" }}>
                    C.I — {surveyData.units.toLowerCase()}
                </Div>
            </Div>

            <Div className="grid-cell stat-cell" padding="micro">
                <DataUnit
                    label={`Domestic credit (${stats.latestFortnight})`}
                    value={stats.domesticCredit}
                    size="large"
                    align="right"
                />
                <Div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "auto" }}>
                    S.I — {surveyData.units.toLowerCase()}
                </Div>
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <CommercialBankSurveyGrid
                    data={surveyData.data}
                    columns={surveyData.columns}
                />
            </Div>
        </Article>
    );
};

export default CommercialBankSurveyPage;
