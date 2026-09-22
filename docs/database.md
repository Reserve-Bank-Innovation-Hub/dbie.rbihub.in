# Database

The DBIE Postgres database is the system of record for everything scraped from DBIE. It lives in the common-projects
AWS account and is reached over the RBIH tailnet, the way Pratirupa's databases are. Its infrastructure is Terraform
(`infra/terraform/`); the account-specific pointers (profile, secret name, bucket names, bastion id) live in
`.env.common` (gitignored; copy `.env.common.example` and fill it from `terraform output`).

| Item | Value |
|---|---|
| Instance | `dbie-postgres`, RDS for PostgreSQL 18, `db.t4g.large` (2 vCPU, 8 GiB, Graviton), Single-AZ, ap-south-1 |
| Storage | 20 GiB gp3, autoscaling to 100 GiB, encrypted at rest |
| Network | private; security group admits 5432 from the bastion's group only; default VPC subnets |
| Access | RBIH tailnet: the `t4g.nano` bastion (`dbie-bastion`, `tag:dbie`) is a subnet router for `172.31.0.0/16`; SSM port-forward as the fallback (`scripts/db-tunnel.sh`) |
| Roles | `dbie_loader` owns the schemas (secret `dbie/db-common`); `dbie_reader` has SELECT on everything (`dbie/db-common-reader`); the master `dbie_admin` keeps its RDS-managed secret, which rotates weekly and is used for nothing else |
| Parameters | `dbie-pg18`: `work_mem` 64 MB, `maintenance_work_mem` 256 MB, `log_min_duration_statement` 1 s, `rds.force_ssl` on |
| Backups | automated, 7 days, window 01:30–02:30 IST; maintenance Sunday 03:00–04:00 IST; auto minor upgrades |
| Safety | deletion protection on, Performance Insights (7 days), postgresql and upgrade logs to CloudWatch |
| Cost | about $122/month instance, $3 storage, $3 bastion (on-demand) |

## Infrastructure

`infra/terraform/bootstrap` creates the state bucket (`dbie-common-terraform-state`); `infra/terraform/common` holds
everything else: network, database, bastion, the two data buckets, the secret containers and the GitHub Actions
release role. Provider and backend assume `OrganizationAccountAccessRole` in the account, so run with management
credentials, a profile that is an IAM user or role in the management account (737771471493, the `source_profile`
of the `common-projects` profile): `AWS_PROFILE=<management-profile> terraform -chdir=infra/terraform/common plan`
then `apply`. A `default` profile that belongs to another account will not do. The database, bastion,
security groups and parameter group were created by hand on 18-09-2026 and imported (`terraform import`, ids in the
resource comments and the git history); the buckets, secrets and release role were created by Terraform.

The data API's pieces live in the same root: the ECR repository `dbie/data-api`, the ECS cluster `dbie-common` with
the execution and infrastructure roles an Express service needs, the API's task role (read on the reader secret
only) and security group (the database security group admits 5432 from it), the log group `/ecs/dbie-data-api`, the
certificate and DNS for `data-api.dbie.rbihub.in` in the `dbie.rbihub.in` zone this account hosts, and the GitHub
deploy role. The service and its load balancer are created once by `scripts/deploy/create-data-api-service.sh`; see
`docs/data-api.md`.

Buckets, both readable by anyone because the data is public:

- `dbie-common-scrapes`: `scrapes/<date>/` holds every raw file of a scrape with a `MANIFEST.json` of sizes and
  SHA-256s, immutable once written; `scrapes/latest.json` names the newest. `pnpm data:archive` writes, `pnpm
  data:fetch` restores into `data/` and checks every file.
- `dbie-common-site-data`: `releases/<date>-<commit>/` holds the site's JSON bundle with its manifest;
  `releases/latest.json` names the current one. `pnpm data:release` builds, verifies and publishes; `pnpm data:pull`
  downloads and checks; the Amplify build runs the latter.

## Data model

Eight data schemas mirror DBIE's Statistics headings, plus `meta`:

| Schema | DBIE heading |
|---|---|
| `real_sector` | Real Sector: agriculture, national income, industrial statistics, prices and wages |
| `financial_sector` | Financial Sector: monetary statistics, banking, financial institutions, NBFCs, key rates, payment systems |
| `financial_markets` | Financial Markets: money, forex, government securities, equity and corporate debt |
| `external_sector` | External Sector: trade, international finance, external debt, reserves, indices |
| `public_finance` | Public Finance: central, state and combined government finance, public debt |
| `corporate_sector` | Corporate Sector: FDI, non-government non-financial and NBFI companies, listed companies |
| `socio_economic` | Socio-Economic Indicators |
| `surveys` | Surveys, aggregated data (Survey of Professional Forecasters) |
| `meta` | catalogue, code lists, provenance, load history |

DBIE's Statistics and Publications menus are the only menu paths; SDMX is a source. Two kinds of table:

- **SDMX datasets**, one typed table per dataset named by its DBIE DSD code (`financial_sector.bmc_m_rn`): the
  columns of DBIE's SDMX-CSV export, lower-cased, with `time_period` as `date`, `obs_value` as `numeric`, the
  reporting-year and unit-multiplier columns as `integer`, dimension codes as `text`, and `src_line` the data row
  number in the source file. Empty cells are NULL. Dimension codes are explained in `meta.sdmx_codelist`
  (`dsd_code`, `dim_code`, `code` → `label`, with hierarchy level and parent). Two datasets whose SDMX export fails
  on DBIE (`call_money_rn`, `clearing_hou_rn`) are loaded from the portal's JSON route instead and carry label
  columns alongside the codes; `call_money_rn` values are ranges such as `4.50-5.15`, so its `obs_value` is text.
- **Report tables**, one per DBIE Statistics or Publications report, named `r<reportId>_<title>`
  (`financial_sector.r100_commercial_bank_survey`; the title is cut to Postgres's 63-byte identifier limit, the full
  DBIE title is the table comment and `meta.catalogue.title`). A report table is the faithful grid of DBIE's export
  files: one row per spreadsheet row (`row_no`) of each export file (`src_file`, `tab`, `period`), cells `c1..cN` as
  text with the title and header rows included; `''` is an empty cell, NULL a cell beyond that row's width.
  Multi-tab and period-split exports sit in the same table, told apart by `src_file`/`tab`/`period`. A report so
  wide that a dense row would exceed Postgres's 8 KB inline row limit is stored instead with one `cells text[]`
  column (`cells[1]` is the first column); `meta.report.layout` says which form a table has (`columns` or `array`).

`meta.tables` lists every loaded table with its DBIE title and menu path; `meta.catalogue` has one row per DBIE
menu entry (1,164) and per SDMX dataset (252) with its status, including what was not exported and why;
`meta.report` and `meta.sdmx_dataset` hold per-table provenance (source file, SHA-256, export metadata, row counts);
`meta.load_run` the history.

## What is loaded (18-09-2026)

| | Tables | Rows | Verified |
|---|---|---|---|
| SDMX datasets | 252 | 2,175,286 | every table: row count, exact sum of `obs_value`, date range, fingerprint over text columns |
| Report tables (Statistics 134, Publications 647) | 781 | 5,520,256 | every export file: row count, bytes, fingerprint |
| `meta.sdmx_codelist` | 1 | 12,193 code → label entries (the tree's root placeholder rows dropped on 20-09-2026) | every code used in the SDMX tables has a label bar two |
| `meta.catalogue` | 1 | 1,416 entries | one per DBIE menu entry (1,164) and SDMX dataset (252) |

Database size 2780 MB. By schema: `financial_sector` 484 tables, `real_sector` 133, `financial_markets` 129,
`external_sector` 122, `public_finance` 92, `corporate_sector` 67, `socio_economic` 4, `surveys` 2. An independent
check (`pnpm db:check`, seed 20260918) read 40 random SDMX rows and 40 random report rows back from Postgres and
found all 80 identical to the source files.

Of DBIE's 1,164 menu entries, 781 are loaded, 2 were exported empty by DBIE, 101 are archive files (pdf or excel,
never exported) and 280 tables were not exported (263 Statistics entries covered by an SDMX dataset on the same
topic by title similarity, recorded as such in `meta.catalogue.notes`, plus 17 Publications entries); see
`meta.catalogue` for each one's status.

## Loading

From a laptop on the tailnet, with the scrape's raw files in `data/` (`pnpm data:fetch` restores them):

```bash
pnpm db:schema            # schemas, meta tables, the meta.tables view (idempotent)
pnpm db:roles             # once: the loader and reader roles and their secrets (runs as the master user)
pnpm db:load:sdmx         # 252 SDMX datasets → typed tables, verified against the files
pnpm db:load:reports      # 783 report exports → grid tables, verified per file; resumable
pnpm scrape:codelists     # once per scrape: dimension code → label lists from DBIE (data/sdmx-codelists/)
pnpm db:load:codelists    # → meta.sdmx_codelist, then checks every code used has a label
pnpm db:load:catalogue    # → meta.catalogue from the DBIE menus, the SDMX tree and what was loaded
pnpm db:check             # random rows read back from Postgres against the source files
```

`pnpm db:load` runs the whole sequence. Every loader verifies each table before recording it: row count, the exact
sum of `obs_value`, date range and a fingerprint over the text columns for SDMX; row count, bytes and a fingerprint
per export file for reports. A mismatch stops the run with the table left in place for inspection and nothing
recorded in `meta`. Re-running replaces tables; `--only`, `--limit`, `--dry-run` and (reports) `--force`, `--skip`
narrow a run. The loaders need only `psql`; connection details come from the secret named in `.env.common`.

## Known gaps in the loaded data

- In seven reports (81, 82, 230, 315, 838, 1484, 1486) two tabs were exported to the same truncated file name, so
  the later export overwrote the earlier one on disk; only the surviving tab is loaded and `meta.report.notes` names
  the tab that needs re-exporting.
- Two codes in `real_sector.sec_wis_dom_sav_rn` (`DSG_GROSS_FIN_SAV`, `DSG_LES_FIN_LIB`) are absent from DBIE's own
  code list and so have no label in `meta.sdmx_codelist`.
- The July 2026 `clearing-house.csv` under `data/sdmx` (59 rows, 2016–2025) is superseded by the JSON capture of
  `CLEARING_HOU_RN` (195 rows, 2005–2025, full hierarchy) and is not loaded.
- The `.xlsx` exports hold the same grids as the CSVs and are not loaded.

## Connecting

Direct, over the RBIH tailnet (`reserve-bank-innovation-hub.org.github`): sign in to Tailscale with GitHub, stay
connected, and use the private endpoint as-is. The RDS hostname resolves to its private IP on its own; the bastion's
subnet route carries it. Nothing to tunnel or start per session.

The tooling reads `DB_SECRET_NAME` from `.env.common` and takes host, port, dbname, username and password from that
secret. For a client such as DataGrip, read the reader secret and use its fields (SSL mode require; untick every
database except `dbie` in the Schemas tab, since RDS's internal `rdsadmin` database rejects other users):

```bash
aws secretsmanager get-secret-value --profile common-projects --region ap-south-1 \
  --secret-id dbie/db-common-reader --query SecretString --output text
```

Tailnet policy (admin console): `tag:dbie` owned by `autogroup:admin`; the `autogroup:admin` access rule lists
`tag:dbie` and `172.31.0.0/16` (admin-only, like Pratirupa prod; move the two entries to the `autogroup:member` rule
to open it to every member); auto-approver route `172.31.0.0/16` for `tag:dbie`. Tagged devices have no key expiry.

Fallback without the tailnet: `scripts/db-tunnel.sh` opens an SSM port-forward to `localhost:15432` through the same
bastion (needs the Session Manager plugin); connect to `host=localhost port=15432` instead.

Re-joining the bastion (new instance, or after a `tailscale logout`): mint a single-use auth key tagged `tag:dbie` in
the admin console and run `scripts/db-bastion-tailscale-up.sh` from a terminal. Tailscale is installed from the
Amazon Linux 2023 repo with IP forwarding enabled (`/etc/sysctl.d/99-tailscale.conf`).

## Operating notes

- Mumbai's T4g capacity is intermittent: on 18-09-2026 `t4g.medium` was unavailable in every AZ for over an hour,
  `t4g.large` appeared after fifteen minutes, and the bastion needed three retries. If a class change fails with
  `InsufficientDBInstanceCapacity`, retry later or use `db.m8g.large` (Graviton4, about $175/month).
- Class change: `aws rds modify-db-instance --db-instance-identifier dbie-postgres --db-instance-class <class> --apply-immediately`
  (a few minutes' downtime; the secret, storage and parameter group are untouched).
- Multi-AZ can be switched on later with `--multi-az`; it doubles the instance cost.
