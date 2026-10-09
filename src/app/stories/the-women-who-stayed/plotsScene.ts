// The plots in 3D: the same isometric farmland as the opening, pulled back to show two wheat fields side by side (the
// men's and the women's), and beyond them a building site with a factory (industry) and a row of shops (services). Each
// of the 200 small figures is one in every hundred rural workers who work, in the opening's dress: men in a blue kurta
// and pagdi (a hat in the PLFS years), the men in industry in the mason's hard hat and vest, the women in an orange
// sari. Figures stand where DBIE's report 134 puts them for a survey; between surveys they walk.
//
// Around them, decoration that carries no number: coconut palms and mango trees, birds, and the times. In the NSS
// years a bullock cart rolls down the farm track; in the PLFS years a tractor takes its place, and far off on the left a
// wind turbine turns beside a small town, a glass tower and a power line, and the factory has solar panels. The track
// runs down the right of the women's field, past the end of the shops' yard, where no figure ever walks, so nothing
// drives through a person.
//
// createPlotsScene builds everything once. render(state) draws a frame for a place on the survey timeline: x is a
// round index (-1 is "all in the field", 0 the first survey, a fraction is part-way between two), so the scroll can
// scrub through the surveys both ways. run(true) starts a loop for the wind, the birds and the vehicles while the
// stage is on screen; it never moves the figures, which follow only the scroll.

// LIB =================================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// LOCAL ===============================================================================================================
import { RURAL, hundred } from "./data";

export interface Anchor { x : number; y : number; }
export interface PlotsState { x : number; zoom : number; dim : boolean; }
export interface PlotsScene {
    render  : (s : PlotsState) => void;
    run     : (on : boolean) => void;
    resize  : (width : number, height : number, frame : { l : number; r : number; t : number; b : number }) => void;
    anchors : () => Record<"ind" | "serv" | "men" | "women" | "menSide" | "womenSide" | "badge", Anchor>;
    dispose : () => void;
}

type Sex = "m" | "w";
type Place = "agri" | "ind" | "serv";
type Kind = "man" | "manModern" | "worker" | "woman";
const FIGS = 100;
const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
const smooth = (t : number) => t * t * (3 - 2 * t);
const seeded = (seed : number) => { let q = seed; return () => (q = (q * 16807) % 2147483647) / 2147483647; };

// Where each figure is for each survey: figure k goes to industry while k is below the industry count, then to services,
// otherwise it stays in its own cell of the field (back rows leave first, nearest the buildings). Index 0 is the "meet"
// state, everyone in the field; index i + 1 is survey i.
const PLAN : Record<Sex, { place : Place; slot : number }[]>[] = [ -1, ...RURAL.map((_, i) => i) ].map(i => {
    const out = {} as Record<Sex, { place : Place; slot : number }[]>;
    for (const sex of [ "m", "w" ] as Sex[]) {
        const [ , nInd, nServ ] = i < 0 ? [ FIGS, 0, 0 ] : hundred(RURAL[i][sex]);
        out[sex] = Array.from({ length : FIGS }, (_, k) => {
            const place : Place = k < nInd ? "ind" : k < nInd + nServ ? "serv" : "agri";
            return { place, slot : place === "serv" ? k - nInd : k };
        });
    }
    return out;
});
// the PLFS surveys are the recent years: tractors, turbines and a town; the NSS rounds have bullocks
const modernAt = (i : number) => i >= 0 && RURAL[i].round.startsWith("PLFS");

// THE LAYOUT, square to the land: on screen x runs down to the right and z down to the left, as in the opening.
const FIELD = { w : 8.4, d : 6.6, z : 2.9, x : { m : -4.9, w : 4.9 }, rows : 0.64 };
const YARD = { z0 : -4.9, z1 : -2.3, x : { ind : -4.9, serv : 4.9 }, w : 7.6 };
const BACK = -7.0;
const TRACK_X = 10.8;    // the farm track down the right of the women's field and past the shops' yard, where nobody walks
const S = 0.42;

export const createPlotsScene = (canvas : HTMLCanvasElement, opts : { narrow : boolean; reduced : boolean }) : PlotsScene => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.narrow ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const HAZE = 0xe9f0ea;
    scene.fog = new THREE.Fog(HAZE, 70, 125);
    renderer.setClearColor(HAZE, 1);
    const rand = seeded(7);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.position.copy(new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(60)); camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xeaf3ff, 0xc2ad80, 1.3));
    const sun = new THREE.DirectionalLight(0xffecc8, 2.6);
    sun.position.set(-16, 26, -6); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left : -18, right : 18, top : 18, bottom : -18, near : 1, far : 90 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const flat = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.85, metalness : 0, flatShading : true, ...extra });
    const soft = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.7, metalness : 0, ...extra });
    const add = (geo : THREE.BufferGeometry, m : THREE.Material, x : number, y : number, z : number, parent : THREE.Object3D = scene, shadow = true) => {
        const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
    };

    // THE LAND ========================================================================================================
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), flat(0xa7c573));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const PATCH = [ 0xd9c35a, 0x8fbf5c, 0xc9a978, 0xb5d07a, 0xe4cf6a, 0x9ac46a, 0xbf9f6c ];
    for (let gx = -5; gx <= 5; gx++) for (let gz = -5; gz <= 5; gz++) {
        const cx = gx * 12, cz = gz * 10;
        if (Math.abs(cx) < 16 && Math.abs(cz) < 13) continue;
        const w = 9.5 + rand() * 2, d = 8 + rand() * 1.5;
        add(new THREE.BoxGeometry(w, 0.05, d), flat(PATCH[Math.floor(rand() * PATCH.length)]), cx, 0.025, cz, scene, false);
        add(new THREE.BoxGeometry(w + 0.5, 0.04, d + 0.5), flat(0xc9ab77), cx, 0.01, cz, scene, false);
    }
    // a village road between the fields and the buildings, a path between the fields, a cart track in front
    add(new THREE.BoxGeometry(60, 0.045, 1.4), flat(0xd6c49c), 0, 0.022, -1.35, scene, false);
    add(new THREE.BoxGeometry(1.4, 0.045, 60), flat(0xd6c49c), TRACK_X, 0.022, 0, scene, false);
    add(new THREE.BoxGeometry(1.0, 0.04, 7.4), flat(0xd6c49c), 0, 0.02, FIELD.z, scene, false);
    // the two fields: tilled earth inside a raised bank
    for (const sx of [ FIELD.x.m, FIELD.x.w ]) {
        add(new THREE.BoxGeometry(FIELD.w + 0.6, 0.12, FIELD.d + 0.6), flat(0xc9ab77), sx, 0.06, FIELD.z, scene, false);
        add(new THREE.BoxGeometry(FIELD.w, 0.14, FIELD.d), flat(0xb08e5c), sx, 0.07, FIELD.z, scene, false);
    }
    for (const yx of [ YARD.x.ind, YARD.x.serv ]) add(new THREE.BoxGeometry(YARD.w + 0.6, 0.05, YARD.z1 - YARD.z0 + 0.8), flat(0xcdb68a), yx, 0.03, (YARD.z0 + YARD.z1) / 2, scene, false);

    // THE WHEAT, as in the opening: thin stalks with golden ears, a vertex-shader wind; kept short here and planted
    // between the rows of figures, so every farmer stays in view
    const wind = { value : 0 };
    const stalkGeo = (() => {
        const stem = new THREE.CylinderGeometry(0.006, 0.009, 0.95, 3, 4); stem.translate(0, 0.475, 0);
        const ear = new THREE.CylinderGeometry(0.022, 0.014, 0.22, 5, 2); ear.translate(0, 1.05, 0);
        const awn = new THREE.ConeGeometry(0.02, 0.14, 4, 1); awn.translate(0, 1.23, 0);
        const leaf = new THREE.PlaneGeometry(0.04, 0.42, 1, 3); leaf.translate(0.02, 0.38, 0); leaf.rotateZ(-0.45);
        const parts = [ stem, ear, awn, leaf ].map(g => g.toNonIndexed());
        const cols = [ [ 0.8, 0.72, 0.36 ], [ 0.95, 0.77, 0.36 ], [ 0.96, 0.84, 0.52 ], [ 0.62, 0.68, 0.3 ] ];
        let count = 0; parts.forEach(g => { count += g.attributes.position.count; });
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        let o = 0;
        parts.forEach((g, k) => {
            pos.set(g.attributes.position.array as Float32Array, o * 3);
            for (let i = 0; i < g.attributes.position.count; i++) col.set(cols[k], (o + i) * 3);
            o += g.attributes.position.count;
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
        return geo;
    })();
    const wheatMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.85, side : THREE.DoubleSide, flatShading : true });
    wheatMat.onBeforeCompile = sh => {
        sh.uniforms.uWind = wind;
        sh.vertexShader = "uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
            vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float bend = pow(max(position.y, 0.0), 1.6) * (0.1 + 0.08 * sin(uWind * 1.6 + wp.x * 0.5 + wp.z * 0.3));
            transformed.x += bend * 0.8; transformed.z += bend * 0.5;`);
    };
    {
        const PER = opts.narrow ? 70 : 110, N = 2 * 10 * PER;
        const wheat = new THREE.InstancedMesh(stalkGeo, wheatMat, N), d = new THREE.Object3D(), tint = new THREE.Color();
        let w = 0;
        for (const sx of [ FIELD.x.m, FIELD.x.w ]) for (let r = 0; r < 10; r++) for (let k = 0; k < PER; k++) {
            // a band of wheat just behind each row of figures
            d.position.set(sx - FIELD.w / 2 + 0.15 + rand() * (FIELD.w - 0.3), 0.14, FIELD.z - FIELD.d / 2 + 0.12 + r * FIELD.rows + rand() * 0.2);
            d.rotation.set((rand() - 0.5) * 0.1, rand() * Math.PI * 2, (rand() - 0.5) * 0.1);
            const s = 0.42 + rand() * 0.14; d.scale.set(s * 1.4, s, s * 1.4);
            d.updateMatrix(); wheat.setMatrixAt(w, d.matrix);
            tint.setHSL(0.11 + rand() * 0.025, 0.45 + rand() * 0.2, 0.74 + rand() * 0.18); wheat.setColorAt(w, tint);
            w++;
        }
        wheat.count = w; wheat.receiveShadow = true; scene.add(wheat);
    }

    // INDUSTRY: A BUILDING SITE AND A FACTORY ========================================================================
    const concrete = flat(0xd3cdc1), brick = flat(0xb9573a), steel = flat(0x8d97a1);
    const site = new THREE.Group(); site.position.set(-7.4, 0, BACK); scene.add(site);
    add(new THREE.BoxGeometry(3.0, 0.16, 2.4), concrete, 0, 0.08, 0, site);
    ([ [ -1.35, -1.05 ], [ 1.35, -1.05 ], [ -1.35, 1.05 ], [ 1.35, 1.05 ] ] as const).forEach(([ a, b ]) => add(new THREE.BoxGeometry(0.2, 2.2, 0.2), concrete, a, 1.2, b, site));
    add(new THREE.BoxGeometry(3.0, 0.14, 2.4), concrete, 0, 1.25, 0, site);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) add(new THREE.BoxGeometry(0.42, 0.18, 0.18), brick, -1.1 + c * 0.44 + (r % 2) * 0.22, 0.25 + r * 0.19, -1.05, site);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) add(new THREE.BoxGeometry(0.18, 0.18, 0.42), brick, -1.35, 0.25 + r * 0.19, -0.75 + c * 0.44 + (r % 2) * 0.22, site);
    for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 4), steel, -1.75, 1.4, -1.0 + i * 1.0, site);
    for (let j = 0; j < 2; j++) add(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 4), steel, -1.75, 0.8 + j * 1.0, 0, site).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.5, 0.14, 0.32), flat(0xc9c7c0), 1.9 + (i % 3) * 0.52 - (i > 2 ? 0.26 : 0), 0.07 + (i > 2 ? 0.14 : 0), 1.3, site);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) add(new THREE.BoxGeometry(0.42, 0.18, 0.8), brick, -2.3 + c * 0.44 + r * 0.22, 0.09 + r * 0.19, 1.2, site);
    const factory = new THREE.Group(); factory.position.set(-2.9, 0, BACK - 0.3); scene.add(factory);
    add(new THREE.BoxGeometry(4.0, 1.6, 2.4), flat(0xe7e2f2), 0, 0.8, 0, factory);
    for (let i = 0; i < 4; i++) {
        const tooth = add(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 3, 1), flat(0xd6cfe8), -1.5 + i * 1.0, 1.75, 0, factory);
        tooth.rotation.set(Math.PI / 2, 0, 0); tooth.scale.set(1.15, 1, 0.9);
    }
    add(new THREE.BoxGeometry(3.6, 0.28, 0.02), flat(0x8fc0de), 0, 1.1, 1.21, factory);
    add(new THREE.BoxGeometry(1.0, 0.8, 0.02), flat(0x8a80b8), 0.6, 0.4, 1.21, factory);
    const chimney = new THREE.Group(); chimney.position.set(1.6, 0, -0.6); factory.add(chimney);
    add(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 10), flat(0xece8f4), 0, 1.7, 0, chimney);
    [ 2.6, 3.1 ].forEach(y => add(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 10), flat(0xd9362d), 0, y, 0, chimney));
    const modernBits : THREE.Object3D[] = [], oldBits : THREE.Object3D[] = [];
    const solar = new THREE.Group(); factory.add(solar); modernBits.push(solar);
    for (let i = 0; i < 4; i++) { const p = add(new THREE.BoxGeometry(0.7, 0.03, 1.8), flat(0x2d4f86, { roughness : 0.4 }), -1.5 + i * 1.0, 2.05, 0, solar); p.rotation.x = -0.35; }

    // SERVICES: A ROW OF SHOPS ========================================================================================
    const shops = new THREE.Group(); shops.position.set(YARD.x.serv, 0, BACK); scene.add(shops);
    add(new THREE.BoxGeometry(6.4, 2.2, 2.2), flat(0xf6efde), 0, 1.1, 0, shops);
    add(new THREE.BoxGeometry(6.6, 0.12, 2.4), flat(0xe1d3b3), 0, 2.26, 0, shops);
    [ 0xe4572e, 0x2e9e6a, 0x2f6fbf ].forEach((c, i) => {
        const x = -2.13 + i * 2.13;
        add(new THREE.BoxGeometry(1.8, 0.9, 0.04), flat(0x5c4a35), x, 0.45, 1.11, shops);
        add(new THREE.BoxGeometry(1.6, 0.35, 0.3), flat(0xc9a77a), x, 0.2, 1.3, shops);
        for (let k = 0; k < 6; k++) { const a = add(new THREE.BoxGeometry(0.3, 0.04, 0.6), flat(k % 2 ? 0xffffff : c), x - 0.75 + k * 0.3, 1.05, 1.38, shops); a.rotation.x = 0.35; }
        add(new THREE.BoxGeometry(1.5, 0.3, 0.04), flat(c), x, 1.45, 1.12, shops);
        for (let k = 0; k < 2; k++) add(new THREE.BoxGeometry(0.5, 0.36, 0.03), flat(0xcfe3ec), x - 0.4 + k * 0.8, 1.85, 1.12, shops);
    });

    // TREES, as in the opening: coconut palms with curved trunks, drooping fronds and nuts; mango trees ==============
    const frondGeo = (() => {
        const pts : number[] = [], idx : number[] = [], L = 2.8, n = 14;
        for (let i = 0; i <= n; i++) {
            const t = i / n, sx = t * L, sy = 0.32 * t * L - 0.55 * t * t * L, wd = 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 0.05;
            pts.push(sx, sy, -wd, sx, sy + 0.02, 0, sx, sy, wd);
        }
        for (let i = 0; i < n; i++) { const a = i * 3; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        return geo;
    })();
    const trunkMat = flat(0x8a6c48), frondA = flat(0x3f8d3b, { side : THREE.DoubleSide }), frondB = flat(0x56a447, { side : THREE.DoubleSide }), nutMat = flat(0x6f8a3a);
    const crowns : THREE.Group[] = [];
    const palm = (x : number, z : number, s = 1, lean = 1, rot = 0) => {
        const g = new THREE.Group();
        const curve = new THREE.CatmullRomCurve3([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2 * lean, 1.8, 0), new THREE.Vector3(0.6 * lean, 3.6, 0), new THREE.Vector3(1.1 * lean, 5.2, 0) ]);
        const tube = new THREE.TubeGeometry(curve, 16, 0.14, 7, false), tp = tube.attributes.position;
        for (let i = 0; i < tp.count; i++) {
            const yy = clamp01(tp.getY(i) / 5.2), c = curve.getPoint(yy), k = 1 - yy * 0.35;
            tp.setX(i, c.x + (tp.getX(i) - c.x) * k); tp.setZ(i, c.z + (tp.getZ(i) - c.z) * k);
        }
        tube.computeVertexNormals();
        add(tube, trunkMat, 0, 0, 0, g);
        const crown = new THREE.Group(); crown.position.copy(curve.getPoint(1)); g.add(crown);
        for (let k = 0; k < 11; k++) { const f = add(frondGeo, k % 2 ? frondA : frondB, 0, 0, 0, crown); f.rotation.set(0, (k / 11) * Math.PI * 2, (rand() - 0.5) * 0.3); }
        for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.12, 8, 6), nutMat, Math.cos(i * 1.6) * 0.17, -0.18, Math.sin(i * 1.6) * 0.17, crown);
        crowns.push(crown);
        g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s); scene.add(g);
    };
    const mango = (x : number, z : number, s = 1) => {
        const g = new THREE.Group();
        add(new THREE.CylinderGeometry(0.18, 0.26, 1.5, 6), flat(0x7a5634), 0, 0.75, 0, g);
        ([ [ 0, 2.2, 0, 1.2 ], [ -0.75, 1.85, 0.3, 0.9 ], [ 0.8, 1.95, -0.2, 0.95 ], [ 0.2, 2.75, 0.35, 0.8 ] ] as const)
            .forEach(([ a, b, c, r ], i) => add(new THREE.IcosahedronGeometry(r, 0), flat(i % 2 ? 0x4b9143 : 0x3e7f3a), a, b, c, g));
        for (let i = 0; i < 7; i++) add(new THREE.SphereGeometry(0.09, 6, 4), flat(0xf2b33d), Math.cos(i) * 1.05, 1.75 + (i % 3) * 0.4, Math.sin(i) * 1.05, g);
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    };
    palm(10.6, BACK - 0.4, 0.66, -0.8, 2.2); palm(0.3, BACK - 0.8, 0.5, 0.7, 1.1);
    palm(-12.6, 5.0, 0.6, -0.9, 3.0); palm(17.2, 1.2, 0.58, 0.9, 5.1);
    mango(15.6, -1.2, 0.8); mango(-9.2, 7.4, 0.75);
    for (let i = 0; i < 44; i++) {
        const x = (rand() - 0.5) * 90, z = (rand() - 0.5) * 80;
        if (Math.abs(x) < 14 && Math.abs(z) < 12) continue;
        if (Math.abs(x - TRACK_X) < 3.5 || (x < -11 && z < 0 && z > -11)) continue;   // the track and the distant town stay clear
        if (rand() < 0.6) palm(x, z, 0.55 + rand() * 0.2, rand() < 0.5 ? 1 : -1, rand() * 6); else mango(x, z, 0.75 + rand() * 0.35);
    }

    // THE FIGURES =====================================================================================================
    // One merged, vertex-coloured shape per kind of figure, standing about 1.75 high before scaling.
    const part = (g : THREE.BufferGeometry, color : number, x : number, y : number, z : number, sx = 1, sy = 1, sz = 1) => {
        g.scale(sx, sy, sz); g.translate(x, y, z);
        const ni = g.index ? g.toNonIndexed() : g; ni.deleteAttribute("uv");
        const c = new THREE.Color(color), n = ni.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) col.set([ c.r, c.g, c.b ], i * 3);
        ni.setAttribute("color", new THREE.BufferAttribute(col, 3));
        return ni;
    };
    const SKIN = 0xa86f45;
    const personGeo = (kind : Kind) => {
        const parts : THREE.BufferGeometry[] = [];
        if (kind === "woman") {
            parts.push(part(new THREE.CylinderGeometry(0.17, 0.3, 0.92, 12), 0xd9622b, 0, 0.46, 0));
            parts.push(part(new THREE.CylinderGeometry(0.305, 0.31, 0.07, 12), 0xf2c443, 0, 0.04, 0));
            parts.push(part(new THREE.CylinderGeometry(0.18, 0.16, 0.5, 10), 0x2e8f5e, 0, 1.18, 0, 1, 1, 0.75));
            parts.push(part(new THREE.BoxGeometry(0.16, 0.62, 0.03), 0xb84a22, -0.02, 1.15, 0.13));
        } else {
            const worker = kind === "worker";
            parts.push(part(new THREE.CylinderGeometry(0.2, 0.22, 0.62, 10), worker ? 0x59626c : 0xf3efe4, 0, 0.58, 0));
            [ -0.09, 0.09 ].forEach(x => parts.push(part(new THREE.CylinderGeometry(0.05, 0.045, 0.3, 6), worker ? 0x59626c : SKIN, x, 0.15, 0)));
            parts.push(part(new THREE.CylinderGeometry(0.19, 0.22, worker ? 0.5 : 0.62, 10), 0x2a78d6, 0, worker ? 1.18 : 1.13, 0, 1, 1, 0.75));
            if (worker) parts.push(part(new THREE.CylinderGeometry(0.205, 0.205, 0.42, 10, 1, true), 0xf28c28, 0, 1.18, 0, 1, 1, 0.78));
            else parts.push(part(new THREE.BoxGeometry(0.1, 0.55, 0.03), 0xc8402e, -0.06, 1.17, 0.15));   // the gamcha
        }
        [ -1, 1 ].forEach(sd => parts.push(part(new THREE.CylinderGeometry(0.05, 0.04, 0.56, 6), kind === "woman" ? 0x2e8f5e : 0x2a78d6, sd * 0.23, 1.15, 0)));
        [ -1, 1 ].forEach(sd => parts.push(part(new THREE.SphereGeometry(0.05, 6, 4), SKIN, sd * 0.24, 0.85, 0)));
        parts.push(part(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 6), SKIN, 0, 1.48, 0));
        parts.push(part(new THREE.SphereGeometry(0.13, 12, 9), SKIN, 0, 1.62, 0, 0.92, 1.08, 1));
        if (kind === "man") {
            // a pagdi wound in layers
            for (let i = 0; i < 3; i++) parts.push(part(new THREE.TorusGeometry(0.11 - i * 0.015, 0.04, 6, 14).rotateX(Math.PI / 2), 0xf2a12e, 0, 1.69 + i * 0.04, -0.005));
            parts.push(part(new THREE.SphereGeometry(0.09, 8, 6), 0xf2a12e, 0, 1.8, 0, 1, 0.6, 1));
        }
        if (kind === "manModern") {
            parts.push(part(new THREE.CylinderGeometry(0.27, 0.27, 0.025, 14), 0xc8954f, 0, 1.73, 0));
            parts.push(part(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 12), 0xd8a95f, 0, 1.8, 0));
        }
        if (kind === "worker") {
            parts.push(part(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xf2c21b, 0, 1.67, 0));
            parts.push(part(new THREE.CylinderGeometry(0.18, 0.18, 0.015, 14), 0xf2c21b, 0, 1.67, 0.02));
        }
        if (kind === "woman") parts.push(part(new THREE.SphereGeometry(0.155, 12, 8, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.72), 0xd8521e, 0, 1.63, -0.02));
        const geo = mergeGeometries(parts)!; geo.computeVertexNormals();
        return geo;
    };
    const figMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.75, flatShading : true });
    const KINDS = {} as Record<Kind, THREE.InstancedMesh>;
    ([ "man", "manModern", "worker", "woman" ] as Kind[]).forEach(k => {
        const mesh = new THREE.InstancedMesh(personGeo(k), figMat, FIGS);
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.count = 0; mesh.frustumCulled = false;
        scene.add(mesh); KINDS[k] = mesh;
    });

    // THE TIMES: BULLOCKS IN THE NSS YEARS, TRACTORS AND TURBINES IN THE PLFS YEARS =================================
    // a white zebu bullock, as in the opening: body, hump, dewlap, head with horns and ears, four legs, a tail
    const hide = flat(0xeee8dc), hideShade = flat(0xd9d0c0), horn = flat(0x3a2f26);
    const legSets : THREE.Group[][] = [];
    const bullock = (parent : THREE.Object3D, x : number, z : number) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
        add(new THREE.CapsuleGeometry(0.28, 1.0, 4, 10), hide, 0, 0.92, 0, g).rotation.x = Math.PI / 2;
        add(new THREE.SphereGeometry(0.22, 10, 8), hide, 0, 1.22, -0.38, g).scale.set(0.9, 1.0, 1.1);
        add(new THREE.BoxGeometry(0.08, 0.3, 0.35), hideShade, 0, 0.72, -0.62, g);
        const head = new THREE.Group(); head.position.set(0, 1.08, -0.82); g.add(head);
        add(new THREE.BoxGeometry(0.2, 0.22, 0.42), hide, 0, -0.04, -0.12, head).rotation.x = 0.5;
        add(new THREE.BoxGeometry(0.16, 0.12, 0.12), flat(0x8a7d70), 0, -0.2, -0.33, head);
        [ -1, 1 ].forEach(sd => {
            add(new THREE.ConeGeometry(0.035, 0.32, 6), horn, sd * 0.1, 0.18, 0.04, head).rotation.set(-0.3, 0, sd * -0.5);
            add(new THREE.BoxGeometry(0.16, 0.05, 0.08), hideShade, sd * 0.15, 0.04, 0.05, head).rotation.z = sd * 0.3;
        });
        const legs : THREE.Group[] = [];
        [ [ -0.15, -0.42 ], [ 0.15, -0.42 ], [ -0.15, 0.42 ], [ 0.15, 0.42 ] ].forEach(([ lx, lz ]) => {
            const hip = new THREE.Group(); hip.position.set(lx, 0.78, lz); g.add(hip); legs.push(hip);
            add(new THREE.CylinderGeometry(0.07, 0.05, 0.74, 6), hide, 0, -0.37, 0, hip);
            add(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 6), horn, 0, -0.75, 0, hip);
        });
        add(new THREE.CylinderGeometry(0.02, 0.012, 0.6, 5), hideShade, 0, 0.7, 0.68, g).rotation.x = 0.25;
        legSets.push(legs);
        return g;
    };
    const wood = flat(0x7a5634), woodDark = flat(0x5c4024);
    const wheel = (parent : THREE.Object3D, x : number, y : number, z : number, r : number) => {
        const wh = new THREE.Group(); wh.position.set(x, y, z); parent.add(wh);
        add(new THREE.TorusGeometry(r, 0.05, 6, 20), woodDark, 0, 0, 0, wh).rotation.y = Math.PI / 2;
        for (let k = 0; k < 8; k++) add(new THREE.BoxGeometry(0.03, r * 1.9, 0.04), wood, 0, 0, 0, wh).rotation.x = (k / 8) * Math.PI;
        return wh;
    };
    const driver = (kind : Kind) => { const m = new THREE.Mesh(personGeo(kind), figMat); m.castShadow = true; return m; };
    // the bullock cart: a wooden bed piled with sheaves, two spoked wheels, a pair of bullocks under a yoke, a driver;
    // it comes down the farm track towards the reader
    const cart = new THREE.Group(); scene.add(cart); oldBits.push(cart);
    add(new THREE.BoxGeometry(1.4, 0.08, 2.2), wood, 0, 1.0, 0, cart);
    [ -0.68, 0.68 ].forEach(x => add(new THREE.BoxGeometry(0.05, 0.05, 2.2), woodDark, x, 1.35, 0, cart));
    add(new THREE.BoxGeometry(0.1, 0.08, 2.4), wood, 0, 0.95, 2.2, cart);
    const cartWheels = [ wheel(cart, -0.82, 0.62, -0.1, 0.6), wheel(cart, 0.82, 0.62, -0.1, 0.6) ];
    for (let i = 0; i < 18; i++) add(new THREE.CylinderGeometry(0.11, 0.09, 0.6, 7), flat(i % 3 ? 0xd9b45a : 0xe4c467), (rand() - 0.5) * 1.0, 1.2 + Math.floor(i / 7) * 0.2, (rand() - 0.5) * 1.6, cart).rotation.set(Math.PI / 2, 0, (rand() - 0.5) * 0.8);
    add(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 6), woodDark, 0, 1.08, 3.35, cart).rotation.z = Math.PI / 2;
    [ -0.42, 0.42 ].forEach(x => bullock(cart, x, 3.7).rotation.y = Math.PI);
    const carter = driver("man"); carter.position.set(0, 0.72, 1.0); carter.scale.setScalar(0.85); cart.add(carter);
    cart.scale.setScalar(0.62);
    // the tractor that replaces it, on the same track
    const tractor = new THREE.Group(); scene.add(tractor); modernBits.push(tractor);
    add(new THREE.BoxGeometry(0.9, 0.55, 1.5), flat(0xd9362d), 0, 0.85, 0.35, tractor);
    add(new THREE.BoxGeometry(0.8, 0.4, 0.6), flat(0xc02c24), 0, 1.25, -0.35, tractor);
    [ -0.3, 0.3 ].forEach(x => add(new THREE.BoxGeometry(0.06, 0.8, 0.06), flat(0x444444), x, 1.65, -0.6, tractor));
    add(new THREE.BoxGeometry(0.8, 0.05, 0.8), flat(0x444444), 0, 2.05, -0.4, tractor);
    add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), flat(0x555555), 0.25, 1.35, 0.8, tractor);
    const tractorWheels = [ -0.55, 0.55 ].map(x => { const w = add(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16), flat(0x2f2f2f), x, 0.55, -0.4, tractor); w.rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 10), flat(0xe3b23c), 0, 0, 0, w); return w; });
    [ -0.45, 0.45 ].forEach(x => { const w = add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), flat(0x2f2f2f), x, 0.3, 0.9, tractor); w.rotation.z = Math.PI / 2; tractorWheels.push(w); });
    const tdriver = driver("manModern"); tdriver.position.set(0, 0.95, -0.4); tdriver.scale.setScalar(0.75); tractor.add(tdriver);
    tractor.scale.setScalar(0.62);

    // THE DISTANT TOWN, the PLFS years only: far off on the left, small with distance and casting no shadow on the
    // fields: one wind turbine, a few blocks of flats, a glass tower, and a power line on lattice pylons
    const modernBg = new THREE.Group(); scene.add(modernBg); modernBits.push(modernBg);
    const far = (geo : THREE.BufferGeometry, m : THREE.Material, x : number, y : number, z : number, parent : THREE.Object3D = modernBg) => {
        const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o;
    };
    const white = flat(0xd9dfe4), pale = flat(0xc9d0d6), lattice = flat(0x8d97a1);
    const turbine = new THREE.Group(); turbine.position.set(-11.4, 0, -4.8); turbine.scale.setScalar(0.4); modernBg.add(turbine);
    far(new THREE.CylinderGeometry(0.12, 0.22, 8, 10), white, 0, 4, 0, turbine);
    far(new THREE.BoxGeometry(0.35, 0.35, 0.8), pale, 0, 8.1, 0.1, turbine);
    const rotor = new THREE.Group(); rotor.position.set(0, 8.1, 0.55); rotor.rotation.y = Math.PI / 4; turbine.add(rotor);
    far(new THREE.SphereGeometry(0.16, 10, 8), pale, 0, 0, 0, rotor);
    for (let k = 0; k < 3; k++) {
        const arm = new THREE.Group(); arm.rotation.z = (k / 3) * Math.PI * 2; rotor.add(arm);
        far(new THREE.BoxGeometry(0.22, 3.6, 0.05), white, 0, 1.8, 0, arm);
    }
    const block = (x : number, z : number, w : number, h : number, c : number) => {
        far(new THREE.BoxGeometry(w, h, w), flat(c), x, h / 2, z);
        for (let r = 1; r < h / 0.45; r++) far(new THREE.BoxGeometry(w + 0.02, 0.07, w + 0.02), flat(0xeef4f8), x, r * 0.45, z);
    };
    block(-13.6, -3.6, 1.0, 2.2, 0xc9d3dc); block(-12.9, -5.3, 1.0, 1.8, 0xced7df); block(-14.4, -4.6, 0.9, 2.6, 0xb7c4d0);
    far(new THREE.BoxGeometry(0.7, 3.2, 0.7), flat(0x9fc3d6, { roughness : 0.3, metalness : 0.2 }), -13.5, 1.6, -4.8);
    // a lattice pylon: four legs leaning in, cross bracing, two arms with insulators; the line runs off to the left
    const pylon = (x : number, z : number) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 4; modernBg.add(g);
        for (const [ a, b ] of [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ]) { const leg = far(new THREE.CylinderGeometry(0.025, 0.035, 3.3, 4), lattice, a * 0.17, 1.6, b * 0.17, g); leg.rotation.set(-b * 0.1, 0, a * 0.1); }
        for (let y = 0.5; y < 3; y += 0.5) { const w = 0.45 * (1 - y / 4); far(new THREE.BoxGeometry(w, 0.025, 0.025), lattice, 0, y, w / 2, g); far(new THREE.BoxGeometry(w, 0.025, 0.025), lattice, 0, y, -w / 2, g); far(new THREE.BoxGeometry(0.025, 0.025, w), lattice, w / 2, y, 0, g); far(new THREE.BoxGeometry(0.025, 0.025, w), lattice, -w / 2, y, 0, g); }
        [ 2.4, 2.9 ].forEach((y, i) => { far(new THREE.BoxGeometry(1.2 - i * 0.3, 0.04, 0.05), lattice, 0, y, 0, g); [ -1, 1 ].forEach(sd => far(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 5), flat(0x6b7078), sd * (0.55 - i * 0.15), y - 0.1, 0, g)); });
        far(new THREE.ConeGeometry(0.06, 0.3, 4), lattice, 0, 3.4, 0, g);
        return g;
    };
    const P1 = new THREE.Vector3(-12.8, 0, -7.8), P2 = new THREE.Vector3(-15.6, 0, -3.0);
    pylon(P1.x, P1.z); pylon(P2.x, P2.z);
    // the wires sag between the pylons and run on past the second, off the screen
    const wireMat = new THREE.LineBasicMaterial({ color : 0x6b7078 });
    for (const [ y, off ] of [ [ 2.3, 0.55 ], [ 2.3, -0.55 ], [ 2.8, 0.4 ], [ 2.8, -0.4 ] ]) {
        const side = new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(off);
        const a = P1.clone().add(side).setY(y), b = P2.clone().add(side).setY(y), c = b.clone().add(b.clone().sub(a).setY(0));
        const pts = [ ...Array.from({ length : 13 }, (_, i) => { const t = i / 12; return a.clone().lerp(b, t).setY(y - Math.sin(Math.PI * t) * 0.35); }),
            ...Array.from({ length : 12 }, (_, i) => { const t = (i + 1) / 12; return b.clone().lerp(c, t).setY(y - Math.sin(Math.PI * t) * 0.35); }) ];
        modernBg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
    }

    // the NSS years' horizon: thatched huts and haystacks
    const oldBg = new THREE.Group(); scene.add(oldBg); oldBits.push(oldBg);
    ([ [ -12.4, -5.0 ], [ -13.4, -6.2 ], [ 7.5, -12.5 ], [ 10.2, -11.5 ] ] as const).forEach(([ x, z ]) => {
        add(new THREE.CylinderGeometry(0.5, 0.53, 0.66, 10), flat(0xc79a68), x, 0.33, z, oldBg);
        add(new THREE.ConeGeometry(0.74, 0.6, 10), flat(0xd9b45e), x, 0.93, z, oldBg);
    });
    ([ [ -12.6, -3.4 ], [ -13.6, -4.0 ] ] as const).forEach(([ x, z ]) => add(new THREE.ConeGeometry(0.4, 0.8, 8), flat(0xe2c065), x, 0.4, z, oldBg));

    // BIRDS: two loose flocks crossing the sky. Each bird has a body, head, beak and forked tail, and wings in two parts
    // that bend at the wrist as they beat; the flock beats for a while, then glides.
    const birdDark = flat(0x2f3338, { side : THREE.DoubleSide });
    const sheet = (pts : number[], idx : number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
    const innerWing = sheet([ 0, 0, 0.07, 0, 0, -0.06, 0.34, 0.01, -0.05, 0.32, 0.01, 0.09 ], [ 0, 1, 2, 0, 2, 3 ]);
    const outerWing = sheet([ 0, 0, 0.09, 0, 0, -0.05, 0.42, -0.01, -0.16, 0.28, -0.01, 0.0 ], [ 0, 1, 2, 0, 2, 3 ]);
    const tailGeo = sheet([ 0, 0, 0, -0.09, 0, -0.18, 0, 0, -0.12, 0.09, 0, -0.18 ], [ 0, 2, 1, 0, 3, 2 ]);
    interface Bird { g : THREE.Group; inner : THREE.Group[]; outer : THREE.Group[]; speed : number; y : number; z : number; off : number; }
    const birds : Bird[] = [];
    for (let f = 0; f < 2; f++) for (let i = 0; i < (f ? 4 : 5); i++) {
        const g = new THREE.Group(); g.scale.setScalar(0.85); scene.add(g);
        far(new THREE.SphereGeometry(0.07, 8, 6), birdDark, 0, 0, 0, g).scale.set(0.8, 0.75, 2.2);
        far(new THREE.SphereGeometry(0.05, 8, 6), birdDark, 0, 0.03, 0.17, g);
        far(new THREE.ConeGeometry(0.018, 0.07, 5), flat(0xd9a43a), 0, 0.025, 0.23, g).rotation.x = Math.PI / 2;
        far(tailGeo, birdDark, 0, 0, -0.12, g);
        const inner : THREE.Group[] = [], outer : THREE.Group[] = [];
        [ -1, 1 ].forEach(sd => {
            const side = new THREE.Group(); side.scale.x = sd; side.position.set(sd * 0.04, 0.01, 0.02); g.add(side);
            const sh = new THREE.Group(); side.add(sh); far(innerWing, birdDark, 0, 0, 0, sh);
            const wr = new THREE.Group(); wr.position.set(0.33, 0.01, 0.02); sh.add(wr); far(outerWing, birdDark, 0, 0, 0, wr);
            inner.push(sh); outer.push(wr);
        });
        birds.push({ g, inner, outer, speed : f ? 0.8 : 1.05, y : (f ? 8.6 : 9.6) + (i % 2) * 0.35, z : (f ? -3 : -8) + (i % 3) * 0.8 + (i % 2) * 0.3, off : i * 1.3 + f * 17 });
    }

    // FIGURE PLACES ===================================================================================================
    const spot = (sex : Sex, place : Place, slot : number) => {
        if (place === "agri") {
            const r = Math.floor(slot / 10), c = slot % 10;
            return new THREE.Vector3(FIELD.x[sex] - FIELD.w / 2 + 0.42 + c * (FIELD.w - 0.84) / 9, 0.14, FIELD.z - FIELD.d / 2 + 0.42 + r * FIELD.rows);
        }
        const half = YARD.w / 2, x0 = YARD.x[place] - half + (sex === "m" ? 0 : half), r = Math.floor(slot / 6), c = slot % 6;
        return new THREE.Vector3(x0 + 0.34 + c * (half - 0.68) / 5, 0.05, YARD.z0 + 0.25 + r * 0.52);
    };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
    const drawFigures = (x : number) => {
        // between two surveys each figure walks from its spot in the earlier one to its spot in the later one, starting
        // a little after its neighbours so the crowd moves as people do, not in lockstep
        const lo = Math.floor(x), hi = Math.min(RURAL.length - 1, lo + 1), f = x - lo;
        const A = PLAN[lo + 1], B = PLAN[hi + 1];
        const counts : Record<Kind, number> = { man : 0, manModern : 0, worker : 0, woman : 0 };
        for (const sex of [ "m", "w" ] as Sex[]) for (let k = 0; k < FIGS; k++) {
            const a = A[sex][k], b = B[sex][k];
            const moving = a.place !== b.place || a.slot !== b.slot;
            const delay = ((k * 37) % 25) / 25 * 0.45, t = moving ? smooth(clamp01((f - delay) / 0.55)) : 0;
            const pa = spot(sex, a.place, a.slot), pb = spot(sex, b.place, b.slot), p = pa.clone().lerp(pb, t);
            const walking = moving && t > 0 && t < 1;
            const there = t >= 0.5 ? b.place : a.place, era = t >= 0.5 ? hi : lo;
            if (walking) p.y += Math.abs(Math.sin(t * Math.PI * 7)) * 0.05;
            // standing figures face the reader; walkers face the way they go
            e.set(0, walking ? Math.atan2(pb.x - pa.x, pb.z - pa.z) : Math.PI / 4, walking ? Math.sin(t * Math.PI * 14) * 0.06 : 0);
            q.setFromEuler(e); sc.setScalar(there === "agri" ? S : S * 0.92);
            m4.compose(p, q, sc);
            const kind : Kind = sex === "w" ? "woman" : there === "ind" ? "worker" : modernAt(era) ? "manModern" : "man";
            KINDS[kind].setMatrixAt(counts[kind]++, m4);
        }
        (Object.keys(KINDS) as Kind[]).forEach(k => { KINDS[k].count = counts[k]; KINDS[k].instanceMatrix.needsUpdate = true; });
        const modern = modernAt(Math.round(Math.max(0, x))) && x > -0.5;
        modernBits.forEach(o => { o.visible = modern; }); oldBits.forEach(o => { o.visible = !modern; });
    };
    // the scenery's motion: wind in the wheat and the palms, the vehicles on their rounds, the rotors, the birds
    const animate = (time : number) => {
        wind.value = time;
        crowns.forEach((c, i) => { c.rotation.z = Math.sin(time * 0.8 + i) * 0.05; });
        // the vehicles come down the track towards the reader and go round again
        const lap = (sp : number, off : number) => ((time * sp + off) % 28) - 16;
        cart.position.set(TRACK_X - 0.25, 0, lap(0.5, 0)); cartWheels.forEach(w => { w.rotation.x = time * 1.4; });
        tractor.position.set(TRACK_X + 0.2, 0, lap(1.1, 6)); tractorWheels.forEach(w => { w.rotation.x = time * 3; });
        legSets.forEach(legs => legs.forEach((l, i) => { l.rotation.x = Math.sin(time * 3.6 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.3; }));
        rotor.rotation.z = time * 0.9;
        birds.forEach(b => {
            const u = ((time * b.speed + b.off) % 60) - 30;
            b.g.position.set(u, b.y + Math.sin(time * 0.7 + b.off) * 0.15, b.z - u * 0.35);
            b.g.rotation.set(0, Math.atan2(1, -0.35), 0);
            // beat for a while, then glide with the wings held a little raised
            const beat = smooth(clamp01(Math.sin(time * 0.5 + b.off) * 1.5 + 0.5)), ph = time * 7 + b.off;
            const a = beat * Math.sin(ph) * 0.65 + (1 - beat) * 0.12;
            b.inner.forEach(w => { w.rotation.z = a; });
            b.outer.forEach(w => { w.rotation.z = beat * Math.sin(ph - 0.7) * 0.5 + (1 - beat) * -0.05; });
        });
    };

    // FRAMING =========================================================================================================
    // The scene fits the part of the screen the cards leave free (frame, in pixels); an asymmetric frustum moves it
    // there without moving the camera, and the zoom is about that frame's centre.
    let W = 1, H = 1, base = { hw : 1, hh : 1, sx : 0, sy : 0 };
    const resize = (width : number, height : number, fr : { l : number; r : number; t : number; b : number }) => {
        W = width; H = height; renderer.setSize(width, height, false);
        const fw = (fr.r - fr.l) / width, fh = (fr.b - fr.t) / height;
        // the fields and yards span about 15.5 units across the screen and 9.5 up it (a phone crops tighter still)
        const across = width < 700 ? 13.5 : 16.5;
        const viewW = Math.max(across / fw, (9.5 / fh) * width / height);
        const hw = viewW / 2, hh = hw * height / width;
        const cx = ((fr.l + fr.r) / 2 / width - 0.5) * viewW, cy = (0.5 - (fr.t + fr.b) / 2 / height) * hh * 2;
        base = { hw, hh, sx : -cx + 0.3, sy : -cy + 1.2 };
    };
    const frame = (zoom : number) => {
        const { hw, hh, sx, sy } = base;
        camera.left = (-hw + sx) / zoom; camera.right = (hw + sx) / zoom; camera.top = (hh + sy) / zoom; camera.bottom = (-hh + sy) / zoom;
        camera.updateProjectionMatrix();
    };
    const v = new THREE.Vector3();
    const proj = (x : number, y : number, z : number) : Anchor => {
        v.set(x, y, z).project(camera);
        return { x : (v.x + 1) / 2 * W, y : (1 - v.y) / 2 * H };
    };

    let state : PlotsState = { x : -1, zoom : 1, dim : false }, dimmed = false, raf = 0, running = false, t0 = performance.now();
    const paint = () => {
        if (state.dim !== dimmed) { dimmed = state.dim; figMat.transparent = dimmed; figMat.opacity = dimmed ? 0.35 : 1; figMat.needsUpdate = true; }
        frame(state.zoom);
        drawFigures(Math.max(-1, Math.min(RURAL.length - 1, state.x)));
        renderer.render(scene, camera);
    };
    const loop = () => { animate((performance.now() - t0) / 1000); paint(); raf = requestAnimationFrame(loop); };
    animate(opts.reduced ? 12 : 0);
    return {
        render : st => { state = st; if (!running) paint(); },
        run : on => {
            if (opts.reduced || on === running) return;
            running = on; cancelAnimationFrame(raf);
            if (on) raf = requestAnimationFrame(loop);
        },
        resize,
        anchors : () => ({
            ind   : proj(YARD.x.ind, 3.6, BACK),
            serv  : proj(YARD.x.serv, 2.9, BACK),
            // each field's label hangs just below its front bank: the women's under the middle of it, the men's nearer
            // the front corner, as the left of the men's field runs off the screen; the key goes under the women's corner
            men   : proj(FIELD.x.m + FIELD.w * 0.4, 0.1, FIELD.z + FIELD.d / 2 + 0.45),
            women : proj(FIELD.x.w, 0.1, FIELD.z + FIELD.d / 2 + 0.45),
            // on a phone the cards cover the fronts of the fields, so the labels sit off the fields' left corners
            menSide   : proj(FIELD.x.m - FIELD.w / 2 - 0.3, 0.2, FIELD.z + FIELD.d / 2 + 0.3),
            womenSide : proj(FIELD.x.w - FIELD.w / 2 - 0.3, 0.2, FIELD.z + FIELD.d / 2 + 0.3),
            badge : proj(FIELD.x.w + FIELD.w / 2 + 0.4, 0, FIELD.z + FIELD.d / 2 + 0.4),
        }),
        dispose : () => {
            cancelAnimationFrame(raf);
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            renderer.dispose();
        },
    };
};
