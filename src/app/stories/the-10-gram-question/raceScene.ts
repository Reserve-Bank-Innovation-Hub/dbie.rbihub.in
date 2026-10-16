// The race in 3D: two piles on the ground, seen isometrically from the corner above that the shelves in
// what-one-lakh-bought are seen from, each pile growing upward with the years. On the left, gold coins, one for every
// time the Mumbai price has multiplied since the start year, stacked as coins are, each a little off the last. On
// the right, crates of everyday things, one for every time prices in general have multiplied by the industrial
// workers' index, stacked one on the next. The last year's full pile stands behind each as a ghost, so the reader
// sees where the run is heading. The scene carries no number: the stage lays the figures beside the piles from the
// same data the table shows.
//
// createRaceScene builds the piles once for the most they will hold; set(have) gives each its count (a fraction for
// the part unit on top); render() eases the piles towards that and draws a frame. Plain three.js, an orthographic
// isometric camera, flat-shaded materials, as in what-one-lakh-bought/shelvesScene.ts.

// LIB =================================================================================================================
import * as THREE from "three";

export interface Anchor { x : number; y : number; }
export interface PileAnchors { base : Anchor; top : Anchor; }
export interface RaceScene {
    set     : (gold : number, prices : number) => void;
    render  : () => void;
    settled : () => boolean;
    resize  : (width : number, height : number) => void;
    anchors : () => PileAnchors[];
    dispose : () => void;
}

// THE PILES ===========================================================================================================
const COIN = { r : 0.62, h : 0.17 };                                          // a coin, lying flat
const CRATE = { w : 1.0, h : 0.6, d : 0.8 };                                  // a wooden crate
const X = 1.9;                                                               // the piles stand this far either side of the centre
const PAD = { narrow : { l : 8, r : 8, t : 8, b : 8 }, wide : { l : 4, r : 4, t : 12, b : 2 } };   // pixels; room above for the figures

// Non-indexed parts, each painted one colour (or carrying its own), joined into one geometry with vertex colours.
const merged = (parts : [ THREE.BufferGeometry, [ number, number, number ] | null ][]) => {
    const flat = parts.map(([ g, c ]) => [ g.index ? g.toNonIndexed() : g, c ] as const);
    const count = flat.reduce((n, [ g ]) => n + g.attributes.position.count, 0);
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    let o = 0;
    for (const [ g, c ] of flat) {
        pos.set(g.attributes.position.array as Float32Array, o * 3);
        if (c) for (let i = 0; i < g.attributes.position.count; i++) col.set(c, (o + i) * 3);
        else col.set(g.attributes.color.array as Float32Array, o * 3);
        o += g.attributes.position.count;
        g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    return geo;
};
const lifted = (g : THREE.BufferGeometry, y : number) => { g.translate(0, y, 0); return g; };

// a coin, as the design reference draws it: a bright yellow face, a thin darker groove inside the rim, and a reeded
// edge in a deeper amber, the reeds taken in turn a shade apart
const FACE : [ number, number, number ] = [ 0.98, 0.74, 0.2 ], GROOVE : [ number, number, number ] = [ 0.86, 0.56, 0.12 ];
const reeded = () => {
    const g = new THREE.CylinderGeometry(COIN.r, COIN.r, COIN.h, 48, 1, true).toNonIndexed();
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set((Math.floor(i / 6) % 2 ? [ 0.9, 0.6, 0.14 ] : [ 0.8, 0.5, 0.1 ]), i * 3);   // six vertices a reed
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
};
const coinGeo = () => merged([
    [ lifted(reeded(), COIN.h / 2), null ],
    [ lifted(new THREE.CircleGeometry(COIN.r, 48).rotateX(-Math.PI / 2), COIN.h), FACE ],
    [ lifted(new THREE.CircleGeometry(COIN.r, 48).rotateX(Math.PI / 2), 0), GROOVE ],
    [ lifted(new THREE.RingGeometry(COIN.r * 0.8, COIN.r * 0.85, 48).rotateX(-Math.PI / 2), COIN.h + 0.003), GROOVE ],
]);
// a crate: pale wood, two darker bands where the slats meet, a post at each corner
const PALE : [ number, number, number ] = [ 0.85, 0.72, 0.52 ], BAND : [ number, number, number ] = [ 0.7, 0.56, 0.38 ], POST : [ number, number, number ] = [ 0.58, 0.44, 0.28 ];
const crateGeo = () => merged([
    [ lifted(new THREE.BoxGeometry(CRATE.w, CRATE.h, CRATE.d), CRATE.h / 2), PALE ],
    ...[ 0.2, 0.4 ].map(y => [ lifted(new THREE.BoxGeometry(CRATE.w + 0.02, 0.035, CRATE.d + 0.02), y), BAND ] as [ THREE.BufferGeometry, [ number, number, number ] ]),
    ...[ -1, 1 ].flatMap(sx => [ -1, 1 ].map(sz => [ lifted(new THREE.BoxGeometry(0.08, CRATE.h + 0.02, 0.08).translate(sx * (CRATE.w / 2 - 0.02), 0, sz * (CRATE.d / 2 - 0.02)), CRATE.h / 2), POST ] as [ THREE.BufferGeometry, [ number, number, number ] ])),
]);

export const createRaceScene = (canvas : HTMLCanvasElement, max : { gold : number; prices : number }, opts : { narrow : boolean; reduced : boolean }) : RaceScene => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true, alpha : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.narrow ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);                                      // the chapter's own ground shows through

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    const EYE = new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(60);     // the isometric corner the shelves are seen from
    const FOCUS = new THREE.Vector3(0, 0, 0);

    // LIGHT ===========================================================================================================
    scene.add(new THREE.HemisphereLight(0xfff6e6, 0xb8a284, 1.15));
    const sun = new THREE.DirectionalLight(0xffeccc, 2.0);
    sun.position.set(-10, 20, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(opts.narrow ? 1024 : 2048, opts.narrow ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left : -12, right : 12, top : 20, bottom : -12, near : 1, far : 70 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // THE GROUND ======================================================================================================
    // the chapter's own ground shows through; the floor exists only to take the piles' shadows
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity : 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001; floor.receiveShadow = true; scene.add(floor);

    // THE PILES =======================================================================================================
    // one instanced mesh for the year's units and one, translucent, for the last year's full pile as a ghost
    interface Pile { x : number; max : number; solid : THREE.InstancedMesh; ghost : THREE.InstancedMesh; place : (j : number, scale : number) => THREE.Matrix4; height : (have : number) => number; }
    const dummy = new THREE.Object3D();
    const build = (geo : THREE.BufferGeometry, x : number, max : number, metal : number, rough : number, place : Pile["place"], height : Pile["height"], glow = 0) : Pile => {
        // a glow lifts the coins' gold above what the lights alone give it, so they read as gold and not as brass
        const mat = new THREE.MeshStandardMaterial({ vertexColors : true, flatShading : true, metalness : metal, roughness : rough, emissive : new THREE.Color(0xe0a52a), emissiveIntensity : glow });
        const ghostMat = new THREE.MeshStandardMaterial({ vertexColors : true, flatShading : true, metalness : 0, roughness : 1, transparent : true, opacity : 0.16, depthWrite : false });
        const n = Math.max(1, Math.ceil(max));
        const solid = new THREE.InstancedMesh(geo, mat, n); solid.castShadow = true; solid.receiveShadow = true; solid.count = 0; scene.add(solid);
        const ghost = new THREE.InstancedMesh(geo, ghostMat, n); ghost.count = 0; scene.add(ghost);
        return { x, max, solid, ghost, place, height };
    };
    // the j-th coin: on the one below, each a little off and turned, as a stack of coins sits
    const placeCoin = (j : number, scale : number) => {
        dummy.position.set(-X + Math.sin(j * 1.7) * 0.05, j * COIN.h, Math.cos(j * 2.3) * 0.05);
        dummy.rotation.set(0, j * 0.7, 0);
        dummy.scale.set(1, scale, 1);
        dummy.updateMatrix();
        return dummy.matrix;
    };
    // the j-th crate: on the one below, each a touch off the last so the stack reads as stacked, not drawn
    const placeCrate = (j : number, scale : number) => {
        dummy.position.set(X + Math.sin(j * 2.1) * 0.04, j * CRATE.h, Math.cos(j * 1.3) * 0.04);
        dummy.rotation.set(0, Math.sin(j * 1.9) * 0.06, 0);
        dummy.scale.set(1, scale, 1);
        dummy.updateMatrix();
        return dummy.matrix;
    };
    const piles = [
        build(coinGeo(), -X, max.gold, 0, 0.6, placeCoin, have => Math.ceil(have - 0.02) * COIN.h, 0.38),
        build(crateGeo(), X, max.prices, 0, 0.9, placeCrate, have => Math.ceil(have - 0.02) * CRATE.h + 0.1),
    ];
    const target = [ 0, 0 ], shown = [ -1, -1 ];
    const lay = (p : Pile, have : number) => {
        const whole = Math.floor(have), part = have - whole;
        let n = 0;
        for (let j = 0; j < whole && j < p.max; j++) p.solid.setMatrixAt(n++, p.place(j, 1));
        if (part > 0.02 && whole < p.max) p.solid.setMatrixAt(n++, p.place(whole, 0.3 + 0.7 * part));
        p.solid.count = n; p.solid.instanceMatrix.needsUpdate = true;
        let g = 0;
        for (let j = Math.ceil(have - 0.02); j < Math.ceil(p.max); j++) p.ghost.setMatrixAt(g++, p.place(j, 1));
        p.ghost.count = g; p.ghost.instanceMatrix.needsUpdate = true;
    };

    // FRAMING =========================================================================================================
    // the two piles at their tallest, with the ground around them, are fitted to the canvas: their corners are
    // projected and the frustum set so they fill the room inside the margins, at one scale on both axes
    let W = 1, H = 1;
    const tallest = Math.max(piles[0].height(piles[0].max), piles[1].height(piles[1].max)) + 0.6;
    const corners = [ -X - 1.4, X + 1.4 ].flatMap(x => [ -0.1, tallest ].flatMap(y => [ -1.4, 1.4 ].map(z => new THREE.Vector3(x, y, z))));
    const v = new THREE.Vector3();
    const resize = (width : number, height : number) => {
        W = width; H = height;
        renderer.setSize(width, height, false);
        camera.position.copy(EYE).add(FOCUS); camera.lookAt(FOCUS);
        camera.updateMatrixWorld();
        const pad = opts.narrow ? PAD.narrow : PAD.wide;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const c of corners) { v.copy(c).applyMatrix4(camera.matrixWorldInverse); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
        const s = Math.max((x1 - x0) / Math.max(1, width - pad.l - pad.r), (y1 - y0) / Math.max(1, height - pad.t - pad.b));   // world units a pixel
        const cx = (x0 + x1) / 2 - (pad.l - pad.r) / 2 * s, cy = (y0 + y1) / 2 + (pad.t - pad.b) / 2 * s;
        camera.left = cx - width * s / 2; camera.right = cx + width * s / 2; camera.top = cy + height * s / 2; camera.bottom = cy - height * s / 2;
        camera.updateProjectionMatrix();
    };
    const px = (x : number, y : number, z : number) : Anchor => { v.set(x, y, z).project(camera); return { x : (v.x + 1) / 2 * W, y : (1 - v.y) / 2 * H }; };

    return {
        set : (gold, prices) => { [ gold, prices ].forEach((h, i) => { target[i] = Math.max(0, Math.min(piles[i].max, h)); if (opts.reduced) shown[i] = -1; }); },
        render : () => {
            piles.forEach((p, i) => {
                const next = opts.reduced || Math.abs(target[i] - shown[i]) < 0.004 ? target[i] : shown[i] < 0 ? target[i] : shown[i] + (target[i] - shown[i]) * 0.16;
                if (next !== shown[i]) { shown[i] = next; lay(p, next); }
            });
            renderer.render(scene, camera);
        },
        settled : () => piles.every((_, i) => shown[i] === target[i]),
        resize,
        // a pile's figure sits above its ghost's top, its name on the ground in front of it
        // the name sits straight below the pile on screen: a step along (1, 0, 1), towards the camera, keeps the
        // pile's screen x and moves down, past the pile's front corner
        anchors : () => piles.map(p => ({ base : px(p.x + 0.85, 0, 0.85), top : px(p.x, p.height(p.max) + 0.55, 0) })),
        dispose : () => {
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            renderer.dispose();
        },
    };
};
