"use client";

// The opening's 3D stage: mounts the town scene (townScene.ts) on a canvas and poses it for the scroll progress the
// opening passes in. It draws only while on screen; with reduced motion the town's life stands still and a frame is
// drawn only when the progress changes. The dark theme sees the town at dusk; the theme is read from the page after
// mount and followed when it changes. Without WebGL it shows a line of text, and the captions and the ₹100 strip,
// which are HTML, carry on as before. Opening.tsx loads this component through next/dynamic with ssr off, so three.js
// reaches only this story, in the browser.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { createTownScene, type TownScene } from "./townScene";

const isDark = () => document.documentElement.classList.contains("theme-dark");

export default function TownStage({ progress } : { progress : number }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef(progress);
    const sceneRef = useRef<TownScene | null>(null);
    const drawRef = useRef<() => void>(() => {});
    const [ failed, setFailed ] = useState(false);
    progressRef.current = progress;

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let scene : TownScene;
        try { scene = createTownScene(canvas, { narrow : wrap.clientWidth < 900, reduced, dusk : isDark() }); }
        catch { setFailed(true); return; }
        sceneRef.current = scene;

        const start = performance.now();
        const draw = () => scene.render(progressRef.current, (performance.now() - start) / 1000);
        drawRef.current = draw;

        const resize = () => { scene.resize(wrap.clientWidth, wrap.clientHeight); draw(); };
        const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

        // the theme can change while the page is open
        const mo = new MutationObserver(() => { scene.setDusk(isDark()); draw(); });
        mo.observe(document.documentElement, { attributes : true, attributeFilter : [ "class" ] });

        // the loop runs only while the stage is on screen, and not at all with reduced motion
        let raf = 0;
        const loop = () => { draw(); raf = requestAnimationFrame(loop); };
        const io = new IntersectionObserver(([ e ]) => {
            cancelAnimationFrame(raf);
            if (e.isIntersecting && !reduced) raf = requestAnimationFrame(loop); else if (e.isIntersecting) draw();
        });
        io.observe(wrap);

        return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); mo.disconnect(); scene.dispose(); sceneRef.current = null; };
    }, []);

    // with reduced motion there is no loop, so a change of progress draws its own frame
    useEffect(() => { if (sceneRef.current && matchMedia("(prefers-reduced-motion: reduce)").matches) drawRef.current(); }, [ progress ]);

    return (
        <div className="town-stage" ref={wrapRef}>
            <canvas ref={canvasRef} aria-hidden="true" />
            {failed && <p className="town-fallback">This picture of the town needs WebGL, which this browser has turned off.</p>}
        </div>
    );
}
