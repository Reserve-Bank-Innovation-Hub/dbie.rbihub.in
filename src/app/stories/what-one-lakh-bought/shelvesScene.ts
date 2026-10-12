// The shelves in 3D: five rows of things on the ground, seen isometrically from the corner above that the farm in
// the-women-who-stayed is seen from. Each row is one thing's shelf and holds what the sum bought in units of it:
// ingots of gold, bars of silver, bricks for the mason's fortnights, bundles of dollar notes, sacks of wheat. The
// first year's full line stays on every tile as a ghost; the year's own units stand in front of it, solid, and the
// line grows or shrinks as the year moves. The scene carries no number: the tags the stage lays on the ground
// beside each tile do, from the same data the table shows.
//
// createShelvesScene builds the rows once; set(have) gives each tile the number of units it holds (a fraction for
// the part unit at the end); render() eases the lines towards that and draws a frame. The pattern follows
// the-women-who-stayed/farmScene.ts: plain three.js, an orthographic isometric camera, flat-shaded materials.

// LIB =================================================================================================================
import * as THREE from "three";

export type ShelfKey = "gold" | "silver" | "mason" | "usd" | "wheat";
export interface TagAnchor { x : number; y : number; }
// Where a tile's tags go, and the ground's basis on the screen: a step along the tile's length and a step across
// the plot, in pixels, so a tag can be laid on the ground in the tile's own direction
export interface Tags { left : TagAnchor; right : TagAnchor; along : TagAnchor; across : TagAnchor; }
export interface ShelvesScene {
    set     : (have : number[]) => void;
    render  : (time : number) => void;
    settled : () => boolean;
    resize  : (width : number, height : number) => void;
    anchors : () => Tags[];
    dispose : () => void;
}

// THE PLOT ============================================================================================================
// the tiles run along x and stack along z, the first at the back; the units are scaled up from life so they read
const L = 26, LANE = 3.4, SCALE = 1.45, TILE_D = LANE - 0.5;
const PAD = { narrow : { l : 8, r : 8, t : 8, b : 8 }, wide : { l : 16, r : 16, t : 10, b : 10 } };   // pixels
const NAME_ROOM = 5.2, COUNT_ROOM = 4;                                      // ground the tags take beyond a tile's two ends, in world units

// A unit's shape per thing, as one geometry with a colour a face: the pitch along the tile and between its rows.
interface UnitKind { geo : THREE.BufferGeometry; pitch : number; rowGap : number; metal : number; rough : number; }

// Non-indexed parts, each painted one colour, joined into one geometry with vertex colours.
const merged = (parts : [ THREE.BufferGeometry, [ number, number, number ] ][]) => {
    const flat = parts.map(([ g, c ]) => [ g.toNonIndexed(), c ] as const);
    const count = flat.reduce((n, [ g ]) => n + g.attributes.position.count, 0);
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    let o = 0;
    for (const [ g, c ] of flat) {
        pos.set(g.attributes.position.array as Float32Array, o * 3);
        for (let i = 0; i < g.attributes.position.count; i++) col.set(c, (o + i) * 3);
        o += g.attributes.position.count;
        g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    geo.scale(SCALE, SCALE, SCALE);
    return geo;
};
const lifted = (g : THREE.BufferGeometry, y : number) => { g.translate(0, y, 0); return g; };

const KINDS : Record<ShelfKey, () => UnitKind> = {
    // an ingot: a square frustum, the brand turmeric
    gold   : () => ({ geo : merged([ [ lifted(new THREE.CylinderGeometry(0.16, 0.23, 0.22, 4).rotateY(Math.PI / 4), 0.11), [ 0.93, 0.68, 0.22 ] ] ]), pitch : 0.58 * SCALE, rowGap : 0.52 * SCALE, metal : 0.45, rough : 0.4 }),
    // a bar, a lighter stripe stamped on its top
    silver : () => ({ geo : merged([ [ lifted(new THREE.BoxGeometry(0.62, 0.22, 0.34), 0.11), [ 0.72, 0.74, 0.78 ] ], [ lifted(new THREE.BoxGeometry(0.3, 0.03, 0.14), 0.225), [ 0.88, 0.9, 0.93 ] ] ]), pitch : 0.78 * SCALE, rowGap : 0.5 * SCALE, metal : 0.5, rough : 0.35 }),
    // a brick, the brand terracotta
    mason  : () => ({ geo : merged([ [ lifted(new THREE.BoxGeometry(0.46, 0.2, 0.22), 0.1), [ 0.73, 0.39, 0.31 ] ] ]), pitch : 0.56 * SCALE, rowGap : 0.4 * SCALE, metal : 0, rough : 0.9 }),
    // a bundle of notes, the brand neem, an ivory band round its middle
    usd    : () => ({ geo : merged([ [ lifted(new THREE.BoxGeometry(0.5, 0.18, 0.3), 0.09), [ 0.47, 0.6, 0.27 ] ], [ lifted(new THREE.BoxGeometry(0.14, 0.2, 0.32), 0.1), [ 0.95, 0.94, 0.9 ] ] ]), pitch : 0.62 * SCALE, rowGap : 0.5 * SCALE, metal : 0, rough : 0.8 }),
    // a sack, sand-coloured jute, tied at the neck
    wheat  : () => ({ geo : merged([ [ lifted(new THREE.CylinderGeometry(0.22, 0.27, 0.44, 8), 0.22), [ 0.86, 0.78, 0.6 ] ], [ lifted(new THREE.SphereGeometry(0.11, 7, 5), 0.5), [ 0.66, 0.52, 0.35 ] ] ]), pitch : 0.64 * SCALE, rowGap : 0.62 * SCALE, metal : 0, rough : 0.95 }),
};

export const createShelvesScene = (canvas : HTMLCanvasElement, keys : ShelfKey[], max : number[], opts : { narrow : boolean; reduced : boolean }) : ShelvesScene => {
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
    const EYE = new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(60);     // the isometric corner, as the farm is seen
    const FOCUS = new THREE.Vector3(0, 0, 0);

    // LIGHT ===========================================================================================================
    scene.add(new THREE.HemisphereLight(0xfff6e6, 0xb8a284, 1.15));
    const sun = new THREE.DirectionalLight(0xffeccc, 2.0);
    sun.position.set(-10, 20, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(opts.narrow ? 1024 : 2048, opts.narrow ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left : -16, right : 16, top : 16, bottom : -16, near : 1, far : 70 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // THE GROUND ======================================================================================================
    // the chapter's own ground shows through; the floor exists only to take the units' shadows
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity : 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001; floor.receiveShadow = true; scene.add(floor);
    const zOf = (i : number) => ((keys.length - 1) / 2 - i) * LANE;           // a row's place across the plot: the first at the front
    const TOP = 0;

    // THE PILES =======================================================================================================
    // one instanced mesh for the year's units and one, translucent, for the first year's ghost on every tile
    interface Pile { kind : UnitKind; solid : THREE.InstancedMesh; ghost : THREE.InstancedMesh; max : number; z : number; perRow : number; }
    const dummy = new THREE.Object3D();
    const piles : Pile[] = keys.map((k, i) => {
        const kind = KINDS[k]();
        const mat = new THREE.MeshStandardMaterial({ vertexColors : true, flatShading : true, metalness : kind.metal, roughness : kind.rough });
        const ghostMat = new THREE.MeshStandardMaterial({ vertexColors : true, flatShading : true, metalness : 0, roughness : 1, transparent : true, opacity : 0.18, depthWrite : false });
        const n = Math.max(1, max[i]);
        const solid = new THREE.InstancedMesh(kind.geo, mat, n); solid.castShadow = true; solid.receiveShadow = true; solid.count = 0; scene.add(solid);
        const ghost = new THREE.InstancedMesh(kind.geo, ghostMat, n); ghost.count = 0; scene.add(ghost);
        return { kind, solid, ghost, max : max[i], z : zOf(i), perRow : Math.max(1, Math.floor((L - 0.8) / kind.pitch)) };
    });
    // where the j-th unit of a tile stands: along the tile from its left end, a new row behind when a row is full
    const place = (p : Pile, j : number, scale : number) => {
        const row = Math.floor(j / p.perRow), col = j % p.perRow;
        dummy.position.set(-L / 2 + 0.4 + (col + 0.5) * p.kind.pitch, TOP, p.z + TILE_D / 2 - 0.55 - row * p.kind.rowGap);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        return dummy.matrix;
    };
    const target = piles.map(() => 0), shown = piles.map(() => -1);
    const lay = (p : Pile, have : number) => {
        const whole = Math.floor(have), part = have - whole;
        let n = 0;
        for (let j = 0; j < whole && j < p.max; j++) p.solid.setMatrixAt(n++, place(p, j, 1));
        if (part > 0.02 && whole < p.max) p.solid.setMatrixAt(n++, place(p, whole, 0.35 + 0.65 * part));
        p.solid.count = n; p.solid.instanceMatrix.needsUpdate = true;
        let g = 0;
        for (let j = Math.ceil(have - 0.02); j < p.max; j++) p.ghost.setMatrixAt(g++, place(p, j, 1));
        p.ghost.count = g; p.ghost.instanceMatrix.needsUpdate = true;
    };

    // FRAMING =========================================================================================================
    // the plot, with the ground its tags take, is fitted to the canvas: its corners are projected and the frustum
    // set so they fill the room left inside the margins, at one scale on both axes
    let W = 1, H = 1;
    const room = opts.narrow ? { l : 0.8, r : 0.8 } : { l : NAME_ROOM, r : COUNT_ROOM };
    const zBack = zOf(keys.length - 1) - TILE_D / 2 - 0.4, zFront = zOf(0) + TILE_D / 2 + 0.4;
    const corners = [ -L / 2 - room.l, L / 2 + room.r ].flatMap(x => [ -0.1, 0.9 ].flatMap(y => [ zBack, zFront ].map(z => new THREE.Vector3(x, y, z))));
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
        // the view's centre moves against the heavier margin, so the plot sits centred inside the margins
        const cx = (x0 + x1) / 2 - (pad.l - pad.r) / 2 * s, cy = (y0 + y1) / 2 + (pad.t - pad.b) / 2 * s;
        camera.left = cx - width * s / 2; camera.right = cx + width * s / 2; camera.top = cy + height * s / 2; camera.bottom = cy - height * s / 2;
        camera.updateProjectionMatrix();
    };
    const px = (x : number, y : number, z : number) : TagAnchor => { v.set(x, y, z).project(camera); return { x : (v.x + 1) / 2 * W, y : (1 - v.y) / 2 * H }; };
    // a tile's tags lie on the ground beyond its two ends, in line with its front row; the ground's basis comes with
    // them, so the stage can set the tags in the tile's own direction
    const tagsOf = (z : number) : Tags => {
        const zr = z + TILE_D / 2 - 0.55, o = px(0, 0, 0), ax = px(1, 0, 0), az = px(0, 0, 1);
        return { left : px(-L / 2 - 0.7, 0, zr), right : px(L / 2 + 0.7, 0, zr), along : { x : ax.x - o.x, y : ax.y - o.y }, across : { x : az.x - o.x, y : az.y - o.y } };
    };

    return {
        set : have => { have.forEach((h, i) => { target[i] = Math.max(0, Math.min(piles[i].max, h)); if (opts.reduced) shown[i] = -1; }); },
        render : () => {
            piles.forEach((p, i) => {
                const next = opts.reduced || Math.abs(target[i] - shown[i]) < 0.004 ? target[i] : shown[i] < 0 ? target[i] : shown[i] + (target[i] - shown[i]) * 0.16;
                if (next !== shown[i]) { shown[i] = next; lay(p, next); }
            });
            renderer.render(scene, camera);
        },
        settled : () => piles.every((_, i) => shown[i] === target[i]),
        resize,
        anchors : () => piles.map(p => tagsOf(p.z)),
        dispose : () => {
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            renderer.dispose();
        },
    };
};
