// The sections of the Stories page, in the order it lists them: each names the stories under it. The page draws
// them and the crumbs on the stories lead back to them (src/components/Crumbs/PageCrumbs.tsx).

// LIB =================================================================================================================
import type { ListSection } from "@/app/handbook/sections";

export const STORY_SECTIONS : ListSection[] = [
    {
        title : "Agriculture",
        items : [
            {
                linkTo      : "/stories/the-women-who-stayed",
                label       : "The women who stayed",
                description : "Since 2000-01, rural men have been leaving farm work for building sites, factories and shops. Most rural women who work are still in agriculture.",
            },
        ],
    },
    {
        title : "The rupee and the world",
        items : [
            {
                linkTo      : "/stories/rupee-and-world",
                label       : "How do you measure a rupee?",
                description : "A dollar costs more than twice as many rupees as in 2004, yet Indian goods cost buyers abroad about what they did then. Three ways to measure the rupee, and the question each one answers.",
            },
            {
                linkTo      : "/stories/the-10-gram-question",
                label       : "The 10-gram question",
                description : "Ten grams of gold cost about 42 times as many rupees as in 1990. How much of that is gold getting dearer in dollars, how much the rupee getting cheaper, and how much the gap between the world price and Mumbai’s.",
            },
        ],
    },
    {
        title : "Bank credit",
        items : [
            {
                linkTo      : "/stories/the-lights-came-on",
                label       : "How households took over the bank loan book",
                description : "Individuals owe ₹47 of every ₹100 banks have lent, up from ₹31 in 2015, and private companies ₹27, down from ₹40. Individuals’ loan accounts tripled while the average loan, after prices, did not grow.",
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
                label       : "What ₹1 lakh could buy",
                description : "One sum, carried from 2001 to 2026: what it bought each year in gold, silver, a mason’s days, dollars and wheat, and what it is worth today.",
            },
            {
                linkTo      : "/stories/the-phone-pays-the-cash-stays",
                label       : "The phone pays, but the cash stays",
                description : "UPI payments grew 19.4 times between November 2019 and July 2026. Over the ten years to March 2026, currency in circulation grew 2.5 times.",
            },
            {
                linkTo      : "/stories/money-in-money-out",
                label       : "Money in, money out",
                description : "Indians abroad sent home $135.4 billion in 2024-25 and keep $165.7 billion in Indian banks; in 2023-24 they sent 1.67 times what foreign companies invested. Indians at home sent $29.6 billion abroad, more than half of it for travel.",
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
