"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import HouseholdFinancialStocksGrid from "@/components/tables/HouseholdFinancialStocksGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { HouseholdFinancialStocks } from "@/lib/api/tables/household-financial-stocks";



interface HouseholdFinancialStocksPageProps {
    data : HouseholdFinancialStocks;
}

const HouseholdFinancialStocksPage : React.FC<HouseholdFinancialStocksPageProps> = ({ data }) => {
    // Latest period is the last column (rightmost quarter-end).
    const latestPeriod = data.columns[data.columns.length - 1] ?? "—";

    // Total financial assets at the latest period (first data row).
    const totalAssets = useMemo(() => {
        const row = data.data.find((r) => r.item === "Financial Assets (a+b+c+d+e+f+g+h)");
        if (!row) return "—";
        const val = row.values[data.columns.length - 1];
        return val == null
            ? "—"
            : `₹${val.toLocaleString("en-IN", { maximumFractionDigits : 1 })} cr.`;
    }, [ data ]);

    // Total financial liabilities at the latest period.
    const totalLiabilities = useMemo(() => {
        const row = data.data.find((r) => r.item === "Financial Liabilities (a+b)");
        if (!row) return "—";
        const val = row.values[data.columns.length - 1];
        return val == null
            ? "—"
            : `₹${val.toLocaleString("en-IN", { maximumFractionDigits : 1 })} cr.`;
    }, [ data ]);

    return (
        <Article id="household-financial-stocks-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Stocks of financial assets and liabilities of households
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Quarter-end stocks; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Quarter-end stocks of select financial assets (bank deposits, life insurance funds,
                    currency, mutual funds, pension funds, small savings) and financial liabilities
                    (borrowings from banking sector and other financial institutions) of the household
                    sector. Ratios to GDP are also shown. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest quarter-end"
                    value={latestPeriod}
                />

                <DataUnit
                    label={`Total financial assets (${latestPeriod})`}
                    value={totalAssets}
                />

                <DataUnit
                    label={`Total financial liabilities (${latestPeriod})`}
                    value={totalLiabilities}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <HouseholdFinancialStocksGrid data={data} />

                {data.notes.length > 0 && (
                    <Div className="household-financial-stocks-notes" marginTop="micro">
                        {data.notes.map((note, i) => (
                            <Text key={i} size="small" opacity="70" marginBottom="nano">
                                {i + 1}. {note}
                            </Text>
                        ))}
                    </Div>
                )}
            </Div>
        </Article>
    );
};

export default HouseholdFinancialStocksPage;
