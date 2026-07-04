"use client";

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// UI ==================================================================================================================
import { Article, Card, Div, Divider, Heading1, Heading6, Portion, Row, Section, Text } from "fictoan-react";
import { Download } from "lucide-react";

// LOCAL COMPONENTS ====================================================================================================
import { DebtMixChart } from "./DebtMixChart";

// DATA ================================================================================================================
import { DEBT_MIX_EVENTS } from "./data";

// STYLES ==============================================================================================================
import "./concessional-share-of-total-debt-vs-commercial-borrowings.css";

const EVENT_YEARS = DEBT_MIX_EVENTS.map((e) => e.year);
const clamp = (v : number, lo : number, hi : number) => Math.max(lo, Math.min(hi, v));

export const ConcessionalVsCommercialPage = () => {
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
        <Article id="concessional-vs-commercial-page">
            {/* HERO ===================================================================================== */}
            <Section>
                <Row horizontalPadding="small" marginTop="medium" allowUltraWide marginBottom="medium">
                    <Portion desktopSpan="half">
                        <Text textColour="indivara" weight="600" marginBottom="nano">
                            CONCESSIONAL VS COMMERCIAL
                        </Text>

                        <Heading1 id="cvc-heading" marginBottom="nano">
                            From aid recipient to market borrower
                        </Heading1>

                        <Text fontStyle="serif" size="large" opacity="80" marginBottom="micro">
                            In 1991, nearly half of India&rsquo;s external debt was concessional&mdash;cheap, aid-style
                            money. By 2025 it is under 7%, while market-rate commercial borrowing has become the single
                            largest component. This is the story of a country that graduated to borrowing on ordinary
                            terms.
                        </Text>

                        <Text size="tiny" isSubtext>Scroll to begin.</Text>
                    </Portion>
                </Row>
            </Section>

            {/* SCROLLYTELLING ===================================================================================== */}
            <Div className="scrolly">
                <Div className="scrolly-chart">
                    <DebtMixChart currentYear={currentYear} />

                    <Div className="chart-legend">
                        <Div verticallyCentreItems className="legend-item">
                            <span className="legend-swatch swatch-conc" />
                            <Text size="small" weight="500">Concessional share of total debt</Text>
                        </Div>
                        <Div verticallyCentreItems className="legend-item">
                            <span className="legend-swatch swatch-comm" />
                            <Text size="small" weight="500">Commercial borrowing (₹ lakh crore)</Text>
                        </Div>
                    </Div>
                </Div>

                <Div className="scrolly-steps">
                    {DEBT_MIX_EVENTS.map((event, index) => (
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

            {/* SOURCES ================================================================================ */}
            <Section id="cvc-sources">
                <Row horizontalPadding="small" marginTop="large" marginBottom="none" allowUltraWide>
                    <Portion desktopSpan="one-third">
                        <Text isSubtext weight="600">
                            SOURCES
                        </Text>

                        <Divider kind="secondary" verticalMargin="micro" />

                        <Text>
                            Concessional debt as % of total debt, and commercial borrowing &mdash; External Debt
                            Management Unit, Ministry of Finance &amp; Reserve Bank of India
                            (&ldquo;India&rsquo;s External Debt&rdquo;, end-March, &#8377; crore).
                        </Text>

                        <a
                            href="/stories/concessional-share-of-total-debt-vs-commercial-borrowings/india-external-debt-rupees-end-march.xlsx"
                            download
                            className="download-link"
                        >
                            <Div verticallyCentreItems marginTop="nano">
                                <Download size="16px" />
                                <Text weight="600" textColour="indivara" marginLeft="nano">
                                    Download external debt data (XLSX)
                                </Text>
                            </Div>
                        </a>
                    </Portion>
                </Row>
            </Section>
        </Article>
    );
};
