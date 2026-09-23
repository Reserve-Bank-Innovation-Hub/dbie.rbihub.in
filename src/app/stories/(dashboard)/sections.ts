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
