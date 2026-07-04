"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// UI ==================================================================================================================
import {
    Article,
    Button,
    Card,
    Div,
    Divider,
    Heading1,
    Heading4,
    Heading6,
    Portion,
    Row,
    Section,
    Text,
} from "fictoan-react";
import { Download, Table2 } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { CreditCanvas, type CanvasScene } from "./CreditCanvas";
import { StackedShare } from "./StackedShare";
import { WomenIsotype } from "./WomenIsotype";
import { WomenShareBars } from "./WomenShareBars";

// DATA ================================================================================================================
import { Q_LAST, Q_MAR_2015, QUARTERS, YEAR_2015, YEAR_2026, YEARS } from "./data";

// STYLES ==============================================================================================================
import "./the-lights-came-on.css";

type Stage = "hero" | "guess" | "reveal" | "field" | "cascade" | "ticket" | "women" | "agri" | "dim" | "swap" | "done";

// March 2024 — the peak year for women's borrower accounts; the "dim" act scrubs from here.
const YEAR_2024 = YEAR_2026 - 2;

export const TheLightsCameOnPage = () => {
    const [ stage, setStage ] = useState<Stage>("hero");
    const [ guess, setGuess ] = useState(25);
    const [ locked, setLocked ] = useState<number | null>(null);
    const [ yearIdx, setYearIdx ] = useState(YEAR_2015);
    const [ quarterIdx, setQuarterIdx ] = useState(Q_MAR_2015);

    const rmRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const stepRefs = useRef<(HTMLElement | null)[]>([]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // ---- the single canvas state, derived from the story stage --------------------------------------
    const scene : CanvasScene = useMemo(() => {
        switch (stage) {
            case "reveal":
                return {kind : "columns", quarterIdx : Q_MAR_2015};
            case "swap":
            case "done":
                return {kind : "columns", quarterIdx};
            case "field":
                return {kind : "field", yearIdx : YEAR_2015, gender : false};
            case "cascade":
            case "ticket":
                return {kind : "field", yearIdx, gender : false};
            case "women":
            case "agri":
            case "dim":
                return {kind : "field", yearIdx, gender : true};
            default:
                return {kind : "dark"};
        }
    }, [ stage, quarterIdx, yearIdx ]);

    // ---- stage side-effects: autoplays -----------------------------------------------------------
    useEffect(() => {
        clearTimer();
        const rm = rmRef.current;
        if (stage === "cascade" || stage === "women") {
            if (rm) {
                setYearIdx(YEAR_2026);
                return;
            }
            setYearIdx(YEAR_2015);
            timerRef.current = setInterval(() => {
                setYearIdx((p) => {
                    if (p >= YEAR_2026) {
                        clearTimer();
                        return p;
                    }
                    return p + 1;
                });
            }, stage === "cascade" ? 460 : 340);
        } else if (stage === "ticket" || stage === "agri") {
            setYearIdx(YEAR_2026);
        } else if (stage === "dim") {
            // Scrub back to the 2024 peak, then let two years of dimming play out.
            if (rm) {
                setYearIdx(YEAR_2026);
                return;
            }
            setYearIdx(YEAR_2024);
            timerRef.current = setInterval(() => {
                setYearIdx((p) => {
                    if (p >= YEAR_2026) {
                        clearTimer();
                        return p;
                    }
                    return p + 1;
                });
            }, 900);
        } else if (stage === "field") {
            setYearIdx(YEAR_2015);
        } else if (stage === "swap") {
            if (rm) {
                setQuarterIdx(Q_LAST);
                return;
            }
            playQuarters();
        } else if (stage === "reveal") {
            setQuarterIdx(Q_MAR_2015);
        }
        return clearTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ stage ]);

    const playQuarters = () => {
        clearTimer();
        setQuarterIdx(Q_MAR_2015);
        timerRef.current = setInterval(() => {
            setQuarterIdx((p) => {
                if (p >= Q_LAST) {
                    clearTimer();
                    return p;
                }
                return p + 1;
            });
        }, 130);
    };

    // ---- scroll: each step claims the stage when it crosses the viewport middle ---------------------
    useEffect(() => {
        rmRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) setStage((e.target as HTMLElement).dataset.stage as Stage);
                }
            },
            {rootMargin : "-44% 0px -44% 0px", threshold : 0},
        );
        stepRefs.current.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, []);

    const stepRef = (i : number) => (el : HTMLElement | null) => {
        stepRefs.current[i] = el;
    };

    const y26 = YEARS[YEAR_2026], y15 = YEARS[YEAR_2015];
    const perHundred = Math.round((y26.acc / y15.acc) * 100);

    return (
        <Article id="the-lights-came-on-page" paddingBottom="small">
            {/* ACTS I–III — dark indigo, one sticky canvas ======================================== */}
            <Div className="act-dark">
                <Div className="stage">
                    <CreditCanvas scene={scene} />
                </Div>

                <Div className="steps">
                    {/* ACT I — in the dark ------------------------------------------------------- */}
                    <Div className="step centered" data-stage="hero" ref={stepRef(0)}>
                        <Div className="title-card">
                            <Text className="kicker" weight="600" marginBottom="nano">A SO WHAT? DATA STORY</Text>
                            <Heading1 className="tloc-title" marginBottom="nano">
                                The lights <span className="lit">came on</span>
                            </Heading1>
                            <Text fontStyle="serif" size="large" className="tloc-sub">
                                Every dot is a slice of India the credit system either sees—or doesn&rsquo;t.
                                Dark means: no file, no score, no formal loan.
                            </Text>
                            <Text size="small" className="tloc-cue" marginTop="micro">Tap the dark. Then scroll.</Text>
                        </Div>
                    </Div>

                    <Div className="step" data-stage="guess" ref={stepRef(1)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                                March 2015. Banks had ₹66,97,242 crore out on loan.
                            </Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                Of every <strong>₹100</strong>, how much did <strong>individuals</strong>—people,
                                in their own name—borrow, rather than companies, governments or institutions?
                            </Text>
                            <Div className="slider-row" verticallyCentreItems>
                                <input
                                    type="range" min={0} max={100} step={1} value={guess}
                                    onChange={(e) => setGuess(+e.target.value)}
                                    aria-label="Your guess: rupees borrowed by individuals, out of every 100"
                                />
                                <Text className="guess-value" fontStyle="monospace" weight="700">₹{guess}</Text>
                            </Div>
                            <Button
                                kind="primary" size="small" marginTop="nano"
                                onClick={() => {
                                    setLocked(guess);
                                    stepRefs.current[2]?.scrollIntoView({
                                        behavior : rmRef.current ? "auto" : "smooth", block : "center",
                                    });
                                }}
                            >
                                Lock it in ↓
                            </Button>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="reveal" ref={stepRef(2)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">Companies won.</Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                {locked !== null && <>You guessed <strong>₹{locked}</strong>.&ensp;</>}
                                Companies were the biggest borrowers—<strong>₹40</strong> of every ₹100, against
                                just <strong>₹31</strong> for individuals. Hold that ₹31; we&rsquo;ll come back to it.
                            </Text>
                            <Text fontStyle="serif"><em>Many credit-seeking households were simply left in the
                                dark.</em></Text>
                        </Card>
                    </Div>

                    {/* ACT II — the lights come on ----------------------------------------------- */}
                    <Div className="step" data-stage="field" ref={stepRef(3)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">India, as 104 dots</Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                Each dot is ≈1 crore of India&rsquo;s <strong>credit-eligible adults</strong>—about
                                1,036 million people. A lit dot means borrower accounts exist there; a dark dot
                                means the formal system can&rsquo;t see anyone. In March 2015, just
                                <strong> 12 of 104</strong> were lit.
                            </Text>
                            <Text size="small" isSubtext>Tap a dark dot.</Text>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="cascade" ref={stepRef(4)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">Eleven years of
                                ignition</Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                By March 2026, <strong>35 dots are lit</strong>—{perHundred} borrower accounts for
                                every 100 that existed in 2015. Banks opened 23 crore new credit footholds.
                            </Text>
                            <input
                                type="range" min={YEAR_2015} max={YEAR_2026} step={1} value={yearIdx}
                                onChange={(e) => {
                                    clearTimer();
                                    setYearIdx(+e.target.value);
                                }}
                                aria-label="Scrub through March-end years"
                            />
                            <Div className="scrub-ends">
                                <Text size="tiny" isSubtext>Mar 2015</Text>
                                <Text size="tiny" isSubtext>Mar 2026</Text>
                            </Div>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="ticket" ref={stepRef(5)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">More borrowers—not deeper
                                debt</Heading6>
                            <Div className="dots-inline" marginBottom="nano">
                                <span className="dot" /><span className="arrow">→</span>
                                <span className="dot" /><span className="dot" /><span className="dot" />
                            </Div>
                            <Text fontStyle="serif" marginBottom="nano">
                                The average loan grew ₹1.78 lakh → ₹2.81 lakh (<strong>×1.57</strong>). The number
                                of borrower accounts grew <strong>×3.0</strong>. The book grew ×4.7. The dots
                                multiply; they don&rsquo;t fatten.
                            </Text>
                            <Text size="small" isSubtext>
                                The RBI&rsquo;s own reading: the rise is &ldquo;fuelled more by an expansion in the
                                number of borrowers rather than just through an increase in average
                                indebtedness&rdquo;—Deputy Governor M Rajeshwar Rao, July 2025.
                            </Text>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="women" ref={stepRef(6)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                                The lights came on fastest for women
                            </Heading6>
                            <Text fontStyle="serif">
                                Women&rsquo;s accounts: <strong>2.6 crore → 10.3 crore</strong>. One in five
                                individual borrowers in 2015; nearly one in three today. Women&rsquo;s borrower
                                count grew <strong>4×</strong> against men&rsquo;s 2.7×—of the 35 lit dots,
                                about 10 are now red.
                            </Text>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="agri" ref={stepRef(7)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">On the farm, it went
                                furthest</Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                Every <strong>third</strong> rupee banks lend an individual for agriculture now
                                goes to a woman. In 2014 it was every fifth.
                            </Text>
                            <Text size="small" isSubtext>
                                One caveat the regulator keeps making: strain shows first in small, unsecured
                                loans. The newest footholds sit lowest on the cushion.
                            </Text>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="dim" ref={stepRef(8)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                                Since 2024, some lights have gone out
                            </Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                Watch the field: women&rsquo;s borrower accounts peaked at <strong>11.6
                                crore</strong> in
                                March 2024 and stand at <strong>10.3 crore</strong> today — 11% below the peak — and
                                the total count of individual borrowers dipped in the year to March 2026. The
                                <em> value</em> of women&rsquo;s credit kept rising; it is the smallest accounts
                                that closed.
                            </Text>
                            <Text size="small" isSubtext>
                                The table doesn&rsquo;t say why. The timing tracks the November-2023 tightening of
                                small unsecured loans and the microfinance pullback that followed.
                            </Text>
                        </Card>
                    </Div>

                    {/* ACT III — close the loop --------------------------------------------------- */}
                    <Div className="step" data-stage="swap" ref={stepRef(9)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">Remember 2015?</Heading6>
                            <Text fontStyle="serif" marginBottom="nano">
                                Companies took ₹40 of every ₹100; individuals took ₹31. We&rsquo;re back to
                                rupees now—watch twelve years of the great swap.
                            </Text>
                            <Div className="controls" verticallyCentreItems marginBottom="nano">
                                <Button kind="secondary" size="small" onClick={playQuarters}>↺ Replay</Button>
                                <Button kind="secondary" size="small" onClick={() => {
                                    clearTimer();
                                    setQuarterIdx(Q_LAST);
                                }}>
                                    Skip to today ⏭
                                </Button>
                            </Div>
                            <input
                                type="range" min={Q_MAR_2015} max={Q_LAST} step={1} value={quarterIdx}
                                onChange={(e) => {
                                    clearTimer();
                                    setQuarterIdx(+e.target.value);
                                }}
                                aria-label="Scrub through quarters"
                            />
                            <Div className="scrub-ends">
                                <Text size="tiny" isSubtext>Mar 2015</Text>
                                <Text size="tiny" isSubtext>{QUARTERS[Q_LAST].d}</Text>
                            </Div>
                        </Card>
                    </Div>

                    <Div className="step" data-stage="done" ref={stepRef(10)}>
                        <Card className="step-card" padding="micro" shadow="soft">
                            <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                                The question has a new answer
                            </Heading6>
                            <Text fontStyle="serif">
                                Individuals hold <strong>₹{QUARTERS[Q_LAST].hi.toFixed(0)}</strong> of every ₹100
                                of bank credit today; companies hold ₹{QUARTERS[Q_LAST].pc.toFixed(0)}. The
                                crossover came in mid-2017, and the gap has widened every year since.
                            </Text>
                        </Card>
                    </Div>
                </Div>

                <Div className="dawn" />
            </Div>

            {/* ACT IV — the receipts, lights up =================================================== */}
            <Section id="receipts">
                <Row horizontalPadding="small" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Text textColour="indivara" weight="600" marginBottom="nano">THE RECEIPTS</Text>
                        <Heading4 fontStyle="serif" marginBottom="nano">Three charts, same table</Heading4>
                        <Text fontStyle="serif" opacity="80">
                            Everything above comes from one RBI return. Here is the same story in static form,
                            for the sceptics—as it should be.
                        </Text>
                    </Portion>
                </Row>

                <Row horizontalPadding="small" marginTop="medium" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            Where every ₹100 of bank credit sits
                        </Heading6>
                        <Text size="small" isSubtext marginBottom="micro">
                            Same ₹100 as the dots above, year by year. The warm band—personal loans to
                            individuals—nearly doubles from ₹16.5 to ₹30.9, and is now the biggest single
                            block of bank lending. Private companies shrink from ₹40 to ₹26.5. The pool
                            tripled—slices shifted, money wasn&rsquo;t &ldquo;taken away&rdquo;.
                        </Text>
                    </Portion>
                    <Portion>
                        <StackedShare />
                    </Portion>
                </Row>

                <Row horizontalPadding="small" marginTop="medium" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">The newcomers skew
                            female</Heading6>
                        <Text size="small" isSubtext marginBottom="micro">
                            Stock versus flow. Of every 100 borrower accounts that already existed in March
                            2015, 22 belonged to women. Of every 100 added in the eleven years since, 34 do—
                            the flow is reshaping the stock, lifting women&rsquo;s overall share of accounts
                            from 22% to 30%.
                        </Text>
                    </Portion>
                    <Portion>
                        <WomenIsotype />
                    </Portion>
                </Row>

                <Row horizontalPadding="small" marginTop="medium" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            Women&rsquo;s share, sector by sector
                        </Heading6>
                        <Text size="small" isSubtext marginBottom="micro">
                            Women&rsquo;s share of each sector&rsquo;s credit to individual borrowers, by value,
                            March 2026; the tick marks show March 2015. Agriculture leads at 33%. The one
                            decline—finance—is real and in the table.
                        </Text>
                    </Portion>
                    <Portion>
                        <WomenShareBars />
                    </Portion>
                </Row>
            </Section>

            {/* SO WHAT ============================================================================ */}
            <Section id="so-what">
                <Row horizontalPadding="medium" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion>
                        <div className="wrapper">
                            <div className="fit-text">SO WHAT?</div>
                        </div>
                    </Portion>
                </Row>

                <Row horizontalPadding="medium" gutters="huge" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="2" />

                    <Portion desktopSpan="6">
                        <Text weight="600" marginBottom="nano">THE DOOR OPENED</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            Creditworthiness got democratised
                        </Heading6>
                        <Text fontStyle="serif">
                            In 2015 a bank lent against what you already had. Today it increasingly bets on what
                            you might do. Three borrower accounts exist for every one that did eleven years
                            ago, and individuals—not companies—are now the banking system&rsquo;s biggest
                            borrowers.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="1" />

                    <Portion desktopSpan="6">
                        <Text weight="600" marginBottom="nano">THE SMALLEST LOAN MATTERS MOST</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            Breadth, not depth
                        </Heading6>
                        <Text fontStyle="serif">
                            The average loan barely outgrew the borrower count—×1.57 against ×3.0. Women&rsquo;s
                            accounts grew fastest of all, and every third farm rupee lent to an individual now
                            goes to a woman. The boom is the door opening, not a trap closing.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="1" />

                    <Portion desktopSpan="6">
                        <Text weight="600" marginBottom="nano">THE ROOM IS STILL MOSTLY DARK</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            Inclusion and fragility, one coin
                        </Heading6>
                        <Text fontStyle="serif">
                            Roughly 35 dots in 104 are lit. The same door that lets a household in is the door
                            that exposes it—strain shows first in small, unsecured loans, which is why the
                            regulator tightened them in November 2023. That strain is visible in this very
                            table: about 1.3 crore women&rsquo;s accounts have gone dark since the 2024 peak.
                            The lights came on; most of the room still waits.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="2" />
                </Row>
            </Section>

            {/* SOURCES & METHOD =================================================================================== */}
            <Section id="tloc-sources">
                <Row horizontalPadding="medium" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="half">
                        <Divider kind="secondary" verticalMargin="micro" />

                        <Text weight="600" size="tiny" verticalMargin="micro">SOURCES</Text>

                        <Text size="tiny" marginBottom="micro">
                            All credit figures—Reserve Bank of India, Basic Statistical Returns of scheduled
                            commercial banks, Table 3.2 (organisation-wise classification of outstanding credit
                            according to occupation), quarterly, March 2014 – March 2026. March-end points used
                            for annual beats; &ldquo;Individuals&rdquo; columns with the male/female split.
                        </Text>

                        <Div>
                            <Link
                                href="/stories/the-lights-came-on/rbi-bsr-table-3-2-occupation-credit.xlsx" download
                                className="download-link"
                            >
                                <Div verticallyCentreItems marginTop="nano" marginBottom="nano">
                                    <Download size="16px" />

                                    <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                        Download BSR Table 3.2 (XLSX)
                                    </Text>
                                </Div>
                            </Link>
                        </Div>

                        <Div>
                            <Link href="/publications/credit-classification" className="download-link">
                                <Div verticallyCentreItems marginBottom="nano">
                                    <Table2 size="16px" />
                                    <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                        Go to dataset
                                    </Text>
                                </Div>
                            </Link>
                        </Div>
                    </Portion>

                    <Portion desktopSpan="half">
                        <Divider kind="secondary" verticalMargin="micro" />

                        <Text weight="600" size="tiny" verticalMargin="micro">METHOD</Text>

                        <Text size="tiny" marginBottom="nano">
                            <strong>Dots, not people.</strong> Lit dots count borrower <em>accounts</em> (one person can
                            hold several); the 104-dot field counts credit-eligible<em> adults</em> (≈1,036 million;
                            TransUnion CIBIL, World Bank–based, December 2024). A deliberate proxy—directionally the
                            inclusion story, not a literal 1:1.
                        </Text>

                        <Text size="tiny" marginBottom="nano">
                            <strong>Units switch once.</strong> Acts I and III count rupees (shares of ₹100 of
                            outstanding credit; inflation cancels in shares). Act II counts borrower accounts.
                            All loan-size figures are nominal; no price adjustment is applied anywhere.
                        </Text>

                        <Text size="tiny" marginBottom="nano">
                            <strong>The decline is in the table, not smoothed over.</strong> Women&rsquo;s borrower
                            accounts peaked at 11.6 crore in March 2024 and fell to 10.3 crore by March 2026; the
                            total count of individual borrowers also dipped in the final year. The point-to-point
                            growth figures (4&times; for women, 3&times; overall) are 2015&rarr;2026 and include
                            that decline.
                        </Text>

                        <Text size="tiny">
                            <strong>Borrowed framings.</strong> &ldquo;More borrowers, not deeper debt&rdquo;—RBI
                            Deputy Governor M Rajeshwar Rao (July 2025) and RBI FSR (December 2024).
                            Banks&rsquo; shift toward retail &ldquo;to reduce concentration of exposures to large
                            corporates&rdquo;—IMF FSAP. &ldquo;Inclusion and aspiration&rdquo; that must not
                            &ldquo;morph into systemic over-indebtedness&rdquo;—CAFRAL, 2026. November-2023
                            unsecured risk-weight action—RBI notification RBI/2023-24/85.
                        </Text>
                    </Portion>
                </Row>
            </Section>
        </Article>
    );
};
