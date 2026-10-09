"use client";

// The opening's 3D stage: mounts the farm scene (farmScene.ts) on a canvas, poses it for the scroll progress the page
// passes in, and keeps the two labels over the people. It draws only while on screen; with reduced motion the wheat
// and palms stand still and a frame is drawn only when the progress changes. Without WebGL it shows a line of text.
// The page loads this component through next/dynamic with ssr off, so three.js reaches only this story, in the browser.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { BEATS, createFarmScene, type FarmScene } from "./farmScene";

export default function FarmStage({ progress } : { progress : number }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const manRef = useRef<HTMLDivElement>(null);
    const womanRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef(progress);
    const sceneRef = useRef<FarmScene | null>(null);
    const drawRef = useRef<() => void>(() => {});
    const [ failed, setFailed ] = useState(false);
    progressRef.current = progress;

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let scene : FarmScene;
        try { scene = createFarmScene(canvas, { narrow : wrap.clientWidth < 900, reduced }); }
        catch { setFailed(true); return; }
        sceneRef.current = scene;

        const place = () => {
            const { man, woman } = scene.anchors();
            const after = progressRef.current >= BEATS.mason;
            const put = (el : HTMLDivElement | null, a : { x : number; y : number; shown : boolean }) => {
                if (!el) return;
                el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) translate(-50%, -100%)`;
                el.style.opacity = a.shown ? "1" : "0";
            };
            put(manRef.current, man);
            put(womanRef.current, woman);
            if (manRef.current) {
                manRef.current.textContent = after ? "After" : "Before";
                manRef.current.classList.toggle("is-after", after);
            }
        };
        const start = performance.now();
        const draw = () => { scene.render(progressRef.current, (performance.now() - start) / 1000); place(); };
        drawRef.current = draw;

        const resize = () => { scene.resize(wrap.clientWidth, wrap.clientHeight); draw(); };
        const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

        // the loop runs only while the stage is on screen, and not at all with reduced motion
        let raf = 0, visible = false;
        const loop = () => { draw(); raf = requestAnimationFrame(loop); };
        const io = new IntersectionObserver(([ e ]) => {
            visible = e.isIntersecting;
            cancelAnimationFrame(raf);
            if (visible && !reduced) raf = requestAnimationFrame(loop); else if (visible) draw();
        });
        io.observe(wrap);

        return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); scene.dispose(); sceneRef.current = null; void visible; };
    }, []);

    // with reduced motion there is no loop, so a change of progress draws its own frame
    useEffect(() => { if (sceneRef.current && matchMedia("(prefers-reduced-motion: reduce)").matches) drawRef.current(); }, [ progress ]);

    return (
        <div className="farm-stage" ref={wrapRef}>
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="farm-tag tag-man" ref={manRef} aria-hidden="true">Before</div>
            <div className="farm-tag tag-woman" ref={womanRef} aria-hidden="true">Before and after</div>
            {failed && <p className="farm-fallback">This picture of the farm needs WebGL, which this browser has turned off.</p>}
        </div>
    );
}
