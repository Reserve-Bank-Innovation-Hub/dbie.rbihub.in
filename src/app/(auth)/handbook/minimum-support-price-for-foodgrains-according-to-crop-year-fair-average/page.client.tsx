"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import MspFoodgrainsGrid from "@/components/tables/MspFoodgrainsGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { MspFoodgrains } from "@/lib/api/tables/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average";

// STYLES ==============================================================================================================
import "./minimum-support-price-for-foodgrains-according-to-crop-year-fair-average-page.css";

interface MspFoodgrainsPageProps {
    tableData : MspFoodgrains;
}

const MspFoodgrainsPage : React.FC<MspFoodgrainsPageProps> = ({ tableData }) => {
    return (
        <Article id="minimum-support-price-for-foodgrains-according-to-crop-year-fair-average-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Minimum support price for foodgrains (crop year, fair average quality)
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        {tableData.units}
                    </Heading6>
                </Div>

                <Text>
                    Minimum support prices declared by the Government of India for foodgrains — paddy (common),
                    maize, wheat, gram, arhar/tur and moong — by crop year, fair average quality, in rupees per quintal.
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
            <Div className="msp-foodgrains-grid">
                <MspFoodgrainsGrid
                    data={tableData.data}
                    units={tableData.units}
                />
            </Div>
        </Article>
    );
};

export default MspFoodgrainsPage;
