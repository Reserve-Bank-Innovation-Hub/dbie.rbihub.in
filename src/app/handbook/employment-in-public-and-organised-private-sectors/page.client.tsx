"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import EmploymentInPublicAndOrganisedPrivateSectorsGrid from "@/components/tables/EmploymentInPublicAndOrganisedPrivateSectorsGrid";
import EmploymentInPublicAndOrganisedPrivateSectorsChart from "@/components/charts/EmploymentInPublicAndOrganisedPrivateSectorsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { EmploymentInPublicAndOrganisedPrivateSectors } from "@/lib/api/tables/employment-in-public-and-organised-private-sectors";

// STYLES ==============================================================================================================
import "./employment-in-public-and-organised-private-sectors-page.css";

interface EmploymentInPublicAndOrganisedPrivateSectorsPageProps {
    employmentData : EmploymentInPublicAndOrganisedPrivateSectors;
}

const EmploymentInPublicAndOrganisedPrivateSectorsPage : React.FC<EmploymentInPublicAndOrganisedPrivateSectorsPageProps> = ({ employmentData }) => {
    // Find the latest row that has actual data (many recent rows are null)
    const latestWithData = employmentData.data.find(r => r.public_sector !== null);

    const stats = useMemo(() => {
        const lakhs = (v : number | null) => (v == null ? "—" : `${v.toLocaleString("en-IN")} L`);
        return {
            latestYear    : latestWithData?.year || "—",
            latestPublic  : lakhs(latestWithData?.public_sector ?? null),
            latestPrivate : lakhs(latestWithData?.private_sector ?? null),
        };
    }, [ latestWithData ]);

    return (
        <Article id="employment-in-public-and-organised-private-sectors-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Employment in public and organised private sectors
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        In lakhs — end-March figures
                    </Heading6>
                </Div>

                <Text>
                    Annual employment figures for the public and organised private sectors in India,
                    from 1970–71 onwards. Data for 2012–13 and later years is not yet available.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Directorate General of Employment and Training, Ministry of Labour & Employment"
                />

                <DataUnit
                    label="Latest year with data"
                    value={stats.latestYear}
                />

                <DataUnit
                    label="Total records"
                    value={`${employmentData.data.length.toLocaleString()} years`}
                />
            </Div>

            {/* LATEST STATS /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell employment-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Public sector</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestPublic}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">In lakhs</Text>
            </Div>

            <Div className="grid-cell employment-stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Private sector</Text>
                <DataUnit
                    label={`Latest (${stats.latestYear})`}
                    value={stats.latestPrivate}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">In lakhs</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <EmploymentInPublicAndOrganisedPrivateSectorsChart
                data={employmentData.data}
                title="Employment in public and organised private sectors over time"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="employment-public-private-grid">
                <EmploymentInPublicAndOrganisedPrivateSectorsGrid
                    data={employmentData.data}
                />
            </Div>
        </Article>
    );
};

export default EmploymentInPublicAndOrganisedPrivateSectorsPage;
