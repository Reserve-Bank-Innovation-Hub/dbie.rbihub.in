"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Callout, Div, Header, Heading4, Heading5, Heading6, Text } from "fictoan-react";

// STYLES ==============================================================================================================
import "./docs.css";

const DOC_PAGES = [
    {
        linkTo      : "/docs/using-the-site",
        label       : "Using the site",
        description : "Finding tables in DBIE's menus and the themes, reading the charts and grids, searching, downloading.",
    },
    {
        linkTo      : "/docs/mcp",
        label       : "AI access via MCP",
        description : "Let Claude or any MCP client search and fetch the tables and series on this site's pages.",
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
                        How this site works, and how to use it — in a browser, from an AI assistant, or through
                        the data API.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        What this is
                    </Heading5>

                    <Text marginBottom="nano">
                        This site is a mirror of the Reserve Bank of India&rsquo;s{" "}
                        <a href="https://data.rbi.org.in" target="_blank" rel="noopener noreferrer">
                            Database on Indian Economy
                        </a>{" "}
                        (DBIE). Everything DBIE publishes is scraped into one Postgres database — 1,033 tables as
                        of 18-09-2026: the 252 SDMX Data Query datasets and 781 report tables from the Statistics
                        and Publications menus, with DBIE&rsquo;s own catalogue and code lists — and served two
                        ways.
                    </Text>

                    <ul>
                        <li>
                            <strong>Curated pages</strong>{" "}— the themes, the Handbook, the Indicators and the
                            Stories carry charts and grids pre-rendered from a verified data release: JSON the
                            processors produce from DBIE&rsquo;s exports and check byte-for-byte against committed
                            oracles before it is published.
                        </li>
                        <li>
                            <strong>The database, live</strong>{" "}— <Link href="/statistics">Statistics</Link>,{" "}
                            <Link href="/publications">Publications</Link>{" "}and <Link href="/tables">Tables</Link>{" "}
                            open any loaded table straight from a read-only data API at{" "}
                            <code>data-api.dbie.rbihub.in</code>, which anyone can call.
                        </li>
                    </ul>

                    <Text marginBottom="micro">
                        The scrapers, the loaders, the processors and the API are all in the{" "}
                        <a href="https://github.com/Reserve-Bank-Innovation-Hub/dbie.rbihub.in" target="_blank" rel="noopener noreferrer">
                            open-source repository
                        </a>, whose docs folder says how to run them.
                    </Text>

                    <Callout kind="info" marginBottom="micro">
                        <Text>
                            <strong>Data vintage</strong>{" "}— pages reflect the last scrape of the DBIE portal,
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
