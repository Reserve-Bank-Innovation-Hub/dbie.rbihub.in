"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ComponentsOfGrossDomesticProductGrid from "@/components/tables/ComponentsOfGrossDomesticProductGrid";
import ComponentsOfGrossDomesticProductChart from "@/components/charts/ComponentsOfGrossDomesticProductChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ComponentsOfGrossDomesticProduct } from "@/lib/api/tables/components-of-gross-domestic-product";

// STYLES ==============================================================================================================
import "./components-of-gross-domestic-product-page.css";

interface ComponentsOfGrossDomesticProductPageProps {
    gdpData : ComponentsOfGrossDomesticProduct;
}

const ComponentsOfGrossDomesticProductPage : React.FC<ComponentsOfGrossDomesticProductPageProps> = ({ gdpData }) => {
    const latest = gdpData.data[0];

    const latestGdp = latest?.gdp_const != null
        ? `₹${latest.gdp_const.toLocaleString("en-IN")}`
        : "–";

    return (
        <Article id="components-of-gross-domestic-product-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Components of gross domestic product
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base year {gdpData.baseYear}, {gdpData.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Annual series of GDP expenditure components at constant and current prices, from 1950-51 onwards.
                    Includes private final consumption expenditure (PFCE), government final consumption expenditure (GFCE),
                    gross fixed capital formation (GFCF), changes in stocks, valuables, exports, imports and statistical
                    discrepancies.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistics Office (NSO)"
                />

                <DataUnit
                    label="Latest year"
                    value={latest?.year || "–"}
                />

                <DataUnit
                    label="Total records"
                    value={`${gdpData.data.length} years`}
                />
            </Div>

            {/* STAT CARD ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="stat-card" className="grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">GDP — constant prices</Text>
                <DataUnit
                    label={`Latest (${latest?.year || "–"})`}
                    value={latestGdp}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{gdpData.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <ComponentsOfGrossDomesticProductChart
                data={gdpData.data}
                title="GDP at constant prices (base year 2011-12)"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="components-of-gdp-grid">
                <ComponentsOfGrossDomesticProductGrid data={gdpData.data} />
            </Div>
        </Article>
    );
};

export default ComponentsOfGrossDomesticProductPage;
