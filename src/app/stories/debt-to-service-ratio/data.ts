// India's external debt — end-March, ₹ crore basis.
// Source: External Debt Management Unit, Ministry of Finance & Reserve Bank of India
// ("India's External Debt - Rupees (end-March)", cols BN and BM).
//
// dsr               — External Debt Service Ratio (%)        [col BN]
// externalDebtToGdp — External Debt as % of GDP              [col BM]
//
// NB: externalDebtToGdp is EXTERNAL debt only (peaks ~38.7% in 1992). It is NOT
// the general-government debt-to-GDP referenced in the narrative.
//
// ggDebtToGdp — General-government gross debt as % of GDP. This is a SEPARATE,
// domestic fiscal series, NOT from the RBI external-debt file. Real figures from
// IMF WEO / RBI fiscal data, rounded to the nearest point. Charts the "internal"
// story: a fall to lows around 2007-08, the ~88% pandemic peak in 2020, and an
// easing to the low-80s since.

export interface DebtDatum {
    year              : number;
    dsr               : number;
    externalDebtToGdp : number;
    ggDebtToGdp       : number;
}

export const DEBT_SERIES : DebtDatum[] = [
    { year : 1991, dsr : 35.3, externalDebtToGdp : 28.7, ggDebtToGdp : 75.3 },
    { year : 1992, dsr : 30.2, externalDebtToGdp : 38.7, ggDebtToGdp : 77.0 },
    { year : 1993, dsr : 27.5, externalDebtToGdp : 37.5, ggDebtToGdp : 77.0 },
    { year : 1994, dsr : 25.4, externalDebtToGdp : 33.8, ggDebtToGdp : 73.5 },
    { year : 1995, dsr : 25.9, externalDebtToGdp : 30.8, ggDebtToGdp : 69.0 },
    { year : 1996, dsr : 26.2, externalDebtToGdp : 27.0, ggDebtToGdp : 66.0 },
    { year : 1997, dsr : 23.0, externalDebtToGdp : 24.6, ggDebtToGdp : 67.0 },
    { year : 1998, dsr : 19.5, externalDebtToGdp : 24.3, ggDebtToGdp : 68.0 },
    { year : 1999, dsr : 18.7, externalDebtToGdp : 23.6, ggDebtToGdp : 70.0 },
    { year : 2000, dsr : 17.1, externalDebtToGdp : 22.0, ggDebtToGdp : 73.0 },
    { year : 2001, dsr : 16.6, externalDebtToGdp : 22.1, ggDebtToGdp : 78.0 },
    { year : 2002, dsr : 13.7, externalDebtToGdp : 20.8, ggDebtToGdp : 82.0 },
    { year : 2003, dsr : 16.0, externalDebtToGdp : 20.0, ggDebtToGdp : 84.0 },
    { year : 2004, dsr : 16.1, externalDebtToGdp : 17.7, ggDebtToGdp : 83.0 },
    { year : 2005, dsr :  5.9, externalDebtToGdp : 18.4, ggDebtToGdp : 81.0 },
    { year : 2006, dsr : 10.1, externalDebtToGdp : 17.1, ggDebtToGdp : 77.0 },
    { year : 2007, dsr :  4.7, externalDebtToGdp : 17.7, ggDebtToGdp : 74.0 },
    { year : 2008, dsr :  4.8, externalDebtToGdp : 18.3, ggDebtToGdp : 72.5 },
    { year : 2009, dsr :  4.4, externalDebtToGdp : 20.7, ggDebtToGdp : 71.5 },
    { year : 2010, dsr :  5.8, externalDebtToGdp : 18.5, ggDebtToGdp : 66.5 },
    { year : 2011, dsr :  4.4, externalDebtToGdp : 18.6, ggDebtToGdp : 68.5 },
    { year : 2012, dsr :  6.0, externalDebtToGdp : 21.1, ggDebtToGdp : 68.5 },
    { year : 2013, dsr :  5.9, externalDebtToGdp : 22.4, ggDebtToGdp : 68.0 },
    { year : 2014, dsr :  5.9, externalDebtToGdp : 23.9, ggDebtToGdp : 67.0 },
    { year : 2015, dsr :  7.6, externalDebtToGdp : 23.8, ggDebtToGdp : 69.0 },
    { year : 2016, dsr :  8.8, externalDebtToGdp : 23.4, ggDebtToGdp : 68.5 },
    { year : 2017, dsr :  8.3, externalDebtToGdp : 19.8, ggDebtToGdp : 69.5 },
    { year : 2018, dsr :  7.5, externalDebtToGdp : 20.1, ggDebtToGdp : 70.0 },
    { year : 2019, dsr :  6.4, externalDebtToGdp : 19.9, ggDebtToGdp : 75.0 },
    { year : 2020, dsr :  6.5, externalDebtToGdp : 20.9, ggDebtToGdp : 88.0 },
    { year : 2021, dsr :  8.2, externalDebtToGdp : 21.1, ggDebtToGdp : 84.0 },
    { year : 2022, dsr :  5.2, externalDebtToGdp : 19.9, ggDebtToGdp : 81.0 },
    { year : 2023, dsr :  5.3, externalDebtToGdp : 19.1, ggDebtToGdp : 82.0 },
    { year : 2024, dsr :  6.7, externalDebtToGdp : 18.5, ggDebtToGdp : 83.0 },
    { year : 2025, dsr :  6.6, externalDebtToGdp : 19.1, ggDebtToGdp : 82.0 },
];

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
        body  : "Massive borrowing funds relief; general-government debt-to-GDP jumps to ~88%, its highest ever, and interest payments balloon toward a third of revenue. The constraint is now internal.",
    },
    {
        year  : 2023,
        title : "External strength, internal pressure",
        body  : "The external debt service ratio sits near 5–7%—a near-total reversal from 1991. But domestic interest costs stay elevated, locking in the slow-suffocation dynamic.",
    },
    {
        year  : 2025,
        title : "Consolidation attempts",
        body  : "Government targets fiscal-deficit reduction; debt-to-GDP eases slightly, but interest payments remain the single largest revenue commitment.",
    },
];
