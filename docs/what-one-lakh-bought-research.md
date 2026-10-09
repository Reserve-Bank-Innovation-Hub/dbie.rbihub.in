# What ₹1 lakh could buy: the research note

The story "What ₹1 lakh could buy" (S0 of the story slate, `docs/story-slate.html` on branch `stories-artifact`) carries one
sum, ₹1 lakh, from 2001 to the latest year on DBIE and prices it each year in gold, silver, a rural mason's days, US
dollars and wheat at the support price, and in the prices of the latest year by the consumer price index for
industrial workers. This note records what the processor (`data/processors/story-what-one-lakh-bought.mjs`) does,
where its figures differ from the slate's draft, and the traps still open before the gates. It grows with the story.

## Where the figures differ from the slate's draft (08-10-2026)

| Figure | Slate | Processor | Why |
|---|---|---|---|
| Gold bought in 2026 | 6.7 g (January to July 2026, from the bulletin table in the release) | 6.6 g (January to May 2026) | The processor reads the SDMX metal-price table, which ends May 2026; the bulletin report runs two months further. Decide which the story quotes; both are DBIE. |
| Dollars | $2,097 → $1,132 (financial years 2001-02 and 2025-26) | $2,119 → $1,064 (calendar 2001 and the first 178 trading days of 2026) | The story uses calendar years for every monthly series so "2001" means one thing; 2026 is averaged over the daily reference rate to 28-09-2026, which the yearly table does not yet carry. |
| Mason's days in 2025 | 153 | 153 (January to April 2025) | The same; the Labour Bureau's series stops in April 2025, so 2025 is four months. |
| Wheat in 2026 | 38.7 q (the 2025-26 price repeated) | none | The 2026-27 support price is not on DBIE; the page shows the last published year and says so. |
| Worth today | ₹4.38 lakh | ₹4,37,908 | Same. |

## Traps carried from the slate, and their state

- **CPI-IW chaining.** The 1982, 2001 and 2016 bases do not overlap on DBIE, so the linking factors cannot be
  recomputed from the data. The processor reads them from the RBI Bulletin's "Other consumer price indices" table
  (report 46: 4.63 for 1982 → 2001, 2.88 for 2001 → 2016) and checks that the chained series is continuous at
  December 2005/January 2006 and August/September 2020 (within 3%). Gate 2: confirm both from the Labour Bureau's
  own notes.
- **Gold is a bullion price.** The Mumbai monthly average, before making charges and GST, with the 2024 and 2026
  import-duty changes inside it. 2026 is a part year and the figure moves with every new month.
- **The mason.** One occupation, men only (DBIE carries no women's series). The Labour Bureau's occupation list changed
  in November 2013; the all-India mason wage read ₹329.76 in October 2013 and ₹350.91 in November. The series runs
  through the change and the method note says so. The non-agricultural labourer series starts only in November
  2013, which is why the mason, not the general labourer, is the yardstick back to 2001.
- **Support prices** are matched by marketing year: 2001 is the 2001-02 crop year.
- **Objects.** The jewellery names (a full bridal set, a pair of bangles, a chain, a pair of earrings, a ring) come
  from the story's own gram thresholds in `data.ts` (100, 40, 18, 8). They need a cited source for typical weights,
  or the reader chooses the object. The grams are the claim.
- **The dollar's direction.** ₹1 lakh buying fewer dollars is the rupee buying less; the page states it that way and
  never as "the rupee fell X%".

## The everyday-spending section, dropped

The slate's section 7 (₹1 lakh of food, housing, fuel or clothing spending in 2001, re-priced for today) needed the
CPI-IW group indices chained across the 1982, 2001 and 2016 bases. DBIE carries the groups (CO_FDGP, CO_HOUS,
CO_GIAG_FL, CO_GIAG_CBF, CO_GIAG_MS, CO_GIAG_PSTI) on all three bases, the 1982 base from January 1995, but the bases
do not overlap and neither DBIE's bulletin table nor the Labour Bureau's 2016-series report and linking-factor note
publish group-wise factors: both give the general index's 2.88 and 4.63 and centre-wise factors only. The section was
removed on 09-10-2026 rather than chain the groups with the general factors. If group-wise factors are ever published,
the groups' data is already in the scrape.
