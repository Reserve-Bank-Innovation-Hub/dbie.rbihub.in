"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading4, Heading6, Text, Div } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { OutrightGrid, ForwardsGrid, ForwardsMaturityGrid } from "@/components/tables/UsdSalePurchaseGrids";
import { DataUnit } from "@components/DataUnit/DataUnit";

// LIB =================================================================================================================
import { UsdSalePurchase } from "@/lib/api/tables/usd-sale-purchase";



interface UsdSalePurchasePageProps {
    data : UsdSalePurchase;
}

const UsdSalePurchasePage : React.FC<UsdSalePurchasePageProps> = ({ data }) => {
    const latestOutright = data.outright[0];
    const latestForwards = data.forwards[0];

    const fmt = (v : number | null) =>
        v == null ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: 2 });

    return (
        <Article id="usd-sale-purchase-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" className="grid-cell" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Sale/purchase of U.S. Dollar by the Reserve Bank of India
                    </Heading4>

                    <Heading6 weight="400" opacity="60" marginBottom="micro">
                        RBI&apos;s foreign exchange intervention — outright and forward US dollar operations, from the monthly RBI Bulletin
                    </Heading6>
                </Div>

                <Text>
                    Monthly data on the Reserve Bank of India&apos;s intervention in the foreign exchange market.
                    Covers outright sale/purchase of US dollars, operations in currency forwards, and the
                    residual-maturity breakdown of outstanding forward positions. Cumulative figures are measured
                    over the end of March. Values in US $ millions unless otherwise stated.
                    Source: Reserve Bank of India Monthly Bulletin, Table 4.
                </Text>
            </Div>

            <Div id="meta-card" className="grid-cell" padding="micro">
                <DataUnit
                    label="Source"
                    value="Reserve Bank of India"
                />

                <DataUnit
                    label="Latest period"
                    value={latestOutright?.month ?? "—"}
                />

                <DataUnit
                    label={`Net intervention (${latestOutright?.month ?? "—"})`}
                    value={`${fmt(latestOutright?.net_usd_mn ?? null)} US $ mn`}
                />

                <DataUnit
                    label={`Cumulative (${latestOutright?.month ?? "—"})`}
                    value={`${fmt(latestOutright?.cumulative_usd_mn ?? null)} US $ mn`}
                />

                <DataUnit
                    label={`Forwards purchase (${latestForwards?.month ?? "—"})`}
                    value={`${fmt(latestForwards?.purchase_usd_mn ?? null)} US $ mn`}
                />
            </Div>

            {/* SECTION: Outright ///////////////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell" padding="micro">
                <p className="grid-section-heading">Outright sale/purchase (US $ million)</p>
                <OutrightGrid data={data.outright} />
                {data.notes && (
                    <p className="outright-notes">{data.notes}</p>
                )}
            </Div>

            {/* SECTION: Currency forwards //////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell" padding="micro">
                <p className="grid-section-heading">Operations in currency forwards (US $ million)</p>
                <ForwardsGrid data={data.forwards} />
            </Div>

            {/* SECTION: Maturity breakdown /////////////////////////////////////////////////////////////////// */}
            <Div className="table-cell grid-cell" padding="micro">
                <p className="grid-section-heading">Maturity breakdown of outstanding forwards (US $ million)</p>
                <ForwardsMaturityGrid data={data.forwards_maturity} />
            </Div>
        </Article>
    );
};

export default UsdSalePurchasePage;
