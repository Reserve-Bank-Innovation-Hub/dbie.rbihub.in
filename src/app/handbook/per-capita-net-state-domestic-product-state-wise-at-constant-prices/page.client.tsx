"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import PerCapitaNsdpConstantPricesGrid from "@/components/tables/PerCapitaNsdpConstantPricesGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { PerCapitaNsdpConstantPrices } from "@/lib/api/tables/per-capita-net-state-domestic-product-state-wise-at-constant-prices";

// STYLES ==============================================================================================================

interface PerCapitaNsdpConstantPricesPageProps {
    nsdpData : PerCapitaNsdpConstantPrices;
}

const PerCapitaNsdpConstantPricesPage : React.FC<PerCapitaNsdpConstantPricesPageProps> = ({ nsdpData }) => {
    const latestYear = nsdpData.years[0];
    const oldestYear = nsdpData.years[nsdpData.years.length - 1];

    return (
        <Article id="per-capita-nsdp-constant-prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Per capita Net State Domestic Product — state-wise (at constant prices)
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Base year {nsdpData.baseYear} · {nsdpData.unit}
                    </Heading6>
                </Div>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office"
                />

                <DataUnit
                    label="Latest year"
                    value={latestYear}
                />

                <DataUnit
                    label="States / UTs"
                    value={String(nsdpData.states.length)}
                />

                <DataUnit
                    label="Years covered"
                    value={`${oldestYear} to ${latestYear}`}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <PerCapitaNsdpConstantPricesGrid data={nsdpData} />
            </Div>
        </Article>
    );
};

export default PerCapitaNsdpConstantPricesPage;
