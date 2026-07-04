"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Div, Header, Heading4, Heading6, Section, Text } from "fictoan-react";

const SECTIONS = [
    {
        title : "Monthly RBI Bulletin",
        items : [
            {
                linkTo      : "/prices/consumer-price-index",
                label       : "Consumer price index",
                description : "Monthly consumer price index (CPI) for rural, urban and combined India across base years, with year-on-year inflation",
            },
            {
                linkTo      : "/prices/other-consumer-price-indices",
                label       : "Other consumer price indices",
                description : "Consumer Price Index for Industrial Workers, Agricultural Labourers and Rural Labourers across their respective base years",
            },
            {
                linkTo      : "/prices/gold-and-silver-prices",
                label       : "Gold and silver prices",
                description : "Monthly average price of standard gold (₹ per 10 grams) and silver (₹ per kilogram) in Mumbai, from 1990 onwards.",
            },
            {
                linkTo      : "/prices/wholesale-price-index",
                label       : "Wholesale price index",
                description : "Monthly wholesale price index (Table 22) across the full commodity taxonomy, with historical base years back to 1947",
            },
        ],
    },
];

const PricesPage = () => {
    return (
        <Article id="prices-page" className="data-list-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Prices
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Price statistics — consumer and wholesale indices, and bullion prices.
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

export default PricesPage;
