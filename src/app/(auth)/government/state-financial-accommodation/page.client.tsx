"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import StateFinancialAccommodationGrid from "@/components/tables/StateFinancialAccommodationGrid";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { StateFinancialAccommodation } from "@/lib/api/tables/state-financial-accommodation";

// STYLES ==============================================================================================================
import "./state-financial-accommodation-page.css";

interface StateFinancialAccommodationPageProps {
    data : StateFinancialAccommodation;
}

const StateFinancialAccommodationPage : React.FC<StateFinancialAccommodationPageProps> = ({ data }) => {
    // Derive summary stats for the most recent month (first 6 columns).
    const latestMonth = useMemo(() => data.columns[0]?.month ?? "—", [ data.columns ]);

    // Count how many states availed any accommodation in the latest month.
    const statesWithAccommodation = useMemo(() => {
        return data.data.filter(row =>
            row.values.slice(0, 6).some(v => v != null && v > 0),
        ).length;
    }, [ data.data ]);

    // Sum of latest-month SDF average amounts (index 0 per state).
    const latestSdfTotal = useMemo(() => {
        const sum = data.data.reduce((acc, row) => {
            const v = row.values[0];
            return acc + (v ?? 0);
        }, 0);
        return sum > 0 ? sum : null;
    }, [ data.data ]);

    const fmtCrore = (v : number | null) =>
        v == null ? "—" : `₹${v.toLocaleString("en-IN")} cr.`;

    return (
        <Article id="state-financial-accommodation-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Financial accommodation availed by state governments
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        State-wise use of SDF, WMA and overdraft facilities; {data.unit.toLowerCase()}
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on financial accommodation extended by the Reserve Bank of India to state
                    governments and union territories under three facilities: Special Drawing Facility (SDF),
                    Ways and Means Advances (WMA), and Overdraft (OD). Each facility shows the average
                    amount availed (₹ crore) and the number of days for which accommodation was extended
                    during the month. Source: Reserve Bank of India.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestMonth}
                />

                <DataUnit
                    label={`States with accommodation (${latestMonth})`}
                    value={statesWithAccommodation > 0 ? String(statesWithAccommodation) : "—"}
                />

                <DataUnit
                    label={`SDF total (${latestMonth})`}
                    value={fmtCrore(latestSdfTotal)}
                />
            </Div>

            {/* DATA GRID ////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div className="state-financial-accommodation-grid grid-cell">
                <StateFinancialAccommodationGrid
                    columns={data.columns}
                    data={data.data}
                />

                {data.notes.length > 0 && (
                    <Div className="state-financial-accommodation-notes">
                        {data.notes.map((note, i) => (
                            <Text key={i} className="notes-text">
                                {note}
                            </Text>
                        ))}
                    </Div>
                )}
            </Div>
        </Article>
    );
};

export default StateFinancialAccommodationPage;
