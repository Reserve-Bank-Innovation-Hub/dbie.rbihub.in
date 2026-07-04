"use client";

// REACT CORE ==========================================================================================================
import React, { useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { MonthlyGrid, AnnualGrid } from "@/components/tables/SmallSavingsGrids";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { SmallSavings } from "@/lib/api/tables/small-savings";

// STYLES ==============================================================================================================
import "./small-savings-page.css";

interface SmallSavingsPageProps {
    data : SmallSavings;
}

const SmallSavingsPage : React.FC<SmallSavingsPageProps> = ({ data }) => {
    const { monthly, annual } = data;
    const [ activeTab, setActiveTab ] = useState<"monthly" | "annual">("monthly");

    // Latest rows for the meta card
    const latestMonthly = monthly.data[0];
    const latestAnnual  = annual.data[0];

    // Small Savings total receipts and outstanding are values[0] and values[1]
    const totalReceipts    = latestMonthly?.values[0] ?? null;
    const totalOutstanding = latestMonthly?.values[1] ?? null;
    const fmt = (v : number | null) => v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    return (
        <Article id="small-savings-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Small savings
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Receipts and outstanding balances across small savings schemes; amounts in {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly and annual data on receipts and outstanding balances across small savings schemes,
                    covering post office deposits (including Sukanya Samriddhi Yojna, Monthly Income Scheme,
                    Senior Citizen Scheme, and time deposits), saving certificates (NSC, Kisan Vikas Patra),
                    and the Public Provident Fund. Source: Accountant General, Post and Telegraphs.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Accountant General, Post and Telegraphs"
                />

                <DataUnit
                    label="Latest monthly period"
                    value={latestMonthly ? `${latestMonthly.month} ${latestMonthly.fiscal_year}` : "—"}
                />

                <DataUnit
                    label={`Total receipts (${latestMonthly?.month ?? ""} ${latestMonthly?.fiscal_year ?? ""})`}
                    value={fmt(totalReceipts)}
                />

                <DataUnit
                    label={`Total outstanding (${latestMonthly?.month ?? ""} ${latestMonthly?.fiscal_year ?? ""})`}
                    value={fmt(totalOutstanding)}
                />

                <DataUnit
                    label="Latest annual period"
                    value={latestAnnual?.fiscal_year ?? "—"}
                />
            </Div>

            {/* DATA GRIDS ///////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="grids-card" className="grid-cell">
                {/* Tab selector */}
                <div className="small-savings-tab-bar">
                    <button
                        className={`small-savings-tab ${activeTab === "monthly" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("monthly")}
                    >
                        Monthly
                    </button>

                    <button
                        className={`small-savings-tab ${activeTab === "annual" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("annual")}
                    >
                        Annual
                    </button>
                </div>

                <Div className="small-savings-grid-container">
                    {activeTab === "monthly" ? (
                        <MonthlyGrid columns={monthly.columns} data={monthly.data} />
                    ) : (
                        <AnnualGrid columns={annual.columns} data={annual.data} />
                    )}
                </Div>
            </Div>
        </Article>
    );
};

export default SmallSavingsPage;
