# dbie.rbihub.in

A modern, fully static web platform for exploring economic data from the Reserve Bank of
India's [Database on Indian Economy](https://data.rbi.org.in) (DBIE) — plus the scraping and
processing pipeline that keeps its data fresh.

Built by the [Reserve Bank Innovation Hub](https://rbihub.in). MIT licensed.

## Quickstart

```bash
pnpm install

# get data for the pages (from the committed pipeline output)
pnpm data:build && pnpm data:sync

pnpm dev            # run the site at localhost:3000
pnpm build          # static production build (SSG)
```

### Scraping DBIE yourself

```bash
pnpm scrape         # scrape all ~252 SDMX series from DBIE (Playwright; ~2h; resumable)
pnpm data:ingest    # file the scraped CSVs into data/sdmx/ under readable names
```

See [`docs/scraper.md`](docs/scraper.md) for filters (single sector/series), resume behaviour,
and how the wizard is driven, and [`docs/dbie-portal-anatomy.md`](docs/dbie-portal-anatomy.md)
for how the DBIE portal works under the hood.

## How it works

```
scripts/ (Playwright)            data/processors (Node)
raw SDMX CSVs / report files ──► frontend-consumable JSON ──► public/data/
                                                                   │
                                                                   ▼
                                                     next build → every page pre-rendered (SSG)
```

- Pages are **pre-rendered at build time** from JSON in `public/data/` — there is no API,
  no database, no server to run.
- All interactivity (Plotly charts, AG Grid) is client-side.
- Data refreshes are decoupled from code: re-run the pipeline, rebuild, redeploy.

## Repository layout

| Path | What |
|---|---|
| `src/`, `public/`, `next.config.js` | The Next.js app (TypeScript) |
| `scripts/` | DBIE scraper + ingest tooling (Playwright; probes in `scripts/recon/`) |
| `data/sdmx/` | All scraped SDMX series as CSV, human-readable names (committed) |
| `data/sources/`, `data/publications/` | Manually downloaded report files (the DBIE Reports path is auth-walled) |
| `data/processors/` | Source files → the JSON the site renders (`pnpm data:build`, verified by `pnpm data:verify`) |
| `data/catalogue.json`, `data/sdmx-tree.json`, `data/scrape-manifest.json` | Table index + scrape state |
| `docs/` | Architecture, scraper internals, data learnings |

## Data refresh

1. `pnpm scrape` — refresh the SDMX CSVs (staged to `data/sdmx-raw/`, gitignored).
2. `pnpm data:ingest` — file them into the committed `data/sdmx/`.
3. Update any manual report files in `data/sources/`.
4. `pnpm data:build && pnpm data:verify` — regenerate + check the site's JSON.
5. `pnpm data:sync && pnpm build` — see it locally; commit the refreshed data.

Deployment (AWS Amplify + S3, per-environment data payloads) is described in
[`docs/05-static-amplify-s3-architecture.md`](docs/05-static-amplify-s3-architecture.md);
`amplify.yml` pulls the environment's data from S3 in `preBuild`.

## AI access (MCP)

AI assistants can search and fetch every table via the bundled MCP server — see [mcp/README.md](mcp/README.md):

```bash
claude mcp add dbie -- npx -y dbie-mcp
```

## Contributing

Issues and PRs welcome. The pipeline is deliberately boring: plain Node scripts, no
framework, one `package.json`. If you add a dataset, add its processor under
`data/processors/` and verify its output against a known-good snapshot (see
`data/processors/README.md` for the parity gotchas when porting spreadsheet parsers).

## License

[MIT](LICENSE)
