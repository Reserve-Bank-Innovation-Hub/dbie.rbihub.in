"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import SectorWiseCostOverrunGrid from "@/components/tables/SectorWiseCostOverrunGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SectorWiseCostOverrun } from "@/lib/api/tables/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march";

// STYLES ==============================================================================================================
import "./sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march-page.css";

interface SectorWiseCostOverrunPageProps {
    tableData : SectorWiseCostOverrun;
}

const SectorWiseCostOverrunPage : React.FC<SectorWiseCostOverrunPageProps> = ({ tableData }) => {
    return (
        <Article id="sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Sector-wise cost overrun of delayed central sector projects (end-March)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.units}
                    </Heading6>
                </Div>

                <Text>
                    Cost overrun data for delayed central sector projects — original estimates, revised anticipated
                    costs and cost overrun amounts across 15 sectors, as at end-March each year.
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
            <Div className="sector-wise-cost-overrun-grid">
                <SectorWiseCostOverrunGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default SectorWiseCostOverrunPage;
