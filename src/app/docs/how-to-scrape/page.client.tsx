"use client";

// REACT CORE ==========================================================================================================
import React from "react";
import Link from "next/link";

// UI ==================================================================================================================
import {
    Article, Callout, CodeBlock, Div, Divider, Header, Heading4, Heading5, Heading6, Table, Text,
} from "fictoan-react";

const SCRAPE_SNIPPET = `git clone https://github.com/Reserve-Bank-Innovation-Hub/dbie.rbihub.in.git
cd dbie.rbihub.in
pnpm install

pnpm data:fetch        # restore the latest archived scrape into data/ (public bucket, no credentials)
pnpm scrape            # all 252 SDMX datasets over plain HTTP (about ten minutes; resumable)
pnpm data:ingest       # file the CSVs into data/sdmx/ under readable names
pnpm scrape:reports    # export the Statistics and Publications report tables (resumable)
pnpm scrape:codelists  # dimension code → label lists, one file per dataset
pnpm scrape:report     # review what changed against the previous scrape`;

const FILTER_SNIPPET = `pnpm scrape -- --dsd EXT_DBT_RT_RN,FR_EXG_RESV_RN --from 2020-01-01
pnpm scrape -- --sector "External Sector" --sub "External Debt" --limit 5
pnpm scrape -- --retry-failures            # only the elements whose last status is not ok
pnpm scrape -- --dry-run                   # print the plan and the date windows only

node scripts/export-reports.mjs --ids 1200,1302
node scripts/export-reports.mjs --section Publication --subsection "Monthly RBI Bulletin" --select all-tables`;

const LOAD_SNIPPET = `pnpm db:load       # schema, then the SDMX datasets, report tables, code lists and catalogue
pnpm db:check      # read random rows back from Postgres and compare them with the files
pnpm data:archive  # archive the scrape's raw files to S3 under their date`;

const PIPELINE_SNIPPET = `DBIE
  │  pnpm scrape · pnpm scrape:reports · pnpm scrape:codelists
  ▼
data/                      raw files: SDMX CSVs, report exports, code lists (not in git)
  ├─ pnpm db:load       ▶  Postgres, the system of record
  │                           └─ data API  ▶  the Statistics, Publications and Tables pages
  ├─ pnpm data:archive  ▶  s3://dbie-common-scrapes/scrapes/<date>/
  └─ pnpm data:release  ▶  processors → oracles → s3://dbie-common-site-data/releases/<version>/
                                └─ pnpm data:pull at build time  ▶  the curated pages, pre-rendered`;

const REFRESH_SNIPPET = `pnpm scrape && pnpm data:ingest   # the SDMX datasets
pnpm scrape:reports               # the report tables
pnpm scrape:codelists             # the code lists
pnpm scrape:report                # review what changed
pnpm db:load                      # load into Postgres, every table verified against its file
pnpm data:archive                 # archive the raw files under the scrape date
pnpm data:release                 # build, verify and publish the site's data release; rebuild the site
git commit                        # catalogues, code lists and oracles — the raw files stay out of git`;

const API_EXAMPLE = `https://data-api.dbie.rbihub.in/api/tables/financial_sector/bmc_m_rn/rows?comp_rn=CMS1101&from=2024-04-01&labels=1`;

const HowToScrapePage = () => {
    return (
        <Article id="docs-how-to-scrape-page" className="docs-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        How to scrape
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Running the scrapers, loading the database, publishing a data release, and reading it
                        all back through the data API.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        Where the data comes from
                    </Heading5>

                    <Text marginBottom="nano">
                        The DBIE portal has two data surfaces, and both are scraped. The <strong>SDMX Data Query
                        wizard</strong> is an Angular front end over a JSON gateway that encrypts most request
                        fields with constants baked into its bundle; that cipher is reimplemented in{" "}
                        <code>scripts/lib/dbie-gateway.mjs</code>, so the scraper speaks to the gateway directly,
                        with no browser, and downloads each of the 252 datasets as SDMX CSV in a few seconds.
                    </Text>

                    <Text marginBottom="nano">
                        The <strong>Statistics and Publications menus</strong> are SAP BusinessObjects Web
                        Intelligence documents with no SDMX equivalent. <code>scripts/export-reports.mjs</code>{" "}
                        drives the portal&rsquo;s own REST layer the way its viewer does: a guest SAP session, the
                        document, its periods, and an export of every tab as a CSV and xlsx grid. Guest sessions
                        are rationed, so the exporter paces itself and never runs twice at once.
                    </Text>

                    <Text marginBottom="micro">
                        A third, smaller fetch takes each dataset&rsquo;s <strong>code lists</strong> — dimension
                        code to label, with hierarchy — so that the codes in the data can be explained.
                    </Text>

                    <Heading5 weight="700" marginBottom="nano">
                        Running it
                    </Heading5>

                    <CodeBlock
                        source={SCRAPE_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="nano">
                        Progress lands in <code>data/scrape-manifest.json</code> — one entry per dataset, marked{" "}
                        <code>ok</code>, <code>export-error</code>, <code>no-details</code> or <code>error</code> —
                        and in <code>data/reports-manifest.json</code> for the report exports. Re-running skips
                        what already succeeded, so an interrupted scrape just resumes; delete an entry, or pass{" "}
                        <code>--retry-failures</code>, to redo it. To scrape selectively:
                    </Text>

                    <CodeBlock
                        source={FILTER_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="micro">
                        The raw files stay out of git. Every scrape is archived to a public bucket under its date,
                        with a manifest of every file&rsquo;s size and hash, and <code>pnpm data:fetch</code>{" "}
                        restores the latest one into a fresh clone.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        The database — the system of record
                    </Heading5>

                    <CodeBlock
                        source={LOAD_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="nano">
                        Everything scraped is loaded into one Postgres database, in eight schemas named for
                        DBIE&rsquo;s sectors plus <code>meta</code>. Each SDMX dataset becomes a typed table named
                        by its DBIE code (<code>financial_sector.bmc_m_rn</code>); each report becomes the faithful
                        grid of its export, one row per spreadsheet row, title and header rows included
                        (<code>financial_sector.r100_commercial_bank_survey</code>). <code>meta.catalogue</code>{" "}
                        has one row per DBIE menu entry with its load status, and <code>meta.sdmx_codelist</code>{" "}
                        the labels behind every dimension code.
                    </Text>

                    <Text marginBottom="micro">
                        Every loader verifies a table against its file — row count, the exact sum of the values,
                        the date range, a fingerprint of the text — before it records it, and a mismatch stops the
                        run. Loading needs the loader role&rsquo;s secret and the project&rsquo;s private network,
                        so it is for the project&rsquo;s own runs; everyone else reads the database through the
                        data API below.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Processors and oracles — the curated pages
                    </Heading5>

                    <Text marginBottom="nano">
                        A <strong>processor</strong> is a small, dependency-light Node script in{" "}
                        <code>data/processors/</code> — one per curated page — that turns source files into exactly
                        the JSON its page renders. The sources are DBIE&rsquo;s own report exports: the spreadsheets
                        kept under <code>data/publications/</code> and <code>data/sources/</code>, refreshed by
                        copying the scrape&rsquo;s export over the committed file, and the SDMX CSVs{" "}
                        <code>pnpm data:fetch</code> restores. There are about a hundred of them.
                    </Text>

                    <Text marginBottom="micro">
                        Every processor is <strong>self-checking</strong>: it asserts hard-coded anchor
                        values — a known figure at a known date, expected row counts, expected column sets —
                        and exits non-zero if the source&rsquo;s shape has drifted. A silent format change
                        upstream becomes a loud build failure here, not a wrong number on a page.
                    </Text>

                    <Text marginBottom="nano">
                        An <strong>oracle</strong> is a committed, known-good copy of a processor&rsquo;s
                        output, kept in <code>data/processors/oracles/</code>. <code>pnpm data:verify</code>{" "}
                        re-runs the comparison for every dataset in one of two modes:
                    </Text>

                    <ul>
                        <li>
                            <strong>exact</strong> — the source is frozen, so the output must match the
                            oracle byte-for-byte. Any difference fails the check.
                        </li>
                        <li>
                            <strong>fresh</strong> — the source has been re-scraped since the oracle was
                            captured, so the oracle serves as a shape-and-history reference: the structure
                            must match and the historical observations must still agree, while newer
                            observations are allowed to extend the series.
                        </li>
                    </ul>

                    <Text marginBottom="micro">
                        <code>pnpm data:release</code> runs the processors, verifies them, and uploads the JSON to
                        a versioned folder in a public bucket with a manifest of every file&rsquo;s size and hash;
                        it refuses to publish unless both checks pass. A site build downloads the current release
                        with <code>pnpm data:pull</code>, checks every file against the manifest, pre-renders the
                        pages from it and drops the folder again: the browser fetches <code>/data/*.json</code>{" "}
                        from the same release. Every site branch&rsquo;s next build picks up the newest release
                        without a code change.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        The pipeline, end to end
                    </Heading5>

                    <CodeBlock
                        source={PIPELINE_SNIPPET}
                        marginBottom="micro"
                    />

                    <Heading5 weight="700" marginBottom="nano">
                        Refreshing the data, start to finish
                    </Heading5>

                    <CodeBlock
                        source={REFRESH_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Reading the database — the data API
                    </Heading5>

                    <Text marginBottom="nano">
                        <code>https://data-api.dbie.rbihub.in</code> is a read-only API over the database. Every
                        endpoint is a <code>GET</code>, answers JSON, allows any origin and needs no key; the
                        answers are cached for five minutes, since the data changes only when a load runs.
                    </Text>

                    <Table bordersFor="rows" isFullWidth marginBottom="micro">
                        <thead>
                            <tr>
                                <th>Endpoint</th>
                                <th>What it returns</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>/api/tables</code></td>
                                <td>The loaded tables; filter by <code>schema</code>, <code>source</code> or a word in the title with <code>q</code></td>
                            </tr>
                            <tr>
                                <td><code>/api/tables/&#123;schema&#125;/&#123;table&#125;</code></td>
                                <td>One table: its columns and types, DBIE title and path, dimensions, and provenance</td>
                            </tr>
                            <tr>
                                <td><code>…/rows</code></td>
                                <td>A page of rows; equality filters on any column, <code>from</code> and <code>to</code> on the period, <code>order</code>, <code>limit</code>, <code>offset</code>, and <code>labels=1</code> for the code lists&rsquo; labels</td>
                            </tr>
                            <tr>
                                <td><code>…/csv</code></td>
                                <td>The table, or the filtered slice of it, as a CSV download; no row limit</td>
                            </tr>
                            <tr>
                                <td><code>/api/codelists/&#123;dsd&#125;</code></td>
                                <td>A dataset&rsquo;s code lists: each dimension&rsquo;s codes with label, level and parent</td>
                            </tr>
                            <tr>
                                <td><code>/api/catalogue</code></td>
                                <td>DBIE&rsquo;s menu entries and datasets with their load status</td>
                            </tr>
                            <tr>
                                <td><code>/api/search</code></td>
                                <td><code>q</code> against titles, menu paths and code-list labels</td>
                            </tr>
                        </tbody>
                    </Table>

                    <Text marginBottom="nano">
                        The money-stock components since April 2024, with their labels:
                    </Text>

                    <CodeBlock
                        source={API_EXAMPLE}
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="micro">
                        The parameters, table shapes and more examples are in <code>docs/data-api.md</code> in{" "}
                        <a href="https://github.com/Reserve-Bank-Innovation-Hub/dbie.rbihub.in" target="_blank" rel="noopener noreferrer">
                            the repository
                        </a>. The <Link href="/tables">Tables</Link> page is a browser over the same API.
                    </Text>

                    <Callout kind="warning">
                        <Text>
                            <strong>Known limitations</strong> — daily datasets carry no start date on the portal,
                            so their window starts at <code>--daily-from</code>; alphanumeric series such as call
                            money rates fail DBIE&rsquo;s CSV export and are kept from the portal&rsquo;s JSON
                            route instead; prompted report documents hold at most 50 choices, because the
                            BusinessObjects layer returns at most 50 values for a prompt; and if DBIE rotates the
                            cipher constants in its bundle, the scraper&rsquo;s self-check fails at start-up and{" "}
                            <code>docs/scraper.md</code> says how to refresh them.
                        </Text>
                    </Callout>
                </Div>
            </Div>
        </Article>
    );
};

export default HowToScrapePage;
