"use client";

// The race's 3D stage: mounts the two piles (raceScene.ts) on a canvas, hands them the year's multiples, and keeps a
// figure above each pile and its name on the ground before it. It draws only while on screen and only until the
// piles have settled; with reduced motion a frame is drawn when the year changes and the piles jump. Without WebGL it
// says so. Race.tsx loads this through next/dynamic with ssr off, so three.js reaches only this story, in the browser.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { createRaceScene, type RaceScene } from "./raceScene";

export interface StagePile { count : string; name : string; sub : string; }
export interface RaceStageProps { gold : number; prices : number; max : { gold : number; prices : number }; piles : [ StagePile, StagePile ]; }

export default function RaceStage({ gold, prices, max, piles } : RaceStageProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tagsRef = useRef<(HTMLDivElement | null)[]>([]);
    const sceneRef = useRef<RaceScene | null>(null);
    const haveRef = useRef({ gold, prices });
    const kickRef = useRef<() => void>(() => {});
    const [ failed, setFailed ] = useState(false);
    haveRef.current = { gold, prices };

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const phone = matchMedia("(max-width: 900px)").matches;
        let scene : RaceScene;
        try { scene = createRaceScene(canvas, max, { narrow : phone, reduced }); }
        catch { setFailed(true); return; }
        sceneRef.current = scene;
        scene.set(haveRef.current.gold, haveRef.current.prices);

        const placeTags = () => {
            scene.anchors().forEach((a, i) => {
                const c = tagsRef.current[i * 2], n = tagsRef.current[i * 2 + 1];
                if (c) c.style.transform = `translate(${a.top.x.toFixed(1)}px, ${a.top.y.toFixed(1)}px) translate(-50%, -100%)`;
                if (n) n.style.transform = `translate(${a.base.x.toFixed(1)}px, ${a.base.y.toFixed(1)}px) translate(-50%, 0)`;
            });
        };
        const draw = () => { scene.render(); };

        // the loop runs while the stage is on screen and the piles are still moving; a change of year starts it again
        let raf = 0, visible = false;
        const loop = () => { draw(); raf = scene.settled() ? 0 : requestAnimationFrame(loop); };
        const kick = () => { cancelAnimationFrame(raf); raf = 0; if (!visible) return; if (reduced) draw(); else raf = requestAnimationFrame(loop); };
        kickRef.current = kick;
        const resize = () => { scene.resize(wrap.clientWidth, wrap.clientHeight); placeTags(); draw(); };
        const ro = new ResizeObserver(resize); ro.observe(wrap); resize();
        const io = new IntersectionObserver(([ e ]) => { visible = e.isIntersecting; kick(); });
        io.observe(wrap);

        return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); scene.dispose(); sceneRef.current = null; };
    // the piles are built once for the most they will hold; the year's counts reach them through set() below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { if (sceneRef.current) { sceneRef.current.set(haveRef.current.gold, haveRef.current.prices); kickRef.current(); } }, [ gold, prices ]);

    return (
        <div className="race-stage">
            <div className="race-canvas" ref={wrapRef}><canvas ref={canvasRef} aria-hidden="true" /></div>
            {piles.map((p, i) => (
                <div key={p.name} aria-hidden="true">
                    <div className={`pile-tag pile-tag-count ${i === 0 ? "is-gold" : "is-prices"}`} ref={el => { tagsRef.current[i * 2] = el; }}>{p.count}</div>
                    <div className="pile-tag pile-tag-name" ref={el => { tagsRef.current[i * 2 + 1] = el; }}><span>{p.name}</span><span className="pile-tag-sub">{p.sub}</span></div>
                </div>
            ))}
            {failed && <p className="race-fallback">This picture of the piles needs WebGL, which this browser has turned off. The table view carries the figures.</p>}
        </div>
    );
}
