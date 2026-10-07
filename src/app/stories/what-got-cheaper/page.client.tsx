"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { Article, Button, Card, Div, Divider, Heading1, Heading4, Heading6, Portion, Row, Section, Text } from "fictoan-react";
import { BookOpen, Download, Table2 } from "lucide-react";
import { MotionConfig } from "framer-motion";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { BasketWidget } from "./BasketWidget";
import { Figure } from "./chartKit";
import { FanChart } from "./FanChart";
import { HBars } from "./HBars";
import { LongChart } from "./LongChart";
import { CountUp, LetterRise, Reveal } from "./Motion";
import { PriceStage } from "./PriceStage";
import type { SceneId } from "./stageLayout";

// DATA ================================================================================================================
import {
    AGRI_CPI, BULLION, CHEAPER, CHEAPER_IN_WORK, COUNTS, CPI_FY_WINDOW, CPI_GENERAL, CPI_SHOWN, DOUBLED, FLAT, FOLLOWED, GAP_SHARES, GROUPS, HEADLINE,
    HEAVIEST, IN_WORK, ITEMS, KEPT_PACE_UNTIL, LINKS, LONG, LONG_RANGE, LONG_TIMES, MAJORS, MAJOR_PLAIN, MISFILED, MONTHS, RISE, RISERS, RURAL_CPI,
    STALE_CHEAPER, TRIPLED, WAGES_BY_RISE, WAGE_RISE, WPI_CALENDAR, WPI_RISE_CAL, WPI_RISE_WAGE_WINDOW, YARD, YARDSTICK, YEARLY, YEARS, cpiNamed,
    cpiRise, cpiRiseFy, inr, itemOfFollowed, list, monthName, numberWord, pct, rs, shareOf, signed, timesWords, wageNamed, weightOf,
} from "./data";

// STYLES ==============================================================================================================
import "./what-got-cheaper.css";

// THE WORDS ===========================================================================================================
// The sentences are template strings over the derived figures, so a refresh of the data rewrites them; prose() folds
// the line breaks of the source into single spaces.
const prose = (s : string) => s.replace(/\s+/g, " ").trim();
const cap = (s : string) => s.charAt(0).toUpperCase() + s.slice(1);
const NOW = HEADLINE.nowFy, BASE = HEADLINE.baseFy;
const LAST = monthName(HEADLINE.lastMonth);
const ACTUAL = Math.round(HEADLINE.all);

// The goods the sentences name, by the story's names for them.
const solar = itemOfFollowed("Solar power systems"), cancer = itemOfFollowed("Anti-cancer drugs"), tv = itemOfFollowed("Colour TVs"), blankets = itemOfFollowed("Blankets");
const jasmine = itemOfFollowed("Jasmine"), gold = itemOfFollowed("Gold and ornaments"), silver = itemOfFollowed("Silver"), coconut = itemOfFollowed("Coconuts"), tomato = itemOfFollowed("Tomatoes");
const kerosene = itemOfFollowed("Kerosene"), lpg = itemOfFollowed("LPG"), milk = itemOfFollowed("Milk"), diesel = itemOfFollowed("Diesel"), petrol = itemOfFollowed("Petrol");
const electricity = itemOfFollowed("Electricity"), wheat = itemOfFollowed("Wheat"), rice = itemOfFollowed("Rice"), eggs = itemOfFollowed("Eggs"), sugar = itemOfFollowed("Sugar");
const cement = itemOfFollowed("Cement"), urea = itemOfFollowed("Urea"), ac = itemOfFollowed("Air conditioners"), fridge = itemOfFollowed("Refrigerators"), phones = itemOfFollowed("Telephones and mobile handsets");
const pcFlat = FLAT.find(f => f.label === "Personal Computer (P.C.)"), laptopFlat = FLAT.find(f => f.label === "Laptops");
const [ primary, fuel, made ] = COUNTS.byMajor;
// A good as the story says it: the followed name where there is one, else DBIE's label in lower case.
const plainName = (it : { code : string; label : string }) => FOLLOWED.find(f => f.code === it.code)?.name.toLowerCase() ?? it.label.toLowerCase();
const itemNamedOr = (label : string) => ITEMS.find(i => i.label === label) ?? null;
const cheaperMade = CHEAPER.filter(i => i.major === 2).length;
const gapToTypical = Math.round(HEADLINE.all - COUNTS.medianItem);
const flatCheaper = CHEAPER.filter(i => FLAT.some(f => f.code === i.code));
const milkPoints = milk.weight * (milk.now - 100) / 100;
const doubledGrown = DOUBLED.filter(i => i.major === 0).length;
const topFallers = CHEAPER.slice(0, 4), topRisers = DOUBLED.slice(0, 3);
const heaviest = HEAVIEST.slice(0, 3);
const wageRisePct = Math.round(100 * (WAGE_RISE - 1)), basketRiseWagePct = Math.round(100 * (WPI_RISE_WAGE_WINDOW - 1));
const dearerInWork = IN_WORK.filter(i => i.inWork >= 1);
const dearerNamed = [ "Silver", "Jasmine", "Coconuts" ].map(itemOfFollowed).filter(i => i.inWork !== null && i.inWork >= 1).map(i => i.label === silver.label ? "silver" : i.label === jasmine.label ? "jasmine" : "coconuts");
const first = LONG[0], lastLong = LONG[LONG.length - 1];
const longTimes = (k : "all" | "primary" | "fuel" | "manufactured") => LONG_TIMES[k];
const aboutTimes = (v : number) => `about ${Math.round(v)} times`;
const cpiRisePct = Math.round(cpiRise("C_GIAG")), wpiRiseCalPct = Math.round(WPI_RISE_CAL);
const health = Math.round(cpiRise("C_GIAG_MS_HTH")), education = Math.round(cpiRise("C_GIAG_MS_ED")), housing = Math.round(cpiRise("C_GIAG_HO")), transport = Math.round(cpiRise("C_GIAG_MS_TC"));
const personalCare = Math.round(cpiRise("C_GIAG_MS_PCE")), foodCpi = Math.round(cpiRise("C_GIAG_FB")), clothingCpi = Math.round(cpiRise("C_GIAG_CF"));
const carpenter = wageNamed("WR07"), farm = YARDSTICK.farm;
const ruralCpiPct = Math.round(100 * (RURAL_CPI.times - 1));
const healthLeadExact = Math.round(cpiRise("C_GIAG_MS_HTH") - cpiRise("C_GIAG")), educationLeadExact = Math.round(cpiRise("C_GIAG_MS_ED") - cpiRise("C_GIAG")), housingLeadExact = Math.round(cpiRise("C_GIAG_HO") - cpiRise("C_GIAG"));
const educationLeadFy = Math.round(cpiRiseFy("C_GIAG_MS_ED") - cpiRiseFy("C_GIAG"));
const foodWpiCal = Math.round(100 * (WPI_CALENDAR.food.to / WPI_CALENDAR.food.from - 1));
const farmAgainstAgriCpi = Math.round(100 * (COUNTS.inWork.farmRise / AGRI_CPI.times - 1));
const stateEqualPct = Math.round(100 * (COUNTS.inWork.stateEqualRise - 1));
const wageAgainstRuralCpi = Math.round(100 * (WAGE_RISE / RURAL_CPI.times - 1));            // what the day buys against the rural CPI, per cent
const wageAgainstBasket = Math.round(100 * (WAGE_RISE / WPI_RISE_WAGE_WINDOW - 1));
const zincMetal = ITEMS.find(i => /^Zinc Metal/.test(i.label)), zincOre = ITEMS.find(i => i.label === "Zinc Concentrate");
const at = (name : string, ym : string) => { const f = FOLLOWED.find(x => x.name === name); const k = MONTHS.indexOf(ym); if (!f || k < 0) throw new Error(`${name} ${ym}`); return f.series[k]; };
const solarLow = at("Solar power systems", "2020-03"), solar2022 = at("Solar power systems", "2022-03"), solar2023 = at("Solar power systems", "2023-03"), cancer2017 = at("Anti-cancer drugs", "2017-03");
const garnet = itemNamedOr("Garnet"), ginger = itemNamedOr("Ginger(Dry)");
const cancerAtCap = [ "2019-02", "2019-03", "2019-04", "2019-05" ].map(m => at("Anti-cancer drugs", m));
const cancerFlatAtCap = Math.min(...cancerAtCap.slice(1)) >= cancerAtCap[0];            // no month from March to May 2019 below February

// The guess against the answer, once the reader has locked one in.
const guessVerdict = (g : number) => {
    if (g === ACTUAL) return `Your guess of ₹${g} was exactly right.`;
    if (Math.abs(g - ACTUAL) <= 8) return `Your guess of ₹${g} was close to the answer, ₹${ACTUAL}.`;
    if (g <= 100) return `Your guess was ₹${g}: no rise at all. It was ${ACTUAL - 100}%.`;
    const r = (g - 100) / (ACTUAL - 100);
    return g > ACTUAL && r >= 1.85
        ? `Your guess of ₹${g} put the rise at ${timesWords(r)} what it was, ${ACTUAL - 100}%.`
        : `Your guess of ₹${g} put the rise at ${g - 100}%. It was ${ACTUAL - 100}%.`;
};

// THE OPENING =========================================================================================================
const STEPS : SceneId[] = [ "hero", "block", "spread", "guess", "answer", "cheaper", "doubled", "majors", "weighted", "work" ];

const StepCard = ({ active, kicker, big, title, children } : { active : boolean; kicker : string; big ? : ReactNode; title : ReactNode; children ? : ReactNode }) => (
    <Card className={`step-card ${active ? "is-active" : ""}`} padding="micro">
        <Text className="step-kicker" weight="600" size="small" marginBottom="nano">{kicker}</Text>
        {big && <div className="step-big">{big}</div>}
        <Heading6 className="step-title" fontStyle="serif" weight="600" marginBottom="nano">{title}</Heading6>
        {children}
    </Card>
);

const Say = ({ children, marginTop, marginBottom } : { children : string; marginTop ? : "nano"; marginBottom ? : "nano" }) => <Text fontStyle="serif" marginTop={marginTop} marginBottom={marginBottom}>{prose(children)}</Text>;

const TheOpening = () => {
    const [ scene, setScene ] = useState<SceneId>("hero");
    const [ guess, setGuess ] = useState(200);
    const [ locked, setLocked ] = useState<number | null>(null);
    const stepRefs = useRef<Record<string, HTMLElement | null>>({});

    // Each step claims the stage as it crosses the middle of the screen.
    useEffect(() => {
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) if (e.isIntersecting) setScene((e.target as HTMLElement).dataset.scene as SceneId);
        }, { rootMargin : "-45% 0px -45% 0px", threshold : 0 });
        Object.values(stepRefs.current).forEach(el => el && io.observe(el));
        return () => io.disconnect();
    }, []);

    const ref = (id : SceneId) => (el : HTMLElement | null) => { stepRefs.current[id] = el; };
    const on = (id : SceneId) => scene === id;
    const lockIn = () => {
        setLocked(guess);
        stepRefs.current.answer?.scrollIntoView({ behavior : matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block : "center" });
    };
    void STEPS;

    return (
        <Div className="act">
            <Div className="stage">
                <PriceStage scene={scene} />
            </Div>

            <Div className="steps">
                {/* THE TITLE ================================================================================ */}
                <Div className="step is-hero" data-scene="hero" ref={ref("hero")}>
                    <Div className="title-card">
                        <PageCrumbs />
                        <Text className="hero-kicker" weight="600" marginBottom="nano">PRICES</Text>
                        <Heading1 className="hero-title" marginBottom="micro">
                            What got <span className="accent">cheaper</span>
                        </Heading1>
                        <Text className="hero-sub" fontStyle="serif" size="large">
                            {prose(`What cost ₹100 at wholesale in ${BASE} cost ${rs(HEADLINE.all)} in ${NOW}. Not every good rose with it:
                                solar power systems cost ${rs(solar.now)} for every ₹100, while jasmine costs ${rs(jasmine.now)}.
                                Using the government’s wholesale price index good by good,
                                we ask which of its ${inr(COUNTS.items)} goods got cheaper, which got dearer, and by how much.`)}
                        </Text>
                        <Text size="small" className="hero-cue" marginTop="small">The story continues below</Text>
                    </Div>
                </Div>

                {/* THE BASKET =============================================================================== */}
                <Div className="step" data-scene="block" ref={ref("block")}>
                    <StepCard active={on("block")} kicker="THE BASKET" title="goods in the basket" big={<CountUp start={on("block")} to={COUNTS.items} format={v => inr(Math.round(v))} />}>
                        <Say>{`Each dot is one good in the wholesale price index. Of the ${COUNTS.items}, ${primary.items} are grown, reared or
                            mined, ${fuel.items} are fuel and power, and ${made.items} are made in factories. Each carries a weight, its share of
                            the value of goods traded in India in ${BASE}.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="spread" ref={ref("spread")}>
                    <StepCard active={on("spread")} kicker={`${BASE} TO ${NOW}`} title={`What ₹100 of each good in ${BASE} costs now`}>
                        <Say>{`The typical good costs ${rs(COUNTS.medianItem)} for every ₹100 it cost in ${BASE}. ${cap(shareOf(100 * COUNTS.underHalfUp / COUNTS.items, "goods"))},
                            ${COUNTS.underHalfUp} of the ${COUNTS.items}, cost between ₹100 and ₹150, and ${COUNTS.halfToDouble} between ₹150 and ₹200.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="guess" ref={ref("guess")}>
                    <StepCard active={on("guess")} kicker="BEFORE THE ANSWER" title={`Weighing every good by its share of the basket, what does ₹100 of ${BASE} goods cost in ${NOW}?`}>
                        <Div className="guess-row">
                            <input
                                type="range" min={100} max={300} step={1} value={guess} onChange={e => setGuess(+e.target.value)}
                                aria-label={`Your guess, in rupees of every ₹100 in ${BASE}`}
                            />
                            <Text className="guess-value" weight="700">₹{guess}</Text>
                        </Div>
                        <Button kind="primary" size="small" marginTop="nano" onClick={lockIn}>Lock in my guess ↓</Button>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="answer" ref={ref("answer")}>
                    <StepCard active={on("answer")} kicker="THE ANSWER" big={<CountUp start={on("answer")} to={ACTUAL} format={v => `₹${Math.round(v)}`} />} title={`for every ₹100 in ${BASE}`}>
                        {locked !== null && <Text className="guess-verdict" weight="600" marginBottom="nano">{guessVerdict(locked)}</Text>}
                        <Say>{`Wholesale prices rose by ${Math.round(RISE)}% in fourteen years, or ${YEARLY.toFixed(1)}% a year. The whole
                            basket stands ₹${gapToTypical} above the typical good, because the goods that rose most rose much further
                            than any fell: the ${COUNTS.doubled} that doubled weigh ₹${COUNTS.weightDoubled.toFixed(1)} of every ₹100 but supply
                            ${Math.round(COUNTS.points.doubled)} of the ${Math.round(RISE)} points of the rise. In ${LAST}, the last month of the series,
                            the same goods cost ${rs(HEADLINE.allLatest)}, a provisional figure, after fuel and power jumped ${Math.round(HEADLINE.fuelJumpPct)}% in a month.`}</Say>
                    </StepCard>
                </Div>

                {/* THE TWO ENDS ============================================================================= */}
                <Div className="step" data-scene="cheaper" ref={ref("cheaper")}>
                    <StepCard active={on("cheaper")} kicker="WHAT GOT CHEAPER" big={<CountUp start={on("cheaper")} to={COUNTS.cheaper} format={v => `${Math.round(v)}`} />} title={`goods cost less in rupees than in ${BASE}`}>
                        <Say>{`Solar power systems cost ${rs(solar.now)} for every ₹100 they cost in ${BASE}, anti-cancer drugs ${rs(cancer.now)},
                            blankets ${rs(blankets.now)} and colour TVs ${rs(tv.now)}. Of the ${COUNTS.cheaper}, ${numberWord(cheaperMade)} are made
                            in factories, and together they weigh ₹${COUNTS.weightCheaper.toFixed(1)} of every ₹100 in the basket.`}</Say>
                        <Say>{`${cap(numberWord(COUNTS.stale.amongCheaper))} of the ${COUNTS.cheaper} hardly ever changed: in half their months or
                            more the index did not move, or it stood still for two years or more, which can be a price carried
                            forward rather than a price that fell. ${cap(numberWord(COUNTS.stale.cheaperNear))} more are within 5% of ${BASE}.
                            The ${numberWord(COUNTS.stale.cheaperFair)} that fell further, in prices that moved most months, ${COUNTS.stale.cheaperFairMade === COUNTS.stale.cheaperFair ? "are all made in factories" : `include ${numberWord(COUNTS.stale.cheaperFairMade)} made in factories`}
                            and weigh ₹${COUNTS.stale.cheaperFairWeight.toFixed(1)}.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="doubled" ref={ref("doubled")}>
                    <StepCard active={on("doubled")} kicker="WHAT DOUBLED" big={<CountUp start={on("doubled")} to={COUNTS.doubled} format={v => `${Math.round(v)}`} />} title={`goods cost at least twice what they did in ${BASE}`}>
                        <Say>{`Jasmine costs ${rs(jasmine.now)} for every ₹100, ${topRisers[1].label.toLowerCase()} ${rs(topRisers[1].now)}, coconuts
                            ${rs(coconut.now)}, tomatoes ${rs(tomato.now)}, silver ${rs(silver.now)} and wheat ${rs(wheat.now)}.
                            Of the ${COUNTS.doubled}, ${numberWord(doubledGrown)} are grown, reared or mined, and ${numberWord(TRIPLED.length)} goods
                            have tripled.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="majors" ref={ref("majors")}>
                    <StepCard active={on("majors")} kicker="GROWN AGAINST MADE" title={`The typical grown good costs ${rs(primary.median)} for every ₹100 in ${BASE}; the typical factory-made good ${rs(made.median)}`}>
                        <Say>{`Of the ${primary.items} grown or mined goods, ${primary.doubled} have doubled; of the ${made.items} factory-made goods,
                            ${made.doubled} have. The typical fuel and power item costs ${rs(fuel.median)}, close to the factory goods, with
                            kerosene at ${rs(kerosene.now)} and LPG at ${rs(lpg.now)}. Taken as groups at their weights, grown goods stand at
                            ${rs(HEADLINE.primary)}, fuel and power at ${rs(HEADLINE.fuel)} and factory goods at ${rs(HEADLINE.manufactured)}.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="weighted" ref={ref("weighted")}>
                    <StepCard active={on("weighted")} kicker="WHERE THE RUPEES ARE" title="Where the rise came from">
                        <Say>{`Sized by weight, ${heaviest.map(h => `${plainName(h)} is ₹${h.weight.toFixed(2)}`).join(", ").replace(/, ([^,]*)$/, " and $1")}
                            of every ₹100 in the basket. The ${TRIPLED.length} goods that tripled weigh ₹${COUNTS.weightTripled.toFixed(2)} between them
                            and supply ${COUNTS.points.tripled < 2 ? "under 2" : Math.round(COUNTS.points.tripled)} of the ${Math.round(RISE)} points of the rise. Milk, the
                            heaviest good, stands at ${rs(milk.now)} and supplies ${Math.round(milkPoints)} points on its own.`}</Say>
                    </StepCard>
                </Div>

                <Div className="step" data-scene="work" ref={ref("work")}>
                    <StepCard active={on("work")} kicker="IN DAYS OF WORK" big={<><CountUp start={on("work")} to={COUNTS.inWork.cheaper} format={v => `${Math.round(v)}`} /><span className="big-of"> of {COUNTS.inWork.items}</span></>} title={`goods cost fewer days’ wages at wholesale than in ${HEADLINE.wageWindow.from}`}>
                        <Say>{`A rural labourer’s day off the farm paid ₹${Math.round(YARD.from)} in ${HEADLINE.wageWindow.from} and ₹${Math.round(YARD.to)} in
                            ${HEADLINE.wageWindow.to}, a rise of ${wageRisePct}%. The basket rose ${basketRiseWagePct}% over the same years.
                            Measured in days of work, ${COUNTS.inWork.cheaper} goods got cheaper and ${COUNTS.inWork.dearer} got dearer${dearerNamed.length ? `, among them ${list(dearerNamed)}` : ""}.
                            Against the prices rural labourers pay, which rose ${ruralCpiPct}%, the same day buys ${Math.abs(wageAgainstRuralCpi) <= 3 ? "about what it did" : wageAgainstRuralCpi > 0 ? `${wageAgainstRuralCpi}% more` : `${-wageAgainstRuralCpi}% less`}.`}</Say>
                    </StepCard>
                </Div>
            </Div>
        </Div>
    );
};

// THE CHAPTERS ========================================================================================================
const Chapter = ({ kicker, title, children, id } : { kicker : string; title : string; children : ReactNode; id : string }) => (
    <Reveal>
        <Text className="kicker" weight="600" marginBottom="nano" id={id}>{kicker}</Text>
        <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="micro">{title}</Heading4>
        {children}
    </Reveal>
);

const Para = ({ children, last = false } : { children : string; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{prose(children)}</Text>;
const Prose = ({ children, last = false } : { children : ReactNode; last ? : boolean }) => <Text fontStyle="serif" marginBottom={last ? undefined : "nano"}>{children}</Text>;
const Cite = ({ href, children } : { href : string; children : ReactNode }) => <a href={href} target="_blank" rel="noopener" className="cite-link">{children}</a>;

// The fan's presets: which of the followed goods to draw.
const PRESETS : { key : string; label : string; names : string[] }[] = [
    { key : "fell",   label : "What fell",        names : [ "Solar power systems", "Anti-cancer drugs", "Blankets", "Colour TVs", "Air conditioners", "Refrigerators", "Telephones and mobile handsets" ] },
    { key : "daily",  label : "Everyday food",    names : [ "Milk", "Wheat", "Rice", "Eggs", "Sugar", "Tea", "Potatoes", "Onions", "Tomatoes" ] },
    { key : "fuel",   label : "Fuel and power",   names : [ "Petrol", "Diesel", "LPG", "Electricity", "Kerosene" ] },
    { key : "made",   label : "Factory goods",    names : [ "Cement", "Urea", "Cotton yarn", "Shirts", "Motorcycles", "Bicycles" ] },
    { key : "rose",   label : "What rose most",   names : [ "Silver", "Gold and ornaments", "Coconuts", "Jasmine", "Tomatoes", "Kerosene" ] },
];

const SOURCES : [ string, string ][] = [
    [ "wpi-items.csv", `every good, ${BASE} to ${NOW}` ],
    [ "wpi-groups-monthly.csv", `the basket and its ${GROUPS.length} groups, month by month` ],
    [ "wpi-followed-items-monthly.csv", `the ${FOLLOWED.length} goods the lines follow, month by month` ],
    [ "wpi-since-1982.csv", "the basket since 1982-83" ],
    [ "cpi-groups.csv", "consumer prices by group, 2013 and 2025" ],
    [ "rural-wages.csv", "rural daily wages by occupation" ],
];

const READING : { title : string; href : string; note : string }[] = [
    { title : "Office of the Economic Adviser (2017). Manual on wholesale price index, base 2011-12.", href : "https://eaindustry.nic.in/uploaded_files/WPI_Manual.pdf", note : "How the index is made: the basket, the weights, the quotations, the geometric mean, the seasonal rule and how late prices are repeated or estimated." },
    { title : "Office of the Economic Adviser (2026). Report of the working group on the base revision to 2022-23, and the note on methodology.", href : "https://eaindustry.nic.in/uploaded_files/wpi/Working_Group_Report.pdf", note : "What replaced this series in June 2026, why the 2011-12 series carried stale quotes, and the government’s own line that primary articles rose about 77% and manufactures about 43% to 2022-23." },
    { title : "Nordhaus (2008). Baumol’s diseases: a macroeconomic perspective. B.E. Journal of Macroeconomics.", href : "https://www.nber.org/papers/w12218", note : "Across American industries a point more of productivity growth takes about a point off relative price: the organising idea behind grown against made." },
    { title : "Helland and Tabarrok (2019). Why are the prices so damn high? Mercatus Center.", href : "https://www.mercatus.org/research/books/why-are-prices-so-damn-high", note : "The readable account of why services get dearer while goods get cheaper, with a test that finds little evidence for regulation as the cause." },
    { title : "Way, Ives, Mealy and Farmer (2022). Empirically grounded technology forecasts and the energy transition. Joule.", href : "https://ora.ox.ac.uk/objects/uuid:17256b64-f822-40ef-8770-5d0fa1ddc73e", note : "Why solar got cheap at about 10% a year and why forecasters kept missing it." },
    { title : "Nordhaus (1996). Do real-output and real-wage measures capture reality? The history of lighting suggests not.", href : "https://www.nber.org/system/files/chapters/c6064/c6064.pdf", note : "The price of light in hours of work, from Babylon to the present: an early scholarly measure of a price in hours of work." },
    { title : "Moulton (2018). The measurement of output, prices, and productivity: what’s changed since the Boskin Commission? Brookings.", href : "https://www.brookings.edu/wp-content/uploads/2018/07/Moulton-report-v2.pdf", note : "What price indices still get wrong about new goods and quality, and why an index without quality adjustment shows electronics falling less than they do." },
    { title : "Jaravel (2021). Inflation inequality: measurement, causes, and policy implications. Annual Review of Economics.", href : "https://ideas.repec.org/a/anr/reveco/v13y2021p599-629.html", note : "Why one inflation rate hides many: households with different baskets face different prices." },
    { title : "Reserve Bank of India (2014). Report of the expert committee to revise and strengthen the monetary policy framework.", href : "https://rbi.org.in/scripts/PublicationReportDetails.aspx?ID=743", note : "Why the Reserve Bank stopped steering by the wholesale index: no services, retail quotes for some goods, and large revisions." },
    { title : "Das and George (2017). Comparison of consumer and wholesale price indices in India. RBI working paper 05/2017.", href : "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=17450", note : "The Reserve Bank’s own decomposition of why the two indices part: food’s weight and services." },
    { title : "Our World in Data (2026). Explore updated data on how consumer prices have changed in the United States.", href : "https://ourworldindata.org/explore-updated-data-on-how-consumer-prices-have-changed-in-the-united-states", note : "Since 1997 college tuition in the United States has more than tripled and televisions have fallen by 98%; the chart notes that medical care is not adjusted for quality." },
];

// Any of the goods, looked up by name: its value, its group and its weight.
const LookUp = () => {
    const [ q, setQ ] = useState("");
    const hit = ITEMS.find(i => i.label.toLowerCase() === q.trim().toLowerCase()) ?? (q.trim().length >= 3 ? ITEMS.find(i => i.label.toLowerCase().includes(q.trim().toLowerCase())) : undefined);
    return (
        <div className="lookup">
            <label className="lookup-label" htmlFor="wgc-lookup">{`Look up any of the ${inr(COUNTS.items)} goods`}</label>
            <input id="wgc-lookup" className="lookup-input" list="wgc-goods" value={q} onChange={e => setQ(e.target.value)} placeholder="Type a good: onion, cement, gold…" autoComplete="off" />
            <datalist id="wgc-goods">{ITEMS.map(i => <option key={i.code} value={i.label} />)}</datalist>
            <p className="lookup-result" aria-live="polite">
                {hit
                    ? prose(`${hit.label}: ${rs(hit.now)} for every ₹100 in ${BASE}, ${signed(hit.now)}. ${GROUPS[hit.group].label}, ${MAJOR_PLAIN[hit.major].toLowerCase()}.
                        Weight ₹${hit.weight >= 0.1 ? hit.weight.toFixed(2) : hit.weight.toFixed(3)} of every ₹100 in the basket.${hit.priced < 12 ? ` Priced in ${hit.priced} months of ${NOW}.` : ""}${hit.inWork !== null ? ` In days of a labourer’s work, ${hit.inWork < 1 ? `${Math.round(100 * (1 - hit.inWork))}% cheaper` : `${Math.round(100 * (hit.inWork - 1))}% dearer`} than in ${HEADLINE.wageWindow.from}.` : ""}${hit.flat >= 24 ? ` Its index did not change for ${hit.flat} months in a row.` : ""}`)
                    : q.trim() ? "No good by that name in the index." : " "}
            </p>
        </div>
    );
};

const MethodNote = ({ title, children, last = false } : { title : string; children : string; last ? : boolean }) => (
    <Text size="tiny" marginBottom={last ? undefined : "nano"}>
        <strong>{title}</strong>{" "}{prose(children)}
    </Text>
);

// The bars of the receipts: DBIE's item labels without their bracketed specifications.
const barLabel = (label : string) => {
    let l = label.replace(/\s*\[.*?\]/g, "").replace(/\s*\/.*$/, "").replace(/\s+/g, " ").trim();
    if (l.length > 30) l = l.replace(/\s*\(.*?\)/g, "").trim();
    if (l.length > 30) l = l.replace(/\s+Or\s+.*$/i, "").trim();
    return l;
};
const groupKind = (major : number) => ([ "third", "second", "accent" ] as const)[major];
const cpiRows = [
    ...CPI_SHOWN.map(g => ({ key : g.code, label : g.name, value : cpiRise(g.code), kind : (g.kind === "service" ? "accent" : "muted") as "accent" | "muted", tip : [ `${cpiNamed(g.code).from.toFixed(1)} in ${cpiNamed(g.code).fromYear}, ${cpiNamed(g.code).to.toFixed(1)} in ${cpiNamed(g.code).toYear} (2012 = 100)` ] })),
    { key : "cpi", label : "All consumer prices", value : cpiRise("C_GIAG"), kind : "total" as const, tip : [ `${CPI_GENERAL.from.toFixed(1)} in ${CPI_GENERAL.fromYear}, ${CPI_GENERAL.to.toFixed(1)} in ${CPI_GENERAL.toYear} (2012 = 100)` ] },
    { key : "wpi", label : "All wholesale goods", value : WPI_RISE_CAL, kind : "total" as const, tip : [ `${WPI_CALENDAR.from.toFixed(1)} in ${WPI_CALENDAR.fromYear}, ${WPI_CALENDAR.to.toFixed(1)} in ${WPI_CALENDAR.toYear} (2011-12 = 100)` ] },
].sort((a, b) => b.value - a.value);

export const WhatGotCheaperPage = () => {
    const [ preset, setPreset ] = useState(PRESETS[0].key);
    const names = PRESETS.find(p => p.key === preset)?.names ?? PRESETS[0].names;

    return (
        <MotionConfig reducedMotion="user">
            <Article id="what-got-cheaper-page">
                <TheOpening />

                {/* THE LINES ============================================================================================ */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Chapter id="the-lines" kicker="MONTH BY MONTH" title={`Solar power systems fell by more than half between ${BASE} and ${NOW}`}>
                                <Para>{`Each line is one good, priced every month from ${monthName(MONTHS[0])} to ${LAST}, and the thick line is the
                                    basket as a whole. That is the whole life of the 2011-12 series: in June 2026 the Office of the Economic
                                    Adviser replaced it with a series based on 2022-23. Air conditioners stand at ${rs(ac.now)}, refrigerators
                                    at ${rs(fridge.now)} and telephones at ${rs(phones.now)}, below the basket’s ${rs(HEADLINE.all)}.`}</Para>
                                <Para>{`The staples moved with the basket or ahead of it. Wheat stands at ${rs(wheat.now)}, rice at ${rs(rice.now)},
                                    milk at ${rs(milk.now)} and eggs at ${rs(eggs.now)}; sugar at ${rs(sugar.now)} is the exception. Petrol stands
                                    at ${rs(petrol.now)} and diesel at ${rs(diesel.now)}, kerosene at ${rs(kerosene.now)} and tomatoes at ${rs(tomato.now)}.`}</Para>
                                <Para last>{`Silver stands at ${rs(silver.now)}, most of the rise in the last two years of the series, close to the
                                    Mumbai price of silver on DBIE, which rose ${BULLION.silver.times.toFixed(1)} times over the same years and
                                    which the item has followed month by month. The index’s gold item, gold and gold ornaments, stands
                                    at ${rs(gold.now)}, while the Mumbai price of gold rose ${BULLION.gold.times.toFixed(1)} times.
                                    Coconuts at ${rs(coconut.now)} and jasmine at ${rs(jasmine.now)} are the dearest goods on the chart.`}</Para>
                            </Chapter>
                        </Portion>
                    </Row>
                    <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <Reveal>
                                <Figure
                                    title={`What ₹100 of each good in ${BASE} cost, month by month`} units="rupees of every ₹100, log scale; the thick line is the whole basket"
                                    table={{ head : [ "Good", `Average, ${NOW}`, `${LAST}`, "Weight, ₹ of 100" ], numeric : [ false, true, true, true ], rows : names.map(n => { const it = itemOfFollowed(n); return [ n, rs(it.now), rs(it.latest), it.weight.toFixed(2) ]; }) }}
                                    note={prose(`From the wholesale price index on DBIE, monthly, ${BASE} = 100; the last two months are provisional.
                                        Each good is one item of the index, and the average in the table is over the months of ${NOW} in which
                                        the good carried a price.`)}
                                >
                                    <div className="fan-presets" role="tablist" aria-label="Which goods to draw">
                                        {PRESETS.map(p => (
                                            <Button key={p.key} kind={p.key === preset ? "primary" : "secondary"} size="small" role="tab" aria-selected={p.key === preset} onClick={() => setPreset(p.key)}>{p.label}</Button>
                                        ))}
                                    </div>
                                    <FanChart names={names} ariaLabel={`Monthly wholesale price indices of ${names.length} goods since April 2011`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* SINCE 1982 =========================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Chapter id="since-1982" kicker="SINCE 1982" title={`Grown goods cost ${aboutTimes(longTimes("primary"))} what they did in 1982-83; factory goods ${aboutTimes(longTimes("manufactured"))}`}>
                                <Para>{`The chart joins four series of the index, based on 1981-82, 1993-94, 2004-05 and 2011-12, each with its
                                    own basket. Linked end to end, they put the whole basket at ${aboutTimes(longTimes("all"))} its
                                    1982-83 price. Goods grown, reared or mined and fuel and power both cost ${aboutTimes(longTimes("primary"))}
                                    as much, and goods made in factories ${aboutTimes(longTimes("manufactured"))}: grown goods rose
                                    ${timesWords(LONG_TIMES.primaryOverManufactured)} as much as factory goods, whichever year the series are joined at.`}</Para>
                                <Para last>{`The gap between the grown and the made is not a thing of the last fourteen years: about
                                    ${GAP_SHARES.by2011 >= 0.6 && GAP_SHARES.by2011 < 0.7 ? "two-thirds" : `${Math.round(100 * GAP_SHARES.by2011)}%`} of it had opened by 2011-12,
                                    ${GAP_SHARES.from2005to2013 > 0.5 ? "most of it" : `${Math.round(100 * GAP_SHARES.from2005to2013)}% of it`} between 2005-06 and 2013-14.
                                    Factory goods kept pace with the basket until ${KEPT_PACE_UNTIL} and have risen less than it in every
                                    decade since.`}</Para>
                            </Chapter>
                        </Portion>
                        <Portion desktopSpan="16">
                            <Reveal delay={0.1}>
                                <Figure
                                    title="The basket and its three parts since 1982-83" units="yearly averages, rupees of every ₹100 in 2011-12, log scale"
                                    table={{ head : [ "Year", "Whole basket", "Grown or mined", "Fuel and power", "Factory-made" ], numeric : [ false, true, true, true, true ], rows : LONG.map(l => [ l.fy, l.all.toFixed(1), l.primary.toFixed(1), l.fuel.toFixed(1), l.manufactured.toFixed(1) ]) }}
                                    note={prose(`From the wholesale price index on DBIE: the 1981-82, 1993-94, 2004-05 and 2011-12 series, each divided by
                                        its own average over the next base year, the Office of the Economic Adviser’s linking method; 1994-95 to
                                        1999-00 from the 1993-94 series in DBIE’s table of yearly averages. Each base has its own basket, so the
                                        line compares baskets as well as prices.`)}
                                >
                                    <LongChart ariaLabel="The wholesale price index and its three major groups, yearly, 1982-83 to the latest year" />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* THE CONSUMER SIDE ==================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Chapter id="the-shop" kicker="WHAT THE SHOP CHARGES" title={`Consumer prices rose ${cpiRisePct}% between ${CPI_GENERAL.fromYear} and ${CPI_GENERAL.toYear}, wholesale prices ${wpiRiseCalPct}%`}>
                                <Para>{`The wholesale index prices goods and nothing else: no rent, no school fees, no doctor’s bill, no bus
                                    fare. The consumer price index prices those, and the goods again after the shop has added its
                                    margin and the taxes.`}</Para>
                                <Para>{`Health rose ${health}%, ${healthLeadExact} points more than everything; education rose ${education}%, ${educationLeadExact} points more,
                                    and housing, the one group that is wholly a service, ${housing}%, ${-housingLeadExact} points less. Transport and
                                    communication rose ${transport}%, the least of these groups. Food rose ${foodCpi}% and clothing ${clothingCpi}%, close to the average. Personal
                                    care rose ${personalCare}%, much of it the price of gold, which in Mumbai averaged ${BULLION.gold.calendar.times.toFixed(1)} times as
                                    much in ${BULLION.gold.calendar.toYear} as in ${BULLION.gold.calendar.fromYear}.`}</Para>
                                <Prose last>
                                    {`In the United States between 2013 and 2025, services rose 50% and goods 20%; between 2000 and 2025 hospital services rose 275% and televisions, priced for a set of given quality, fell 98% (`}
                                    <Cite href="https://www.bls.gov/cpi/">US Bureau of Labor Statistics</Cite>
                                    {`). In India’s consumer index, services and goods rose at about the same pace: housing rose as much as food, and over financial years or from 2012 the goods rose more.`}
                                </Prose>
                            </Chapter>
                        </Portion>
                        <Portion desktopSpan="16">
                            <Reveal delay={0.1}>
                                <Figure
                                    title={`Consumer prices by group, ${CPI_GENERAL.fromYear} to ${CPI_GENERAL.toYear}`} units="rise in the yearly average, per cent; housing, the one group wholly a service, in colour"
                                    table={{ head : [ "Group", `${CPI_GENERAL.fromYear}`, `${CPI_GENERAL.toYear}`, "Rise" ], numeric : [ false, true, true, true ], rows : cpiRows.map(r => [ r.label, r.key === "wpi" ? WPI_CALENDAR.from.toFixed(1) : cpiNamed(r.key === "cpi" ? "C_GIAG" : r.key).from.toFixed(1), r.key === "wpi" ? WPI_CALENDAR.to.toFixed(1) : cpiNamed(r.key === "cpi" ? "C_GIAG" : r.key).to.toFixed(1), pct(r.value, 0) ]) }}
                                    note={prose(`From the consumer price index (rural, urban and combined, 2012 = 100) on DBIE, all-India combined,
                                        calendar-year averages, and the wholesale price index over the same years. Personal care and effects
                                        includes gold and silver jewellery; health includes medicines and education books and stationery.`)}
                                >
                                    <HBars rows={cpiRows} format={v => pct(v, 0)} labelWidth={200} ariaLabel={`Rise in consumer prices by group between ${CPI_GENERAL.fromYear} and ${CPI_GENERAL.toYear}, against wholesale prices`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* YOUR BASKET ========================================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Chapter id="your-basket" kicker="YOUR BASKET" title={`The index is a weighted average of its ${GROUPS.length} groups; the weights are yours to move`}>
                                <Para>{`The ${rs(HEADLINE.all)} is a weighted average: each group’s index, multiplied by its share of the value of
                                    goods traded in ${BASE}, added up. Milk, diesel and electricity count for more than jasmine and
                                    silver, but the weights move the total less than you might expect: an average of the ${COUNTS.items} goods
                                    counted equally gives ${rs(COUNTS.meanItem)}.`}</Para>
                                <Para last>{`The sliders below hold the official weights, and they share one ₹100. Move one and the others give
                                    way to keep the hundred. The number and the line then show what ₹100 of ${BASE} goods costs at your
                                    weights, month by month from ${monthName(MONTHS[0])} to ${LAST}.`}</Para>
                            </Chapter>
                        </Portion>
                    </Row>
                    <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <Reveal>
                                <Figure
                                    title="The official basket, yours to reweight" units={`what ₹100 of ${BASE} goods costs in ${LAST} at your weights, and the line of it since ${monthName(MONTHS[0])}`}
                                    note={prose(`This changes the weights, using the index’s own group series; it does not measure the prices you pay.
                                        At the official weights the two lines are one line. From the wholesale price index on DBIE.`)}
                                >
                                    <BasketWidget />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* IN SHORT ============================================================================================= */}
                <Section id="so-what">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="24">
                            <Heading1 className="so-what-title"><LetterRise text="In short" /></Heading1>
                        </Portion>
                    </Row>
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Reveal>
                                <Heading6 fontStyle="serif" weight="600" marginBottom="nano">{`₹100 of goods in ${BASE} cost ${rs(HEADLINE.all)} in ${NOW}`}</Heading6>
                                <Para last>{`That is a rise of ${Math.round(RISE)}% in fourteen years, ${YEARLY.toFixed(1)}% a year. The typical good rose less, to
                                    ${rs(COUNTS.medianItem)}: ${COUNTS.belowBasket} of the ${COUNTS.items} goods rose less than the basket, which a long tail
                                    of goods that doubled pulls up.`}</Para>
                            </Reveal>
                        </Portion>
                        <Portion desktopSpan="8">
                            <Reveal delay={0.1}>
                                <Heading6 fontStyle="serif" weight="600" marginBottom="nano">{`${COUNTS.cheaper} goods got cheaper in rupees and ${COUNTS.doubled} doubled`}</Heading6>
                                <Para last>{`Of the ${COUNTS.cheaper} that got cheaper, ${numberWord(cheaperMade)} are made in factories, led by solar power
                                    systems at ${rs(solar.now)} and anti-cancer drugs at ${rs(cancer.now)}. Of the ${COUNTS.doubled} that doubled,
                                    ${numberWord(doubledGrown)} are grown, reared or mined, led by jasmine at ${rs(jasmine.now)} and coconuts at ${rs(coconut.now)}.`}</Para>
                            </Reveal>
                        </Portion>
                        <Portion desktopSpan="8">
                            <Reveal delay={0.2}>
                                <Heading6 fontStyle="serif" weight="600" marginBottom="nano">{`In days of work, ${COUNTS.inWork.cheaper} of ${COUNTS.inWork.items} goods got cheaper between ${HEADLINE.wageWindow.from} and ${HEADLINE.wageWindow.to}`}</Heading6>
                                <Para last>{`A rural labourer’s day wage off the farm rose ${wageRisePct}% between ${HEADLINE.wageWindow.from} and ${HEADLINE.wageWindow.to} and the
                                    basket of goods ${basketRiseWagePct}%, so a day buys ${wageAgainstBasket}% more of it. The prices rural labourers pay,
                                    services and shop margins included, rose ${ruralCpiPct}%, so against those the same day buys
                                    ${Math.abs(wageAgainstRuralCpi) <= 3 ? "about what it did" : wageAgainstRuralCpi > 0 ? `${wageAgainstRuralCpi}% more` : `${-wageAgainstRuralCpi}% less`}.
                                    A farm labourer’s day, set against the Bureau’s index for agricultural labourers, buys about
                                    ${Math.abs(farmAgainstAgriCpi)}% ${farmAgainstAgriCpi >= 0 ? "more" : "less"}.`}</Para>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* WHAT THE RESEARCH SAYS =============================================================================== */}
                <Section className="chapter">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="8">
                            <Chapter id="what-the-research-says" kicker="WHAT THE RESEARCH SAYS" title="The figures hold; the index prices goods at the factory gate, with no services and no allowance for a better TV">
                                <Prose>
                                    {`The index records prices at the factory gate, the mine and the mandi, after discounts and before indirect taxes, and prices no services. It holds each quotation to a fixed specification and makes no adjustment for quality, which the terms of reference of its 2014 working group asked it to explore and which no later document supplies (`}
                                    <Cite href="https://eaindustry.nic.in/uploaded_files/Technical_Report_Of_Working_Group.pdf">Office of the Economic Adviser, 2014</Cite>
                                    {`). So colour TVs at ${rs(tv.now)} follow the price of each quoted model over its life, and a better set at the same price does not count as a fall. The American consumer index does count it, and puts televisions at about 2% of their 1997 price (`}
                                    <Cite href="https://ourworldindata.org/explore-updated-data-on-how-consumer-prices-have-changed-in-the-united-states">Our World in Data, 2026</Cite>
                                    {`); the two figures measure different things. Telephones stand at ${rs(phones.now)}; the index cannot say how much better the phones quoted are now.`}
                                </Prose>
                                <Prose>
                                    {`Solar power systems fell on the world’s learning curve. `}
                                    <Cite href="https://ora.ox.ac.uk/objects/uuid:17256b64-f822-40ef-8770-5d0fa1ddc73e">Way, Ives, Mealy and Farmer (2022)</Cite>
                                    {` find the cost of solar power falling at about 10% a year for decades. The item here stood at ${rs(solarLow)} in March 2020 and ${rs(solar2022)} by March 2022, as world module prices rose with the price of polysilicon (`}
                                    <Cite href="https://jmkresearch.com/38-increase-in-module-prices-in-last-20-months-august-2020-march-2022/">JMK Research, 2022</Cite>
                                    {`). It peaked at ${rs(solar2023)} in March 2023 and has eased to ${rs(solar.now)}, under a 40% customs duty on imported modules from April 2022 (`}
                                    <Cite href="https://www.pv-magazine-india.com/2021/03/10/solar-modules-to-face-40-customs-duty-cells-25-from-april-next-year/">pv magazine, 2021</Cite>
                                    {`) and a list of approved manufacturers (`}
                                    <Cite href="https://mnre.gov.in/en/approved-list-of-models-and-manufacturers-almm/">MNRE, 2021</Cite>
                                    {`). Anti-cancer drugs fell from ${rs(cancer2017)} in March 2017 to ${rs(cancer.now)}, on two price quotations by the Office’s 2017 manual. The 2019 cap on trade margins for 42 cancer drugs cut shop prices, not the factory-gate price this index records${cancerFlatAtCap ? ", and the item did not fall in the months it took effect" : ""} (`}
                                    <Cite href="https://www.indianpharmapost.com/policy/lite/nppa-has-put-a-cap-on-the-trade-margin-of-42-select-non-scheduled-anti-cancer-medicines-9974">Indian Pharma Post, 2021</Cite>
                                    {`). Ceiling prices under the 2013 price control order, competition from generic makers and changes in the quotations could each explain the fall; nothing read settles which.`}
                                </Prose>
                                <Prose>
                                    {`Two of the index’s metal items do not follow the metals. Gold and gold ornaments stands at ${rs(gold.now)}, while the Mumbai price of gold on DBIE rose ${BULLION.gold.times.toFixed(1)} times over the same years, from ₹${inr(BULLION.gold.base)} to ₹${inr(BULLION.gold.now)} per 10 grams; silver at ${rs(silver.now)} is close to the Mumbai price’s ${BULLION.silver.times.toFixed(1)} times and has followed it month by month. What the gold item prices is a question for the Office. Zinc concentrate at ${rs(zincOre?.now ?? 0)} stands far above the index’s own zinc metal at ${rs(zincMetal?.now ?? 0)}, and rests on a single price quotation, by the Office’s 2017 manual. A concentrate is priced as the metal it contains less a processing charge, plus credits for the silver in the ore (`}
                                    <Cite href="https://www.sec.gov/Archives/edgar/data/1713930/000129281426001787/nexaform20f_2025.htm">Nexa Resources, 2026</Cite>
                                    {`), and silver nearly tripled over these years. Indian concentrate prices come from captive mines (`}
                                    <Cite href="https://www.eaindustry.nic.in/uploaded_files/wpi/Brief_Note_on_Methodology_for_WPI_and_PPI.pdf">Office of the Economic Adviser, 2026</Cite>
                                    {`), so this is a likely cause, not a measured one.`}
                                </Prose>
                                <Prose>
                                    {`The gap between the grown and the made is the government’s own finding: the Office reports primary articles up about 77% and manufactured items about 43% between 2011-12 and 2022-23 (`}
                                    <Cite href="https://www.eaindustry.nic.in/uploaded_files/wpi/Brief_Note_on_Methodology_for_WPI_and_PPI.pdf">Office of the Economic Adviser, 2026</Cite>
                                    {`). The Reserve Bank’s study of food prices found rising rural wages the main cause of their long rise (`}
                                    <Cite href="https://rbi.org.in/Scripts/PublicationsView.aspx?id=16055">Sonna, Joshi, Sebastian and Sharma, 2014</Cite>
                                    {`). `}
                                    <Cite href="https://www.nber.org/papers/w12218">Nordhaus (2008)</Cite>
                                    {` finds across American industries that a point more of productivity growth takes about a point off an industry’s relative price; no study read measures this for Indian farms and factories. Some of the dearest goods jumped in their last year or two on top of a longer rise: raw jute after farmers moved to maize in 2025 (`}
                                    <Cite href="https://www.theweek.in/wire-updates/business/2025/12/29/ccm1-biz-year-jute.html">PTI, 2025</Cite>
                                    {`), and coconuts and copra after the heat and pests of 2024 (`}
                                    <Cite href="https://india.mongabay.com/2024/07/high-temperatures-lead-to-decline-in-coconut-production-spiked-prices/">Mongabay India, 2024</Cite>
                                    {`). Dry ginger ${ginger ? `has stayed above ${rs(ginger.now)} for three years since` : "spiked in"} 2023, when growers held back a crop after a year of low prices (`}
                                    <Cite href="https://krishijagran.com/news/prices-of-tomato-ginger-reach-record-highs-in-just-two-weeks/">Krishi Jagran, 2023</Cite>
                                    {`). Ragi’s price follows its minimum support price, which rose from ₹1,500 a quintal in 2013-14 to ₹4,290 in 2024-25 (`}
                                    <Cite href="https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/jun/doc2024621343301.pdf">Press Information Bureau, 2024</Cite>
                                    {`). Garnet${garnet ? ` at ${rs(garnet.now)}` : ""} had already risen before beach-sand mining was reserved to the state in 2019 (`}
                                    <Cite href="https://www.downtoearth.org.in/amp/story/mining/environment-ministry-stops-clearance-to-mining-of-beach-sand-minerals-63999">Down To Earth, 2019</Cite>
                                    {`); its index then did not change for ${garnet ? garnet.flat : "many"} months, and it rests on a single quotation.`}
                                </Prose>
                                <Prose last>
                                    {`The consumer index prices services and shop prices, and food weighs ₹46 of its ₹100 (`}
                                    <Cite href="https://mospi.gov.in/sites/default/files/press_release/cpi_pr_12jan16t.pdf">MoSPI, 2016</Cite>
                                    {`) against ₹${Math.round(HEADLINE.foodWeight)} in the wholesale basket; the Reserve Bank found the difference in weights alone explained about 70% of the gap between the two indices in 2015-16 (`}
                                    <Cite href="https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=17450">Das and George, 2017</Cite>
                                    {`). Group for group, the shop also rose faster than the wholesale gate: food ${foodCpi}% against ${foodWpiCal}% for the wholesale food index. In 2014 a Reserve Bank committee recommended steering by consumer prices, because the wholesale index leaves out services, takes some quotes from shops and is revised heavily (`}
                                    <Cite href="https://rbi.org.in/scripts/PublicationReportDetails.aspx?ID=743">Patel committee, 2014</Cite>
                                    {`). `}
                                    <Cite href="https://www.mercatus.org/research/books/why-are-prices-so-damn-high">Helland and Tabarrok (2019)</Cite>
                                    {` find in American data that prices rise where productivity does not, in health and education, and little evidence that regulation is the cause; in India’s consumer index health rose ${healthLeadExact} points more than everything over twelve years, and education’s lead of ${educationLeadExact} points ${educationLeadFy <= 0 ? "disappears" : `shrinks to ${educationLeadFy}`} over financial years.`}
                                </Prose>
                            </Chapter>
                        </Portion>
                    </Row>
                </Section>

                {/* THE EXACT FIGURES ==================================================================================== */}
                <Section className="chapter" id="receipts">
                    <Row horizontalPadding="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="half">
                            <Reveal>
                                <Text className="kicker" weight="600" marginBottom="nano">THE NUMBERS BEHIND THE DOTS</Text>
                                <Heading4 className="chapter-title" fontStyle="serif" weight="500" marginBottom="nano">The exact figures</Heading4>
                                <Text fontStyle="serif" opacity="80">
                                    {prose(`The dots round the figures off. These charts give them exactly, and each has a table view with every
                                        value. The download has all ${inr(COUNTS.items)} goods.`)}
                                </Text>
                            </Reveal>
                        </Portion>
                        <Portion desktopSpan="half">
                            <Reveal delay={0.1}>
                                <LookUp />
                            </Reveal>
                        </Portion>
                    </Row>
                    <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="half">
                            <Reveal>
                                <Figure
                                    title={`The ${COUNTS.cheaper} goods that got cheaper, ${BASE} to ${NOW}`} units="change in the yearly average, per cent"
                                    table={{ head : [ "Good", "Group", `₹ of every ₹100`, "Change", "Weight" ], numeric : [ false, false, true, true, true ], rows : CHEAPER.map(i => [ i.label, GROUPS[i.group].label, rs(i.now), signed(i.now), i.weight.toFixed(3) ]) }}
                                    note={prose(`From the wholesale price index on DBIE, ${BASE} = 100: every item whose ${NOW} average is below 100.
                                        ${cap(numberWord(STALE_CHEAPER.length))} of these hardly ever changed, with half or more of their months unchanged or
                                        two years or more at one value: ${list(STALE_CHEAPER.map(i => barLabel(i.label).toLowerCase()))}.`)}
                                >
                                    <HBars rows={CHEAPER.map(i => ({ key : i.code, label : barLabel(i.label), value : 100 - i.now, kind : "fall" as const, tip : [ GROUPS[i.group].label, `${rs(i.now)} of every ₹100` ] }))} format={v => `−${v.toFixed(0)}%`} max={60} labelWidth={210} rowHeight={22} ariaLabel={`The ${COUNTS.cheaper} goods whose wholesale price fell between ${BASE} and ${NOW}`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                        <Portion desktopSpan="half">
                            <Reveal delay={0.1}>
                                <Figure
                                    title={`The 25 goods that rose the most, ${BASE} to ${NOW}`} units="change in the yearly average, per cent"
                                    table={{ head : [ "Good", "Group", `₹ of every ₹100`, "Change", "Weight" ], numeric : [ false, false, true, true, true ], rows : RISERS.slice(0, 25).map(i => [ i.label, GROUPS[i.group].label, rs(i.now), signed(i.now), i.weight.toFixed(3) ]) }}
                                    note={prose(`From the wholesale price index on DBIE, ${BASE} = 100. Seasonal goods are averaged over the months they
                                        carried a price. The download ranks all ${inr(COUNTS.items)}.`)}
                                >
                                    <HBars rows={RISERS.slice(0, 25).map(i => ({ key : i.code, label : barLabel(i.label), value : i.now - 100, kind : "rise" as const, tip : [ GROUPS[i.group].label, `${rs(i.now)} of every ₹100` ] }))} format={v => signed(v + 100)} labelWidth={210} rowHeight={22} ariaLabel={`The 25 goods whose wholesale price rose the most between ${BASE} and ${NOW}`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                    <Row horizontalPadding="small" marginTop="small" marginBottom="none" allowUltraWide>
                        <Portion desktopSpan="half">
                            <Reveal>
                                <Figure
                                    title={`The ${GROUPS.length} groups of the basket, ${BASE} to ${NOW}`} units="change in the yearly average, per cent; coloured by major group"
                                    table={{ head : [ "Group", "Major group", "Weight, ₹ of 100", `₹ of every ₹100` ], numeric : [ false, false, true, true ], rows : GROUPS.map(g => [ g.label, MAJOR_PLAIN[g.major], g.weight.toFixed(2), rs(g.now) ]) }}
                                    note={prose(`From the wholesale price index on DBIE. The weights add to ₹100, and at those weights the groups’ indices
                                        reproduce the whole basket within ${HEADLINE.rebuildTolerance} of an index point in every month.`)}
                                >
                                    <HBars rows={[ ...GROUPS ].sort((a, b) => b.now - a.now).map(g => ({ key : g.code, label : g.label.replace(/^Manufacture of /, "").replace(/\/.*$/, ""), value : g.now - 100, kind : groupKind(g.major), note : `₹${g.weight.toFixed(1)} of 100`, tip : [ MAJOR_PLAIN[g.major], `weight ₹${g.weight.toFixed(2)} of every ₹100` ] }))} format={v => signed(v + 100)} labelWidth={210} noteWidth={80} rowHeight={22} ariaLabel={`Change in each group of the wholesale price index between ${BASE} and ${NOW}`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                        <Portion desktopSpan="half">
                            <Reveal delay={0.1}>
                                <Figure
                                    title={`Rural daily wages by occupation, ${HEADLINE.wageWindow.from} to ${HEADLINE.wageWindow.to}`} units="rise in the yearly average, per cent; men, all India"
                                    table={{ head : [ "Occupation", `₹ a day, ${HEADLINE.wageWindow.from}`, `₹ a day, ${HEADLINE.wageWindow.to}`, "Rise" ], numeric : [ false, true, true, true ], rows : WAGES_BY_RISE.map(w => [ w.label, Math.round(w.from), Math.round(w.to), pct(100 * (w.to / w.from - 1), 0) ]) }}
                                    note={prose(`From the Labour Bureau’s wage rates in rural India on DBIE, which carries men’s wages. The yardstick
                                        is the non-agricultural labourer’s day: ₹${Math.round(YARD.from)} in ${HEADLINE.wageWindow.from} and
                                        ₹${Math.round(YARD.to)} in ${HEADLINE.wageWindow.to}.`)}
                                >
                                    <HBars rows={WAGES_BY_RISE.map(w => ({ key : w.code, label : w.label.replace(/\s*\(.*$/, "").replace(/ including.*$/i, "").replace(/\s*[-:].*$/, ""), value : 100 * (w.to / w.from - 1), kind : "money" as const, note : `₹${Math.round(w.from)} to ₹${Math.round(w.to)}`, tip : [ `₹${Math.round(w.from)} a day in ${HEADLINE.wageWindow.from}, ₹${Math.round(w.to)} in ${HEADLINE.wageWindow.to}` ] }))} format={v => pct(v, 0)} labelWidth={210} noteWidth={92} rowHeight={22} ariaLabel={`Rise in rural daily wages by occupation between ${HEADLINE.wageWindow.from} and ${HEADLINE.wageWindow.to}`} />
                                </Figure>
                            </Reveal>
                        </Portion>
                    </Row>
                </Section>

                {/* SOURCES & METHOD ===================================================================================== */}
                <Section id="wgc-sources">
                    <Row horizontalPadding="medium" marginTop="large" allowUltraWide>
                        <Portion desktopSpan="half">
                            <Divider kind="secondary" verticalMargin="micro" />
                            <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>
                            <Text size="tiny" marginBottom="micro">
                                {prose(`Office of the Economic Adviser, Department for Promotion of Industry and Internal Trade, Ministry of
                                    Commerce and Industry, wholesale price index, as published on DBIE: the 2011-12 series for every commodity
                                    code, monthly from April 2012 to ${LAST}, with each code’s weight, and the 2004-05, 1993-94 and 1981-82
                                    series, monthly. The Office’s manual on the 2011-12 series (2017), its press release and answers to
                                    frequently asked questions on that series (May 2017), its pages of linking factors, its press release of
                                    14 May 2026 for April 2026, and its press release of 15 June 2026 and note to users of 1 June 2026 on the
                                    2022-23 series that replaced it. National Statistics Office, Ministry of Statistics and Programme
                                    Implementation, consumer price index (rural, urban, combined), 2012 = 100, all-India combined, by group,
                                    monthly from January 2013 to December ${CPI_GENERAL.toYear}, as published on DBIE, with the weights from its
                                    press release of 12 January 2016. Labour Bureau, Ministry of Labour and Employment, wage rates in rural
                                    India, men, all India and by state, by occupation, monthly from November 2013 to April 2025, and its
                                    consumer price indices for rural labourers and for agricultural labourers (1986-87 = 100), as published on
                                    DBIE, and the Bureau’s brief on the series. Reserve Bank of India, monthly average prices of gold and silver
                                    in Mumbai, as published on DBIE. US Bureau of Labor Statistics, consumer price index for all urban
                                    consumers: services, commodities, hospital and related services and televisions, January 2000 to
                                    September 2025.`)}
                            </Text>
                            <Text weight="600" size="tiny" verticalMargin="micro">FURTHER READING</Text>
                            {READING.map(r => (
                                <Div key={r.href} marginBottom="nano">
                                    <a href={r.href} target="_blank" rel="noopener" className="download-link">
                                        <Div verticallyCentreItems>
                                            <BookOpen size="16px" />
                                            <Text weight="600" marginLeft="nano" size="tiny">{r.title}</Text>
                                        </Div>
                                    </a>
                                    <Text size="tiny" opacity="80">{r.note}</Text>
                                </Div>
                            ))}
                            <Text weight="600" size="tiny" verticalMargin="micro">DOWNLOADS</Text>
                            {SOURCES.map(([ file, label ]) => (
                                <Div key={file}>
                                    <Link href={`/stories/what-got-cheaper/${file}`} download className="download-link">
                                        <Div verticallyCentreItems marginBottom="nano">
                                            <Download size="16px" />
                                            <Text weight="600" marginLeft="nano" size="tiny">Download {label} (CSV)</Text>
                                        </Div>
                                    </Link>
                                </Div>
                            ))}
                            <Div>
                                <Link href="/prices" className="download-link">
                                    <Div verticallyCentreItems marginTop="nano" marginBottom="nano">
                                        <Table2 size="16px" />
                                        <Text weight="600" marginLeft="nano" size="tiny">Go to the price indices</Text>
                                    </Div>
                                </Link>
                            </Div>
                        </Portion>

                        <Portion desktopSpan="half">
                            <Divider kind="secondary" verticalMargin="micro" />
                            <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>
                            <MethodNote title="What the index prices.">{`The wholesale price index measures the change in the prices of goods at their first
                                sale in bulk: farm produce at the mandi, minerals at the mine, petroleum products at the refinery and
                                manufactured goods at the factory gate, after discounts and before indirect taxes. It prices no services,
                                and most of its quotes carry no shop’s margin, though milk and LPG are priced in retail markets (the
                                Reserve Bank’s Patel committee, 2014). A good’s index compares the prices of its quotations, ${inr(8331)} of
                                them across the ${inr(COUNTS.items)} goods (the Office of the Economic Adviser’s manual, 2017), with their own
                                prices in ${BASE}, as a geometric mean; it is not a price,
                                and the rupee prices are never published. Above the goods, the index is a weighted average, and a good’s
                                weight is its share of the value of goods traded in India in ${BASE}: output plus imports, less exports.`}</MethodNote>
                            <MethodNote title="The series.">{`The 2011-12 series ran from ${monthName(MONTHS[0])} to ${LAST}. On 15 June 2026 the Office replaced it
                                with a series based on 2022-23, with 957 goods, and said the wholesale price index would be published for
                                five more years beside new producer price indices and then stop (its press release of 15 June 2026). DBIE
                                carries the 2011-12 series, and the page uses all of it. The last two months, ${HEADLINE.provisional.map(monthName).join(" and ")}, are the
                                Office’s provisional figures, as DBIE carries them; its final figures for all commodities, published in
                                its later releases, are a few tenths higher (161.2 and 167.6), and individual goods were revised by more,
                                in both directions. On the final March figure one good, hydrogen peroxide, moves to ₹100.2, which
                                would leave ${COUNTS.cheaper - 1} cheaper. DBIE also prints the base year itself, April 2011 to March 2012, as ${HEADLINE.placeholderMonths}
                                rows of exactly 100 for every code; they are placeholders, not prices, and are left out.`}</MethodNote>
                            <MethodNote title="Goods, not groups.">{`A good here is a leaf of DBIE’s commodity tree, a code no other code extends, with one
                                correction: DBIE files the textile-machinery sub-group as a good and open-end spinning machinery as a
                                sub-group, and they are swapped back here as the Office’s own file has them. That leaves ${inr(COUNTS.items)} goods,
                                the ${inr(primary.items)} primary articles, ${inr(fuel.items)} fuel and power items and ${inr(made.items)} manufactured
                                products of the Office’s own count, whose weights add to ₹100. The ${GROUPS.length} groups’ weights add to ₹100
                                too and, at those weights, their indices rebuild the whole basket within ${HEADLINE.rebuildTolerance} of an index point
                                in every month.`}</MethodNote>
                            <MethodNote title="Years against years.">{`Every comparison of a good with ${BASE} takes the average of ${NOW}, April to March, against that base year,
                                which is 100 by definition. The latest month, ${LAST}, is given where it is used. A single month against a
                                single month would mislead for anything seasonal.`}</MethodNote>
                            <MethodNote title="Seasonal goods.">{`When a fruit or vegetable is out of season the Office compiles no index for it and spreads
                                its weight over the rest of its sub-group; DBIE prints a 0 for the month. ${cap(numberWord(ITEMS.filter(i => i.priced < 12).length))}
                                goods are priced in part of the year: ${list(ITEMS.filter(i => i.priced < 12).map(i => `${i.label.toLowerCase().replace(/^peas\(green\)$/, "green peas")} in ${i.priced}`))}
                                months of ${NOW}. Their averages are over the months they were priced.`}</MethodNote>
                            <MethodNote title="Flat series.">{`A price quotation that does not arrive is carried forward unchanged, and some goods rest on one or
                                two quotations, so a long run of identical months can be a price that did not move or a price nobody
                                reported. ${cap(numberWord(FLAT.length))} goods have three or fewer distinct values since April 2012, or sixty or more months
                                unchanged in a row${pcFlat && laptopFlat ? `: the personal computer index did not change for ${pcFlat.flat} months and the laptop index for ${laptopFlat.flat}` : ""}.
                                ${flatCheaper.length ? `${cap(numberWord(flatCheaper.length))} of the ${numberWord(FLAT.length)} are among the ${COUNTS.cheaper} goods that got cheaper: ${list(flatCheaper.map(i => barLabel(i.label).toLowerCase()))}. ` : ""}By a looser test, half or more of their months unchanged or two years at one value, ${COUNTS.stale.items} goods
                                weighing ₹${COUNTS.stale.weight.toFixed(1)} hardly move; they are ${COUNTS.stale.amongCheaper} of the ${COUNTS.cheaper} that got cheaper,
                                against about one in ${Math.round(COUNTS.stale.rest / COUNTS.stale.amongRest)} of the rest. They are in the downloads and the receipts,
                                and none of them is named in the sentences above.`}</MethodNote>
                            <MethodNote title="No allowance for a better TV.">{`The Office holds each quotation to a fixed specification and, when a product is
                                replaced, splices the new price onto the old, so the gap between two models counts as quality and the
                                index follows each model’s own price. It makes no other adjustment, and none for the goods that change
                                fastest, which its own terms of reference asked for and did not get. Statistical offices that adjust for
                                quality, as the United States does for computers, find larger falls for electronics than this index can
                                show.`}</MethodNote>
                            <MethodNote title="Since 1982.">{`The Office links its series the same way every time: an older series is divided by its own
                                average over the next base year. The 2004-05 series averaged ${LINKS[0].from2004 * 100} over ${BASE}, the 1993-94
                                series ${(LINKS[0].from1993 * 100).toFixed(1)} over 2004-05 and the 1981-82 series ${(LINKS[0].from1981 * 100).toFixed(1)} over 1993-94,
                                which are the Office’s published factors of ${LINKS[0].from2004}, ${LINKS[0].from1993} and ${LINKS[0].from1981}. The three major
                                groups use their own factors; the Office publishes them for the two later joins, which these reproduce,
                                and only the all-commodities factor for the 1981-82 join. Each base has its own basket, specifications
                                and sources, so the long series compares baskets as well as prices, and the Office links nothing below
                                the major groups. DBIE’s monthly table ends the 1981-82 series in December 1999 and begins the 1993-94
                                series in January 2000; the yearly figures from 1994-95 to 1999-00 come from the 1993-94 series in DBIE’s
                                table of yearly averages, so the join is at 1993-94, where the Office makes it. Joined instead at another
                                year in which both series ran, the basket’s multiple ranges from ${LONG_RANGE.all.low.toFixed(1)} to ${LONG_RANGE.all.high.toFixed(1)},
                                grown goods’ from ${LONG_RANGE.primary.low.toFixed(1)} to ${LONG_RANGE.primary.high.toFixed(1)}, fuel and power’s from ${LONG_RANGE.fuel.low.toFixed(1)} to
                                ${LONG_RANGE.fuel.high.toFixed(1)} and factory goods’ from ${LONG_RANGE.manufactured.low.toFixed(1)} to ${LONG_RANGE.manufactured.high.toFixed(1)}.`}</MethodNote>
                            <MethodNote title="Days of work.">{`A good’s rise between ${HEADLINE.wageWindow.from} and ${HEADLINE.wageWindow.to}, the first and last
                                full years of the Labour Bureau’s current list of occupations, is divided by the rise in the all-India day
                                wage of a non-agricultural rural labourer, ₹${Math.round(YARD.from)} to ₹${Math.round(YARD.to)}. DBIE carries
                                men’s wages only; the all-India figure is the Bureau’s average over every village quotation, not weighted by
                                state; and the wage is for a normalised eight-hour day, not earnings. A farm labourer’s day rose from
                                ₹${Math.round(farm.from)} to ₹${Math.round(farm.to)} and a carpenter’s from ₹${Math.round(carpenter.from)} to
                                ₹${Math.round(carpenter.to)}, so the count moves little with the yardstick: ${COUNTS.inWork.cheaperAgainst.farm} against the farm
                                labourer’s day, ${COUNTS.inWork.cheaperAgainst.carpenter} against the carpenter’s, ${COUNTS.inWork.cheaperAgainst.meanOfOccupations} against the average
                                of the ${COUNTS.inWork.occupations} occupations. It moves more with the starting year: from ${COUNTS.inWork.nextFy}, after the oil price
                                fell, it is ${COUNTS.inWork.cheaperAgainst.fromNextYear}. Averaging the ${COUNTS.inWork.states} states’ rises equally, instead of every village
                                quotation, gives ${stateEqualPct}% rather than ${wageRisePct}%. The Bureau widened its sample from 600 villages in 20 states to
                                787 in 34 states and union territories from July 2025, after the last month on DBIE, and warns against
                                comparing across that change. It deflates these wages by its consumer price index for rural labourers,
                                which rose from ${RURAL_CPI.from} to ${RURAL_CPI.to} (${RURAL_CPI.base} = 100) over the same years, ${ruralCpiPct}%, and the farm
                                occupations by its index for agricultural labourers, which rose from ${AGRI_CPI.from} to ${AGRI_CPI.to}; both
                                comparisons are given beside the goods-only one.`}</MethodNote>
                            <MethodNote title="The consumer index.">{`The consumer price index is compared over calendar years, ${CPI_GENERAL.fromYear} and ${CPI_GENERAL.toYear},
                                the first and last full years of its 2012 series in DBIE’s monthly table, and the wholesale index over the
                                same years; over the financial years ${CPI_FY_WINDOW.from} to ${CPI_FY_WINDOW.to} the general index rose ${Math.round(cpiRiseFy("C_GIAG"))}%. The
                                two have different baskets, weights and base years, so the comparison is of rises, not levels. The consumer
                                groups mix goods and services: transport and communication includes petrol and diesel, education includes
                                books and stationery, and health includes medicines as well as doctors’ fees. A new consumer series based on
                                2024 began in January 2026 and joins the old one only at the general index.`}</MethodNote>
                            <MethodNote title="Nothing typed by hand." last>{`Every number here is read from the DBIE series by a program that checks the tree, the weights,
                                the placeholders and the linking factors every time it runs. The sentences above use those same
                                numbers. The only figures typed in are those cited from other publications, which are named where they
                                appear.`}</MethodNote>
                        </Portion>
                    </Row>
                </Section>
            </Article>
        </MotionConfig>
    );
};

export { dearerInWork, shareOf, weightOf, STEPS };
