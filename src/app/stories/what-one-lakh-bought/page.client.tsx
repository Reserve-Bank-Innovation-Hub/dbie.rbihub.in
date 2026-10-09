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
import { GoldSet, Receipt, ShelvesReceipt } from "./Receipts";
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
const Chapter = ({ id, kicker, title, children } : { id : string; kicker ? : string; title : string; children ? : ReactNode }) => (
    <Div className="chapter-text r1" id={kicker ? undefined : id}>
        {kicker && <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>}
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
                    What <span className="accent">₹1 lakh</span> could buy
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
                            tax.`}</Para>
                    </Div>
                ) },
                { kicker : TURN_KICKER, body : <Para last>{`Turn the case and the years go by. In [[${LENS[1].year}]], [[${grams(LENS[1].gold.grams)}]], ${pieceOf(LENS[1].gold.grams)}.`}</Para> },
                { kicker : TURN_KICKER, body : <Para last>{`In [[${LENS[2].year}]], one could buy a chain with a pendant for [[${grams(LENS[2].gold.grams)}]].`}</Para> },
                { kicker : TURN_KICKER, body : (
                    <Div className="chapter-text">
                        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{rich(`In [[${TO_YEAR}]], the same ₹1 lakh buys [[${grams(NOW.gold.grams)}]]`)}</Heading4>
                        <Para>{`This is considering ${GOLD_2026_SPAN} so far.`}</Para>
                        <Para last>{`Gold reached its highest month in that span, and the year’s figure will move as each new month comes in.`}</Para>
                    </Div>
                ) },
            ]} />

            {/* 4 THE MONEY SHRANK TOO ================================================================================ */}
            <Pinned steps={3} className="on-sandalwood" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="9">
                        <Chapter id="the-money-shrank" title="Prices in general rose too">
                            <Para>{`By the consumer price index for industrial workers, the long series the Labour Bureau keeps, what cost
                                [[₹100]] in [[${FROM_YEAR}]] cost [[${rs(Math.round(HEADLINE.priceRise * 100))}]] in [[${TO_YEAR}]].`}</Para>
                            <Para last>{`So ₹1 lakh of [[${FROM_YEAR}]] is [[${lakh(HEADLINE.worthNow)}]] of today’s money.`}</Para>
                        </Chapter>
                        <Receipt indexSpan={INDEX_SPAN} />
                    </Portion>
                    <Portion desktopSpan="1" />
                    <Portion desktopSpan="14">
                        <Div className="chapter-text r3">
                            <Para>{`One can’t get the same bridal set for [[${rs(HEADLINE.worthNow)}]].`}</Para>
                            <Para last>{`The [[${grams(FIRST.gold.grams)}]] of [[${FROM_YEAR}]] cost [[${lakh(HEADLINE.necklaceNow)}]] at [[${TO_YEAR}]]’s price,
                                [[${timesWords(HEADLINE.ranAhead.gold)}]] what the general rise in prices would explain.`}</Para>
                        </Div>
                        <GoldSet />
                    </Portion>
                </Row>
            </Pinned>

            {/* 5 THE OTHER SHELVES =================================================================================== */}
            <Pinned steps={6} className="figs-bold shelves-ground" pin>
                <img className="commodities" src="/images/stories/what-one-lakh-bought/other-commodities.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" />
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="10">
                        <Chapter id="the-other-shelves" title="Silver, a mason’s days, dollars and wheat each shrank at their own pace">
                        </Chapter>
                        <ShelvesReceipt />
                    </Portion>
                    <Portion desktopSpan="13">
                        <Shelves />
                    </Portion>
                </Row>
            </Pinned>

            {/* 6 WHICH RAN AHEAD ===================================================================================== */}
            <Pinned steps={6} className="on-ivory" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="9">
                        <Chapter id="which-ran-ahead" title="Gold ran far ahead of prices, wages ahead, the dollar behind, wheat about level">
                            <Para>{`Set each price against the workers’ index.`}</Para>
                            <Para>{`Gold rose [[${timesWords(HEADLINE.ranAhead.gold)}]] as fast as prices in general between [[${FROM_YEAR}]] and [[${TO_YEAR}]],
                                silver [[${timesWords(HEADLINE.ranAhead.silver)}]].`}</Para>
                            <Para>{`A mason’s day rose [[${timesWords(HEADLINE.ranAhead.mason)}]] than prices to [[${MASON_LAST.year}]]: the day’s work buys more than it did.`}</Para>
                            <Para>{`The dollar went the other way: ₹1 lakh buys [[${timesWords(HEADLINE.ranAhead.usd)}]] of them, after prices, than it did.`}</Para>
                            <Para last>{`Wheat at the support price stayed [[${timesWords(HEADLINE.ranAhead.wheat)}]] with prices to [[${WHEAT_LAST.year}]].`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="1" />
                    <Portion desktopSpan="13">
                        <RanAhead />
                    </Portion>
                </Row>
            </Pinned>

            {/* 8 YOUR OWN BILL ======================================================================================= */}
            <Pinned steps={2} id="your-own-bill" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="9">
                        <Chapter id="your-year" title="Create your own bill">
                            <Para last>{`Pick any year and any sum, from [[₹10,000]] to [[₹10 lakh]], and see the updated bill.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="1" />
                    <Portion desktopSpan="14">
                        <OwnBill />
                    </Portion>
                </Row>
            </Pinned>

            {/* 9 THE DATA SET, THEN THE SOURCES: the page's foot, a breath of the accent rising under both ============= */}
            <div className="page-foot">
            <Section className="chapter data-set">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="every-year" title="The data set">
                            <Para last>{`The table gives the figures for every year from [[${FROM_YEAR}]] to [[${TO_YEAR}]], and the download
                                has the prices behind them: the gold and silver prices, the mason’s wage, the dollar rate, the support
                                price and the index.`}</Para>
                        </Chapter>
                    </Portion>
                    <Portion desktopSpan="16">
                        <Figure title={`What ₹${inr(SUM)} could buy, ${FROM_YEAR} to ${TO_YEAR}`} units="calendar-year averages of the prices on DBIE; wheat by marketing year; the last year is a part year" table={YEAR_TABLE}
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
                <Row horizontalPadding="small" marginTop="none" allowUltraWide>
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

                        <Text weight="600" size="tiny" className="downloads-head" verticalMargin="micro">DOWNLOADS</Text>
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
            </div>
        </Article>
    </MotionConfig>
);
