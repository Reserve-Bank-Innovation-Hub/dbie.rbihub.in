# dbie.rbihub.in

A modern, fully static web platform for accessing and visualising economic data from the
Reserve Bank of India's Database on Indian Economy (DBIE).

**Architecture:** static frontend on AWS Amplify, data from S3, no runtime backend.
See [`docs/05-static-amplify-s3-architecture.md`](docs/05-static-amplify-s3-architecture.md).

## How it works

```
dbie-scraper (Playwright)        data/processors (Node)           AWS
raw SDMX CSVs / report files ──► frontend-consumable JSON ──► s3://dbie-data/site-<env>/
                                                                   │  aws s3 sync (Amplify preBuild)
                                                                   ▼
                                                     Amplify build → next build (SSG)
                                                                   ▼
                                                     CloudFront → dbie.rbihub.in
```

- Pages are **pre-rendered at build time** (SSG) from JSON in `frontend/public/data/`
  (synced from S3 in the Amplify `preBuild` step — see `amplify.yml`).
- All interactivity (Plotly charts, AG Grid) is client-side.
- There is no API, no database, no server to run.

## Repository layout

| Path | What |
|---|---|
| `frontend/` | Next.js app — the only deployable |
| `data/sources/` | Raw report files (txt/xlsx) the current datasets are parsed from |
| `data/processors/` | Node pipeline: sources → the 8 JSON files the frontend consumes |
| `data/sdmx/`, `data/publications/` | Bulk scraped/collected raw data (committed) |
| `data/catalogue.json` | Index of all 295 known DBIE tables (built by `data/build-catalogue.mjs`) |
| `dbie-scraper/` | Playwright scraper for DBIE's SDMX data query wizard |
| `docs/` | Architecture notes, data learnings, decisions |

## Quickstart

```bash
pnpm install --dir frontend

# populate the data the pages render from
npm --prefix data/processors install
npm run data:build                       # sources -> data/processors/out/*.json
mkdir -p frontend/public/data && cp data/processors/out/*.json frontend/public/data/

npm run start                            # next dev
npm run build                            # next build (SSG all pages)
```

## Data refresh (monthly-ish)

1. `npm run scrape` — refresh the SDMX CSVs (resumable; see `dbie-scraper/README.md`).
2. Update any manual report files in `data/sources/` (the DBIE Reports path is auth-walled).
3. `npm run data:build && npm run data:verify`.
4. `aws s3 sync data/processors/out/ s3://dbie-data/site-dev/` and rebuild the `dev` branch.
5. Promote: sync `site-dev` → `site-staging` → `site-prod`, rebuilding each branch after.

## Environments

| Branch | URL | S3 data prefix |
|---|---|---|
| `main` | https://dbie.rbihub.in | `site-prod/` |
| `staging` | https://staging.dbie.rbihub.in | `site-staging/` |
| `dev` | https://dev.dbie.rbihub.in | `site-dev/` |

Hosting lives in the **Common projects** AWS account (588387717844): the Amplify app, the
`dbie.rbihub.in` Route 53 zone, and the `dbie-data` S3 bucket.

## History

This repo supersedes `dbie-revamp` (archived), which carried the original Go/Gin + Postgres
backend. That backend was retired once `data/processors/` reproduced its output byte-for-byte,
verified against captured API responses (`data/processors/oracles/`).
