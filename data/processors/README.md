# DBIE data processors

Local processing step for the static-hosting architecture (see `docs/05-static-amplify-s3-architecture.md`).
Turns the raw source files in `data/sources/` into the frontend-consumable JSON that the
Amplify build pulls from S3 (`s3://dbie-data/site/`) and pre-renders (SSG).

These processors are a faithful JS port of the Go backend parsers in `backend/internal/parser/`. Their
output is verified byte-for-byte (semantically) against snapshots of the live API — so the frontend can
read the JSON directly and the Go backend can be retired from the deploy path.

## Usage

```bash
pnpm install         # at repo root — installs xlsx (SheetJS) + playwright
npm run data:build   # runs all 5 processors -> out/*.json  (the S3 site/ payload)
npm run data:verify  # diffs out/*.json against oracles/  (must print ALL PASS)
```

Then upload: `aws s3 sync out/ s3://dbie-data/site/` (see the architecture doc).

### Local frontend dev

The frontend reads these JSON files from `public/data/` (git-ignored, build-synced). Amplify
populates it from S3 in `preBuild` (`aws s3 sync s3://dbie-data/site public/data`). For local dev, copy
the freshly built output in yourself:

```bash
mkdir -p ../../public/data && cp out/*.json ../../public/data/
# or pull the deployed payload: aws s3 sync s3://dbie-data/site ../../public/data
```

## Outputs (8 files, matching the 8 API endpoints)

| File | Source | Notes |
|---|---|---|
| `exchange-rates.json` | `Daily Exchange Rate of the Indian Rupee.txt` | 6501 rows |
| `forex-reserves.json` / `-recent.json` | `RBIB Table No. 32 … Weekly.xlsx` | recent = first 26 |
| `foreign-investment-inflows.json` / `-recent.json` | `RBIB Table No. 34 ….xlsx` | recent = first 12 |
| `credit-classification.json` | `Table No 3.2 … occupation.xlsx` | large (~2 MB) |
| `external-debt.json` / `-recent.json` | `India External Debt - Rupees.xlsx` | recent = first 10 |

## SheetJS ↔ excelize parity gotchas (load-bearing)

The Go backend uses `excelize`; these processors use SheetJS `xlsx` 0.18.5. To match output exactly:

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

## Verification oracles

`oracles/*.json` are snapshots captured 2026-07-02 from the (then-live) Go API — the parity reference for
the port. They are not the deployed data; regenerate real data with `npm run build`.
