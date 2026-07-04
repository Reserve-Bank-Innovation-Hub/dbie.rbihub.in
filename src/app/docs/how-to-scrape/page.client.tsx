"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import {
    Article, Callout, CodeBlock, Div, Divider, Header, Heading4, Heading5, Heading6, Text,
} from "fictoan-react";

const SCRAPE_SNIPPET = `git clone https://github.com/Reserve-Bank-Innovation-Hub/dbie.rbihub.in.git
cd dbie.rbihub.in
pnpm install     # includes Playwright

pnpm scrape:tree # (re)build sdmx-tree.json — the master list of elements
pnpm scrape      # scrape everything (~2 hours; resumable)`;

const FILTER_SNIPPET = `node scripts/scrape-sdmx.mjs --sector "External Sector"
node scripts/scrape-sdmx.mjs --sub "External Debt"
node scripts/scrape-sdmx.mjs --dsd EXT_DBT_RT_RN
node scripts/scrape-sdmx.mjs --limit 10
node scripts/scrape-sdmx.mjs --headful   # watch the browser while debugging`;

const PIPELINE_SNIPPET = `data/sdmx/, data/publications/       committed source files
        │
        ▼   pnpm data:build
data/processors/*.mjs                one self-checking script per dataset
        │
        ▼   pnpm data:verify
data/processors/oracles/*.json       byte-exact comparison — must ALL PASS
        │
        ▼   pnpm data:sync
public/data/*.json                   what the pages render`;

const REFRESH_SNIPPET = `pnpm scrape          # refresh the raw CSVs (staged outside git)
pnpm data:ingest     # file them into the committed data/sdmx/
pnpm data:build      # regenerate the site's JSON
pnpm data:verify     # every processor and oracle check must pass
pnpm data:sync       # copy into public/data/ for a local look
pnpm dev             # eyeball the affected pages, then commit`;

const HowToScrapePage = () => {
    return (
        <Article id="docs-how-to-scrape-page" className="docs-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        How to scrape
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Running the DBIE scraper, and how processors and oracles keep the data honest.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Heading5 weight="700" marginBottom="nano">
                        Where the data comes from
                    </Heading5>

                    <Text marginBottom="nano">
                        The DBIE portal exposes two data surfaces. Its <strong>Reports</strong> section is
                        auth-walled — guests are redirected to a login page. Its <strong>SDMX Data
                        Query wizard</strong> is guest-accessible and can export any series as SDMX CSV.
                        That wizard is what we scrape.
                    </Text>

                    <Text marginBottom="micro">
                        The scraper drives the wizard with Playwright — a real browser, not raw HTTP —
                        because the portal encrypts its query payloads in the browser and only offers the
                        CSV download from the rendered output view. For each of the ~250 elements it selects
                        the element in the sector tree, fills the date range, selects all dimensions, runs
                        the query and downloads the CSV. About 30 seconds per element.
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
                        Progress lands in <code>data/scrape-manifest.json</code> — one entry per element,
                        marked <code>ok</code>, <code>no-record</code> or <code>error</code>. Re-running
                        skips what already succeeded, so an interrupted scrape just resumes; delete an
                        element&rsquo;s entry to force a re-scrape. To scrape selectively:
                    </Text>

                    <CodeBlock
                        source={FILTER_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="micro">
                        Scraped CSVs land outside git. <code>pnpm data:ingest</code> then files them into
                        the committed <code>data/sdmx/</code> tree under human-readable names — that
                        commit is what the rest of the pipeline builds from.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Processors — source files to page JSON
                    </Heading5>

                    <Text marginBottom="nano">
                        A <strong>processor</strong> is a small, dependency-light Node script in{" "}
                        <code>data/processors/</code> — one per dataset — that turns committed source files
                        (SDMX CSVs, publication spreadsheets) into exactly the JSON its page renders. There
                        are ~96 of them, producing all 345 JSON payloads the site serves.
                    </Text>

                    <Text marginBottom="micro">
                        Every processor is <strong>self-checking</strong>: it asserts hard-coded anchor
                        values — a known figure at a known date, expected row counts, expected column sets —
                        and exits non-zero if the source&rsquo;s shape has drifted. A silent format change
                        upstream becomes a loud build failure here, not a wrong number on a page.
                    </Text>

                    <Heading5 weight="700" marginBottom="nano">
                        Oracles — verified outputs
                    </Heading5>

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
                        Together they make a data refresh reviewable: sources, processors and verified
                        outputs travel through the same commit, and nothing ships that the checks
                        haven&rsquo;t passed.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        The pipeline, end to end
                    </Heading5>

                    <CodeBlock
                        source={PIPELINE_SNIPPET}
                        marginBottom="micro"
                    />

                    <Text marginBottom="micro">
                        Deployments run exactly this: the CI build executes <code>data:build</code>,{" "}
                        <code>data:verify</code> and <code>data:sync</code> before <code>next build</code>,
                        so an environment serves precisely what its branch&rsquo;s processors produce from
                        its branch&rsquo;s committed sources — and a failed oracle check fails the deploy.
                    </Text>

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

                    <Callout kind="warning">
                        <Text>
                            <strong>Known limitations</strong> — a few elements only capture part of their
                            dimension space; the wizard&rsquo;s date-input formats are inferred per frequency
                            and would break if DBIE changes its widgets; and guest sessions expire quickly,
                            so long pauses mid-wizard abort that element (the next run retries it).
                        </Text>
                    </Callout>
                </Div>
            </Div>
        </Article>
    );
};

export default HowToScrapePage;
