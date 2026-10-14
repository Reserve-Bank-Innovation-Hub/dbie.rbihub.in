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
import { Pinned } from "./Pinned";
import { WeddingYear } from "./WeddingYear";
import { PriceLine } from "./PriceLine";
import { Engines } from "./Engines";
import { Race } from "./Race";
import { Reserves, TonnesCards } from "./Reserves";
import { GoldBar } from "./GoldBar";

// DATA ================================================================================================================
import { AGAINST, FACTORS, FIRST, FROM_YEAR, HEADLINE, NOW, SUM, TEN, TO_YEAR, YEARS, bn, dateName, grams, inr, monthName, partYear, pct, pieceOf, rs, times, timesWords } from "./data";

// STYLES ==============================================================================================================
import "./the-10-gram-question.css";

// THE WORDS ===========================================================================================================
// The sentences are template strings over the derived figures, so a refresh of the data rewrites them; prose() folds
// the line breaks of the source into single spaces, and a figure written [[like this]] is set as a highlight.
const prose = (s : string) => s.replace(/\s*\n\s*/g, " ").trim();
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);
const rich = (s : string) => prose(s).split(/\[\[(.+?)\]\]/).map((part, i) => i % 2 ? <strong key={i} className="fig">{part}</strong> : part);

const GOLD_SPAN  = partYear(TO_YEAR, NOW.gold.months);                        // "January to July 2026"
const INDEX_SPAN = partYear(TO_YEAR, NOW.index.months);
const E = HEADLINE.engines;
const R = HEADLINE.reserves;

// THE FORMULA =========================================================================================================
// The sentence as a formula: the Mumbai price is the London price in dollars, times the rupees a dollar costs, times
// Mumbai's gap over that price brought into rupees, which holds duty, tax and the trade's premium.
const Term = ({ cls, name, sub } : { cls ? : string; name : string; sub : string }) => (
    <span className={`formula-term ${cls ?? ""}`}><span className="formula-name">{name}</span><span className="formula-sub">{sub}</span></span>
);
const Formula = () => (
    <p className="formula" aria-label="The Mumbai price of gold is the London price in dollars, times the rupees a dollar costs, times Mumbai’s gap, which holds duty, tax and the trade’s premium">
        <Term cls="is-result" name="Mumbai price" sub="₹ for 10 g" />
        <span className="formula-op">=</span>
        <Term cls="is-london" name="Gold in dollars" sub="London, $ an ounce" />
        <span className="formula-op">×</span>
        <Term cls="is-rate" name="The rupee" sub="₹ a dollar" />
        <span className="formula-op">×</span>
        <Term cls="is-premium" name="Mumbai’s gap" sub="duty, tax and the trade’s premium" />
    </p>
);

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
    head    : [ "Year", "Gold, ₹ per 10 g", `Grams for ₹${inr(SUM)}`, "London, $ an ounce", "₹ a dollar", "Mumbai’s gap", "Workers’ index", "Gold in reserves" ],
    numeric : [ false, true, true, true, true, true, true, true ],
    rows    : YEARS.map(y => [
        y.year, inr(y.gold.price), grams(y.gold.grams), y.london ? inr(y.london.price) : "–", y.rate === null ? "–" : y.rate.toFixed(2),
        y.premium === null ? "–" : times(y.premium), y.index.value.toFixed(1), pct(y.reserves.share),
    ]),
};

// THE PAGE ============================================================================================================
export const TenGramQuestionPage = () => (
    <MotionConfig reducedMotion="user">
        <Article id="the-10-gram-question-page">
            {/* 1 THE TITLE =========================================================================================== */}
            <Section className="hero">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="14">
                        <PageCrumbs />
                        <Text className="kicker hero-kicker" weight="600" marginBottom="nano">THE RUPEE AND THE WORLD</Text>
                        <Heading1 className="hero-title" marginBottom="micro">
                            The <span className="accent">10-gram</span> question
                        </Heading1>
                        <Text className="hero-sub figs-bold" fontStyle="serif" size="large">
                            {rich(`Ten grams cost [[${rs(HEADLINE.first.price)}]] in ${monthName(HEADLINE.first.ym)} and [[${rs(HEADLINE.last.price)}]] in
                                ${monthName(HEADLINE.last.ym)}: how much of that is gold, how much the rupee, and how much Mumbai’s gap.`)}
                        </Text>
                    </Portion>
                    <Portion desktopSpan="1" />
                    <Portion desktopSpan="9">
                        <div className="ten-card r1" role="group" aria-label={`Ten grams of gold in Mumbai, ${monthName(HEADLINE.first.ym)} and ${monthName(HEADLINE.last.ym)}`}>
                            <GoldBar className="ten-bar" />
                            <p className="ten-head">{TEN} grams of standard gold, Mumbai</p>
                            <p className="ten-line"><span className="ten-when">{monthName(HEADLINE.first.ym)}</span><span className="ten-price">{rs(HEADLINE.first.price)}</span></p>
                            <p className="ten-line"><span className="ten-when">{monthName(HEADLINE.last.ym)}</span><span className="ten-price is-now">{rs(HEADLINE.last.price)}</span></p>
                            <p className="ten-foot">{times(HEADLINE.times)} in {HEADLINE.span} years, about {pct(HEADLINE.yearly)} a year</p>
                        </div>
                    </Portion>
                </Row>
            </Section>

            {/* 2 THE WEDDING YEAR ==================================================================================== */}
            <Pinned steps={2} className="on-sandalwood" id="the-wedding-year" pin>
                <WeddingYear lead={<Chapter id="your-year" title={`What ₹${inr(SUM)} bought in gold`} />} />
            </Pinned>

            {/* 3 TEN GRAMS, MONTH BY MONTH =========================================================================== */}
            <Pinned steps={2} className="on-paper" id="month-by-month" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="24">
                        <Chapter id="the-price" title="Price of ten grams" />
                        <div className="price-facts r1">
                            <div className="race-card price-card" aria-label={`From ${monthName(HEADLINE.first.ym)} to ${monthName(HEADLINE.last.ym)}, the price rose by ${times(HEADLINE.times)} over ${HEADLINE.span} years, about ${pct(HEADLINE.yearly)} a year; its highest month so far was ${monthName(HEADLINE.peak.ym)}, at ${rs(HEADLINE.peak.price)}.`}>
                                <p className="race-head">From {monthName(HEADLINE.first.ym)} to {monthName(HEADLINE.last.ym)},</p>
                                <p className="race-stats">
                                    <span className="race-stat is-gold"><span>the price rose by</span><strong>{times(HEADLINE.times)}</strong></span>
                                    <span className="race-stat"><span>over</span><strong>{HEADLINE.span} years</strong></span>
                                    <span className="race-stat"><span>about, a year</span><strong>{pct(HEADLINE.yearly)}</strong></span>
                                    <span className="race-stat is-peak"><span>its highest, {monthName(HEADLINE.peak.ym)}</span><strong>{rs(HEADLINE.peak.price)}</strong></span>
                                </p>
                            </div>
                            <p className="duty-note"><span>The import duty on gold sits inside the Mumbai price. It was cut to <strong>{HEADLINE.duty[0].rate}%</strong> in {monthName(HEADLINE.duty[0].month)} and raised again to <strong>{HEADLINE.duty[1].rate}%</strong> in {monthName(HEADLINE.duty[1].month)}.</span></p>
                        </div>
                        <PriceLine />
                    </Portion>
                </Row>
            </Pinned>

            {/* 4 THREE ENGINES ======================================================================================= */}
            <Pinned steps={2} className="on-ivory engines-chapter" id="three-engines" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="24">
                        <Chapter id="the-engines" title="Three engines: gold, the rupee, and Mumbai’s gap">
                            <Formula />
                        </Chapter>
                    </Portion>
                </Row>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="24">
                        <Engines />
                    </Portion>
                </Row>
            </Pinned>

            {/* 5 AGAINST PRICES ====================================================================================== */}
            <Pinned steps={2} className="on-paper" id="against-prices" pin>
                <Race lead={(
                    <Chapter id="the-race" title="Gold against prices in general">
                        <Para last>{`Here gold runs against prices, measured by the Labour Bureau’s long-running consumer price index
                            for industrial workers.`}</Para>
                    </Chapter>
                )} />
            </Pinned>

            {/* 6 THE COUNTRY'S GOLD ================================================================================== */}
            <Pinned steps={2} className="on-ivory" id="the-countrys-gold" pin>
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="9">
                        <Chapter id="the-reserves" title="The country’s gold">
                            <Para>{`The Reserve Bank holds gold in the foreign exchange reserves.`}</Para>
                            <Para last>{`In ${monthName(R.first.ym)}, it was [[${pct(R.first.share)}]] of reserves of [[${bn(R.first.totalUsdBn)}]], and in
                                ${monthName(R.high.ym)}, with the reserves run down to [[${bn(R.high.totalUsdBn)}]], [[${pct(R.high.share)}]]. As the dollar
                                assets grew the share fell, to [[${pct(R.low.share)}]] in ${monthName(R.low.ym)}. By ${monthName(R.last.ym)}, gold was
                                [[${bn(R.last.goldUsdBn)}]] of [[${bn(R.last.totalUsdBn)}]], a share of [[${pct(R.last.share)}]]. Most of that rise is price.`}</Para>
                        </Chapter>
                        <div className="r2"><TonnesCards /></div>
                    </Portion>
                    <Portion desktopSpan="1" />
                    <Portion desktopSpan="14">
                        <Reserves />
                    </Portion>
                </Row>
            </Pinned>

            {/* 7 THE DATA SET, THEN THE SOURCES ====================================================================== */}
            <div className="page-foot">
            <Section className="chapter data-set">
                <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="8">
                        <Chapter id="every-year" title="The data set" />
                    </Portion>
                    <Portion desktopSpan="16">
                        <Figure title={`Gold by year, ${FROM_YEAR} to ${TO_YEAR}`} units={`calendar-year averages of the monthly series on DBIE; ${FROM_YEAR} is ${partYear(FROM_YEAR, FIRST.gold.months)} and ${TO_YEAR} is ${GOLD_SPAN}; the reserves at each year’s last month`} table={YEAR_TABLE}
                            note={`Gold to ${monthName(HEADLINE.lastMonth.gold)}, the London price and the rate to ${monthName(HEADLINE.lastMonth.london)}, the index to ${monthName(HEADLINE.lastMonth.index)}, the reserves to ${monthName(HEADLINE.lastMonth.reserves)}.`}>
                            <Div className="year-table">
                                <table>
                                    <thead><tr>{YEAR_TABLE.head.map((h, i) => <th key={i} className={YEAR_TABLE.numeric[i] ? "num" : ""}>{h}</th>)}</tr></thead>
                                    <tbody>
                                        {YEAR_TABLE.rows.map((r, i) => (
                                            <tr key={i} className={[ FROM_YEAR, AGAINST.year, TO_YEAR ].includes(YEARS[i].year) ? "lens-year" : ""}>
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
            <Section id="tgq-sources">
                <Row horizontalPadding="small" marginTop="none" allowUltraWide>
                    <Portion desktopSpan="24"><Divider kind="secondary" verticalMargin="micro" /></Portion>
                    <Portion desktopSpan="12">
                        <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                        <Text size="tiny" marginBottom="micro">
                            {prose(`Reserve Bank of India, monthly average price of standard gold in Mumbai, ${monthName(HEADLINE.first.ym)} to
                                ${monthName(HEADLINE.last.ym)}, as published in the RBI Bulletin on DBIE; and its Handbook of Statistics on the
                                Indian Economy, the average price of gold in domestic and foreign markets, by month to
                                ${monthName(HEADLINE.lastMonth.london)} and by financial year to ${E.to}, which gives the London price in dollars
                                and in rupees. Reserve Bank of India, the daily rupee–dollar reference rate, as published on DBIE. Labour Bureau,
                                the consumer price index for industrial workers on the 1982, 2001 and 2016 bases to ${monthName(HEADLINE.lastMonth.index)},
                                as published on DBIE, with the linking factors as printed in the RBI Bulletin. Reserve Bank of India, foreign
                                exchange reserves by month to ${monthName(HEADLINE.lastMonth.reserves)} and by week to ${dateName(HEADLINE.lastMonth.tonnes)},
                                as published on DBIE. The import-duty dates are from the Union Budget of 2024 and the notification of 2026, not
                                from DBIE.`)}
                        </Text>

                        <Text weight="600" size="tiny" className="downloads-head" verticalMargin="micro">DOWNLOADS</Text>
                        <Link href="/stories/the-10-gram-question/ten-grams-by-month.csv" download className="download-link">
                            <Div verticallyCentreItems>
                                <Download size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Download ten grams by month (CSV)</Text>
                            </Div>
                        </Link>
                        <Link href="/stories/the-10-gram-question/reserves-gold-by-month.csv" download className="download-link">
                            <Div verticallyCentreItems>
                                <Download size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Download the Bank’s gold by month (CSV)</Text>
                            </Div>
                        </Link>
                        <Link href="/stories/the-10-gram-question/reserves-gold-tonnes.csv" download className="download-link">
                            <Div verticallyCentreItems>
                                <Download size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Download the Bank’s gold by weight (CSV)</Text>
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
                            {prose(`The price. The Mumbai monthly average of standard gold, a bullion price: no making charges, no GST, with the
                                import duty inside it. Years are calendar-year averages of the months DBIE carries; ${FROM_YEAR} is
                                ${partYear(FROM_YEAR, FIRST.gold.months)} and ${TO_YEAR} is ${GOLD_SPAN}. The grams a sum buys are the sum over the
                                price, times ten.`)}
                        </Text>
                        <Text size="tiny" marginBottom="nano">
                            {prose(`The engines. The handbook prints the London price in dollars an ounce and the same price in rupees per 10 grams;
                                the rate it used is read back from the two, and checked against the daily reference rate’s monthly average,
                                which it matches within 1.5% in all but a few months. Mumbai’s gap is the Mumbai price over the London price in
                                rupees. The three multiply exactly to the rupee price, so a window’s rise splits exactly into them; the chart
                                stacks them on a log axis. The windows are financial years, as the handbook gives yearly averages.`)}
                        </Text>
                        <Text size="tiny" marginBottom="nano">
                            {prose(`The index. The consumer price index for industrial workers is carried on three bases, 1982, 2001 and 2016, which
                                do not overlap on DBIE. They are joined with the Labour Bureau’s linking factors as the RBI Bulletin prints them:
                                ${FACTORS.to2001} from the 1982 base to 2001, ${FACTORS.to2016} from 2001 to 2016. ${TO_YEAR} is ${INDEX_SPAN}.`)}
                        </Text>
                        <Text size="tiny" marginBottom="micro">
                            {prose(`The reserves. Gold and total reserves in dollars at each month’s end; the share is one over the other, so it
                                moves with the gold price and the dollar as much as with what the Bank holds. The weekly report gives the
                                volume in tonnes from ${dateName(R.tonnes.first.date)}; the story quotes the first and latest weeks it gives.
                                No advice is given or implied.`)}
                        </Text>
                    </Portion>
                </Row>
            </Section>
            </div>
        </Article>
    </MotionConfig>
);

void cap;
