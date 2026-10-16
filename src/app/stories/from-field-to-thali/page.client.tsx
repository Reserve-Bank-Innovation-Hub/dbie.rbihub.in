"use client";

// From field to thali: the opening. A scroll-driven 3D thali (ThaliStage) under the title, whose katoris hold a wheat
// field at harvest, a mill and a kirana shop where dal is weighed and oil handed over; at the end the camera rises over
// the whole plate. The captions
// say in words what the picture shows, for every reader and for screen readers. The scene carries no number; the
// chapters with the DBIE figures follow in StoryBody.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { BEATS } from "./thaliScene";
import { StoryBody } from "./StoryBody";
import { HEADLINE, L0, L1, MSP_CROPS, PROC_SHARE, usd } from "./data";

// STYLES ==============================================================================================================
import "./from-field-to-thali.css";

// three.js loads only in the browser, and only on this story
const ThaliStage = dynamic(() => import("./ThaliStage"), { ssr : false, loading : () => <div className="thali-stage is-loading" /> });

// The opening's scroll: the scene plays over the first part; then it dims and the bridge paragraph says what comes next.
const SCENE_END = 0.76;
const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
const span = (p : number, a : number, b : number) => clamp01((p - a) / (b - a));

// Four small figures under the title, one for each part of the story below, each a link to its chapter.
const HERO_STATS = [
    { big : `${Math.round(L1.output.foodgrains / L0.output.foodgrains)}×`, text : `the grain India grew in ${L0.year}`, href : "#grows" },
    { big : `${Math.round(PROC_SHARE.rice)}%`, text : "of the rice harvest bought by the government", href : "#buys" },
    { big : String(MSP_CROPS.length), text : "crops with a minimum support price", href : "#prices" },
    { big : usd(HEADLINE.oilImports).replace(" billion", " bn"), text : `spent on cooking oil from abroad, ${HEADLINE.tradeYear}`, href : "#trade" },
];

const CAPTIONS = [
    { from : 0,            kicker : "In the field",       text : "Farmers cut the wheat. A woman winnows it on a soop: the light husk blows away and the grain falls into the sack, which a farmer carries to the stack." },
    { from : BEATS.mill,   kicker : "At the mill",        text : "A small truck brings the wheat to the mill. A worker carries the sacks in, where grain is cleaned and packed and seeds are pressed into oil, then loads the packed bags for the shops." },
    { from : BEATS.shop,   kicker : "At the kirana shop", text : "In a small town, the grain reaches a neighbourhood shop." },
    { from : BEATS.weigh,  kicker : "At the kirana shop", text : "The shopkeeper weighs out dal on a balance." },
    { from : BEATS.give,   kicker : "At the kirana shop", text : "Then he hands the customer the dal, a bag of rice and a bottle of cooking oil." },
    { from : BEATS.home,   kicker : "On the thali",       text : "The journey ends on an everyday thali: rice, roti, dal and sabzi. Some of the dal and the cooking oil came from abroad." },
];

export const FromFieldToThaliPage = () => {
    const openingRef = useRef<HTMLElement>(null);
    const [ progress, setProgress ] = useState(0);

    // progress through the opening: 0 as it reaches the top of the screen, 1 as its last screen begins to leave
    useEffect(() => {
        let raf = 0;
        const measure = () => {
            const el = openingRef.current; if (!el) return;
            const r = el.getBoundingClientRect(), run = r.height - window.innerHeight;
            setProgress(run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0);
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
        measure();
        window.addEventListener("scroll", onScroll, { passive : true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
    }, []);

    const scene = clamp01(progress / SCENE_END);
    const gone = span(progress, 0.78, 0.86);
    const dim = gone;
    const text = gone;
    const caption = [ ...CAPTIONS ].reverse().find(c => scene >= c.from) ?? CAPTIONS[0];

    return (
        <Article id="from-field-to-thali-page">
            <section className="opening" ref={openingRef} aria-label="The opening: a thali whose katoris hold a wheat field, a mill and a kirana shop">
                <div className="opening-stage" style={{ "--dim" : dim, "--gone" : gone, "--text" : text, "--title" : 1 - span(scene, 0.04, 0.12) } as React.CSSProperties}>
                    <ThaliStage progress={scene} />
                    <div className="title-card">
                        <PageCrumbs />
                        <Text className="hero-kicker" weight="600">AGRICULTURE</Text>
                        <Heading1 className="hero-title">From field to <span className="accent">thali</span></Heading1>
                        <Text className="hero-sub">
                            What India grows and where, what the government buys from farmers, and what India sells to
                            the world and buys from it.
                        </Text>
                        <ul className="hero-stats" aria-label="The story in four figures">
                            {HERO_STATS.map(h => <li key={h.href}><a href={h.href}><b>{h.big}</b><span>{h.text}</span></a></li>)}
                        </ul>
                    </div>
                    <div className={`beat-caption ${scene > 0.02 && gone < 0.05 ? "is-on" : ""}`} aria-live="polite">
                        <span className="beat-kicker">{caption.kicker}</span>
                        <span className="beat-text">{caption.text}</span>
                    </div>
                    <div className={`scroll-cue ${progress > 0.02 ? "is-off" : ""}`}>Scroll to follow the grain</div>
                    <div className="bridge" aria-hidden={text < 0.5}>
                        <span className="bridge-kicker">What comes next</span>
                        <p className="bridge-text">
                            Where does the food on a thali come from? Below: what India grows and in which states, what
                            the government buys from farmers, how support prices compare with everyday costs, and what
                            India sells abroad and buys from abroad. Every figure comes from the Reserve Bank’s Database
                            on Indian Economy.
                        </p>
                    </div>
                </div>
            </section>
            <StoryBody />
        </Article>
    );
};
