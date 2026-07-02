"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Div, Heading4 } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ExternalDebtGrid from "@/components/tables/ExternalDebtGrid";

// LIB =================================================================================================================
import { ParsedExternalDebt } from "@/lib/api/publications";

// STYLES ==============================================================================================================
import "./external-debt-page.css";

interface ExternalDebtPageProps {
    data : ParsedExternalDebt;
}

const ExternalDebtPage: React.FC<ExternalDebtPageProps> = ({ data }) => {
    return (
        <Article id="external-debt-page" className="page-grid">
            <Div id="title-card" className="grid-cell" padding="micro">
                <Heading4>{data.reportTitle}</Heading4>
            </Div>

            <div className="chart-wrapper">
                <ExternalDebtGrid data={data.data} />
            </div>
        </Article>
    );
};

export default ExternalDebtPage;
