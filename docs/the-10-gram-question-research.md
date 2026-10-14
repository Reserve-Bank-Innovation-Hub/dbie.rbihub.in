# The 10-gram question: the research note

The story "The 10-gram question" (S7 of the story slate, `docs/story-slate.html` on branch `stories-artifact`) follows
the Mumbai price of ten grams of gold from April 1990, the first month DBIE carries, to the latest month, splits the
rise into gold in dollars, the rupee and Mumbai's gap over the London price, sets gold against the workers' price
index from any year, and ends with the Reserve Bank's gold as a share of the reserves. This note records what the
processor (`data/processors/story-the-10-gram-question.mjs`) does, where its figures differ from the slate's draft,
and the traps still open before the gates. It grows with the story.

## What the processor reads (12-10-2026)

| Series | DBIE source | Used for |
|---|---|---|
| Mumbai gold, monthly, ₹ per 10 g | RBI Bulletin report 17, April 1990 to July 2026; checked to the rupee against the SDMX table METAL_PRICE_RN, which stops at May 2026 | the price line, the necklace, the years |
| London gold, $ an ounce, and the same in ₹ per 10 g | Handbook report 197 by month (London to April 2026) and report 108 by financial year (to 2025-26) | the three engines; the rate is read back from the two London columns, the gap is Mumbai over London-in-rupees |
| Rupee–dollar reference rate, daily | FOREX_RATE_D_RN (from January 2011 in the scrape) | a check on the rate read back from the handbook |
| CPI industrial workers | CPI_IW_RN on the 1982, 2001 and 2016 bases, chained with the bulletin's factors 4.63 and 2.88 (report 46) | gold against prices |
| Reserves by month, gold and total in dollars | FR_EXG_RESV_M_RN, March 1951 to August 2026 | gold's share of the reserves |
| Reserves by week, with tonnes | Report 574, tonnes given from 27-12-2019 | the volume beside the share |

Only the two import-duty marks are typed by hand (July 2024, 6%; May 2026, 15%), as the slate records them; the
processor labels them as not DBIE figures. Gate 2 confirms the dates and rates from the Budget and the notification.

## Where the figures differ from the slate's draft

| Figure | Slate | Processor | Why |
|---|---|---|---|
| Ten grams, April 1990 → July 2026 | ₹3,417 → ₹1,42,606, 42×, about 10.8% a year | ₹3,417 → ₹1,42,606, 41.7×, 10.8% a year | Same. |
| Gold against the workers' index from 2001 | gold ×33.6, CPI-IW ×4.4, about 8× | gold ×33.58, prices ×4.38, about 7.7× | Same figures, calendar-year averages; the multiple is stated to one decimal. |
| Gold's share of reserves | 5.5% → 14.5%, December 2016 → September 2026 ($20 bn → $111 bn) | 13.4% in April 1990, a low of 2.9% in May 2008, 15.5% in August 2026 ($116 bn of $752 bn) | The processor reads the monthly table from 1951 and quotes the story's own window, from 1990, with the low point; the slate's window started at a later date. The weekly figure for September 2026 is in the weekly report and will match once the monthly table reaches it. |
| Tonnes | 880.52 t at end-March 2026, from the RBI's annual report | 635 t at 27-12-2019 → 881 t at 28-08-2026, from the weekly report on DBIE | The weekly report gives whole tonnes; the annual report's decimal is not on DBIE. |
| Import duty | 6% → 15%, from The Week | the same two marks, typed into the processor and labelled | Not on DBIE. |
| Against a fixed deposit | "with interest rates from DBIE" | dropped | DBIE carries no series of banks' term-deposit rates over these years (the only deposit-rate table is a discontinued BSR table of weighted averages). The race runs gold against prices alone and says so. |

## The decomposition

Mumbai price = London price in dollars × rupees a dollar × Mumbai's gap, where the gap is the Mumbai price over the
London price brought into rupees (duty, GST and the trade's premium together; the handbook does not split them). The
three multiply exactly, so a window's rise in logs is the sum of the three. Over 1990-91 to 2025-26 by yearly
averages: London ×10.5, the rupee ×4.9, the gap ×0.66 (from 1.6 in 1990, when imports were restricted, to about 1.05
now), the whole ×34.3. The 1990s window is the odd one: the rupee price rose only ×1.3 while London fell and the gap
collapsed, so the engines' shares of a small whole are large and of opposite signs; the chart draws the log segments
rather than the shares.

The rate read back from the handbook's two London columns agrees with the daily reference rate's monthly average
within 1.5% in 182 of the 184 months both cover; it is 3.2% off in October 2015 and 5.6% off in December 2023, which
look like the handbook's own quirks and are left as they are. The handbook notes that its figures for 1983-84 to
1999-2000 and for 2000-01 on come from different sources and "may not be strictly comparable".

## Traps carried from the slate, and their state

- **Mumbai is not London × the rate.** The story makes the gap its third engine and names what sits in it.
- **Purity and averaging.** The bulletin's series is "standard gold", a monthly average; the page says so. Gate 2:
  confirm 999 against 995 with the Bombay Bullion Association's series description.
- **Both duty changes marked.** Marked on the price line, labelled as the story's own marks.
- **Reserve share is a valuation effect.** The tonnes stand beside the share on a card, and the text says most of the
  rise is price.
- **No advice.** The race is "what the past did"; the closing line says what to buy is not on the page.
- **The jewellery names.** The gram thresholds for "a ring" to "a full bridal set" are the story's own, shared with
  "What ₹1 lakh could buy", and need a cited source before publication.
