"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import RbiStandingFacilitiesGrid from "@/components/tables/RbiStandingFacilitiesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { RbiStandingFacilities } from "@/lib/api/tables/rbi-standing-facilities";



interface RbiStandingFacilitiesPageProps {
    data : RbiStandingFacilities;
}

const RbiStandingFacilitiesPage : React.FC<RbiStandingFacilitiesPageProps> = ({ data }) => {
    // Rows are newest-first; the first row is the latest observation.
    const latest = data.data[0];

    const fmtCr = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    return (
        <Article id="rbi-standing-facilities-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        RBI&apos;s standing facilities
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Fortnightly utilisation of the Reserve Bank&apos;s standing facilities, ₹ crore,
                        from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Fortnightly data on the utilisation of the Reserve Bank of India&apos;s standing
                    facilities: the Marginal Standing Facility (MSF) available to scheduled commercial
                    banks, export credit refinance for scheduled banks (ECR, discontinued since 2015),
                    the liquidity facility extended to primary dealers (PDs), and other facilities.
                    Limits and outstanding amounts are reported separately for each facility.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={latest?.date || "—"}
                />

                <DataUnit
                    label={`MSF (${latest?.date ?? "—"})`}
                    value={fmtCr(latest?.msf ?? null)}
                />

                <DataUnit
                    label={`PD outstanding (${latest?.date ?? "—"})`}
                    value={fmtCr(latest?.pd_outstanding ?? null)}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <RbiStandingFacilitiesGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default RbiStandingFacilitiesPage;
