# Architecture

How dbie.rbihub.in is set up as of 20-09-2026: what runs where, how data moves, how code ships, and where this
differs from Pratirupa, which is the reference for every convention here. Details live in the linked pages;
this page is the map.

## The idea in one paragraph

DBIE (RBI's Database on the Indian Economy) is scraped in full over plain HTTP, loaded into one Postgres database
that is the system of record (1,033 tables, a catalogue of every DBIE menu entry, the code lists), and served two
ways: a **site data release** (JSON built from the data, verified, published to S3, downloaded by every site
build) and a **read-only data API** over the database. Git holds code and small metadata only; every scrape's raw
files are archived to S3 under their date.

```
DBIE ──scrape──▶ data/ (raw files, not in git) ──pnpm db:load──▶ Postgres, the system of record
                   │                                                   ▲ data API · analysts · MCP
                   ├──pnpm data:archive──▶ s3://dbie-common-scrapes/scrapes/<date>/
                   └──pnpm data:release──▶ processors → verified JSON → s3://dbie-common-site-data/releases/<version>/
                                                                               │ pnpm data:pull (Amplify build)
                                                                               ▼
                                                               next build → static site, /data/* rewritten to the release
```

## Where things run

One AWS account, **common-projects** (588387717844), region ap-south-1 (Mumbai), one environment. Everything is
Terraform under `infra/terraform/` (`bootstrap/` makes the state bucket; `common/` holds the rest, one file per
concern), applied by a person with management credentials (`AWS_PROFILE=default terraform -chdir=infra/terraform/common apply`).

| Piece | What | Where documented |
|---|---|---|
| Database | RDS for PostgreSQL 18, `dbie-postgres`, `db.t4g.large`, private, 20 GiB gp3 growing to 100; roles `dbie_loader` (owns the data) and `dbie_reader` (read-only), each with a Secrets Manager secret (`dbie/db-common`, `dbie/db-common-reader`); the RDS-managed master secret rotates weekly and is used for nothing | `database.md` |
| Access | RBIH tailnet (Tailscale): the SSM bastion `dbie-bastion` (`t4g.nano`, `tag:dbie`) is a subnet router for the default VPC, `172.31.0.0/16`; the database security group admits the bastion and the API tasks only; SSM port-forward as fallback | `database.md` |
| Data API | Go service `dbie-backend/data-api` on ECS Express (`dbie-common/data-api`, 0.5 vCPU / 1 GB, 1–2 tasks), image in ECR `dbie/data-api`; served at `https://data-api.dbie.rbihub.in` through CloudFront in front of the gateway | `data-api.md` |
| Site | Amplify app `dbie.rbihub.in` (id `d3om9oosc8rac`), three branches: `main` → `dbie.rbihub.in`, `staging` → `staging.dbie.rbihub.in`, `dev` → `dev.dbie.rbihub.in`; static pages built from the current data release | `../README.md` |
| Buckets | `dbie-common-terraform-state` (private), `dbie-common-scrapes` and `dbie-common-site-data` (readable by anyone: public data) | `database.md` |
| DNS | the `dbie.rbihub.in` zone is hosted in this account (delegated from `rbihub.in` in the management account, 737771471493); the API's certificate and records are Terraform here | `data-api.md` |
| Automation | GitHub OIDC roles `dbie-github-actions-release` (data releases) and `dbie-github-actions-deploy` (API images); workflows `release-data.yml` and `deploy-data-api.yml`, both on `main` | `.github/workflows/` |

## Environments and branches

There is **one environment**: one database, one API, one set of buckets. The three site branches read the same
data, so a change to the pipeline or the API goes live when it reaches `main`, the production branch; `dev` and
`staging` are for the site's own code. Staging and production sites keep serving whatever their branch holds:
until the data-serving code is promoted to them, that is the July 2026 build with its data embedded in the branch.

If a dev-only API is ever needed (to test an API change end to end from the dev site before `main`), it is a second
Express service from the same Terraform, about $45 a month.

## How code ships

- **Site**: push to a branch, Amplify builds it: `pnpm install`, `pnpm data:pull` (the current release into
  `public/data`), `pnpm build`, then `public/data` is dropped from the output (Amplify's 220 MB limit) and
  `/data/*` is rewritten to that same release version in the bucket (`next.config.js`).
- **Data**: `pnpm scrape` / `pnpm scrape:reports` → `pnpm db:load` → `pnpm data:archive` → `pnpm data:release`
  → rebuild the site. `release-data.yml` runs the release step from CI on demand or when the processors change on
  `main`. Every site branch's next build picks up the newest release without a code change.
- **API**: a push to `main` touching `dbie-backend/data-api/` runs `deploy-data-api.yml`: multi-arch image to
  `dbie/data-api:common`, then `aws ecs update-service --force-new-deployment`. The Express service itself was
  created once with `scripts/deploy/create-data-api-service.sh`. While the organisation's GitHub Actions is locked
  (billing, since 20-09-2026), the image is built on a laptop with Colima and buildx and pushed with the
  `common-projects` profile; `docs/data-api.md` has the commands.

## Repository layout

| Path | What |
|---|---|
| `src/`, `public/`, `next.config.js`, `amplify.yml` | the Next.js site |
| `dbie-backend/data-api/` | the Go data API (own `CLAUDE.md`, Dockerfile, `.env.common.example`) |
| `scripts/` | scrapers (`scrape-sdmx.mjs`, `export-reports.mjs`, `fetch-sdmx-codelists.mjs`), `data-*.mjs` (archive, fetch, release, pull), `db/` (schema, loaders, checker), `deploy/`, `lib/` (gateway client, cipher) |
| `data/` | small versioned metadata only: catalogues, manifests, code lists, placement rules, processors and their oracles |
| `infra/terraform/` | `bootstrap/` (state bucket), `common/` (network, RDS, bastion, S3, secrets, ECR, ECS, ACM, CloudFront, GitHub OIDC) |
| `docs/` | this page, `database.md`, `data-api.md`, `scraper.md`, `dbie-portal-anatomy.md` |
| `.env.common.example` | the pointers the tooling needs (profile, secret names, bucket names, bastion id); copy to `.env.common` |

## Running costs (on-demand, per month, approximate)

Database $122 + storage $3, bastion $3, API containers $15 (one task) to $30, CloudFront within the free tier,
buckets under $2. About $145–160 in total; the earlier static-only setup cost the Amplify build minutes alone.

## Same as Pratirupa, and different

Same, deliberately: Terraform per account with the same file shape, tags, assume-role and `use1` provider alias;
ECS Express with the execution, infrastructure and per-service task roles and least-privilege secrets; ECR
namespace `<project>/<service>`; the service created at cutover by script and deployed by `update-service`;
GitHub OIDC deploy roles with pinned actions and the repository-owner guard; env files with pointers only and
per-service secrets shaped `{host, port, dbname, username, password}`; private databases behind the tailnet via a
subnet-router bastion; one hostname per service (`<service>-api.<product>.rbihub.in`); CloudFront in front; the
Go service shape (Gin, pgx, zerolog, all routes in `cmd/server/main.go`, `internal/` packages, per-service
`CLAUDE.md`); the documentation and commit conventions.

Different, with the reason:

1. One environment rather than dev/staging/shared/prod accounts: one public dataset serves all site branches.
2. The account's default VPC with public subnets and no NAT gateway (about $41 a month saved); security rests on
   security groups, and nothing has a public address except the bastion (SSM only) and the API tasks (which admit
   only the gateway).
3. Public read buckets for scrapes and site data, so builds and fresh clones need no credentials.
4. No WAF on the API yet.
5. The scrape, load, archive and release pipeline, which Pratirupa has no counterpart for.
6. The API runs no migrations; the loaders own the schema.

## Known gaps and follow-ups

- Seven reports (81, 82, 230, 315, 838, 1484, 1486) lost a tab at export time to a same-name overwrite; the tab to
  re-export is named in `meta.report.notes`.
- Two codes in `real_sector.sec_wis_dom_sav_rn` have no label in DBIE's own code list.
- `data/catalogue.json` files `exchange-rate-of-indian-rupees-fy.csv` under `FOREX_RATE_A_RN`; the loader trusts
  the file's `DATAFLOW` column instead, so the database is right, the catalogue file is not.
- 263 Statistics menu entries were not exported because a same-topic SDMX dataset exists (title similarity, not
  verified); `meta.catalogue.notes` records the candidate. Exporting them is a few hours of the report exporter.
- The MCP server still reads the site's JSON (335 tables); pointing it at the API gives it all 1,033.
- The tables page (`/tables`) opens any of the 1,033 loaded tables from the data API. It is laid out like
  Pratirupa's product pages (the site's page sidebar, Anek Latin). The sidebar has two levels: Publications and
  Statistics, each a group of links (the 14 publications, the 8 sectors, in DBIE's own order from
  `data/dbie-menu.json`); inside one, its sections as group headings and their tables as links, with a way back
  up. The SDMX Data Query datasets are folded into the Statistics section of the same sector and sub-sector, as a
  group after its report tables (`src/lib/api/catalogue.ts` holds the few names that differ). With nothing asked
  for, the page opens on the Monthly RBI Bulletin's Select Economic Indicators (DBIE report 41). The main area
  is the table's title, one line of context, icon actions (CSV, JSON, the site's own page where one exists), the
  tab or dimension pickers (fictoan list boxes) and the table. A report is shown as the table DBIE
  exported, one tab at a time (`src/lib/tables/report-grid.ts` reads the title, headers, figures and notes back
  out of the rows); an SDMX dataset as a time series, periods down and series across, narrowed by its
  dimensions (`src/lib/tables/sdmx-pivot.ts`). Every column sorts and filters from its header, with the
  conditions AG Grid's column filters offer (the ones Pratirupa's DataGrid turns on): text by contains, equals,
  starts with; figures by greater than, less than, between; periods by before, after, between
  (`src/lib/tables/column-filters.ts`, `src/components/tables/HeaderCell.tsx`). Entries DBIE has but the database
  does not are listed with their status. Curated pages and the SDMX series pages with charts are linked from it.
- The organisation's GitHub Actions billing lock blocks both workflows (and Pratirupa's).
