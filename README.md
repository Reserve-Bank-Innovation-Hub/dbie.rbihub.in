# dbie.rbihub.in

A modern, fully static web platform for exploring economic data from the Reserve Bank of
India's [Database on Indian Economy](https://data.rbi.org.in) (DBIE)—plus the scraping and
processing pipeline that keeps its data fresh. 335 tables and series across prices, growth,
markets, banking, external sector, government finance and payments, each with a searchable
page, AG Grid table and (where it fits) a Plotly chart—and an MCP server so AI assistants
can use the data too.

Built by the [Reserve Bank Innovation Hub](https://rbihub.in). MIT licensed.

## Quickstart

```bash
pnpm install

# get the site's data (the current release, built from the database's source files)
pnpm data:pull

pnpm dev            # run the site at localhost:3000
pnpm build          # static production build (SSG)
```

### Scraping DBIE yourself

```bash
pnpm data:fetch       # restore the latest scrape's raw files from the S3 archive into data/ (no credentials needed)
pnpm scrape           # scrape all 252 SDMX series from DBIE over plain HTTP (~10 min; resumable)
pnpm data:ingest      # file the scraped CSVs into data/sdmx/ under readable names
pnpm scrape:report    # review what changed against the previous scrape's CSVs
pnpm scrape:catalogue # refresh the Statistics + Publications table catalogue (data/reports-catalogue.json)
pnpm scrape:reports   # export report tables (Statistics + Publications menus) to data/reports/ via the BusinessObjects REST layer
pnpm scrape:codelists # fetch the SDMX dimension code → label lists (data/sdmx-codelists/)
pnpm db:load          # load everything into the project's Postgres, the system of record (docs/database.md)
pnpm data:archive     # archive the scrape's raw files to S3 under their date
pnpm data:release     # build + verify the site bundle and publish it as a release
```

See [`docs/scraper.md`](docs/scraper.md) for filters (single sector/series), resume behaviour,
and how the gateway is driven without a browser, and [`docs/dbie-portal-anatomy.md`](docs/dbie-portal-anatomy.md)
for how the DBIE portal works under the hood.

## How it works

```
DBIE ──scrape──▶ data/ (raw files; not in git) ──pnpm db:load──▶ Postgres (system of record)
                   │                                                  ▲ MCP server, analysts
                   ├──pnpm data:archive──▶ s3://dbie-common-scrapes/scrapes/<date>/
                   └──pnpm data:release──▶ processors → verified JSON → s3://dbie-common-site-data/releases/<version>/
                                                                              │ pnpm data:pull (Amplify build)
                                                                              ▼
                                                              next build → every page pre-rendered (SSG)
```

- The **database is the system of record** for everything scraped (1,033 tables plus a catalogue and code lists);
  git holds code and small metadata only, and every scrape's raw files are archived to S3 under their date.
- The **data API** (`dbie-backend/data-api`) serves every table, its rows and CSV, the catalogue and the code lists
  from the database, read-only (`docs/data-api.md`).
- Pages are **pre-rendered at build time** from a data release in `public/data/`: no API, no database in the
  request path.
- All interactivity (Plotly charts, AG Grid, search) is client-side.
- The processors are **self-checking** (hard-coded known cells) and their outputs are verified **byte-exact**
  against committed oracles before a release is published.

## Repository layout

| Path                                                                      | What                                                                                         |
|---------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `src/`, `public/`, `next.config.js`                                       | The Next.js app (TypeScript)                                                                 |
| `scripts/`                                                                | DBIE scraper + ingest tooling (plain HTTP; gateway client and cipher in `scripts/lib/`; browser probes in `scripts/recon/`) |
| `data/sdmx/`, `data/reports/`                                             | Scraped SDMX series (CSV) and report exports (CSV + xlsx); not in git: `pnpm data:fetch` restores them from the S3 archive |
| `data/sources/`, `data/publications/`                                     | Manually downloaded report files (the DBIE Reports path needs a rationed guest SAP session; see docs) |
| `data/processors/`                                                        | Source files → the JSON the site renders (`pnpm data:build`, verified by `pnpm data:verify`) |
| `data/catalogue.json`, `data/sdmx-tree.json`, `data/scrape-manifest.json` | Table index + scrape state                                                                   |
| `data/sdmx-codelists/`                                                    | DBIE code lists (dimension code → label) per SDMX dataset                                    |
| `infra/terraform/`                                                        | The database, bastion, buckets and release role in the common-projects account (`docs/database.md`) |
| `data/coverage-report.md`                                                 | What the scrape covers vs the DBIE Reports catalogue                                         |
| `mcp/`                                                                    | `@reserve-bank-innovation-hub/dbie-mcp` — MCP server over the site's data                    |
| `scripts/db/`                                                             | Loaders for the project's Postgres database (schemas, SDMX and report tables, catalogue, checks; `docs/database.md`) |
| `dbie-backend/data-api/`                                                  | Read-only Go API over the database: every table, rows, CSV, catalogue, code lists (`docs/data-api.md`)          |
| `docs/`                                                                   | Architecture, scraper internals, data learnings                                              |

## Data refresh

1. `pnpm scrape` and `pnpm scrape:reports` — refresh the raw files in `data/` (SDMX over plain HTTP; the report
   tables through the BusinessObjects REST layer); `pnpm scrape:report` reviews what changed.
2. `pnpm db:load` — load into Postgres; every table is verified against its file.
3. `pnpm data:archive` — archive the raw files to S3 under the scrape date.
4. `pnpm data:release` — run the processors, verify against the oracles, publish the site bundle as a release; then
   rebuild the site (Amplify picks up the current release with `pnpm data:pull`).
5. Commit the code and metadata changes (catalogues, code lists, oracles); the raw files stay out of git.

The `release-data` workflow does step 4 from an archived scrape, on demand or when the processors change on
`main`; every site branch's build downloads the current release.

## AI access (MCP)

AI assistants can search and fetch every table via the bundled MCP server — see [mcp/README.md](mcp/README.md):

```bash
claude mcp add dbie -- npx -y @reserve-bank-innovation-hub/dbie-mcp
```

## Contributing

Issues and PRs welcome. The pipeline is deliberately boring: plain Node scripts, no framework, one
workspace (`pnpm install` covers the app and the MCP package). If you add a dataset, add its processor under
`data/processors/` and verify its output against a known-good snapshot (see `data/processors/README.md` for the 
parity gotchas when porting spreadsheet parsers).

## License

[MIT](LICENSE)
