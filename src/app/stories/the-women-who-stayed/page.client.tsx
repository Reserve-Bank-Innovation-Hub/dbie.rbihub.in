"use client";

// The women who stayed: the opening. A scroll-driven 3D farm (FarmStage) under the title: as the reader scrolls, the
// man leaves the field for a building site and becomes a mason, and the woman stays; scrolling back reverses it. The
// captions say in words what the picture shows, for every reader and for screen readers. The scene carries no number;
// the chapters with the DBIE figures follow in StoryBody.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";

// UI ==================================================================================================================
import { Article, Heading1, Text } from "fictoan-react";

// LOCAL COMPONENTS ====================================================================================================
import { PageCrumbs } from "@components/Crumbs/PageCrumbs";
import { BEATS } from "./farmScene";
import { StoryBody } from "./StoryBody";
import { FIRST, LAST, RURAL, shortOf } from "./data";

// STYLES ==============================================================================================================
import "./the-women-who-stayed.css";

// three.js loads only in the browser, and only on this story
const FarmStage = dynamic(() => import("./FarmStage"), { ssr : false, loading : () => <div className="farm-stage is-loading" /> });

// The opening's scroll: the farm scene plays over the first part; then the scene dims and the bridge paragraph says
// what comes next; at the very end the dim lifts into the haze the plots open in.
const SCENE_END = 0.74;
const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
const span = (p : number, a : number, b : number) => clamp01((p - a) / (b - a));

const CAPTIONS = [
    { from : 0,             kicker : "Before",          text : "A man and a woman farm the same field of wheat." },
    { from : BEATS.turn,    kicker : "Leaving",         text : "He puts down his work in the field and walks to a building site." },
    { from : BEATS.mason,   kicker : "After",           text : "He works on the site as a mason. She is still in the field." },
];

export const TheWomenWhoStayedPage = () => {
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
    // gone: the title, tags and captions leave for good; dim: the dark veil; text: the paragraph, which leaves before
    // the veil lifts into the haze
    const gone = span(progress, 0.76, 0.84);
    const dim = gone * (1 - span(progress, 0.95, 1));
    const text = gone * (1 - span(progress, 0.91, 0.95));
    const caption = [ ...CAPTIONS ].reverse().find(c => scene >= c.from) ?? CAPTIONS[0];

    return (
        <Article id="the-women-who-stayed-page">
            <section className="opening" ref={openingRef} aria-label="The opening: a farm, and a man who leaves it">
                <div className="opening-stage" style={{ "--fade" : span(progress, 0.93, 1), "--dim" : dim, "--gone" : gone, "--text" : text } as React.CSSProperties}>
                    <FarmStage progress={scene} />
                    <div className="title-card">
                        <PageCrumbs />
                        <Text className="hero-kicker" weight="600">AGRICULTURE</Text>
                        <Heading1 className="hero-title">The women who <span className="accent">stayed</span></Heading1>
                        <Text className="hero-sub">
                            Since 2000-01, rural men in India have been leaving farm work for building sites, factories and
                            shops. Rural women have mostly stayed.
                        </Text>
                    </div>
                    <div className={`beat-caption ${scene > 0.02 && gone < 0.05 ? "is-on" : ""}`} aria-live="polite">
                        <span className="beat-kicker">{caption.kicker}</span>
                        <span className="beat-text">{caption.text}</span>
                    </div>
                    <div className={`scroll-cue ${progress > 0.02 ? "is-off" : ""}`}>Scroll to follow them</div>
                    <div className="bridge" aria-hidden={text < 0.5}>
                        <span className="bridge-kicker">What comes next</span>
                        <p className="bridge-text">
                            One man left the field. One woman stayed. Now picture it across rural India: 100 men and 100
                            women who work, followed through {RURAL.length} surveys from {shortOf(FIRST)} to {shortOf(LAST)}.
                            Scroll on and watch who walks off to the building site, the factory and the shop, who stays
                            with the crop, and what a day’s work pays on each side of that choice.
                        </p>
                    </div>
                </div>
            </section>
            <StoryBody />
        </Article>
    );
};
