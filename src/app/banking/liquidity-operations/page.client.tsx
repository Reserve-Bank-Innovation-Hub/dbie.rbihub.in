"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import LiquidityOperationsGrid from "@/components/tables/LiquidityOperationsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { LiquidityOperations } from "@/lib/api/tables/liquidity-operations";



interface LiquidityOperationsPageProps {
    data : LiquidityOperations;
}

const LiquidityOperationsPage : React.FC<LiquidityOperationsPageProps> = ({ data }) => {
    // Data is newest-first, so the first row is the latest observation.
    const latestDate = data.data[0]?.date ?? "—";

    return (
        <Article id="liquidity-operations-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Liquidity operations by RBI
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Daily central bank liquidity injection and absorption operations, ₹ crore,
                        from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Daily liquidity operations conducted by the Reserve Bank of India covering the
                    Liquidity Adjustment Facility (repo, reverse repo, variable rate repo and reverse
                    repo, MSF, SDF), open market operations (OMO sale and purchase), the Market
                    Stabilisation Scheme (MSS), and targeted and special lending facilities (LTRO,
                    TLTRO, SLTRO for small finance banks, special reverse repo, SLF for mutual funds,
                    and the special liquidity scheme for NBFCs/HFCs).
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest date"
                    value={latestDate}
                />

                <DataUnit
                    label="Total observations"
                    value={`${data.data.length.toLocaleString("en-IN")} days`}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <LiquidityOperationsGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default LiquidityOperationsPage;
