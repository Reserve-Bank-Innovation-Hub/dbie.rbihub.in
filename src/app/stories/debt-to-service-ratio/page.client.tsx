"use client";

// REACT CORE ==========================================================================================================
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { Article, Card, Div, Divider, Heading1, Heading4, Heading6, Portion, Row, Section, Text } from "fictoan-react";
import { Download, Table2 } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { DebtChart } from "./DebtChart";
import { DSRComparison } from "./IndiaMap";

// DATA ================================================================================================================
import { DEBT_EVENTS } from "./data";

// STYLES ==============================================================================================================
import "./debt-to-service-ratio.css";

const EVENT_YEARS = DEBT_EVENTS.map((e) => e.year);
const clamp = (v : number, lo : number, hi : number) => Math.max(lo, Math.min(hi, v));

export const DebtToServiceRatioPage = () => {
    const stepRefs = useRef<(HTMLElement | null)[]>([]);
    const [ currentYear, setCurrentYear ] = useState(EVENT_YEARS[0]);
    const [ activeIndex, setActiveIndex ] = useState(0);

    // Single source of truth: derive a continuous year from where the cards sit relative to the
    // viewport centre. Card i is exactly at centre when the year equals EVENT_YEARS[i], so the
    // chart's playhead crosses a milestone precisely as that card reaches the middle.
    useEffect(() => {
        let raf = 0;

        const compute = () => {
            const centre = window.innerHeight / 2;
            const centres = stepRefs.current.map((el) => {
                if (!el) return Number.POSITIVE_INFINITY;
                const r = el.getBoundingClientRect();
                return r.top + r.height / 2;
            });

            // Largest index whose card centre has reached/passed the viewport centre.
            let i = -1;
            for (let k = 0; k < centres.length; k++) {
                if (centres[k] <= centre) i = k;
            }

            const last = EVENT_YEARS.length - 1;
            if (i < 0) {
                setCurrentYear(EVENT_YEARS[0]);
                setActiveIndex(0);
            } else if (i >= last) {
                setCurrentYear(EVENT_YEARS[last]);
                setActiveIndex(last);
            } else {
                const span = centres[i + 1] - centres[i];
                const t = span ? clamp((centre - centres[i]) / span, 0, 1) : 0;
                setCurrentYear(EVENT_YEARS[i] + t * (EVENT_YEARS[i + 1] - EVENT_YEARS[i]));
                setActiveIndex(t < 0.5 ? i : i + 1);
            }
        };

        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(compute);
        };

        compute();
        window.addEventListener("scroll", onScroll, {passive : true});
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <Article id="debt-to-service-ratio-page">
            {/* HERO =============================================================================================== */}
            <Section>
                <Row horizontalPadding="small" marginTop="medium" allowUltraWide marginBottom="medium">
                    <Portion desktopSpan="half">
                        <Text textColour="indivara" weight="600" marginBottom="nano">
                            DEBT-TO-SERVICE RATIO
                        </Text>

                        <Heading1 id="dsr-heading" marginBottom="nano">
                            The long walk back from 1991
                        </Heading1>

                        <Text fontStyle="serif" size="large" opacity="80" marginBottom="nano">
                            In 1991, India spent more than a third of her export earnings just servicing external debt,
                            at ~35%. Three decades later, we are at 6%. This is the timeline of how an acute external
                            crisis was resolved—and how a quieter, internal fiscal constraint took its place.
                        </Text>
                    </Portion>
                </Row>
            </Section>

            {/* MAP ================================================================================================ */}
            <Section id="dsr-map">
                <Row horizontalPadding="none" gutters="none" marginBottom="none" allowUltraWide>
                    <Portion>
                        <DSRComparison />
                    </Portion>
                </Row>
            </Section>

            {/* SCROLLYTELLING ===================================================================================== */}
            <Section id="interactive-graph">
                <Row horizontalPadding="none" gutters="none" marginBottom="medium" allowUltraWide>
                    <Portion>
                        <Heading4 weight="500" verticalMargin="small" align="centre">
                            Now let’s see the full timeline
                        </Heading4>
                        <Text align="centre">Scroll down.</Text>
                    </Portion>
                </Row>
                <Div className="scrolly">
                    <Div className="scrolly-chart">
                        <DebtChart currentYear={currentYear} />

                        <Div className="chart-legend">
                            <Div verticallyCentreItems className="legend-item">
                                <span className="legend-swatch swatch-dsr" />
                                <Text size="small" weight="500">External debt service ratio</Text>
                            </Div>
                            <Div verticallyCentreItems className="legend-item">
                                <span className="legend-swatch swatch-gg" />
                                <Text size="small" weight="500">Combined govt liabilities, % of GDP (RBI)</Text>
                            </Div>
                        </Div>
                    </Div>

                    <Div className="scrolly-steps">
                        {DEBT_EVENTS.map((event, index) => (
                            <Div
                                key={event.year}
                                className={`scrolly-step ${index === activeIndex ? "is-active" : ""}`}
                                ref={(el) => {
                                    stepRefs.current[index] = el;
                                }}
                            >
                                <Card
                                    className="step-card"
                                    padding="micro" shadow="soft"
                                >
                                    <Text
                                        className="step-year"
                                        weight="700" fontStyle="monospace" marginBottom="nano"
                                    >
                                        {event.year}
                                    </Text>

                                    <Heading6
                                        className="step-title"
                                        weight="600" fontStyle="serif" marginBottom="nano"
                                    >
                                        {event.title}
                                    </Heading6>

                                    <Text fontStyle="serif">
                                        <em>{event.body}</em>
                                    </Text>
                                </Card>
                            </Div>
                        ))}
                    </Div>
                </Div>
            </Section>

            {/* SO WHAT ============================================================================================ */}
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
                        <Text weight="600" marginBottom="nano">GRADUATION</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            The emergency is over
                        </Heading6>

                        <Text fontStyle="serif">
                            In 1991 a third of export earnings went to servicing external debt; today it is
                            near 6%. The acute crisis that forced a pledge of 67 tonnes of gold and an IMF
                            bailout simply does not exist any more.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="1" />

                    <Portion desktopSpan="6">
                        <Text weight="600" marginBottom="nano">SOVEREIGNTY</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            No one else sets the terms
                        </Heading6>

                        <Text fontStyle="serif">
                            A low debt-service burden and deep reserves let India ride out 2008, the 2013
                            taper tantrum, COVID and 2022&mdash;every shock since&mdash;without an IMF
                            programme. It went from pledging gold to the Fund to lending to it.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="1" />

                    <Portion desktopSpan="6">
                        <Text weight="600" marginBottom="nano">THE CONSTRAINT MOVED</Text>
                        <Heading6 fontStyle="serif" weight="600" marginBottom="nano">
                            From external to internal
                        </Heading6>

                        <Text fontStyle="serif">
                            External vulnerability is near zero&mdash;but it did not vanish, it moved inward.
                            Combined government liabilities touched ~89% of GDP in the pandemic year, and
                            interest now absorbs roughly a third of the union government&rsquo;s revenue
                            receipts&mdash;its largest single head of spending. The discipline 1991 demanded
                            is now domestic.
                        </Text>
                    </Portion>

                    <Portion desktopSpan="2" />
                </Row>
            </Section>

            {/* SOURCES ============================================================================================ */}
            <Section id="dsr-sources">
                <Row horizontalPadding="small" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="one-third">
                        <Text isSubtext weight="600" size="tiny">
                            SOURCES
                        </Text>

                        <Divider kind="secondary" verticalMargin="micro" />

                        <Text size="tiny">
                            External debt service ratio and external debt-to-GDP — External Debt Management Unit,
                            Ministry of Finance &amp; Reserve Bank of India
                            (&ldquo;India&rsquo;s External Debt&rdquo;, end-March, &#8377; crore).
                        </Text>

                        <a
                            href="/stories/debt-to-service-ratio/india-external-debt-rupees-end-march.xlsx"
                            download
                            className="download-link"
                        >
                            <Div verticallyCentreItems marginTop="nano">
                                <Download size="16px" />
                                <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                    Download external debt data (XLSX)
                                </Text>
                            </Div>
                        </a>

                        <Link href="/publications/external-debt" className="download-link">
                            <Div verticallyCentreItems marginTop="nano">
                                <Table2 size="16px" />
                                <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                    Go to dataset
                                </Text>
                            </Div>
                        </Link>

                        <Divider kind="tertiary" verticalMargin="micro" />

                        <Text size="tiny">
                            Combined liabilities of the Centre and state governments as % of GDP — Reserve Bank
                            of India, via this site&rsquo;s own dataset (fiscal years ending March). A separate
                            domestic series, shown for context; explore the full table at{" "}
                            <Link href="/tables/debt-indicators-of-government-as-percentage-to-gdp">
                                debt indicators of government
                            </Link>.
                        </Text>

                        <a
                            href="/stories/debt-to-service-ratio/govt-debt-to-gdp-rbi.csv"
                            download
                            className="download-link"
                        >
                            <Div verticallyCentreItems marginTop="nano">
                                <Download size="16px" />
                                <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                    Download combined govt liabilities data (CSV)
                                </Text>
                            </Div>
                        </a>

                        <Link href="/tables/debt-indicators-of-government-as-percentage-to-gdp" className="download-link">
                            <Div verticallyCentreItems marginTop="nano">
                                <Table2 size="16px" />
                                <Text weight="600" textColour="indivara" marginLeft="nano" size="tiny">
                                    Go to dataset
                                </Text>
                            </Div>
                        </Link>
                    </Portion>
                </Row>
            </Section>
        </Article>
    );
};
