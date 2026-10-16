"use client";

// The story below the opening: the skeleton mountStoryBody.ts fills. The words that carry figures, the charts, the
// tables and the annexure are written in by mountStoryBody from data.ts; the fixed words (titles, notes and method)
// are here. Memoised with no props, so the opening's scroll re-renders never touch what the engine drew.

// REACT CORE ==========================================================================================================
import { memo, useEffect, useRef } from "react";
import type React from "react";

// LOCAL COMPONENTS ====================================================================================================
import { mountStoryBody } from "./mountStoryBody";

const Swatch = ({ colour } : { colour : string }) => <i className="sw" style={{ background : colour }} />;
// a one-line note that explains a term or a gap, in plain words
const Clarify = ({ id, children } : { id ? : string; children ? : React.ReactNode }) => <p className="clarify" id={id}>{children}</p>;

export const StoryBody = memo(function StoryBody() {
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const root = rootRef.current; if (!root) return;
        return mountStoryBody(root);
    }, []);

    return (
        <div className="story-body" ref={rootRef}>
            {/* AT A GLANCE: what India grows, sells abroad and buys from abroad the most ============================ */}
            <section className="glance" id="glance">
                <div className="glance-head">
                    <span className="kicker">India’s food at a glance</span>
                    <h2 className="chapter-title">What India grows, sells and buys the most</h2>
                </div>
                <div className="glance-grid">
                    <div className="glance-col"><h3>Grows the most</h3><p className="glance-units" id="gl-grow-units" /><ol className="glance-list" id="gl-grow" /><p className="glance-note" id="gl-grow-note" /></div>
                    <div className="glance-col is-in"><h3>Sells abroad the most</h3><p className="glance-units" id="gl-sell-units" /><ol className="glance-list" id="gl-sell" /></div>
                    <div className="glance-col is-out"><h3>Buys from abroad the most</h3><p className="glance-units" id="gl-buy-units" /><ol className="glance-list" id="gl-buy" /><p className="glance-note" id="gl-buy-note" /></div>
                </div>
                <Clarify>DBIE has no figures for other countries, so this shows what India itself grows, sells and buys the most, not how India ranks in the world.</Clarify>
            </section>

            {/* 1. WHAT INDIA GROWS ============================================================================== */}
            <section className="chapter" id="grows">
                <div className="row">
                    <div>
                        <div className="ch-head"><span className="ch-no">01</span><span className="kicker">What India grows</span></div>
                        <h2 className="chapter-title" id="grow-title" />
                        <div id="grow-prose" />
                        <Clarify id="grow-lakh" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">How much India grows each year</span>
                            <span className="figure-units" id="grow-units" />
                        </div>
                        <div className="legend">
                            <span><Swatch colour="var(--rice)" />Rice</span><span><Swatch colour="var(--wheat)" />Wheat</span>
                            <span><Swatch colour="var(--pulses)" />Pulses (dal)</span><span><Swatch colour="var(--oil)" />Oilseeds</span>
                        </div>
                        <div className="chart-box" id="grow-box" />
                        <div className="work" id="grow-work" />
                        <details className="table-view"><summary>Table view</summary><div className="table-scroll"><table id="grow-table" /></div></details>
                        <p className="figure-note" id="grow-note" />
                    </figure>
                </div>

                {/* one hectare, then and now */}
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">One hectare, then and now</h3>
                        <div id="acre-prose" />
                        <Clarify>A hectare is about two and a half acres, a little bigger than a football field. A sack here holds 50 kg.</Clarify>
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">What one hectare gives, in 50 kg sacks</span>
                            <span className="figure-units" id="acre-units" />
                        </div>
                        <div id="acre-box" />
                    </figure>
                </div>

                {/* why pulses and oil come from abroad */}
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">Why some dal and oil come from abroad</h3>
                        <div id="why-prose" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">How many times more each hectare gives now</span>
                            <span className="figure-units" id="why-units" />
                        </div>
                        <div className="st-bars" id="why-bars" />
                        <details className="table-view"><summary>Table view</summary><div className="table-scroll"><table id="why-table" /></div></details>
                    </figure>
                </div>
            </section>

            {/* 2. WHICH STATE GROWS WHAT ======================================================================== */}
            <section className="chapter" id="states">
                <div className="row is-text">
                    <div>
                        <div className="ch-head"><span className="ch-no">02</span><span className="kicker">Which state grows what</span></div>
                        <h2 className="chapter-title" id="sg-title" />
                        <div id="sg-prose" />
                        <Clarify id="sg-why-year" />
                        <Clarify id="sg-merged" />
                    </div>
                </div>
                {/* the biggest grower of each crop, then and now; a card picks its crop in the chart below */}
                <div className="top-growers">
                    <h3 className="sub-title" id="tg-title" />
                    <p className="tg-units" id="tg-units" />
                    <div className="tg-grid" id="tg-grid" role="list" />
                    <Clarify>These are all the crops DBIE gives state by state. It has no state figures for fruit, vegetables, milk or spices.</Clarify>
                </div>
                <div className="st-grid" id="sg-chart">
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title" id="sg-figtitle" />
                            <span className="figure-units" id="sg-units" />
                        </div>
                        <div className="st-jobs" role="group" aria-label="Crop" id="sg-crops" />
                        <div className="legend" id="sg-legend" />
                        <div className="dumb" id="sg-bars" />
                        <details className="table-view"><summary>Table view</summary><div className="table-scroll"><table id="sg-table" /></div></details>
                    </figure>
                    <div className="st-side">
                        <figure className="figure st-pick">
                            <label className="st-pick-head" htmlFor="sg-select">Find your state</label>
                            <select id="sg-select" className="st-select" />
                            <div id="sg-card" />
                        </figure>
                    </div>
                </div>
                <p className="state-note" id="sg-note" />
            </section>

            {/* 3. WHAT THE GOVERNMENT BUYS ====================================================================== */}
            <section className="chapter" id="buys">
                <div className="row">
                    <div>
                        <div className="ch-head"><span className="ch-no">03</span><span className="kicker">What the government buys</span></div>
                        <h2 className="chapter-title" id="buy-title" />
                        <Clarify>The minimum support price (MSP) is the price the government announces for a crop each season.</Clarify>
                        <Clarify>Procurement means the grain the government buys, mainly to keep in stock and give out through ration shops.</Clarify>
                        <div id="buy-prose" />
                        <div className="fact msp-list" id="msp-list" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Rice and wheat the government bought, gave out and kept</span>
                            <span className="figure-units" id="pds-units" />
                        </div>
                        <div className="legend">
                            <span><Swatch colour="var(--buy)" />Bought from farmers</span><span><Swatch colour="var(--give)" />Given out (mostly through ration shops)</span><span><Swatch colour="var(--stock)" />In stock</span>
                        </div>
                        <div className="chart-box" id="pds-box" />
                        <p className="pds-line" id="pds-line" />
                        <div className="work" id="proc-work" />
                        <p className="figure-note" id="pds-note" />
                    </figure>
                </div>
            </section>

            {/* 4. SUPPORT PRICES AND EVERYDAY COSTS ============================================================= */}
            <section className="chapter" id="prices">
                <div className="row">
                    <div>
                        <div className="ch-head"><span className="ch-no">04</span><span className="kicker">Support prices and everyday costs</span></div>
                        <h2 className="chapter-title" id="msp-title" />
                        <div id="msp-prose" />
                        <Clarify>Everyday costs here are the prices of the things a farm worker’s family buys, such as food, fuel and clothes. They are the same figures as in “The women who stayed”.</Clarify>
                        <Clarify>For sugarcane, the price is the fair and remunerative price, which sugar mills pay.</Clarify>
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title" id="msp-figtitle" />
                            <span className="figure-units" id="msp-units" />
                        </div>
                        <div className="legend">
                            <span><Swatch colour="var(--crop)" />Support price</span>
                            <span><i className="sw sw-line" style={{ borderColor : "var(--cost)" }} />Everyday costs</span>
                            <span><i className="sw sw-line" style={{ borderColor : "var(--wage)" }} />A day’s farm wage</span>
                        </div>
                        <div className="msp-bars" id="msp-bars" />
                        <details className="table-view"><summary>Table view</summary><div className="table-scroll"><table id="msp-table" /></div></details>
                        <p className="figure-note" id="msp-note" />
                    </figure>
                </div>
                {/* the worked sums, in plain view */}
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">How we worked it out</h3>
                        <p className="para">Each “times” figure is the later amount divided by the earlier one. Here are three of them in full.</p>
                    </div>
                    <div className="work work-big" id="msp-work" />
                </div>
                {/* what a day of farm work buys at the support price */}
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">What one day of farm work buys at the support price</h3>
                        <div id="buy-day-prose" />
                        <Clarify>A quintal is 100 kg. Shop prices are higher than the support price, so this is a way to compare, not a shopping bill.</Clarify>
                    </div>
                    <div className="facts" id="buy-day" />
                </div>
            </section>

            {/* 5. MONEY OUT, MONEY IN =========================================================================== */}
            <section className="chapter" id="trade">
                <div className="row">
                    <div>
                        <div className="ch-head"><span className="ch-no">05</span><span className="kicker">Money out, money in</span></div>
                        <h2 className="chapter-title" id="trade-title" />
                        <div id="trade-prose" />
                        <Clarify>Trade is counted in US dollars: the money paid or earned, not the amount of food.</Clarify>
                        <Clarify id="trade-provisional" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Farm goods India sold abroad and bought from abroad</span>
                            <span className="figure-units">US$ billion a year</span>
                        </div>
                        <div className="legend"><span><Swatch colour="var(--money-in)" />Sold abroad (money in)</span><span><Swatch colour="var(--money-out)" />Bought from abroad (money out)</span></div>
                        <div className="chart-box" id="trade-box" />
                        <p className="figure-note" id="trade-note" />
                    </figure>
                </div>
                <div className="trade-items">
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title" id="ex-title" />
                            <span className="figure-units">US$ billion</span>
                        </div>
                        <div className="st-bars items-in" id="ex-bars" />
                    </figure>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title" id="im-title" />
                            <span className="figure-units">US$ billion</span>
                        </div>
                        <div className="st-bars items-out" id="im-bars" />
                        <div className="fact fert" id="fert-fact" />
                    </figure>
                </div>
                <details className="table-view trade-table"><summary>Table view: each item, then and now</summary><div className="table-scroll"><table id="trade-table" /></div></details>
                <div className="row st-gap">
                    <div>
                        <h3 className="sub-title">Rice sold, oil and dal bought</h3>
                        <div id="long-prose" />
                        <Clarify id="long-clarify" />
                    </div>
                    <figure className="figure">
                        <div className="figure-head">
                            <span className="figure-title">Rice sold abroad against cooking oil and pulses bought</span>
                            <span className="figure-units">US$ billion a year</span>
                        </div>
                        <div className="legend"><span><Swatch colour="var(--rice)" />Rice sold</span><span><Swatch colour="var(--oil)" />Cooking oil bought</span><span><Swatch colour="var(--pulses)" />Pulses bought</span></div>
                        <div className="chart-box" id="long-box" />
                    </figure>
                </div>
            </section>

            {/* IN SHORT ========================================================================================= */}
            <section className="in-short">
                <div className="receipt-head"><span className="receipt-shop">From field to thali</span><span className="receipt-sub">The bill, in short</span></div>
                <h2 className="so-title">In short</h2>
                <div className="so-grid" id="so-grid" />
                <p className="closing" id="closing" />
            </section>

            {/* ANNEXURE ========================================================================================= */}
            <section className="annexure" id="annexure">
                <div className="kicker">Annexure</div>
                <h2 className="chapter-title">The DBIE tables behind this story</h2>
                <p className="para">Every number on this page comes from these tables on the Reserve Bank’s Database on Indian Economy (DBIE). Each link opens the table on this site; the figures used here are given under each one, and the full series can be downloaded.</p>
                <div id="annex-list" />
                <p className="para downloads" id="downloads" />
            </section>

            {/* REFERENCES AND METHOD ============================================================================ */}
            <section className="sources">
                <div>
                    <h3>REFERENCES</h3>
                    <p><strong>The figures.</strong> Every figure on this page comes from the DBIE tables listed in the <a href="#annexure">annexure</a> above, each linked to its page on this site.</p>
                    <p><strong>A related story.</strong> <a href="/stories/the-women-who-stayed">The women who stayed</a> uses the same farm wage and the same everyday costs, for the same years.</p>
                </div>
                <div>
                    <h3>METHOD</h3>
                    <p><strong>Crop years and estimates.</strong> Farm output is counted by crop year, July to June. The latest year in DBIE’s tables is an advance estimate, so the comparisons stop at the year before it; the charts show the estimate, marked.</p>
                    <p><strong>States.</strong> DBIE’s state table runs to the year it names, but its latest years leave out some states. The comparison uses the latest year in which every state and the union territories report. States formed since 1980-81 are counted with the states they were part of, for the comparison with 1980-81 only.</p>
                    <p><strong>The share the government buys.</strong> Rice bought in a year is set against that year’s rice harvest. Wheat is sown in winter and bought the following spring, so wheat bought in a year is set against the previous year’s wheat harvest. The result is rounded, and the words say “about”.</p>
                    <p><strong>Support prices, wages and costs.</strong> All three are compared over the same ten years. The farm wage is the daily wage of a general farm labourer (men; DBIE publishes no women’s series), and everyday costs are the consumer price index for agricultural labourers, both averaged over each financial year.</p>
                    <p><strong>Farm trade.</strong> The farm items are those DBIE lists under agriculture and allied products, with fertiliser shown on its own. DBIE changed its list of items in 2009-10; before that, cooking oil is listed as “edible oils”.</p>
                    <p><strong>The pictures.</strong> The 3D field, mill, shop and thali at the top are decoration; they carry no figures.</p>
                </div>
            </section>
        </div>
    );
});
