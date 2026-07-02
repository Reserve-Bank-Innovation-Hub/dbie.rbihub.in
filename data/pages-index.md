# Pages index

Generated 2026-04-21T09:40:13.509Z.

Maps each frontend route under `frontend/src/app/` to the 279 tables in `data/`. Use this as the authoritative list for what renders on each page.

**Legend:** `D`=Daily · `W`=Weekly · `2W`=Fortnightly · `M`=Monthly · `Q`=Quarterly · `QFY`/`AFY`/`ACY`=FY/CY variants.  Shape: `▬` stock · `▲` flow · `%` rate · `⟂` index · `·` other.

## Overview

| Route | Title | Tables | SDMX | RBIB |
|---|---|---:|---:|---:|
| [`/prices`](#prices) | Prices | **19** | 15 | 4 |
| [`/growth`](#growth) | Growth | **39** | 38 | 1 |
| [`/external`](#external) | External sector | **47** | 35 | 12 |
| [`/banking`](#banking) | Money and banking | **53** | 28 | 25 |
| [`/markets`](#markets) | Markets | **40** | 35 | 5 |
| [`/government`](#government) | Government finances | **30** | 27 | 3 |
| [`/corporate`](#corporate) | Corporate sector | **65** | 65 | 0 |
| [`/payments`](#payments) | Payments | **2** | 1 | 1 |

---

## `/prices` — Prices {#prices}

*What things cost — CPI, WPI, house prices, metal prices, wages.*

**19** tables (15 SDMX + 4 RBIB).

### SDMX · Real Sector / Prices & Wages — 15

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Consumer Price Index - Agriculture and Rural Labourer(State wise) | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-agriculture-and-rural-labourer-state-wise.csv` |
| Consumer Price Index - Agriculture Labourer(Average/Year end) | AFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-agriculture-labourer-average-year-end.csv` |
| Consumer Price Index - Annual Average/Variation | AFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-annual-average-variation.csv` |
| Consumer Price Index - Annual Variation | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-annual-variation.csv` |
| Consumer Price Index - Industrial Worker | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-industrial-worker.csv` |
| Consumer Price Index - Industrial worker(Average/Year End) | AFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-industrial-worker-average-year-end.csv` |
| Consumer Price Index - Industrial Workers (All India and Selected Centres) | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-industrial-workers-all-india-and-selected-centres.csv` |
| Consumer Price Index - Rural Labourer | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-rural-labourer.csv` |
| Consumer Price Index - Rural Labourer(Average/Year End) | AFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-rural-labourer-average-year-end.csv` |
| Consumer Price Index - Rural, Urban, Combined (All India) | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/consumer-price-index-rural-urban-combined-all-india.csv` |
| CPI-Agricultural Labourer | M | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/cpi-agricultural-labourer.csv` |
| House Price Index | QFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/house-price-index.csv` |
| Metal Price | M | · | SDMX | `data/sdmx/real-sector/prices-wages/metal-price.csv` |
| Metal Price - Annual Average | AFY | · | SDMX | `data/sdmx/real-sector/prices-wages/metal-price-annual-average.csv` |
| Wholesale Price Index - Annual Average/Variation | AFY | ⟂ | SDMX | `data/sdmx/real-sector/prices-wages/wholesale-price-index-annual-average-variation.csv` |

### RBIB Monthly Bulletin · Prices And Production — 4

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Consumer Price Index Base 2010 100 | M | ⟂ | RBIB-19 | `data/publications/monthly-rbi-bulletin/prices-and-production/table-19-consumer-price-index-base-2010-100.xlsx` |
| Monthly Average Price Of Gold And Silver In Mumbai | M | · | RBIB-21 | `data/publications/monthly-rbi-bulletin/prices-and-production/table-21-monthly-average-price-of-gold-and-silver-in-mumbai.xlsx` |
| Other Consumer Price Indices | M | · | RBIB-20 | `data/publications/monthly-rbi-bulletin/prices-and-production/table-20-other-consumer-price-indices.xlsx` |
| Wholesale Price Index Base Year 2011 12 | M | ⟂ | RBIB-22 | `data/publications/monthly-rbi-bulletin/prices-and-production/table-22-wholesale-price-index-base-year-2011-12.xlsx` |

---

## `/growth` — Growth {#growth}

*What India produces — GDP, industrial production, agriculture, national income.*

**39** tables (38 SDMX + 1 RBIB).

### SDMX · Real Sector / Agriculture — 10

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Agricultural Index | AFY | ⟂ | SDMX | `data/sdmx/real-sector/Agriculture/agricultural-index.csv` |
| Agricultural Index - Major crops | AFY | ⟂ | SDMX | `data/sdmx/real-sector/Agriculture/agricultural-index-major-crops.csv` |
| Agricultural Production | AFY | ▲ | SDMX | `data/sdmx/real-sector/Agriculture/agricultural-production.csv` |
| Agricultural Productivity | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/agricultural-productivity.csv` |
| Agricultural Statistics - Indian State | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/agricultural-statistics-indian-state.csv` |
| Area Under Cultivation | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/area-under-cultivation.csv` |
| Minimum Support Price | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/minimum-support-price.csv` |
| Pattern of Land Use & Use of Agriculltural inputs in India | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/pattern-of-land-use-use-of-agriculltural-inputs-in-india.csv` |
| Public Distribution System of agriculture produce | AFY | · | SDMX | `data/sdmx/real-sector/Agriculture/public-distribution-system-of-agriculture-produce.csv` |
| State wise agricultural production | AFY | ▲ | SDMX | `data/sdmx/real-sector/Agriculture/state-wise-agricultural-production.csv` |

### SDMX · Real Sector / Industrial Statistics — 12

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Central Sector Delayed Projects | AFY | · | SDMX | `data/sdmx/real-sector/industrial-statistics/central-sector-delayed-projects.csv` |
| Central Sector Projects | AFY | · | SDMX | `data/sdmx/real-sector/industrial-statistics/central-sector-projects.csv` |
| Details captured under Annual Survey of Industries | AFY | · | SDMX | `data/sdmx/real-sector/industrial-statistics/details-captured-under-annual-survey-of-industries.csv` |
| Imports of Petroleum Products | AFY | · | SDMX | `data/sdmx/real-sector/industrial-statistics/imports-of-petroleum-products.csv` |
| Index Numbers of Core/Infrastructure Industries | AFY | ⟂ | SDMX | `data/sdmx/real-sector/industrial-statistics/index-numbers-of-core-infrastructure-industries.csv` |
| Index Numbers of Core/Infrastructure Industries - Growth Rates | AFY | ⟂ | SDMX | `data/sdmx/real-sector/industrial-statistics/index-numbers-of-core-infrastructure-industries-growth-rates.csv` |
| Index of Industrial Production | M | ⟂ | SDMX | `data/sdmx/real-sector/industrial-statistics/index-of-industrial-production.csv` |
| Indian Industrial Production Manufacturing Sector Anually | AFY | ▲ | SDMX | `data/sdmx/real-sector/industrial-statistics/indian-industrial-production-manufacturing-sector-anually.csv` |
| Indian Industrial Production Manufacturing Sector Monthly | M | ▲ | SDMX | `data/sdmx/real-sector/industrial-statistics/indian-industrial-production-manufacturing-sector-monthly.csv` |
| Perfomance of SSI Sector | AFY | · | SDMX | `data/sdmx/real-sector/industrial-statistics/perfomance-of-ssi-sector.csv` |
| Production of Petroleum Products | AFY | ▲ | SDMX | `data/sdmx/real-sector/industrial-statistics/production-of-petroleum-products.csv` |
| Production of Select Industries | AFY | ▲ | SDMX | `data/sdmx/real-sector/industrial-statistics/production-of-select-industries.csv` |

### SDMX · Real Sector / National Income — 16

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Annual Gross Domestic Product at Market Price | AFY | · | SDMX | `data/sdmx/real-sector/national-income/annual-gross-domestic-product-at-market-price.csv` |
| Annual Gross Value Added at Basic Prices | AFY | · | SDMX | `data/sdmx/real-sector/national-income/annual-gross-value-added-at-basic-prices.csv` |
| Changes in Financial Assets of the Household Sector | AFY | · | SDMX | `data/sdmx/real-sector/national-income/changes-in-financial-assets-of-the-household-sector.csv` |
| Changes in Financial Liabilities of the Household Sector | AFY | · | SDMX | `data/sdmx/real-sector/national-income/changes-in-financial-liabilities-of-the-household-sector.csv` |
| Components and Economic Activity of Domestic Products at  Factor Cost - State Wise | AFY | · | SDMX | `data/sdmx/real-sector/national-income/components-and-economic-activity-of-domestic-products-at-factor-cost-state-wise.csv` |
| Gross Net Capital Formation | AFY | · | SDMX | `data/sdmx/real-sector/national-income/gross-net-capital-formation.csv` |
| Gross State Domestic Product | AFY | · | SDMX | `data/sdmx/real-sector/national-income/gross-state-domestic-product.csv` |
| Macro Economic Aggregate Rates | AFY | · | SDMX | `data/sdmx/real-sector/national-income/macro-economic-aggregate-rates.csv` |
| Macro Economic Aggregates | AFY | · | SDMX | `data/sdmx/real-sector/national-income/macro-economic-aggregates.csv` |
| Net State Domestic Product at Factor cost | AFY | · | SDMX | `data/sdmx/real-sector/national-income/net-state-domestic-product-at-factor-cost.csv` |
| Per Capita Net State Domestic Product at Factor Cost | AFY | · | SDMX | `data/sdmx/real-sector/national-income/per-capita-net-state-domestic-product-at-factor-cost.csv` |
| Quarterly Gross Domestic Product at Factor cost / Gross value added at basic price | QFY | · | SDMX | `data/sdmx/real-sector/national-income/quarterly-gross-domestic-product-at-factor-cost-gross-value-added-at-basic-price.csv` |
| Quarterly Gross Domestic Product at Market Price | QFY | · | SDMX | `data/sdmx/real-sector/national-income/quarterly-gross-domestic-product-at-market-price.csv` |
| Sector-wise Domestic Savings | AFY | · | SDMX | `data/sdmx/real-sector/national-income/sector-wise-domestic-savings.csv` |
| Sector-wise Employment | AFY | · | SDMX | `data/sdmx/real-sector/national-income/sector-wise-employment.csv` |
| Sector-wise Gross Capital Formation | AFY | · | SDMX | `data/sdmx/real-sector/national-income/sector-wise-gross-capital-formation.csv` |

### RBIB Monthly Bulletin · Prices And Production — 1

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Index Of Industrial Production Base 2004 05 100 2011 12 | M | ⟂ | RBIB-23 | `data/publications/monthly-rbi-bulletin/prices-and-production/table-23-index-of-industrial-production-base-2004-05-100-2011-12.xlsx`<br> ↔ INX_INDS_PROD_RN |

---

## `/external` — External sector {#external}

*India and the world — balance of payments, forex reserves, the rupee, external debt, foreign investment.*

**47** tables (35 SDMX + 12 RBIB).

### SDMX · External Sector / External Debt — 2

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| External Debt Ratio | QFY | ▬ | SDMX | `data/sdmx/external-sector/external-debt/external-debt-ratio.csv` |
| India's External Debt | AFY | ▬ | SDMX | `data/sdmx/external-sector/external-debt/indias-external-debt.csv` |

### SDMX · External Sector / External Sector Indices — 4

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| General Index Numbers and Terms of Foreign Trade | AFY | ⟂ | SDMX | `data/sdmx/external-sector/external-sector-indices/general-index-numbers-and-terms-of-foreign-trade.csv` |
| Indices of REER/NEER Annually | AFY | ⟂ | SDMX | `data/sdmx/external-sector/external-sector-indices/indices-of-reer-neer-annually.csv` |
| Indices of REER/NEER Monthly | M | ⟂ | SDMX | `data/sdmx/external-sector/external-sector-indices/indices-of-reer-neer-monthly.csv` |
| Trade Index Numbers | AFY | ⟂ | SDMX | `data/sdmx/external-sector/external-sector-indices/trade-index-numbers.csv` |

### SDMX · External Sector / Forex Reserve — 2

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Foreign Exchange Reserves | W | · | SDMX | `data/sdmx/external-sector/forex-reserve/foreign-exchange-reserves.csv` |
| Foreign Exchange Reserves Monthly | M | · | SDMX | `data/sdmx/external-sector/forex-reserve/foreign-exchange-reserves-monthly.csv` |

### SDMX · External Sector / International Finance — 13

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| External assistance | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/external-assistance.csv` |
| Foreign Investment Inflows | M | · | SDMX | `data/sdmx/external-sector/international-finance/foreign-investment-inflows.csv` |
| Foreign Investment Inflows Annually | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/foreign-investment-inflows-annually.csv` |
| Foreign Liabilities and Assets for Mutual Fund and Assets Management Companies | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/foreign-liabilities-and-assets-for-mutual-fund-and-assets-management-companies.csv` |
| Foreign Liabilities and Assets for Mutual Fund and Assets Management Companies - Country Wise | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/foreign-liabilities-and-assets-for-mutual-fund-and-assets-management-companies-country-wise.csv` |
| Foreign Liabilities for Mutual Fund-Non Resident Holding | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/foreign-liabilities-for-mutual-fund-non-resident-holding.csv` |
| International Investment Position of India BPM5 | QFY | ▬ | SDMX | `data/sdmx/external-sector/international-finance/international-investment-position-of-india-bpm5.csv` |
| International Investment Position of India BPM6 | QFY | ▬ | SDMX | `data/sdmx/external-sector/international-finance/international-investment-position-of-india-bpm6.csv` |
| NRI Deposits Inflow/Outflow Annually | AFY | ▲ | SDMX | `data/sdmx/external-sector/international-finance/nri-deposits-inflow-outflow-annually.csv` |
| NRI Deposits Inflow/Outflow Monthly | M | ▲ | SDMX | `data/sdmx/external-sector/international-finance/nri-deposits-inflow-outflow-monthly.csv` |
| NRI Deposits Outstanding Monthly | M | · | SDMX | `data/sdmx/external-sector/international-finance/nri-deposits-outstanding-monthly.csv` |
| NRI Deposits Outstandings Annually | AFY | · | SDMX | `data/sdmx/external-sector/international-finance/nri-deposits-outstandings-annually.csv` |
| Outward Remittance | M | · | SDMX | `data/sdmx/external-sector/international-finance/outward-remittance.csv` |

### SDMX · External Sector / International Trade — 14

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Balance Of Payments Indicators | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/balance-of-payments-indicators.csv` |
| Broad Commodity Composition of India's Merchandise Trade | M | ▲ | SDMX | `data/sdmx/external-sector/international-trade/broad-commodity-composition-of-indias-merchandise-trade.csv` |
| Direction of Foreign Trade | AFY | ▲ | SDMX | `data/sdmx/external-sector/international-trade/direction-of-foreign-trade.csv` |
| Export of Principal commodities | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/export-of-principal-commodities.csv` |
| Exports of Select Commodities to Principal Countries | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/exports-of-select-commodities-to-principal-countries.csv` |
| Import of Principal commodities | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/import-of-principal-commodities.csv` |
| India's Foreign Trade - Oil & Non-Oil | M | ▲ | SDMX | `data/sdmx/external-sector/international-trade/indias-foreign-trade-oil-non-oil.csv` |
| India's Foreign Trade - Oil & Non-Oil_Annually | AFY | ▲ | SDMX | `data/sdmx/external-sector/international-trade/indias-foreign-trade-oil-non-oil-annually.csv` |
| India's Overall Balance of Payments | QFY | · | SDMX | `data/sdmx/external-sector/international-trade/indias-overall-balance-of-payments.csv` |
| India's Overall Balance of Payments Annually | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/indias-overall-balance-of-payments-annually.csv` |
| Invisibles By Category of Transactions | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/invisibles-by-category-of-transactions.csv` |
| Invisibles Payments | QFY | · | SDMX | `data/sdmx/external-sector/international-trade/invisibles-payments.csv` |
| Invisibles Receipts | QFY | · | SDMX | `data/sdmx/external-sector/international-trade/invisibles-receipts.csv` |
| Key components of India's Overall Balance of Payments | AFY | · | SDMX | `data/sdmx/external-sector/international-trade/key-components-of-indias-overall-balance-of-payments.csv` |

### RBIB Monthly Bulletin · External Sector — 12

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| External Commercial Borrowings Ecbs Registrations | M | · | RBIB-38 | `data/publications/monthly-rbi-bulletin/external-sector/table-38-external-commercial-borrowings-ecbs-registrations.xlsx` |
| Foreign Exchange Reserves Weekly | W | · | RBIB-33 | `data/publications/monthly-rbi-bulletin/external-sector/table-33-foreign-exchange-reserves-weekly.xlsx`<br> ↔ FR_EXG_RESV_RN |
| Foreign Investment Inflows | M | · | RBIB-35 | `data/publications/monthly-rbi-bulletin/external-sector/table-35-foreign-investment-inflows.xlsx`<br> ↔ FR_INV_INFLW_A_RN, FR_INV_INFLW_RN |
| Foreign Trade | M | ▲ | RBIB-32 | `data/publications/monthly-rbi-bulletin/external-sector/table-32-foreign-trade.xlsx`<br> ↔ INX_NBR_TERM_FR_TRD_RN, DIR_FR_TRD_RN, IFT_OIL_NON_OIL_A_RN, IFT_OIL_NON_OIL_RN |
| Indias Overall Balance Of Payments Rupees Crore | M | · | RBIB-41 | `data/publications/monthly-rbi-bulletin/external-sector/table-41-indias-overall-balance-of-payments-rupees-crore.xlsx` |
| Indias Overall Balance Of Payments Us Million | M | · | RBIB-40 | `data/publications/monthly-rbi-bulletin/external-sector/table-40-indias-overall-balance-of-payments-us-million.xlsx` |
| Indices Of Real Effective Exchange Rate Reer And Nominal Effective Exchange Rate Neer Of The Indian Rupee | M | ⟂ | RBIB-37 | `data/publications/monthly-rbi-bulletin/external-sector/table-37-indices-of-real-effective-exchange-rate-reer-and-nominal-effective-exchange-rate-neer-of-the-indian-rupee.xlsx` |
| International Investment Position | M | ▬ | RBIB-44 | `data/publications/monthly-rbi-bulletin/external-sector/table-44-international-investment-position.xlsx`<br> ↔ INTR_INV_POS_IND_RN, INTR_INV_POS_IND_BPM6_RN |
| Nri Deposits | M | · | RBIB-34 | `data/publications/monthly-rbi-bulletin/external-sector/table-34-nri-deposits.xlsx`<br> ↔ NRI_DEPOSITS_IN_OUT_A_RN, NRI_DEPOSITS_IN_OUT_RN, NRI_DEPOSITS_OUTS_RN, NRI_DEPOSITS_OUTS_A_RN |
| Outward Remittances Under The Liberalised Remittance Scheme For Resident Individuals | M | · | RBIB-36 | `data/publications/monthly-rbi-bulletin/external-sector/table-36-outward-remittances-under-the-liberalised-remittance-scheme-for-resident-individuals.xlsx`<br> ↔ OUTW_REMIT_RN |
| Standard Presentation Of Bop In India As Per Bpm6 Rs Crore | M | · | RBIB-43 | `data/publications/monthly-rbi-bulletin/external-sector/table-43-standard-presentation-of-bop-in-india-as-per-bpm6-rs-crore.xlsx` |
| Standard Presentation Of Bop In India As Per Bpm6 Us Million | M | · | RBIB-42 | `data/publications/monthly-rbi-bulletin/external-sector/table-42-standard-presentation-of-bop-in-india-as-per-bpm6-us-million.xlsx` |

---

## `/banking` — Money and banking {#banking}

*Money supply, RBI balance sheet, bank credit by sector, monetary aggregates.*

**53** tables (28 SDMX + 25 RBIB).

### SDMX · Financial Sector — 1

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Loans and Advances of SCBs State and Occupation wise BSR1 Annual | AFY | · | SDMX | `data/sdmx/financial-sector/loans-and-advances-of-scbs-state-and-occupation-wise-bsr1-annual.csv` |

### SDMX · Financial Sector / Monetary Statistics — 27

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Average Monetary Aggregates | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/average-monetary-aggregates.csv` |
| Broad Money Components_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/broad-money-components-monthly.csv` |
| Commercial Survey Component Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/commercial-survey-component-monthly.csv` |
| Commercial Survey Component_Fortnightly | 2W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/commercial-survey-component-fortnightly.csv` |
| Commercial Survey Sources Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/commercial-survey-sources-monthly.csv` |
| Commercial Survey Sources_Fortnightly | 2W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/commercial-survey-sources-fortnightly.csv` |
| Monetary Aggregates | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/monetary-aggregates.csv` |
| Monetary Ratios | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/monetary-ratios.csv` |
| Monetary Survey Components_Fortnightly | 2W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/monetary-survey-components-fortnightly.csv` |
| Monetary Survey Sources_Fortnightly | 2W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/monetary-survey-sources-fortnightly.csv` |
| Money Stock Components_Fortnightly | 2W | ▬ | SDMX | `data/sdmx/financial-sector/monetary-statistics/money-stock-components-fortnightly.csv` |
| Money Stock Sources_Fortnightly | 2W | ▬ | SDMX | `data/sdmx/financial-sector/monetary-statistics/money-stock-sources-fortnightly.csv` |
| Money Stock Sources_Monthly | M | ▬ | SDMX | `data/sdmx/financial-sector/monetary-statistics/money-stock-sources-monthly.csv` |
| Notes & Coin in Circulation | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/notes-coin-in-circulation.csv` |
| RBI Asset_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-asset-monthly.csv` |
| RBI Asset_Weekly | W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-asset-weekly.csv` |
| RBI Assets_Annual | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-assets-annual.csv` |
| RBI Liabilities_Annual | AFY | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-liabilities-annual.csv` |
| RBI Liabilities_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-liabilities-monthly.csv` |
| RBI Liabilities_Weekly | W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-liabilities-weekly.csv` |
| RBI Survey Components_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-survey-components-monthly.csv` |
| RBI Survey Sources_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-survey-sources-monthly.csv` |
| RBI_Standing Facilities | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/rbi-standing-facilities.csv` |
| Reserve Money Components_Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/reserve-money-components-monthly.csv` |
| Reserve Money Components_Weekly | W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/reserve-money-components-weekly.csv` |
| Reserve Money Sources _Monthly | M | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/reserve-money-sources-monthly.csv` |
| Reserve Money Sources _Weekly | W | · | SDMX | `data/sdmx/financial-sector/monetary-statistics/reserve-money-sources-weekly.csv` |

### RBIB Monthly Bulletin · Money And Banking — 12

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Business In India All Scheduled Banks And All Scheduled Commercial Banks | M | · | RBIB-14 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-14-business-in-india-all-scheduled-banks-and-all-scheduled-commercial-banks.xlsx` |
| Commercial Bank Survey | M | · | RBIB-12 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-12-commercial-bank-survey.xlsx` |
| Deployment Of Gross Bank Credit By Major Sectors | M | · | RBIB-15 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-15-deployment-of-gross-bank-credit-by-major-sectors.xlsx` |
| Industry Wise Deployment Of Bank Credit | M | · | RBIB-16 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-16-industry-wise-deployment-of-bank-credit.xlsx` |
| Liquidity Aggregates | M | · | RBIB-09 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-09-liquidity-aggregates.xlsx` |
| Monetary Survey | M | · | RBIB-08 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-08-monetary-survey.xlsx`<br> ↔ MSURYCOM_F_RN, MSURYSOR_F_RN |
| Money Stock Measures | M | ▬ | RBIB-06 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-06-money-stock-measures.xlsx` |
| Reserve Bank Of India Survey | M | · | RBIB-10 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-10-reserve-bank-of-india-survey.xlsx` |
| Reserve Money Components And Sources | M | · | RBIB-11 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-11-reserve-money-components-and-sources.xlsx` |
| Scheduled Commercial Banks Investments | M | · | RBIB-13 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-13-scheduled-commercial-banks-investments.xlsx` |
| Sources Of Money Stock M3 | M | ▬ | RBIB-07 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-07-sources-of-money-stock-m3.xlsx` |
| State Co Operative Banks Maintaining Accounts With The Reserve Bank Of India | M | · | RBIB-17 | `data/publications/monthly-rbi-bulletin/money-and-banking/table-17-state-co-operative-banks-maintaining-accounts-with-the-reserve-bank-of-india.xlsx` |

### RBIB Monthly Bulletin · Occasional Series — 8

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Combined Receipts And Disbursements Of The Central And State Governments | M | · | RBIB-48 | `data/publications/monthly-rbi-bulletin/occasional-series/table-48-combined-receipts-and-disbursements-of-the-central-and-state-governments.xlsx` |
| Financial Accommodation Availed By State Governments Under Various Facilities | M | · | RBIB-49 | `data/publications/monthly-rbi-bulletin/occasional-series/table-49-financial-accommodation-availed-by-state-governments-under-various-facilities.xlsx` |
| Investments By State Governments | M | · | RBIB-50 | `data/publications/monthly-rbi-bulletin/occasional-series/table-50-investments-by-state-governments.xlsx` |
| Market Borrowings Of State Governments | M | · | RBIB-51 | `data/publications/monthly-rbi-bulletin/occasional-series/table-51-market-borrowings-of-state-governments.xlsx` |
| Ownership Pattern Of Government Of India Dated Securities | M | · | RBIB-47 | `data/publications/monthly-rbi-bulletin/occasional-series/table-47-ownership-pattern-of-government-of-india-dated-securities.xlsx` |
| RBIB Table No. 52 (a)_ Flow of Financial Assets and Liabilities of Households - Instrument-wise | M | · | RBIB-null | `data/publications/monthly-rbi-bulletin/occasional-series/RBIB Table No. 52 (a)_ Flow of Financial Assets and Liabilities of Households - Instrument-wise.xlsx` |
| RBIB Table No. 52 (b)_ Stocks of Financial Assets and Liabilities of Households - Select Indicators | M | · | RBIB-null | `data/publications/monthly-rbi-bulletin/occasional-series/RBIB Table No. 52 (b)_ Stocks of Financial Assets and Liabilities of Households - Select Indicators.xlsx` |
| Small Savings | M | · | RBIB-46 | `data/publications/monthly-rbi-bulletin/occasional-series/table-46-small-savings.xlsx`<br> ↔ SMAL_SAV_RN |

### RBIB Monthly Bulletin · Rbi — 5

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Liquidity Operations By Rbi | M | · | RBIB-03 | `data/publications/monthly-rbi-bulletin/rbi/table-03-liquidity-operations-by-rbi.xlsx` |
| Rbi Liabilities And Assets | M | · | RBIB-02 | `data/publications/monthly-rbi-bulletin/rbi/table-02-rbi-liabilities-and-assets.xlsx` |
| Rbis Standing Facilities | M | · | RBIB-05 | `data/publications/monthly-rbi-bulletin/rbi/table-05-rbis-standing-facilities.xlsx` |
| Sale Purchase Of Us Dollar By The Rbi | M | ▲ | RBIB-04 | `data/publications/monthly-rbi-bulletin/rbi/table-04-sale-purchase-of-us-dollar-by-the-rbi.xlsx` |
| Select Economic Indicators | M | · | RBIB-01 | `data/publications/monthly-rbi-bulletin/rbi/table-01-select-economic-indicators.xlsx` |

---

## `/markets` — Markets {#markets}

*Equity, debt, forex and money markets — indices, yields, rates, turnover.*

**40** tables (35 SDMX + 5 RBIB).

### SDMX · Financial Markets / Equity and Corporate Debt Market — 9

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Average of Nifty 50 | M | ⟂ | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/average-of-nifty-50.csv` |
| Book Value Ratio of BSE | M | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/book-value-ratio-of-bse.csv` |
| BSE INIDICES | D | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/bse-inidices.csv` |
| Earning Ratio of BSE | M | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/earning-ratio-of-bse.csv` |
| Market Information BSE | D | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/market-information-bse.csv` |
| Market Information NSE | D | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/market-information-nse.csv` |
| NSE INIDICES | D | · | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/nse-inidices.csv` |
| Turnover at NSE | M | ▲ | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/turnover-at-nse.csv` |
| Turnover BSE | M | ▲ | SDMX | `data/sdmx/financial-markets/equity-and-corporate-debt-market/turnover-bse.csv` |

### SDMX · Financial Markets / Forex Market — 11

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Average Forex Rate | M | % | SDMX | `data/sdmx/financial-markets/forex-market/average-forex-rate.csv` |
| Exchange rate of indian rupees | ACY | % | SDMX | `data/sdmx/financial-markets/forex-market/exchange-rate-of-indian-rupees-cy.csv` |
| Exchange rate of indian rupees | ACY | % | SDMX | `data/sdmx/financial-markets/forex-market/exchange-rate-of-indian-rupees-fy.csv` |
| EXCHANGE RATE OF THE INDIAN RUPEE | M | % | SDMX | `data/sdmx/financial-markets/forex-market/exchange-rate-of-the-indian-rupee.csv` |
| EXCHANGE RATE OF THE INDIAN RUPEE DAILY | D | % | SDMX | `data/sdmx/financial-markets/forex-market/exchange-rate-of-the-indian-rupee-daily.csv` |
| FOREIGN EXCHANGE RATE AVERAGE | M | % | SDMX | `data/sdmx/financial-markets/forex-market/foreign-exchange-rate-average.csv` |
| FOREIGN EXCHANGE RATE HIGH LOW | M | % | SDMX | `data/sdmx/financial-markets/forex-market/foreign-exchange-rate-high-low.csv` |
| Forex rates based on reference rate | M | % | SDMX | `data/sdmx/financial-markets/forex-market/forex-rates-based-on-reference-rate.csv` |
| FORWARD CASH PREMIA DAILY | D | · | SDMX | `data/sdmx/financial-markets/forex-market/forward-cash-premia-daily.csv` |
| FORWARD PREMIA (INTER-BANK) | M | · | SDMX | `data/sdmx/financial-markets/forex-market/forward-premia-inter-bank.csv` |
| Inter Bank Forex Rates | D | · | SDMX | `data/sdmx/financial-markets/forex-market/inter-bank-forex-rates.csv` |

### SDMX · Financial Markets / Government Securities Market — 8

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Govt of India Treasury Bills Outstanding | W | · | SDMX | `data/sdmx/financial-markets/government-securities-market/govt-of-india-treasury-bills-outstanding.csv` |
| Interest Rate | AFY | % | SDMX | `data/sdmx/financial-markets/government-securities-market/interest-rate.csv` |
| Market Borrowing of GOI and Stat Govt | W | · | SDMX | `data/sdmx/financial-markets/government-securities-market/market-borrowing-of-goi-and-stat-govt.csv` |
| Open market operations of RBI | M | · | SDMX | `data/sdmx/financial-markets/government-securities-market/open-market-operations-of-rbi.csv` |
| Secondary market transactions | M | · | SDMX | `data/sdmx/financial-markets/government-securities-market/secondary-market-transactions.csv` |
| Turnover In Government Securities Market | W | ▲ | SDMX | `data/sdmx/financial-markets/government-securities-market/turnover-in-government-securities-market.csv` |
| YIELD OF SGL TRANSACTIONS IN GOVERNMENT DATED SECURITIES | M | % | SDMX | `data/sdmx/financial-markets/government-securities-market/yield-of-sgl-transactions-in-government-dated-securities.csv` |
| YIELD OF SGL TRANSACTIONS IN TREASURY BILLS | M | % | SDMX | `data/sdmx/financial-markets/government-securities-market/yield-of-sgl-transactions-in-treasury-bills.csv` |

### SDMX · Financial Markets / Money Market — 7

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Auction under LAF | D | ▲ | SDMX | `data/sdmx/financial-markets/money-market/auction-under-laf.csv` |
| Average Daily Turnover | W | ▲ | SDMX | `data/sdmx/financial-markets/money-market/average-daily-turnover.csv` |
| Certificates of Deposit | 2W | ▬ | SDMX | `data/sdmx/financial-markets/money-market/certificates-of-deposit.csv` |
| Commercial Paper | 2W | · | SDMX | `data/sdmx/financial-markets/money-market/commercial-paper.csv` |
| London Inter Bank Overnight Offer Rates | D | · | SDMX | `data/sdmx/financial-markets/money-market/london-inter-bank-overnight-offer-rates.csv` |
| Weekly  call money | W | · | SDMX | `data/sdmx/financial-markets/money-market/weekly-call-money.csv` |
| Weighted Average Call Money Rates | M | · | SDMX | `data/sdmx/financial-markets/money-market/weighted-average-call-money-rates.csv` |

### RBIB Monthly Bulletin · Financial Markets — 5

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Average Daily Turnover In Select Financial Markets | D | ▲ | RBIB-30 | `data/publications/monthly-rbi-bulletin/financial-markets/table-30-average-daily-turnover-in-select-financial-markets.xlsx`<br> ↔ AVG_TURNOVER_RN |
| Certificates Of Deposit | M | ▬ | RBIB-28 | `data/publications/monthly-rbi-bulletin/financial-markets/table-28-certificates-of-deposit.xlsx`<br> ↔ CERTI_DEPO_RN |
| Commercial Paper | M | · | RBIB-29 | `data/publications/monthly-rbi-bulletin/financial-markets/table-29-commercial-paper.xlsx`<br> ↔ COM_PAPER_RN |
| Daily Call Money Rates | D | · | RBIB-27 | `data/publications/monthly-rbi-bulletin/financial-markets/table-27-daily-call-money-rates.xlsx` |
| New Capital Issues By Non Government Public Limited Companies | M | · | RBIB-31 | `data/publications/monthly-rbi-bulletin/financial-markets/table-31-new-capital-issues-by-non-government-public-limited-companies.xlsx` |

---

## `/government` — Government finances {#government}

*Centre, States, combined — budgets, borrowing, deficits, tax, Treasury Bills.*

**30** tables (27 SDMX + 3 RBIB).

### SDMX · Public Finance / Cental & State Govt Finance(Combined) — 9

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Combined Central & State Expenditures | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/combined-central-state-expenditures.csv` |
| Combined Central & State Government Deficit | AFY | ▲ | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/combined-central-state-government-deficit.csv` |
| Combined Central & State Government Disbursments | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/combined-central-state-government-disbursments.csv` |
| Combined Central & State Government Receipts | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/combined-central-state-government-receipts.csv` |
| Combined Central and State Government Liabilities | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/combined-central-and-state-government-liabilities.csv` |
| Debt Indicators of Government as percentage to GDP | AFY | ▬ | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/debt-indicators-of-government-as-percentage-to-gdp.csv` |
| Deficit of Government as percentage to GDP | AFY | ▲ | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/deficit-of-government-as-percentage-to-gdp.csv` |
| Direct and Indirect Tax Revenues | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/direct-and-indirect-tax-revenues.csv` |
| Market Borrowings of Governments | AFY | · | SDMX | `data/sdmx/public-finance/cental-state-govt-financecombined/market-borrowings-of-governments.csv` |

### SDMX · Public Finance / Central Govt Finance — 12

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Budgetary Resources | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/budgetary-resources.csv` |
| Central Government Borrowings | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-borrowings.csv` |
| Central Government Deficit | AFY | ▲ | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-deficit.csv` |
| Central Government Deficit Monthly | M | ▲ | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-deficit-monthly.csv` |
| Central Government Expenditures | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-expenditures.csv` |
| Central Government Liabilities | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-liabilities.csv` |
| Central Government Receipts | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/central-government-receipts.csv` |
| Devlopmental and Non-Devlopmental  Expenditures - Central Government | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/devlopmental-and-non-devlopmental-expenditures-central-government.csv` |
| Fiscal Indicators of the Central Government as per centage to GDP | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/fiscal-indicators-of-the-central-government-as-per-centage-to-gdp.csv` |
| Public Sector Borrowings | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/public-sector-borrowings.csv` |
| Public Sector Plan Outlay | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/public-sector-plan-outlay.csv` |
| Small Savings | AFY | · | SDMX | `data/sdmx/public-finance/central-govt-finance/small-savings.csv` |

### SDMX · Public Finance / State Govt Finance — 6

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Expenditure Pattern of the State Governments | AFY | · | SDMX | `data/sdmx/public-finance/state-govt-finance/expenditure-pattern-of-the-state-governments.csv` |
| Fiscal Indicators of the State Government as per centage to GDP | AFY | · | SDMX | `data/sdmx/public-finance/state-govt-finance/fiscal-indicators-of-the-state-government-as-per-centage-to-gdp.csv` |
| State Finances a Study of Budgets | AFY | · | SDMX | `data/sdmx/public-finance/state-govt-finance/state-finances-a-study-of-budgets.csv` |
| State Government Capital and Revenue Expenditures | AFY | · | SDMX | `data/sdmx/public-finance/state-govt-finance/state-government-capital-and-revenue-expenditures.csv` |
| State Government Gross Fiscal Deficit Financing | AFY | ▲ | SDMX | `data/sdmx/public-finance/state-govt-finance/state-government-gross-fiscal-deficit-financing.csv` |
| State Government Liabilities | AFY | · | SDMX | `data/sdmx/public-finance/state-govt-finance/state-government-liabilities.csv` |

### RBIB Monthly Bulletin · Government Accounts And Treasury Bills — 3

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Auctions Of Government Of India Treasury Bills | M | · | RBIB-26 | `data/publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-26-auctions-of-government-of-india-treasury-bills.xlsx` |
| Treasury Bills Ownership Pattern | M | · | RBIB-25 | `data/publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-25-treasury-bills-ownership-pattern.xlsx` |
| Union Government Accounts At A Glance | M | · | RBIB-24 | `data/publications/monthly-rbi-bulletin/government-accounts-and-treasury-bills/table-24-union-government-accounts-at-a-glance.xlsx` |

---

## `/corporate` — Corporate sector {#corporate}

*Balance sheets, P&L, financial ratios for listed, private, public, FDI and NBFI companies.*

**65** tables (65 SDMX + 0 RBIB).

### SDMX · Corporate Sector / Finances of FDI Companies — 14

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Balance Sheet of FDI companies | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/balance-sheet-of-fdi-companies.csv` |
| Balance Sheet of FDI companies-Liabilities | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/balance-sheet-of-fdi-companies-liabilities.csv` |
| Earning or Expenditure in Foreign Currencies | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/earning-or-expenditure-in-foreign-currencies.csv` |
| Financial Ratios | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/financial-ratios.csv` |
| Financial Ratios- Industry group-wise | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/financial-ratios-industry-group-wise.csv` |
| Financial Ratios-Country-wise | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/financial-ratios-country-wise.csv` |
| Growth Rate Indicators for FDI | AFY | % | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/growth-rate-indicators-for-fdi.csv` |
| Growth Rate Indicators for FDI - Country wise | AFY | % | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/growth-rate-indicators-for-fdi-country-wise.csv` |
| Growth Rate Indicators for FDI - Industry wise | AFY | % | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/growth-rate-indicators-for-fdi-industry-wise.csv` |
| Growth Rate Indicators for FDI - Type wise | AFY | % | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/growth-rate-indicators-for-fdi-type-wise.csv` |
| Industry & Country-Wise distrubution of FDI | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/industry-country-wise-distrubution-of-fdi.csv` |
| Profit & Loss appriations of FDI companies | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/profit-loss-appriations-of-fdi-companies.csv` |
| Sources of funds - FDI companies | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/sources-of-funds-fdi-companies.csv` |
| Uses of Funds - FDI companies | AFY | · | SDMX | `data/sdmx/corporate-sector/finances-of-fdi-companies/uses-of-funds-fdi-companies.csv` |

### SDMX · Corporate Sector / Listed Non-Government Non-Financial Companies — 20

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Performance Indicators – Industry-wise Growth Rates (Y-o-Y per cent) Quarterly | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-indicators-industry-wise-growth-rates-y-o-y-per-cent-quarterly.csv` |
| Performance of Listed Non-Government Non-Financial Companies Annually | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-annually.csv` |
| Performance of Listed Non-Government Non-Financial Companies Annually - Industry | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-annually-industry.csv` |
| Performance of Listed Non-Government Non-Financial Companies Annually - Industry wise | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-annually-industry-wise.csv` |
| Performance of Listed Non-Government Non-Financial Companies Annually - Paid-up-Capital | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-annually-paid-up-capital.csv` |
| Performance of Listed Non-Government Non-Financial Companies Annually - Sales | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-annually-sales.csv` |
| Performance of Listed Non-Government Non-Financial Companies Quarterly | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-quarterly.csv` |
| Performance of Listed Non-Government Non-Financial Companies Quarterly - Paid-up-Capital | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-quarterly-paid-up-capital.csv` |
| Performance of Listed Non-Government Non-Financial Companies Quarterly - Sales | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-quarterly-sales.csv` |
| Performance of Listed Non-Government Non-Financial Companies Quarterly -Ind | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/performance-of-listed-non-government-non-financial-companies-quarterly-ind.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Annually | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-annually.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Annually  - Industry | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-annually-industry.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Annually - Sales | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-annually-sales.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Annually Paid-up-Capital | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-annually-paid-up-capital.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Annually-- Industry wise | AFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-annually-industry-wise.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Quartely | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-quartely.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Quartely  - Paid-up-Capital | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-quartely-paid-up-capital.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Quartely - Industry wise | Q | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-quartely-industry-wise.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Quartely - Sales | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-quartely-sales.csv` |
| Ratios of Listed Non-Government Non-Financial Companies Quartely-Ind | QFY | · | SDMX | `data/sdmx/corporate-sector/listed-non-government-non-financial-companies/ratios-of-listed-non-government-non-financial-companies-quartely-ind.csv` |

### SDMX · Corporate Sector / Non-Government Non-Banking Financial and Investment Companies — 7

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Balance Sheet of Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/balance-sheet-of-non-government-non-banking-financial-and-investment-ngnbf-i-companies-activity-wise.csv` |
| Balance Sheet of Non-Government Non-Banking Financial and Investment(NGNBF&I) Companies-Liabilities | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/balance-sheet-of-non-government-non-banking-financial-and-investment-ngnbf-i-companies-liabilities.csv` |
| Combined Income, Expenditure and Appropriation Accounts for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/combined-income-expenditure-and-appropriation-accounts-for-non-government-non-banking-financial-and-investment-ngnbf-i-companies-activity-wise.csv` |
| Financial Ratios for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/financial-ratios-for-non-government-non-banking-financial-and-investment-ngnbf-i-companies-activity-wise.csv` |
| Growth Rate Indicators for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/growth-rate-indicators-for-non-government-non-banking-financial-and-investment-ngnbf-i-companies-activity-wise.csv` |
| Sources of funds for Non-Government Non-Banking Financial and Investment Companies - Activity wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/sources-of-funds-for-non-government-non-banking-financial-and-investment-companies-activity-wise.csv` |
| Uses of Funds for Non-Government Non-Banking Financial and Investments Companies - Activity wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-banking-financial-and-investment-companies/uses-of-funds-for-non-government-non-banking-financial-and-investments-companies-activity-wise.csv` |

### SDMX · Corporate Sector / Non-Government Non-Financial Private Limited Companies — 10

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Balance Sheet of Foreign Direct Investment Companies | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/balance-sheet-of-foreign-direct-investment-companies.csv` |
| Balance Sheet of Private Limited Companies | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/balance-sheet-of-private-limited-companies.csv` |
| Earning or Expenditure in Foreign Currencies of Private Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/earning-or-expenditure-in-foreign-currencies-of-private-limited-companies.csv` |
| Financial Ratios for Private Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/financial-ratios-for-private-limited-companies.csv` |
| Financial Ratios for Private Limited Companies - Industry wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/financial-ratios-for-private-limited-companies-industry-wise.csv` |
| Growth Rate Indicators for Private Limited Companies | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/growth-rate-indicators-for-private-limited-companies.csv` |
| Growth Rate Indicators for Private Limited Companies - Industry wise | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/growth-rate-indicators-for-private-limited-companies-industry-wise.csv` |
| Profit & Loss appriations of Private Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/profit-loss-appriations-of-private-limited-companies.csv` |
| Sources of funds of Private Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/sources-of-funds-of-private-limited-companies.csv` |
| Uses of Funds of Private Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-private-limited-companies/uses-of-funds-of-private-limited-companies.csv` |

### SDMX · Corporate Sector / Non-Government Non-Financial Public Limited Companies — 14

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Balance Sheet of Public Limited Companies | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/balance-sheet-of-public-limited-companies.csv` |
| Balance Sheet of Public Limited Companies-Capital Liabilities | AFY | ▬ | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/balance-sheet-of-public-limited-companies-capital-liabilities.csv` |
| Earning or Expenditure in Foreign Currencies of Public Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/earning-or-expenditure-in-foreign-currencies-of-public-limited-companies.csv` |
| Financial Ratios for Public Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/financial-ratios-for-public-limited-companies.csv` |
| Financial Ratios for Public Limited Companies - PUC wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/financial-ratios-for-public-limited-companies-puc-wise.csv` |
| Financial Ratios for Public Limited Companies - Sales wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/financial-ratios-for-public-limited-companies-sales-wise.csv` |
| Financial Ratios for Public Limited Companies Industry Wise | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/financial-ratios-for-public-limited-companies-industry-wise.csv` |
| Growth Rate Indicators for Public Limited Companies | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/growth-rate-indicators-for-public-limited-companies.csv` |
| Growth Rate Indicators for Public Limited Companies - PUC wise | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/growth-rate-indicators-for-public-limited-companies-puc-wise.csv` |
| Growth Rate Indicators for Public Limited Companies - Sales wise | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/growth-rate-indicators-for-public-limited-companies-sales-wise.csv` |
| Growth Rate Indicators for Public Limited Companies Industry Wise | AFY | % | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/growth-rate-indicators-for-public-limited-companies-industry-wise.csv` |
| Profit & Loss appriations of Public Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/profit-loss-appriations-of-public-limited-companies.csv` |
| Sources of funds of Public Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/sources-of-funds-of-public-limited-companies.csv` |
| Uses of Funds of Public Limited Companies | AFY | · | SDMX | `data/sdmx/corporate-sector/non-government-non-financial-public-limited-companies/uses-of-funds-of-public-limited-companies.csv` |

---

## `/payments` — Payments {#payments}

*Payment and settlement system volumes and values.*

**2** tables (1 SDMX + 1 RBIB).

### SDMX · Financial Sector / Payment Systems — 1

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Clearing House | AFY | · | SDMX | `data/sdmx/financial-sector/payment-systems/clearing-house.csv` |

### RBIB Monthly Bulletin · Payments And Settlements Systems — 1

| Table | Freq | Shape | Source | Path |
|---|---|:-:|---|---|
| Payment System Indicators | M | ▲ | RBIB-45 | `data/publications/monthly-rbi-bulletin/payments-and-settlements-systems/table-45-payment-system-indicators.xlsx` |
