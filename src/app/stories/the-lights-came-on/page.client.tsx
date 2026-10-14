"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode } from "react";

// UI ==================================================================================================================
import { Article, Div, Heading4, Text } from "fictoan-react";
import { Download, Table2 } from "lucide-react";
import { MotionConfig } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { BothSidesChart } from "./BothSidesChart";
import { Figure } from "./chartKit";
import { IndexLines } from "./IndexLines";
import { MixBars } from "./MixBars";
import { LetterRise, Reveal, WordReveal } from "./Motion";
import { Opening } from "./Opening";
import { WomenPanels } from "./WomenPanels";
import { WomenSlope } from "./WomenSlope";

// DATA ================================================================================================================
import {
    BOTH_SIDES, CPI, CPI_LINKED, FOLDED, FROM, HEADLINE, INDEX, LATEST, LATEST_YEAR, MERGER, OCC_LABELS, PERSONAL_LABELS, QUARTERS, RRB_2026,
    SLOPE, TO, WOMEN_SERIES, companiesPartOfSwing, crore, lakhCrore, latestGap, mixOf, monthName, shortMonth,
    timesWords, whole, yearOf, type OccKey, type PersonalKey,
} from "./data";

// STYLES ==============================================================================================================
import "./the-lights-came-on.css";

// THE WORDS ===========================================================================================================
// The sentences are template strings over data.gen.ts and data.ts, so a refresh of the data rewrites them; prose()
// folds the line breaks of the source into single spaces and keeps a figure on the same line as its unit.
const prose = (s : string) => s.replace(/\s+/g, " ").trim().replace(/(\d) (lakh|crore)\b/g, "$1 $2");
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);
const WORDS = [ "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen" ];
const numberWord = (n : number) => WORDS[n] ?? `${n}`;
// ₹ of every ₹100, to one decimal
const rs = (v : number) => `₹${v.toFixed(1)}`;
// a move between two shares, in the plainest verb
const moved = (a : number, b : number) => (b > a ? "rose" : b < a ? "fell" : "stayed");

const H = HEADLINE, G = H.growth, AVG = H.averageLoan, W = H.women;
const y15 = yearOf(FROM.quarter), y26 = yearOf(TO.quarter);
const years = +y26 - +y15;
const [ companies, individuals ] = BOTH_SIDES;
const m15 = H.marches.find(m => m.year === +y15) ?? H.marches[0];
const m26 = H.marches[H.marches.length - 1];

// The average loan after prices: the change as a person would say it.
const realLoanWords = Math.abs(1 - AVG.realChange) < 0.025
    ? "about the same as in"
    : `about ${Math.round(100 * Math.abs(1 - AVG.realChange))}% ${AVG.realChange < 1 ? "smaller" : "larger"} than in`;
// The average loan against prices, for In short.
const loanPaceWords = Math.abs(1 - AVG.realChange) < 0.025 ? "about as fast as prices" : AVG.realChange < 1 ? "a little slower than prices" : "faster than prices";
// Lending to companies in rupees of the day and after prices, as said in the chapter's title: "doubled", "a quarter".
const companiesNominalWords = timesWords(G.companies);
const companiesRealWords = (() => {
    const pct = 100 * (G.companiesReal - 1);
    return pct >= 22 && pct < 28 ? "a quarter" : pct >= 30 && pct < 36 ? "a third" : pct >= 45 && pct < 55 ? "a half" : `${Math.round(pct)}%`;
})();
// What a rupee of the latest March bought against one of March 2015, as a fraction a person would say.
const rupeeBuysWords = (() => {
    const f = 1 / H.prices;
    const said : [ number, string ][] = [ [ 1 / 2, "half" ], [ 3 / 5, "three-fifths" ], [ 2 / 3, "two-thirds" ], [ 3 / 4, "three-quarters" ], [ 4 / 5, "four-fifths" ] ];
    const [ v, w ] = said.reduce((a, b) => Math.abs(b[0] - f) < Math.abs(a[0] - f) ? b : a);
    return Math.abs(v - f) < 0.02 ? `about ${w}` : `${Math.round(100 * f)}%`;
})();
// Prices over the span, as a percentage rise.
const pricesRise = Math.round(100 * (H.prices - 1));
// The swing between individuals and private companies, and the part of it that is companies' fall.
const swingPart = companiesPartOfSwing >= 0.45 && companiesPartOfSwing <= 0.55
    ? "about half"
    : companiesPartOfSwing >= 0.4 && companiesPartOfSwing < 0.45 ? "nearly half" : `${Math.round(100 * companiesPartOfSwing)}%`;
const gapNarrowed = latestGap < H.gapPeak.gap;

// What individuals borrow for: the money for farming, in rupees, and the four business occupations together.
const agriGrowth = TO.occupations.agriculture.all.outstanding / FROM.occupations.agriculture.all.outstanding;
const BUSINESS : OccKey[] = [ "trade", "industry", "services", "transport" ];
const business = (y : "y2015" | "y2026") => BUSINESS.reduce((s, k) => s + H.occupations[y][k].ofIndividuals, 0);
const P15 = H.personal.y2015, P26 = H.personal.y2026;
const personalAboveCompanies = m26.personal > m26.privateCompanies;

// Women: the share of the accounts added since 2015, the loan-size ratio, the fall from the peak, the farm loans.
const addedWords = W.shareOfAccountsAdded >= 31 && W.shareOfAccountsAdded < 36 ? "About a third" : `${Math.round(W.shareOfAccountsAdded)}%`;
const ratioMoved = Math.abs(AVG.womenToMen2026 - AVG.womenToMen2015) <= 0.02;
const agri = SLOPE.find(s => s.key === "agriculture");
const roseMore = SLOPE.filter(s => s.key !== "agriculture" && agri && s.now - s.then > agri.now - agri.then);
const rrbClose = Math.abs(H.rrb.womenAccountsShare2026 - W.accountsShare2026) < 1 && Math.abs(H.rrb.womenMoneyShare2026 - W.moneyShare2026) < 1;
const rrbAccounts = RRB_2026.individuals.accounts - TO.classes.individuals.accounts;
const toWomenShare = 100 * TO.women.accounts / TO.classes.individuals.accounts;

// The quarters DBIE does not publish between the first and the last.
const MISSING = (() => {
    const out : string[] = [];
    const have = new Set(QUARTERS.map(q => q.quarter));
    let [ y, m ] = QUARTERS[0].quarter.split("-").map(Number);
    const last = QUARTERS[QUARTERS.length - 1].quarter;
    while (`${y}-${String(m).padStart(2, "0")}` < last) {
        m += 3; if (m > 12) { m -= 12; y += 1; }
        const key = `${y}-${String(m).padStart(2, "0")}`;
        if (!have.has(key)) out.push(key);
    }
    return out;
})();
const missingWords = MISSING.length === 2 ? `${monthName(MISSING[0]).split(" ")[0]} or ${monthName(MISSING[1])}` : MISSING.map(monthName).join(", ");

// THE FRAME ===========================================================================================================
const Chapter = ({ kicker, title, children, id } : { kicker : string; title : string; children : ReactNode; id : string }) => (
    <Reveal>
        <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>
        <Heading4 className="chapter-title" fontStyle="serif" weight="600" marginBottom="micro">{prose(title)}</Heading4>
        {children}
    </Reveal>
);

const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text className={`para${last ? " is-last" : ""}`} fontStyle="serif">{prose(children)}</Text>;
// A paragraph with links in it: the text is written as strings around the links, so no space is lost at a join.
const Prose = ({ children, last = false } : { children : ReactNode; last ? : boolean }) => <Text className={`para${last ? " is-last" : ""}`} fontStyle="serif">{children}</Text>;
const Cite = ({ href, children } : { href : string; children : ReactNode }) => <a href={href} target="_blank" rel="noopener" className="cite-link">{children}</a>;

const MethodNote = ({ title, children, last = false } : { title : string; children : string; last ? : boolean }) => (
    <Text size="tiny" marginBottom={last ? undefined : "nano"}>
        <strong>{title}</strong>{" "}{prose(children)}
    </Text>
);

const DOWNLOADS : [ string, string ][] = [
    [ "credit-by-borrower-class-quarterly.csv", "bank credit by borrower class, every quarter" ],
    [ "individuals-by-gender-and-occupation-quarterly.csv", "credit to individuals by gender and occupation, every quarter" ],
    [ "personal-loans-by-kind-quarterly.csv", "personal loans by kind, every quarter" ],
    [ "cpi-general-index-quarterly.csv", "the consumer price index, every quarter" ],
];

const CARDS_URL = "https://newsroom.transunioncibil.com/half-of-indias-new-to-credit-card-consumers-are-gen-z-and-reside-beyond-metros/";
const SURVEY_URL = "https://www.indiabudget.gov.in/budget2017-2018/es2016-17/echapter.pdf";
const MERGER_URL = "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=56850";
const ACTIVE_URL = "https://newsroom.transunioncibil.com/credit-growth-in-uttar-pradesh-madhya-pradesh-bihar-outpaced-that-of-traditional-strongholds/";
const lakh = (v : number) => `₹${v.toFixed(2)} lakh`;

export const TheLightsCameOnPage = () => (
    <MotionConfig reducedMotion="user">
        <Article id="the-lights-came-on-page">
            <Opening />

            {/* IN REAL TERMS ========================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div className="words">
                        <Chapter
                            id="both-sides-moved" kicker="IN REAL TERMS"
                            title={`Bank loans to companies ${companiesNominalWords} on paper, only rose ${companiesRealWords} in real terms`}
                        >
                            <Para>{`Bank lending to private companies grew by about ${companiesRealWords} between ${monthName(FROM.quarter)}
                                and ${monthName(TO.quarter)}, once rising prices are taken into account.`}</Para>
                            <Para>{`In the rupees of each year, the amount banks had lent to companies ${companiesNominalWords === "doubled" ? "roughly doubled" : companiesNominalWords},
                                from ${lakhCrore(companies.thenNominal)} to ${lakhCrore(companies.nowNominal)}. But prices rose
                                ${pricesRise}% over the same ${numberWord(years)} years, with the consumer price index going from
                                ${CPI[FROM.quarter]} to ${CPI[TO.quarter]}. A rupee in ${monthName(TO.quarter)} bought ${rupeeBuysWords}
                                of what it did in ${monthName(FROM.quarter)}.`}</Para>
                            <Para>{`At ${monthName(TO.quarter)} prices, the ${lakhCrore(companies.thenNominal)} outstanding in ${y15}
                                would be about ${lakhCrore(companies.thenReal)}. Compared with that, the ${lakhCrore(companies.nowNominal)}
                                outstanding in ${y26} is an increase of about ${Math.round(100 * (G.companiesReal - 1))}%.`}</Para>
                            <Para>{`Lending to individuals grew much faster. After adjusting for prices, it ${timesWords(G.outstandingReal)},
                                from ${lakhCrore(individuals.thenReal)} to ${lakhCrore(individuals.nowReal)} at ${monthName(TO.quarter)}
                                prices. In the rupees of each year it rose ${G.outstanding.toFixed(1)} times, from
                                ${lakhCrore(individuals.thenNominal)}.`}</Para>
                            <Prose last>
                                {prose(`The returns do not say why lending to private companies grew more slowly than lending
                                    to individuals, and they cover banks only, not other lenders. The government’s`)}{" "}
                                <Cite href={SURVEY_URL}>Economic Survey of 2016-17</Cite>
                                {" put it down to banks weighed down by bad loans to large companies, and to the better-rated companies turning to bonds and commercial paper."}
                            </Prose>
                        </Chapter>
                    </div>
                    <div className="panel">
                        <Reveal delay={0.1}>
                            <Figure
                                title={`Bank credit outstanding, March ${y15} and March ${y26}`} units={`₹ lakh crore, in ${monthName(TO.quarter)} rupees`}
                                table={{
                                    head : [ "", `${shortMonth(FROM.quarter)}, then`, `${shortMonth(TO.quarter)}`, `${shortMonth(FROM.quarter)} in ${shortMonth(TO.quarter)} rupees` ],
                                    numeric : [ false, true, true, true ],
                                    rows : BOTH_SIDES.map(r => [ r.label, (r.thenNominal / 1e5).toFixed(2), (r.nowNominal / 1e5).toFixed(2), (r.thenReal / 1e5).toFixed(2) ]),
                                }}
                                note={prose(`From the quarterly Basic Statistical Return, Table 3.2, scheduled commercial banks without the
                                    regional rural banks. ${y15} amounts are raised by the consumer price index, ${CPI[TO.quarter]} in
                                    ${monthName(TO.quarter)} against ${CPI[FROM.quarter]} in ${monthName(FROM.quarter)}. The table view
                                    gives the amounts in rupees of the day.`)}
                            >
                                <BothSidesChart />
                            </Figure>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* MORE LOANS ============================================================================================= */}
            <section className="chapter">
                <div className="row">
                    <div className="words">
                        <Chapter id="more-loans" kicker="MORE LOANS" title={`Individuals’ loan accounts ${timesWords(G.accounts)} from ${y15} to ${y26}`}>
                            <Para>{`Individuals held ${crore(FROM.classes.individuals.accounts)} loan accounts at banks in
                                ${monthName(FROM.quarter)} and ${crore(TO.classes.individuals.accounts)} in
                                ${monthName(TO.quarter)}. The money lent to them grew ${G.outstanding.toFixed(1)} times.`}</Para>
                            <Para>{`The average loan to an individual went from ${lakh(AVG.y2015.all)} to ${lakh(AVG.y2026.all)}.
                                In ${monthName(TO.quarter)} rupees it is ${realLoanWords} ${y15}. After prices, the growth is in the
                                number of loans.`}</Para>
                            <Prose>
                                {prose(`Part of the growth is a change of lender, not new borrowing. On 1 July 2023 HDFC, a housing
                                    finance company, merged into HDFC Bank, and its loans joined the banks’ returns. In that
                                    quarter individuals’ share of bank credit went from ${rs(MERGER.individualsBefore)} to
                                    ${rs(MERGER.individualsAfter)} of every ₹100, and home loans grew ${Math.round(MERGER.housingGrowth)}%.
                                    The Reserve Bank put bank credit growth in the year to September 2023 at 15.7% without the merger and 19.8% with it`)}{" ("}
                                <Cite href={MERGER_URL}>RBI, 2023</Cite>
                                {")."}
                            </Prose>
                            <Prose last>
                                {prose(`The table counts loan accounts, and one person can hold several. A`)}{" "}
                                <Cite href={CARDS_URL}>TransUnion CIBIL report of July 2026</Cite>
                                {" counts 10.7 crore active credit cards held by 5.2 crore people in March 2026. The same bureau, which counts people across every kind of lender, put credit-active consumers at 28% of the credit-eligible population in March 2026, against 11% in March 2017 ("}
                                <Cite href={ACTIVE_URL}>TransUnion CIBIL, July 2026</Cite>
                                {")."}
                            </Prose>
                        </Chapter>
                    </div>
                    <div className="panel">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Loans to individuals, every quarter" units={`index, ${monthName(FROM.quarter)} = 100`}
                                table={{
                                    head : [ "Quarter", "Accounts", "Money", "Money after prices" ], numeric : [ false, true, true, true ],
                                    rows : INDEX.map(p => [ shortMonth(p.key), p.accounts.toFixed(0), p.money.toFixed(0), p.real.toFixed(0) ]),
                                }}
                                note={prose(`From the quarterly Basic Statistical Return, Table 3.2. Money after prices divides each quarter’s
                                    amount by the consumer price index for its last month. The marked quarter is ${monthName(TO.quarter)},
                                    where the multiples in the text end.`)}
                            >
                                <IndexLines />
                            </Figure>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* WHAT INDIVIDUALS BORROW FOR ============================================================================ */}
            <section className="chapter">
                <div className="row">
                    <div className="words">
                        <Chapter
                            id="what-for" kicker="WHAT INDIVIDUALS BORROW FOR"
                            title={`Personal loans went from ${rs(m15.personal)} to ${rs(m26.personal)} of every ₹100 banks lent, ${y15} to ${y26}`}
                        >
                            <Para>{`Personal loans to individuals made up ${rs(m26.personal)} of every ₹100 banks had lent in
                                ${monthName(TO.quarter)}, up from ${rs(m15.personal)} in ${monthName(FROM.quarter)}${personalAboveCompanies
                                    ? `, more than banks had lent to all private companies (${rs(m26.privateCompanies)})` : ""}.`}</Para>
                            <Para>{`Home loans are the largest kind. They ${moved(P15.housing.ofIndividuals, P26.housing.ofIndividuals)}
                                from ${rs(P15.housing.ofIndividuals)} to ${rs(P26.housing.ofIndividuals)} of every ₹100 lent to
                                individuals, and from ${rs(P15.housing.ofBook)} to ${rs(P26.housing.ofBook)} of every ₹100 of all bank
                                credit; part of that rise is HDFC’s home loans, which joined the banks in 2023. Other personal loans,
                                which cover everything but homes, vehicles, cards, consumer durables and education,
                                ${moved(P15.otherPersonal.ofIndividuals, P26.otherPersonal.ofIndividuals)} from
                                ${rs(P15.otherPersonal.ofIndividuals)} to ${rs(P26.otherPersonal.ofIndividuals)} of every ₹100 lent to
                                individuals.`}</Para>
                            <Para>{`Vehicle loans ${moved(P15.vehicles.ofIndividuals, P26.vehicles.ofIndividuals)} from
                                ${rs(P15.vehicles.ofIndividuals)} to ${rs(P26.vehicles.ofIndividuals)} and credit cards
                                ${moved(P15.cards.ofIndividuals, P26.cards.ofIndividuals)} from ${rs(P15.cards.ofIndividuals)} to
                                ${rs(P26.cards.ofIndividuals)}. Education loans ${moved(P15.education.ofIndividuals, P26.education.ofIndividuals)}
                                from ${rs(P15.education.ofIndividuals)} to ${rs(P26.education.ofIndividuals)}, and consumer durables
                                ${P15.durables.ofIndividuals === P26.durables.ofIndividuals ? `stayed at ${rs(P26.durables.ofIndividuals)}` : `${moved(P15.durables.ofIndividuals, P26.durables.ofIndividuals)} from ${rs(P15.durables.ofIndividuals)} to ${rs(P26.durables.ofIndividuals)}`}.`}</Para>
                            <Para last>{`Farm loans ${moved(H.occupations.y2015.agriculture.ofIndividuals, H.occupations.y2026.agriculture.ofIndividuals)}
                                from ${rs(H.occupations.y2015.agriculture.ofIndividuals)} to ${rs(H.occupations.y2026.agriculture.ofIndividuals)}
                                of every ₹100 lent to individuals, though the money lent for farming ${timesWords(agriGrowth)}. Loans to individuals
                                for trade, industry, services and transport together ${moved(business("y2015"), business("y2026"))}
                                from ${rs(business("y2015"))} to ${rs(business("y2026"))}.`}</Para>
                        </Chapter>
                    </div>
                    <div className="panel">
                        <Reveal delay={0.1}>
                            <Figure
                                title={`What individuals borrow for, March ${y15} and March ${y26}`} units="₹ of every ₹100 lent to individuals"
                                table={{
                                    head : [ "", `${shortMonth(FROM.quarter)}`, `${shortMonth(TO.quarter)}` ], numeric : [ false, true, true ],
                                    rows : mixOf(FROM).map((s, i) => [
                                        s.personal ? `Personal loans: ${PERSONAL_LABELS[s.key as PersonalKey].toLowerCase()}` : OCC_LABELS[s.key as OccKey],
                                        s.value.toFixed(1), mixOf(TO)[i].value.toFixed(1),
                                    ]),
                                }}
                                note="From the quarterly Basic Statistical Return, Table 3.2, credit to individuals by occupation, with personal loans split into the six kinds the table gives."
                            >
                                <MixBars />
                            </Figure>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* WOMEN ================================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div className="words">
                        <Chapter
                            id="women" kicker="WOMEN"
                            title={W.belowPeakPct > 0
                                ? `Women’s loan accounts peaked in ${monthName(W.peak.quarter)} and have fallen since`
                                : `Women’s loan accounts are at their peak in ${monthName(W.peak.quarter)}`}
                        >
                            <Para>{`Women held ${whole(W.accountsShare2026)} of every 100 loan accounts of individuals in
                                ${monthName(TO.quarter)} and ${rs(W.moneyShare2026)} of every ₹100 lent to individuals, up from
                                ${whole(W.accountsShare2015)} and ${rs(W.moneyShare2015)} in ${monthName(FROM.quarter)}.
                                ${addedWords} of the accounts added since ${y15} are women’s.`}</Para>
                            <Para>{`A woman’s average loan was ${lakh(AVG.y2026.women)} in ${monthName(TO.quarter)} and a man’s
                                ${lakh(AVG.y2026.men)}, or ₹${whole(100 * AVG.womenToMen2026)} for every ₹100. In ${y15} it was ₹${whole(100 * AVG.womenToMen2015)}, so
                                the gap in loan size has ${ratioMoved ? "barely moved" : AVG.womenToMen2026 > AVG.womenToMen2015 ? "narrowed" : "widened"}.`}</Para>
                            <Prose>
                                {prose(`Women’s accounts ${W.belowPeakPct > 0 ? "peaked" : "stand"} at ${crore(W.peak.accounts)} in
                                    ${monthName(W.peak.quarter)}. By ${monthName(LATEST.quarter)} they were ${crore(W.latestAccounts)},
                                    ${W.belowPeakPct.toFixed(1)}% fewer. The fall came at the same time as the retreat of microfinance
                                    lending from mid-2024, which`)}{" "}
                                <Link href="/stories/the-two-lakh-line" className="cite-link">The ₹2 lakh line</Link>
                                {" traces."}
                            </Prose>
                            {agri && (
                                <Para>{`Women’s share of the money lent to individuals for farming ${moved(agri.then, agri.now)} from
                                    ${rs(agri.then)} to ${rs(agri.now)} of every ₹100 between ${y15} and ${y26}.${roseMore.length
                                        ? ` Their share in ${roseMore.map(s => OCC_LABELS[s.key].toLowerCase()).join(" and ")} rose by more, from ${roseMore.map(s => rs(s.then)).join(" and ")} to ${roseMore.map(s => rs(s.now)).join(" and ")}.`
                                        : " No other occupation rose as much."}`}</Para>
                            )}
                            <Para last>{`These quarterly figures leave out the regional rural banks, which lend mostly in
                                villages. The annual return for ${monthName(TO.quarter)} includes them and adds ${crore(rrbAccounts)}
                                accounts of individuals. With them, women hold ${H.rrb.womenAccountsShare2026.toFixed(1)}% of
                                individuals’ accounts and ${rs(H.rrb.womenMoneyShare2026)} of every ₹100,
                                ${rrbClose ? "close to" : "against"} ${toWomenShare.toFixed(1)}% and ${rs(W.moneyShare2026)} without them.
                                No table that includes those banks splits an occupation by gender, so the farm figures leave
                                those banks out.`}</Para>
                        </Chapter>
                    </div>
                    <div className="panel">
                        <Reveal delay={0.1}>
                            <Figure
                                title="Women’s loan accounts and their share, every quarter" units={`${monthName(QUARTERS[0].quarter)} to ${monthName(LATEST.quarter)}`}
                                table={{
                                    head : [ "Quarter", "Women’s accounts", "Share of accounts", "Share of money" ], numeric : [ false, true, true, true ],
                                    rows : WOMEN_SERIES.map(p => [ shortMonth(p.key), crore(p.accounts, 2), `${p.accountsShare.toFixed(1)}%`, `${p.moneyShare.toFixed(1)}%` ]),
                                }}
                                note={prose(`From the quarterly Basic Statistical Return, Table 3.2, the individuals’ columns split by
                                    gender. Shares are of individuals’ accounts and of the money lent to individuals. DBIE has no
                                    ${missingWords} quarter, so the first step on the axis is ${numberWord(3 * (MISSING.length + 1))} months.`)}
                            >
                                <WomenPanels />
                            </Figure>
                        </Reveal>
                        <Reveal className="panel-next">
                            <Figure
                                title={`Women’s share of the money lent to individuals, by occupation, March ${y15} and March ${y26}`} units="₹ of every ₹100 lent to individuals for each"
                                table={{
                                    head : [ "Occupation", shortMonth(FROM.quarter), shortMonth(TO.quarter) ], numeric : [ false, true, true ],
                                    rows : SLOPE.map(s => [ OCC_LABELS[s.key], s.then.toFixed(1), s.now.toFixed(1) ]),
                                }}
                                note={prose(`From the quarterly Basic Statistical Return, Table 3.2. ${FOLDED.length
                                    ? `${FOLDED.map(k => OCC_LABELS[k]).join(" and ")}, under ₹1 of every ₹100 lent to individuals, ${FOLDED.length > 1 ? "are" : "is"} counted in all others, since so small an amount swings too much from year to year to compare.`
                                    : ""}`)}
                            >
                                <WomenSlope />
                            </Figure>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* IN SHORT =============================================================================================== */}
            <section className="in-short" id="in-short">
                <h2 className="so-title"><LetterRise text="In short" /></h2>
                <div className="so-grid">
                    <Reveal>
                        <Text className="so-kicker" weight="600">THE LARGEST SHARE</Text>
                        <h3>{prose(`Individuals owe ₹${whole(H.latest.individuals)} of every ₹100 banks have lent, private companies ₹${whole(H.latest.privateCompanies)}`)}</h3>
                        <Para>{`Individuals passed private companies in ${monthName(H.crossover)}. ${cap(swingPart)} of the change in
                            the gap since ${y15} came from companies’ smaller share, the rest from individuals’ larger one.
                            Lending to companies ${timesWords(G.companies)} in rupees and ${timesWords(G.companiesReal)} after
                            prices, while lending to individuals ${timesWords(G.outstandingReal)} after prices.`}</Para>
                        <Para last>{`The gap between the two peaked at ${rs(H.gapPeak.gap)} of every ₹100 in
                            ${monthName(H.gapPeak.quarter)}${gapNarrowed ? ` and has narrowed since, to ${rs(latestGap)} in ${monthName(H.latest.quarter)},
                            because lending to private companies sped up: it grew ${LATEST_YEAR.companies.toFixed(1)}% in the year
                            to ${monthName(H.latest.quarter)}, against ${LATEST_YEAR.companiesBefore.toFixed(1)}% a year before,
                            while lending to individuals grew ${LATEST_YEAR.individuals.toFixed(1)}%` : ""}.`}</Para>
                    </Reveal>
                    <Reveal delay={0.12}>
                        <Text className="so-kicker" weight="600">MORE LOANS</Text>
                        <h3>{prose(`Individuals’ loan accounts ${timesWords(G.accounts)}, and the average loan is ${realLoanWords.replace(/ than in$| as in$/, "")} after prices`)}</h3>
                        <Para last>{`Individuals held ${crore(TO.classes.individuals.accounts)} loan accounts in
                            ${monthName(TO.quarter)}. The average loan rose from ${lakh(AVG.y2015.all)} to ${lakh(AVG.y2026.all)},
                            ${loanPaceWords}. The table counts accounts, and one person can hold several, so it cannot
                            say how many people borrow.`}</Para>
                    </Reveal>
                    <Reveal delay={0.24}>
                        <Text className="so-kicker" weight="600">WOMEN</Text>
                        <h3>{prose(`Women hold ${whole(W.accountsShare2026)} of every 100 accounts of individuals and ${rs(W.moneyShare2026)} of every ₹100`)}</h3>
                        <Para last>{`Their average loan is ₹${whole(100 * AVG.womenToMen2026)} for every ₹100 of a man’s.
                            Their accounts peaked in ${monthName(W.peak.quarter)} and were ${W.belowPeakPct.toFixed(1)}% fewer by
                            ${monthName(LATEST.quarter)}.${rrbClose ? " Counted with the regional rural banks, the shares are much the same." : ""}`}</Para>
                    </Reveal>
                </div>
                <WordReveal
                    className="closing"
                    text={prose(`In ${monthName(H.latest.quarter)} individuals owed ₹${whole(H.latest.individuals)} of every ₹100 banks
                        had lent, and private companies ₹${whole(H.latest.privateCompanies)}. In ${monthName(FROM.quarter)} they owed
                        ₹${whole(m15.individuals)} and ₹${whole(m15.privateCompanies)}.`)}
                />
            </section>

            {/* SOURCES & METHOD ======================================================================================= */}
            <section className="sources" id="tloc-sources">
                <div>
                    <h3>SOURCES</h3>
                    <Text size="tiny" marginBottom="micro">
                        {prose(`Reserve Bank of India, Basic Statistical Returns of scheduled commercial banks, as published on
                            DBIE. The quarterly BSR-1 Table 3.2, organisation-wise classification of outstanding credit
                            according to occupation, ${monthName(QUARTERS[0].quarter)} to ${monthName(LATEST.quarter)}, which leaves
                            out the regional rural banks (DBIE report 958). The annual BSR-1 for ${monthName(TO.quarter)}, which
                            includes them: Table 3.2 (report 1092) and Table 1.11 for the split by gender (report 1137). Prices
                            are MoSPI’s consumer price index, rural and urban combined, general index, base 2012 = 100 (report 610),
                            carried on by the base 2024 = 100 series in the RBI Monthly Bulletin (report 45). Counts of people
                            rather than accounts are from TransUnion CIBIL (8 and 30 July 2026). The effect of the HDFC merger is
                            from the Reserve Bank’s press release on the quarterly returns for September 2023 (1 December 2023).
                            Further reading: Ministry of Finance, Economic Survey 2016-17, Volume 1, Chapter 4, “The festering
                            twin balance sheet problem”; J. M. Anthony, S. Shankar and S. Sahoo, “Sectoral deployment of bank
                            credit in India”, RBI Bulletin, February 2019; V. S. Shekhawat, A. K. Shukla, A. C. V. Subrahmanyam
                            and J. Ansari, “Dynamics of credit growth in the retail segment: risk and stability concerns”, RBI
                            Bulletin, January 2024; International Monetary Fund, India: 2024 Article IV consultation, Country
                            Report 25/54, February 2025.`)}
                    </Text>
                    <h3>DOWNLOADS</h3>
                    {DOWNLOADS.map(([ file, label ]) => (
                        <Div key={file}>
                            <Link href={`/stories/the-lights-came-on/${file}`} download className="download-link">
                                <Div verticallyCentreItems marginBottom="nano">
                                    <Download size="16px" />
                                    <Text weight="600" marginLeft="nano" size="tiny">Download {label} (CSV)</Text>
                                </Div>
                            </Link>
                        </Div>
                    ))}
                    <Div>
                        <Link href="/publications/credit-classification" className="download-link">
                            <Div verticallyCentreItems marginTop="nano" marginBottom="nano">
                                <Table2 size="16px" />
                                <Text weight="600" marginLeft="nano" size="tiny">Go to the credit classification tables</Text>
                            </Div>
                        </Link>
                    </Div>
                </div>
                <div>
                    <h3>METHOD</h3>
                    <MethodNote title="Accounts, not people.">{`Every count here is of loan accounts. One person can hold several,
                        and each credit card is one. The Reserve Bank publishes no count of distinct bank borrowers, so the
                        story never turns accounts into people. The counts of people it cites come from a credit bureau.`}</MethodNote>
                    <MethodNote title="Two sets of figures.">{`The quarterly table leaves out the regional rural banks, and every
                        figure that moves through time comes from it. The annual return for ${monthName(TO.quarter)} includes
                        them: with them individuals hold ${rs(H.rrb.individualsShareOfBook2026)} of every ₹100 lent, against
                        ${rs(m26.individuals)} without, and women ${H.rrb.womenAccountsShare2026.toFixed(1)}% of individuals’
                        accounts and ${rs(H.rrb.womenMoneyShare2026)} of every ₹100 lent to individuals. The two are never mixed in one number.`}</MethodNote>
                    <MethodNote title="Prices.">{`Amounts after prices are divided by the consumer price index, general
                        index, rural and urban combined, for the last month of each quarter, and stated in
                        ${monthName(TO.quarter)} rupees. The index was ${CPI[FROM.quarter]} in ${monthName(FROM.quarter)} and
                        ${CPI[TO.quarter]} in ${monthName(TO.quarter)}, a rise of ${pricesRise}%. The base 2012
                        series ends in December 2025, so ${CPI_LINKED.map(monthName).join(" and ")} carry it on by the
                        year-on-year change of the base 2024 series.`}</MethodNote>
                    <MethodNote title="The quarters.">{`The series starts in ${monthName(QUARTERS[0].quarter)} and DBIE has no
                        ${missingWords} quarter. The latest quarter is ${monthName(LATEST.quarter)}. Shares in the opening and In short
                        are for the latest quarter; the chapters compare ${monthName(FROM.quarter)} with
                        ${monthName(TO.quarter)}, so that a year is compared with a year.`}</MethodNote>
                    <MethodNote title="A change of lender.">{`The returns cover scheduled commercial banks only. When HDFC, a
                        housing finance company, merged into HDFC Bank on 1 July 2023, its loans entered the returns from the
                        ${monthName(MERGER.after.quarter)} quarter. That moves existing loans into the banks’ figures; it is
                        not new borrowing. The series is not adjusted for it, as the Reserve Bank’s tables are not.`}</MethodNote>
                    <MethodNote title="Rounding.">{`The quarterly amounts are published to the whole crore. Shares are rounded
                        to one decimal, and multiples to one decimal or put in words.`}</MethodNote>
                    <MethodNote title="Nothing typed by hand." last>{`Every figure from the returns and the price index is read
                        from the DBIE tables by a program that checks the totals of each table every time it runs, and the
                        sentences use those same figures. The only figures typed in are the credit bureau’s and the Reserve
                        Bank’s growth with and without the HDFC merger, each named where it appears.`}</MethodNote>
                </div>
            </section>
        </Article>
    </MotionConfig>
);
