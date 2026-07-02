# DBIE Reports coverage vs SDMX scrape

Authoritative DBIE Reports catalogue: **398 tables** across **31 subsections**.
SDMX scrape: **236 downloaded** of 252 attempted.

## Corporate Sector / Listed Non-Government Non-Financial Companies
## Headline

- **230** of **398** DBIE reports have matching SDMX data on disk (**58%**)
- **17** matched an SDMX element but the element isn't downloaded (no-record / error / not-tried)
- **151** DBIE reports have no SDMX match in their sub-sector — either they're not SDMX-exposed or my fuzzy match missed them
- **89** SDMX elements didn't match any DBIE report — either they're additional series or the match missed

- Reports: **13**; matched to SDMX: 10; downloaded on disk: **10**
- SDMX elements in this sub-sector: 20; unmatched SDMX: 15

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | 1. Performance of Listed Non-Government Non-Financial Companies | Quarterly | 30-JUN-2014 | 31-DEC-2025 | Performance of Listed Non-Government Non-Financial Companies Annually | PRF_LNGNFC_ANN_RN | ✓ OK |
| 2 | 2. Performance of Listed Non-Government Non-Financial Companies - Sector - wise | Quarterly | 30-JUN-2014 | 31-DEC-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Industry wise | PRF_LNGNFC_INDUS_ANN_RN | ✓ OK |
| 3 | 3. Performance of Listed Non-Government Non-Financial Companies according to Size of Paid-up-Capital | Quarterly | 30-JUN-2014 | 31-DEC-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Paid-up-Capital | PRF_LNGNFC_PUC_ANN_RN | ✓ OK |
| 4 | 4. Performance of Listed Non-Government Non-Financial Companies according to Size of Sales | Quarterly | 30-JUN-2014 | 31-DEC-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Sales | PRF_LNGNFC_SAL_ANN_RN | ✓ OK |
| 5 | 5. Performance of Listed Non-Government Non-Financial Companies according to Industry | Quarterly | 30-JUN-2014 | 31-DEC-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Industry | PRF_LNGNFC_IND_ANN_RN | ✓ OK |
| 6 | 6. Explanatory Notes & Glossary | Quarterly | 31-MAR-2017 | 31-DEC-2025 | — |  | ✗ — |
| 7 | 1.Sources and Uses of Funds for Listed Private Manufacturing Companies (half-yearly) - Discontinued | Half-Yearly | 30-SEP-2018 | 30-SEP-2019 | — |  | ✗ — |
| 8 | 1. Performance of Listed Non-Government Non-Financial Companies | Annual | 31-MAR-2016 | 31-MAR-2025 | Performance of Listed Non-Government Non-Financial Companies Annually | PRF_LNGNFC_ANN_RN | ✓ OK |
| 9 | 2. Performance of Listed Non-Government Non-Financial Companies - Sector - wise | Annual | 31-MAR-2016 | 31-MAR-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Industry wise | PRF_LNGNFC_INDUS_ANN_RN | ✓ OK |
| 10 | 3. Performance of Listed Non-Government Non-Financial Companies according to Size of Paid-up-Capital | Annual | 31-MAR-2016 | 31-MAR-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Paid-up-Capital | PRF_LNGNFC_PUC_ANN_RN | ✓ OK |
| 11 | 4. Performance of Listed Non-Government Non-Financial Companies according to Size of Sales | Annual | 31-MAR-2016 | 31-MAR-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Sales | PRF_LNGNFC_SAL_ANN_RN | ✓ OK |
| 12 | 5. Performance of Listed Non-Government Non-Financial Companies according to Industry | Annual | 31-MAR-2016 | 31-MAR-2025 | Performance of Listed Non-Government Non-Financial Companies Annually - Industry | PRF_LNGNFC_IND_ANN_RN | ✓ OK |
| 13 | 6. Explanatory Notes & Glossary | Annual | 31-MAR-2017 | 31-MAR-2025 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (15):**
- ✓ `PRF_LNGNFC_IND_QTR_RN` — Performance Indicators – Industry-wise Growth Rates (Y-o-Y per cent) Quarterly *(Quarterly - Financial Year)*
- ✓ `PRF_LNGNFC_QTR_RN` — Performance of Listed Non-Government Non-Financial Companies Quarterly *(Quarterly - Financial Year)*
- ✓ `PRF_LNGNFC_PUC_QTR_RN` — Performance of Listed Non-Government Non-Financial Companies Quarterly - Paid-up-Capital *(Quarterly - Financial Year)*
- ✓ `PRF_LNGNFC_SAL_QTR_RN` — Performance of Listed Non-Government Non-Financial Companies Quarterly - Sales *(Quarterly - Financial Year)*
- ✓ `PRF_LNGNFC_QTR_IND_RN` — Performance of Listed Non-Government Non-Financial Companies Quarterly -Ind *(Quarterly - Financial Year)*
- ✓ `RATIO_LNGNFC_ANN_RN` — Ratios of Listed Non-Government Non-Financial Companies Annually *(Annual - Financial Year)*
- ✓ `RATIO_LNGNFC_IND_ANN_RN` — Ratios of Listed Non-Government Non-Financial Companies Annually  - Industry *(Annual - Financial Year)*
- ✓ `RATIO_LNGNFC_SAL_ANN_RN` — Ratios of Listed Non-Government Non-Financial Companies Annually - Sales *(Annual - Financial Year)*
- ✓ `RATIO_LNGNFC_PUC_ANN_RN` — Ratios of Listed Non-Government Non-Financial Companies Annually Paid-up-Capital *(Annual - Financial Year)*
- ✓ `RATIO_LNGNFC_INDUS_ANN_RN` — Ratios of Listed Non-Government Non-Financial Companies Annually-- Industry wise *(Annual - Financial Year)*
- ✓ `RATIO_LNGNFC_QTR_RN` — Ratios of Listed Non-Government Non-Financial Companies Quartely *(Quarterly - Financial Year)*
- ✓ `RATIO_LNGNFC_PUC_QTR_RN` — Ratios of Listed Non-Government Non-Financial Companies Quartely  - Paid-up-Capital *(Quarterly - Financial Year)*
- ✓ `RATIO_LNGNFC_IND_QTR_RN` — Ratios of Listed Non-Government Non-Financial Companies Quartely - Industry wise *(Quarterly)*
- ✓ `RATIO_LNGNFC_SAL_QTR_RN` — Ratios of Listed Non-Government Non-Financial Companies Quartely - Sales *(Quarterly - Financial Year)*
- ✓ `RATIO_LNGNFC_QTR_IND_RN` — Ratios of Listed Non-Government Non-Financial Companies Quartely-Ind *(Quarterly - Financial Year)*

## Corporate Sector / Non-Government Non-Financial Private Limited Companies
- Reports: **11**; matched to SDMX: 10; downloaded on disk: **10**
- SDMX elements in this sub-sector: 10; unmatched SDMX: 2

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Statement 01: Growth Rates of the Select Items of the Select Private Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Private Limited Companies | GRWT_RT_INDC_PVT_RN | ✓ OK |
| 2 | Statement 02: Select Financial Ratios of the Select Private Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Private Limited Companies | FIN_RATIOS_PVT_RN | ✓ OK |
| 3 | Statement 03: Combined Income, Value of Production, Expenditure and Appropriation Accounts of the Select Private Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Earning or Expenditure in Foreign Currencies of Private Limited Companies | EAR_EXP_FC_PVT_RN | ✓ OK |
| 4 | Statement 04A: Combined Balance Sheet (Capital and Liabilities) of the Select Private Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Balance Sheet of Private Limited Companies | BAL_SHT_PVT_RN | ✓ OK |
| 5 | Statement 04B: Combined Balance Sheet (Assets) of the Select Private Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Balance Sheet of Private Limited Companies | BAL_SHT_PVT_RN | ✓ OK |
| 6 | Statement 05A: Sources of Funds of the Select Private Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Sources of funds of Private Limited Companies | SRC_FND_PVT_RN | ✓ OK |
| 7 | Statement 05B: Uses of Funds of the Select Private Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Uses of Funds of Private Limited Companies | USE_FBD_PVT_RN | ✓ OK |
| 8 | Statement 06: Earnings / Expenditure in Foreign Currencies of Select Private Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2019 | Earning or Expenditure in Foreign Currencies of Private Limited Companies | EAR_EXP_FC_PVT_RN | ✓ OK |
| 9 | Statement 07: Growth Rates of the Select Items of the Select Private Limited Companies - Industry-wise | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Private Limited Companies - Industry wise | GRWT_RT_INDC_PVT_IND_RN | ✓ OK |
| 10 | Statement 08: Select Financial Ratios of the Select Items of the Select Private Limited Companies - Industry-wise | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Private Limited Companies - Industry wise | FIN_RATIOS_PVT_IND_RN | ✓ OK |
| 11 | Explanatory Notes | Annual | 31-MAR-2020 | 31-MAR-2025 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (2):**
- ✓ `BAL_SHT_PVT_FDIC_RN` — Balance Sheet of Foreign Direct Investment Companies *(Annual - Financial Year)*
- ✓ `PNL_PVT_RN` — Profit & Loss appriations of Private Limited Companies *(Annual - Financial Year)*

## Corporate Sector / Finances of FDI Companies
- Reports: **15**; matched to SDMX: 12; downloaded on disk: **12**
- SDMX elements in this sub-sector: 14; unmatched SDMX: 6

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Statement 01: Industry and Country of Origin-Wise Distribution of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2013 | 31-MAR-2024 | Industry & Country-Wise distrubution of FDI | IND_CNTRY_FDI_RN | ✓ OK |
| 2 | Statement 02: Growth Rates of the Select Items of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2012 | 31-MAR-2024 | — |  | ✗ — |
| 3 | Statement 03: Select Financial Ratios of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2011 | 31-MAR-2024 | Financial Ratios | FIN_RATIOS_RN | ✓ OK |
| 4 | Statement 04: Combined Income, Value of Production, Expenditure and Appropriation Accounts of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2011 | 31-MAR-2024 | — |  | ✗ — |
| 5 | Statement 05A : Combined Balance Sheet of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2013 | 31-MAR-2024 | Balance Sheet of FDI companies | BAL_SHT_FDI_COMP_RN | ✓ OK |
| 6 | Statement 05B : Combined Balance Sheet of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2011 | 31-MAR-2024 | Balance Sheet of FDI companies | BAL_SHT_FDI_COMP_RN | ✓ OK |
| 7 | Statement 06A : Sources and Uses of Funds of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2012 | 31-MAR-2024 | Sources of funds - FDI companies | SRC_FND_FDI_COMP_RN | ✓ OK |
| 8 | Statement 06B : Sources and Uses of Funds of the Select Foreign Direct Investment Companies | Annual | 31-MAR-2012 | 31-MAR-2024 | Sources of funds - FDI companies | SRC_FND_FDI_COMP_RN | ✓ OK |
| 9 | Statement 07: Earnings / Expenditure in Foreign Currencies of the Select Foreign Direct Investment Companies - Discontinued | Annual | 31-MAR-2011 | 31-MAR-2019 | Earning or Expenditure in Foreign Currencies | EAR_EXP_FC_RN | ✓ OK |
| 10 | Statement 08: Growth Rates of the Select Items of the Select Foreign Direct Investment Companies, Industry Group Wise | Annual | 31-MAR-2012 | 31-MAR-2024 | Financial Ratios- Industry group-wise | FIN_RATIOS_IND_RN | ✓ OK |
| 11 | Statement 09: Growth Rates of the Select Items of the Select Foreign Direct Investment Companies, Country-Wise | Annual | 31-MAR-2012 | 31-MAR-2024 | Growth Rate Indicators for FDI - Country wise | GRWT_RT_INDCO_FDI_RN | ✓ OK |
| 12 | Statement 10: Growth Rates of the Select Items of the Select Foreign Direct Investment Companies, Type-Wise | Annual | 31-MAR-2012 | 31-MAR-2024 | Growth Rate Indicators for FDI - Type wise | GRWT_RT_INDCT_FDI_RN | ✓ OK |
| 13 | Statement 11: Select Financial Ratios of the Select Foreign Direct Investment Companies - Industry Group-Wise | Annual | 31-MAR-2011 | 31-MAR-2024 | Financial Ratios | FIN_RATIOS_RN | ✓ OK |
| 14 | Statement 12: Select Financial Ratios of the Select Foreign Direct Investment Companies - Country-Wise | Annual | 31-MAR-2011 | 31-MAR-2024 | Financial Ratios | FIN_RATIOS_RN | ✓ OK |
| 15 | Explanatory Notes | Annual | 31-MAR-2020 | 31-MAR-2024 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (6):**
- ✓ `BAL_SHT_FDI_LIA_COMP_RN` — Balance Sheet of FDI companies-Liabilities *(Annual - Financial Year)*
- ✓ `FIN_RATIOS_COUN_RN` — Financial Ratios-Country-wise *(Annual - Financial Year)*
- ✓ `GRWT_RT_INDC_FDI_RN` — Growth Rate Indicators for FDI *(Annual - Financial Year)*
- ✓ `GRWT_RT_INDIC_FDI_RN` — Growth Rate Indicators for FDI - Industry wise *(Annual - Financial Year)*
- ✓ `PNL_FDI_COMP_RN` — Profit & Loss appriations of FDI companies *(Annual - Financial Year)*
- ✓ `USE_FBD_FDI_COMP_RN` — Uses of Funds - FDI companies *(Annual - Financial Year)*

## Corporate Sector / Non-Government Non-Financial Public Limited Companies
- Reports: **15**; matched to SDMX: 14; downloaded on disk: **14**
- SDMX elements in this sub-sector: 14; unmatched SDMX: 1

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Statement 01: Growth Rates of the Select Items of the Select Public Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Public Limited Companies | GRWT_RT_INDC_PUB_RN | ✓ OK |
| 2 | Statement 02: Select Financial Ratios of the Select Public Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Public Limited Companies | FIN_RATIOS_PUB_RN | ✓ OK |
| 3 | Statement 03: Combined Income, Value of Production, Expenditure and Appropriation Accounts of the Select Public Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Earning or Expenditure in Foreign Currencies of Public Limited Companies | EAR_EXP_FC_PUB_RN | ✓ OK |
| 4 | Statement 04A: Combined Balance Sheet (Equity and Liabilities) of the Select Public Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Balance Sheet of Public Limited Companies-Capital Liabilities | BAL_SHT_PUB_CAP_LIA_RN | ✓ OK |
| 5 | Statement 04B: Combined Balance Sheet (Assets) of the Select Public Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2025 | Balance Sheet of Public Limited Companies | BAL_SHT_PUB_RN | ✓ OK |
| 6 | Statement 05A: Sources of Funds of the Select Public Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Sources of funds of Public Limited Companies | SRC_FND_PUB_RN | ✓ OK |
| 7 | Statement 05B: Uses of Funds of the Select Public Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | Uses of Funds of Public Limited Companies | USE_FBD_PUB_RN | ✓ OK |
| 8 | Statement 06: Earnings / Expenditure in Foreign Currencies of Select Public Limited Companies | Annual | 31-MAR-2010 | 31-MAR-2019 | Earning or Expenditure in Foreign Currencies of Public Limited Companies | EAR_EXP_FC_PUB_RN | ✓ OK |
| 9 | Statement 07: Growth Rates of the Select Items of the Select Public Limited Companies - Sales-wise | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Public Limited Companies - Sales wise | GRWT_RT_INDC_PUB_SAL_RN | ✓ OK |
| 10 | Statement 08: Select Financial Ratios of the Select Items of the Select Public Limited Companies - Sales-wise | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Public Limited Companies - Sales wise | FIN_RATIOS_PUB_SAL_RN | ✓ OK |
| 11 | Statement 09: Growth Rates of the Select Items of the Select Public Limited Companies - PUC-wise | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Public Limited Companies - PUC wise | GRWT_RT_INDC_PUB_PUC_RN | ✓ OK |
| 12 | Statement 10: Select Financial Ratios of the Select Items of the Select Public Limited Companies - PUC-wise | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Public Limited Companies - PUC wise | FIN_RATIOS_PUB_PUC_RN | ✓ OK |
| 13 | Statement 11: Growth Rates of the Select Items of the Select Public Limited Companies - Industry-wise | Annual | 31-MAR-2011 | 31-MAR-2025 | Growth Rate Indicators for Public Limited Companies Industry Wise | GRWT_RT_INDIC_PUB_RN | ✓ OK |
| 14 | Statement 12: Select Financial Ratios of the Select Items of the Select Public Limited Companies - Industry-wise | Annual | 31-MAR-2010 | 31-MAR-2025 | Financial Ratios for Public Limited Companies Industry Wise | FIN_RATIOS_PUB_INDU_RN | ✓ OK |
| 15 | Explanatory Notes | Annual | 31-MAR-2020 | 31-MAR-2025 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (1):**
- ✓ `PNL_PUB_RN` — Profit & Loss appriations of Public Limited Companies *(Annual - Financial Year)*

## Corporate Sector / Non-Government Non-Banking Financial and Investment Companies
- Reports: **8**; matched to SDMX: 7; downloaded on disk: **7**
- SDMX elements in this sub-sector: 7; unmatched SDMX: 2

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Statement 1: Growth Rates of the Select Items of the Select Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | Annual | 31-MAR-2014 | 31-MAR-2019 | Growth Rate Indicators for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | GWT_RT_NGNBFI_AW_RN | ✓ OK |
| 2 | Statement 2: Select Financial Ratios of the Select Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | Annual | 31-MAR-2014 | 31-MAR-2019 | Financial Ratios for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | FIN_RATIOS_NGNBFI_AW_RN | ✓ OK |
| 3 | Statement 3: Combined Income, Expenditure and Appropriation Accounts of Select Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | Annual | 31-MAR-2014 | 31-MAR-2019 | Combined Income, Expenditure and Appropriation Accounts for Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | CI_NGNBFI_AW_RN | ✓ OK |
| 4 | Statement 4A: Combined Balance Sheet of the Select Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise - Liabilities | Annual | 31-MAR-2014 | 31-MAR-2019 | Balance Sheet of Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | BAL_SHT_NGNBFI_AW_RN | ✓ OK |
| 5 | Statement 4B: Combined Balance Sheet of the Select Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise - Assets | Annual | 31-MAR-2014 | 31-MAR-2019 | Balance Sheet of Non-Government Non-Banking Financial and Investment (NGNBF&I) Companies - Activity wise | BAL_SHT_NGNBFI_AW_RN | ✓ OK |
| 6 | Statement 5A: Sources and Uses of Funds of the Select Non-Government Non-Banking Financial and Investments (NGNBF&I) Companies - Activity wise - Sources | Annual | 31-MAR-2014 | 31-MAR-2019 | Uses of Funds for Non-Government Non-Banking Financial and Investments Companies - Activity wise | USES_FND_NGNBFI_AW_RN | ✓ OK |
| 7 | Statement 5B: Sources and Uses of Funds of the Select Non-Government Non-Banking Financial and Investments (NGNBF&I) Companies - Activity wise - Uses | Annual | 31-MAR-2014 | 31-MAR-2019 | Uses of Funds for Non-Government Non-Banking Financial and Investments Companies - Activity wise | USES_FND_NGNBFI_AW_RN | ✓ OK |
| 8 | Explanatory Notes | Annual | 31-MAR-2012 | 31-MAR-2019 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (2):**
- ✓ `BAL_SHT_NGNBFI_LIAB_AW_RN` — Balance Sheet of Non-Government Non-Banking Financial and Investment(NGNBF&I) Companies-Liabilities *(Annual - Financial Year)*
- ✓ `SRC_FND_NGNBFI_AW_RN` — Sources of funds for Non-Government Non-Banking Financial and Investment Companies - Activity wise *(Annual - Financial Year)*

## External Sector / External Sector Indices
- Reports: **6**; matched to SDMX: 2; downloaded on disk: **2**
- SDMX elements in this sub-sector: 4; unmatched SDMX: 2

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Index numbers of Exports - Quantum and Unit Value (Base: 1999-2000 = 100) | Annual | 1999-Mar-31 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Index Numbers and Terms of Foreign Trade | Annual | 1999-Mar-31 | 31-MAR-2025 | General Index Numbers and Terms of Foreign Trade | INX_NBR_TERM_FR_TRD_RN | ✓ OK |
| 3 | Indices of Real Effective Exchange Rate (REER) and Nominal Effective Exchange Rate (NEER) of the Indian Rupee (40-Currency Bilateral Weights) (Calender Year - Annual Average) | Annual | 2005-Mar-31 | 31-DEC-2025 | — |  | ✗ — |
| 4 | Indices of Real Effective Exchange Rate (REER) and Nominal Effective Exchange Rate (NEER) of the Indian Rupee (40-Currency Bilateral Weights) (Financial Year - Annual Average) | Annual | 2004-Mar-31 | 31-DEC-2025 | — |  | ✗ — |
| 5 | Indices of Real Effective Exchange Rate (REER) and Nominal Effective Exchange Rate (NEER) of the Indian Rupee | Monthly | 31-JAN-1975 | 31-MAR-2026 | Indices of REER/NEER Annually | INX_NEER_REER_A_RN | ✓ OK |
| 6 | Index Numbers of Imports - Quantum and Unit Value (Base: 1999-2000 = 100) | Annual | 1999-Mar-31 | 31-MAR-2025 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (2):**
- ✓ `INX_NEER_REER_M_RN` — Indices of REER/NEER Monthly *(Monthly)*
- ✓ `TRD_INX_NBR_RN` — Trade Index Numbers *(Annual - Financial Year)*

## External Sector / External Debt
- Reports: **3**; matched to SDMX: 3; downloaded on disk: **3**
- SDMX elements in this sub-sector: 2; unmatched SDMX: 1

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | India's External Debt - US Dollars (End-March) | Annual | 1991-Mar-31 | 31-MAR-2025 | India's External Debt | IND_EXTRN_DEBT_RN | ✓ OK |
| 2 | India's External Debt - Rupees (End-March) | Annual | 1991-Mar-31 | 31-MAR-2025 | India's External Debt | IND_EXTRN_DEBT_RN | ✓ OK |
| 3 | External Debt of India - Quarterly | Quarterly | 31-MAR-2020 | 30-JUN-2025 | India's External Debt | IND_EXTRN_DEBT_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (1):**
- ✓ `EXT_DBT_RT_RN` — External Debt Ratio *(Quarterly - Financial Year)*

## External Sector / Forex Reserve
- Reports: **3**; matched to SDMX: 3; downloaded on disk: **3**
- SDMX elements in this sub-sector: 2; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Foreign Exchange Reserves - Monthly | Monthly | 1990-Mar-31 | 31-DEC-2025 | Foreign Exchange Reserves Monthly | FR_EXG_RESV_M_RN | ✓ OK |
| 2 | Foreign Exchange Reserves - Annual | Annual | 1950-Mar-31 | 31-MAR-2026 | Foreign Exchange Reserves | FR_EXG_RESV_RN | ✓ OK |
| 3 | Foreign Exchange Reserves - Weekly | Weekly | 2001-Apr-06 | 03-APR-2026 | Foreign Exchange Reserves | FR_EXG_RESV_RN | ✓ OK |

## External Sector / International Finance
- Reports: **13**; matched to SDMX: 10; downloaded on disk: **10**
- SDMX elements in this sub-sector: 13; unmatched SDMX: 5

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | International Investment Position of India | Quarterly | 31-MAR-2006 | 31-DEC-2025 | International Investment Position of India BPM5 | INTR_INV_POS_IND_RN | ✓ OK |
| 2 | NRI Deposits | Monthly | 1997-Apr-01 | 31-JAN-2026 | NRI Deposits Inflow/Outflow Annually | NRI_DEPOSITS_IN_OUT_A_RN | ✓ OK |
| 3 | External Assistance | Annual | 1997-Apr-01 | 31-MAR-2025 | External assistance | EXTR_ASSIST_RN | ✓ OK |
| 4 | Inflows(+)/Outflows(-) Under Various NRI Deposit Schemes - Rupees | Annual | 31-MAR-1991 | 31-MAR-2025 | — |  | ✗ — |
| 5 | Inflows(+)/Outflows(-) Under Various NRI Deposit Schemes - US Dollars | Annual | 31-MAR-1991 | 31-MAR-2025 | — |  | ✗ — |
| 6 | NRI Deposits Outstanding - Rupees | Annual | 31-MAR-1991 | 31-MAR-2025 | NRI Deposits Outstanding Monthly | NRI_DEPOSITS_OUTS_RN | ✓ OK |
| 7 | NRI Deposits Outstanding - US Dollars | Annual | 31-MAR-1991 | 31-MAR-2025 | NRI Deposits Outstanding Monthly | NRI_DEPOSITS_OUTS_RN | ✓ OK |
| 8 | Foreign Liabilities and Assets of Mutual Fund and Assets Management Companies | Annual | 31-MAR-2009 | 31-MAR-2024 | Foreign Liabilities and Assets for Mutual Fund and Assets Management Companies | FR_LIB_ASSTS_MUT_RN | ✓ OK |
| 9 | Foreign Liabilities and Assets of Mutual Fund and Assets Management Companies : Country-wise | Annual | 31-MAR-2009 | 31-MAR-2024 | Foreign Liabilities and Assets for Mutual Fund and Assets Management Companies - Country Wise | FR_LIB_ASS_MUT_RN | ✓ OK |
| 10 | Outright Remittances under the Liberalised Remittances Scheme for Resident Individuals - Yearly | Annual | 31-MAR-2009 | 31-MAR-2024 | — |  | ✗ — |
| 11 | Outward Remittances under the Liberalised Remittance Scheme for Resident Individuals | Monthly | 30-APR-2008 | 31-JAN-2026 | Outward Remittance | OUTW_REMIT_RN | ✓ OK |
| 12 | Foreign Investment Inflows | Monthly | 30-APR-1995 | 31-MAR-2025 | Foreign Investment Inflows | FR_INV_INFLW_RN | ✓ OK |
| 13 | Foreign Investment Inflows - Yearly | Annual | 31-MAR-1991 | 31-MAR-2024 | Foreign Investment Inflows | FR_INV_INFLW_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (5):**
- ✓ `FR_INV_INFLW_A_RN` — Foreign Investment Inflows Annually *(Annual - Financial Year)*
- ✓ `FR_LIB_MUT_NRH_RN` — Foreign Liabilities for Mutual Fund-Non Resident Holding *(Annual - Financial Year)*
- ✓ `INTR_INV_POS_IND_BPM6_RN` — International Investment Position of India BPM6 *(Quarterly - Financial Year)*
- ✓ `NRI_DEPOSITS_IN_OUT_RN` — NRI Deposits Inflow/Outflow Monthly *(Monthly)*
- ✓ `NRI_DEPOSITS_OUTS_A_RN` — NRI Deposits Outstandings Annually *(Annual - Financial Year)*

## External Sector / International Trade
- Reports: **24**; matched to SDMX: 24; downloaded on disk: **24**
- SDMX elements in this sub-sector: 14; unmatched SDMX: 6

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Direction of Foreign Trade - Rupees | Annual | 31-MAR-2010 | 31-MAR-2025 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 2 | Exports of Select Commodities to Principal Countries - Rupees | Annual | 31-MAR-2014 | 31-MAR-2025 | Exports of Select Commodities to Principal Countries | EXP_SEL_PRIN_COMM_RN | ✓ OK |
| 3 | Invisibles by Category of Transactions (in US Dollar) | Quarterly | 30-JUN-2010 | 31-DEC-2025 | Invisibles By Category of Transactions | INVI_CAT_TRANS_RN | ✓ OK |
| 4 | India's Overall Balance of Payments - Quarterly - US Dollars | Quarterly | 30-JUN-1949 | 31-MAR-2025 | India's Overall Balance of Payments | IND_OVR_BOP_RN | ✓ OK |
| 5 | India's Overall Balance of Payments - US Dollars | Annual | 31-MAR-1949 | 31-MAR-2025 | India's Overall Balance of Payments | IND_OVR_BOP_RN | ✓ OK |
| 6 | India's Overall Balance of Payments - Rupees | Annual | 31-MAR-1949 | 31-MAR-2025 | India's Overall Balance of Payments | IND_OVR_BOP_RN | ✓ OK |
| 7 | Key Components of India's Balance of Payments - Rupees | Annual | 31-MAR-1949 | 31-MAR-2025 | Key components of India's Overall Balance of Payments | KCI_BOP_RN | ✓ OK |
| 8 | Key Components of India's Balance of Payments - US Dollars | Annual | 31-MAR-1949 | 31-MAR-2025 | Key components of India's Overall Balance of Payments | KCI_BOP_RN | ✓ OK |
| 9 | Invisibles by Category of Transactions - US Dollars | Annual | 31-MAR-1949 | 31-MAR-2025 | Invisibles By Category of Transactions | INVI_CAT_TRANS_RN | ✓ OK |
| 10 | India’s Overall Balance of Payments - Quarterly – Rupees | Quarterly | 30-JUN-1949 | 31-DEC-2025 | India's Overall Balance of Payments | IND_OVR_BOP_RN | ✓ OK |
| 11 | Direction of Foreign Trade - US Dollars | Annual | 31-MAR-2010 | 31-MAR-2025 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 12 | India's Foreign Trade - US Dollars | Annual | 31-MAR-1971 | 31-MAR-2025 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 13 | India's Foreign Trade – Rupees | Monthly | 01-APR-1990 | 01-JAN-2026 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 14 | Invisibles by Category of Transactions - Rupees | Annual | 31-MAR-1949 | 31-MAR-2025 | Invisibles By Category of Transactions | INVI_CAT_TRANS_RN | ✓ OK |
| 15 | Exports of Principal Commodities - US Dollars | Annual | 31-MAR-2010 | 31-MAR-2025 | Exports of Select Commodities to Principal Countries | EXP_SEL_PRIN_COMM_RN | ✓ OK |
| 16 | India's Foreign Trade - US Dollars | Monthly | 01-APR-1990 | 31-MAR-2025 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 17 | India's Foreign Trade - Rupees | Annual | 31-MAR-1971 | 31-MAR-2025 | Direction of Foreign Trade | DIR_FR_TRD_RN | ✓ OK |
| 18 | Imports of Principal Commodities - US Dollars | Annual | 31-MAR-2010 | 31-MAR-2025 | Export of Principal commodities | EXP_PRIN_COMM_RN | ✓ OK |
| 19 | Imports of Principal Commodities - Rupees | Annual | 31-MAR-2010 | 31-MAR-2025 | Export of Principal commodities | EXP_PRIN_COMM_RN | ✓ OK |
| 20 | Exports of Select Commodities to Principal Countries - US Dollars | Annual | 31-MAR-2014 | 31-MAR-2025 | Exports of Select Commodities to Principal Countries | EXP_SEL_PRIN_COMM_RN | ✓ OK |
| 21 | Exports of Principal Commodities - Rupees | Annual | 31-MAR-2010 | 31-MAR-2025 | Exports of Select Commodities to Principal Countries | EXP_SEL_PRIN_COMM_RN | ✓ OK |
| 22 | Balance of Payments - Indicators | Annual | 31-MAR-1971 | 31-MAR-2025 | Balance Of Payments Indicators | BOP_INDI_RN | ✓ OK |
| 23 | Broad Commodity Composition of Indias Merchandise Trade - US Dollar | Monthly | 01-APR-1990 | 01-JAN-2026 | Broad Commodity Composition of India's Merchandise Trade | BCCI_MER_TRD_RN | ✓ OK |
| 24 | Broad Commodity Composition of India's Merchandise Trade - Oil and Non-Oil Exports and Imports - Rupees | Monthly | 01-APR-1990 | 01-JAN-2026 | Broad Commodity Composition of India's Merchandise Trade | BCCI_MER_TRD_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (6):**
- ✓ `IMP_PRIN_COMM_RN` — Import of Principal commodities *(Annual - Financial Year)*
- ✓ `IFT_OIL_NON_OIL_RN` — India's Foreign Trade - Oil & Non-Oil *(Monthly)*
- ✓ `IFT_OIL_NON_OIL_A_RN` — India's Foreign Trade - Oil & Non-Oil_Annually *(Annual - Financial Year)*
- ✓ `IND_OVR_BOP_A_RN` — India's Overall Balance of Payments Annually *(Annual - Financial Year)*
- ✓ `INVI_PYMTS_RN` — Invisibles Payments *(Quarterly - Financial Year)*
- ✓ `INVI_RCPTS_RN` — Invisibles Receipts *(Quarterly - Financial Year)*

## Financial Market / Equity and Corporate Debt Market
- Reports: **25**; matched to SDMX: 10; downloaded on disk: **7**
- SDMX elements in this sub-sector: 9; unmatched SDMX: 1

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Annual Averages of Share Price Indices and Market Capitalisation | Annual | 31-MAR-1980 | 31-MAR-2026 | — |  | ✗ — |
| 2 | Monthly and Annual Averages of BSE Sensitive Index | Monthly | 30-Apr-1990 | 28-FEB-2026 | — |  | ✗ — |
| 3 | Monthly Turnover at NSE | Monthly | 30-APR-1994 | 28-FEB-2026 | Turnover at NSE | TURNO_NSE_RN | ✓ OK |
| 4 | Market Capitalisation - NSE | Monthly | 01-APR-1994 | 28-FEB-2026 | Market Information NSE | MRKT_INFO_NSE_D_RN | ? no-record |
| 5 | Market Capitalisation - BSE and All-India | Monthly | 01-APR-1993 | 28-FEB-2026 | Market Information BSE | MRKT_INFO_BSE_D_RN | ? no-record |
| 6 | Net Investments by FIIs in the Indian Capital Market | Monthly | 30-APR-1992 | 30-JUN-2025 | — |  | ✗ — |
| 7 | New Capital Issues by Non-Government Public Limited Companies | Monthly | 30-APR-2022 | 31-JAN-2026 | — |  | ✗ — |
| 8 | Number and Quantum of Euro Issues | Monthly | 30-APR-1992 | 30-JUN-2025 | — |  | ✗ — |
| 9 | Turnover in the Equity Derivatives Market | Annual | 01-JAN-2016 | 30-JUN-2025 | — |  | ✗ — |
| 10 | Net Resources Mobilised by Bank-Sponsored and FI- Sponsored Mutual Funds | Annual | 01-APR-1970 | 31-MAR-2024 | — |  | ✗ — |
| 11 | NSE Indices | Daily | 03-Mar-2003 | 17-MAR-2026 | NSE INIDICES | NSE_IND_D_RN | ? no-record |
| 12 | Net Resources Mobilised by Mutual Funds | Annual | 31-MAR-1971 | 31-MAR-2024 | — |  | ✗ — |
| 13 | BSE Indices | Daily | 01-Jan-1990 | 17-MAR-2026 | BSE INIDICES | BSE_IND_D_RN | ✓ OK |
| 14 | Daily Turnover,Market Capitalisation and Traded Volume at NSE | Daily | 03-MAR-2003 | 17-MAR-2026 | Turnover at NSE | TURNO_NSE_RN | ✓ OK |
| 15 | Daily Turnover, Market Capitalisation and Traded Volume at BSE | Daily | 03-MAR-2003 | 17-MAR-2026 | Turnover BSE | TRN_OVR_BSE_RN | ✓ OK |
| 16 | Net Resources Mobilised by Private Sector Mutual Funds | Annual | 31-MAR-1997 | 31-MAR-2025 | — |  | ✗ — |
| 17 | Monthly Turnover at BSE | Monthly | 01-APR-1990 | 28-FEB-2026 | Turnover BSE | TRN_OVR_BSE_RN | ✓ OK |
| 18 | Average Price / Earning Ratio of BSE Sensitive Index | Monthly | 01-APR-1990 | 31-MAR-2026 | Earning Ratio of BSE | EARN_RAT_BSE_RN | ✓ OK |
| 19 | New Capital Issues by Non-Government Public Limited Companies | Annual | 31-MAR-2011 | 31-MAR-2025 | — |  | ✗ — |
| 20 | Monthly and Annual Averages of BSE 100 | Monthly | 01-JAN-1991 | 28-FEB-2026 | — |  | ✗ — |
| 21 | Yearly Traded Volume in Corporate Debt at NSE (Discontinued) | Annual | 30-Apr-1997 | 21-DEC-2012 | — |  | ✗ — |
| 22 | Monthly and Annual Averages of Nifty 50 (Base November 3,1995=1000) | Monthly | 31-Jul-1990 | 28-FEB-2026 | — |  | ✗ — |
| 23 | Monthly Traded Volume in Corporate Debt at NSE  (Discontinued) | Monthly | 30-Apr-1997 | 21-DEC-2012 | — |  | ✗ — |
| 24 | AVERAGE PRICE/BOOK VALUE RATIO OF BSE SENSEX | Monthly | 01-APR-1990 | 31-MAR-2026 | Book Value Ratio of BSE | BK_VAL_RAT_BSE_RN | ✓ OK |
| 25 | Foreign Equity Market Indices | Daily | 03-Mar-2003 | 17-MAR-2026 | — |  | ✗ — |

**SDMX elements in this sub-sector with no obvious DBIE report match (1):**
- ✓ `AVG_NFTY_RN` — Average of Nifty 50 *(Monthly)*

## Financial Market / Forex Market
- Reports: **15**; matched to SDMX: 12; downloaded on disk: **8**
- SDMX elements in this sub-sector: 11; unmatched SDMX: 5

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Daily Interbank Forex Rates (USD vis-a-vis INR) | Daily | 08-AUG-2000 | 27-FEB-2026 | — |  | ✗ — |
| 2 | Turnover in Foreign Exchange Market - Daily | Daily | 03-AUG-1998 | 27-FEB-2026 | EXCHANGE RATE OF THE INDIAN RUPEE DAILY | FOREX_RATE_D_RN | ? no-record |
| 3 | Sale/ Purchase of U.S. Dollar by the RBI | Monthly | 30-JUN-1995 | 31-JAN-2026 | — |  | ✗ — |
| 4 | Forex Rates - Month-High / Month-Low | Monthly | 31-AUG-1998 | 10-APR-2026 | Inter Bank Forex Rates | IB_FOREX_RT_RN | ? no-record |
| 5 | Turnover in Foreign Exchange Market | Monthly | 31-AUG-1996 | 28-FEB-2026 | FOREIGN EXCHANGE RATE AVERAGE | FOREXRT_AVG_RN | ✓ OK |
| 6 | Exchange Rate of the Indian Rupee Vis-A-Vis the SDR, US Dollar, Pound Sterling, D.M./Euro and Japanese Yen (Financial Year - Annual Average and End-Year Rates) | Annual | 31-JUL-1971 | 31-MAR-2025 | EXCHANGE RATE OF THE INDIAN RUPEE | FOREX_RATE_RN | ✓ OK |
| 7 | Exchange Rate of the Indian Rupee Vis-a-Vis the SDR, US Dollar, Pound Sterling, D.M./Euro and Japanese Yen (Calender Year - Annual Average) | Annual | 31-DEC-1970 | 31-DEC-2025 | EXCHANGE RATE OF THE INDIAN RUPEE | FOREX_RATE_RN | ✓ OK |
| 8 | Exchange Rate of the Indian Rupee vis-a-vis the SDR, US Dollar, Pound Sterling (Monthly Average and End-Month Rates) | Monthly | 31-Mar-1992 | 31-MAR-2026 | EXCHANGE RATE OF THE INDIAN RUPEE | FOREX_RATE_RN | ✓ OK |
| 9 | Forward Premia (Inter-Bank) (Monthly Average) | Monthly | 31-MAR-1993 | 27-FEB-2026 | FORWARD PREMIA (INTER-BANK) | FW_PRE_RN | ✓ OK |
| 10 | Exchange Rate of the Indian Rupee vis-a-vis the SDR, US Dollar, Pound Sterling (High and Low During the Month) | Monthly | 30-Apr-2008 | 31-MAR-2026 | EXCHANGE RATE OF THE INDIAN RUPEE | FOREX_RATE_RN | ✓ OK |
| 11 | Daily Exchange Rate of the Indian Rupee | Daily | 25-AUG-1998 | 10-APR-2026 | EXCHANGE RATE OF THE INDIAN RUPEE DAILY | FOREX_RATE_D_RN | ? no-record |
| 12 | Daily Forward Premia (Inter-Bank) | Daily | 04-NOV-2003 | 27-FEB-2026 | FORWARD PREMIA (INTER-BANK) | FW_PRE_RN | ✓ OK |
| 13 | Daily Forward Premia (USD vis-a-vis INR) (in Paise) | Daily | 08-AUG-2000 | 27-FEB-2026 | FORWARD CASH PREMIA DAILY | FWC_PRE_D_RN | ? no-record |
| 14 | Monthly Average Exchange Rates (EURO,GBP,JPY,USD) | Monthly | 31-MAY-1966 | 31-MAR-2026 | — |  | ✗ — |
| 15 | Monthly Average Exchange Rate (155 Currencies) | Monthly | 31-MAY-1966 | 31-MAR-2026 | FOREIGN EXCHANGE RATE AVERAGE | FOREXRT_AVG_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (5):**
- ✓ `AVG_FOR_RAT_RN` — Average Forex Rate *(Monthly)*
- ✓ `FOREX_RATE_AFY_RN` — Exchange rate of indian rupees *(Annual - Financial Year)*
- ✓ `FOREX_RATE_A_RN` — Exchange rate of indian rupees *(Annual - Calendar Year)*
- ✓ `FOREXRT_HL_RN` — FOREIGN EXCHANGE RATE HIGH LOW *(Monthly)*
- ✓ `FOREX_RT_REF_RN` — Forex rates based on reference rate *(Monthly)*

## Financial Market / Government Securities Market
- Reports: **20**; matched to SDMX: 17; downloaded on disk: **17**
- SDMX elements in this sub-sector: 8; unmatched SDMX: 1

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Auctions of 91-Day Government of India Treasury Bills | Weekly | 08-Jan-1993 | 08-APR-2026 | Govt of India Treasury Bills Outstanding | GOV_TR_BILL_OUTSD_RN | ✓ OK |
| 2 | Ownership of Central and State Government Securities | Annual | 20-Aug-1991 | 31-MAR-2025 | Turnover In Government Securities Market | GSEC_TO_RN | ✓ OK |
| 3 | Interest Rates on Central and State Government Dated Securities | Annual | 01-Aug-1980 | 31-MAR-2025 | Interest Rate | INT_RATE_RN | ✓ OK |
| 4 | Ownership Pattern of Government of India Dated Securities | Quarterly | 31-MAR-2007 | 31-DEC-2025 | YIELD OF SGL TRANSACTIONS IN GOVERNMENT DATED SECURITIES | YIELD_GOV_SEC_RN | ✓ OK |
| 5 | Yield of SGL Transactions in Government Dated Securiites for Various Maturities | Monthly | 20-AUG-2021 | 31-MAR-2026 | YIELD OF SGL TRANSACTIONS IN GOVERNMENT DATED SECURITIES | YIELD_GOV_SEC_RN | ✓ OK |
| 6 | Monthly Open Market Operations of Reserve Bank of India | Monthly | 30-APR-2016 | 31-MAR-2026 | Open market operations of RBI | OPN_MKT_OP_RN | ✓ OK |
| 7 | Auctions of 364-Day Government of India Treasury Bills | Weekly | 7-Apr- 1998 | 08-APR-2026 | Govt of India Treasury Bills Outstanding | GOV_TR_BILL_OUTSD_RN | ✓ OK |
| 8 | Auctions of 182-Day Government of India Treasury Bills | Weekly | 06-Apr-2005 | 08-APR-2026 | Govt of India Treasury Bills Outstanding | GOV_TR_BILL_OUTSD_RN | ✓ OK |
| 9 | Turnover in Government Securities Market (Face Value) | Weekly | 03-Apr-1998 | 03-APR-2026 | Turnover In Government Securities Market | GSEC_TO_RN | ✓ OK |
| 10 | Secondary Market Outright Transactions in Government Securities (Face Value) | Weekly | 03-Apr-1998 | 03-APR-2026 | Secondary market transactions | SEC_MKT_RN | ✓ OK |
| 11 | Maturity Pattern of Government of India Rupee loans | Annual | 31-Mar-1975 | 31-MAR-2025 | — |  | ✗ — |
| 12 | Secondary Market Repo Transactions In Government Securities (Face Value) | Weekly | 03-Apr-1998 | 10-APR-2026 | Secondary market transactions | SEC_MKT_RN | ✓ OK |
| 13 | Details of State Governments Market Borrowings | Weekly | 19-Jan-2006 | 13-APR-2026 | — |  | ✗ — |
| 14 | Outstanding List of all SLR eligible securities | Daily | 20-JAN-2006 | 16-APR-2026 | — |  | ✗ — |
| 15 | Yield of SGL Transactions in Treasury Bills for Residual Maturities | Monthly | 30-APR-1996 | 31-JUL-2025 | YIELD OF SGL TRANSACTIONS IN TREASURY BILLS | YIELD_TB_RN | ✓ OK |
| 16 | Auctions of 14-Day Government of India Treasury Bills  (Discontinued) | Weekly | 18-Jun-1999 | 07-JUN-2023 | Govt of India Treasury Bills Outstanding | GOV_TR_BILL_OUTSD_RN | ✓ OK |
| 17 | Government of India : Treasury Bills Outstanding | Weekly | 12-MAY-2006 | 03-APR-2026 | Govt of India Treasury Bills Outstanding | GOV_TR_BILL_OUTSD_RN | ✓ OK |
| 18 | Details of Central Government Market Borrowings | Weekly | 25-Apr-1995 | 10-APR-2026 | Turnover In Government Securities Market | GSEC_TO_RN | ✓ OK |
| 19 | Market Borrowings by the Government of India and State Governments- Dated Securities | Weekly | 06-Jan-2012 | 03-APR-2026 | Turnover In Government Securities Market | GSEC_TO_RN | ✓ OK |
| 20 | Secondary Market Transactions in Government Securities | Monthly | 30-SEP-1994 | 31-JUL-2025 | Secondary market transactions | SEC_MKT_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (1):**
- ✓ `MRKT_BOR_GOI_SG_RN` — Market Borrowing of GOI and Stat Govt *(Weekly)*

## Financial Market / Money Market
- Reports: **12**; matched to SDMX: 10; downloaded on disk: **7**
- SDMX elements in this sub-sector: 8; unmatched SDMX: 2

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Daily Money Market Operations | Daily | 01-JUL-2020 | 06-APR-2026 | — |  | ✗ — |
| 2 | Weighted Average Call/Notice Money Rates | Daily | 01-Apr-2005 | 06-APR-2026 | Weighted Average Call Money Rates | WAR_CALL_MONEY_RN | ✓ OK |
| 3 | Weighted Average Call/Notice Money Rates | Monthly | 30-APR-1991 | 31-JAN-2026 | Weighted Average Call Money Rates | WAR_CALL_MONEY_RN | ✓ OK |
| 4 | Certificates of Deposit | Fortnightly | 12-JUL-1991 | 31-MAR-2026 | Certificates of Deposit | CERTI_DEPO_RN | ✓ OK |
| 5 | Average Daily Turnover in Select Financial Markets | Weekly | 06-MAY-2005 | 30-JAN-2026 | Average Daily Turnover | AVG_TURNOVER_RN | ✓ OK |
| 6 | Liquidity Operations by RBI | Daily | 01-NOV-2012 | 05-APR-2026 | — |  | ✗ — |
| 7 | London Inter-bank Overnight Offer Rate | Daily | 02-JAN-2001 | 30-MAR-2022 | London Inter Bank Overnight Offer Rates | LIBOOR_RN | ? no-record |
| 8 | Mumbai Inter-Bank Offer Rate (MIBOR) & Mumbai Inter-Bank Bid Rate (MIBID) | Daily | 15-JUN-1998 | 11-MAR-2026 | London Inter Bank Overnight Offer Rates | LIBOOR_RN | ? no-record |
| 9 | Repo/ Reverse Repo Auction Under Liquidity Adjustment Facility | Daily | 03-APR-2001 | 10-APR-2026 | Auction under LAF | AUC_LAF_RN | ? no-record |
| 10 | Commercial Paper | Bi-Monthly | 15-JUN-2011 | 31-MAR-2026 | Commercial Paper | COM_PAPER_RN | ✓ OK |
| 11 | Average Daily Turnover in Call Money Market - Weekly | Weekly | 05-AUG-2011 | 02-DEC-2016 | Average Daily Turnover | AVG_TURNOVER_RN | ✓ OK |
| 12 | Weighted Average Call/Notice Money Rates | Weekly | 08-JAN-2010 | 13-FEB-2026 | Weighted Average Call Money Rates | WAR_CALL_MONEY_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (2):**
- ✗ `CALL_MONEY_RN` — Call Money Rates and Volume *(Daily)*
- ✓ `CALL_MONEY_W_RN` — Weekly  call money *(Weekly)*

## Financial Sector / Monetary Statistics
- Reports: **21**; matched to SDMX: 18; downloaded on disk: **18**
- SDMX elements in this sub-sector: 27; unmatched SDMX: 16

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Components of Money Stock | Monthly | 01-APR-1991 | 31-MAR-2025 | Money Stock Components_Fortnightly | MSC_F_RN | ✓ OK |
| 2 | Reserve Money: Components and Sources - Monthly | Monthly | 29-JUN-2001 | 12-DEC-2025 | Reserve Money Components_Monthly | RMC_M_RN | ✓ OK |
| 3 | Money Stock: Components and Sources | Fortnightly | 12-JAN-2001 | 31-MAR-2026 | Money Stock Components_Fortnightly | MSC_F_RN | ✓ OK |
| 4 | Select Monetary Aggregates - Growth Rates | Annual | 31-MAR-1970 | 31-MAR-2025 | Monetary Aggregates | MON_AG_RN | ✓ OK |
| 5 | Reserve Bank of India - Liabilities & Assets | Annual | 31-MAR-1971 | 03-APR-2026 | — |  | ✗ — |
| 6 | Commercial Bank Survey | Monthly | 26-MAR-1999 | 31-JAN-2026 | Commercial Survey Component Monthly | CSURYCOM_M_RN | ✓ OK |
| 7 | RBI - Liabilities & Assets | Monthly | 02-JUL-2004 | 27-FEB-2026 | RBI Assets_Annual | RBI_ASSET_A_RN | ✓ OK |
| 8 | Reserve Money: Components and Sources | Weekly | 2001-JUL-06 | 12-DEC-2025 | Reserve Money Components_Monthly | RMC_M_RN | ✓ OK |
| 9 | Reserve Money: Components and Sources - Yearly | Annual | 2001-Apr-01 | 31-MAR-2025 | Reserve Money Components_Monthly | RMC_M_RN | ✓ OK |
| 10 | Components of Money Stock | Annual | 1951-Mar-31 | 31-MAR-2025 | Money Stock Components_Fortnightly | MSC_F_RN | ✓ OK |
| 11 | Commercial Bank Survey | Fortnightly | 26-MAR-1999 | 31-JAN-2026 | Commercial Survey Component Monthly | CSURYCOM_M_RN | ✓ OK |
| 12 | Monetary Survey | Fortnightly | 23-APR-1999 | 31-MAR-2026 | Monetary Survey Components_Fortnightly | MSURYCOM_F_RN | ✓ OK |
| 13 | Sources of Money Stock | Annual | 1951-Mar-30 | 31-MAR-2025 | Money Stock Sources_Fortnightly | MSS_F_RN | ✓ OK |
| 14 | RESERVE BANK OF INDIA SURVEY | Monthly | 29-FEB-1952 | 31-MAR-2026 | — |  | ✗ — |
| 15 | RBI's Standing Facilities | Monthly | 22-APR-1911 | 28-FEB-2026 | RBI_Standing Facilities | RBI_SF_RN | ✓ OK |
| 16 | Monetary Survey | Monthly | 31-MAR-1999 | 31-MAR-2026 | Monetary Survey Components_Fortnightly | MSURYCOM_F_RN | ✓ OK |
| 17 | Reserve Bank of India - Liabilities & Assets | Weekly | 02-JUL-2004 | 03-APR-2026 | — |  | ✗ — |
| 18 | Notes and Coins in Circulation | Annual | 31-MAR-1971 | 31-MAR-2025 | Notes & Coin in Circulation | NOT_COIN_RN | ✓ OK |
| 19 | Average Monetary Aggregates | Annual | 31-MAR-1952 | 31-MAR-2025 | Average Monetary Aggregates | AMAGG_RN | ✓ OK |
| 20 | Sources of Money Stock | Monthly | 01-APR-1991 | 31-MAR-2025 | Money Stock Sources_Fortnightly | MSS_F_RN | ✓ OK |
| 21 | Select Monetary Ratios | Annual | 30-MAR-1952 | 31-MAR-2025 | Monetary Ratios | MONTRY_RATIOS_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (16):**
- ✓ `BMC_M_RN` — Broad Money Components_Monthly *(Monthly)*
- ✓ `CSURYCOM_F_RN` — Commercial Survey Component_Fortnightly *(Fortnightly)*
- ✓ `CSURYSOR_M_RN` — Commercial Survey Sources Monthly *(Monthly)*
- ✓ `CSURYSOR_F_RN` — Commercial Survey Sources_Fortnightly *(Fortnightly)*
- ✓ `MSURYSOR_F_RN` — Monetary Survey Sources_Fortnightly *(Fortnightly)*
- ✓ `MSS_M_RN` — Money Stock Sources_Monthly *(Monthly)*
- ✓ `RBI_ASSET_M_RN` — RBI Asset_Monthly *(Monthly)*
- ✓ `RBI_ASSET_W_RN` — RBI Asset_Weekly *(Weekly)*
- ✓ `RBI_LIAB_A_RN` — RBI Liabilities_Annual *(Annual - Financial Year)*
- ✓ `RBI_LIAB_M_RN` — RBI Liabilities_Monthly *(Monthly)*
- ✓ `RBI_LIAB_W_RN` — RBI Liabilities_Weekly *(Weekly)*
- ✓ `RBI_SURY_COM_M_RN` — RBI Survey Components_Monthly *(Monthly)*
- ✓ `RBI_SURY_SOR_M_RN` — RBI Survey Sources_Monthly *(Monthly)*
- ✓ `RMC_W_RN` — Reserve Money Components_Weekly *(Weekly)*
- ✓ `RMS_M_RN` — Reserve Money Sources _Monthly *(Monthly)*
- ✓ `RMS_W_RN` — Reserve Money Sources _Weekly *(Weekly)*

## Financial Sector / Financial Institutions
- Reports: **19**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Operations of HDFC | Annual | 31-MAR-1979 | 31-MAR-2024 | — |  | ✗ — |
| 2 | Liabilities and Assets of IFCI | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 3 | Industrial Refinance by Reserve Bank of India | Annual | 31-MAR-1971 | 31-MAR-2022 | — |  | ✗ — |
| 4 | Resource Mobilisation in the Private Placement Market | Annual | 31-MAR-1996 | 31-MAR-2025 | — |  | ✗ — |
| 5 | National Bank for Agriculture and Rural Development - Financial Assistance | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 6 | Liabilities and Assets of SIDBI | Annual | 31-MAR-1991 | 31-MAR-2025 | — |  | ✗ — |
| 7 | Liabilities and Assets of SFCs | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 8 | Liabilities and Assets of NHB | Annual | 30-JUN-1989 | 31-MAR-2025 | — |  | ✗ — |
| 9 | Liabilities and Assets of NABARD | Annual | 31-MAR-1990 | 31-MAR-2025 | — |  | ✗ — |
| 10 | Assets Under Management of Mutual Funds | Annual | 31-MAR-1997 | 31-MAR-2025 | — |  | ✗ — |
| 11 | Investments by LIC | Annual | 31-MAR-1979 | 31-MAR-2025 | — |  | ✗ — |
| 12 | Financial Assistance Sanctioned and Disbursed by All Financial Institutions | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 13 | Disbursements by National Housing Bank Under its Refinance Schemes | Annual | 31-MAR-1989 | 31-MAR-2025 | — |  | ✗ — |
| 14 | Deposit Insurance and Credit Guarantee Corporation - Liabilities and Assets (General Fund) | Annual | 31-DEC-1982 | 31-MAR-2025 | — |  | ✗ — |
| 15 | Deposit Insurance and Credit Guarantee Corporation - Liabilities and Assets (Deposit Insurance Fund) | Annual | 31-DEC-1982 | 31-MAR-2025 | — |  | ✗ — |
| 16 | Deposit Insurance and Credit Guarantee Corporation - Liabilities and Assets (Credit Guarantee Fund) | Annual | 31-DEC-1981 | 31-MAR-2025 | — |  | ✗ — |
| 17 | Deposit Insurance and Credit Guarantee Corporation - Insured Deposits | Annual | 31-DEC-1962 | 31-MAR-2025 | — |  | ✗ — |
| 18 | Bonds Issued by Public Sector Undertakings | Annual | 31-MAR-1979 | 31-MAR-2025 | — |  | ✗ — |
| 19 | Liabilities and Assets of EXIM Bank | Annual | 31-MAR-1982 | 31-MAR-2025 | — |  | ✗ — |

## Financial Sector / Banking - Sectoral Statistics
- Reports: **21**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Ownership of Deposits with Scheduled Commercial Banks | Annual | 31-MAR-2019 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Direct Institutional Credit for Agriculture and Allied Activities - Short-Term  (Discontinued) | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 3 | Food & Non-Food Credit of Scheduled Commercial Banks | Fortnightly | 06-Jun-1997 | 15-MAR-2026 | — |  | ✗ — |
| 4 | Institutional Credit for Agriculture and Allied Activities | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 5 | Scheduled Commercial Banks' Direct Finance to Farmers According to Size of Land Holdings (Disbursements) - Short-Term & Long-Term Loans  (Discontinued) | Annual | 31-MAR-1981 | 31-MAR-2012 | — |  | ✗ — |
| 6 | Bank Deposits of SCBs - Region, State, District, Bank Group, Population Group-Wise - Annual | Annual | 31-MAR-2010 | 31-MAR-2018 | — |  | ✗ — |
| 7 | Bank Credit of SCBs - Bank Group, Population Group, Occupation (Sector), District Wise - Annual | Annual | 31-MAR-2010 | 31-MAR-2025 | — |  | ✗ — |
| 8 | Sectoral Deployment of Non-Food Gross Bank Credit - Outstanding | Annual | 18-JAN-2019 | 31-JAN-2026 | — |  | ✗ — |
| 9 | Outstanding Advances of Scheduled Commercial Banks to Exporters  (Discontinued) | Quarterly | 31-MAR-2005 | 30-JUN-2018 | — |  | ✗ — |
| 10 | Outstanding Advances of Scheduled Commercial Banks for Public Food Procurement Operations | Monthly | 31-JAN-2005 | 27-JUN-2025 | — |  | ✗ — |
| 11 | Direct Institutional Credit for Agriculture and Allied Activities - Long-Term  (Discontinued) | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 12 | Position of Sick SSI Units and Sick/Weak Non-SSI Units Financed by Scheduled Commercial Banks  (Discontinued) | Annual | 31-MAR-1987 | 31-MAR-2017 | — |  | ✗ — |
| 13 | Scheduled Commercial Banks' Advances to Small Scale Industries and Allied Services - Outstanding  (Discontinued) | Annual | 31-MAR-1971 | 31-MAR-2020 | — |  | ✗ — |
| 14 | Scheduled Commercial Banks' Direct Finance to Farmers According to Size of Land Holdings (Outstanding) - Short-Term & Long-Term Loans (Discontinued) | Annual | 31-MAR-1981 | 31-MAR-2012 | — |  | ✗ — |
| 15 | Indirect Institutional Credit for Agriculture and Allied Activities (Discontinued) | Annual | 31-MAR-1972 | 31-MAR-2022 | — |  | ✗ — |
| 16 | Industry-Wise Deployment of Gross Bank Credit | Annual | 18-JAN-2019 | 31-JAN-2026 | — |  | ✗ — |
| 17 | Self-Help Group - Bank Linkage Programme | Annual | 01-APR-1992 | 31-MAR-2025 | — |  | ✗ — |
| 18 | Scheduled Commercial Banks' Advances to Agriculture - Outstanding  (Discontinued) | Annual | 31-MAR-1971 | 31-MAR-2020 | — |  | ✗ — |
| 19 | Bank Group-Wise Distribution of Employees of Scheduled Commercial Banks | Annual | 31-MAR-1992 | 31-MAR-2025 | — |  | ✗ — |
| 20 | DEPLOYMENT OF BANK CREDIT BY MAJOR SECTORS | Monthly | 18-JAN-2019 | 31-JAN-2026 | — |  | ✗ — |
| 21 | INDUSTRY-WISE DEPLOYMENT OF BANK CREDIT | Monthly | 18-JAN-2019 | 31-JAN-2026 | — |  | ✗ — |

## Financial Sector / Banking - Performance Indicators
- Reports: **8**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Bank Group-wise Classification of Loan Assets of Scheduled Commercial Banks | Annual | 31-MAR-2005 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Composition of NPAs of Public Sector Banks | Annual | 31-MAR-2003 | 31-MAR-2025 | — |  | ✗ — |
| 3 | Variables to be published Bank and Bank Group wise (For Public Access) | Quarterly | 31-MAR-2002 | 30-SEP-2025 | — |  | ✗ — |
| 4 | Bank-wise and Bank Group-wise Gross Non-Performing Assets, Gross Advances, and Gross NPA Ratios of Scheduled Commercial Banks | Annual | 31-MAR-2004 | 31-MAR-2025 | — |  | ✗ — |
| 5 | Distribution of Scheduled Commercial Banks by CRAR | Annual | 31-MAR-1996 | 31-MAR-2024 | — |  | ✗ — |
| 6 | Scheduled Commercial Banks - Ratios | Annual | 31-MAR-1951 | 21-MAR-2025 | — |  | ✗ — |
| 7 | Gross and Net NPAs of Scheduled Commercial Banks - Bank Group-Wise | Annual | 31-MAR-1997 | 31-MAR-2024 | — |  | ✗ — |
| 8 | Important Banking Indicators - Regional Rural Banks - Outstanding | Annual | 31-MAR-1980 | 31-MAR-2026 | — |  | ✗ — |

## Financial Sector / Banking - Assets & Liabilities
- Reports: **27**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Scheduled Commercial Bank's Investments | Fortnightly | 06-JUN-1997 | 15-MAR-2026 | — |  | ✗ — |
| 2 | Scheduled Commercial Banks - Select Aggregates | Monthly | 22-JAN-2016 | 31-JAN-2026 | — |  | ✗ — |
| 3 | Bank Group-wise Business of Scheduled Banks in India | Monthly | 2005-Mar-31 | 21-MAR-2025 | — |  | ✗ — |
| 4 | State-wise Distribution of Liabilities and Assets of District Central Co-operative Banks | Annual | 31-MAR-2005 | 31-MAR-2024 | — |  | ✗ — |
| 5 | Bank Group-wise Insured Deposits | Annual | 30-SEP-2005 | 31-MAR-2025 | — |  | ✗ — |
| 6 | Business of Scheduled Banks in India | Monthly | 01-MAR-2005 | 21-MAR-2025 | — |  | ✗ — |
| 7 | State-wise Distribution of Scheduled Commercial Banks' Investments in State Government Securities and Shares/Debentures/Bonds of State Level Bodies  (Discontinued) | Annual | 31-MAR-2005 | 31-MAR-2012 | — |  | ✗ — |
| 8 | Liabilities and Assets of Indian Scheduled Commercial Banks in Foreign Countries | Annual | 31-MAR-2004 | 31-MAR-2025 | — |  | ✗ — |
| 9 | Scheduled Commercial Banks - Select Aggregates | Fortnightly | 30-MAY-1997 | 31-JAN-2026 | — |  | ✗ — |
| 10 | Scheduled Commercial Banks - Select Aggregates - Annual | Annual | 30-MAR-1951 | 21-MAR-2025 | — |  | ✗ — |
| 11 | State-wise Distribution of Liabilities and Assets of State Co-operative Banks | Annual | 31-MAR-2005 | 31-MAR-2024 | — |  | ✗ — |
| 12 | Investments of Scheduled Commercial Banks (Discontinued) | Annual | 2005-Mar-31 | 31-MAR-2012 | — |  | ✗ — |
| 13 | Business in India - All Scheduled Banks and All Scheduled Commercial Banks | Monthly | 1997-May-30 | 31-JAN-2026 | — |  | ✗ — |
| 14 | Unclaimed Deposits with Scheduled Commercial Banks | Annual | 31-MAR-2005 | 31-MAR-2024 | — |  | ✗ — |
| 15 | Cash Balances of Scheduled Commercial Banks (excluding Regional Rural Banks) with Reserve Bank of India | Daily | 22-JUL-2006 | 07-APR-2026 | — |  | ✗ — |
| 16 | Abridged Balance Sheet - Bank Group wise - Quarterly (Discontinued) | Quarterly | 31-MAR-1997 | 30-SEP-2013 | — |  | ✗ — |
| 17 | RTP: Growth Rate of Select Balance Sheet Indicators of Sch. UCBs | Annual | 31-MAR-1997 | 31-MAR-2011 | — |  | ✗ — |
| 18 | RTP: Select Balance Sheet Indicators of Primary Agricultural Credit Societies (PACS) | Annual | 31-MAR-1997 | 31-MAR-2011 | — |  | ✗ — |
| 19 | Flow of Financial Resources from Scheduled Commercial Banks to the Commercial Sector | Fortnightly | 2017-Apr-14 | 21-FEB-2025 | — |  | ✗ — |
| 20 | Bank Group-wise and Instrument-wise Derivatives of Scheduled Commercial Banks in India | Annual | 2012-Mar-31 | 31-MAR-2025 | — |  | ✗ — |
| 21 | State Co-operative Banks Maintaining Accounts with the RBI | Monthly | 28-NOV-1997 | 31-DEC-2025 | — |  | ✗ — |
| 22 | State Co-operative Banks Maintaining Accounts with the Reserve Bank of India | Annual | 1971-Mar-31 | 28-MAR-2025 | — |  | ✗ — |
| 23 | Loans and Advances of PACS, SCARDBs and PCARDBs | Annual | 31-MAR-1978 | 31-MAR-2024 | — |  | ✗ — |
| 24 | Non-Performing Assets of Co-operative Banks | Annual | 31-MAR-1995 | 31-MAR-2024 | — |  | ✗ — |
| 25 | Consolidated Balance Sheet of Scheduled Commercial Banks (Excluding Regional Rural Banks) | Annual | 31-MAR-1991 | 31-MAR-2024 | — |  | ✗ — |
| 26 | Select Aggregates of Scheduled Commercial Banks - Growth Rates | Annual | 28-MAR-1952 | 21-MAR-2025 | — |  | ✗ — |
| 27 | List of Amalgamated Regional Rural Banks | Annual | 31-AUG-2006 | 31-MAR-2024 | — |  | ✗ — |

## Financial Sector / Payment Systems
- Reports: **4**; matched to SDMX: 1; downloaded on disk: **0**
- SDMX elements in this sub-sector: 1; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Cheque Clearances | Annual | 31-MAR-2005 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Payment System Indicators | Annual | 1970-Mar-31 | 31-JAN-2026 | — |  | ✗ — |
| 3 | Number of Clearing Houses | Annual | 2005-Mar-31 | 31-MAR-2025 | Clearing House | CLEARING_HOU_RN | ? error |
| 4 | Payment System Indicators | Monthly | 30-APR-2004 | 31-JAN-2026 | — |  | ✗ — |

## Financial Sector / Non Banking Financial Companies
- Reports: **3**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Aggregate Deposits of the NBFC Sector | Annual | 31-MAR-1998 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Financial Statistics of NBFC Sector | Quarterly | 31-MAR-2012 | 31-MAR-2015 | — |  | ✗ — |
| 3 | Credit to Various Sectors by NBFCs | Annual | 31-MAR-2016 | 31-MAR-2018 | — |  | ✗ — |

## Financial Sector / Key Rates
- Reports: **5**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Major Monetary Policy Measures - Bank Rate, CRR & SLR | Quarterly | 04-JUL-1935 | 05-DEC-2025 | — |  | ✗ — |
| 2 | Structure of Interest Rates | Annual | 31-MAR-1971 | 31-MAR-2026 | — |  | ✗ — |
| 3 | Weighted Average Lending Rate (Discontinued) | Annual | 31-MAR-1992 | 31-MAR-2014 | — |  | ✗ — |
| 4 | Bank Group-wise and Occupation-wise Weighted Average Lending Rate and Deposit Rate  (Discontinued) | Annual | 31-MAR-2005 | 31-MAR-2014 | — |  | ✗ — |
| 5 | MPC voting pattern-Policy rate | As and When | 04-OCT-2016 | 08-APR-2026 | — |  | ✗ — |

## Public Finance / Central Govt. Finance
- Reports: **15**; matched to SDMX: 14; downloaded on disk: **14**
- SDMX elements in this sub-sector: 12; unmatched SDMX: 3

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Financing of Public Sector Plan (Discontinued) | Annual | 31-MAR-1986 | 31-MAR-2017 | Public Sector Plan Outlay | PSPOUTLY_RN | ✓ OK |
| 2 | Central Government Receipts - Major Components | Annual | 31-MAR-1971 | 31-MAR-2026 | Central Government Receipts | CG_RECPT_RN | ✓ OK |
| 3 | Centre's Gross Fiscal Deficit and its Financing | Annual | 31-MAR-1971 | 31-MAR-2026 | — |  | ✗ — |
| 4 | Key Deficit Indicators of the Central Government | Annual | 31-MAR-1971 | 31-MAR-2026 | Central Government Deficit | CG_DEF_RN | ✓ OK |
| 5 | Month-Wise Gross Fiscal Deficit of the Central Government | Monthly | 30-APR-1994 | 30-JUN-2025 | Central Government Deficit | CG_DEF_RN | ✓ OK |
| 6 | Gross Capital Formation from Budgetary Resources of the Central Government | Annual | 31-MAR-1971 | 31-MAR-2018 | Budgetary Resources | BUD_RESOR_RN | ✓ OK |
| 7 | Major Heads of Capital Receipts of the Central Government | Annual | 31-MAR-1971 | 31-MAR-2026 | Central Government Receipts | CG_RECPT_RN | ✓ OK |
| 8 | Major Heads of Developmental and Non-Developmental Expenditure of the Central Government | Annual | 31-MAR-1981 | 31-MAR-2026 | Devlopmental and Non-Devlopmental  Expenditures - Central Government | CG_DEV_NDEV_EXP_RN | ✓ OK |
| 9 | Major Heads of Expenditure of the Central Government | Annual | 31-MAR-1971 | 31-MAR-2026 | Central Government Borrowings | CG_BOR_RN | ✓ OK |
| 10 | Select Fiscal Indicators of the Central Government (As Percentage to GDP) | Annual | 31-MAR-1971 | 31-MAR-2026 | Fiscal Indicators of the Central Government as per centage to GDP | FICG_GDP_RN | ✓ OK |
| 11 | Small Savings Schemes | Annual | 01-APR-1992 | 01-JUL-2025 | Small Savings | SMAL_SAV_RN | ✓ OK |
| 12 | Small Savings | Monthly | 30-APR-1992 | 31-AUG-2025 | Small Savings | SMAL_SAV_RN | ✓ OK |
| 13 | Small Savings | Annual | 1982-Mar-31 | 31-AUG-2025 | Small Savings | SMAL_SAV_RN | ✓ OK |
| 14 | Public Sector Plan Outlay (At Current Prices)  (Discontinued) | Annual | 31-MAR-1986 | 31-MAR-2017 | Public Sector Plan Outlay | PSPOUTLY_RN | ✓ OK |
| 15 | Outstanding Liabilities of Central Government | Annual | 31-MAR-1981 | 31-MAR-2026 | Central Government Liabilities | CGL_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (3):**
- ✓ `CG_DEFM_RN` — Central Government Deficit Monthly *(Monthly)*
- ✓ `CG_EXP_RN` — Central Government Expenditures *(Annual - Financial Year)*
- ✓ `PUB_BOR_RN` — Public Sector Borrowings *(Annual - Financial Year)*

## Public Finance / Central & State Govt. Finance (Combined)
- Reports: **8**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Direct and Indirect Tax Revenues of Central and State Governments | Annual | 1981-Mar-31 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Combined Liabilities of Central and State Governments | Annual | 31-MAR-1981 | 31-MAR-2025 | — |  | ✗ — |
| 3 | Developmental and Non-Developmental Expenditure of Central and State Governments | Annual | 1981-Mar-31 | 31-MAR-2025 | — |  | ✗ — |
| 4 | Market Borrowings of Central and State Governments | Annual | 31-MAR-1981 | 31-MAR-2026 | — |  | ✗ — |
| 5 | Select Debt Indicators of the Central and State Governments (As Percentage to GDP) | Annual | 31-MAR-1981 | 31-MAR-2025 | — |  | ✗ — |
| 6 | Combined Deficit of Central and State Governments | Annual | 31-MAR-1981 | 31-MAR-2025 | — |  | ✗ — |
| 7 | Combined Deficits of the Central and State Governments (As Percentage to GDP) | Annual | 31-MAR-1981 | 31-MAR-2025 | — |  | ✗ — |
| 8 | Receipts and Disbursements of Central and State Governments | Annual | 31-MAR-1981 | 31-MAR-2026 | — |  | ✗ — |

## Public Finance / State Govt. Finance
- Reports: **7**; matched to SDMX: 7; downloaded on disk: **6**
- SDMX elements in this sub-sector: 8; unmatched SDMX: 2

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Expenditure Pattern of the State Governments | Annual | 31-MAR-1971 | 31-MAR-2025 | Expenditure Pattern of the State Governments | SG_EXP_RN | ✓ OK |
| 2 | Pattern of Receipts of the State Governments | Annual | 31-MAR-1971 | 31-MAR-2025 | Pattern of Receipts of the State Governments | SG_RECPT_RN | ✓ OK |
| 3 | Key Deficit Indicators of the State Governments | Annual | 31-MAR-1971 | 31-MAR-2025 | Combined State Government Deficit | CSG_DEF_RN | ✓ OK |
| 4 | Outstanding Liabilities of the State Governments | Annual | 31-MAR-1981 | 31-MAR-2025 | State Government Liabilities | SGL_RN | ? error |
| 5 | Pattern of Major Capital Receipts of the State Governments | Annual | 31-MAR-1971 | 31-MAR-2025 | Pattern of Receipts of the State Governments | SG_RECPT_RN | ✓ OK |
| 6 | Select Fiscal Indicators of the State Governments (As Percentage to GDP) | Annual | 31-MAR-1974 | 31-MAR-2025 | Fiscal Indicators of the State Government as per centage to GDP | FISG_GDP_RN | ✓ OK |
| 7 | States' Gross Fiscal Deficit and its Financing | Annual | 31-MAR-1981 | 31-MAR-2025 | State Government Gross Fiscal Deficit Financing | SG_BOR_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (2):**
- ✓ `ST_FIN_STD_BUDGETS_RN` — State Finances a Study of Budgets *(Annual - Financial Year)*
- ✓ `SG_CAP_REV_EXP_RN` — State Government Capital and Revenue Expenditures *(Annual - Financial Year)*

## Real Sector / Prices & Wages
- Reports: **25**; matched to SDMX: 22; downloaded on disk: **20**
- SDMX elements in this sub-sector: 20; unmatched SDMX: 7

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Consumer Price Index for Rural Labourer - By Group (Year-End) | Annual | 31-MAR-1996 | 31-MAR-2025 | Consumer Price Index - Rural Labourer(Average/Year End) | CPI_RL_AV_YRND_RN | ✓ OK |
| 2 | Diffusion Indices based on CPI data | Monthly | 01-FEB-2014 | 01-DEC-2025 | — |  | ✗ — |
| 3 | Consumer Price Index for Industrial Workers - By Group (Year-End) | Annual | 31-Mar-1969 | 31-MAR-2025 | Consumer Price Index - Industrial Worker | CPI_IW_RN | ✓ OK |
| 4 | Consumer Price Index for Agricultural Labourer - By Group (Year-End) | Annual | 31-MAR-1996 | 31-MAR-2025 | Consumer Price Index - Agriculture Labourer(Average/Year end) | CPI_AGR_AVG_YRND_RN | ✓ OK |
| 5 | House Price Index | Quarterly | 31-MAR-2009 | 31-DEC-2025 | House Price Index | HOUSE_PRICE_INDEX_RN | ✓ OK |
| 6 | Consumer Price Index - Rural, Urban, Combined (All India) | Monthly | 31-JAN-2011 | 31-MAR-2026 | Consumer Price Index - Rural, Urban, Combined (All India) | CPI_RUC_RN | ✓ OK |
| 7 | Consumer Price Index - Annual Average | Annual | 1970-Mar-31 | 31-MAR-2025 | Consumer Price Index - Annual Average/Variation | CPI_ANN_AVG_VAR_RN | ✓ OK |
| 8 | Wholesale Price Index - Annual Average | Annual | 31-MAR-1953 | 31-MAR-2026 | Wholesale Price Index - Annual Average/Variation | WHOLE_PRICE_INDEX_AVG_VAR_RN | ✓ OK |
| 9 | Wholesale Price Index Data - Weekly (Discontinued) | Weekly | 04-FEB-1994 | 21-DEC-2012 | Wholesale Price Index | WHOLE_PRICE_INDEX_RN | ? timeout |
| 10 | Consumer Price Index for Agricultural Labourer - By Group (Annual Average) | Annual | 31-MAR-1967 | 31-MAR-2025 | Consumer Price Index - Annual Average/Variation | CPI_ANN_AVG_VAR_RN | ✓ OK |
| 11 | Consumer Price Index Numbers for Industrial Workers - All-India and Selected Centres | Monthly | 31-AUG-1968 | 31-JAN-2026 | Consumer Price Index - Industrial Workers (All India and Selected Centres) | CPI_IW_AISC_RN | ✓ OK |
| 12 | Wholesale Price Index - Monthly Data | Monthly | 30-Apr-1982 | 31-MAR-2026 | Wholesale Price Index | WHOLE_PRICE_INDEX_RN | ? timeout |
| 13 | Consumer Price Index Numbers for Agricultural/Rural Labourers (State-Wise) | Monthly | 30-SEP-1964 | 31-MAR-2026 | Consumer Price Index - Agriculture and Rural Labourer(State wise) | CPI_ALRL_ST_RN | ✓ OK |
| 14 | Consumer Price Index - Rural, Urban, Combined (State-Wise) | Monthly | 2011-Jan-31 | 31-MAR-2026 | Consumer Price Index - Rural, Urban, Combined (All India) | CPI_RUC_RN | ✓ OK |
| 15 | Consumer Price Index (Average of Months) - Annual Variation | Annual | 31-MAR-1967 | 31-MAR-2025 | Consumer Price Index - Annual Average/Variation | CPI_ANN_AVG_VAR_RN | ✓ OK |
| 16 | Consumer Price Index - Annual Variation | Monthly | 30-Apr-1967 | 31-JUL-2025 | Consumer Price Index - Annual Variation | CPI_AV_RN | ✓ OK |
| 17 | Gold and Silver - Yearly Average Price in Domestic and Foreign Markets | Annual | 31-MAR-1971 | 31-MAR-2025 | — |  | ✗ — |
| 18 | Consumer Price Index for Rural Labourer - By Group (Annual Average) | Annual | 31-Mar-1996 | 31-MAR-2025 | Consumer Price Index - Rural Labourer | CPI_RL_RN | ✓ OK |
| 19 | Monthly Average Price of Gold and Silver in Domestic and Foreign Markets | Monthly | 01-APR-1990 | 01-JAN-2026 | — |  | ✗ — |
| 20 | Wholesale Price Index - Annual Variation | Annual | 31-Mar-1971 | 31-MAR-2025 | Wholesale Price Index - Annual Average/Variation | WHOLE_PRICE_INDEX_AVG_VAR_RN | ✓ OK |
| 21 | Consumer Price Index for Rural Labourer - Monthly | Monthly | 30-Nov-1995 | 28-FEB-2026 | Consumer Price Index - Rural Labourer | CPI_RL_RN | ✓ OK |
| 22 | Average Daily Wage Rates (in Rs.) in Rural India for Men | Monthly | 30-Apr-1998 | 23-APR-2025 | Wage Rates | WAGE_RATES_RN | ✓ OK |
| 23 | Consumer Price Index for Industrial Workers - By Group ( Annual Average ) | Annual | 31-Mar-1969 | 31-MAR-2025 | Consumer Price Index - Industrial Worker | CPI_IW_RN | ✓ OK |
| 24 | Consumer Price Index for Agricultural Labourer - Monthly | Monthly | 30-APR-1966 | 28-FEB-2026 | Consumer Price Index - Rural Labourer | CPI_RL_RN | ✓ OK |
| 25 | Consumer Price Index for Industrial Workers - Monthly | Monthly | 31-Aug-1968 | 28-FEB-2026 | Consumer Price Index - Industrial Workers (All India and Selected Centres) | CPI_IW_AISC_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (7):**
- ✓ `CPI_IW_AV_YRND_RN` — Consumer Price Index - Industrial worker(Average/Year End) *(Annual - Financial Year)*
- ✓ `CPI_RUC_ST_RN` — CPI - Rural, Urban, Combined (All India- Statewise) *(Monthly)*
- ✓ `CPI_AG_RN` — CPI-Agricultural Labourer *(Monthly)*
- ✓ `INX_WPI_RN` — Index Numbers of Wholesale Prices in India *(Weekly)*
- ✓ `METAL_PRICE_RN` — Metal Price *(Monthly)*
- ✓ `METAL_PRICE_A_RN` — Metal Price - Annual Average *(Annual - Financial Year)*
- ✗ `WHOLE_PRICE_INDEX_INF_RN` — Wholesale Price Index Inflation *(Monthly)*

## Real Sector / National Income
- Reports: **22**; matched to SDMX: 20; downloaded on disk: **17**
- SDMX elements in this sub-sector: 16; unmatched SDMX: 4

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Net State Value Added by Economic Activity (At Current Prices) (Base: 2011-12) | Annual | 2000-Mar-31 | 31-MAR-2025 | — |  | ✗ — |
| 2 | Select Macro-Economic Aggregates - Growth Saving and Investment Rates (at Current Prices) | Annual | 31-MAR-1951 | 31-MAR-2026 | Macro Economic Aggregates | MACRO_ECN_AGG_RN | ✓ OK |
| 3 | Net State Value Added by Economic Activity (At Constant Prices) (Base: 2011-12) | Annual | 31-Mar-2000 | 31-MAR-2025 | — |  | ✗ — |
| 4 | Components of Gross Domestic Product (at Market Prices) | Annual | 31-MAR-1951 | 31-MAR-2026 | Annual Gross Domestic Product at Market Price | ANN_GDP_MRKT_PRC_RN | ✓ OK |
| 5 | Macro Economic Aggregates (at Constant Prices) | Annual | 31-MAR-1951 | 31-MAR-2026 | Macro Economic Aggregates | MACRO_ECN_AGG_RN | ✓ OK |
| 6 | Macro Economic Aggregates (at Current Prices) | Annual | 31-MAR-1951 | 31-MAR-2026 | Macro Economic Aggregates | MACRO_ECN_AGG_RN | ✓ OK |
| 7 | Gross State Domestic Product (SDP) - Annual | Annual | 2000-Mar-31 | 31-MAR-2022 | Gross State Domestic Product | GROSS_STATE_DOM_PRD_RN | ? no-record |
| 8 | Components of Gross Domestic Product at Factor Cost/ Gross Value Added at Basic Price | Annual | 31-MAR-1951 | 31-MAR-2026 | Quarterly Gross Domestic Product at Factor cost / Gross value added at basic price | QTR_GDP_FACT_CST_RN | ✓ OK |
| 9 | Employment in Public and Organised Private Sector | Annual | 31-MAR-1971 | 31-MAR-2024 | Sector-wise Employment | SEC_WIS_EMP_RN | ✓ OK |
| 10 | Net State Domestic Product at Factor Cost - State-Wise (at Current Prices) | Annual | 31-MAR-1981 | 31-MAR-2025 | Net State Domestic Product at Factor cost | NET_SDP_FAC_CST_RN | ? no-record |
| 11 | Select Macro-Economic Aggregates - Growth Saving and Investment Rates (at Constant Prices) | Annual | 1961-Mar-31 | 31-MAR-2026 | Macro Economic Aggregates | MACRO_ECN_AGG_RN | ✓ OK |
| 12 | Quarterly Estimates of Gross Domestic Product at Factor Cost/ Gross Value Added at Basic Price (at Constant Prices) | Quarterly | 30-JUN-1996 | 30-SEP-2025 | Quarterly Gross Domestic Product at Factor cost / Gross value added at basic price | QTR_GDP_FACT_CST_RN | ✓ OK |
| 13 | Sector-Wise Gross Capital Formation | Annual | 31-MAR-1951 | 31-MAR-2024 | Sector-wise Gross Capital Formation | SEC_WIS_CAP_FOM_RN | ✓ OK |
| 14 | Sector-Wise Domestic Savings (at Current Prices) | Annual | 31-MAR-1951 | 31-MAR-2024 | Sector-wise Domestic Savings | SEC_WIS_DOM_SAV_RN | ✓ OK |
| 15 | Per Capita Net State Domestic Product at Factor Cost - State-Wise (at Current Prices) | Annual | 31-MAR-1981 | 31-MAR-2025 | Per Capita Net State Domestic Product at Factor Cost | PER_CAP_NET_SDP_RN | ✓ OK |
| 16 | Per Capita Net State Domestic Product at Factor Cost - State-Wise (at Constant Prices) | Annual | 31-MAR-1981 | 31-MAR-2025 | Per Capita Net State Domestic Product at Factor Cost | PER_CAP_NET_SDP_RN | ✓ OK |
| 17 | Net State Domestic Product at Factor Cost - State-Wise (at Constant Prices) | Annual | 31-MAR-1981 | 31-MAR-2025 | Net State Domestic Product at Factor cost | NET_SDP_FAC_CST_RN | ? no-record |
| 18 | Gross/Net Capital Formation | Annual | 1950-Mar-31 | 31-MAR-2018 | Gross Net Capital Formation | GROSS_NET_CAP_FRM_RN | ✓ OK |
| 19 | Changes in Financial Assets/Liabilities of the Household Sector | Annual | 31-MAR-1971 | 31-MAR-2024 | Changes in Financial Assets of the Household Sector | CHG_FIN_ASS_HOUSE_SEC_RN | ✓ OK |
| 20 | Quarterly Estimates of Gross Domestic Product at Market Prices (at Current Prices) | Quarterly | 30-JUN-1996 | 30-SEP-2025 | Quarterly Gross Domestic Product at Market Price | QTR_GDP_MRKT_PRC_RN | ✓ OK |
| 21 | Quarterly Estimates of Gross Domestic Product at Market Prices (at Constant Prices) | Quarterly | 30-JUN-1996 | 30-SEP-2025 | Quarterly Gross Domestic Product at Market Price | QTR_GDP_MRKT_PRC_RN | ✓ OK |
| 22 | Quarterly Estimates of Gross Domestic Product at Factor Cost/ Gross Value Added at Basic Price (at Current Prices) | Quarterly | 30-JUN-1996 | 30-SEP-2025 | Quarterly Gross Domestic Product at Factor cost / Gross value added at basic price | QTR_GDP_FACT_CST_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (4):**
- ✓ `ANN_GDP_FACT_CST_RN` — Annual Gross Value Added at Basic Prices *(Annual - Financial Year)*
- ✓ `CHG_FIN_LIB_HOUSE_SEC_RN` — Changes in Financial Liabilities of the Household Sector *(Annual - Financial Year)*
- ✗ `COMP_ECO_ACT_NSDP_FACT_CST_RN` — Components and Economic Activity of Domestic Products at  Factor Cost - State Wise *(Annual - Financial Year)*
- ✓ `MACRO_ECN_AGG_RTS_RN` — Macro Economic Aggregate Rates *(Annual - Financial Year)*

## Real Sector / Industrial Statistics
- Reports: **12**; matched to SDMX: 10; downloaded on disk: **10**
- SDMX elements in this sub-sector: 12; unmatched SDMX: 4

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Annual Survey of Industries - Principal Characteristics | Annual | 31-MAR-1991 | 31-MAR-2024 | Details captured under Annual Survey of Industries | ANN_SURV_INDS_RN | ✓ OK |
| 2 | Implementation of Central Sector Projects - Status | Annual | 31-MAR-1995 | 31-MAR-2024 | Central Sector Projects | CENT_SEC_PRJ_RN | ✓ OK |
| 3 | Index Numbers of Core Industries | Annual | 31-Mar-1995 | 31-MAR-2025 | Index Numbers of Core/Infrastructure Industries | INX_CORE_INF_INDS_RN | ✓ OK |
| 4 | Performance of SSI sector | Annual | 31-MAR-1974 | 31-MAR-2017 | Perfomance of SSI Sector | PER_SSI_SEC_RN | ✓ OK |
| 5 | Production and Imports of Crude Oil and Petroleum Products | Annual | 31-MAR-1973 | 31-MAR-2025 | Imports of Petroleum Products | IMPT_PETRL_PRD_RN | ✓ OK |
| 6 | Sector-Wise Cost Overrun of Delayed Central Sector Projects | Annual | 31-MAR-1995 | 31-MAR-2024 | Central Sector Projects | CENT_SEC_PRJ_RN | ✓ OK |
| 7 | Index Numbers of Major Industry Groups of Manufacturing Sector | Annual | 31-Mar-1995 | 28-FEB-2026 | — |  | ✗ — |
| 8 | Index Numbers of Major Industry Groups of Manufacturing Sector | Monthly | 1995-Mar-31 | 28-FEB-2026 | — |  | ✗ — |
| 9 | Index Numbers of Industrial Production - Use-Based Classification | Annual | 31-MAR-1982 | 31-MAR-2025 | Index of Industrial Production | INX_INDS_PROD_RN | ✓ OK |
| 10 | Production of Select Industries | Annual | 1981-Mar-31 | 31-MAR-2025 | Production of Select Industries | PROD_SEL_INDS_RN | ✓ OK |
| 11 | Index Numbers of Core Industries - Growth Rates | Annual | 1994-Mar-31 | 31-MAR-2025 | Index Numbers of Core/Infrastructure Industries - Growth Rates | INX_CORE_INF_INDS_GWT_RN | ✓ OK |
| 12 | Index of Industrial Production | Monthly | 1994-Mar-31 | 28-FEB-2026 | Index of Industrial Production | INX_INDS_PROD_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (4):**
- ✓ `CENT_SEC_DEL_PRJ_RN` — Central Sector Delayed Projects *(Annual - Financial Year)*
- ✓ `IIP_MANF_SEC_ANN_RN` — Indian Industrial Production Manufacturing Sector Anually *(Annual - Financial Year)*
- ✓ `IIP_MANF_SEC_MTH_RN` — Indian Industrial Production Manufacturing Sector Monthly *(Monthly)*
- ✓ `PROD_PETRL_PRD_RN` — Production of Petroleum Products *(Annual - Financial Year)*

## Real Sector / Agriculture
- Reports: **13**; matched to SDMX: 11; downloaded on disk: **11**
- SDMX elements in this sub-sector: 10; unmatched SDMX: 4

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Area Under Cultivation - Major Commercial Crops | Annual | 31-MAR-1951 | 31-MAR-2026 | Area Under Cultivation | AREA_UNDER_CULT_RN | ✓ OK |
| 2 | Index Numbers of Agricultural Production - Major Crops | Annual | 31-MAR-1981 | 31-MAR-2025 | Agricultural Index - Major crops | AGR_INDEX_MJR_CRPS_RN | ✓ OK |
| 3 | Index Numbers of Area, Production and Yield of Foodgrains, Non-Foodgrains and All Crops in India | Annual | 31-MAR-1950 | 31-MAR-2025 | — |  | ✗ — |
| 4 | Minimum Support Price for Foodgrains According to Crop Year | Annual | 31-MAR-1976 | 31-MAR-2026 | Minimum Support Price | MIN_SUP_PRICE_RN | ✓ OK |
| 5 | Minimum Support Price for Non-Foodgrains According to Crop Year | Annual | 31-MAR-1976 | 31-MAR-2026 | Minimum Support Price | MIN_SUP_PRICE_RN | ✓ OK |
| 6 | Pattern of Land Use and Select Inputs for Agricultural Production | Annual | 31-MAR-1951 | 31-MAR-2024 | Agricultural Production | AGR_PROD_RN | ✓ OK |
| 7 | Public Distribution System - Procurement Off-Take and Stocks | Annual | 31-MAR-1951 | 31-MAR-2026 | Public Distribution System of agriculture produce | PDS_AGR_PROD_RN | ✓ OK |
| 8 | State-Wise Production of Foodgrains and Major Non-Foodgrain Crops | Annual | 1980-Mar-31 | 31-MAR-2023 | State wise agricultural production | AGR_PROD_ST_RN | ✓ OK |
| 9 | Agricultural Production - Foodgrains | Annual | 31-MAR-1951 | 31-MAR-2026 | Agricultural Production | AGR_PROD_RN | ✓ OK |
| 10 | Agricultural Production - Major Commercial Crops | Annual | 31-MAR-1951 | 31-MAR-2026 | Agricultural Production | AGR_PROD_RN | ✓ OK |
| 11 | Area Under Cultivation - Foodgrains | Annual | 31-MAR-1951 | 31-MAR-2026 | Area Under Cultivation | AREA_UNDER_CULT_RN | ✓ OK |
| 12 | Yield Per Hectare - Foodgrains | Annual | 31-MAR-1951 | 31-MAR-2026 | — |  | ✗ — |
| 13 | Yield Per Hectare - Major Commercial Crops | Annual | 31-MAR-1951 | 31-MAR-2026 | Agricultural Index - Major crops | AGR_INDEX_MJR_CRPS_RN | ✓ OK |

**SDMX elements in this sub-sector with no obvious DBIE report match (4):**
- ✓ `AGR_INDEX_RN` — Agricultural Index *(Annual - Financial Year)*
- ✓ `AGR_PRODUCTIVITY_RN` — Agricultural Productivity *(Annual - Financial Year)*
- ✓ `AGG_STAT_IS_RN` — Agricultural Statistics - Indian State *(Annual - Financial Year)*
- ✓ `PATT_LU_UAII_RN` — Pattern of Land Use & Use of Agriculltural inputs in India *(Annual - Financial Year)*

## Socio-Economic Indicators / Socio-Economic Indicators
- Reports: **2**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Number and Percentage of Population Below Poverty Line | Annual | 01-Mar-1974 | 01-MAR-2012 | — |  | ✗ — |
| 2 | Employment Situation in India - Per 1000 Distribution of Usually Employed by Broad Groups of Industry for Various Rounds | Annual | 31-Dec-1983 | 30-JUN-2024 | — |  | ✗ — |

## Surveys – Aggregated Data / Survey of Professional Forecasters
- Reports: **3**; matched to SDMX: 0; downloaded on disk: **0**
- SDMX elements in this sub-sector: 0; unmatched SDMX: 0

| # | Report (DBIE) | Freq | From | To | SDMX match | DSD | Status |
|---|---|---|---|---|---|---|---|
| 1 | Round-wise Aggregate Tables | Bi-Monthly | 30-NOV-2019 | 31-JAN-2026 | — |  | ✗ — |
| 2 | Survey of Professional Forecasters: Aggregate-level Time Series Data | Bi-Monthly | 30-NOV-2019 | 31-JAN-2026 | — |  | ✗ — |
| 3 | SPF-Survey of Professional Forecasters- Aggregate Level Metadata |  |  |  | — |  | ✗ — |
