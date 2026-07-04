// India's external debt — end-March, ₹ crore basis.
// Source: External Debt Management Unit, Ministry of Finance & Reserve Bank of India
// ("India's External Debt - Rupees (end-March)", cols BK and AP).
//
// concessionalShare   — Concessional Debt as % of Total Debt   [col BK]
// commercialBorrowing — V. Commercial Borrowing, ₹ crore       [col AP]
//
// The two together tell the "graduation" story: in 1991 nearly half of India's
// external debt was concessional (soft-term, aid-style) money; by 2025 it is
// under 7%, while market-rate commercial borrowing has become the single largest
// component. NB: concessionalShare is a share of TOTAL (long+short) debt, while
// commercialBorrowing is an absolute long-term component — different bases.

export interface DebtMixDatum {
    year                : number;
    concessionalShare   : number;   // %
    commercialBorrowing : number;   // ₹ crore
}

export const DEBT_MIX_SERIES : DebtMixDatum[] = [
    { year : 1991, concessionalShare : 45.9, commercialBorrowing : 19727 },
    { year : 1992, concessionalShare : 44.8, commercialBorrowing : 35711 },
    { year : 1993, concessionalShare : 44.5, commercialBorrowing : 36367 },
    { year : 1994, concessionalShare : 44.4, commercialBorrowing : 38782 },
    { year : 1995, concessionalShare : 45.3, commercialBorrowing : 40915 },
    { year : 1996, concessionalShare : 44.7, commercialBorrowing : 47642 },
    { year : 1997, concessionalShare : 42.2, commercialBorrowing : 51454 },
    { year : 1998, concessionalShare : 39.5, commercialBorrowing : 67086 },
    { year : 1999, concessionalShare : 38.5, commercialBorrowing : 89019 },
    { year : 2000, concessionalShare : 38.9, commercialBorrowing : 86963 },
    { year : 2001, concessionalShare : 35.4, commercialBorrowing : 113839 },
    { year : 2002, concessionalShare : 35.9, commercialBorrowing : 113908 },
    { year : 2003, concessionalShare : 36.8, commercialBorrowing : 106843 },
    { year : 2004, concessionalShare : 35.8, commercialBorrowing : 95611 },
    { year : 2005, concessionalShare : 30.7, commercialBorrowing : 115533 },
    { year : 2006, concessionalShare : 28.4, commercialBorrowing : 117991 },
    { year : 2007, concessionalShare : 23.0, commercialBorrowing : 180669 },
    { year : 2008, concessionalShare : 19.7, commercialBorrowing : 249243 },
    { year : 2009, concessionalShare : 18.7, commercialBorrowing : 318209 },
    { year : 2010, concessionalShare : 16.8, commercialBorrowing : 319221 },
    { year : 2011, concessionalShare : 14.9, commercialBorrowing : 448448 },
    { year : 2012, concessionalShare : 13.3, commercialBorrowing : 614623 },
    { year : 2013, concessionalShare : 11.1, commercialBorrowing : 762128 },
    { year : 2014, concessionalShare : 10.4, commercialBorrowing : 897744 },
    { year : 2015, concessionalShare :  8.8, commercialBorrowing : 1128501 },
    { year : 2016, concessionalShare :  9.0, commercialBorrowing : 1197176 },
    { year : 2017, concessionalShare :  9.4, commercialBorrowing : 1115514 },
    { year : 2018, concessionalShare :  9.1, commercialBorrowing : 1312723 },
    { year : 2019, concessionalShare :  8.7, commercialBorrowing : 1423574 },
    { year : 2020, concessionalShare :  8.8, commercialBorrowing : 1653677 },
    { year : 2021, concessionalShare :  9.0, commercialBorrowing : 1590938 },
    { year : 2022, concessionalShare :  8.3, commercialBorrowing : 1710032 },
    { year : 2023, concessionalShare :  8.2, commercialBorrowing : 1817207 },
    { year : 2024, concessionalShare :  7.4, commercialBorrowing : 2088095 },
    { year : 2025, concessionalShare :  6.9, commercialBorrowing : 2495778 },
];

// Narrative beats keyed to years. PLACEHOLDER copy — to be replaced with the
// real story content.
export interface DebtMixEvent {
    year  : number;
    title : string;
    body  : string;
}

export const DEBT_MIX_EVENTS : DebtMixEvent[] = [
    {
        year  : 1991,
        title : "Borrowing as an aid recipient",
        body  : "Nearly half of India's external debt — 45.9% — is concessional: below-market, long-tenor, aid-style money from bodies like IDA and friendly governments. That is largely what a low-income, forex-starved economy can access.",
    },
    {
        year  : 2007,
        title : "The mix begins to flip",
        body  : "As the economy opens and corporates raise money abroad, the concessional share falls below a quarter while commercial borrowing climbs.",
    },
    {
        year  : 2014,
        title : "Commercial borrowing leads",
        body  : "External commercial borrowings — ECBs, bonds, syndicated loans — become the single largest component of external debt.",
    },
    {
        year  : 2025,
        title : "Borrowing on market terms",
        body  : "Concessional debt is under 7%; commercial borrowing stands at ₹24.96 lakh crore. India now borrows as a country markets will lend to on ordinary terms — a graduation marker more than a risk signal.",
    },
];
