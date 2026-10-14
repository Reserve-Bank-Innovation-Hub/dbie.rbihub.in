# The lights came on: data audit, 13 October 2026

The story was rebuilt on the same day, on this branch, as "Companies left, households came": the processor now reads the
scraped quarterly Table 3.2 to June 2026, the annual Tables 3.2 and 1.11 with the regional rural banks, and the CPI, and every
figure on the page is derived. The audit below describes the page as it stood before.

What the story reads, whether its figures hold, and what else DBIE holds on lending to individuals and to women.
Report ids are DBIE's. Sources: `data/reports-catalogue.json`, the scrape of 17–18 September 2026, and fresh runs of
`data/processors/story-the-lights-came-on.mjs`.

## What the story reads

One table: the quarterly Basic Statistical Return, Table 3.2, organisation-wise credit by occupation (report 958),
March 2014 to March 2026, scheduled commercial banks without the regional rural banks. The processor reads a
workbook committed by hand on 04-07-2026, `public/stories/the-lights-came-on/rbi-bsr-table-3-2-occupation-credit.xlsx`,
not the scrape. Two figures come from outside DBIE: the 1,036 million credit-eligible adults (TransUnion CIBIL) and the
Deputy Governor's remark of July 2025.

## Checks

- **The processor runs clean** and reproduces the committed oracle byte for byte.
- **The committed workbook agrees with DBIE.** Run on the scraped report 958, the same processor gives identical values
  in every field for every year and quarter; the scrape adds one quarter, June 2026.
- **One quarter behind.** DBIE now has June 2026. Individuals hold ₹46.5 of every ₹100 and companies ₹26.9.

### The page's hand-typed figures

The page types most of its numbers into the prose rather than deriving them. Recomputed from the data:

| Claim on the page | From the data | Verdict |
|---|---|---|
| ₹66,97,242 crore lent in March 2015 | 66,97,242 | holds |
| Companies ₹40, individuals ₹31 of every ₹100 in March 2015 | 40.0, 30.8 | holds |
| 12 of 104 dots lit in 2015, 35 in 2026, 23 crore new accounts | 11.6, 34.6, 23.05 crore | holds |
| Average loan ₹1.78 lakh to ₹2.81 lakh, ×1.57; accounts ×3.0; book ×4.7 | 1.78, 2.81, 1.57; 2.99; 4.71 | holds |
| Women's accounts 2.6 crore to 10.3 crore, ×4 against men's ×2.7 | 2.56, 10.30, 4.02; 2.70 | holds |
| One in five individual borrowers in 2015, nearly one in three today | 22.1%, 29.7% | holds |
| About 10 of the 35 lit dots are women's | 10.4 | holds |
| Women's accounts peaked at 11.6 crore in March 2024, 11% below now | 11.61, 11.3% | holds |
| Individual borrower count dipped in the year to March 2026 | 34.98 crore to 34.62 crore | holds |
| Every third agricultural rupee lent to an individual goes to a woman; every fifth in 2014 | 33.0%, 19.4% | holds |
| Of every 100 accounts added since 2015, 34 are women's; 22 of the 2015 stock | 33.5, 22.1 | holds |
| Personal loans ₹16.5 to ₹30.9; private companies ₹40 to ₹26.5 | the same | holds |
| The crossover came in mid-2017 | June 2017 | holds |
| **"The gap has widened every year since"** | March gaps: 20.2 (2024), 20.5 (2025), 20.1 (2026); June 2025 21.3, June 2026 19.6 | **wrong**: it narrowed in the last year |

### Points to fix or reword

- **The widening claim** above. The gap grew every March from 2017 to 2025 and has narrowed since.
- **Finance in the women-by-sector chart** goes from 36.8% to 3.3%. The row is small (₹10,000 to ₹50,000 crore of
  individual credit) and swings year to year: 5% in 2014, 37% in 2015, 26% in 2021, 3% in 2026. Comparing two single
  years there says nothing; drop the row or fold it into "All others".
- **Accounts, not people.** The prose says "borrowers" and "borrower count" about twenty times for what Table 3.2
  counts as accounts. The method note says so, but the dot field is people (1,036 million adults) while the lit dots
  are accounts, so "35 of 104 lit" reads as a share of adults.
- **A stale comment.** `src/app/stories/the-lights-came-on/data.ts` says the workbook is mirrored at
  `/public/data/…`; the page links `/stories/the-lights-came-on/…`, which is where it is.
- **Hand-typed figures.** All but the widening claim hold today, but none moves when the data does. Deriving them in
  the processor, as the ₹2 lakh line does, would let the June 2026 refresh carry through.

## What else DBIE holds on this topic

All exported by the September scrape and on disk.

### The same question, other cuts

| Id | Table | Period | What it would add |
|---|---|---|---|
| 958 | Quarterly 3.2 (the story's table, scraped) | Mar 2014 – Jun 2026 | the June 2026 quarter, and a refresh path without the hand-saved workbook |
| 1092, 1093 | Annual 3.2 and 3.2A, organisation by occupation | Mar 2026 | the same split with the regional rural banks, which lend most to rural women |
| 946, 1137 | Credit by organisation (quarterly 1.6; annual 1.11) | 2014–2026 | the individuals-versus-companies line without the occupation detail |
| 1096 | Annual 2.5, size of credit limit × organisation | Mar 2026 | how big individuals' loans are against companies' |
| 1094, 1095 | Annual 2.4 and 2.4A, type of account × organisation | Mar 2026 | term loans, cash credit and the like by borrower |
| 1122, 1124 | Annual 2.3 and 2.3A, interest-rate range × organisation | Mar 2026 | what individuals pay against companies |
| 1555, 1553 | District × gender, credit to individuals (quarterly 1.10; annual 1.14) | 2014–2026 | where women's accounts grew and fell |
| 1119 | Annual 1.12, small borrowal accounts by category of borrower | Mar 2026 | women's share among the smallest loans |
| 949 | Quarterly 1.9, weighted average lending rate by occupation | Sep 2014 – Jun 2026 | the rate on personal loans over the same years |
| 1220, 1222 | District-wise credit by bank group, population group and occupation | 2010–2026 | four more years of history, by district |

### What individuals borrow for

| Id | Table | Period | What it would add |
|---|---|---|---|
| 999, 539 | Sectoral deployment of credit: housing, vehicle, education, gold, credit cards, consumer durables, other personal loans | monthly 2019 – Jun 2026 | what the warm "personal loans" band is made of |
| 291 | Handbook 42, sectoral deployment, old and new formats | 1980–2026 | personal loans over four decades |
| 778, 612 | Payment System Indicators, number of credit cards | monthly to Jul 2026 | an RBI count of cards behind the personal-loan growth |

### Households' side and women's side

| Id | Table | Period | What it would add |
|---|---|---|---|
| 1225, 1226 | Flows and stocks of households' financial assets and liabilities | quarterly 2018–2026 | household debt against income and assets, the setting for the "indebtedness" remark |
| 508, 246 | Changes in households' financial assets and liabilities | annual 1971–2025 | the same over fifty years |
| 1556, 1554 | District and gender-wise deposits | 2024–2026 | women as savers beside women as borrowers |
| 1346, 1260 | Age-wise distribution of individual depositors | 2023–2026 | the age profile on the deposit side; no credit table has one |
| 338, 200 | Self-Help Group – Bank Linkage Programme | annual 1992–2026 | group lending to women, much of it in the agricultural rupees the story counts |
| 115 | Handbook 52, branches by population group | 1969–2026 | where the banks were as the lights came on |

## Gaps

- **The archive is not downloaded.** DBIE lists 54 annual BSR volumes from 1972. They carry the organisation-wise split
  for five decades, which would show whether individuals have led before, and the scrape fetched none.
- **No borrower counts.** DBIE counts accounts only; the people behind them come from the credit bureaus.
- **No age for borrowers.** Age appears only on the deposit side.
