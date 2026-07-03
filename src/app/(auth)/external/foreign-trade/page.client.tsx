"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ForeignTradeGrid from "@/components/tables/ForeignTradeGrid";
import ForeignTradeChart from "@/components/charts/ForeignTradeChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ForeignTrade } from "@/lib/api/tables/foreign-trade";

// STYLES ==============================================================================================================
import "./foreign-trade-page.css";

interface ForeignTradePageProps {
    tradeData : ForeignTrade;
}

// Format a "YYYY-MM" key as "Mon YYYY".
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatMonth(key : string) : string {
    const m = key.match(/^(\d{4})-(\d{2})$/);
    if (!m) return key;
    const mon = MONTH_LABELS[Number(m[2]) - 1] ?? m[2];
    return `${mon} ${m[1]}`;
}

const ForeignTradePage : React.FC<ForeignTradePageProps> = ({ tradeData }) => {
    const latest = tradeData.data[0];

    const stats = useMemo(() => {
        const usd = (v : number | null) => v == null ? "—" : `US$ ${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} mn`;
        return {
            latestMonth  : formatMonth(latest?.month ?? ""),
            exports      : usd(latest?.exports_usd ?? null),
            imports      : usd(latest?.imports_usd ?? null),
            balance      : usd(latest?.trade_balance_usd ?? null),
        };
    }, [latest]);

    return (
        <Article id="foreign-trade-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Foreign trade
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        Exports, imports and trade balance — ₹ crore and US$ millions; oil and non-oil breakdowns
                    </Heading6>
                </Div>

                <Text>
                    Monthly India foreign trade data covering total exports, imports and the resulting trade
                    balance, with separate series for oil and non-oil components. Values are reported in both
                    rupee crore and US dollar millions. Source: Directorate General of Commercial Intelligence
                    and Statistics (DGCI&S) / Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="DGCI&S / Reserve Bank of India"
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Total records"
                    value={`${tradeData.data.length.toLocaleString()} months`}
                />
            </Div>

            {/* LATEST STATS /////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Exports</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.exports}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Imports</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.imports}
                    size="large"
                    align="right"
                />
            </Div>

            <Div className="grid-cell stat-card" padding="micro">
                <Text weight="600" marginBottom="nano">Trade balance</Text>
                <DataUnit
                    label={`Latest (${stats.latestMonth})`}
                    value={stats.balance}
                    size="large"
                    align="right"
                />
            </Div>

            {/* CHART ////////////////////////////////////////////////////////////////////////////////////////////// */}
            <ForeignTradeChart
                data={tradeData.data}
                title="India foreign trade — exports, imports and trade balance (US$ millions)"
                height={600}
            />

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="foreign-trade-grid grid-cell">
                <ForeignTradeGrid data={tradeData.data} />
            </Div>
        </Article>
    );
};

export default ForeignTradePage;
