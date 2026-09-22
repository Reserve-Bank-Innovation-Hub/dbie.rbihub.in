# LLM context: dbie.rbihub.in

A public mirror of RBI's Database on the Indian Economy (DBIE): everything on DBIE scraped into one Postgres
database (the system of record), served as a static site built from data releases and as a read-only data API.
Conventions mirror the Pratirupa repo (`~/projects/pratirupa`); when in doubt, do it the way Pratirupa does.

## Where to look things up

| Need | Source |
|---|---|
| The whole setup: what runs where, branches, how code and data ship, Pratirupa comparison, known gaps | `docs/architecture.md` |
| Database: instance, roles and secrets, tailnet access, data model, loading, what is loaded, buckets, infrastructure | `docs/database.md` |
| Data API: endpoints, parameters, table shapes, deployment | `docs/data-api.md`, `dbie-backend/data-api/CLAUDE.md` |
| How DBIE itself works and how the scraper drives it | `docs/dbie-portal-anatomy.md`, `docs/scraper.md` |
| Commands | `package.json` scripts (`scrape*`, `data:*`, `db:*`, `start:api`, `test:api`) |
| Infrastructure | `infra/terraform/common/*.tf`, one file per concern, header comments carry the why |

## Repository structure

```
dbie.rbihub.in/
├── src/                      # Next.js 16 site (SSG; data from a release, /data/* rewritten to it)
├── dbie-backend/data-api/    # Go read-only API over the database — own CLAUDE.md
├── scripts/                  # scrapers, data-*.mjs (archive/fetch/release/pull), db/ loaders, deploy/, lib/
├── data/                     # small metadata only: catalogues, manifests, code lists, processors + oracles
├── infra/terraform/          # bootstrap/ (state bucket) and common/ (everything in the common-projects account)
└── docs/                     # architecture, database, data-api, scraper, portal anatomy
```

Scraped files (`data/sdmx`, `data/reports`, `data/sdmx-raw`) are not in git: `pnpm data:fetch` restores the
latest archived scrape from the public bucket; `pnpm data:pull` fetches the site's current data release.

## Conventions

- British spelling; sentence case for headings, labels and commit subjects; em-dashes without spaces; Indian dates
  (DD-MM-YYYY) in prose. No Claude or AI attribution in commits or PRs.
- Docs and comments: plain sentences carrying exact facts (paths, names, ids, the why); no self-admiring texture.
- The API answers snake_case JSON; identifiers in SQL come only from the registry, values only as bind parameters.
- Every table in the database keeps DBIE's own identity: SDMX tables are named by DSD code, report tables
  `r<reportId>_<title>`, dimension codes are DBIE's, labels come from `meta.sdmx_codelist`.
- Loaders verify every table against its file before recording it; `pnpm db:check` reads random rows back.

## Environment

- `.env.common` at the repo root (copy `.env.common.example`): `AWS_PROFILE=common-projects`, `DB_SECRET_NAME`,
  bucket names, bastion id. Pointers only; credentials live in Secrets Manager. The API has its own
  `dbie-backend/data-api/.env.common` pointing at the reader secret.
- The database is reached over the RBIH tailnet (Tailscale must be connected); DataGrip and psql use the
  `dbie/db-common-reader` secret's fields.
- Terraform runs with management credentials: `AWS_PROFILE=<management-profile> terraform -chdir=infra/terraform/common plan|apply`,
  where the profile is an IAM user or role in the management account (737771471493), the `source_profile` the
  `common-projects` profile assumes its role from; not a `default` profile that belongs to another account.
  A person applies; agents write, import and plan.

## Things that look wrong but are right

- The API deploys from `main` only, although one service serves dev, staging and main: one dataset, one API.
- Staging and production sites still build from data files committed in their own branches (July 2026) until the
  data-serving code is promoted to them; nothing done on `dev` changes them.
- `public/data` is deleted after the site build on purpose; the browser fetches `/data/*.json` from the release.
- The Express gateway only answers requests addressed to its own `*.on.aws` name and swaps target groups on every
  deployment, so the public hostname is CloudFront in front of it, with a cache policy that must not key on Host.
- Terraform reports `rds.force_ssl` with `apply_method = "pending-reboot"` because that is how RDS reports it.
- The older AWS CLI (2.34) crashes printing Express-service responses after the call succeeded; describe by
  `--service-arn`.
