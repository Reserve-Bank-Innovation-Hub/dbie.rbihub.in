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
                        Finding tables, reading the charts and grids, searching from anywhere, and taking the
                        data with you.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        Finding data
                    </Heading5>

                    <Text marginBottom="nano">
                        There are four ways in:
                    </Text>

                    <ul>
                        <li>
                            <strong>DBIE&rsquo;s own menus</strong> — <Link href="/statistics">Statistics</Link>{" "}
                            and <Link href="/publications">Publications</Link> in the nav are DBIE&rsquo;s two
                            menus. Each opens on an index of its sectors or publications; an item&rsquo;s page lays
                            out its parts as DBIE files them, down to its tables, each with DBIE&rsquo;s frequency
                            and period. A table opens in place, straight from the database.
                        </li>
                        <li>
                            <strong>Themes</strong> — Prices, Growth, Markets, Banking, External, Government and
                            Payments gather the site&rsquo;s curated pages, each a chart, a grid and notes for one
                            table, listed under the DBIE sections the tables come from. The Handbook and Indicators
                            pages are reached from those tables&rsquo; views.
                        </li>
                        <li>
                            <strong><Link href="/tables">Tables</Link></strong> — every table in the database in one
                            sidebar, Publications then Statistics, in DBIE&rsquo;s own order, with the Data Query
                            datasets in their sectors. A report is shown as DBIE lays it out, one tab at a time; an
                            SDMX dataset as a time series that its dimensions narrow. The grid is the same as on
                            every other page: sort by clicking a header, filter from its menu, page through it.
                        </li>
                        <li>
                            <strong>Search</strong> — press <kbd>⌘</kbd> <kbd>/</kbd> (or <kbd>Ctrl</kbd>{" "}
                            <kbd>/</kbd>) anywhere, or use Search in the nav. It matches titles, descriptions
                            and keywords across the curated pages and these docs, tolerating small typos. The
                            database&rsquo;s 1,033 tables are listed in the Tables sidebar and searched by the data
                            API&rsquo;s own search endpoint.
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
                            <strong>Download</strong> — a table opened from the database carries a Download CSV
                            link: the whole table, or the slice the selects have narrowed it to, straight from the
                            data API.
                        </li>
                        <li>
                            Curated pages that open with a recent slice of a long series carry a{" "}
                            <strong>FULL DATA</strong> link to the complete history.
                        </li>
                    </ul>

                    <Divider kind="secondary" marginTop="nano" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Getting the data out
                    </Heading5>

                    <Text marginBottom="micro">
                        Every table in the database is also served by a public, read-only data API at{" "}
                        <code>https://data-api.dbie.rbihub.in</code>: rows as JSON with filters and paging, the
                        whole table as CSV, DBIE&rsquo;s catalogue and code lists, and search. No key is needed.
                        The endpoints are listed on the <Link href="/docs/how-to-scrape">pipeline page</Link>, and
                        AI assistants can use the <Link href="/docs/mcp">MCP server</Link>.
                    </Text>

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
