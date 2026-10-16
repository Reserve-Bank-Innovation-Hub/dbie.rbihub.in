"use client";

// The opening's 3D stage: mounts the thali scene (thaliScene.ts) on a canvas and poses it for the scroll progress the
// page passes in. It draws only while on screen; with reduced motion the wheat, the sickles and the steam stand still
// and a frame is drawn only when the progress changes. Without WebGL it shows a line of text. The page loads this
// component through next/dynamic with ssr off, so three.js reaches only this story, in the browser.

// REACT CORE ==========================================================================================================
import { useEffect, useRef, useState } from "react";

// LOCAL ===============================================================================================================
import { createThaliScene, type ThaliScene } from "./thaliScene";

export default function ThaliStage({ progress } : { progress : number }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef(progress);
    const sceneRef = useRef<ThaliScene | null>(null);
    const drawRef = useRef<() => void>(() => {});
    const [ failed, setFailed ] = useState(false);
    progressRef.current = progress;

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        let scene : ThaliScene;
        try { scene = createThaliScene(canvas, { narrow : wrap.clientWidth < 900, reduced }); }
        catch { setFailed(true); return; }
        sceneRef.current = scene;

        const start = performance.now();
        const draw = () => scene.render(progressRef.current, (performance.now() - start) / 1000);
        drawRef.current = draw;

        const resize = () => { scene.resize(wrap.clientWidth, wrap.clientHeight); draw(); };
        const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

        // the loop runs only while the stage is on screen, and not at all with reduced motion
        let raf = 0;
        const loop = () => { draw(); raf = requestAnimationFrame(loop); };
        const io = new IntersectionObserver(([ e ]) => {
            cancelAnimationFrame(raf);
            if (e.isIntersecting && !reduced) raf = requestAnimationFrame(loop); else if (e.isIntersecting) draw();
        });
        io.observe(wrap);

        return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); scene.dispose(); sceneRef.current = null; };
    }, []);

    // with reduced motion there is no loop, so a change of progress draws its own frame
    useEffect(() => { if (sceneRef.current && matchMedia("(prefers-reduced-motion: reduce)").matches) drawRef.current(); }, [ progress ]);

    return (
        <div className="thali-stage" ref={wrapRef}>
            <canvas ref={canvasRef} aria-hidden="true" />
            {failed && <p className="thali-fallback">This picture needs WebGL, which this browser has turned off.</p>}
        </div>
    );
}
