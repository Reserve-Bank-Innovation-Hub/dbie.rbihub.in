"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import { Article, Heading6, Heading4, Div, Text, useTheme } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import CurveChart from "@/components/charts/CurveChart";
import HeatmapChart from "@/components/charts/HeatmapChart";
import DumbbellChart from "@/components/charts/DumbbellChart";
import ShareBarChart from "@/components/charts/ShareBarChart";
import FullDataLink from "@components/FullDataLink/FullDataLink";
import { StatTile } from "@/components/StatTile/StatTile";
import { FieldLines } from "@components/FieldLines/FieldLines";

// CHART CONFIG ========================================================================================================
import { CHART_COLORS, chartInk } from "@/components/charts/chartConfig";
import { SCHEMES } from "@/components/charts/schemes";

// LIB =================================================================================================================
import { HomePayload } from "@/lib/api/home";

// STYLES ==============================================================================================================
import "./home.css";

interface HomePageProps {
    home : HomePayload;
}

// Washes for the two rate bands on the transmission chart: each range is filled in its own
// hue at low opacity so the two do not read as one band.
const MCLR_WASH = "rgba(151, 98, 253, 0.14)";
const DEPOSIT_WASH = "rgba(3, 158, 147, 0.14)";

const HomePage : React.FC<HomePageProps> = ({home}) => {
    // The page's theme, for the few series drawn in the ink rather than a hue.
    const [ theme ] = useTheme();
    const ink = chartInk(theme);

    const series = (chart : { series : { key : string; label : string; values : (number | null)[] }[] }, key : string) =>
        chart.series.find(s => s.key === key)!;

    return (
        <Article id="home-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="title-card"
                className="grid-cell"
                padding="micro"
            >
                <img id="rbi-seal" src="/images/rbi-seal.svg" alt="RBI seal" width="96" />

                <Div>
                    <Heading4 weight="700">
                        RBI DBIE
                    </Heading4>

                    <Heading6 weight="400">
                        A database of Indian economic and financial data
                    </Heading6>
                </Div>

                <FieldLines />
            </Div>

            {/* MARKER DATA POINTS ///////////////////////////////////////////////////////////////////////////////// */}
            <Div id="markers">
                {home.markers.map((marker, index) => (
                    <Div
                        key={marker.key}
                        id={`marker${index + 1}-card`}
                        className="grid-cell marker-card"
                        padding="micro"
                    >
                        <StatTile
                            sparkId={marker.key}
                            label={marker.label}
                            value={marker.value}
                            unit={marker.unit}
                            asOf={marker.as_of}
                            delta={marker.delta}
                            previous={marker.previous}
                            spark={marker.spark}
                        />
                    </Div>
                ))}
            </Div>

            {/* ECONOMIC INDICATORS //////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="economic-indicators"
                className="section-heading"
                padding="micro"
            >
                <Heading6>
                    Economic indicators
                </Heading6>
            </Div>

            <Div id="gdp-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.gdp.dates}
                        series={[
                            {...series(home.charts.gdp, "real"), type : "bar", colourBySign : true},
                            {...series(home.charts.gdp, "nominal"), width : 1.5},
                        ]}
                        title="Real GDP growth, quarterly"
                        yAxisTitle="% year-on-year"
                        valueDecimals={1}
                        valueSuffix="%"
                        defaultVisible={[ "real" ]}
                        exportName="gdp"
                        rangeButtons={[ "1Y", "5Y", "10Y", "All" ]}
                        showRangeSlider={false}
                        scheme={SCHEMES.gdp}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/tables/quarterly-gross-domestic-product-at-market-price" />
            </Div>

            <Div id="contributions-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.contributions.dates}
                        series={[
                            {...series(home.charts.contributions, "pfce"),  type : "bar", stack : "gdp"},
                            {...series(home.charts.contributions, "gfce"),  type : "bar", stack : "gdp"},
                            {...series(home.charts.contributions, "gfcf"),  type : "bar", stack : "gdp"},
                            {...series(home.charts.contributions, "netex"), type : "bar", stack : "gdp"},
                            {...series(home.charts.contributions, "other"), type : "bar", stack : "gdp"},
                            {...series(home.charts.contributions, "total"), color : ink.primary, markers : true, width : 2},
                        ]}
                        title="Contributions to GDP growth, quarterly"
                        yAxisTitle="Percentage points of year-on-year growth"
                        valueDecimals={1}
                        valueSuffix=" pp"
                        exportName="gdp-contributions"
                        rangeButtons={[ "1Y", "5Y", "10Y", "All" ]}
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/tables/quarterly-gross-domestic-product-at-market-price" />
            </Div>

            <Div id="inflation-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.inflation.dates}
                        series={home.charts.inflation.series}
                        title="Inflation"
                        yAxisTitle="% year-on-year"
                        valueDecimals={2}
                        valueSuffix="%"
                        emphasis={[ "cpi" ]}
                        bands={[ {from : 2, to : 6, label : "Tolerance band, 2–6%"} ]}
                        referenceLines={[ {value : 4, label : "Target, 4%"} ]}
                        exportName="inflation"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="corridor-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.corridor.dates}
                        series={[
                            {...series(home.charts.corridor, "floor"), width : 1.5},
                            {...series(home.charts.corridor, "ceiling"), width : 1.5},
                            series(home.charts.corridor, "repo"),
                            series(home.charts.corridor, "call"),
                        ]}
                        title="Policy rate corridor"
                        yAxisTitle="%"
                        valueDecimals={2}
                        valueSuffix="%"
                        emphasis={[ "call", "repo" ]}
                        areaBetween={[ {lower : "floor", upper : "ceiling"} ]}
                        exportName="corridor"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="cpi-heatmap-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <HeatmapChart
                        columns={home.charts.cpi_heatmap.months}
                        rows={home.charts.cpi_heatmap.rows}
                        title="CPI inflation by group, last three years"
                        midpoint={4}
                        span={14}
                        valueDecimals={2}
                        valueSuffix="%"
                        colourBarTitle="% year-on-year"
                        exportName="cpi-heatmap"
                        height="fill"
                    />
                </Div>

                <Text size="tiny" isSubtext className="home-chart-note">
                    Colour runs from −10% to 18% year-on-year, centred on the 4% target, and anything beyond
                    either end takes the end colour. The 2012=100 series ends in December 2025.
                </Text>

                <FullDataLink fullData="/prices/consumer-price-index" />
            </Div>

            {/* MONEY AND BANKING ////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="money-and-banking"
                className="section-heading"
                padding="micro"
            >
                <Heading6>
                    Money and banking
                </Heading6>
            </Div>

            <Div id="yields-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.yields.dates}
                        series={home.charts.yields.series}
                        title="Government securities yields"
                        yAxisTitle="%"
                        valueDecimals={2}
                        valueSuffix="%"
                        exportName="yields"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="yield-curve-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <CurveChart
                        categories={home.charts.yield_curve.tenors}
                        curves={home.charts.yield_curve.curves}
                        title="Yield curve, then and now"
                        xAxisTitle="Tenor"
                        yAxisTitle="%"
                        valueDecimals={2}
                        valueSuffix="%"
                        exportName="yield-curve"
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="transmission-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.transmission.dates}
                        series={[
                            {...series(home.charts.transmission, "mclr_low"),     color : CHART_COLORS.purpleDark, width : 1.5},
                            {...series(home.charts.transmission, "mclr_high"),    color : CHART_COLORS.purpleDark, width : 1.5, hideFromLegend : true, noEndLabel : true},
                            {...series(home.charts.transmission, "deposit_low"),  color : CHART_COLORS.tealMid, width : 1.5},
                            {...series(home.charts.transmission, "deposit_high"), color : CHART_COLORS.tealMid, width : 1.5, hideFromLegend : true, noEndLabel : true},
                            {...series(home.charts.transmission, "repo"),         color : CHART_COLORS.yellowDark},
                        ]}
                        title="Monetary transmission"
                        yAxisTitle="%"
                        valueDecimals={2}
                        valueSuffix="%"
                        areaBetween={[
                            {lower : "mclr_low", upper : "mclr_high", colour : MCLR_WASH},
                            {lower : "deposit_low", upper : "deposit_high", colour : DEPOSIT_WASH},
                        ]}
                        exportName="transmission"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="liquidity-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.liquidity.dates}
                        series={[
                            {
                                key          : "monthly",
                                label        : "Monthly average",
                                values       : home.charts.liquidity.monthly.values,
                                dates        : home.charts.liquidity.monthly.dates,
                                type         : "bar",
                                colourBySign : true,
                            },
                            {...series(home.charts.liquidity, "net"), color : ink.deemphasis, width : 1},
                        ]}
                        title="Liquidity operations"
                        yAxisTitle="₹ lakh crore"
                        valueDecimals={2}
                        defaultVisible={[ "monthly" ]}
                        exportName="liquidity"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <Text size="tiny" isSubtext className="home-chart-note">
                    Positive is liquidity the Reserve Bank put into the system, negative liquidity it took out.
                </Text>

                <FullDataLink fullData="/banking/liquidity-operations" />
            </Div>

            <Div id="credit-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.credit.dates}
                        series={home.charts.credit.series}
                        title="Credit, deposits and money supply"
                        yAxisTitle="% year-on-year"
                        valueDecimals={2}
                        valueSuffix="%"
                        exportName="credit"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/select-economic-indicators" />
            </Div>

            <Div id="credit-by-sector-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <DumbbellChart
                        rows={home.charts.credit_by_sector.rows.map(r => ({
                            key : r.key, label : r.label, current : r.growth, previous : r.previous,
                        }))}
                        currentLabel={home.charts.credit_by_sector.as_of}
                        previousLabel={home.charts.credit_by_sector.previous_as_of}
                        title="Credit growth by sector"
                        xAxisTitle="% year-on-year"
                        valueDecimals={1}
                        valueSuffix="%"
                        exportName="credit-by-sector"
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/banking/bank-credit-by-sector" />
            </Div>

            {/* PAYMENT SYSTEMS //////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="payment-systems"
                className="section-heading"
                padding="micro"
            >
                <Heading6>
                    Payment systems
                </Heading6>
            </Div>

            <Div id="upi-value-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.upi_value.dates}
                        series={[ {...series(home.charts.upi_value, "value"), type : "bar"} ]}
                        title="UPI value, monthly"
                        yAxisTitle="₹ lakh crore"
                        valueDecimals={2}
                        exportName="upi-value"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/payments/payment-system-indicators" />
            </Div>

            <Div id="upi-volume-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.upi_volume.dates}
                        series={[ {...series(home.charts.upi_volume, "volume"), type : "bar", color : CHART_COLORS.tealMid} ]}
                        title="UPI volume, monthly"
                        yAxisTitle="Crore transactions"
                        valueDecimals={1}
                        exportName="upi-volume"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/payments/payment-system-indicators" />
            </Div>

            <Div id="payments-mix-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <ShareBarChart
                        groups={home.charts.payments_mix.months}
                        categories={home.charts.payments_mix.instruments}
                        title="Retail payments mix, by transaction volume"
                        xAxisTitle="Share of retail payment volume"
                        valueDecimals={1}
                        exportName="payments-mix"
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/payments/payment-system-indicators" />
            </Div>

            {/* EXTERNAL SECTOR //////////////////////////////////////////////////////////////////////////////////// */}
            <Div
                id="external-sector"
                className="section-heading"
                padding="micro"
            >
                <Heading6>
                    External sector
                </Heading6>
            </Div>

            <Div id="usd-inr-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.usd_inr.dates}
                        series={home.charts.usd_inr.series}
                        title="USD/INR exchange rate"
                        yAxisTitle="₹ per US$"
                        valueDecimals={2}
                        exportName="usd-inr"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/indicators/exchange-rates" />
            </Div>

            <Div id="trade-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.trade.dates}
                        series={[
                            series(home.charts.trade, "exports"),
                            series(home.charts.trade, "imports"),
                            {...series(home.charts.trade, "balance"), fillToZero : true, width : 1.5},
                        ]}
                        title="Foreign trade, monthly"
                        yAxisTitle="US$ billion"
                        valueDecimals={2}
                        exportName="trade"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/external/foreign-trade" />
            </Div>

            <Div id="flows-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.flows.dates}
                        series={[
                            {...series(home.charts.flows, "fdi"), type : "bar", stack : "flows"},
                            {...series(home.charts.flows, "portfolio"), type : "bar", stack : "flows"},
                            {...series(home.charts.flows, "rolling12"), color : ink.secondary, width : 2},
                        ]}
                        title="Foreign investment flows, monthly"
                        yAxisTitle="US$ billion"
                        valueDecimals={2}
                        exportName="flows"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/external/foreign-investment-inflows-bulletin" />
            </Div>

            <Div id="reserves-card" className="grid-cell home-chart-card has-full-view" padding="micro">
                <Div className="home-chart-wrapper">
                    <TimeSeriesChart
                        dates={home.charts.reserves.dates}
                        series={[
                            {...series(home.charts.reserves, "fca"),  areaStack : "reserves"},
                            {...series(home.charts.reserves, "gold"), areaStack : "reserves"},
                            {...series(home.charts.reserves, "sdr"),  areaStack : "reserves"},
                            {...series(home.charts.reserves, "rtp"),  areaStack : "reserves", endLabelPrefix : "Total "},
                        ]}
                        title="Foreign exchange reserves"
                        yAxisTitle="US$ billion"
                        valueDecimals={2}
                        exportName="reserves"
                        showRangeSlider={false}
                        height="fill"
                    />
                </Div>

                <FullDataLink fullData="/indicators/forex-reserves" />
            </Div>
        </Article>
    );
};

export default HomePage;
