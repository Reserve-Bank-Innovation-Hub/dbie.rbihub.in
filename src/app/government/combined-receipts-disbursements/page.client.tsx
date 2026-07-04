"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import CombinedReceiptsDisbursementsGrid from "@/components/tables/CombinedReceiptsDisbursementsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { CombinedReceiptsDisbursements } from "@/lib/api/tables/combined-receipts-disbursements";

// STYLES ==============================================================================================================
import "./combined-receipts-disbursements-page.css";

interface CombinedReceiptsDisbursementsPageProps {
    data : CombinedReceiptsDisbursements;
}

const CombinedReceiptsDisbursementsPage : React.FC<CombinedReceiptsDisbursementsPageProps> = ({ data }) => {
    // First year (newest) is used for the headline stat.
    const latestYear = data.years[0] ?? "—";

    // Look up the latest total disbursements and total receipts for the meta card.
    const totalDisbRow = data.data.find(r => r.item === "1 Total Disbursements");
    const totalRcptRow = data.data.find(r => r.item === "2 Total Receipts");
    const gfdRow       = data.data.find(r => r.item?.startsWith("3 Gross Fiscal Deficit"));

    const fmtCrore = (v : number | null | undefined) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    const latest = (row : typeof totalDisbRow) => row?.values?.[0] ?? null;

    return (
        <Article id="combined-receipts-disbursements-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Combined receipts and disbursements of the Central and State Governments
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Consolidated fiscal position of central and state governments by year, ₹ crore — monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Annual combined receipts and disbursements of the Central and State Governments, showing
                    developmental and non-developmental expenditure, revenue and capital receipts, gross fiscal
                    deficit and financing sources. Amounts in {data.unit.toLowerCase()}.
                    Source: Budget Documents of Central and State Governments.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Budget Documents / Reserve Bank of India"
                />

                <DataUnit
                    label="Latest year"
                    value={latestYear}
                />

                <DataUnit
                    label={`Total disbursements (${latestYear})`}
                    value={fmtCrore(latest(totalDisbRow))}
                />

                <DataUnit
                    label={`Total receipts (${latestYear})`}
                    value={fmtCrore(latest(totalRcptRow))}
                />

                <DataUnit
                    label={`Gross fiscal deficit (${latestYear})`}
                    value={fmtCrore(latest(gfdRow))}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="combined-receipts-disbursements-grid grid-cell">
                <CombinedReceiptsDisbursementsGrid
                    years={data.years}
                    data={data.data}
                />
            </Div>
        </Article>
    );
};

export default CombinedReceiptsDisbursementsPage;
