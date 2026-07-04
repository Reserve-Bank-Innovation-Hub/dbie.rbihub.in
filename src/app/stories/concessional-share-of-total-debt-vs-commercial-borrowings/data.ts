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

// DEBT_MIX_SERIES is derived from the committed workbook by the processor; the hand-typed
// values below are superseded. See data/processors/story-external-debt.mjs.
export { DEBT_MIX_SERIES } from './data.gen';

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
