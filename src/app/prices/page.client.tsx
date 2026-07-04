"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
    {
        linkTo      : "/prices/consumer-price-index",
        label       : "Consumer price index",
        description : "CPI for rural, urban and combined, by commodity group (base 2010 = 100).",
    },
    {
        linkTo      : "/prices/other-consumer-price-indices",
        label       : "Other consumer price indices",
        description : "CPI for industrial workers and agricultural/rural labourers, across base years.",
    },
    {
        linkTo      : "/prices/gold-and-silver-prices",
        label       : "Gold and silver prices",
        description : "Monthly average price of standard gold and silver in Mumbai.",
    },
    {
        linkTo      : "/prices/wholesale-price-index",
        label       : "Wholesale price index",
        description : "WPI across the commodity taxonomy, by base year.",
    },
];

const PricesPage = () => {
    return (
        <Article id="prices-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Prices
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Price statistics — consumer and wholesale indices, and bullion prices.
                    </Heading6>
                </Div>
            </Div>

            {/* TABLES ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Row marginTop="micro">
                {TABLES.map(table => (
                    <Portion key={table.linkTo} desktopSpan="half" mobileSpan="whole">
                        <Link href={table.linkTo}>
                            <Card padding="micro" shape="rounded" isFullHeight>
                                <Text weight="600" marginBottom="nano">{table.label}</Text>
                                <Text opacity="60" size="small">{table.description}</Text>
                            </Card>
                        </Link>
                    </Portion>
                ))}
            </Row>
        </Article>
    );
};

export default PricesPage;
