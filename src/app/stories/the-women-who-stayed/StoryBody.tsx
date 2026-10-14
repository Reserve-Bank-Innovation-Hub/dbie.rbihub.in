"use client";

// The story below the opening: the skeleton mountStoryBody.ts fills. The words that carry figures, the charts and
// the annexure are written in by mountStoryBody from data.ts; the fixed words (titles, notes, references and
// method) are here. Memoised with no props, so the opening's scroll re-renders never touch what the engine drew.

// REACT CORE ==========================================================================================================
import { memo, useEffect, useRef, useState } from "react";

// LOCAL COMPONENTS ====================================================================================================
import { mountStoryBody } from "./mountStoryBody";
import { SurveyTimeline, createTlBus } from "./SurveyTimeline";

// The scroll steps: everyone in the field, 2000-01, the guess; then one long step where the timeline plays the surveys
// from 2000-01 to 2025 by itself and its cards come up as their years arrive (PLAY_CARDS, in that order).
const SCENES = [ "meet", "then", "guess", "play" ] as const;
const PLAY_CARDS = [ "years", "turn", "now", "gap", "sectors", "latest" ] as const;

const Swatch = ({ colour } : { colour : string }) => <i className="sw" style={{ background : colour }} />;

export const StoryBody = memo(function StoryBody() {
    const rootRef = useRef<HTMLDivElement>(null);
    // the channel between the plots' engine and the survey timeline: one per mount
    const [ bus ] = useState(createTlBus);
    useEffect(() => {
        const root = rootRef.current; if (!root) return;
        return mountStoryBody(root, bus);
    }, [ bus ]);

    return (
        <div className="story-body" ref={rootRef}>
            {/* THE PLOTS ======================================================================================== */}
            <section className="act" aria-label="100 rural men and 100 rural women who work, survey by survey">
                <div className="stage" id="wws-stage">
                    {/* the picture and its labels repeat what the cards say, so screen readers skip them */}
                    <div className="stage-art" aria-hidden="true">
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
                </div>
                {/* the survey timeline, on its own pinned layer so the cards pass under it; filled in and driven by
                    mountStoryBody once the 3D plots are running */}
                <div className="tl-pin">
                    <div className="tl" id="wws-tl" role="group" aria-label="Survey timeline"><SurveyTimeline bus={bus} /></div>
                </div>
                <div className="steps">
                    {/* the first step has no card: it holds everyone in the field while the plots rise into view */}
                    {SCENES.map(s => (
                        <div className={`step step-${s}`} data-scene={s} key={s}>
                            {s === "play"
                                ? <div className="card-stack">{PLAY_CARDS.map(c => <div className="step-card" id={`card-${c}`} key={c} />)}</div>
                                : s !== "meet" && <div className="step-card" id={`card-${s}`} />}
                        </div>
                    ))}
                </div>
            </section>

            {/* THE LONG VIEW ==================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">The long view</div>
                        <h2 className="chapter-title">Men moved out of farming twice as fast as women</h2>
                        <div id="long-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Rural workers in farming</span>
                            <span className="figure-units">Per cent of rural men and women who work, by survey. The grey band marks years with no survey.</span>
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
                        <div className="kicker">Where people found work</div>
                        <h2 className="chapter-title">Men moved mostly into industry; women who changed work moved into services</h2>
                        <div id="went-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Where rural men and women work, then and now</span>
                            <span className="figure-units">Per cent of rural men and women who work, in each kind of work</span>
                        </div>
                        <div className="legend"><span><Swatch colour="var(--agri)" />Agriculture</span><span><Swatch colour="var(--ind)" />Industry, including construction</span><span><Swatch colour="var(--serv)" />Services</span></div>
                        <div className="chart-box" id="bars-box" />
                        <p className="figure-note">DBIE, Handbook of Statistics, report 134, rural. Industry is mining, manufacturing, electricity and water, and construction.</p>
                    </figure>
                </div>
            </section>

            {/* THE TURN BACK ==================================================================================== */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">A change after 2018-19</div>
                        <h2 className="chapter-title">After 2018-19, more women worked in farming again</h2>
                        <div id="turn-prose" />
                    </div>
                    <div className="facts" id="turn-facts" />
                </div>
            </section>

            {/* TOWNS AS WELL AS VILLAGES ======================================================================== */}
            <section className="chapter" id="towns">
                <div className="row">
                    <div>
                        <div className="kicker">Towns as well as villages</div>
                        <h2 className="chapter-title" id="towns-title" />
                        <div id="towns-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Where urban men and women work, then and now</span>
                            <span className="figure-units">Per cent of urban men and women who work, in each kind of work</span>
                        </div>
                        <div className="legend"><span><i className="sw" style={{ background : "var(--agri)" }} />Farming</span><span><i className="sw" style={{ background : "var(--ind)" }} />Industry, including construction</span><span><i className="sw" style={{ background : "var(--serv)" }} />Services</span></div>
                        <div className="chart-box" id="towns-box" />
                        <p className="figure-note">DBIE, Handbook of Statistics, Table 154 (annexure A1), urban.</p>
                    </figure>
                </div>
            </section>

            {/* WHY THE MEN LEFT ================================================================================= */}
            <section className="chapter">
                <div className="row">
                    <div>
                        <div className="kicker">What the work pays</div>
                        <h2 className="chapter-title">A day on a building site pays more than a day in the field</h2>
                        <div id="wage-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">What a day’s work pays a rural man</span>
                            <span className="figure-units">Average daily wage in ₹, all-India, by financial year. DBIE publishes these wages for men only.</span>
                        </div>
                        <div className="legend" id="wage-legend" />
                        <div className="chart-box" id="wage-box" />
                        <div className="figure-head" style={{ marginTop : 20 }}>
                            <span className="figure-title">How much more than farm work each job pays</span>
                            <span className="figure-units">How much more each job pays than a farm labourer’s daily wage, in per cent</span>
                        </div>
                        <div className="chart-box" id="premium-box" />
                        <p className="figure-note">DBIE wage rates (annexure A2), financial-year averages; 2019-20 and 2020-21 have ten monthly readings each.</p>
                    </figure>
                </div>
                {/* what a day's farm wage buys, year by year */}
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">What a day’s farm wage buys</h3>
                        <div id="real-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">A day’s farm wage against everyday costs</span>
                            <span className="figure-units" id="real-units" />
                        </div>
                        <div className="legend"><span><i className="sw" style={{ background : "var(--agri)" }} />A day’s farm wage</span><span><i className="sw" style={{ background : "#b4432b" }} />Everyday costs: food, fuel, clothes</span></div>
                        <div className="chart-box" id="real-box" />
                        <p className="figure-note">DBIE wage rates (annexure A2) and the consumer price index for agricultural labourers (annexure A3), financial-year averages.</p>
                    </figure>
                </div>
            </section>

            {/* EVERY RURAL JOB: what a day pays in each, and whether farm pay moves with the seasons ============ */}
            <section className="chapter" id="jobs">
                <div className="row">
                    <div>
                        <div className="kicker">Which rural jobs pay the most?</div>
                        <h2 className="chapter-title" id="jobs-title" />
                        <div id="jobs-prose" />
                        <div className="fact season" id="season" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title" id="jobs-figtitle" />
                            <span className="figure-units" id="jobs-units" />
                        </div>
                        <div className="legend"><span><i className="sw" style={{ background : "var(--agri)" }} />Farm work</span><span><i className="sw" style={{ background : "var(--ind)" }} />Other work</span></div>
                        <div className="st-bars jobs-bars" id="jobs-bars" />
                        <p className="figure-note">DBIE wage rates (annexure A2), all-India, men only.</p>
                    </figure>
                </div>
            </section>

            {/* SAME WORK, DIFFERENT PAY: wages and prices state by state ======================================== */}
            <section className="chapter" id="states">
                <div className="row is-text">
                    <div>
                        <div className="kicker">Same work, different pay</div>
                        <h2 className="chapter-title" id="st-title" />
                        <div id="st-prose" />
                    </div>
                </div>
                <div className="st-grid">
                    {/* 1. a guess, then every state ranked by what a day of the same work pays */}
                    <figure className="figure st-rank">
                        <div className="st-guess" id="st-guess" />
                        <div className="st-reveal" id="st-reveal" hidden>
                            <div className="figure-head">
                                <span className="figure-title">What a day’s work pays, state by state</span>
                                <span className="figure-units" id="st-units" />
                            </div>
                            <div className="st-jobs" role="group" aria-label="Kind of work" id="st-jobs" />
                            <div className="st-bars" id="st-bars" />
                        </div>
                    </figure>
                    {/* 3 and 4. one day here is how many days there; pick a state */}
                    <div className="st-side">
                        <div className="fact st-days" id="st-days" />
                        <figure className="figure st-pick">
                            <label className="st-pick-head" htmlFor="st-select">Pick a state</label>
                            <select id="st-select" className="st-select" />
                            <div id="st-card" />
                        </figure>
                    </div>
                </div>
                {/* site against farm: how much more a day of construction work pays than a day of farm work, by state */}
                <div className="st-gaphead">
                    <div className="kicker">Site or farm?</div>
                    <h3 className="chapter-title">A building site pays the most extra where farm work pays the least</h3>
                </div>
                <figure className="figure st-gapfig">
                    <div className="figure-head">
                        <span className="figure-title">Does a building site pay more than a farm?</span>
                        <span className="figure-units" id="gap-units" />
                    </div>
                    <div className="st-bars gap-bars" id="gap-bars" />
                    <p className="st-gapnote" id="gap-note" />
                </figure>
                <p className="st-coverage" id="st-coverage" />
                <p className="state-note" id="st-note" />
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
            <section className="annexure" id="annexure">
                <div className="kicker">Annexure</div>
                <h2 className="chapter-title">The DBIE tables behind this story</h2>
                <p className="para">Every number on this page comes from these tables on the Reserve Bank’s Database on Indian Economy (DBIE). Each link opens the DBIE section that holds the table; the figures used here are given in full under each one.</p>
                <div id="annex-list" />
            </section>

            {/* REFERENCES AND METHOD ============================================================================ */}
            <section className="sources">
                <div>
                    <h3>REFERENCES</h3>
                    <p><strong>The figures.</strong> Every figure on this page comes from the DBIE tables listed in the <a href="#annexure">annexure</a> above, each linked to its page on this site.</p>
                    <p><strong>Further reading, for context only; no figure here comes from these.</strong> <a href="https://www.downtoearth.org.in/agriculture/half-of-indias-women-farmers-recorded-as-unpaid-helpers-report-says" target="_blank" rel="noopener noreferrer">Down To Earth: Half of India’s women farmers recorded as unpaid helpers, report says</a>; <a href="https://centerforfoodsafety.org/blog/17-reasons-to-celebrate-women-in-agriculture/" target="_blank" rel="noopener noreferrer">Center for Food Safety: 17 reasons to celebrate women in agriculture</a>.</p>
                </div>
                <div>
                    <h3>METHOD</h3>
                    <p><strong>Shares of workers, not numbers of people.</strong> DBIE gives, for every thousand people who usually work, how many work in each sector. The percentages here are those counts divided by ten: 727 in every thousand is 72.7%. DBIE has no count of workers, so it cannot give women’s share of all farm workers.</p>
                    <p><strong>Usual status.</strong> The figures count principal and subsidiary activity together, DBIE’s “ALL” columns, the only basis the table gives for every survey.</p>
                    <p><strong>The sectors.</strong> “Farming” on this page means agriculture and allied activities, as DBIE’s table groups them, including forestry and fishing. Primary is agriculture and allied activities. Secondary, called industry here, is mining and quarrying, manufacturing, electricity and water, and construction. Tertiary, called services, is trade, hotels and restaurants, transport, storage and communication, and other services.</p>
                    <p><strong>Breaks in the series.</strong> The NSS rounds and the PLFS differ in design. The rounds cover periods of different length: some half-years, the PLFS July-to-June years, and the calendar years 2024 and 2025. DBIE’s table has no survey between 2011-12 and 2017-18.</p>
                    <p><strong>No age groups.</strong> DBIE’s employment table gives no ages, and its only table by age is of bank depositors, not workers.</p>
                    <p><strong>The pictures.</strong> The 3D farm at the top, the landscape, trees, birds, carts, tractors and buildings are decoration. Only the figures in the fields, the factory yard and the shop front stand for data: each is one in every hundred rural workers.</p>
                    <p><strong>Nothing typed from elsewhere.</strong> Every number on this page is read from the DBIE tables named above.</p>
                </div>
            </section>
        </div>
    );
});
