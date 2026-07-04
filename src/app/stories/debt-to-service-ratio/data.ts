// India's external debt — end-March, ₹ crore basis.
//
// dsr               — External Debt Service Ratio (%): hand-transcribed from the MoF/RBI
//                     "India's External Debt" status reports (not in the committed workbook)
// externalDebtToGdp — External Debt as % of GDP [workbook col BM, processor-derived]
//
// NB: externalDebtToGdp is EXTERNAL debt only (peaks ~38.7% in 1992). It is NOT
// the general-government debt-to-GDP referenced in the narrative.
// externalDebtToGdp is processor-derived from the committed workbook.
// See data/processors/story-external-debt.mjs.
//
// ggDebtToGdp — Combined total liabilities of Centre and state governments as %
// of GDP. Source: RBI, Database on Indian Economy (fiscal years ending March),
// debt-indicators-of-government-as-percentage-to-gdp.csv, series LT4. This
// replaces the earlier IMF WEO rounded approximation.

import { EXT_DEBT_TO_GDP, GG_DEBT_TO_GDP } from './data.gen';

export interface DebtDatum {
    year              : number;
    dsr               : number;
    externalDebtToGdp : number;
    ggDebtToGdp       : number;
}

// dsr — External Debt Service Ratio (%), hand-transcribed from the Ministry of
// Finance / RBI "India's External Debt" status reports; not present in the
// committed workbook, so not processor-derived.
const DSR_HAND : { year : number; dsr : number }[] = [
    { year : 1991, dsr : 35.3 },
    { year : 1992, dsr : 30.2 },
    { year : 1993, dsr : 27.5 },
    { year : 1994, dsr : 25.4 },
    { year : 1995, dsr : 25.9 },
    { year : 1996, dsr : 26.2 },
    { year : 1997, dsr : 23.0 },
    { year : 1998, dsr : 19.5 },
    { year : 1999, dsr : 18.7 },
    { year : 2000, dsr : 17.1 },
    { year : 2001, dsr : 16.6 },
    { year : 2002, dsr : 13.7 },
    { year : 2003, dsr : 16.0 },
    { year : 2004, dsr : 16.1 },
    { year : 2005, dsr :  5.9 },
    { year : 2006, dsr : 10.1 },
    { year : 2007, dsr :  4.7 },
    { year : 2008, dsr :  4.8 },
    { year : 2009, dsr :  4.4 },
    { year : 2010, dsr :  5.8 },
    { year : 2011, dsr :  4.4 },
    { year : 2012, dsr :  6.0 },
    { year : 2013, dsr :  5.9 },
    { year : 2014, dsr :  5.9 },
    { year : 2015, dsr :  7.6 },
    { year : 2016, dsr :  8.8 },
    { year : 2017, dsr :  8.3 },
    { year : 2018, dsr :  7.5 },
    { year : 2019, dsr :  6.4 },
    { year : 2020, dsr :  6.5 },
    { year : 2021, dsr :  8.2 },
    { year : 2022, dsr :  5.2 },
    { year : 2023, dsr :  5.3 },
    { year : 2024, dsr :  6.7 },
    { year : 2025, dsr :  6.6 },
];

// Build year-keyed lookups from the processor-derived series.
const extMap = new Map(EXT_DEBT_TO_GDP.map((r) => [r.year, r.value]));
const ggMap  = new Map(GG_DEBT_TO_GDP.map((r) => [r.year, r.value]));

// DEBT_SERIES zips dsr (hand) with externalDebtToGdp + ggDebtToGdp (processor-derived).
// ggDebtToGdp values come from the RBI DBIE combined-liabilities series (LT4) and
// will differ from the old IMF WEO approximations.
export const DEBT_SERIES : DebtDatum[] = DSR_HAND.map(({ year, dsr }) => ({
    year,
    dsr,
    externalDebtToGdp : extMap.get(year) ?? 0,
    ggDebtToGdp       : ggMap.get(year)  ?? 0,
}));

// Narrative beats keyed to years on the DSR line. `body` text is editorial; the
// numeric anchors (dsr) come from DEBT_SERIES above.
export interface DebtEvent {
    year  : number;
    title : string;
    body  : string;
}

export const DEBT_EVENTS : DebtEvent[] = [
    {
        year  : 1991,
        title : "The crisis",
        body  : "Foreign reserves down to roughly three weeks of imports. India pledges 67 tonnes of gold to raise emergency funds and secures an IMF bailout. The external debt service ratio peaks at 35.3%.",
    },
    {
        year  : 1992,
        title : "Liberalization begins",
        body  : "The rupee is devalued ~20%, the License Raj is dismantled, trade and FDI open up. The bleeding stops and the growth engine resets.",
    },
    {
        year  : 1996,
        title : "Export and reserve buildup",
        body  : "As exports turn competitive and capital flows in, forex earnings rise, so servicing external debt eats a steadily smaller share of revenue.",
    },
    {
        year  : 1998,
        title : "Pokhran sanctions shock",
        body  : "Nuclear tests trigger sanctions. India raises forex through Resurgent India Bonds (NRI deposits)—a reminder of lingering external dependence.",
    },
    {
        year  : 2006,
        title : "The IMD blip",
        body  : "The one spike in the descent: the ratio jumps to ~10% as India redeems the India Millennium Deposits raised after the 1998 sanctions—a scheduled, one-off repayment, not fresh stress.",
    },
    {
        year  : 2007,
        title : "The golden run",
        body  : "High GDP growth—often 8%+—surging reserves, and a stabilising rupee. External vulnerability essentially dissolves; the DSR bottoms out at 4–5%.",
    },
    {
        year  : 2008,
        title : "Global financial crisis",
        body  : "India weathers it relatively well thanks to those reserves, but fiscal stimulus pushes domestic borrowing up—the inward pivot accelerates.",
    },
    {
        year  : 2016,
        title : "Demonetisation and GST groundwork",
        body  : "Disruptive to revenue collection short-term; GST (2017) reshapes the tax base over time. The external ratio stays low.",
    },
    {
        year  : 2020,
        title : "Pandemic spike",
        body  : "Massive borrowing funds relief; combined government liabilities jump to ~89% of GDP by March 2021, their highest ever. The constraint is now internal.",
    },
    {
        year  : 2023,
        title : "External strength, internal pressure",
        body  : "The external debt service ratio sits near 5–7%—a near-total reversal from 1991. But interest still absorbs roughly a third of the union government's revenue receipts; the pressure now lives at home.",
    },
    {
        year  : 2025,
        title : "Consolidation attempts",
        body  : "Government targets fiscal-deficit reduction; combined liabilities ease into the low 80s, but interest remains the union budget's largest single head of spending.",
    },
];
