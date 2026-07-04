// DATA ================================================================================================================
// All series extracted from RBI, Basic Statistical Returns of SCBs, Table 3.2 — organisation-wise classification of
// outstanding credit according to occupation (quarterly, March 2014 – March 2026). Pre-computed; nothing is parsed
// client-side. The workbook is mirrored at /public/data/rbi-bsr-table-3-2-occupation-credit.xlsx for download.

// March-end points, "Individuals" columns.
// acc/accM/accF — number of borrower accounts; out/outM/outF — amount outstanding, ₹ crore;
// faV — women's share (%) of individuals' agricultural credit, by value.
export interface YearPoint {
    y    : number;
    acc  : number;
    accM : number;
    accF : number;
    out  : number;
    outM : number;
    outF : number;
    faV  : number;
}

export const YEARS : YearPoint[] = [
    { y : 2014, acc : 111657773, accM : 87697927,  accF : 23959846,  out : 1950559, outM : 1566032, outF : 384528,  faV : 19.42 },
    { y : 2015, acc : 115682833, accM : 90061893,  accF : 25620940,  out : 2064295, outM : 1687518, outF : 376777,  faV : 20.34 },
    { y : 2016, acc : 130322543, accM : 96422843,  accF : 33899700,  out : 2372467, outM : 1927670, outF : 444797,  faV : 19.74 },
    { y : 2017, acc : 137872719, accM : 100664529, accF : 37208190,  out : 2684369, outM : 2159808, outF : 524561,  faV : 20.06 },
    { y : 2018, acc : 156005668, accM : 110216446, accF : 45789222,  out : 3121656, outM : 2479508, outF : 642148,  faV : 21.55 },
    { y : 2019, acc : 183766238, accM : 128341243, accF : 55424995,  out : 3591075, outM : 2831820, outF : 759254,  faV : 23.25 },
    { y : 2020, acc : 221554464, accM : 143171703, accF : 78382761,  out : 4101790, outM : 3194483, outF : 907307,  faV : 26.00 },
    { y : 2021, acc : 242663070, accM : 156006415, accF : 86656655,  out : 4534414, outM : 3507266, outF : 1027148, faV : 27.24 },
    { y : 2022, acc : 265995757, accM : 174717562, accF : 91278195,  out : 5190409, outM : 4020241, outF : 1170168, faV : 28.27 },
    { y : 2023, acc : 302265662, accM : 200429210, accF : 101836452, out : 6131334, outM : 4726524, outF : 1404810, faV : 29.89 },
    { y : 2024, acc : 340731430, accM : 224668673, accF : 116062757, out : 7603954, outM : 5826136, outF : 1777818, faV : 31.94 },
    { y : 2025, acc : 349760575, accM : 238049302, accF : 111711273, out : 8524568, outM : 6513672, outF : 2010896, faV : 31.66 },
    { y : 2026, acc : 346199972, accM : 243249878, accF : 102950094, out : 9727720, outM : 7347137, outF : 2380583, faV : 33.02 },
];

export const YEAR_2015 = 1;   // index into YEARS
export const YEAR_2026 = 12;

// Quarterly shares (%) of total outstanding bank credit, all organisations.
// pc — private corporate sector; hi — household sector: individuals; rest = 100 − pc − hi
// (public sector, co-operatives, household-others, MFIs, NPISH, non-residents).
export interface QuarterPoint {
    d  : string;
    pc : number;
    hi : number;
}

export const QUARTERS : QuarterPoint[] = [
    { d : "Mar 2014", pc : 38.52, hi : 31.86 },
    { d : "Dec 2014", pc : 40.25, hi : 31.03 },
    { d : "Mar 2015", pc : 40.02, hi : 30.82 },
    { d : "Jun 2015", pc : 40.08, hi : 31.56 },
    { d : "Sep 2015", pc : 39.84, hi : 32.19 },
    { d : "Dec 2015", pc : 39.54, hi : 32.43 },
    { d : "Mar 2016", pc : 40.13, hi : 32.43 },
    { d : "Jun 2016", pc : 36.69, hi : 34.19 },
    { d : "Sep 2016", pc : 36.68, hi : 34.68 },
    { d : "Dec 2016", pc : 36.75, hi : 34.64 },
    { d : "Mar 2017", pc : 35.62, hi : 34.92 },
    { d : "Jun 2017", pc : 34.60, hi : 36.44 },
    { d : "Sep 2017", pc : 34.30, hi : 37.07 },
    { d : "Dec 2017", pc : 33.94, hi : 37.08 },
    { d : "Mar 2018", pc : 33.73, hi : 36.67 },
    { d : "Jun 2018", pc : 35.25, hi : 37.07 },
    { d : "Sep 2018", pc : 35.00, hi : 36.95 },
    { d : "Dec 2018", pc : 34.52, hi : 37.33 },
    { d : "Mar 2019", pc : 33.31, hi : 37.36 },
    { d : "Jun 2019", pc : 32.92, hi : 38.65 },
    { d : "Sep 2019", pc : 32.69, hi : 39.40 },
    { d : "Dec 2019", pc : 31.40, hi : 40.30 },
    { d : "Mar 2020", pc : 30.65, hi : 40.14 },
    { d : "Jun 2020", pc : 29.86, hi : 40.33 },
    { d : "Sep 2020", pc : 29.11, hi : 41.06 },
    { d : "Dec 2020", pc : 28.55, hi : 41.51 },
    { d : "Mar 2021", pc : 28.28, hi : 42.23 },
    { d : "Jun 2021", pc : 27.65, hi : 43.28 },
    { d : "Sep 2021", pc : 27.10, hi : 43.82 },
    { d : "Dec 2021", pc : 26.72, hi : 43.81 },
    { d : "Mar 2022", pc : 26.81, hi : 43.67 },
    { d : "Jun 2022", pc : 26.60, hi : 44.10 },
    { d : "Sep 2022", pc : 26.34, hi : 44.39 },
    { d : "Dec 2022", pc : 25.75, hi : 44.66 },
    { d : "Mar 2023", pc : 25.92, hi : 44.50 },
    { d : "Jun 2023", pc : 25.66, hi : 44.74 },
    { d : "Sep 2023", pc : 25.26, hi : 46.43 },
    { d : "Dec 2023", pc : 25.77, hi : 46.24 },
    { d : "Mar 2024", pc : 26.03, hi : 46.27 },
    { d : "Jun 2024", pc : 26.36, hi : 46.51 },
    { d : "Sep 2024", pc : 26.12, hi : 46.57 },
    { d : "Dec 2024", pc : 26.43, hi : 46.53 },
    { d : "Mar 2025", pc : 26.22, hi : 46.71 },
    { d : "Jun 2025", pc : 25.90, hi : 47.23 },
    { d : "Sep 2025", pc : 25.73, hi : 47.25 },
    { d : "Dec 2025", pc : 25.81, hi : 46.83 },
    { d : "Mar 2026", pc : 26.54, hi : 46.69 },
];

export const Q_MAR_2015 = 2;   // index into QUARTERS
export const Q_LAST     = QUARTERS.length - 1;

// Dot model for Act II. Field = India's credit-eligible adults ≈ 1,036 million (TransUnion CIBIL,
// World Bank–based, December 2024; population aged 18–80). 1 dot = 1 crore. The field does not grow
// between 2015 and 2026 — what changes is how many dots light up.
export const FIELD_DOTS  = 104;
export const CR_PER_DOT  = 1;

export const litDots = (i : number) => Math.round(YEARS[i].acc  / 1e7);   // borrower accounts, crore
export const femDots = (i : number) => Math.round(YEARS[i].accF / 1e7);

// Act IV chart 9 — composition of the WHOLE bank book (% of total outstanding credit), March years.
// pl — personal loans to individuals; oi — other loans to individuals; pc — private corporates;
// rest — everyone else. pl + oi = the individuals' share from Acts I and III.
export interface BookMixPoint {
    y    : number;
    pl   : number;
    oi   : number;
    pc   : number;
    rest : number;
}

export const BOOK_MIX : BookMixPoint[] = [
    { y : 2015, pl : 16.5, oi : 14.3, pc : 40.0, rest : 29.2 },
    { y : 2016, pl : 17.8, oi : 14.6, pc : 40.1, rest : 27.4 },
    { y : 2017, pl : 19.8, oi : 15.2, pc : 35.6, rest : 29.5 },
    { y : 2018, pl : 21.4, oi : 15.3, pc : 33.7, rest : 29.6 },
    { y : 2019, pl : 21.7, oi : 15.7, pc : 33.3, rest : 29.3 },
    { y : 2020, pl : 24.2, oi : 15.9, pc : 30.6, rest : 29.2 },
    { y : 2021, pl : 26.2, oi : 16.0, pc : 28.3, rest : 29.5 },
    { y : 2022, pl : 27.6, oi : 16.1, pc : 26.8, rest : 29.5 },
    { y : 2023, pl : 28.5, oi : 16.0, pc : 25.9, rest : 29.6 },
    { y : 2024, pl : 30.7, oi : 15.5, pc : 26.0, rest : 27.7 },
    { y : 2025, pl : 31.3, oi : 15.4, pc : 26.2, rest : 27.1 },
    { y : 2026, pl : 30.9, oi : 15.7, pc : 26.5, rest : 26.8 },
];

export interface SlopeRow {
    name  : string;
    y2015 : number;
    y2026 : number;
}

// Act IV chart 11 — women's share (%) of each occupation's individual credit, by value.
export const WOMEN_BY_SECTOR : SlopeRow[] = [
    { name : "Agriculture",           y2015 : 20.3, y2026 : 33.0 },
    { name : "Trade",                 y2015 : 12.6, y2026 : 26.7 },
    { name : "Personal loans",        y2015 : 18.0, y2026 : 23.0 },
    { name : "Industry",              y2015 : 14.8, y2026 : 19.8 },
    { name : "All others",            y2015 : 17.0, y2026 : 19.5 },
    { name : "Professional services", y2015 : 17.4, y2026 : 18.9 },
    { name : "Transport",             y2015 : 10.5, y2026 : 11.8 },
    { name : "Finance",               y2015 : 36.8, y2026 : 3.3 },
];

export const WOMEN_OVERALL_2026 = 24.5;   // women's share of all individuals' credit, by value
export const WOMEN_OVERALL_2015 = 18.3;

// Largest-remainder rounding so column counts always sum to the dot total.
export const largestRemainder = (weights : number[], total : number) : number[] => {
    const raw = weights.map((w) => (w / 100) * total);
    const out = raw.map(Math.floor);
    let left = total - out.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [ v - out[i], i ] as const)
       .sort((a, b) => b[0] - a[0])
       .slice(0, left)
       .forEach(([ , i ]) => out[i]++);
    return out;
};
