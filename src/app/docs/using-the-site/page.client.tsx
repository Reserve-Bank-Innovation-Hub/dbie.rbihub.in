"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import { Article, Callout, Div, Divider, Header, Heading4, Heading5, Heading6, Text } from "fictoan-react";

const UsingTheSitePage = () => {
    return (
        <Article id="docs-using-the-site-page" className="docs-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        Using the site
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Finding tables, reading the charts and grids, and searching from anywhere.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        Finding data
                    </Heading5>

                    <Text marginBottom="nano">
                        There are three ways in:
                    </Text>

                    <ul>
                        <li>
                            <strong>Browse by theme</strong> — the left nav groups datasets into Prices,
                            Growth, Markets, Banking, External, Government and Payments, alongside the
                            Handbook of Statistics, key Indicators and Publications. Each theme opens on a
                            dashboard listing its tables with a one-line description.
                        </li>
                        <li>
                            <strong>The <Link href="/tables">Tables</Link> catalogue</strong> — every one of
                            the 335 tables and series on a single page, grouped by source sector.
                        </li>
                        <li>
                            <strong>Search</strong> — press <kbd>⌘</kbd> <kbd>/</kbd> (or <kbd>Ctrl</kbd>{" "}
                            <kbd>/</kbd>) anywhere, or use Search in the nav. It matches titles, descriptions
                            and keywords across all pages, tolerating small typos.
                        </li>
                    </ul>

                    <Divider kind="secondary" marginTop="nano" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Charts
                    </Heading5>

                    <Text marginBottom="nano">
                        Time-series pages open with an interactive chart:
                    </Text>

                    <ul>
                        <li>
                            <strong>Range buttons</strong> — 3M, 1Y, 5Y, 10Y and All zoom the time axis;
                            the slider below the chart scrubs to any custom window.
                        </li>
                        <li>
                            <strong>Legend</strong> — click a series to hide or show it; double-click to
                            isolate it. Busy datasets start with only the first eight series visible — the
                            rest are one legend-click away.
                        </li>
                        <li>
                            <strong>Hover</strong> — values at the cursor&rsquo;s date, with units applied.
                        </li>
                        <li>
                            <strong>Download</strong> — the camera icon in the chart toolbar saves the
                            current view as a PNG.
                        </li>
                    </ul>

                    <Divider kind="secondary" marginTop="nano" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Grids
                    </Heading5>

                    <Text marginBottom="nano">
                        Every dataset also appears as a data grid below (or instead of) its chart:
                    </Text>

                    <ul>
                        <li>
                            <strong>Sort</strong> by clicking a column header; click again to reverse.
                        </li>
                        <li>
                            <strong>Filter</strong> any column from its header menu — large SDMX cross-tabs
                            make every dimension column filterable, which is the intended way to slice them.
                        </li>
                        <li>
                            <strong>Paginate</strong> with the controls under the grid; the page size is
                            adjustable.
                        </li>
                        <li>
                            Pages that open with a recent slice of a long series carry a{" "}
                            <strong>FULL DATA</strong> link to the complete history.
                        </li>
                    </ul>

                    <Divider kind="secondary" marginTop="nano" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Reading the numbers correctly
                    </Heading5>

                    <ul>
                        <li>
                            <strong>Units and multipliers</strong> — column headers and page metadata state
                            the unit (₹ crore, US$ million, per cent, index) — check before comparing series.
                        </li>
                        <li>
                            <strong>Observation dates</strong> — each page shows the latest period in its
                            data. Frequencies vary: some series are daily, others annual with a financial-year
                            convention (2024 usually means FY 2023-24).
                        </li>
                        <li>
                            <strong>Footnotes</strong> — where the RBI source carries footnotes, they appear
                            below the table; provisional and revised figures are marked as in the source.
                        </li>
                    </ul>

                    <Callout kind="info" marginTop="nano">
                        <Text>
                            The data here reflects the last scrape of the DBIE portal, not a live feed — see
                            the <Link href="/docs">overview</Link> on data vintage.
                        </Text>
                    </Callout>
                </Div>
            </Div>
        </Article>
    );
};

export default UsingTheSitePage;
