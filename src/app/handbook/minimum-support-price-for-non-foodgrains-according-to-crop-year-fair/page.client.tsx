"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import MspNonFoodgrainsGrid from "@/components/tables/MspNonFoodgrainsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { MspNonFoodgrains } from "@/lib/api/tables/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair";

// STYLES ==============================================================================================================

interface MspNonFoodgrainsPageProps {
    tableData : MspNonFoodgrains;
}

const MspNonFoodgrainsPage : React.FC<MspNonFoodgrainsPageProps> = ({ tableData }) => {
    return (
        <Article id="minimum-support-price-for-non-foodgrains-according-to-crop-year-fair-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Minimum support price for non-foodgrains (crop year, fair average quality)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.units}
                    </Heading6>
                </Div>

                <Text>
                    Minimum support prices declared by the Government of India for non-foodgrains — sugarcane,
                    cotton, jute, groundnut, soyabean, sunflower seed, rapeseed/mustard and safflower — by crop
                    year, fair average quality, in rupees per quintal.
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
                    value={`${tableData.data.length} crop years`}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <MspNonFoodgrainsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default MspNonFoodgrainsPage;
