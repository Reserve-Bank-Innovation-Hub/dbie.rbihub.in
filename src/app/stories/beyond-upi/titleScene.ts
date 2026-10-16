// The title, a size reveal: S2's phone stands alone, having paid ₹1,301, the average UPI payment. One by one the next
// larger ways of paying rise beside it, each drawn to the size of its average payment (on a compressed scale, the
// payment to the power 0.3, so a ₹65 lakh RTGS payment stands about thirteen times the phone): debit card, credit card,
// IMPS, NEFT, the cheque, the RTGS form. The camera pulls back as each arrives, keeping the newest and the two before
// it in view, so each one dwarfs the last. Then all nine, the two smaller ones (PPIs, tolls) included, glide into
// one row in order of size on a ratio scale, and the page's words come in. It plays once, in about ten seconds; with
// reduced motion it opens on the last frame. Every pose is a function of the time, so `?t=` can hold one.

// REACT CORE ==========================================================================================================
import * as THREE from "three";

// LOCAL ===============================================================================================================
import { FACE, type MethodKey } from "./instruments";
import { easeInOut, easeOut, facedCard, fitToHost, heldFrame, lerp, loopWhileVisible, makeRenderer, svgTexture } from "./three";

export interface TitleScene { dispose : () => void }
export interface LabelAt { key : MethodKey; x : number; y : number; mode : "row" }
export interface TitleOptions {
    reduced  : boolean;
    avg      : Record<MethodKey, number>;                // ₹, each method's average payment
    onReveal : () => void;                               // when the words should come in
    onLabels : (at : LabelAt[]) => void;                 // the row's names, in CSS pixels
}

const PX = 0.0036;                                       // world units per drawing pixel
const REVEAL : MethodKey[] = [ "upi", "debit", "credit", "imps", "neft", "paper", "rtgs" ];
const ROW : MethodKey[] = [ "netc", "ppi", "upi", "debit", "credit", "imps", "neft", "paper", "rtgs" ];
const T0 = 0.9, STEP = 1.05, T_ROW = T0 + REVEAL.length * STEP + 0.5, ROW_DUR = 1.6, T_END = T_ROW + ROW_DUR + 0.4;

interface Pose { x : number; y : number; s : number }
interface Piece { key : MethodKey; mesh : THREE.Mesh; w : number; h : number; rv : Pose | null; row : Pose }
interface Frame { cx : number; cy : number; dist : number }

export function mountTitleScene(canvas : HTMLCanvasElement, o : TitleOptions) : TitleScene {
    const coarse = matchMedia("(pointer: coarse)").matches;
    const renderer = makeRenderer(canvas, coarse, true);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe1d5bc, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 6;
    scene.add(sun, sun.target);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity : 0.09, depthWrite : false }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);

    let w = 1, h = 1, narrow = false, pieces : Piece[] = [], ready = false, clock = 0, revealed = false, still = false;
    let frames : Frame[] = [], rowFrame : Frame = { cx : 0, cy : 0, dist : 10 }, labelMode : "none" | "row" = "none";
    const hold = heldFrame(), startAt = o.reduced ? T_END : hold ?? 0;
    const piece = (k : MethodKey) => pieces.find(q => q.key === k)!;

    // the distance that fits a box of half-width hw and half-height hh, with a margin
    const fit = (hw : number, hh : number, m : number) => { const f = Math.tan(camera.fov * Math.PI / 360); return Math.max(hh * m / f, hw * m / (f * camera.aspect)); };

    const layout = () => {
        narrow = w / h < 0.9;
        // the reveal: each piece's longer side the payment to the power 0.3, the phone's one unit; standing on the
        // floor, side by side, in the order they arrive
        let x = 0;
        REVEAL.forEach((k, i) => {
            const p = piece(k), size = Math.pow(o.avg[k] / o.avg.upi, 0.3), s = size / Math.max(p.w, p.h);
            if (i > 0) { const q = piece(REVEAL[i - 1]); x += q.rv!.s * q.w / 2 + 0.18 * size + s * p.w / 2; }
            p.rv = { x, y : s * p.h / 2, s };
        });
        // each step frames the newest piece and the two before it
        frames = REVEAL.map((_, i) => {
            const a = piece(REVEAL[Math.max(0, i - 2)]), b = piece(REVEAL[i]);
            const x0 = a.rv!.x - a.rv!.s * a.w / 2, x1 = b.rv!.x + b.rv!.s * b.w / 2, top = Math.max(b.rv!.s * b.h, a.rv!.s * a.h);
            return { cx : (x0 + x1) / 2, cy : top * 0.5, dist : fit((x1 - x0) / 2, top * 0.62, narrow ? 1.15 : 1.35) };
        });
        // the row: sizes on a ratio scale (the longer side 0.5, and 0.38 more for each tenfold step above ₹100),
        // smallest first, standing on the floor
        let rx = 0, prevHalf = 0;
        ROW.forEach((k, i) => {
            const p = piece(k), size = 0.5 + 0.38 * Math.log10(o.avg[k] / 100), s = size / Math.max(p.w, p.h), half = s * p.w / 2;
            if (i > 0) rx += prevHalf + 0.22 + half;
            prevHalf = half;
            p.row = { x : rx, y : s * p.h / 2, s };
        });
        const first = piece(ROW[0]), last = piece("rtgs");
        const x0 = first.row.x - first.row.s * first.w / 2, x1 = last.row.x + last.row.s * last.w / 2, top = last.row.s * last.h;
        const width = x1 - x0, f = Math.tan(camera.fov * Math.PI / 360);
        // the row across the screen, below the words, which sit at the top
        const dist = width / (narrow ? 0.92 : 0.88) / (2 * f * camera.aspect), visH = 2 * dist * f;
        rowFrame = { cx : (x0 + x1) / 2, cy : top / 2 + visH * (narrow ? 0.17 : 0.2), dist };
        const mid = (x0 + x1) / 2;
        sun.position.set(mid - 6, 14, 12); sun.target.position.set(mid, 0, 0);
        Object.assign(sun.shadow.camera, { left : -40, right : 40, top : 40, bottom : -40, near : 1, far : 90 });
        sun.shadow.camera.updateProjectionMatrix();
    };

    const setCamera = (fr : Frame) => { camera.position.set(fr.cx, fr.cy + fr.dist * 0.1, fr.dist); camera.lookAt(fr.cx, fr.cy, 0); };
    const mix = (a : Frame, b : Frame, k : number) : Frame => ({ cx : lerp(a.cx, b.cx, k), cy : lerp(a.cy, b.cy, k), dist : lerp(a.dist, b.dist, k) });
    // the first frame is the phone alone, close
    const opening = () : Frame => ({ ...frames[0], dist : frames[0].dist * 0.85 });

    const pose = (t : number) => {
        // the camera: from the phone, step by step, then to the row
        let cam = opening();
        if (t >= T0) {
            const i = Math.min(REVEAL.length - 1, Math.floor((t - T0) / STEP)), from = i === 0 ? opening() : frames[i - 1];
            cam = mix(from, frames[i], easeInOut((t - T0 - i * STEP) / (STEP * 0.75)));
        }
        const toRow = easeInOut((t - T_ROW) / ROW_DUR);
        if (toRow > 0) cam = mix(frames[REVEAL.length - 1], rowFrame, toRow);
        setCamera(cam);

        pieces.forEach(p => {
            const r = REVEAL.indexOf(p.key), k = easeInOut((t - T_ROW - ROW.indexOf(p.key) * 0.05) / (ROW_DUR - 0.4));
            let from : Pose, up : number;
            if (r >= 0) {
                // it rises into its place as its step begins (the phone is there from the start)
                up = r === 0 ? 1 : easeOut((t - T0 - r * STEP) / 0.6);
                from = p.rv!;
            } else {
                // PPIs and tolls rise straight into the row
                up = easeOut((t - T_ROW - 0.3) / 0.8);
                from = p.row;
            }
            const s = lerp(from.s, p.row.s, k);
            p.mesh.position.set(lerp(from.x, p.row.x, k), lerp(from.y, p.row.y, k) - (1 - up) * (s * p.h + 1), 0);
            p.mesh.scale.setScalar(s * lerp(0.85, 1, up));
            p.mesh.rotation.set(0, (1 - up) * 0.5 + Math.sin(k * Math.PI) * 0.25, 0);
            p.mesh.visible = up > 0.001;
        });
    };

    const toScreen = (v : THREE.Vector3) => { const p = v.clone().project(camera); return { x : (p.x + 1) / 2 * w, y : (1 - p.y) / 2 * h }; };
    // the row's names, placed from where the camera will settle, so they do not chase the move
    const sendRow = () => {
        labelMode = "row";
        setCamera(rowFrame); camera.updateMatrixWorld();
        o.onLabels(pieces.map(p => ({ key : p.key, ...toScreen(new THREE.Vector3(p.row.x, -0.04, 0)), mode : "row" as const })));
    };

    const resize = (cw : number, ch : number) => {
        w = cw; h = ch; camera.aspect = w / h; camera.updateProjectionMatrix();
        if (!ready) return;
        layout();
        if (labelMode === "row") sendRow();
        pose(clock); renderer.render(scene, camera);
        still = false;
    };
    const unfit = fitToHost(canvas, renderer, resize);

    Promise.all(ROW.map(k => { const f = FACE[k]; return svgTexture(f.svg(), f.w, f.h, renderer).then(tex => ({ k, f, tex })); })).then(made => {
        if (disposed) return;
        pieces = made.map(({ k, f, tex }) => {
            const pw = f.w * PX, ph = f.h * PX, thick = k === "upi" || k === "imps";
            const mesh = facedCard(tex, pw, ph, thick ? 0.05 : 0.012, thick ? 0x2a2724 : 0xf6f1e7);
            // only the printed face shows: the box's edges, wider than a drawing's rounded corners, read as an outline
            (mesh.material as THREE.Material[]).forEach((mt, i) => { if (i !== 4) mt.visible = false; });
            scene.add(mesh);
            return { key : k, mesh, w : pw, h : ph, rv : null, row : { x : 0, y : 0, s : 1 } };
        });
        ready = true;
        layout();
        clock = startAt;
        pose(clock); renderer.render(scene, camera);
    });

    let disposed = false;
    const unloop = loopWhileVisible(canvas, dt => {
        if (!ready || still) return;
        if (hold == null) clock += dt;
        if (clock > T_END + 0.5) still = true;
        if (!revealed && clock > T_ROW + 0.7) { revealed = true; o.onReveal(); }
        // the names come in under the row once it has formed
        if (clock > T_END - 0.3) { if (labelMode !== "row") sendRow(); }
        pose(clock);
        renderer.render(scene, camera);
    });

    return {
        dispose : () => {
            disposed = true; unloop(); unfit();
            scene.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(mt => { (mt as THREE.MeshBasicMaterial).map?.dispose(); mt.dispose(); }); } });
            renderer.dispose();
        },
    };
}
