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
- The tables page (`/tables`) opens any of the 1,033 loaded tables from the data API and is built only from the
  site's shared pieces: the page sidebar, the page grid with its title, meta, controls, table and notes cells,
  fictoan selects, and AG Grid in the theme every grid on the site uses. The sidebar is two of the sidebar's own
  link groups, Publications then Statistics, each listing every loaded table in DBIE's own order (sector by
  sector, section by section, from `data/dbie-menu.json`, a section's Data Query datasets after its report
  tables); `?table=<schema>.<table>` names the table on show, which is highlighted and scrolled into view. Titles are set in
  sentence case (`src/lib/tables/titles.ts` keeps the acronyms and names DBIE's titles use: SCBs, RBI, NEER, India),
  and in the list shortened with standard abbreviations (SCBs, RBI, govt., no., avg., FY, USD, "St. 1" and
  "T. 3.5" for "Statement No. 1" and "Table No. 3.5", a long form DBIE follows with its acronym reduced to the acronym, "according to" said as
  "by"); the full title is the link's tooltip and the page heading. The
  SDMX Data Query datasets sit in the Statistics section of the same sector and sub-sector (`src/lib/api/catalogue.ts`
  holds the few names that differ). With nothing asked for, the page opens on the Monthly RBI Bulletin's Select
  Economic Indicators (DBIE report 41). A report is shown one tab at a time: `src/lib/tables/report-grid.ts` reads
  the title, header rows, figures and notes back out of the export's rows and `src/components/tables/ReportGrid.tsx`
  lays them out with DBIE's header rows as column groups, figures sorted and filtered as numbers. An SDMX dataset
  is pivoted into periods × series by `src/lib/tables/sdmx-pivot.ts` and shown by the same `SdmxSeriesGrid` the
  series pages use (one line per observation past 100 series), narrowed by a select per dimension. Sorting and
  filtering are the grid's own. Entries DBIE has but the database does not are not listed. Curated pages and the
  SDMX series pages with charts are linked from it.
- Two sections of the site are built on DBIE's own menus and run on one implementation: Publications
  (`/publications`, the fourteen time-series publications DBIE's report listing gives tables for) and Statistics
  (`/statistics`, the eight sectors of DBIE's Statistics menu — Corporate Sector, External Sector, Financial Market,
  Financial Sector, Public Finance, Real Sector, Socio-Economic Indicators, Surveys – Aggregated Data). Both are the
  site's list page (the banking page's layout) over a menu: a sidebar of DBIE's items in DBIE's order, an index page
  listing them with what each holds, and one page per item at `/publications/<slug>` or `/statistics/<slug>` laying
  its parts out as DBIE files them, each level of the hierarchy a column from left to right, down to its tables.
  Only loaded tables are listed, each with DBIE's frequency and period. A table opens in place at
  `?table=<schema>.<table>`, the same key the tables page takes: the listing gives way to the tables page's view of
  the table (`src/components/tables/TableView.tsx`, shared by both pages) on the page grid, the sidebar staying as
  it is. The view's breadcrumb leads back the way it came: the item's own page, and by anchor the section
  (`#<section-slug>`) and the group (`#<section-slug>--<group-slug>`) the table sits under. The site's own page for
  the table, where it has one — a curated page from `src/app/tables/curated-pages.json`, else an SDMX dataset's
  series page with its chart — is linked from the view. The primary nav's middle is two titled groups: Database
  (Statistics, Publications), DBIE's own two menus, and Themes (Prices, Growth, Markets, Banking, External,
  Government, Payments), the site's curated sections. The Handbook and Indicators routes are not in the nav; they
  are reached from the curated-page links the table view offers.
- What the two sections share: `src/lib/dbie-menu.ts` reads DBIE's menus out of `data/` at build time
  (`publicationsMenu()` from `data/dbie-menu.json` menu 5 kept to what `data/reports-sections.json` lists,
  `statisticsMenu()` from menu 4, `menuOrder()` for DBIE's own order of sectors and sections, `seriesSlugs()` from
  `data/catalogue.json`); `src/lib/api/use-menu.ts` rebuilds one menu from the data API's catalogue in the browser
  (`menuSectors`, `useMenu`, `describe`) keeping only loaded tables; `src/components/SectorPage/SectorListPage.tsx`
  is the index list and `src/components/SectorPage/SectorPage.tsx` the hierarchy with the in-place view;
  `src/components/PageSidebars/MenuSidebar.tsx` is the sidebar; `src/lib/tables/page-for.ts` says which page the
  site already has for an entry, for the view's link, and the tables page uses it too. The route files
  (`src/app/publications/{layout,page}.tsx`, `[publication]/page.tsx`, and the same three under
  `src/app/statistics/`) only read their menu, generate the static params, set the metadata and render the shared
  components inside a `<Suspense>` boundary, which `useSearchParams` needs on a statically generated route.
- The seven themes — `/prices`, `/growth`, `/markets`, `/banking`, `/external`, `/government`, `/payments` — are the
  same page over a different set of tables. A theme is what its curated pages cover: every entry of
  `src/app/tables/curated-pages.json` whose route starts with the theme's path belongs to it (Banking 20 tables,
  External 12, Government 8, Markets 5, Prices 4, Growth and Payments one each; all of them Monthly RBI Bulletin
  reports today). `themeKeys` and `themeSector` in `src/lib/api/use-menu.ts` gather them into one synthetic sector
  whose sections are DBIE's own, so `/banking` lists its tables under Reserve Bank of India, Money and banking and
  Occasional series, and `?table=<schema>.<table>` opens one in place with the same breadcrumb and anchors. The
  sidebar, `src/components/PageSidebars/ThemeSidebar.tsx`, lists the theme's tables under those DBIE sections and
  highlights the one on show, on the theme's page and on the table's curated page alike. The curated chart pages
  under each theme (`/banking/money-stock-measures` and the rest) are unchanged and are what the view's "Curated
  page" link opens. Each theme's `layout.tsx` and `page.tsx` only name its route, icon, title and description.
- The catalogue is fetched once per page: `fetchCatalogue` in `src/lib/api/catalogue.ts` shares one in-flight read,
  so a page and its sidebar asking for it together make one request to `/api/catalogue`.
- The organisation's GitHub Actions billing lock blocks both workflows (and Pratirupa's).
