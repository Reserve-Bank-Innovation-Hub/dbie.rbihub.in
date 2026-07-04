"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo, useState } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Div, Select } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import ConsumerPriceIndexGrid from "@/components/tables/ConsumerPriceIndexGrid";
import ConsumerPriceIndexChart from "@/components/charts/ConsumerPriceIndexChart";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { ParsedConsumerPriceIndex } from "@/lib/api/tables/consumer-price-index";

// STYLES ==============================================================================================================

interface ConsumerPriceIndexPageProps {
    cpiData : ParsedConsumerPriceIndex;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-03" -> "Mar 2026".
function monthLabel(iso : string) : string {
    const [ year, month ] = iso.split("-");
    return `${MONTH_LABELS[Number(month) - 1] || month} ${year}`;
}

const ConsumerPriceIndexPage : React.FC<ConsumerPriceIndexPageProps> = ({ cpiData }) => {
    // Default to the newest base (first in the array) and its newest month.
    const [ baseIndex, setBaseIndex ] = useState(0);
    const activeSeries = cpiData.series[baseIndex] || cpiData.series[0];

    const [ month, setMonth ] = useState<string>(activeSeries.months[0] || "");

    // Switching base resets the month to that base's newest.
    const handleBaseChange = (value : string) => {
        const idx = cpiData.series.findIndex((s) => s.base === value);
        const next = idx >= 0 ? idx : 0;
        setBaseIndex(next);
        setMonth(cpiData.series[next].months[0] || "");
    };

    const baseOptions = useMemo(
        () => cpiData.series.map((s) => ({ value: s.base, label: `Base ${s.base}` })),
        [ cpiData.series ],
    );

    const monthOptions = useMemo(
        () => [
            { value: "", label: "All months" },
            ...activeSeries.months.map((m) => ({ value: m, label: monthLabel(m) })),
        ],
        [ activeSeries.months ],
    );

    const stats = useMemo(() => {
        return {
            basesCount     : cpiData.series.length,
            monthsCovered  : activeSeries.months.length,
            latestMonth    : activeSeries.months[0] ? monthLabel(activeSeries.months[0]) : "N/A",
            commodityCount : activeSeries.commodities.length,
        };
    }, [ cpiData.series, activeSeries ]);

    return (
        <Article id="consumer-price-index-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Heading4 weight="700" marginBottom="nano">
                    Consumer price index
                </Heading4>
                <Heading6 weight="400" opacity="60">
                    Rural, urban and combined CPI across base years, with year-on-year inflation
                </Heading6>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value={cpiData.source}
                />

                <DataUnit
                    label="Base periods"
                    value={stats.basesCount.toLocaleString()}
                />

                <DataUnit
                    label="Months covered"
                    value={stats.monthsCovered.toLocaleString()}
                />

                <DataUnit
                    label="Latest month"
                    value={stats.latestMonth}
                />

                <DataUnit
                    label="Commodities"
                    value={stats.commodityCount.toLocaleString()}
                />
            </Div>

            {/* CONTROLS /////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="controls-card" className="controls-cell grid-cell" padding="micro">
                <Select
                    className="cpi-select"
                    label="Base period"
                    options={baseOptions}
                    value={activeSeries.base}
                    onChange={handleBaseChange}
                />

                <Select
                    className="cpi-select"
                    label="Month"
                    options={monthOptions}
                    value={month}
                    onChange={setMonth}
                />
            </Div>

            {/* HEADLINE CHART ///////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="chart-cell grid-cell">
                <ConsumerPriceIndexChart series={activeSeries} />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell">
                <ConsumerPriceIndexGrid series={activeSeries} month={month} />
            </Div>
        </Article>
    );
};

export default ConsumerPriceIndexPage;
