"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ProductionAndImportsOfCrudeOilGrid from "@/components/tables/ProductionAndImportsOfCrudeOilGrid";
import ProductionAndImportsOfCrudeOilChart from "@/components/charts/ProductionAndImportsOfCrudeOilChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { newestWith } from "@/lib/tables/latest";
import { ProductionAndImportsOfCrudeOilAndPetroleumProducts } from "@/lib/api/tables/production-and-imports-of-crude-oil-and-petroleum-products";

// STYLES ==============================================================================================================

interface ProductionAndImportsOfCrudeOilPageProps {
    data : ProductionAndImportsOfCrudeOilAndPetroleumProducts;
}

const ProductionAndImportsOfCrudeOilPage : React.FC<ProductionAndImportsOfCrudeOilPageProps> = ({ data }) => {
    // Data is newest-first, so index 0 is the latest year.
    const latest = data.data[0];

    const stats = useMemo(() => {
        // Each card takes the newest row that carries its own field: DBIE can publish one column a period
        // behind the rest, and a card off row 0 would read "—" (src/lib/tables/latest.ts).
        const latestCrudeProdRow = newestWith(data.data, (r) => r.crude_prod);
        const latestPolProdRow = newestWith(data.data, (r) => r.pol_prod);
        const latestCrudeImpRow = newestWith(data.data, (r) => r.crude_imp);
        const latestPolImpRow = newestWith(data.data, (r) => r.pol_imp);
        const mmt = (v : number | null) =>
            v == null ? "—" : `${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} MMT`;
        return {
            latestYear          : latest?.year ?? "—",
            latestCrudeProd     : mmt(latestCrudeProdRow?.crude_prod ?? null),
            latestCrudeProdDate : latestCrudeProdRow?.year || "—",
            latestPolProd       : mmt(latestPolProdRow?.pol_prod ?? null),
            latestPolProdDate   : latestPolProdRow?.year || "—",
            latestCrudeImp      : mmt(latestCrudeImpRow?.crude_imp ?? null),
            latestCrudeImpDate  : latestCrudeImpRow?.year || "—",
            latestPolImp        : mmt(latestPolImpRow?.pol_imp ?? null),
            latestPolImpDate    : latestPolImpRow?.year || "—",
        };
    }, [ latest, data ]);

    return (
        <Article id="crude-oil-petroleum-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Production and imports of crude oil and petroleum products
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Millions metric tonnes (MMT)
                    </Heading6>
                </Div>

                <Text>
                    Annual production and imports of crude oil and petroleum oil lubricant (POL) products
                    in India, sourced from the Ministry of Petroleum and Natural Gas.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Ministry of Petroleum and Natural Gas, GoI"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${data.data.length} years`}
                />
            </Div>

            {/* STAT CARDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Crude oil production</Text>
                <DataUnit
                    label={`Latest (${stats.latestCrudeProdDate})`}
                    value={stats.latestCrudeProd}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">MMT</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">POL products production</Text>
                <DataUnit
                    label={`Latest (${stats.latestPolProdDate})`}
                    value={stats.latestPolProd}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">MMT</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Crude oil imports</Text>
                <DataUnit
                    label={`Latest (${stats.latestCrudeImpDate})`}
                    value={stats.latestCrudeImp}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">MMT</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">POL products imports</Text>
                <DataUnit
                    label={`Latest (${stats.latestPolImpDate})`}
                    value={stats.latestPolImp}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">MMT</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="chart-cell grid-cell">
                <ProductionAndImportsOfCrudeOilChart data={data.data} />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ProductionAndImportsOfCrudeOilGrid data={data.data} units={data.units} />
            </Div>
        </Article>
    );
};

export default ProductionAndImportsOfCrudeOilPage;
