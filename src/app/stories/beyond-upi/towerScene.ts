// The note tower: each method's average payment in 2025-26 laid out on one long table in banknotes, true to count.
// ₹500 notes come in bundles of 100 (₹50,000) under a paper band; what is left over is paid in the fewest notes and
// coins of the current series (₹500, ₹200, ₹100, ₹50, ₹20, ₹10 notes; ₹5, ₹2, ₹1 coins). RTGS's 130 bundles stand
// four to a layer. The camera starts on the whole table, rises to the top of the RTGS tower, then travels down the
// table to a toll's ₹133 at table height, and pulls back. Names are set over the scene by the page (`onLabels`).

// REACT CORE ==========================================================================================================
import * as THREE from "three";

// LOCAL ===============================================================================================================
import type { MethodKey } from "./instruments";
import { easeInOut, fitToHost, heldFrame, lerp, loopWhileVisible, makeRenderer } from "./three";

export interface TowerScene { replay : () => void; dispose : () => void }
export interface TowerOptions {
    reduced  : boolean;
    stacks   : { key : MethodKey; avg : number }[];          // largest first
    onLabels : (at : { key : MethodKey; x : number; y : number; shown : boolean; progress : number }[]) => void;
    onEnd    : () => void;
}

// a note's size (150 × 66 mm for ₹500, smaller for the rest, as RBI gives them), 1 unit = 100 mm; each in the flat note
// of the ₹1 lakh story (what-one-lakh-bought/note-1000.svg: three fields, a disc with the rupee, the value set tall on the
// left, a divider, a ring and dots), coloured from Money in, money out's palette: ₹500 in neem, as there
const NOTES : Record<number, { w : number; d : number; paper : string; disc : string; ink : string; lace : string }> = {
    500 : { w : 1.5,  d : 0.66, paper : "#b3cf6b", disc : "#4f6f12", ink : "#2f4a08", lace : "#7c9c2c" },
    200 : { w : 1.46, d : 0.66, paper : "#f5c55a", disc : "#d9900f", ink : "#6a4204", lace : "#d18a1c" },
    100 : { w : 1.42, d : 0.66, paper : "#c3a9f4", disc : "#7440d9", ink : "#3f1e85", lace : "#8f69e6" },
    50  : { w : 1.35, d : 0.66, paper : "#cfccc2", disc : "#4a4a4a", ink : "#222222", lace : "#7d7a73" },
    20  : { w : 1.29, d : 0.63, paper : "#ec9f88", disc : "#b04e36", ink : "#5e2617", lace : "#cf7458" },
    10  : { w : 1.23, d : 0.63, paper : "#e0c79a", disc : "#946f36", ink : "#4c3414", lace : "#b8935a" },
};
const COINS = [ 5, 2, 1 ];
const THICK = 0.0011 * 2;                                    // a loose note, drawn twice its thickness so one alone shows
const BUNDLE_H = 100 * 0.0011 * 1.0;                         // a bundle of 100, true to thickness (11 mm)
const GAP = 2.3;                                             // between stacks
const T_BUILD = 4.4, FALL = 0.42, T_END = 11 + T_BUILD;   // the stacks build, then the camera's tour

// fewest notes and coins for an amount below ₹500
const change = (r : number) => { const out : number[] = []; for (const d of [ 200, 100, 50, 20, 10, 5, 2, 1 ]) while (r >= d - 0.5) { out.push(d); r -= d; } return out; };

function noteTexture(denom : number, band : boolean) : THREE.CanvasTexture {
    const n = NOTES[denom], cv = document.createElement("canvas");
    cv.width = 708; cv.height = 292;                                             // the ₹1 lakh story's 177 × 73, four times
    const g = cv.getContext("2d")!, k = 4, sans = "Helvetica, Arial, sans-serif", mono = "Menlo, Consolas, monospace";
    const pill = (x : number, y : number, w : number, h : number, a : number) => { g.globalAlpha = a; g.fillStyle = n.ink; g.beginPath(); g.roundRect(x * k, y * k, w * k, h * k, h * k / 2); g.fill(); g.globalAlpha = 1; };
    g.fillStyle = n.paper; g.fillRect(0, 0, cv.width, cv.height);
    g.globalAlpha = 0.55; g.fillStyle = "#f3f1e7"; g.fillRect(0, 0, 50 * k, 73 * k); g.fillRect(124 * k, 0, 53 * k, 73 * k); g.globalAlpha = 1;
    g.fillStyle = n.disc; g.beginPath(); g.arc(87 * k, 41 * k, 18 * k, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f3f1e7"; g.font = `700 ${25 * k}px ${sans}`; g.textAlign = "center"; g.fillText("₹", 87 * k, 50 * k);
    g.save(); g.translate(27 * k, 62 * k); g.rotate(-Math.PI / 2); g.fillStyle = n.ink; g.globalAlpha = 0.85; g.textAlign = "left"; g.font = `700 ${13 * k}px ${mono}`; g.fillText(`₹${denom}`, 0, 0); g.restore(); g.globalAlpha = 1;
    pill(56, 8, 42, 5, 0.5); pill(56, 16, 26, 3.5, 0.35); pill(56, 62, 18, 3, 0.3); pill(150, 56, 20, 2.5, 0.3);
    g.strokeStyle = n.lace; g.lineWidth = 1.2 * k; g.setLineDash([ 3 * k, 3 * k ]); g.beginPath(); g.moveTo(121 * k, 3 * k); g.lineTo(121 * k, 70 * k); g.stroke(); g.setLineDash([]);
    g.fillStyle = n.ink; g.textAlign = "right"; g.font = `700 ${9 * k}px ${mono}`; g.fillText(`₹${denom}`, 170 * k, 17 * k);
    g.strokeStyle = n.ink; g.lineWidth = 0.8 * k; g.beginPath(); g.arc(137 * k, 46 * k, 6.5 * k, 0, Math.PI * 2); g.stroke();
    g.fillStyle = n.lace; [ 152, 158, 164 ].forEach(x => { g.beginPath(); g.arc(x * k, 46 * k, 1.6 * k, 0, Math.PI * 2); g.fill(); });
    g.globalAlpha = 0.55; g.fillStyle = n.ink; g.beginPath(); g.moveTo(177 * k, 0); g.lineTo(177 * k, 8 * k); g.lineTo(169 * k, 0); g.fill(); g.beginPath(); g.moveTo(0, 73 * k); g.lineTo(0, 65 * k); g.lineTo(8 * k, 73 * k); g.fill(); g.globalAlpha = 1;
    if (band) {
        // the paper band of a bundle of 100, across the left field
        g.fillStyle = "#f2ead7"; g.fillRect(36 * k, 0, 22 * k, 73 * k); g.strokeStyle = "#cdbf9e"; g.lineWidth = 2; g.strokeRect(36 * k, 0, 22 * k, 73 * k);
        g.fillStyle = "#6c5a3a"; g.font = `700 ${6.5 * k}px ${sans}`; g.textAlign = "center"; g.fillText("100 ×", 47 * k, 34 * k); g.fillText(`₹${denom}`, 47 * k, 43 * k);
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
}
function edgeTexture(colour : string) : THREE.CanvasTexture {
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64;
    const g = cv.getContext("2d")!; g.fillStyle = colour; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "rgba(255,255,255,0.16)"; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6);
    return t;
}

export function mountTowerScene(canvas : HTMLCanvasElement, o : TowerOptions) : TowerScene {
    const coarse = matchMedia("(pointer: coarse)").matches;
    const renderer = makeRenderer(canvas, coarse, true);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9c8a6a, 1.15));
    const sun = new THREE.DirectionalLight(0xfff6ea, 1.7);
    sun.position.set(-4, 9, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 5;
    Object.assign(sun.shadow.camera, { left : -8, right : 28, top : 14, bottom : -14, near : 1, far : 50 });
    sun.target.position.set(9, 0, 0); scene.add(sun, sun.target);

    // the table
    // each stack's place along the table; the RTGS tower, two bundles wide, gets more room after it
    const XAT = (i : number) => i * GAP + (i > 0 ? 1.2 : 0);
    const span = XAT(o.stacks.length - 1) + 4;
    // a walnut counting table, its grain running along the table
    const wood = (() => {
        const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 128;
        const g = cv.getContext("2d")!; g.fillStyle = "#6e4a30"; g.fillRect(0, 0, 1024, 128);
        for (let i = 0; i < 70; i++) { const y = Math.random() * 128; g.strokeStyle = Math.random() < 0.5 ? "rgba(40,22,10,0.22)" : "rgba(160,110,70,0.18)"; g.lineWidth = 0.5 + Math.random() * 1.6; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 90 + i) * 2.5); g.stroke(); }
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 5); return t;
    })();
    // a large table, its top running from just behind the notes towards the viewer, so it fills the foot of the screen
    const table = new THREE.Mesh(new THREE.BoxGeometry(span + 10, 0.3, 15), [ 0, 1, 2, 3, 4, 5 ].map(i => new THREE.MeshLambertMaterial(i === 2 ? { map : wood } : { color : 0x4a2f1d })));
    table.position.set(span / 2 - 2, -0.15, 4); table.receiveShadow = true; scene.add(table);

    const disposeList : { dispose : () => void }[] = [];
    const mat = (m : THREE.Material) => { disposeList.push(m); return m; };
    const faceMats = (denom : number, band : boolean) => {
        const top = mat(new THREE.MeshLambertMaterial({ map : noteTexture(denom, band) }));
        const side = mat(new THREE.MeshLambertMaterial({ map : edgeTexture(NOTES[denom].paper) }));
        return [ side, side, top, side, side, side ];
    };
    const bundleMats = faceMats(500, false), loose : Record<number, THREE.Material[]> = {};
    const looseMats = (d : number) => (loose[d] ??= faceMats(d, false));
    const coinMat = mat(new THREE.MeshLambertMaterial({ color : 0xc9c2b2 }));

    // every bundle, note and coin is a drop: where it rests and when it falls there; each stack's drops, bottom to top
    interface Drop { mesh : THREE.InstancedMesh | THREE.Mesh; band? : THREE.InstancedMesh; idx : number; x : number; y : number; z : number; ry : number; t0 : number; spin : number }
    const stackDrops : Drop[][] = [];
    // each stack: bundles, loose ₹500 notes, then the change on top; a label point at its top
    const tops : THREE.Vector3[] = [];
    o.stacks.forEach((st, i) => {
        const list : Drop[] = []; stackDrops.push(list);
        const x = XAT(i), notes500 = Math.floor(st.avg / 500), bundles = Math.floor(notes500 / 100), looseN = notes500 - bundles * 100;
        let y = 0;
        if (bundles) {
            // RTGS stands four to a layer; a few bundles stand one on another
            const per = bundles > 8 ? 4 : 1, layers = Math.ceil(bundles / per);
            const geo = new THREE.BoxGeometry(NOTES[500].w, BUNDLE_H, NOTES[500].d);
            const mesh = new THREE.InstancedMesh(geo, bundleMats, bundles);
            mesh.castShadow = mesh.receiveShadow = true;
            // the paper strap round each bundle, a little proud of the notes, a quarter of the way along
            const bandGeo = new THREE.BoxGeometry(0.19, BUNDLE_H + 0.006, NOTES[500].d + 0.01); bandGeo.translate(-0.352, 0, 0);
            const band = new THREE.InstancedMesh(bandGeo, mat(new THREE.MeshLambertMaterial({ color : 0xf4ecd8 })), bundles);
            band.castShadow = band.receiveShadow = true; scene.add(band); disposeList.push(bandGeo);
            for (let b = 0; b < bundles; b++) {
                const l = Math.floor(b / per), c = b % per, dx = per === 4 ? (c % 2 - 0.5) * (NOTES[500].w + 0.02) : 0, dz = per === 4 ? (Math.floor(c / 2) - 0.5) * (NOTES[500].d + 0.02) : 0;
                list.push({ mesh, band, idx : b, x : x + dx, y : BUNDLE_H * (l + 0.5), z : dz, ry : (((b * 7919) % 13) - 6) * 0.004, t0 : 0, spin : 0 });
            }
            scene.add(mesh); disposeList.push(geo);
            y = layers * BUNDLE_H;
        }
        // loose notes of one kind, one on another, as one instanced mesh
        const pile = (d : number, n : number, jitter : number) => {
            const geo = new THREE.BoxGeometry(NOTES[d].w, THICK, NOTES[d].d); disposeList.push(geo);
            const mesh = new THREE.InstancedMesh(geo, looseMats(d), n); mesh.castShadow = mesh.receiveShadow = true;
            for (let k = 0; k < n; k++) {
                list.push({ mesh, idx : k, x : x + Math.sin(k * 2.1 + i) * jitter, y : y + THICK / 2, z : Math.cos(k * 1.7 + i) * jitter, ry : Math.sin(k * 3.3 + i) * 0.06, t0 : 0, spin : Math.sin(k * 5.1 + i) * 0.9 });
                y += THICK;
            }
            scene.add(mesh);
        };
        if (looseN) pile(500, looseN, 0.015);
        const rest = change(st.avg - notes500 * 500);
        rest.filter(d => d >= 10).forEach((d, k) => pile(d, 1, 0.04 + k * 0.01));
        // coins sit beside the notes, a small heap
        rest.filter(d => d < 10).forEach((d, k) => {
            const r = d === 5 ? 0.115 : d === 2 ? 0.135 : 0.1, geo = new THREE.CylinderGeometry(r, r, 0.022, 32); disposeList.push(geo);
            const m = new THREE.Mesh(geo, coinMat); m.castShadow = true;
            list.push({ mesh : m, idx : -1, x : x + 0.95 + k * 0.05, y : 0.011 + k * 0.022, z : 0.3 - k * 0.03, ry : 0, t0 : 0, spin : 0.6 }); scene.add(m);
        });
        tops.push(new THREE.Vector3(x, Math.max(y, 0.02) + 0.06, 0));
    });

    // when each drop falls: every stack builds at once, the larger ones taking longer, all done by T_BUILD
    stackDrops.forEach((list, i) => { const start = 0.3 + i * 0.1, d = Math.min(T_BUILD - FALL - 0.6 - i * 0.1, 0.5 + list.length * 0.02); list.forEach((dr, k) => { dr.t0 = start + d * k / Math.max(1, list.length); }); });
    const drops = stackDrops.flat();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    // each falls from above with gravity, a loose note turning as it drifts; before its time it is not there
    const placeDrops = (t : number) => {
        const dirty = new Set<THREE.InstancedMesh>();
        for (const d of drops) {
            const p = Math.min(1, (t - d.t0) / FALL), up = p <= 0 ? 0 : (1 - p * p) * 2.2;
            eu.set(0, d.ry, (p > 0 ? 1 - p : 0) * d.spin); q.setFromEuler(eu);
            pv.set(d.x, d.y + up, d.z); sv.setScalar(p <= 0 ? 0 : 1);
            if (d.idx < 0) { d.mesh.position.copy(pv); d.mesh.quaternion.copy(q); d.mesh.visible = p > 0; continue; }
            m4.compose(pv, q, sv); (d.mesh as THREE.InstancedMesh).setMatrixAt(d.idx, m4); dirty.add(d.mesh as THREE.InstancedMesh);
            if (d.band) { d.band.setMatrixAt(d.idx, m4); dirty.add(d.band); }
        }
        dirty.forEach(m => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); });
    };
    const progressAt = (t : number) => stackDrops.map(list => list.filter(d => t >= d.t0 + FALL).length / Math.max(1, list.length));

    // the camera's path: over the whole table, up to the top of the tower, down the table, and back
    const last = XAT(o.stacks.length - 1);
    const towerTop = tops[0].y;
    let aspect = 1;
    // far enough back to hold the whole table and the tower's top, a little above it
    const overview = () => {
        const f = Math.tan(camera.fov * Math.PI / 360), far = Math.max((last + 7) / (2 * f * aspect), (towerTop + 2) / (2 * f)) * 1.05;
        // on a wide screen the words sit over the left third, so the table moves right of them
        const cx = last / 2 - (aspect > 1.2 ? (last + 7) * 0.08 : 0);
        // the table sits low on the screen, the tower reaching up past the words
        return { p : new THREE.Vector3(cx, towerTop * 0.55 + far * 0.3, far * (aspect > 1.2 ? 1.14 : 1.0)), t : new THREE.Vector3(cx, towerTop * 0.62 + far * 0.1, 0) };
    };
    const keys = () => {
        const ov = overview();
        return [
            // the build, seen low along the table from its small end, the tower rising behind, drifting in
            // (from behind the table, so the tower rises on the right, clear of the words on the left)
            { at : 0,       p : new THREE.Vector3(last + 2.8, 1.5, -5.0), t : new THREE.Vector3(last * 0.42, 0.75, 0.4) },
            { at : T_BUILD, p : new THREE.Vector3(last + 1.6, 1.25, -4.0), t : new THREE.Vector3(last * 0.4, 0.8, 0.4) },
            { at : T_BUILD + 2.6, p : new THREE.Vector3(1.6, towerTop + 1.6, 3.6), t : new THREE.Vector3(0, towerTop - 0.4, 0) },
            { at : T_BUILD + 5.0, p : new THREE.Vector3(GAP * 2.2, 1.4, 3.4), t : new THREE.Vector3(GAP * 1.6, 0.15, 0) },
            { at : T_BUILD + 7.6, p : new THREE.Vector3(last - GAP * 0.6, 0.55, 2.2), t : new THREE.Vector3(last - GAP * 1.2, 0.02, 0) },
            { at : T_BUILD + 9.2, p : new THREE.Vector3(last + 0.4, 0.4, 1.3), t : new THREE.Vector3(last, 0.02, 0) },
            { at : T_END, ...ov },
        ];
    };
    let K = keys(), clock = 0, playing = false, ended = false;
    const hold = heldFrame();
    const poseAt = (t : number) => {
        let i = 0; while (i < K.length - 2 && t > K[i + 1].at) i++;
        const a = K[i], b = K[i + 1], k = easeInOut((t - a.at) / (b.at - a.at));
        camera.position.lerpVectors(a.p, b.p, k);
        const look = new THREE.Vector3().lerpVectors(a.t, b.t, k);
        camera.lookAt(look);
    };
    let w = 1, h = 1;
    const labels = () => { const pr = progressAt(clock); o.onLabels(tops.map((p, i) => {
        const v = p.clone().project(camera);
        return { key : o.stacks[i].key, x : (v.x + 1) / 2 * w, y : (1 - v.y) / 2 * h, shown : pr[i] > 0 && v.z < 1 && v.x > -1.05 && v.x < 1.05 && v.y > -1.05 && v.y < 1.05, progress : pr[i] };
    })); };
    let placedAt = -1;
    const draw = () => { if (clock < T_BUILD + FALL || placedAt < T_BUILD + FALL) { placeDrops(clock); placedAt = clock; } poseAt(clock); renderer.render(scene, camera); labels(); };
    const unfit = fitToHost(canvas, renderer, (cw, ch) => { w = cw; h = ch; aspect = cw / ch; camera.aspect = aspect; camera.updateProjectionMatrix(); K = keys(); draw(); });

    if (o.reduced) { clock = T_END; ended = true; }
    else if (hold != null) clock = hold;
    draw();

    const unloop = loopWhileVisible(canvas, dt => {
        if (!playing || hold != null) return;
        clock = Math.min(T_END, clock + dt);
        draw();
        if (clock >= T_END && !ended) { ended = true; playing = false; o.onEnd(); }
    });
    // starts the first time the stage is mostly on screen
    const io = new IntersectionObserver(([ e ]) => { if (e.intersectionRatio > 0.6 && !ended && !o.reduced) { playing = true; io.disconnect(); } }, { threshold : [ 0.6 ] });
    io.observe(canvas);

    return {
        replay : () => { clock = 0; placedAt = -1; ended = false; playing = true; },
        dispose : () => {
            io.disconnect(); unloop(); unfit();
            disposeList.forEach(d => d.dispose());
            scene.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(mt => { (mt as THREE.MeshLambertMaterial).map?.dispose(); mt.dispose(); }); } });
            renderer.dispose();
        },
    };
}
