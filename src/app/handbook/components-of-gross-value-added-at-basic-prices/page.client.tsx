"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ComponentsOfGrossValueAddedAtBasicPricesGrid from "@/components/tables/ComponentsOfGrossValueAddedAtBasicPricesGrid";
import ComponentsOfGrossValueAddedAtBasicPricesChart from "@/components/charts/ComponentsOfGrossValueAddedAtBasicPricesChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ComponentsOfGrossValueAddedAtBasicPrices } from "@/lib/api/tables/components-of-gross-value-added-at-basic-prices";

// STYLES ==============================================================================================================
import "./components-of-gross-value-added-at-basic-prices-page.css";

interface ComponentsOfGrossValueAddedAtBasicPricesPageProps {
    gvaData : ComponentsOfGrossValueAddedAtBasicPrices;
}

const ComponentsOfGrossValueAddedAtBasicPricesPage : React.FC<ComponentsOfGrossValueAddedAtBasicPricesPageProps> = ({ gvaData }) => {
    // The file is newest-first, so the first row is the latest year.
    const latest = gvaData.data[0];

    const stats = useMemo(() => {
        const crore = (v : number | null) => (v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr`);
        return {
            latestYear   : latest?.year || "—",
            latestGva    : crore(latest?.gva_const ?? null),
            latestGdp    : crore(latest?.gdp_const ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="components-of-gross-value-added-at-basic-prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Components of gross value added at basic prices
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Base year {gvaData.baseYear} · {gvaData.unit} · constant and current prices
                    </Heading6>
                </Div>

                <Text>
                    Annual national accounts series from {gvaData.data[gvaData.data.length - 1]?.year} to {latest?.year},
                    showing agriculture, industry, services, and GVA at basic prices alongside demand-side components
                    (PFCE, GFCE, GFCF, exports, imports) and GDP at market prices.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistics Office (NSO)"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${gvaData.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* LATEST STATS ////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Latest GVA (constant prices)</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestGva}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{gvaData.unit}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Latest GDP (constant prices)</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestGdp}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{gvaData.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <ComponentsOfGrossValueAddedAtBasicPricesChart
                data={gvaData.data}
                title="GVA components at constant prices (base year 2011-12)"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="components-of-gross-value-added-at-basic-prices-grid">
                <ComponentsOfGrossValueAddedAtBasicPricesGrid
                    data={gvaData.data}
                />
            </Div>
        </Article>
    );
};

export default ComponentsOfGrossValueAddedAtBasicPricesPage;
