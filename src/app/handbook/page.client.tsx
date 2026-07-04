"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "Output and prices",
        items : [
            {
                linkTo      : "/handbook/agricultural-production-foodgrains",
                label       : "Agricultural Production — Foodgrains",
                description : "Annual production of foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs tonnes, from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/agricultural-production-major-commercial-crops",
                label       : "Agricultural Production — Major Commercial Crops",
                description : "Annual production of major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee) in lakhs tonnes, from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/annual-production-indices-of-select-items",
                label       : "Annual Production Indices of Select Items",
                description : "Annual production indices of select items (base 2011-12 = 100) covering 80 industries across primary, capital, intermediate, infrastructure/construction, and consumer goods sectors.",
            },
            {
                linkTo      : "/handbook/annual-survey-of-industries-principal-characteristics",
                label       : "Annual Survey of Industries — Principal Characteristics",
                description : "Annual Survey of Industries principal characteristics from 1990-91 onwards: factories, employment, capital, output, value added, and gross capital formation.",
            },
            {
                linkTo      : "/handbook/area-under-cultivation-foodgrains",
                label       : "Area Under Cultivation — Foodgrains",
                description : "Annual area under cultivation for foodgrains in India (rice, wheat, coarse cereals and pulses) in lakhs hectares, from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/area-under-cultivation-major-commercial-crops",
                label       : "Area Under Cultivation — Major Commercial Crops",
                description : "Annual area under cultivation for major commercial crops in India (oilseeds, sugarcane, cotton, jute, tea, coffee, tobacco) in lakhs hectares, from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/average-price-of-gold-and-silver-in-domestic-and-foreign-markets",
                label       : "Average Price of Gold and Silver in Domestic and Foreign Markets",
                description : "Annual average price of gold (Mumbai and London) and silver (Mumbai and New York) from 1970-71 onwards, with domestic-foreign price spreads.",
            },
            {
                linkTo      : "/handbook/consumer-price-index-annual-average",
                label       : "Consumer Price Index — Annual Average",
                description : "Annual average Consumer Price Index for agricultural labourers, industrial workers, and the new CPI (rural/urban/combined) from 1970-71 onwards.",
            },
            {
                linkTo      : "/handbook/implementation-of-central-sector-projects-status-end-march",
                label       : "Implementation of Central Sector Projects — Status",
                description : "Status of implementation of central sector projects (ahead, on schedule, delayed, without date of completion) across 17 sectors, end-March.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-agricultural-production-major-crops",
                label       : "Index Numbers of Agricultural Production — Major Crops",
                description : "Annual index numbers of agricultural production for major crops in India including foodgrains, oilseeds, fibres and cash crops, across three base periods.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains",
                label       : "Index Numbers of Area, Production and Yield of Foodgrains, Non — Foodgrains and All Crops in India",
                description : "Annual index numbers of area, production and yield for foodgrains, non-foodgrains and all crops in India, across three base periods from 1949-50 onwards.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-industrial-production-use-based-classification",
                label       : "Index Numbers of Industrial Production – Use — Based Classification",
                description : "Annual index numbers of industrial production by use-based classification (base 2011-12 = 100): primary goods, capital goods, intermediate goods, infrastructure/construction goods, consumer durables, and consumer non-durables.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-industrial-production",
                label       : "Index Numbers of Industrial Production",
                description : "Annual index numbers of industrial production (base 2011-12 = 100) covering mining & quarrying, manufacturing, and electricity sectors across multiple base year series.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-infrastructure-industries",
                label       : "Index Numbers of Infrastructure Industries",
                description : "Annual index numbers of eight core infrastructure industries (base 2011-12 = 100): electricity, coal, steel, cement, crude oil, petroleum refinery products, natural gas, and fertilisers.",
            },
            {
                linkTo      : "/handbook/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing",
                label       : "Index Numbers of Twenty Three Major Industry Groups of Manufacturing Sector",
                description : "Annual index numbers of twenty-three major industry groups of the manufacturing sector (base: 2011-12 = 100).",
            },
            {
                linkTo      : "/handbook/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average",
                label       : "Minimum Support Price for Foodgrains According to Crop Year",
                description : "Minimum support prices for foodgrains — paddy (common), maize, wheat, gram, arhar/tur and moong — by crop year, fair average quality, in rupees per quintal.",
            },
            {
                linkTo      : "/handbook/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair",
                label       : "Minimum Support Price for Non — Foodgrains According to Crop Year",
                description : "Minimum support prices for non-foodgrains — sugarcane, cotton, jute, groundnut, soyabean, sunflower seed, rapeseed/mustard and safflower — by crop year, in rupees per quintal.",
            },
            {
                linkTo      : "/handbook/pattern-of-land-use-and-select-inputs-for-agricultural-production",
                label       : "Pattern of Land Use and Select Inputs for Agricultural Production",
                description : "Annual data on net sown area, gross sown area, irrigated area, high yielding variety coverage, fertiliser and pesticide consumption in India from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/production-and-imports-of-crude-oil-and-petroleum-products",
                label       : "Production and Imports of Crude Oil and Petroleum Products",
                description : "Annual production and imports of crude oil and petroleum oil lubricant (POL) products in millions metric tonnes (MMT).",
            },
            {
                linkTo      : "/handbook/public-distribution-system-procurement-off-take-and-stocks",
                label       : "Public Distribution System — Procurement, Off — Take and Stocks",
                description : "Annual data on public distribution system procurement, off-take and stocks of rice and wheat in India (lakhs tonnes).",
            },
            {
                linkTo      : "/handbook/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march",
                label       : "Sector — Wise Cost Overrun of Delayed Central Sector Projects",
                description : "Sector-wise cost overrun of delayed central sector projects — number of projects, original estimate, anticipated cost and cost overrun, as at end-March.",
            },
            {
                linkTo      : "/handbook/wholesale-price-index-annual-average",
                label       : "Wholesale Price Index — Annual Average",
                description : "Annual-average wholesale price index (base 2011-12 = 100) for all commodities, primary articles, fuel & power, and manufactured products, from 1952-53 onwards.",
            },
            {
                linkTo      : "/handbook/yield-per-hectare-foodgrains",
                label       : "Yield Per Hectare — Foodgrains",
                description : "Annual yield per hectare (kg/hectare) of foodgrain crops in India — rice, wheat, coarse cereals and pulses, from 1950-51 onwards.",
            },
            {
                linkTo      : "/handbook/yield-per-hectare-major-commercial-crops",
                label       : "Yield Per Hectare — Major Commercial Crops",
                description : "Annual yield per hectare (kg/hectare) of major commercial crops in India — oilseeds, sugarcane, tea, coffee, cotton and jute, from 1950-51 onwards.",
            },
        ],
    },
    {
        title : "National income, saving, employment",
        items : [
            {
                linkTo      : "/handbook/changes-in-financial-assets-liabilities-of-the-household-sector",
                label       : "Changes in Financial Assets_Liabilities of the Household Sector",
                description : "Annual changes in financial assets and liabilities of the household sector at current prices, covering currency, bank deposits, life insurance, provident fund, shares, and more, from 1970-71 onwards.",
            },
            {
                linkTo      : "/handbook/components-of-gross-domestic-product",
                label       : "Components of Gross Domestic Product",
                description : "Annual series of GDP components at constant and current prices (base year 2011-12) in rupees crores, from 1950-51 onwards. Includes PFCE, GFCE, GFCF, exports, imports and more.",
            },
            {
                linkTo      : "/handbook/components-of-gross-value-added-at-basic-prices",
                label       : "Components of Gross Value Added At Basic Prices",
                description : "Annual series of GVA components at basic prices (constant and current prices, base year 2011-12), covering agriculture, industry, services, and GDP at market prices from 1951-52 onwards.",
            },
            {
                linkTo      : "/handbook/employment-in-public-and-organised-private-sectors",
                label       : "Employment in Public and Organised Private Sectors",
                description : "Annual employment figures for the public and organised private sectors in India (in lakhs), from 1970-71 onwards.",
            },
            {
                linkTo      : "/handbook/institutional-sector-wise-gross-capital-formation-at-current-prices",
                label       : "Institutional Sector — Wise Gross Capital Formation",
                description : "Annual institutional sector-wise gross capital formation at current prices (base year 2011–12) covering public and private corporations, general government and households.",
            },
            {
                linkTo      : "/handbook/macro-economic-aggregates-at-constant-prices",
                label       : "Macro — Economic Aggregates",
                description : "Annual macro-economic aggregates for India at constant prices (base year 2011–12) including GDP, GNI, NNI, capital formation and per-capita measures.",
            },
            {
                linkTo      : "/handbook/macro-economic-aggregates-at-current-prices",
                label       : "Macro — Economic Aggregates",
                description : "Annual macro-economic aggregates for India at current prices (base year 2011–12) including GDP, GNI, NNI, gross saving, capital formation and per-capita measures.",
            },
            {
                linkTo      : "/handbook/net-state-domestic-product-state-wise-at-constant-prices",
                label       : "Net State Domestic Product — State — wise",
                description : "Annual Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
            },
            {
                linkTo      : "/handbook/net-state-domestic-product-state-wise-at-current-prices",
                label       : "Net State Domestic Product — State — wise",
                description : "Annual Net State Domestic Product (NSDP) at current prices, state-wise, from 2011-12 onwards. Source: National Statistical Office.",
            },
            {
                linkTo      : "/handbook/net-state-value-added-by-economic-activity-at-constant-prices",
                label       : "Net State Value Added by Economic Activity",
                description : "Net State Value Added (NSVA) by economic activity at constant prices (base 2011-12) for 33 Indian states and union territories, from 2011-12 to 2024-25. Source: RBI Handbook of Statistics on Indian Economy.",
            },
            {
                linkTo      : "/handbook/net-state-value-added-by-economic-activity-at-current-prices",
                label       : "Net State Value Added by Economic Activity",
                description : "Net State Value Added (NSVA) by economic activity at current prices (base 2011-12) for 33 Indian states and union territories, from 2011-12 to 2024-25. Source: RBI Handbook of Statistics on Indian Economy.",
            },
            {
                linkTo      : "/handbook/per-capita-net-state-domestic-product-state-wise-at-constant-prices",
                label       : "Per Capita Net State Domestic Product — State — wise",
                description : "Annual per capita Net State Domestic Product (NSDP) at constant prices (base 2011-12), state-wise, from 2011-12 onwards. Source: National Statistical Office.",
            },
            {
                linkTo      : "/handbook/per-capita-net-state-domestic-product-state-wise-at-current-prices",
                label       : "Per Capita Net State Domestic Product — State — wise",
                description : "Annual per capita Net State Domestic Product (NSDP) at current prices, state-wise, from 2011-12 onwards. Source: National Statistical Office.",
            },
            {
                linkTo      : "/handbook/sector-wise-domestic-savings-at-current-prices",
                label       : "Sector — Wise Domestic Savings",
                description : "Annual sector-wise domestic savings at current prices (base year 2011–12) covering non-financial corporations, financial corporations, general government and households.",
            },
        ],
    },
];

const HandbookPage = () => {
    return (
        <Article id="handbook-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Handbook of statistics
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Annual series from the RBI’s Handbook of Statistics on Indian Economy.
                    </Heading6>
                </Div>
            </Header>

            <Div id="sections-wrapper">
                {SECTIONS.map((section, idx) => (
                    <Section key={section.title || idx} marginBottom="nano">
                        {section.title && (
                            <Div className="grid-cell section-header" padding="micro">
                                <Heading6 weight="700" className="section-title">
                                    {section.title}
                                </Heading6>
                            </Div>
                        )}

                        <Div className="section-content">
                            {section.items.map(item => (
                                <Div className="grid-cell" key={item.linkTo} padding="micro">
                                    <Link href={item.linkTo}>
                                        <Text weight="600">{item.label}</Text>

                                        {item.description && (
                                            <Text size="small" opacity="80" weight="400">
                                                {item.description}
                                            </Text>
                                        )}
                                    </Link>
                                </Div>
                            ))}
                        </Div>
                    </Section>
                ))}
            </Div>
        </Article>
    );
};

export default HandbookPage;
