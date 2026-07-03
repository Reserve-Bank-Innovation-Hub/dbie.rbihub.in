"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const HandbookPage = () => {
    return (
        <Article id="handbook-page" className="page-grid">
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Handbook of statistics
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Annual series from the RBI's Handbook of Statistics on Indian Economy.
                    </Heading6>
                </Div>
            </Div>

            <Heading6 weight="700" marginTop="micro" marginBottom="nano">
                Output and prices
            </Heading6>

            <Row>
                <Portion key="/handbook/agricultural-production-foodgrains" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/agricultural-production-foodgrains">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Agricultural Production — Foodgrains</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/agricultural-production-major-commercial-crops" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/agricultural-production-major-commercial-crops">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Agricultural Production — Major Commercial Crops</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/annual-production-indices-of-select-items" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/annual-production-indices-of-select-items">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Annual Production Indices of Select Items</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/annual-survey-of-industries-principal-characteristics" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/annual-survey-of-industries-principal-characteristics">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Annual Survey of Industries — Principal Characteristics</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/area-under-cultivation-foodgrains" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/area-under-cultivation-foodgrains">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Area Under Cultivation — Foodgrains</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/area-under-cultivation-major-commercial-crops" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/area-under-cultivation-major-commercial-crops">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Area Under Cultivation — Major Commercial Crops</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/average-price-of-gold-and-silver-in-domestic-and-foreign-markets" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/average-price-of-gold-and-silver-in-domestic-and-foreign-markets">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Average Price of Gold and Silver in Domestic and Foreign Markets</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/consumer-price-index-annual-average" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/consumer-price-index-annual-average">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Consumer Price Index — Annual Average</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/implementation-of-central-sector-projects-status-end-march" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/implementation-of-central-sector-projects-status-end-march">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Implementation of Central Sector Projects — Status</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-agricultural-production-major-crops" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-agricultural-production-major-crops">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Agricultural Production — Major Crops</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Area, Production and Yield of Foodgrains, Non — Foodgrains and All Crops in India</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-industrial-production-use-based-classification" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-industrial-production-use-based-classification">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Industrial Production – Use — Based Classification</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-industrial-production" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-industrial-production">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Industrial Production</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-infrastructure-industries" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-infrastructure-industries">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Infrastructure Industries</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Index Numbers of Twenty Three Major Industry Groups of Manufacturing Sector</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Minimum Support Price for Foodgrains According to Crop Year</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Minimum Support Price for Non — Foodgrains According to Crop Year</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/pattern-of-land-use-and-select-inputs-for-agricultural-production" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/pattern-of-land-use-and-select-inputs-for-agricultural-production">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Pattern of Land Use and Select Inputs for Agricultural Production</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/production-and-imports-of-crude-oil-and-petroleum-products" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/production-and-imports-of-crude-oil-and-petroleum-products">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Production and Imports of Crude Oil and Petroleum Products</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/public-distribution-system-procurement-off-take-and-stocks" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/public-distribution-system-procurement-off-take-and-stocks">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Public Distribution System — Procurement, Off — Take and Stocks</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Sector — Wise Cost Overrun of Delayed Central Sector Projects</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/wholesale-price-index-annual-average" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/wholesale-price-index-annual-average">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Wholesale Price Index — Annual Average</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/yield-per-hectare-foodgrains" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/yield-per-hectare-foodgrains">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Yield Per Hectare — Foodgrains</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/yield-per-hectare-major-commercial-crops" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/yield-per-hectare-major-commercial-crops">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Yield Per Hectare — Major Commercial Crops</Text>
                        </Card>
                    </Link>
                </Portion>
            </Row>

            <Heading6 weight="700" marginTop="micro" marginBottom="nano">
                National income, saving, employment
            </Heading6>

            <Row>
                <Portion key="/handbook/changes-in-financial-assets-liabilities-of-the-household-sector" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/changes-in-financial-assets-liabilities-of-the-household-sector">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Changes in Financial Assets_Liabilities of the Household Sector</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/components-of-gross-domestic-product" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/components-of-gross-domestic-product">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Components of Gross Domestic Product</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/components-of-gross-value-added-at-basic-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/components-of-gross-value-added-at-basic-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Components of Gross Value Added At Basic Prices</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/employment-in-public-and-organised-private-sectors" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/employment-in-public-and-organised-private-sectors">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Employment in Public and Organised Private Sectors</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/institutional-sector-wise-gross-capital-formation-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/institutional-sector-wise-gross-capital-formation-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Institutional Sector — Wise Gross Capital Formation</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/macro-economic-aggregates-at-constant-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/macro-economic-aggregates-at-constant-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Macro — Economic Aggregates</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/macro-economic-aggregates-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/macro-economic-aggregates-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Macro — Economic Aggregates</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/net-state-domestic-product-state-wise-at-constant-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/net-state-domestic-product-state-wise-at-constant-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Net State Domestic Product — State — wise</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/net-state-domestic-product-state-wise-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/net-state-domestic-product-state-wise-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Net State Domestic Product — State — wise</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/net-state-value-added-by-economic-activity-at-constant-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/net-state-value-added-by-economic-activity-at-constant-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Net State Value Added by Economic Activity</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/net-state-value-added-by-economic-activity-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/net-state-value-added-by-economic-activity-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Net State Value Added by Economic Activity</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/per-capita-net-state-domestic-product-state-wise-at-constant-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/per-capita-net-state-domestic-product-state-wise-at-constant-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Per Capita Net State Domestic Product — State — wise</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/per-capita-net-state-domestic-product-state-wise-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/per-capita-net-state-domestic-product-state-wise-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Per Capita Net State Domestic Product — State — wise</Text>
                        </Card>
                    </Link>
                </Portion>
                <Portion key="/handbook/sector-wise-domestic-savings-at-current-prices" desktopSpan="half" mobileSpan="whole">
                    <Link href="/handbook/sector-wise-domestic-savings-at-current-prices">
                        <Card padding="micro" shape="rounded" isFullHeight>
                            <Text weight="600">Sector — Wise Domestic Savings</Text>
                        </Card>
                    </Link>
                </Portion>
            </Row>
        </Article>
    );
};

export default HandbookPage;
