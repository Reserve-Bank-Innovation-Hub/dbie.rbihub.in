"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode } from "react";

// UI ==================================================================================================================
import { Article, Div, Divider, Heading1, Heading4, Portion, Row, Section, Text } from "fictoan-react";
import { Download, Table2 } from "lucide-react";
import { MotionConfig } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { Figure } from "./chartKit";
import { NoteArt, NoteGrid } from "./NoteGrid";
import { Kind, Showcase } from "./Showcase";
import { Receipts } from "./Receipts";
import { Shelves } from "./Shelves";
import { RanAhead } from "./RanAhead";
import { OwnBill } from "./OwnBill";
import { Pinned } from "./Pinned";

// DATA ================================================================================================================
import {
    FACTORS, FIRST, FROM_YEAR, HEADLINE, LENS, MASON_LAST, NOW, SPAN, SUM, TO_YEAR, WHEAT_LAST, YEARS,
    grams, inr, kg, lakh, monthName, partYear, pieceOf, rs, times, timesWords,
} from "./data";

// STYLES ==============================================================================================================
import "./what-one-lakh-bought.css";

// THE WORDS ===========================================================================================================
// The sentences are template strings over the derived figures, so a refresh of the data rewrites them; prose() folds
// the line breaks of the source into single spaces.
const prose = (s : string) => s.replace(/\s*\n\s*/g, " ").trim();
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);
// A figure in a sentence is written [[like this]] and set as a highlight, so the numbers carry the story without a
// card repeating them.
const rich = (s : string) => prose(s).split(/\[\[(.+?)\]\]/).map((part, i) => i % 2 ? <strong key={i} className="fig">{part}</strong> : part);

const GOLD_2026_SPAN = partYear(NOW.year, NOW.gold.months);                 // "January to May 2026"

// The piece the showcase draws for a weight, from the name pieceOf gives it.
const kindOf = (name : string) : Kind => name.includes("bridal") ? "bridal" : name.includes("necklace") ? "necklace" : name.includes("bangles") ? "bangles" : name.includes("chain") ? "chain" : name.includes("earrings") ? "earrings" : "ring";
const INDEX_SPAN     = partYear(NOW.year, NOW.index.months);
const MASON_SPAN     = partYear(MASON_LAST.year, MASON_LAST.mason.months);
const USD_SPAN       = NOW.usd.days ? `the first ${NOW.usd.days} trading days of ${NOW.year}` : `${NOW.year}`;

// THE CHAPTERS ========================================================================================================
const Chapter = ({ id, kicker, title, children } : { id : string; kicker : string; title : string; children : ReactNode }) => (
    <Div className="chapter-text r1">
        <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>
        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{title}</Heading4>
        {children}
    </Div>
);
const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{rich(children)}</Text>;

// THE YEAR TABLE ======================================================================================================
const YEAR_TABLE = {
    head    : [ "Year", "Gold", "Silver", "A mason’s days", "US dollars", "Wheat at MSP", `Worth in ${TO_YEAR}` ],
    numeric : [ false, true, true, true, true, true, true ],
    rows    : YEARS.map(y => [
        y.year, grams(y.gold.grams), kg(y.silver.kg), y.mason ? inr(y.mason.days) : "–", `$${inr(y.usd.dollars)}`,
        y.wheat ? `${y.wheat.quintals.toFixed(1)} q` : "–", rs(y.worthNow),
    ]),
};

// The kicker over the gallery once the table has turned: the first beat's is the heirloom's own.
const TURN_KICKER = <Text className="kicker" weight="600" id="ten-years-on">TEN YEARS ON, AND ON</Text>;

// THE PAGE ============================================================================================================
export const WhatOneLakhBoughtPage = ({ note } : { note : NoteArt }) => (
    <MotionConfig reducedMotion="user">
        <Article id="what-one-lakh-bought-page">
            {/* 1 THE NOTE ============================================================================================ */}
            {/* The notes run from the page's top edge; the crumbs and the title sit on them, the title on a panel of
                paper that leaves as the grid pulls back. */}
            <NoteGrid note={note} corner={<PageCrumbs />}>
                <Heading1 className="hero-title" marginBottom="micro">
                    What <span className="accent">₹1 lakh</span> bought
                </Heading1>
                <Text className="hero-sub figs-bold" fontStyle="serif" size="large" marginBottom="micro">
                    {rich(`Your parents’ [[₹1 lakh]] and yours are not the same money.`)}
                </Text>
                <Text className="hero-sub figs-bold" fontStyle="serif" size="large">
                    {rich(`This story takes one sum through [[${SPAN} years]] and shows what it bought each year in gold,
                        silver, a mason’s days, dollars and wheat, and what it is worth today.`)}
                </Text>
            </NoteGrid>

            {/* 2 THE HEIRLOOM, AND THE YEARS AFTER ================================================================== */}
            <Showcase label={`A gallery under spotlights with four display units on a turntable: what ₹1 lakh bought in gold in ${LENS.map(y => y.year).join(", ")}`} pieces={LENS.map(y => ({
                year  : y.year,
                grams : grams(y.gold.grams),
                piece : cap(pieceOf(y.gold.grams)),
                note  : `${rs(y.gold.price)} per 10 g${y.gold.months < 12 ? `, ${partYear(y.year, y.gold.months)}` : ""}`,
                kind  : kindOf(pieceOf(y.gold.grams)),
            }))} kicker={<Text className="kicker" weight="600" id="the-heirloom">THE HEIRLOOM</Text>} beats={[
                { body : (
                    <Div className="chapter-text">
                        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{rich(`In [[${FROM_YEAR}]], ₹1 lakh bought [[${grams(FIRST.gold.grams)}]] of gold`)}</Heading4>
                        <Para>{`Say your family had ₹1 lakh for a wedding in [[${FROM_YEAR}]]. Gold in Mumbai averaged [[${rs(FIRST.gold.price)}]]
                            for 10 grams that year, so the sum bought [[${grams(FIRST.gold.grams)}]]: ${pieceOf(FIRST.gold.grams)}, by weight.`}</Para>
                        <Para last>{`That is the bullion price the Reserve Bank publishes, before a jeweller’s making charges and
                            tax. The weight is the claim; the necklace is a way to picture it.`}</Para>
                    </Div>
                ) },
                { kicker : TURN_KICKER, body : <Para last>{`Turn the case and the years go by. In [[${LENS[1].year}]], [[${grams(LENS[1].gold.grams)}]], ${pieceOf(LENS[1].gold.grams)}.`}</Para> },
                { kicker : TURN_KICKER, body : <Para last>{`In [[${LENS[2].year}]], one could buy a chain with a pendant for [[${grams(LENS[2].gold.grams)}]].`}</Para> },
                { kicker : TURN_KICKER, body : (
                    <Div className="chapter-text">
                        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{rich(`By [[${TO_YEAR}]] the same ₹1 lakh bought [[${grams(NOW.gold.grams)}]]`)}</Heading4>
                        <Para last>{`[[${TO_YEAR}]] is a part year, ${GOLD_2026_SPAN} so far. Gold reached its highest month in that
                            span, and the year’s figure will move as each new month comes in.`}</Para>
                    </Div>
                ) },
            ]} />

            {/* 4 THE MONEY SHRANK TOO ================================================================================ */}
            <Pinned steps={3}>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="the-money-shrank" kicker="THE MONEY SHRANK TOO" title={`₹1 lakh of ${FROM_YEAR} is ${lakh(HEADLINE.worthNow)} in ${TO_YEAR} prices`}>
                            <Para>{`Prices in general rose too. By the consumer price index for industrial workers, the long series the
                                Labour Bureau keeps, what cost [[₹100]] in [[${FROM_YEAR}]] cost [[${rs(Math.round(HEADLINE.priceRise * 100))}]] in [[${TO_YEAR}]].
                                So ₹1 lakh of [[${FROM_YEAR}]] is [[${lakh(HEADLINE.worthNow)}]] of today’s money.`}</Para>
                            <Para last>{`Bring that back to gold and the necklace still does not come back. The [[${grams(FIRST.gold.grams)}]] of
                                [[${FROM_YEAR}]] cost [[${lakh(HEADLINE.necklaceNow)}]] at [[${TO_YEAR}]]’s price, [[${timesWords(HEADLINE.ranAhead.gold)}]] what the
                                general rise in prices would explain.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Receipts indexSpan={INDEX_SPAN} />
                    </Portion>
                </Row>
            </Pinned>

            {/* 5 THE OTHER SHELVES =================================================================================== */}
            <Pinned steps={6}>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="the-other-shelves" kicker="THE OTHER SHELVES" title="Silver, a mason’s days, dollars and wheat each shrank at their own pace">
                            <Para>{`The same ₹1 lakh bought [[${kg(FIRST.silver.kg)}]] of silver in [[${FROM_YEAR}]] and [[${kg(NOW.silver.kg)}]] in [[${TO_YEAR}]].
                                It paid a rural mason for [[${inr(FIRST.mason!.days)}]] days of work in [[${FROM_YEAR}]] and [[${inr(MASON_LAST.mason.days)}]] days
                                in [[${MASON_LAST.year}]], the last year the Labour Bureau has published.`}</Para>
                            <Para>{`It bought [[$${inr(FIRST.usd.dollars)}]] in [[${FROM_YEAR}]] and [[$${inr(NOW.usd.dollars)}]] in [[${TO_YEAR}]], and
                                [[${FIRST.wheat!.quintals.toFixed(1)} quintals]] of wheat at the support price in [[${FIRST.wheat!.cropYear}]] against
                                [[${WHEAT_LAST.wheat.quintals.toFixed(1)}]] in [[${WHEAT_LAST.wheat.cropYear}]].`}</Para>
                            <Para last>{`Each is a real rupee price on DBIE, not an index: the Mumbai silver price, the Bureau’s daily wage for
                                men, the yearly average rupee–dollar rate, and the price the government offers for wheat, which is not what
                                every farmer gets.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Shelves />
                    </Portion>
                </Row>
            </Pinned>

            {/* 6 WHICH RAN AHEAD ===================================================================================== */}
            <Pinned steps={6}>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="which-ran-ahead" kicker="WHICH RAN AHEAD OF PRICES" title="Gold ran far ahead of prices, wages ahead, the dollar behind, wheat about level">
                            <Para>{`Set each price against the workers’ index. Gold rose [[${timesWords(HEADLINE.ranAhead.gold)}]] as fast as prices in
                                general between [[${FROM_YEAR}]] and [[${TO_YEAR}]], silver [[${timesWords(HEADLINE.ranAhead.silver)}]]. A mason’s day rose
                                [[${timesWords(HEADLINE.ranAhead.mason)}]] than prices to [[${MASON_LAST.year}]]: the day’s work buys more than it did.`}</Para>
                            <Para last>{`The dollar went the other way: ₹1 lakh buys [[${timesWords(HEADLINE.ranAhead.usd)}]] of them, after prices, than it did.
                                Wheat at the support price stayed [[${timesWords(HEADLINE.ranAhead.wheat)}]] with prices to [[${WHEAT_LAST.year}]].
                                Inflation is one number; what things cost is not.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <RanAhead />
                    </Portion>
                </Row>
            </Pinned>

            {/* 7 THE SPENDING YOU CANNOT WEIGH ======================================================================= */}
            <Pinned steps={5}>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="cannot-weigh" kicker="THE SPENDING YOU CANNOT WEIGH" title={`What ₹1 lakh of everyday spending in ${FROM_YEAR} costs today`}>
                            <Para>{`Groceries, rent, fuel and school fees are not priced in rupees on DBIE; they are price indices, which say
                                how much a kind of spending rose, not what a kilogram cost. So this part can only say what ₹1 lakh of
                                food, housing or fuel spending in [[${FROM_YEAR}]] would cost today, never what it bought.`}</Para>
                            <Para last>{`The figures wait on one piece of data: the Labour Bureau’s group-wise linking factors, which join the
                                food, housing, fuel and clothing indices across the 1982, 2001 and 2016 bases the way the factors above
                                join the general index. Until they are sourced, no figure is shown here.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <div className="repriced r1" role="group" aria-label={`A ${FROM_YEAR} household bill, to be re-priced for ${TO_YEAR} once the group-wise linking factors are sourced`}>
                            <div className="receipt-head r1"><span>Household bill, re-priced</span><span>{FROM_YEAR} → {TO_YEAR}</span></div>
                            {[ "🥗 Food", "🏠 Housing", "🔥 Fuel and light", "👕 Clothing" ].map((g, i) => (
                                <div key={g} className={`receipt-line r${i + 2}`}>
                                    <span className="receipt-label">{g}<span className="receipt-note">₹1 lakh of {FROM_YEAR} spending</span></span>
                                    <span className="receipt-value is-pending">awaiting the factors</span>
                                </div>
                            ))}
                            <p className="bill-foot r5">{prose(`Each line will carry what ₹1 lakh of that spending in ${FROM_YEAR} would cost in ${TO_YEAR}, by the workers’
                                index for that group. The groups’ bases are not yet joined; no figure is shown until they are.`)}</p>
                        </div>
                    </Portion>
                </Row>
            </Pinned>

            {/* 8 YOUR OWN BILL ======================================================================================= */}
            <Pinned steps={2} id="your-own-bill">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="your-year" kicker="YOUR OWN BILL" title="Any year, any sum: the bill made out">
                            <Para>{`Pick any year and any sum, from [[₹10,000]] to [[₹10 lakh]], and the bill is made out for it: the five shelves
                                and what the sum is worth today. Every bill carries the yardstick and the date of the data.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <OwnBill />
                    </Portion>
                </Row>
            </Pinned>

            {/* 9 THE EXACT FIGURES =================================================================================== */}
            <Section className="chapter">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="every-year" kicker="EVERY YEAR, EVERY SHELF" title="The exact figures">
                            <Para last>{`The table gives the figures for every year from [[${FROM_YEAR}]] to [[${TO_YEAR}]], and the download
                                has the prices behind them: the gold and silver prices, the mason’s wage, the dollar rate, the support
                                price and the index.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Figure title={`What ₹${inr(SUM)} bought, ${FROM_YEAR} to ${TO_YEAR}`} units="calendar-year averages of the prices on DBIE; wheat by marketing year; the last year is a part year" table={YEAR_TABLE}
                            note={`Gold to ${monthName(HEADLINE.last.gold)}, the index to ${monthName(HEADLINE.last.index)}, the mason’s wage to ${monthName(HEADLINE.last.mason)}, the dollar to ${HEADLINE.last.usd}, wheat to ${HEADLINE.last.wheat}.`}>
                            <Div className="year-table">
                                <table>
                                    <thead><tr>{YEAR_TABLE.head.map((h, i) => <th key={i} className={YEAR_TABLE.numeric[i] ? "num" : ""}>{h}</th>)}</tr></thead>
                                    <tbody>
                                        {YEAR_TABLE.rows.map((r, i) => (
                                            <tr key={i} className={HEADLINE.lensYears.includes(YEARS[i].year) ? "lens-year" : ""}>
                                                {r.map((c, j) => <td key={j} className={YEAR_TABLE.numeric[j] ? "num" : ""}>{c}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Div>
                        </Figure>
                    </Portion>
                </Row>
            </Section>

            {/* SOURCES, METHOD, DOWNLOADS ============================================================================ */}
            <Section id="wolb-sources">
                <Row horizontalPadding="small" marginTop="large" allowUltraWide>
                    <Portion desktopSpan="24"><Divider kind="secondary" verticalMargin="micro" /></Portion>
                    <Portion desktopSpan="12">
                        <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                        <Text size="tiny" marginBottom="micro">
                            {prose(`Reserve Bank of India, monthly average prices of gold and silver in Mumbai, April 1990 to
                                ${monthName(HEADLINE.last.gold)}, as published on DBIE. Labour Bureau, Ministry of Labour and Employment,
                                wage rates in rural India, men, all India, by occupation, monthly to ${monthName(HEADLINE.last.mason)}, and
                                its consumer price index for industrial workers on the 1982, 2001 and 2016 bases to
                                ${monthName(HEADLINE.last.index)}, as published on DBIE, with the linking factors as printed in the RBI
                                Bulletin’s table of other consumer price indices. Reserve Bank of India, the rupee–dollar rate, yearly
                                averages and daily reference rates to ${HEADLINE.last.usd}, as published on DBIE. Ministry of Agriculture
                                and Farmers Welfare, minimum support prices by crop year to ${HEADLINE.last.wheat}, as published on DBIE.`)}
                        </Text>

                        <Text weight="600" size="tiny" verticalMargin="micro">DOWNLOADS</Text>
                        <Link href="/stories/what-one-lakh-bought/one-lakh-by-year.csv" download className="download-link">
                            <Div verticallyCentreItems>
                                <Download size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Download the figures by year (CSV)</Text>
                            </Div>
                        </Link>
                        <Link href="/prices" className="download-link">
                            <Div verticallyCentreItems>
                                <Table2 size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Go to the price tables</Text>
                            </Div>
                        </Link>
                    </Portion>
                    <Portion desktopSpan="12">
                        <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                        <Text size="tiny" marginBottom="nano">
                            {prose(`Years. Each year’s price is the calendar-year average of the monthly series over the months DBIE carries, so
                                ${FROM_YEAR} means January to December ${FROM_YEAR}. ${TO_YEAR} is a part year: gold and silver
                                ${GOLD_2026_SPAN}, the index ${INDEX_SPAN}, the dollar ${USD_SPAN}. The mason’s last year is
                                ${MASON_LAST.year}, ${MASON_SPAN}. Wheat is the support price for the marketing year beginning in that year.`)}
                        </Text>
                        <Text size="tiny" marginBottom="nano">
                            {prose(`The index. The consumer price index for industrial workers is carried on three bases over these years, 1982,
                                2001 and 2016, which do not overlap on DBIE. They are joined with the Labour Bureau’s linking factors as the
                                RBI Bulletin prints them: ${FACTORS.to2001} from the 1982 base to 2001, ${FACTORS.to2016} from 2001 to 2016.
                                “Worth today” carries a sum forward by the ratio of the chained index.`)}
                        </Text>
                        <Text size="tiny" marginBottom="nano">
                            {prose(`Gold and silver. The Mumbai bullion price, not a jeweller’s price: no making charges, no GST, and the import
                                duty changes of 2024 and ${TO_YEAR} sit inside it. The jewellery names are a guide to the weight, by the
                                story’s own thresholds, and are not a measure.`)}
                        </Text>
                        <Text size="tiny" marginBottom="micro">
                            {prose(`The mason. One occupation, men only: DBIE carries no women’s series. The Labour Bureau changed its occupation
                                list in November 2013; the mason’s all-India wage read ${rs(HEADLINE.masonBreak.from)} in October 2013 and
                                ${rs(HEADLINE.masonBreak.to)} in November, and the story runs the series through the change. The dollar’s
                                direction: ₹1 lakh buying fewer dollars is the rupee buying less, stated as such.`)}
                        </Text>

                    </Portion>
                </Row>
            </Section>
        </Article>
    </MotionConfig>
);
