"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import CertificatesOfDepositGrid from "@/components/tables/CertificatesOfDepositGrid";
import CertificatesOfDepositChart from "@/components/charts/CertificatesOfDepositChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { CertificatesOfDeposit } from "@/lib/api/tables/certificates-of-deposit";

// STYLES ==============================================================================================================
import "./certificates-of-deposit-page.css";

interface CertificatesOfDepositPageProps {
    cdData : CertificatesOfDeposit;
}

const CertificatesOfDepositPage : React.FC<CertificatesOfDepositPageProps> = ({ cdData }) => {
    // The file is newest-first, so the first row is the latest fortnight.
    const latest = cdData.data[0];

    const stats = useMemo(() => {
        const crores = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} Cr`;
        return {
            latestFortnight    : latest?.fortnightEnded || "—",
            latestOutstanding  : crores(latest?.amountOutstanding ?? null),
            latestIssued       : crores(latest?.amountIssued ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="certificates-of-deposit-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Certificates of deposit
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {cdData.units}
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly data on certificates of deposit (CDs) issued by scheduled commercial banks.
                    Covers amount outstanding, amount issued during the fortnight, and the minimum rate
                    of interest per annum.
                </Text>
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
                    value={`${cdData.data.length.toLocaleString()} fortnights`}
                />
            </Div>

            {/* LATEST STATS /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell cd-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Amount outstanding</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestOutstanding}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Rupees Crores</Text>
            </Div>

            <Div className="grid-cell cd-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Amount issued</Text>
                <DataUnit
                    label={`Latest (${stats.latestFortnight})`}
                    value={stats.latestIssued}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">Rupees Crores (during the fortnight)</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <CertificatesOfDepositChart
                data={cdData.data}
                title="Amount outstanding over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="certificates-of-deposit-grid">
                <CertificatesOfDepositGrid
                    data={cdData.data}
                />
            </Div>
        </Article>
    );
};

export default CertificatesOfDepositPage;
