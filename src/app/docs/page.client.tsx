"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Callout, Div, Header, Heading4, Heading5, Heading6, Text } from "fictoan-react";

const DOC_PAGES = [
    {
        linkTo      : "/docs/using-the-site",
        label       : "Using the site",
        description : "Finding tables, reading the charts and grids, and searching from anywhere.",
    },
    {
        linkTo      : "/docs/mcp",
        label       : "AI access via MCP",
        description : "Let Claude or any MCP client search and fetch every table on this site.",
    },
    {
        linkTo      : "/docs/how-to-scrape",
        label       : "How to scrape",
        description : "Running the DBIE scraper, and how processors and oracles keep the data honest.",
    },
];

const DocsOverviewPage = () => {
    return (
        <Article id="docs-overview-page" className="docs-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Docs
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        How this site works, and how to use it — in a browser, from an AI assistant, or by
                        running the pipeline yourself.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        What this is
                    </Heading5>

                    <Text marginBottom="nano">
                        This site is a fast, fully static mirror of the Reserve Bank of India&rsquo;s{" "}
                        <a href="https://data.rbi.org.in" target="_blank" rel="noopener noreferrer">
                            Database on Indian Economy
                        </a>{" "}
                        (DBIE) — 335 tables and series across prices, growth, financial markets, banking,
                        the external sector, government finance and payments. Every dataset gets its own
                        page with a sortable, filterable grid, and a chart wherever the data suits one.
                    </Text>

                    <Text marginBottom="micro">
                        There is no server and no database behind these pages: everything is pre-rendered
                        from JSON that a verified processing pipeline produces from scraped DBIE data. That
                        is what makes the site quick — and what makes its data trustworthy enough to check
                        byte-for-byte on every deploy.
                    </Text>

                    <Callout kind="info" marginBottom="micro">
                        <Text>
                            <strong>Data vintage</strong> — pages reflect the last scrape of the DBIE portal,
                            not a live feed. Every table page shows the latest observation period of its data,
                            so check the dates rather than assuming &ldquo;today&rdquo;.
                        </Text>
                    </Callout>

                    <Heading5 weight="700" marginBottom="nano">
                        In these docs
                    </Heading5>

                    <ul>
                        {DOC_PAGES.map(page => (
                            <li key={page.linkTo}>
                                <Link href={page.linkTo}>
                                    <Text weight="600">{page.label}</Text>
                                </Link>

                                <Text size="small" opacity="80">
                                    {page.description}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Div>
            </Div>
        </Article>
    );
};

export default DocsOverviewPage;
