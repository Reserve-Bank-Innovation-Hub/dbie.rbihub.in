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
concern), applied by a person with management credentials: `AWS_PROFILE=<management-profile> terraform
-chdir=infra/terraform/common apply`, where the profile is an IAM user or role in the management account
(737771471493), the same one the `common-projects` profile names as its `source_profile`. The provider and backend
assume `OrganizationAccountAccessRole` into the account from it, so a `default` profile that belongs to any other
account will not do.

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
- The MCP server still reads the site's JSON (the release's search index, 345 entries on 22-09-2026); pointing it
  at the API gives it all 1,033.
- The site data release is still built from files, not from the database: no processor reads Postgres. The
  curated pages' sources are the spreadsheets committed under `data/publications` and `data/sources` (DBIE's own
  report exports, copied over by hand from the scrape's `data/reports`; 37 of them on 22-09-2026) and one SDMX
  CSV. A new scrape therefore reaches the API-backed pages as soon as it is loaded, and the curated charts only
  after that copy and a fresh oracle capture.
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
  (`/publications`, the time-series publications DBIE gives tables for) and Statistics (`/statistics`, the eight
  sectors of DBIE's Statistics menu — Corporate Sector, External Sector, Financial Market, Financial Sector, Public
  Finance, Real Sector, Socio-Economic Indicators, Surveys – Aggregated Data). Each is one page,
  `src/components/SectorPage/MenuPage.tsx`, with no page sidebar: the title card, then every sector of the menu in
  DBIE's order as a section with its name and count on the left and its tables on the right, laid out as DBIE
  files them, a sector's parts as the next column and a part's groups as heading rows above their tables. Only
  loaded tables are listed, each with DBIE's frequency and period; an SDMX dataset sits among the report tables of
  its section, after them, with a "Data Query" badge rather than a group of its own. A table opens in place at
  `?table=<schema>.<table>`, the same key the tables page takes: the listing gives way to the tables page's view of
  the table (`src/components/tables/TableView.tsx`) on the page grid. The view's breadcrumb leads back the way it
  came: the menu's page, and by anchor the sector (`#<sector-slug>`), the part (`#<sector-slug>--<section-slug>`)
  and the group (`#<sector-slug>--<section-slug>--<group-slug>`) the table sits under. The site's own page for the
  table, where it has one — a curated page from `src/app/tables/curated-pages.json`, else an SDMX dataset's series
  page with its chart — is linked from the view. The primary nav's middle is two titled groups: Database
  (Statistics, Publications), DBIE's own two menus, and Themes (Prices, Growth, Markets, Banking, External,
  Government, Payments), the site's curated sections. The Handbook and Indicators routes are not in the nav; they
  are reached from the curated-page links the table view offers, and the Docs and Tables routes are not linked from
  it for now either. The nav's foot is the theme toggle: fictoan's `ThemeProvider` (`src/app/layout.client.tsx`)
  keeps `theme-light` or `theme-dark` as the class on `<html>` and in localStorage under `dbie-theme`, with an
  inline script that sets the class before the first paint; the tokens of each theme are `src/styles/theme-light.css`
  and `theme-dark.css`, after Pratirupa's, and the charts take the theme's ink from `THEME_SCHEMES` in
  `src/components/charts/chartConfig.ts`, each chart reading `useTheme()` so it redraws when the theme changes.
  There are no per-sector routes: the static
  publication pages `/publications/credit-classification` and `/publications/external-debt` are curated pages of
  their own.
- What the two sections share: `src/lib/dbie-menu.ts` reads `data/dbie-menu.json` at build time for DBIE's own
  order of sectors and sections (`menuOrder()`) and `data/catalogue.json` for the SDMX series page slugs
  (`seriesSlugs()`); `src/lib/api/use-menu.ts` rebuilds a menu from the data API's catalogue in the browser
  (`menuSectors`, `describe`) keeping only loaded tables; `src/lib/tables/page-for.ts` says which page the site
  already has for an entry, for the view's link, and the tables page uses it too. The two route files
  (`src/app/statistics/page.tsx`, `src/app/publications/page.tsx`) only set the metadata and render `MenuPage`
  inside a `<Suspense>` boundary, which `useSearchParams` needs on a statically generated route.
- The seven themes — `/prices`, `/growth`, `/markets`, `/banking`, `/external`, `/government`, `/payments` — are the
  same page over a different set of tables. A theme is what its curated pages cover: every entry of
  `src/app/tables/curated-pages.json` whose route starts with the theme's path belongs to it (Banking 20 tables,
  External 12, Government 8, Markets 5, Prices 4, Growth and Payments one each; all of them Monthly RBI Bulletin
  reports today). `themeKeys` and `themeSector` in `src/lib/api/use-menu.ts` gather them into one synthetic sector
  whose sections are DBIE's own, so `/banking` lists its tables under Reserve Bank of India, Money and banking and
  Occasional series (`src/components/SectorPage/SectorPage.tsx`), and `?table=<schema>.<table>` opens one in place
  with the same breadcrumb and anchors. The themes have no page sidebar. The curated chart pages under each theme
  (`/banking/money-stock-measures` and the rest) are what the view's "Curated page" link opens; each carries a
  breadcrumb above its heading (`src/components/Crumbs/PageCrumbs.tsx`) back to its theme's page and, by anchor,
  the DBIE section and group it is listed under there, as do the Handbook and Indicators pages to their sections,
  the two static publication pages to the Publications page and the SDMX series pages to the Statistics page.
  Which levels a list page draws, and their anchors, are the shared rules in `src/lib/tables/placement.ts`, so a
  crumb always lands on something. Each theme's `page.tsx` only names its route, title and description.
- The catalogue is fetched once per page: `fetchCatalogue` in `src/lib/api/catalogue.ts` shares one in-flight read,
  so several components of a page asking for it together make one request to `/api/catalogue`.
- The organisation's GitHub Actions billing lock blocks both workflows (and Pratirupa's).
