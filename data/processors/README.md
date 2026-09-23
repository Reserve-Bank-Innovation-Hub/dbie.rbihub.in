# DBIE data processors

The processing step of the data pipeline: one small Node script per dataset, turning the committed
source files (`data/sdmx/` CSVs, `data/publications/` and `data/sources/` spreadsheets) into the
frontend-consumable JSON the site pre-renders (SSG). ~96 processors produce all 345 payloads.

Every processor is self-checking (hard-coded anchor values fail loudly on source drift), and every
output is verified against a committed oracle — see [docs/architecture.md](../../docs/architecture.md) for
how the release fits the rest of the pipeline.

## Usage

```bash
pnpm install                 # at repo root
pnpm data:fetch              # restores the scrape (data/sdmx, data/reports) from the public archive
pnpm data:build              # runs all processors -> out/*.json (348 files)
pnpm data:verify             # checks out/*.json against oracles/ (must print ALL PASS)
pnpm data:release            # build + verify, then upload out/ as releases/<date>-<commit>/ (--dry-run to stop short)
```

`out/` is what a release publishes. The site does not read it directly: an Amplify build runs `pnpm data:pull`,
which downloads the current release into `public/data/`, pre-renders the pages from it, and then deletes
`public/data` again (see `amplify.yml`) — the browser fetches `/data/*.json` from the release in the bucket. To
look at fresh payloads on a local dev server, copy `data/processors/out/*.json` over `public/data/` yourself.

`out/` and `public/data/` are gitignored. A release is what ships: `pnpm data:release` refuses to upload unless
`data:build` and `data:verify` both pass, so a failed oracle check stops the release.

## Verification oracles

`oracles/*.json` are committed known-good outputs, one per dataset. `verify-all.mjs` compares each
output in one of two modes:

- **exact** — source frozen; output must match the oracle byte-for-byte (semantic).
- **fresh** — source has been re-scraped since the oracle was captured; the oracle is a shape +
  history reference (structure and historical observations must agree; newer observations may
  extend the series).

The original five oracles (`exchange-rates`, `forex-reserves`, `foreign-investment-inflows`,
`credit-classification`, `external-debt`) are 2026-07-02 snapshots of the retired Go API — the
parity reference for the SheetJS port below.

## SheetJS ↔ excelize parity gotchas (load-bearing)

The retired Go backend used `excelize`; the spreadsheet processors use SheetJS `xlsx` 0.18.5. To
match its output exactly:

1. **No `readFile` in the ESM build.** `xlsx` 0.18.5 ESM exposes only `read`/`write`. Read bytes with
   `fs.readFileSync(path)` then `XLSX.read(buf, { type: 'buffer' })`.
2. **Trailing-empty-cell trimming.** `excelize.GetRows()` trims trailing empty cells per row; SheetJS pads
   them. Go's row-length guards (`if len(row) < N` / `> N`) therefore run on the *trimmed* length —
   re-derive an excelize-style trimmed length before applying any column-count guard, or row counts drift.
3. **Number-format rounding.** excelize returns each cell's *displayed* (number-format-applied) value; the
   oracle values are rounded to the cell's format precision, not the raw value. SheetJS can't render
   Indian-lakh formats (`##,##,###`) and silently falls back to the raw number. Read the format via
   `{ cellNF: true }`, derive the decimal count from the positive section, and round with
   `Number(v.toFixed(dp))`.
4. **Cells beyond `!ref`.** `sheet_to_json({header:1})` caps at the declared `!ref`; columns past it are
   dropped. Use direct cell access `ws[XLSX.utils.encode_cell({r,c})]` for those.
