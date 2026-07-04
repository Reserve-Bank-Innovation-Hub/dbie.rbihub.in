"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SelectEconomicIndicatorsGrid from "@/components/tables/SelectEconomicIndicatorsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SelectEconomicIndicators } from "@/lib/api/tables/select-economic-indicators";



interface SelectEconomicIndicatorsPageProps {
    data : SelectEconomicIndicators;
}

const SelectEconomicIndicatorsPage : React.FC<SelectEconomicIndicatorsPageProps> = ({ data }) => {
    const latest = data.data[0];

    const stats = useMemo(() => {
        if (!latest) return { month: "—", iip: "—", repoRate: "—", cpi: "—" };
        const fmt = (v : number | string | null) =>
            v == null ? "—" : typeof v === "number" ? `${v.toFixed(2)} %` : `${v} %`;
        return {
            month   : latest.month,
            iip     : fmt(latest.iip),
            repoRate: fmt(latest.policy_repo_rate),
            cpi     : fmt(latest.cpi_inflation),
        };
    }, [ latest ]);

    return (
        <Article id="select-economic-indicators-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Select economic indicators
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Monthly snapshot of growth, ratios, rates and inflation indicators, from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Monthly time series covering industrial production, scheduled commercial bank aggregates,
                    monetary ratios, policy and market interest rates, exchange rates, forward premia,
                    inflation measures and foreign trade. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.month}
                />

                <DataUnit
                    label={`IIP growth (${stats.month})`}
                    value={stats.iip}
                />

                <DataUnit
                    label={`Policy repo rate (${stats.month})`}
                    value={stats.repoRate}
                />

                <DataUnit
                    label={`CPI inflation (${stats.month})`}
                    value={stats.cpi}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <SelectEconomicIndicatorsGrid data={data.data} />
            </Div>

            {/* NOTES ////////////////////////////////////////////////////////////////////////////////////////////// */}
            {data.notes && (
                <Div id="notes-card" className="notes-cell grid-cell" padding="micro">
                    <Text className="notes-text">{data.notes}</Text>
                </Div>
            )}
        </Article>
    );
};

export default SelectEconomicIndicatorsPage;
