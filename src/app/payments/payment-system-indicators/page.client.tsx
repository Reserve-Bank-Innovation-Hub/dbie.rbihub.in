"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import PaymentSystemIndicatorsGrid from "@/components/tables/PaymentSystemIndicatorsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { PaymentSystemIndicators } from "@/lib/api/tables/payment-system-indicators";


interface PaymentSystemIndicatorsPageProps {
    data : PaymentSystemIndicators;
}

const PaymentSystemIndicatorsPage : React.FC<PaymentSystemIndicatorsPageProps> = ({ data }) => {
    // Derive summary stats from the most recent (first) data row.
    const latestRow = data.data[0];

    const stats = useMemo(() => {
        if (!latestRow) return { period: "—", upiVol: "—", totalDigitalVol: "—" };

        // UPI volume column — group "2.7 UPI @", measure "Volume (lakh)"
        const upiColIdx = data.columns.findIndex(
            (c) => c.group.includes("UPI") && c.measure === "Volume (lakh)",
        );
        // Total digital payments volume — group contains "Total Digital Payments", measure Volume
        const totalDigColIdx = data.columns.findIndex(
            (c) => c.group.includes("Total Digital Payments") && c.measure === "Volume (lakh)",
        );

        const fmt = (v : number | null) =>
            v == null ? "—" : `${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;

        return {
            period          : latestRow.month,
            upiVol          : upiColIdx >= 0 ? fmt(latestRow.values[upiColIdx]) : "—",
            totalDigitalVol : totalDigColIdx >= 0 ? fmt(latestRow.values[totalDigColIdx]) : "—",
        };
    }, [latestRow, data.columns]);

    return (
        <Article id="payment-system-indicators-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Payment system indicators
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Monthly volumes (lakh) and values (₹ crore) across settlement and payment systems
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on volumes and values processed across settlement and payment systems
                    in India, including CCIL-operated systems, RTGS, UPI, NEFT, IMPS, card payments,
                    prepaid payment instruments, ATMs and payment infrastructure. Source: Reserve Bank of India.
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
                    label={`UPI volume (${stats.period})`}
                    value={stats.upiVol}
                />

                <DataUnit
                    label={`Total digital payments (${stats.period})`}
                    value={stats.totalDigitalVol}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <PaymentSystemIndicatorsGrid
                    columns={data.columns}
                    data={data.data}
                />
            </Div>

            {/* NOTES ////////////////////////////////////////////////////////////////////////////////////////////// */}
            {data.notes.length > 0 && (
                <Div className="notes-cell grid-cell" padding="micro">
                    {data.notes.map((note, idx) => (
                        <Text key={idx} className="table-note">
                            {note}
                        </Text>
                    ))}
                </Div>
            )}
        </Article>
    );
};

export default PaymentSystemIndicatorsPage;
