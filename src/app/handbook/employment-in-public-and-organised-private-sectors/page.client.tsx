"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import EmploymentInPublicAndOrganisedPrivateSectorsGrid from "@/components/tables/EmploymentInPublicAndOrganisedPrivateSectorsGrid";
import EmploymentInPublicAndOrganisedPrivateSectorsChart from "@/components/charts/EmploymentInPublicAndOrganisedPrivateSectorsChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { newestWith } from "@/lib/tables/latest";
import { EmploymentInPublicAndOrganisedPrivateSectors } from "@/lib/api/tables/employment-in-public-and-organised-private-sectors";


interface EmploymentInPublicAndOrganisedPrivateSectorsPageProps {
    employmentData : EmploymentInPublicAndOrganisedPrivateSectors;
}

const EmploymentInPublicAndOrganisedPrivateSectorsPage : React.FC<EmploymentInPublicAndOrganisedPrivateSectorsPageProps> = ({ employmentData }) => {
    // Find the latest row that has actual data (many recent rows are null)
    const latestWithData = employmentData.data.find(r => r.public_sector !== null);

    const stats = useMemo(() => {
        const lakhs = (v : number | null) => (v == null ? "—" : `${v.toLocaleString("en-IN")} L`);
        // Each card takes the newest row that carries its own field: DBIE can publish one column a period
        // behind the rest, and a card off row 0 would read "—" (src/lib/tables/latest.ts).
        const publicRow  = newestWith(employmentData.data, (r) => r.public_sector);
        const privateRow = newestWith(employmentData.data, (r) => r.private_sector);
        return {
            latestYear        : latestWithData?.year || "—",
            latestPublic      : lakhs(publicRow?.public_sector ?? null),
            latestPublicYear  : publicRow?.year || "—",
            latestPrivate     : lakhs(privateRow?.private_sector ?? null),
            latestPrivateYear : privateRow?.year || "—",
        };
    }, [ latestWithData, employmentData ]);

    return (
        <Article id="employment-in-public-and-organised-private-sectors-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <PageCrumbs />

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
            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Public sector</Text>
                <DataUnit
                    label={`Latest (${stats.latestPublicYear})`}
                    value={stats.latestPublic}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">In lakhs</Text>
            </Div>

            <Div className="stat-cell grid-cell" padding="micro">
                <Text weight="600" marginBottom="nano">Private sector</Text>
                <DataUnit
                    label={`Latest (${stats.latestPrivateYear})`}
                    value={stats.latestPrivate}
                    size="large"
                    align="right"
                />
                <Text size="tiny" opacity="60">In lakhs</Text>
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <EmploymentInPublicAndOrganisedPrivateSectorsChart
                    data={employmentData.data}
                    title="Employment in public and organised private sectors over time"
                    height={600}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <EmploymentInPublicAndOrganisedPrivateSectorsGrid
                    data={employmentData.data}
                />
            </Div>
        </Article>
    );
};

export default EmploymentInPublicAndOrganisedPrivateSectorsPage;
