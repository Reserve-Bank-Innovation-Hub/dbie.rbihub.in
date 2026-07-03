"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGrid from "@/components/tables/ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGrid";
import ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChart from "@/components/charts/ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector } from "@/lib/api/tables/changes-in-financial-assets-liabilities-of-the-household-sector";

// STYLES ==============================================================================================================
import "./changes-in-financial-assets-liabilities-of-the-household-sector-page.css";

interface ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPageProps {
    data : ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSector;
}

const ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPage : React.FC<ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPageProps> = ({ data }) => {
    // The file is newest-first, so the first row is the latest year.
    const latest = data.data[0];

    const stats = useMemo(() => {
        const crore = (v : number | null) =>
            v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr`;
        return {
            latestYear                   : latest?.year || "—",
            latestChangesInFinancialAssets: crore(latest?.changes_in_financial_assets ?? null),
            latestBankDeposits           : crore(latest?.bank_deposits ?? null),
        };
    }, [ latest ]);

    return (
        <Article id="changes-in-financial-assets-liabilities-of-the-household-sector-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Changes in financial assets/liabilities of the household sector
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        At current prices, in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Annual changes in the financial assets and liabilities of the household sector at current
                    prices. Assets include currency, bank deposits, life insurance fund, provident and pension
                    fund, government claims, shares, UTI units, and trade debt. Liabilities cover bank advances
                    and loans from financial institutions, government, and co-operatives.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="National Statistical Office (NSO)"
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
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Changes in financial assets</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestChangesInFinancialAssets}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.unit}</Text>
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Bank deposits</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestBankDeposits}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">{data.unit}</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="changes-in-financial-assets-liabilities-chart grid-cell">
                <ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorChart
                    data={data.data}
                    title="Changes in financial assets/liabilities — household sector"
                    height={600}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="changes-in-financial-assets-liabilities-grid grid-cell">
                <ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorGrid data={data.data} />
            </Div>
        </Article>
    );
};

export default ChangesInFinancialAssetsLiabilitiesOfTheHouseholdSectorPage;
