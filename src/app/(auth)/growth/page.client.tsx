"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Card, Div, Heading4, Heading6, Text, Row, Portion } from "fictoan-react";

const TABLES = [
    {
        linkTo      : "/growth/index-of-industrial-production",
        label       : "Index of industrial production",
        description : "IIP by sectoral and use-based classification (base 2011-12 = 100).",
    },
];

const GrowthPage = () => {
    return (
        <Article id="growth-page" className="page-grid">
            {/* HEADER ///////////////////////////////////////////////////////////////////////////////////////////// */}
            <Div id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Growth
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Output and production indicators.
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

export default GrowthPage;
