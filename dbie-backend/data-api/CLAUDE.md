# data-api — agent context

Read-only HTTP API over the DBIE Postgres database (port 8000): every loaded table, its rows, the catalogue of DBIE
menu entries and the SDMX code lists. Module `github.com/rbih/dbie-data-api`. Same shape as the Pratirupa
services (Gin + pgx v5 + zerolog, no ORM, all routes in `cmd/server/main.go`). Routes: `docs/data-api.md`.

## Package map (internal/)

- `handlers` — all HTTP handlers; methods on `*Handler` (deps in `handlers.go`): tables, rows, CSV, catalogue,
  code lists, search, health
- `registry` — in-memory snapshot of `meta.tables` + `information_schema.columns` + SDMX dimensions and code lists;
  refreshed every `REGISTRY_REFRESH_MINUTES`. Every schema, table and column name a request uses is resolved here
- `query` — the only place SQL for row reads is built; identifiers come from the registry, values are bind
  parameters, limits are clamped. Unit-tested (`go test ./...`)
- `middleware` — request logging with `X-Request-ID`; `Cache` sets `Cache-Control` (public for 200, no-store otherwise)
- `config`, `secrets`, `db`, `logger` — as in Pratirupa; `db` sets the session read-only with a 60 s statement timeout

## Canonical patterns

**Endpoint**: register in `cmd/server/main.go` under `api := router.Group("/api", middleware.Cache(...))`. Handler =
method on `*handlers.Handler`. Never interpolate request text into SQL: resolve the table through
`h.registry.Get`, columns through `t.HasColumn`, and build reads with `query.Build`. Respond
`c.JSON(status, gin.H{...})`; errors `gin.H{"error": ...}` (+ `"message"` when a hint helps). Values reach JSON
through `jsonValue` (dates `YYYY-MM-DD`, numerics as exact number literals, arrays as arrays).

**Row reads**: `GetRows` (JSON page, `MAX_ROWS` cap, `count=1` for the total) and `GetCSV` (streamed, unbounded) share
`params()` and `query.Build`; add a parameter in `params()` and `query.Params`, and a test in `query_test.go`.

**Config**: `.env.common` (gitignored; `.env.common.example`) → `DB_SECRET_NAME=dbie/db-common-reader`, a Secrets
Manager secret `{host, port, dbname, username, password}`; `DATABASE_URL` overrides for local databases. Locally
the AWS profile signs the secret read; in ECS the task role does. Nothing here writes to the database.

## Running

```bash
go run ./cmd/server                 # reads .env.common; needs the tailnet for the database
go test ./... && go vet ./...
docker build -t dbie-data-api .     # multi-arch friendly (see Dockerfile)
```
