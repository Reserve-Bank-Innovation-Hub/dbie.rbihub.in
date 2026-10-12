"use client";

// The shelves' 3D stage: mounts the rack (shelvesScene.ts) on a canvas, hands it the year's counts, and keeps a tag
// at each end of every shelf, the thing's name on the left and the year's figure on the right. It draws only while
// on screen and only until the piles have settled; with reduced motion a frame is drawn when the year changes and
// the piles jump. Without WebGL it says so. Shelves.tsx loads this through next/dynamic with ssr off, so three.js
// reaches only this story, in the browser.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState, type ReactNode } from "react";

// LOCAL ===============================================================================================================
import { createShelvesScene, type ShelfKey, type ShelvesScene } from "./shelvesScene";

export interface StageShelf { key : ShelfKey; name : ReactNode; unit : string; count : string; have : number; max : number; missing : boolean; }

export default function ShelvesStage({ shelves } : { shelves : StageShelf[] }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tagsRef = useRef<(HTMLDivElement | null)[]>([]);
    const sceneRef = useRef<ShelvesScene | null>(null);
    const haveRef = useRef(shelves.map(s => s.have));
    const kickRef = useRef<() => void>(() => {});
    const [ failed, setFailed ] = useState(false);
    const [ narrow, setNarrow ] = useState(false);
    haveRef.current = shelves.map(s => s.have);

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        // on a phone the tags are listed under the rack instead of laid beside its shelves, the page's own breakpoint
        const phone = matchMedia("(max-width: 900px)").matches;
        setNarrow(phone);
        let scene : ShelvesScene;
        try { scene = createShelvesScene(canvas, shelves.map(s => s.key), shelves.map(s => s.max), { narrow : phone, reduced }); }
        catch { setFailed(true); return; }
        sceneRef.current = scene;
        scene.set(haveRef.current);

        // the tags lie on the ground in the tiles' own direction: a matrix maps the tag's x onto a step along the
        // tile and its y onto a step across the plot, both as the camera sees them, and the type is sized to the
        // plot so a line of it stands about as tall as a unit is long
        const placeTags = () => {
            if (phone) return;
            scene.anchors().forEach((a, i) => {
                const l = tagsRef.current[i * 2], r = tagsRef.current[i * 2 + 1];
                const unit = Math.hypot(a.along.x, a.along.y);
                const m = `matrix(${(a.along.x / unit).toFixed(4)}, ${(a.along.y / unit).toFixed(4)}, ${(a.across.x / unit).toFixed(4)}, ${(a.across.y / unit).toFixed(4)}, 0, 0)`;
                const size = `${(unit * 0.66).toFixed(2)}px`;
                if (l) { l.style.transform = `translate(${a.left.x.toFixed(1)}px, ${a.left.y.toFixed(1)}px) ${m} translate(-100%, -50%)`; l.style.fontSize = size; }
                if (r) { r.style.transform = `translate(${a.right.x.toFixed(1)}px, ${a.right.y.toFixed(1)}px) ${m} translate(0, -50%)`; r.style.fontSize = size; }
            });
        };
        const start = performance.now();
        const draw = () => { scene.render((performance.now() - start) / 1000); };

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
    // the rack is built once for the shelves it is given; their counts reach it through set() below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { if (sceneRef.current) { sceneRef.current.set(haveRef.current); kickRef.current(); } }, [ shelves ]);

    return (
        <div className={`shelves-stage ${narrow ? "is-narrow" : ""}`}>
            <div className="shelves-canvas" ref={wrapRef}><canvas ref={canvasRef} aria-hidden="true" /></div>
            <div className="shelf-tag-list">
            {shelves.map((s, i) => (
                <div key={s.key} className="shelf-tags" aria-hidden="true">
                    <div className="shelf-tag shelf-tag-name" ref={el => { tagsRef.current[i * 2] = el; }}><span>{s.name}</span><span className="shelf-unit">{s.unit}</span></div>
                    <div className={`shelf-tag shelf-tag-count ${s.missing ? "is-missing" : ""}`} ref={el => { tagsRef.current[i * 2 + 1] = el; }}>{s.count}</div>
                </div>
            ))}
            </div>
            {failed && <p className="shelves-fallback">This picture of the shelves needs WebGL, which this browser has turned off. The table view carries the figures.</p>}
        </div>
    );
}
