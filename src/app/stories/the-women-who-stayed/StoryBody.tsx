"use client";

// The story below the opening: the skeleton mountStoryBody.ts fills. The words that carry figures, the charts and
// the annexure are written in by mountStoryBody from data.ts; the fixed words (titles, notes, sources and
// method) are here. Memoised with no props, so the opening's scroll re-renders never touch what the engine drew.

// REACT CORE ==========================================================================================================
import { memo, useEffect, useRef } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { mountStoryBody } from "./mountStoryBody";

const SCENES = [ "meet", "then", "guess", "years", "now", "gap", "sectors", "turn", "latest" ] as const;

const Swatch = ({ colour } : { colour : string }) => <i className="sw" style={{ background : colour }} />;

export const StoryBody = memo(function StoryBody() {
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const root = rootRef.current; if (!root) return;
        return mountStoryBody(root);
    }, []);

    return (
        <div className="story-body" ref={rootRef}>
            {/* THE PLOTS ======================================================================================== */}
            <section className="act" aria-label="100 rural men and 100 rural women who work, survey by survey">
                <div className="stage" id="wws-stage" aria-hidden="true">
                    <div className="land"><canvas id="wws-land" /></div>
                    <canvas className="plots-gl" id="wws-gl" />
                    <div className="plots-veil" />
                    <svg id="wws-world" />
                    <div className="stage-caption" id="stage-caption">
                        <div>Each figure is one of 100 rural workers</div>
                        <div className="keys" id="caption-keys" />
                    </div>
                    <div className="place-label" id="lab-factory" />
                    <div className="place-label" id="lab-shops" />
                    <div className="place-label" id="lab-men" />
                    <div className="place-label" id="lab-women" />
                    <div className="year-badge is-hidden" id="year-badge" />
                </div>
                <div className="steps">
                    {SCENES.map(s => <div className={`step step-${s}`} data-scene={s} key={s}><div className="step-card" id={`card-${s}`} /></div>)}
                </div>
            </section>

            {/* THE LONG VIEW ==================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">The long view</div>
                        <h2 className="chapter-title">The men left farm work twice as fast as the women</h2>
                        <div id="long-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Share of rural workers who work in agriculture</span>
                            <span className="figure-units">Per cent of those who usually work, by survey. The shaded years have no survey in DBIE’s table.</span>
                        </div>
                        <div className="legend"><span><Swatch colour="var(--women)" />Women</span><span><Swatch colour="var(--men)" />Men</span></div>
                        <div className="chart-box" id="line-box" />
                        <details className="table-view"><summary>Table view</summary><div className="table-scroll"><table id="table-all" /></div></details>
                        <p className="figure-note">DBIE, Handbook of Statistics, report 134, rural. Usual status, principal and subsidiary together.</p>
                    </figure>
                </div>
            </section>

            {/* WHERE THE WORK WENT ============================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">Where the work went</div>
                        <h2 className="chapter-title">Men moved into industry, and the women who left went into services</h2>
                        <div id="went-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Where rural workers work, then and now</span>
                            <span className="figure-units">Per cent of rural workers in each sector</span>
                        </div>
                        <div className="legend"><span><Swatch colour="var(--agri)" />Agriculture</span><span><Swatch colour="var(--ind)" />Industry, including construction</span><span><Swatch colour="var(--serv)" />Services</span></div>
                        <div className="chart-box" id="bars-box" />
                        <p className="figure-note">DBIE, Handbook of Statistics, report 134, rural. Industry is mining, manufacturing, electricity and water, and construction.</p>
                    </figure>
                </div>
            </section>

            {/* WHY THE MEN LEFT ================================================================================= */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">Why the men left</div>
                        <h2 className="chapter-title">A day on a building site pays more than a day in the field</h2>
                        <div id="wage-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">What a day’s work pays a rural man</span>
                            <span className="figure-units">Average daily wage, all-India, ₹, by financial year. DBIE publishes these wages for men only.</span>
                        </div>
                        <div className="legend" id="wage-legend" />
                        <div className="chart-box" id="wage-box" />
                        <div className="figure-head" style={{ marginTop : 20 }}>
                            <span className="figure-title">How much more than farm work each job pays</span>
                            <span className="figure-units">Premium over a general farm labourer’s daily wage, per cent</span>
                        </div>
                        <div className="chart-box" id="premium-box" />
                        <p className="figure-note">DBIE, SDMX series WAGE_RATES_RN, average daily wage rates in rural India for men, all-India, averaged over each financial year (2019-20 and 2020-21 have ten monthly readings each). Farm workers’ prices: DBIE, consumer price index for agricultural labourers, general index, base 1986-87.</p>
                    </figure>
                </div>
            </section>

            {/* THE TURN BACK ==================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">The turn back</div>
                        <h2 className="chapter-title">After 2018-19, more women went back to the farm</h2>
                        <div id="turn-prose" />
                    </div>
                    <div className="facts" id="turn-facts" />
                </div>
            </section>

            {/* IN SHORT ========================================================================================= */}
            <section className="in-short">
                <h2 className="so-title">In short</h2>
                <div className="so-grid" id="so-grid" />
                <p className="closing" id="closing" />
                <div className="farm-strip" aria-hidden="true">
                    <svg viewBox="0 0 1240 170" preserveAspectRatio="xMidYMax slice">
                        <path d="M0 100 Q160 70 320 92 T640 88 T960 84 T1240 92 V102 H0 Z" fill="#c9d9c2" />
                        <rect x="0" y="99" width="1240" height="8" fill="#dcc69c" />
                        <g transform="translate(40 100) scale(0.9)"><use href="#t-palm" /></g>
                        <g transform="translate(120 100) scale(0.8)"><use href="#t-mango" /></g>
                        <g transform="translate(330 104) scale(1.1)"><use href="#t-chilli" /></g>
                        <g transform="translate(470 106) scale(0.95)"><use href="#v-cart" /></g>
                        <g transform="translate(760 106) scale(0.95)"><use href="#v-tractor" /></g>
                        <g transform="translate(1000 100) scale(0.8)"><use href="#t-mango" /></g>
                        <g transform="translate(1110 100) scale(1)"><use href="#t-palm" /></g>
                        <g transform="translate(1180 100) scale(0.75)"><use href="#t-palm" /></g>
                        <g transform="translate(600 40)"><use href="#bird" /></g><g transform="translate(620 48) scale(0.8)"><use href="#bird" /></g><g transform="translate(640 38) scale(0.9)"><use href="#bird" /></g>
                        <g transform="translate(560 160) scale(1.4)"><use href="#fig-woman" /></g>
                        <g transform="translate(600 160) scale(1.4)"><use href="#fig-man" /></g>
                    </svg>
                </div>
            </section>

            {/* ANNEXURE ========================================================================================= */}
            <section className="annexure">
                <div className="kicker">Annexure</div>
                <h2 className="chapter-title">The DBIE tables behind this story</h2>
                <p className="para">Every number on this page comes from these tables on the Reserve Bank’s Database on Indian Economy (DBIE). Each link opens the DBIE section that holds the table; the figures used here are given in full under each one.</p>
                <div id="annex-list" />
            </section>

            {/* SOURCES AND METHOD =============================================================================== */}
            <section className="sources">
                <div>
                    <h3>SOURCES</h3>
                    <p><strong>Workers.</strong> Reserve Bank of India, Database on Indian Economy (DBIE), Handbook of Statistics on the Indian Economy, report 134: Employment situation in India, per 1000 distribution of usually employed by broad groups of industry, rural and urban, men and women. Its source is the National Statistics Office: NSS rounds 56 to 68 (2000-01 to 2011-12) and the Periodic Labour Force Survey from 2017-18.</p>
                    <p><strong>Wages.</strong> DBIE, SDMX series WAGE_RATES_RN, average daily wage rates in rural India for men, all-India: general agricultural labourers, non-agricultural labourers, construction workers, carpenters and masons; and the consumer price index for agricultural labourers.</p>
                    <p><strong>Further reading, for context only; no figure here comes from it.</strong> <a href="https://www.downtoearth.org.in/agriculture/half-of-indias-women-farmers-recorded-as-unpaid-helpers-report-says" target="_blank" rel="noopener noreferrer">Down To Earth: Half of India’s women farmers recorded as unpaid helpers, report says</a>; <a href="https://centerforfoodsafety.org/blog/17-reasons-to-celebrate-women-in-agriculture/" target="_blank" rel="noopener noreferrer">Center for Food Safety: 17 reasons to celebrate women in agriculture</a>.</p>
                </div>
                <div>
                    <h3>METHOD</h3>
                    <p><strong>Shares of workers, not numbers of people.</strong> DBIE gives, for every thousand people who usually work, how many work in each sector. The percentages here are those counts divided by ten: 727 in every thousand is 72.7%. DBIE has no count of workers, so it cannot give women’s share of all farm workers.</p>
                    <p><strong>Usual status.</strong> The figures count principal and subsidiary activity together, DBIE’s “ALL” columns, the only basis the table gives for every survey.</p>
                    <p><strong>The sectors.</strong> Primary is agriculture and allied activities. Secondary, called industry here, is mining and quarrying, manufacturing, electricity and water, and construction. Tertiary, called services, is trade, hotels and restaurants, transport, storage and communication, and other services.</p>
                    <p><strong>Breaks in the series.</strong> The NSS rounds and the PLFS differ in design. The rounds cover periods of different length: some half-years, the PLFS July-to-June years, and the calendar years 2024 and 2025. DBIE’s table has no survey between 2011-12 and 2017-18.</p>
                    <p><strong>No age groups.</strong> DBIE’s employment table gives no ages, and its only table by age is of bank depositors, not workers.</p>
                    <p><strong>The pictures.</strong> The 3D farm at the top, the landscape, trees, birds, carts, tractors and buildings are decoration. Only the figures in the fields, the factory yard and the shop front stand for data: each is one in every hundred rural workers.</p>
                    <p><strong>Nothing typed from elsewhere.</strong> Every number on this page is read from the DBIE tables named above.</p>
                </div>
            </section>
        </div>
    );
});
