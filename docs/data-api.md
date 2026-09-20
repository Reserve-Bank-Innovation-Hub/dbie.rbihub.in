# Data API

`dbie-backend/data-api` is a read-only HTTP API over the DBIE Postgres database: every loaded table (1,033 on
18-09-2026), the catalogue of DBIE's menus, and the SDMX code lists. It connects with the `dbie_reader` role, so
it can only read. All endpoints are `GET`, answer JSON in snake_case, allow any origin, and carry
`Cache-Control: public, max-age=300` (the data changes only when a load runs). Errors are `{"error": "..."}` with
400 for a bad parameter, 404 for an unknown table, 500 for a database fault.

| Endpoint | What it returns |
|---|---|
| `GET /health` | service status, number of tables and catalogue entries in the registry |
| `GET /api/tables` | the loaded tables. Filters: `schema`, `source` (`sdmx`, `statistics`, `publication`), `q` (word in the title, DBIE path or key) |
| `GET /api/tables/{schema}/{table}` | one table: columns and types, DBIE title and path, SDMX dimensions and which have code lists, layout, and its provenance row from `meta.sdmx_dataset` or `meta.report` |
| `GET /api/tables/{schema}/{table}/rows` | a page of rows: `columns` in order and `rows` as arrays. See parameters below |
| `GET /api/tables/{schema}/{table}/csv` | the table, or the filtered slice of it, as a CSV download; no row limit, streamed |
| `GET /api/codelists/{dsd}` | a dataset's code lists: each dimension's codes with label, level and parent. `dim` narrows to one dimension |
| `GET /api/catalogue` | DBIE menu entries and SDMX datasets with their load status. Filters: `source`, `schema`, `status` (prefix), `kind`, `q`; `limit` (200, max 2000), `offset` |
| `GET /api/search` | `q` (2+ characters) against catalogue titles and menu paths, and against code-list labels, which finds the datasets that carry a component or a state |

## Row parameters

`rows` and `csv` take the same parameters:

- `<column>=<value>`: equality on that column; several values separated by commas mean "any of"
  (`comp_rn=CMS1101,CMS1`). Column names are the table's own (see the table endpoint); typed columns check the
  value (`obs_value` must be a number, `time_period` a date).
- `from`, `to`: inclusive range on `time_period`, `YYYY-MM-DD` (SDMX tables).
- `order`: `column` or `column:desc`, comma-separated. Default: load order (`src_line`, or `src_file, row_no`).
- `limit` (default 100, max 5000) and `offset`; `count=1` adds `total` for the filter. Not for `csv`.
- `labels=1`: for SDMX tables, adds a `<dimension>_label` column for every dimension that has a code list.

Values: dates as `YYYY-MM-DD`; numerics as exact number literals (every digit the file had); text as text; the
report tables' `cells` column (array layout) as an array. NULL is `null`.

## Table shapes

SDMX tables (`source: sdmx`, layout `typed`): one row per observation, the SDMX-CSV columns lower-cased,
`time_period` a date, `obs_value` numeric, dimension codes text, `src_line` the row in the source file.

Report tables (`statistics`, `publication`): the faithful grid of DBIE's export, one row per spreadsheet row:
`src_file`, `tab`, `period`, `row_no`, then either `c1..cN` (layout `columns`) or a single `cells` array (layout
`array`, for tables too wide for a column per cell). Title and header rows are rows like any other.

## Examples

```
/api/tables?schema=financial_sector&q=money
/api/tables/financial_sector/bmc_m_rn
/api/tables/financial_sector/bmc_m_rn/rows?comp_rn=CMS1101&from=2024-04-01&labels=1&order=time_period:desc
/api/tables/financial_sector/bmc_m_rn/csv?comp_rn=CMS1
/api/tables/financial_sector/r1220_bank_credit_of_scbs_bank_group_population_group_occupatio/rows?src_file=1220--...--data.csv&limit=50
/api/codelists/BMC_M_RN?dim=COMP_RN
/api/search?q=currency%20with%20the%20public
/api/catalogue?status=not%20exported&source=statistics
```

## Running it

Locally: `cd dbie-backend/data-api && go run ./cmd/server` (or `pnpm start:api` at the repo root), with
`.env.common` in the service directory (copy `.env.common.example`; it points at the reader secret) and the tailnet
connected.

Deployed at `https://data-api.dbie.rbihub.in` (Pratirupa's naming: one host per service; DBIE has one environment)
as an ECS Express gateway service in the common-projects account: 0.5 vCPU / 1 GB Graviton tasks, one to two of
them on CPU, health check on `/health`, the reader secret through the task role, logs in `/ecs/dbie-data-api`.
Terraform (`infra/terraform/common`: `ecr.tf`, `ecs.tf`, `acm.tf`) holds the repository, cluster, roles, security
group, certificate and DNS; the service itself was created once with `scripts/deploy/create-data-api-service.sh`,
the way Pratirupa creates its services (20-09-2026). ECS gave it an internet-facing load balancer with HTTPS on its
own name, `da-9a220423d40d4f1896457f6dd2675b48.ecs.ap-south-1.on.aws`, and it answers only requests addressed to
that name (ECS also moves the service between two target groups on every deployment), so `data-api.dbie.rbihub.in`
is served by CloudFront in front of it (`cloudfront.tf`): our certificate on the edge, requests forwarded to the
gateway under the gateway's name, the API's own `Cache-Control` honoured at the edge. The gateway endpoint is the one
value in `terraform.tfvars`. One service serves every site branch (dev, staging and main read the same
database), so it deploys from `main`, the production branch: every push to `main` that touches
`dbie-backend/data-api/` runs `.github/workflows/deploy-data-api.yml`, a multi-arch image to `dbie/data-api:common`
and a forced new deployment.
