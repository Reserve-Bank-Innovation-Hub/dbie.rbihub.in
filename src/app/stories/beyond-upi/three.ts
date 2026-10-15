// What the story's 3D scenes share (the title, the note tower and the RTGS arc): a renderer set up as S2's are, a loop
// that runs only while its canvas is on screen, sizing to the host, the instruments' faces as textures, and the
// easing the timelines use. three.js reaches only this story's bundle (the stages load through next/dynamic, SSR off).

// REACT CORE ==========================================================================================================
import * as THREE from "three";

// LOCAL ===============================================================================================================
import { dataUri } from "./instruments";

export const KOSH = {
    terracotta : 0xba644f, indivara : 0x864fe3, turmeric : 0xeaaa3a, neem : 0x6b8e23, charcoal : 0x2f2f2f,
    sandal4 : 0xede6d7, sandal6 : 0xf3eee4, ivory : 0xf2f0e6,
} as const;

export function makeRenderer(canvas : HTMLCanvasElement, phone : boolean, shadows = false) : THREE.WebGLRenderer {
    // Throws when WebGL is off; the caller shows the fallback.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true, alpha : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, phone ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;                // the palette's colours, as they are
    renderer.setClearColor(0x000000, 0);
    if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
    return renderer;
}

// Runs `frame` while the canvas is on screen and the tab visible; `frame` gets the seconds since the last one (up to a
// fifth of a second, so a slow device keeps time without a film jumping ahead after a stall).
export function loopWhileVisible(canvas : HTMLCanvasElement, frame : (dt : number) => void) {
    let raf = 0, on = false, last = 0, seen = false;
    const tick = (now : number) => { const dt = Math.max(0, Math.min(0.2, (now - last) / 1000)); last = now; frame(dt); raf = requestAnimationFrame(tick); };
    const start = () => { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(([ e ]) => { seen = e.isIntersecting; if (seen && !document.hidden) start(); else stop(); });
    io.observe(canvas);
    const vis = () => { if (document.hidden) stop(); else if (seen) start(); };
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
}

// Keeps the renderer at the host's size and tells the scene.
export function fitToHost(canvas : HTMLCanvasElement, renderer : THREE.WebGLRenderer, onSize : (w : number, h : number) => void) {
    const host = canvas.parentElement as HTMLElement;
    const fit = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); onSize(w, h); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    return () => ro.disconnect();
}

// An instrument's face as a texture: the SVG drawn on a canvas at `scale` times its size, once the image has loaded.
export function svgTexture(svg : string, w : number, h : number, renderer : THREE.WebGLRenderer, scale = 3) : Promise<THREE.CanvasTexture> {
    return new Promise(resolve => {
        const cv = document.createElement("canvas");
        cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const img = new Image();
        img.onload = () => { cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height); tex.needsUpdate = true; resolve(tex); };
        img.onerror = () => resolve(tex);
        img.src = dataUri(svg);
    });
}

// A flat object with a printed face: a thin box, the texture on its front, paper-coloured edges and back.
export function facedCard(tex : THREE.Texture, w : number, h : number, depth : number, edge = 0xf3eee4) : THREE.Mesh {
    const side = new THREE.MeshLambertMaterial({ color : edge });
    const face = new THREE.MeshBasicMaterial({ map : tex, transparent : true });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [ side, side, side, side, face, side ]);
    mesh.castShadow = true;
    return mesh;
}

export const clamp01 = (x : number) => Math.max(0, Math.min(1, x));
export const easeOut = (x : number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x : number) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lerp = (a : number, b : number, t : number) => a + (b - a) * t;

// `?t=4.2` holds a frame in development, as S2's title does.
export const heldFrame = () : number | null => {
    if (process.env.NODE_ENV === "production" || typeof location === "undefined") return null;
    const t = new URLSearchParams(location.search).get("t");
    return t != null && Number.isFinite(+t) ? +t : null;
};
