// The sections of the Stories page, in the order it lists them: each names the stories under it. The page draws
// them and the crumbs on the stories lead back to them (src/components/Crumbs/PageCrumbs.tsx).

// LIB =================================================================================================================
import type { ListSection } from "@/app/handbook/sections";

export const STORY_SECTIONS : ListSection[] = [
    {
        title : "Bank credit",
        items : [
            {
                linkTo      : "/stories/the-lights-came-on",
                label       : "The lights came on",
                description : "Individuals overtook companies as banks' biggest borrowers — and a third of the borrowers added since 2015 are women.",
            },
            {
                linkTo      : "/stories/the-two-lakh-line",
                label       : "The ₹2 lakh line",
                description : "Nearly two in every three bank loans have a limit of ₹2 lakh or less. They hold ₹6 of every ₹100 banks have lent, carry the highest rates in the banks’ books, and there are about 4 crore fewer of them at banks than at the end of 2024.",
            },
        ],
    },
    {
        title : "Prices",
        items : [
            {
                linkTo      : "/stories/what-got-cheaper",
                label       : "What got cheaper",
                description : "Of the 697 goods in India’s wholesale price index, 33 cost less in 2025-26 than in 2011-12 and 103 cost at least twice as much. Solar power systems fell by more than half, and jasmine costs six times what it did.",
            },
        ],
    },
    {
        title : "Money and payments",
        items : [
            {
                linkTo      : "/stories/what-one-lakh-bought",
                label       : "What ₹1 lakh bought",
                description : "One sum, carried from 2001 to 2026: what it bought each year in gold, silver, a mason’s days, dollars and wheat, and what it is worth today.",
            },
        ],
    },
    {
        title : "External debt",
        items : [
            {
                linkTo      : "/stories/debt-to-service-ratio",
                label       : "The long walk back from 1991",
                description : "India went from spending a third of its export earnings on debt service in 1991 to just 6% today.",
            },
            {
                linkTo      : "/stories/concessional-share-of-total-debt-vs-commercial-borrowings",
                label       : "From aid recipient to market borrower",
                description : "India's external debt shifted from aid-style concessional loans to market-rate commercial borrowing.",
            },
        ],
    },
];
