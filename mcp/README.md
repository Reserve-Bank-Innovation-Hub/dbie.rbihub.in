# dbie-mcp

MCP server for the [Database on Indian Economy](https://dbie.rbihub.in) — lets AI assistants search and fetch RBI economic data: 337 tables and series covering prices, growth, markets, banking, external sector, government finance and payments.

It is a thin, read-only layer over the site's static JSON payloads. No credentials, no writes.

## Tools

| Tool | What it does |
|---|---|
| `search_tables` | Fuzzy full-text search across every table and series |
| `list_tables` | Browse sections and their tables |
| `get_series` | Sliced observations for SDMX series — date range, column filter, units, `as_of` |
| `get_table` | Any table's full JSON payload, with array truncation to protect context |

## Use it

With Claude Code:

```bash
claude mcp add dbie -- npx -y @reserve-bank-innovation-hub/dbie-mcp
```

Or in any MCP client config:

```json
{
    "mcpServers": {
        "dbie": {
            "command": "npx",
            "args": ["-y", "@reserve-bank-innovation-hub/dbie-mcp"]
        }
    }
}
```

### Pointing at a specific deployment

Data comes from `DBIE_BASE_URL` (default `https://dbie.rbihub.in`). To use another deployment:

```json
{
    "command": "npx",
    "args": ["-y", "@reserve-bank-innovation-hub/dbie-mcp"],
    "env": { "DBIE_BASE_URL": "https://dev.dbie.rbihub.in" }
}
```

## Data vintage

Responses reflect the deployment's **last scrape** of the RBI DBIE portal — not live data. Every response carries the source base URL, and series responses carry `as_of` (the latest observation period), so assistants can and should disclose the vintage.

## Development

```bash
cd mcp
npm install
DBIE_BASE_URL=https://dev.dbie.rbihub.in node server.mjs
```

The server speaks MCP over stdio. Payload naming follows the site's convention: a page at `/banking/liquidity-operations` serves its data at `/data/liquidity-operations.json`; generic SDMX pages at `/tables/<slug>` serve `/data/sdmx-<slug>.json`.
