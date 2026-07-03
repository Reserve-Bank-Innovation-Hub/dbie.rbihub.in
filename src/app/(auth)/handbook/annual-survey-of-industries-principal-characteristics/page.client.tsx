"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import AnnualSurveyOfIndustriesPrincipalCharacteristicsGrid from "@/components/tables/AnnualSurveyOfIndustriesPrincipalCharacteristicsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { AnnualSurveyOfIndustriesPrincipalCharacteristics } from "@/lib/api/tables/annual-survey-of-industries-principal-characteristics";

// DATA VIZ ============================================================================================================
import AnnualSurveyOfIndustriesChart from "@/components/charts/AnnualSurveyOfIndustriesChart";

// STYLES ==============================================================================================================
import "./annual-survey-page.css";

interface AnnualSurveyOfIndustriesPrincipalCharacteristicsPageProps {
    asiData : AnnualSurveyOfIndustriesPrincipalCharacteristics;
}

const AnnualSurveyOfIndustriesPrincipalCharacteristicsPage : React.FC<
    AnnualSurveyOfIndustriesPrincipalCharacteristicsPageProps
> = ({ asiData }) => {
    // Data is newest-first; first row is the latest year.
    const latest = asiData.data[0];

    const stats = useMemo(() => {
        const latestYear     = latest?.year || "—";
        const latestFactories = latest?.values["1"] != null
            ? latest.values["1"]!.toLocaleString("en-IN")
            : "—";
        const latestNVA      = latest?.values["21"] != null
            ? `₹${latest.values["21"]!.toLocaleString("en-IN", { maximumFractionDigits: 2 })} cr`
            : "—";
        return { latestYear, latestFactories, latestNVA };
    }, [ latest ]);

    return (
        <Article id="annual-survey-of-industries-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Annual survey of industries — principal characteristics
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Value in rupees crores; man days in thousands; others in number
                    </Heading6>
                </Div>

                <Text>
                    Annual principal characteristics of the organised manufacturing sector covering
                    factories, employment, capital formation, inputs, output, and value added — sourced
                    from the Annual Survey of Industries conducted by MoSPI, Government of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Annual Survey of Industries, MoSPI, GoI"
                />

                <DataUnit
                    label="Latest year"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${asiData.data.length} years`}
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className="annual-survey-of-industries-chart grid-cell">
                <AnnualSurveyOfIndustriesChart
                    data={asiData.data}
                    characteristics={asiData.characteristics}
                    title="Annual survey of industries — key metrics"
                    height={520}
                />
            </div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="annual-survey-of-industries-grid grid-cell">
                <AnnualSurveyOfIndustriesPrincipalCharacteristicsGrid
                    data={asiData.data}
                    characteristics={asiData.characteristics}
                />
            </Div>
        </Article>
    );
};

export default AnnualSurveyOfIndustriesPrincipalCharacteristicsPage;
