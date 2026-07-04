"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ImplementationOfCentralSectorProjectsGrid from "@/components/tables/ImplementationOfCentralSectorProjectsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ImplementationOfCentralSectorProjects } from "@/lib/api/tables/implementation-of-central-sector-projects-status-end-march";


interface ImplementationOfCentralSectorProjectsPageProps {
    tableData : ImplementationOfCentralSectorProjects;
}

const ImplementationOfCentralSectorProjectsPage : React.FC<ImplementationOfCentralSectorProjectsPageProps> = ({ tableData }) => {
    return (
        <Article id="implementation-of-central-sector-projects-status-end-march-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Implementation of central sector projects — status (end-March)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.units}
                    </Heading6>
                </Div>

                <Text>
                    Status of central sector projects across 17 sectors — number of projects ahead of schedule,
                    on schedule, delayed, or without a confirmed date of completion, as at end-March each year.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest year"
                    value={tableData.data[0]?.year ?? "—"}
                />

                <DataUnit
                    label="Total records"
                    value={`${tableData.data.length} years`}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ImplementationOfCentralSectorProjectsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default ImplementationOfCentralSectorProjectsPage;
