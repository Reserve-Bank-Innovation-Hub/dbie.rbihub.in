// What the story's two 3D scenes share: the Kosh palette, the ₹500 note's face (drawn on a canvas, as S1 draws its
// notes: a border, a rosette, a plain oval window, the value in figures, in English and in Hindi; no portrait), the
// UPI drop, and a renderer set up the same way for both. three.js reaches only this story's bundle (CashStage is loaded
// through next/dynamic with SSR off).

// REACT CORE ==========================================================================================================
import * as THREE from "three";

// The RBIH Kosh palette, and nothing deeper than it.
export const KOSH = {
    terracotta : 0xba644f, indivara : 0x864fe3, turmeric : 0xeaaa3a, neem : 0x6b8e23,
    sandalwood : 0xe1d5bc, sandal1 : 0xe4d9c3, sandal4 : 0xede6d7, sandal6 : 0xf3eee4, sandal8 : 0xf9f7f2,
    ivory : 0xf2f0e6, charcoal : 0x2f2f2f, vermilion : 0xde4635,
} as const;
const css = (c : number) => `#${c.toString(16).padStart(6, "0")}`;

// How long the month-by-month steps take to play from November 2019 to the latest month, in seconds.
export const JOURNEY = 10;

// A ₹500 note is 150 × 66 mm.
export const NOTE_W = 1.5, NOTE_H = 0.66;

// The note's face. The ₹500 note's own colour is stone grey; here the paper is sandalwood and the print Neem green and
// charcoal, so the note sits in the palette.
export function noteTexture(renderer : THREE.WebGLRenderer) : THREE.CanvasTexture {
    const W = 1200, H = Math.round(W * NOTE_H / NOTE_W);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    const ink = css(KOSH.charcoal), accent = css(KOSH.neem);

    g.fillStyle = css(KOSH.sandal4);
    g.fillRect(0, 0, W, H);
    // fine guilloche across the paper
    g.strokeStyle = css(KOSH.sandalwood);
    g.lineWidth = 2;
    for (let k = 0; k < 22; k++) {
        g.beginPath();
        for (let x = 0; x <= W; x += 8) {
            const y = 40 + k * (H - 80) / 21 + 9 * Math.sin(x / 38 + k * 0.7);
            if (x) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.stroke();
    }
    // the border
    g.strokeStyle = accent; g.lineWidth = 6;
    g.strokeRect(22, 22, W - 44, H - 44);
    g.lineWidth = 2;
    g.strokeRect(36, 36, W - 72, H - 72);
    // the rosette, left of centre
    g.save();
    g.translate(W * 0.36, H * 0.5);
    g.strokeStyle = accent; g.globalAlpha = 0.55; g.lineWidth = 2.2;
    for (let k = 0; k < 18; k++) {
        g.rotate(Math.PI / 9);
        g.beginPath(); g.ellipse(0, 52, 30, 52, 0, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
    // the plain oval window, right of centre
    g.fillStyle = css(KOSH.sandal8);
    g.strokeStyle = css(KOSH.sandalwood); g.lineWidth = 5;
    g.beginPath(); g.ellipse(W * 0.72, H * 0.47, 92, 122, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    // the value
    g.fillStyle = ink;
    g.textBaseline = "alphabetic";
    g.font = "700 64px system-ui, sans-serif";
    g.fillText("500", 64, 118);
    g.font = "600 34px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("FIVE HUNDRED RUPEES", W * 0.3, H - 70);    // clear of the fold, so no letter shows on the folded half
    g.font = "600 40px 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mangal', sans-serif";
    g.fillText("पाँच सौ रुपये", W * 0.36, 112);
    g.textAlign = "right";
    g.fillStyle = accent;
    g.font = "800 128px system-ui, sans-serif";
    g.fillText("₹500", W - 64, H - 64);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
}

// A UPI payment: a teardrop, point up, turned on the lathe.
export function dropGeometry(r = 0.05) : THREE.BufferGeometry {
    // the classic teardrop: x = r sin θ sin(θ/2), y = 1.6 r cos θ, from the point (θ = 0) to the bottom (θ = π)
    const pts : THREE.Vector2[] = [];
    for (let k = 16; k >= 0; k--) {
        const th = k / 16 * Math.PI;
        pts.push(new THREE.Vector2(Math.max(0.0001, r * Math.sin(th) * Math.sin(th / 2)), 1.6 * r * Math.cos(th)));
    }
    return new THREE.LatheGeometry(pts, 14);
}

export function makeRenderer(canvas : HTMLCanvasElement, phone : boolean) : THREE.WebGLRenderer {
    // Throws when WebGL is off; the caller shows the fallback.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true, alpha : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, phone ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;                // the palette's colours, as they are
    renderer.setClearColor(0x000000, 0);
    return renderer;
}

// Runs `frame` while the canvas is on screen and the tab visible; `frame` gets the seconds since the last one.
export function loopWhileVisible(canvas : HTMLCanvasElement, frame : (dt : number, t : number) => void) {
    let raf = 0, on = false, last = 0;
    const tick = (now : number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        frame(dt, now / 1000);
        raf = requestAnimationFrame(tick);
    };
    const start = () => { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    let seen = false;
    const io = new IntersectionObserver(([ e ]) => { seen = e.isIntersecting; if (seen && !document.hidden) start(); else stop(); });
    io.observe(canvas);
    const vis = () => { if (document.hidden) stop(); else if (seen) start(); };
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
}

// Keeps the renderer and the camera at the canvas's size.
export function fitToHost(canvas : HTMLCanvasElement, renderer : THREE.WebGLRenderer, onSize : (w : number, h : number) => void) {
    const host = canvas.parentElement as HTMLElement;
    const fit = () => {
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        onSize(w, h);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    return () => ro.disconnect();
}
