// The opening's 3D scene: an isometric town running off every edge of the screen, built as the agriculture story builds
// its farm (the-women-who-stayed/farmScene.ts). The bank stands at the centre; the companies' district (a factory with a
// saw-tooth roof, a warehouse, an office block, a container yard) lies to its right and back; the households' street
// (houses, a tea stall, a school gate, a co-operative hall and a self-help group) to its left and front; the government
// office at the back; a row of shops along the front road.
//
// createTownScene builds everything once; render(progress, time) poses the town for a scroll progress from 0 to 1 and
// draws a frame. Progress moves the story: lorries and a company car on the factory road in March 2015; a family
// walking to the bank and the first new house in June 2017; houses rising storey by storey, their windows lit, a queue
// of families and scooters at the bank in June 2026; women at the doors and at the self-help group to close. Every
// change runs backwards when the reader scrolls up. Time moves only the life of the town (washing, smoke, the crane, a
// dog, a cow, birds, a flag, a man with a cycle, an auto-rickshaw), never the story. The scene carries no number
// (docs/story-slate.html, "The 3D layer"): the figures are in the HTML strip under it.

// LIB =================================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// LOCAL ===============================================================================================================
import { BEATS, clamp01, ease, span } from "./townBeats";

export interface TownScene {
    render  : (progress : number, time : number) => void;
    resize  : (width : number, height : number) => void;
    setDusk : (dusk : boolean) => void;
    dispose : () => void;
}

const lerp = (a : number, b : number, t : number) => a + (b - a) * t;
const smooth = (a : number, b : number, x : number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// A repeatable random sequence, so the town is laid out the same way on every visit.
const seeded = (seed : number) => { let q = seed; return () => (q = (q * 16807) % 2147483647) / 2147483647; };

// THE PALETTE =========================================================================================================
// The RBIH Kosh colours the page uses (terracotta, indivara, sandal, ivory, charcoal, neem, warm grey), lifted a little
// so they hold their colour under the renderer's filmic tone mapping, with the greens and earth the farm uses.
const COL = {
    ground : 0xd6c7a1, dust : 0xcfb98f, earth : 0xb08e5c, grass : 0xa9c27a, lawn : 0x97b866,
    asphalt : 0x8e8a83, kerb : 0xd9cfb9, paving : 0xebe2cd, pavingLine : 0xd3c6a8,
    ivory : 0xf6eedc, sandal : 0xe4d6b8, sandalDeep : 0xd2bf98, stone : 0xc9b48c,
    charcoal : 0x2f2f2f, ink : 0x3a3a3c, brass : 0xd2a645,
    terracotta : 0xc0654b, tile : 0xbf5f43, tileDark : 0xa24f38, brick : 0xb05a40,
    indivara : 0x8a55e6, neem : 0x6b8e23,
    concrete : 0xc4c0b7, concreteDark : 0xa9a49a, warmGrey : 0xb9ab95, corrugated : 0xd0c8b8,
    glass : 0x39424d, ochre : 0xe3a33c, white : 0xf4f2ec,
    trunk : 0x7a5634, leafA : 0x4f9444, leafB : 0x3e7f3a, leafC : 0x5fa64c, gulmohar : 0xe2552f,
};

export const createTownScene = (canvas : HTMLCanvasElement, opts : { narrow : boolean; reduced : boolean; dusk : boolean }) : TownScene => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.narrow ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const rand = seeded(7);

    // The isometric camera: orthographic, looking down the diagonal from the front corner of the town, as the farm's.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const ISO = new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(120);

    // LIGHT ===========================================================================================================
    // A sky-and-ground fill and a shadowed sun from the front right, so the two faces the camera sees are lit and the
    // shadows fall back and to the left. The sun follows the camera so the shadows cover what is on screen.
    const hemi = new THREE.HemisphereLight(0xeef3ff, 0xc9b48a, 1.3);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.7);
    sun.castShadow = true;
    const SHADOW = opts.narrow ? 2048 : 3072, REACH = opts.narrow ? 44 : 34;
    sun.shadow.mapSize.set(SHADOW, SHADOW);
    Object.assign(sun.shadow.camera, { left : -REACH, right : REACH, top : REACH, bottom : -REACH, near : 1, far : 220 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);

    // MATERIALS =======================================================================================================
    const flatCache = new Map<number, THREE.MeshStandardMaterial>();
    const softCache = new Map<number, THREE.MeshStandardMaterial>();
    const flat = (color : number) => {
        let m = flatCache.get(color);
        if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness : 0.85, metalness : 0, flatShading : true }); flatCache.set(color, m); }
        return m;
    };
    const soft = (color : number) => {
        let m = softCache.get(color);
        if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness : 0.7, metalness : 0 }); softCache.set(color, m); }
        return m;
    };
    type Paint = number | THREE.Material;
    const paint = (c : Paint) => typeof c === "number" ? flat(c) : c;
    const GLASS = new THREE.MeshStandardMaterial({ color : COL.glass, roughness : 0.25, metalness : 0.3, flatShading : true });
    // a window that has come on: the same pane with a warm glow, swapped in for GLASS
    const GLASS_LIT = new THREE.MeshStandardMaterial({ color : 0xffe2a0, emissive : 0xffb84d, emissiveIntensity : 1.1, roughness : 0.5, flatShading : true });
    const LAMP_OFF = new THREE.MeshStandardMaterial({ color : 0xf3ead2, roughness : 0.4, flatShading : true });
    const LAMP_ON = new THREE.MeshStandardMaterial({ color : 0xfff1c4, emissive : 0xffc65a, emissiveIntensity : 1.6, roughness : 0.4, flatShading : true });
    const LAMP_FLICKER = LAMP_ON.clone();

    // BATCHING ========================================================================================================
    // Most of the town never moves, so its pieces are merged into one mesh per material: the town draws in a few dozen
    // calls however many bricks, columns and leaves it has.
    const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
    const tf = (x : number, y : number, z : number, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) =>
        new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    class Batch {
        parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
        add(geo : THREE.BufferGeometry, mat : THREE.Material, m : THREE.Matrix4) {
            const g = geo.index ? geo.toNonIndexed() : geo.clone();
            for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
            g.clearGroups(); g.applyMatrix4(m);
            const list = this.parts.get(mat); if (list) list.push(g); else this.parts.set(mat, [ g ]);
        }
        build(parent : THREE.Object3D, cast = true) {
            const out : THREE.Mesh[] = [];
            this.parts.forEach((gs, mat) => {
                const geo = mergeGeometries(gs); gs.forEach(g => g.dispose());
                const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = cast; mesh.receiveShadow = true;
                parent.add(mesh); out.push(mesh);
            });
            this.parts.clear();
            return out;
        }
    }

    // Shared unit shapes, scaled into place.
    const prismGeo = (pts : [ number, number ][]) => {
        // a triangle in x-y extruded from z = -0.5 to 0.5
        const [ a, b, c ] = pts, v : number[] = [];
        const tri = (p : number[], q : number[], r : number[]) => v.push(...p, ...q, ...r);
        const F = (p : [ number, number ], z : number) => [ p[0], p[1], z ];
        tri(F(a, 0.5), F(b, 0.5), F(c, 0.5)); tri(F(a, -0.5), F(c, -0.5), F(b, -0.5));
        ([ [ a, b ], [ b, c ], [ c, a ] ] as [ number, number ][][]).forEach(([ p, q ]) => {
            tri(F(p, 0.5), F(p, -0.5), F(q, -0.5)); tri(F(p, 0.5), F(q, -0.5), F(q, 0.5));
        });
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
        return g;
    };
    const G = {
        box    : new THREE.BoxGeometry(1, 1, 1),
        cyl    : new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
        cyl6   : new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
        taper  : new THREE.CylinderGeometry(0.36, 0.5, 1, 12),
        cone   : new THREE.ConeGeometry(0.5, 1, 8),
        cone4  : new THREE.ConeGeometry(0.5, 1, 4),
        ico    : new THREE.IcosahedronGeometry(0.5, 0),
        ball   : new THREE.SphereGeometry(0.5, 10, 8),
        dome   : new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        torus  : new THREE.TorusGeometry(0.5, 0.08, 6, 18),
        gable  : prismGeo([ [ -0.5, 0 ], [ 0.5, 0 ], [ 0, 1 ] ]),
        tooth  : prismGeo([ [ -0.5, 0 ], [ 0.5, 0 ], [ 0.5, 1 ] ]),
        disc   : new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
    };

    // A kit puts shapes into a batch relative to a base transform. Boxes and cylinders are placed by the centre of
    // their foot (y0 is the bottom), which is how buildings are measured.
    interface Kit {
        b : Batch; m : THREE.Matrix4;
        box   : (c : Paint, x : number, y0 : number, z : number, w : number, h : number, d : number, ry ? : number) => void;
        cyl   : (c : Paint, x : number, y0 : number, z : number, r : number, h : number, geo ? : THREE.BufferGeometry) => void;
        cone  : (c : Paint, x : number, y0 : number, z : number, r : number, h : number, geo ? : THREE.BufferGeometry) => void;
        ball  : (c : Paint, x : number, y : number, z : number, r : number, sy ? : number, geo ? : THREE.BufferGeometry) => void;
        gable : (c : Paint, x : number, y0 : number, z : number, w : number, h : number, d : number, ry ? : number) => void;
        raw   : (geo : THREE.BufferGeometry, c : Paint, m : THREE.Matrix4) => void;
        at    : (x : number, z : number, ry ? : number, y ? : number) => Kit;
    }
    const kit = (b : Batch, m : THREE.Matrix4 = new THREE.Matrix4()) : Kit => {
        const put = (geo : THREE.BufferGeometry, c : Paint, local : THREE.Matrix4) => b.add(geo, paint(c), m.clone().multiply(local));
        return {
            b, m,
            box   : (c, x, y0, z, w, h, d, ry = 0) => put(G.box, c, tf(x, y0 + h / 2, z, w, h, d, ry)),
            cyl   : (c, x, y0, z, r, h, geo = G.cyl) => put(geo, c, tf(x, y0 + h / 2, z, r * 2, h, r * 2)),
            cone  : (c, x, y0, z, r, h, geo = G.cone) => put(geo, c, tf(x, y0 + h / 2, z, r * 2, h, r * 2)),
            ball  : (c, x, y, z, r, sy = 1, geo = G.ico) => put(geo, c, tf(x, y, z, r * 2, r * 2 * sy, r * 2)),
            gable : (c, x, y0, z, w, h, d, ry = 0) => put(G.gable, c, tf(x, y0, z, w, h, d, ry)),
            raw   : (geo, c, local) => put(geo, c, local),
            at    : (x, z, ry = 0, y = 0) => kit(b, m.clone().multiply(tf(x, y, z, 1, 1, 1, ry))),
        };
    };
    const STATIC = new Batch(), GROUND_B = new Batch(), LAMPS = new Batch();
    const T = kit(STATIC), GK = kit(GROUND_B), LK = kit(LAMPS);

    // Places kept clear of the filler buildings that cover the rest of the land.
    const reserved : [ number, number, number, number ][] = [];
    const reserve = (x0 : number, z0 : number, x1 : number, z1 : number) => reserved.push([ x0, z0, x1, z1 ]);
    const isFree = (x0 : number, z0 : number, x1 : number, z1 : number) => reserved.every(([ a, b, c, d ]) => x1 <= a || x0 >= c || z1 <= b || z0 >= d);

    // THE LAND AND THE ROADS ==========================================================================================
    // Dusty ground under everything; the front road past the bank (the high road), the factory road from the
    // companies' district down to it, the back road, the households' lane and a connecting lane, and an outer ring
    // of roads in the filler town.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), flat(COL.ground));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const inGap = (v : number, gaps : [ number, number ][]) => gaps.some(([ a, b ]) => v > a && v < b);
    const roadX = (zc : number, w : number, x0 : number, x1 : number, o : { lane ? : boolean; walks ? : boolean; gapsN ? : [ number, number ][]; gapsS ? : [ number, number ][] } = {}) => {
        const cx = (x0 + x1) / 2, L = x1 - x0;
        GK.box(o.lane ? COL.dust : COL.asphalt, cx, 0, zc, L, o.lane ? 0.035 : 0.04, w);
        if (!o.lane) for (let x = x0 + 1; x < x1; x += 2.6) GK.box(COL.white, x, 0.04, zc, 1.1, 0.012, 0.12);
        if (o.walks) GK.box(COL.grass, cx, 0, zc, L, 0.02, w + 3.0);
        if (o.walks) for (let x = x0; x < x1; x += 1) {
            if (!inGap(x + 0.5, o.gapsN ?? [])) GK.box(COL.kerb, x + 0.5, 0, zc - w / 2 - 0.3, 1, 0.12, 0.6);
            if (!inGap(x + 0.5, o.gapsS ?? [])) GK.box(COL.kerb, x + 0.5, 0, zc + w / 2 + 0.3, 1, 0.12, 0.6);
        }
        reserve(x0, zc - w / 2 - (o.walks ? 0.6 : 0.2), x1, zc + w / 2 + (o.walks ? 0.6 : 0.2));
    };
    const roadZ = (xc : number, w : number, z0 : number, z1 : number, o : { lane ? : boolean; walks ? : boolean; gapsW ? : [ number, number ][]; gapsE ? : [ number, number ][] } = {}) => {
        const cz = (z0 + z1) / 2, L = z1 - z0;
        GK.box(o.lane ? COL.dust : COL.asphalt, xc, 0, cz, w, o.lane ? 0.034 : 0.039, L);
        if (!o.lane) for (let z = z0 + 1; z < z1; z += 2.6) GK.box(COL.white, xc, 0.04, z, 0.12, 0.012, 1.1);
        if (o.walks) GK.box(COL.grass, xc, 0, cz, w + 3.0, 0.021, L);
        if (o.walks) for (let z = z0; z < z1; z += 1) {
            if (!inGap(z + 0.5, o.gapsW ?? [])) GK.box(COL.kerb, xc - w / 2 - 0.3, 0, z + 0.5, 0.6, 0.12, 1);
            if (!inGap(z + 0.5, o.gapsE ?? [])) GK.box(COL.kerb, xc + w / 2 + 0.3, 0, z + 0.5, 0.6, 0.12, 1);
        }
        reserve(xc - w / 2 - (o.walks ? 0.6 : 0.2), z0, xc + w / 2 + (o.walks ? 0.6 : 0.2), z1);
    };
    const HIGH_Z = 12.75, FACT_X = 8.5, LANE_Z = 22.75, BACK_Z = -8, CONN_X = -3;
    roadX(HIGH_Z, 3.5, -90, 90, { walks : true, gapsN : [ [ 6.4, 10.6 ], [ -39.6, -36.4 ], [ 33.4, 36.6 ] ], gapsS : [ [ -4.1, -1.9 ], [ -39.6, -36.4 ], [ 33.4, 36.6 ] ] });
    roadZ(FACT_X, 3, -90, 11, { walks : true, gapsW : [ [ -9.2, -6.8 ], [ -41.6, -38.4 ] ], gapsE : [ [ -41.6, -38.4 ] ] });
    roadX(BACK_Z, 2.2, -90, 7);
    roadX(LANE_Z, 2.5, -90, 23, { lane : true });
    roadZ(CONN_X, 2, 15.1, 21.5, { lane : true });
    roadX(-40, 3, -90, 90); roadZ(-38, 3, -90, 90); roadX(37, 3, -90, 90); roadZ(35, 3, -90, 90);
    roadZ(-60, 2.4, -90, 90, { lane : true }); roadX(-62, 2.4, -90, 90, { lane : true }); roadX(58, 2.4, -90, 90, { lane : true }); roadZ(56, 2.4, -90, 90, { lane : true });

    // TREES AND LAMPS =================================================================================================
    // A neem with a rounded crown, a gulmohar in flower, a tall ashoka by the government office, palms, and a banyan
    // over the self-help group. Most are merged into the town; the palms near the bank sway.
    const LEAVES = [ COL.leafA, COL.leafB, COL.leafC ];
    const neem = (k : Kit, x : number, z : number, s = 1) => {
        k.cyl(COL.trunk, x, 0, z, 0.16 * s, 1.6 * s, G.taper);
        const n = 6 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + rand(), r = (0.35 + rand() * 0.35) * s;
            k.ball(LEAVES[i % 3], x + Math.cos(a) * r, (1.95 + rand() * 0.7) * s, z + Math.sin(a) * r, (0.5 + rand() * 0.25) * s);
        }
        k.ball(LEAVES[1], x, 2.7 * s, z, 0.62 * s);
    };
    const gulmohar = (k : Kit, x : number, z : number, s = 1) => {
        k.cyl(COL.trunk, x, 0, z, 0.18 * s, 2.0 * s, G.taper);
        for (let i = 0; i < 4; i++) { const a = i * 1.7; k.ball(i % 2 ? COL.leafC : COL.leafA, x + Math.cos(a) * 0.8 * s, 2.5 * s, z + Math.sin(a) * 0.8 * s, 1.0 * s, 0.55); }
        for (let i = 0; i < 14; i++) { const a = rand() * Math.PI * 2, r = rand() * 1.5 * s; k.ball(i % 3 ? COL.gulmohar : 0xf08a3a, x + Math.cos(a) * r, (2.75 + rand() * 0.35) * s, z + Math.sin(a) * r, 0.22 * s); }
    };
    const ashoka = (k : Kit, x : number, z : number, s = 1) => {
        k.cyl(COL.trunk, x, 0, z, 0.1 * s, 0.8 * s);
        for (let i = 0; i < 4; i++) k.cone(i % 2 ? COL.leafB : 0x356f34, x, (0.6 + i * 0.85) * s, z, (0.62 - i * 0.12) * s, 1.5 * s, G.cone4);
    };
    const frondGeo = (() => {
        const pts : number[] = [], idx : number[] = [], L = 2.6, n = 10;
        for (let i = 0; i <= n; i++) {
            const t = i / n, sx = t * L, sy = 0.32 * t * L - 0.55 * t * t * L, wd = 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 0.05;
            pts.push(sx, sy, -wd, sx, sy + 0.02, 0, sx, sy, wd);
        }
        for (let i = 0; i < n; i++) { const a = i * 3; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        return geo;
    })();
    const palmTrunk = (() => {
        const curve = new THREE.CatmullRomCurve3([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 1.8, 0), new THREE.Vector3(0.55, 3.5, 0), new THREE.Vector3(1.0, 5.0, 0) ]);
        return { geo : new THREE.TubeGeometry(curve, 14, 0.13, 6, false), top : curve.getPoint(1) };
    })();
    const palmMat = new THREE.MeshStandardMaterial({ color : 0x4a9a40, roughness : 0.85, flatShading : true, side : THREE.DoubleSide });
    const palmMat2 = new THREE.MeshStandardMaterial({ color : 0x3a8436, roughness : 0.85, flatShading : true, side : THREE.DoubleSide });
    const crowns : THREE.Group[] = [];
    const palm = (x : number, z : number, s = 1, rot = 0, sway = false) => {
        const base = tf(x, 0, z, s, s, s, rot);
        STATIC.add(palmTrunk.geo, flat(0x8a6c48), base);
        if (sway) {
            const g = new THREE.Group(); g.position.copy(palmTrunk.top).applyMatrix4(base); g.rotation.y = rot; g.scale.setScalar(s); scene.add(g);
            const b = new Batch();
            for (let i = 0; i < 10; i++) b.add(frondGeo, i % 2 ? palmMat : palmMat2, tf(0, 0, 0, 1, 1, 1, (i / 10) * Math.PI * 2, 0, (rand() - 0.5) * 0.3));
            b.build(g); crowns.push(g);
        } else {
            const top = base.clone().multiply(tf(palmTrunk.top.x, palmTrunk.top.y, 0));
            for (let i = 0; i < 9; i++) STATIC.add(frondGeo, i % 2 ? palmMat : palmMat2, top.clone().multiply(tf(0, 0, 0, 1, 1, 1, (i / 9) * Math.PI * 2 + rand(), 0, (rand() - 0.5) * 0.3)));
        }
    };
    // street lamps: a post with an arm and a lantern; the lanterns light at dusk
    const lampPost = (x : number, z : number, ry = 0) => {
        const k = T.at(x, z, ry), l = LK.at(x, z, ry);
        k.cyl(COL.charcoal, 0, 0, 0, 0.12, 0.3); k.cyl(COL.charcoal, 0, 0.3, 0, 0.055, 3.0, G.cyl6);
        k.box(COL.charcoal, 0.3, 3.18, 0, 0.62, 0.06, 0.06);
        k.box(COL.charcoal, 0.58, 3.0, 0, 0.3, 0.06, 0.3);
        l.box(LAMP_OFF, 0.58, 2.82, 0, 0.22, 0.2, 0.22);
    };

    // Painted boards: the bank's name and the shops' trades, lettered on a canvas.
    const textures : THREE.Texture[] = [];
    const board = (text : string, bg : string, fg : string, font : string, w : number, h : number, m : THREE.Matrix4, px = 512) => {
        const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w);
        const g = c.getContext("2d");
        if (g) {
            // drawn upside down and uploaded unflipped: a flipped upload leaves WebGL's flip flag set for three's later
            // uploads of array textures, which WebGL refuses
            g.translate(0, c.height); g.scale(1, -1);
            g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
            g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
            g.fillText(text, c.width / 2, c.height / 2 + c.height * 0.04);
        }
        const tex = new THREE.CanvasTexture(c); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; textures.push(tex);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map : tex, roughness : 0.6 }));
        mesh.applyMatrix4(m); mesh.receiveShadow = true; scene.add(mesh);
        return mesh;
    };

    // THE BANK ========================================================================================================
    // At the centre, the largest building: a stepped plinth, a portico of six columns under an entablature and a
    // pediment, the name on the frieze, big doors standing open, lamps either side of the steps, a balustrade and a
    // low dome; a paved forecourt in front where people queue.
    {
        T.box(COL.sandalDeep, 0, 0, -1.0, 10.8, 0.45, 8.9);
        T.box(COL.sandal, 0, 0.45, -1.05, 10.4, 0.45, 8.6);
        for (let i = 0; i < 3; i++) { const d = 1.6 - 0.5 * i; T.box(i % 2 ? COL.sandal : COL.sandalDeep, 0, 0, 3.25 + d / 2, 7.4, 0.3 * (i + 1), d); }
        [ -1, 1 ].forEach(sd => T.box(COL.sandalDeep, sd * 3.95, 0, 4.05, 0.5, 1.05, 1.6));
        // the body, its base course, rustication, string course and cornice
        T.box(COL.ivory, 0, 0.9, -1.85, 8.8, 5.7, 6.3);
        T.box(COL.sandal, 0, 0.9, -1.85, 8.95, 0.7, 6.45);
        [ 1.95, 2.9 ].forEach(y => T.box(COL.sandal, 0, y, -1.85, 8.88, 0.08, 6.38));
        T.box(COL.sandalDeep, 0, 3.75, -1.85, 9.0, 0.18, 6.5);
        T.box(COL.sandal, 0, 6.45, -1.85, 9.2, 0.3, 6.7);
        // the balustrade round the roof
        const rail = (x0 : number, z0 : number, x1 : number, z1 : number) => {
            const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), n = Math.floor(L / 0.36);
            T.box(COL.sandal, (x0 + x1) / 2, 6.75, (z0 + z1) / 2, L, 0.1, 0.3, ry);
            T.box(COL.ivory, (x0 + x1) / 2, 7.2, (z0 + z1) / 2, L + 0.1, 0.12, 0.34, ry);
            for (let i = 0; i <= n; i++) T.cyl(COL.ivory, x0 + (x1 - x0) * i / n, 6.85, z0 + (z1 - z0) * i / n, 0.07, 0.36, G.cyl6);
        };
        rail(4.45, -4.9, 4.45, 1.1); rail(-4.45, -4.9, -4.45, 1.1); rail(-4.45, -4.95, 4.45, -4.95);
        // the drum and dome
        T.cyl(COL.ivory, 0, 6.6, -2.4, 1.6, 1.0); T.cyl(COL.sandal, 0, 7.55, -2.4, 1.72, 0.16);
        T.raw(G.dome, COL.sandalDeep, tf(0, 7.7, -2.4, 3.2, 2.2, 3.2));
        T.cone(COL.brass, 0, 8.75, -2.4, 0.14, 0.5);
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; T.box(COL.glass, Math.cos(a) * 1.6, 6.85, -2.4 + Math.sin(a) * 1.6, 0.3, 0.5, 0.3, -a); }
        // tall windows down the side, a keystone over each lower one and a small pediment over each upper one
        [ -4.0, -2.35, -0.7 ].forEach(z => {
            T.box(COL.sandal, 4.42, 1.75, z, 0.05, 1.95, 1.05); T.box(GLASS, 4.45, 1.85, z, 0.04, 1.75, 0.85);
            T.box(COL.sandalDeep, 4.47, 3.6, z, 0.08, 0.28, 0.3);
            T.box(COL.sandal, 4.42, 4.3, z, 0.05, 1.6, 1.05); T.box(GLASS, 4.45, 4.4, z, 0.04, 1.4, 0.85);
            T.raw(G.gable, COL.sandalDeep, tf(4.47, 5.95, z, 1.25, 0.32, 0.1, Math.PI / 2));
        });
        // the front wall inside the portico: open doors under a fanlight, windows either side
        T.box(COL.sandalDeep, 0, 0.9, 1.33, 2.6, 3.75, 0.06);
        T.box(0x1d1b1f, 0, 0.9, 1.37, 2.1, 3.3, 0.04);
        T.raw(G.disc, COL.brass, tf(0, 4.2, 1.36, 2.1, 0.05, 2.1, 0, Math.PI / 2));
        T.raw(G.disc, GLASS, tf(0, 4.2, 1.38, 1.7, 0.05, 1.7, 0, Math.PI / 2));
        [ -1, 1 ].forEach(sd => {
            const th = 1.25;
            T.box(0x6a4428, sd * (1.05 + 0.52 * Math.cos(th)), 0.9, 1.37 + 0.52 * Math.sin(th), 1.04, 3.3, 0.08, -sd * th);
            T.box(COL.brass, sd * (1.05 + 0.9 * Math.cos(th)), 2.4, 1.43 + 0.9 * Math.sin(th), 0.06, 0.06, 0.14, -sd * th);
            T.box(COL.sandal, sd * 3.0, 1.65, 1.34, 1.0, 2.0, 0.05); T.box(GLASS, sd * 3.0, 1.75, 1.37, 0.8, 1.8, 0.04);
            T.box(COL.sandal, sd * 3.0, 4.25, 1.34, 1.0, 1.4, 0.05); T.box(GLASS, sd * 3.0, 4.35, 1.37, 0.8, 1.2, 0.04);
            // planters at the doors
            T.cyl(COL.terracotta, sd * 1.75, 0.9, 1.9, 0.24, 0.42); T.ball(COL.leafC, sd * 1.75, 1.5, 1.9, 0.34);
        });
        // six columns
        [ -3.9, -2.34, -0.78, 0.78, 2.34, 3.9 ].forEach(x => {
            T.box(COL.sandal, x, 0.9, 2.75, 0.64, 0.24, 0.64);
            T.cyl(COL.ivory, x, 1.14, 2.75, 0.25, 4.36, G.taper);
            T.cyl(COL.ivory, x, 1.14, 2.75, 0.27, 0.2);
            T.box(COL.sandal, x, 5.5, 2.75, 0.66, 0.2, 0.66);
        });
        // entablature, the board on the frieze, the pediment with an emblem
        T.box(COL.sandal, 0, 5.7, 2.2, 9.4, 0.28, 2.3);
        T.box(COL.ivory, 0, 5.98, 2.2, 9.4, 0.5, 2.25);
        T.box(COL.sandal, 0, 6.48, 2.25, 9.7, 0.18, 2.45);
        T.gable(COL.ivory, 0, 6.66, 2.25, 9.6, 1.9, 2.4);
        T.gable(COL.sandal, 0, 6.86, 3.47, 7.5, 1.3, 0.06);
        [ -1, 1 ].forEach(sd => T.raw(G.box, COL.sandalDeep, tf(sd * 2.4, 7.62, 2.3, 5.3, 0.16, 2.6, 0, 0, -sd * 0.377)));
        T.raw(G.disc, COL.charcoal, tf(0, 7.3, 3.52, 0.82, 0.05, 0.82, 0, Math.PI / 2));
        T.raw(G.disc, COL.brass, tf(0, 7.3, 3.55, 0.6, 0.05, 0.6, 0, Math.PI / 2));
        board("BANK", "#2f2f2f", "#f2e6c4", "600 64px Georgia, 'Times New Roman', serif", 4.4, 0.42, tf(0, 6.23, 3.335), 768);
        // lamps on the step cheeks
        [ -1, 1 ].forEach(sd => {
            T.cyl(COL.charcoal, sd * 3.95, 1.05, 4.3, 0.08, 1.5, G.cyl6);
            LK.box(LAMP_OFF, sd * 3.95, 2.5, 4.3, 0.36, 0.44, 0.36);
            T.cone(COL.charcoal, sd * 3.95, 2.94, 4.3, 0.3, 0.3, G.cone4);
        });
        // the forecourt, paved, with bollards along the road and a lawn either side of the bank
        GK.box(COL.paving, 0.1, 0, 7.6, 12.8, 0.05, 5.6);
        for (let x = -6.2; x <= 6.4; x += 1.4) GK.box(COL.pavingLine, x, 0.05, 7.6, 0.05, 0.006, 5.6);
        for (let z = 5.0; z <= 10.4; z += 1.4) GK.box(COL.pavingLine, 0.1, 0.05, z, 12.8, 0.006, 0.05);
        for (let x = -5.8; x <= 2.6; x += 1.4) T.cyl(COL.charcoal, x, 0, 10.15, 0.09, 0.55, G.cyl6);
        GK.box(COL.lawn, -5.9, 0, -0.9, 1.0, 0.06, 10.0); GK.box(COL.lawn, 5.9, 0, -0.9, 1.0, 0.06, 10.0);
        for (let z = -5.4; z < 3.6; z += 0.9) { T.ball(COL.leafB, 5.95, 0.35, z, 0.36, 0.8); T.ball(COL.leafA, -5.95, 0.35, z, 0.36, 0.8); }
        neem(T, -6.7, 6.2, 1.1);
        reserve(-7.2, -6.0, 6.4, 10.4);
    }

    // THE ROW OF SHOPS ================================================================================================
    // Four shopfronts along the high road, west of the bank, with flats over them: a tailor, a chemist, a grocer and a
    // mobile repair shop, each with an ink awning striped in sandal, a painted board and a shopkeeper at the counter.
    const shopkeepers : { x : number; z : number }[] = [];
    {
        const WALLS = [ 0xeadcbc, 0xe8d2b4, 0xefe2c6, 0xe3cfab ];
        const SIGNS : [ string, string, string ][] = [ [ "TAILORS", "#e1d5bc", "#2f2f2f" ], [ "MEDICAL", "#4f7d2a", "#ffffff" ], [ "KIRANA", "#b0563f", "#fbf3e2" ], [ "MOBILE REPAIR", "#2f2f2f", "#f2b84a" ] ];
        [ -10.4, -14.6, -18.8, -23.0 ].forEach((cx, i) => {
            const k = T.at(cx, 8.2), wall = WALLS[i];
            k.box(wall, 0, 0, -0.5, 4.0, 2.8, 2.6);
            [ -1, 1 ].forEach(sd => k.box(wall, sd * 1.85, 0, 1.3, 0.3, 2.8, 1.0));
            k.box(0x4b3d32, 0, 0, 0.82, 3.4, 2.6, 0.04);
            k.box(COL.sandalDeep, 0, 0, 0.8, 3.7, 0.12, 2.0);
            k.box(COL.sandalDeep, 0, 2.8, 0, 4.2, 0.18, 3.8);
            k.raw(G.cyl, COL.charcoal, tf(0, 2.62, 1.68, 0.22, 3.4, 0.22, 0, 0, Math.PI / 2));
            // shelves of goods at the back of the shop
            [ 0.7, 1.3, 1.9 ].forEach(y => {
                k.box(0x7a5634, 0, y, 0.95, 3.2, 0.05, 0.3);
                for (let j = 0; j < 9; j++) k.box([ 0xc0654b, 0xe3a33c, 0xf4f2ec, 0x6b8e23, 0x8a55e6, 0x4f86b8 ][(i + j * 3 + Math.round(y * 10)) % 6], -1.4 + j * 0.35, y + 0.05, 0.98, 0.26, 0.26 + (j % 3) * 0.06, 0.2);
            });
            k.box(COL.sandal, 0, 0, 1.6, 3.0, 0.95, 0.45);
            // the flat over the shop: windows, a balcony with a railing, a parapet, and a water tank on some
            k.box(WALLS[(i + 2) % 4], 0, 2.98, -0.1, 4.0, 2.3, 3.4);
            [ -0.95, 0.95 ].forEach(x => { k.box(COL.white, x, 3.65, 1.62, 1.0, 1.25, 0.04); k.box(GLASS, x, 3.72, 1.65, 0.8, 1.05, 0.04); });
            [ -0.8, 0.6 ].forEach(z => { k.box(COL.white, 2.01, 3.65, z, 0.04, 1.25, 0.9); k.box(GLASS, 2.04, 3.72, z, 0.04, 1.05, 0.7); });
            k.box(COL.sandalDeep, 0, 5.28, -0.1, 4.1, 0.5, 3.5);
            k.box(wall, 0, 5.28, -0.1, 3.7, 0.52, 3.1);
            if (i % 2 === 0) { k.cyl(0x2a2a2a, 0.8, 5.3, -0.6, 0.45, 0.8); k.cyl(0x2a2a2a, 0.8, 6.1, -0.6, 0.18, 0.08); }
            // the awning, tilted out over the footpath, ink with sandal stripes
            for (let s = 0; s < 8; s++) k.raw(G.box, s % 2 ? COL.sandal : COL.ink, tf(-1.75 + s * 0.5, 2.48, 2.3, 0.5, 0.06, 1.25, 0, 0.38));
            k.raw(G.box, COL.ink, tf(0, 2.25, 2.88, 4.0, 0.22, 0.04, 0, 0));
            board(SIGNS[i][0], SIGNS[i][1], SIGNS[i][2], `700 ${SIGNS[i][0].length > 8 ? 46 : 58}px Arial, Helvetica, sans-serif`, 3.4, 0.5, tf(cx, 3.24, 9.83), 512);
            shopkeepers.push({ x : cx + 0.5, z : 9.35 });
            // each trade's front
            if (i === 0) {   // tailor: a dummy in a kurta, bolts of cloth
                k.cyl(COL.charcoal, -1.45, 0, 2.3, 0.04, 1.1); k.cyl(0x2e8f8f, -1.45, 1.05, 2.3, 0.22, 0.75, G.taper); k.ball(COL.sandal, -1.45, 1.95, 2.3, 0.14, 1, G.ball);
                for (let j = 0; j < 5; j++) k.raw(G.cyl, [ 0xd9457a, 0xe9b628, 0x2e8f5e, 0x4f86b8, 0xc0654b ][j], tf(-0.6 + j * 0.3, 1.08, 1.62, 0.22, 0.6, 0.22, 0, Math.PI / 2));
            } else if (i === 1) {   // chemist: a green cross on the pier and a glass counter
                k.box(0x2e9e6a, 2.05, 2.0, 1.75, 0.08, 0.6, 0.2); k.box(0x2e9e6a, 2.05, 2.2, 1.75, 0.08, 0.2, 0.6);
                k.box(GLASS, 0, 0.95, 1.6, 2.9, 0.06, 0.42);
            } else if (i === 2) {   // grocer: open sacks of grain and crates of vegetables on the footpath
                [ 0xf1ead6, 0xe9c04a, 0xc0392b, 0xb98a4a ].forEach((c, j) => { k.cyl(0xc9b48c, -1.5 + j * 0.55, 0, 2.25, 0.24, 0.55); k.cyl(c, -1.5 + j * 0.55, 0.55, 2.25, 0.21, 0.05); });
                [ 0xd93a2b, 0x9c4f8f, 0x9a6b3c ].forEach((c, j) => { k.box(0x9c7448, 0.7 + j * 0.5, 0, 2.3, 0.46, 0.3, 0.46); for (let n = 0; n < 5; n++) k.ball(c, 0.58 + j * 0.5 + (n % 3) * 0.12, 0.33, 2.2 + Math.floor(n / 3) * 0.16, 0.08, 1, G.ball); });
            } else {   // mobile repair: a glass display and posters on the piers
                k.box(GLASS, 0, 0.95, 1.6, 2.9, 0.06, 0.42);
                for (let j = 0; j < 6; j++) k.box(0x1d1d22, -1.2 + j * 0.45, 1.0, 1.6, 0.16, 0.03, 0.26);
                [ -1, 1 ].forEach(sd => { k.box([ 0x4f86b8, 0xe3a33c ][(sd + 1) / 2], sd * 2.01, 1.0, 1.4, 0.04, 0.9, 0.6); });
            }
        });
        reserve(-25.2, 5.6, -8.2, 10.4);
    }

    // VEHICLES ========================================================================================================
    // Each is drawn into a kit facing +z, so a parked one goes into the town's batch and a moving one into its own group.
    const TYRE = 0x1d1d1f;
    const wheel = (k : Kit, x : number, y : number, z : number, r : number, w : number) => {
        k.raw(G.cyl, TYRE, tf(x, y, z, r * 2, w, r * 2, 0, 0, Math.PI / 2));
        k.raw(G.cyl, 0xb9b6ae, tf(x + Math.sign(x) * w * 0.3, y, z, r * 0.9, w * 0.5, r * 0.9, 0, 0, Math.PI / 2));
    };
    const car = (k : Kit, body : number, round = false) => {
        k.box(body, 0, 0.26, 0, 1.7, 0.55, 3.9);
        k.box(GLASS, 0, 0.8, -0.15, 1.52, 0.42, 2.0);
        k.box(body, 0, 1.2, -0.2, 1.5, 0.1, 1.75);
        if (round) k.raw(G.dome, body, tf(0, 1.25, -0.2, 1.5, 0.35, 1.75));
        k.box(0xf4f2ec, 0.55, 0.55, 1.96, 0.3, 0.12, 0.04); k.box(0xf4f2ec, -0.55, 0.55, 1.96, 0.3, 0.12, 0.04);
        k.box(0xc0392b, 0.6, 0.6, -1.96, 0.3, 0.1, 0.04); k.box(0xc0392b, -0.6, 0.6, -1.96, 0.3, 0.1, 0.04);
        [ -1, 1 ].forEach(sx => [ -1.25, 1.25 ].forEach(z => wheel(k, sx * 0.8, 0.3, z, 0.3, 0.22)));
    };
    const lorry = (k : Kit, cab : number, load : number, band : number) => {
        k.box(0x2a2a2a, 0, 0.5, 0, 1.8, 0.3, 5.2);
        k.box(cab, 0, 0.8, 1.85, 2.0, 1.75, 1.5);
        k.box(GLASS, 0, 1.75, 2.61, 1.7, 0.7, 0.04);
        k.box(band, 0, 2.55, 1.95, 2.02, 0.32, 1.32);
        k.box(0x2a2a2a, 0, 0.45, 2.66, 2.0, 0.3, 0.14);
        k.box(0xf4f2ec, 0.7, 0.95, 2.62, 0.25, 0.18, 0.04); k.box(0xf4f2ec, -0.7, 0.95, 2.62, 0.25, 0.18, 0.04);
        k.box(load, 0, 0.8, -0.85, 2.0, 1.25, 3.4);
        k.box(band, 0, 1.7, -0.85, 2.03, 0.16, 3.43);
        k.gable(0x6f7f5a, 0, 2.05, -0.85, 1.9, 0.75, 3.3);
        [ -1, 1 ].forEach(sx => [ 1.7, -0.9, -1.9 ].forEach(z => wheel(k, sx * 0.93, 0.45, z, 0.45, 0.3)));
    };
    const scooter = (k : Kit, body : number) => {
        [ -0.5, 0.5 ].forEach(z => k.raw(G.cyl, TYRE, tf(0, 0.2, z, 0.4, 0.12, 0.4, 0, 0, Math.PI / 2)));
        k.box(0x2a2a2a, 0, 0.2, 0, 0.3, 0.1, 0.7);
        k.raw(G.ball, body, tf(0, 0.5, -0.32, 0.4, 0.45, 0.7));
        k.box(0x2a2a2a, 0, 0.7, -0.3, 0.26, 0.1, 0.55);
        k.box(body, 0, 0.25, 0.45, 0.36, 0.7, 0.14);
        k.cyl(0x2a2a2a, 0, 0.9, 0.5, 0.03, 0.2, G.cyl6);
        k.box(0x3a3a3c, 0, 1.08, 0.5, 0.62, 0.05, 0.05);
        k.box(0xf4f2ec, 0, 0.95, 0.56, 0.12, 0.1, 0.04);
    };
    const auto = (k : Kit) => {
        const Y = 0xf2c443, B = 0x232325;
        k.raw(G.cyl, TYRE, tf(0, 0.22, 1.05, 0.44, 0.14, 0.44, 0, 0, Math.PI / 2));
        [ -0.62, 0.62 ].forEach(x => k.raw(G.cyl, TYRE, tf(x, 0.22, -0.55, 0.44, 0.16, 0.44, 0, 0, Math.PI / 2)));
        k.box(0x2e8f5e, 0, 0.2, -0.1, 1.3, 0.55, 1.7);
        k.box(Y, 0, 0.3, 0.95, 0.6, 0.85, 0.5);
        k.box(GLASS, 0, 1.15, 0.85, 1.1, 0.5, 0.05);
        k.box(Y, 0, 0.75, -0.25, 1.3, 0.5, 1.4);
        k.box(B, 0, 1.6, -0.1, 1.36, 0.1, 1.95);
        k.raw(G.dome, B, tf(0, 1.65, -0.15, 1.36, 0.35, 1.9));
        [ -0.62, 0.62 ].forEach(x => k.box(B, x, 0.75, 0.75, 0.05, 0.9, 0.05));
        k.box(B, 0, 1.25, -0.95, 1.3, 0.4, 0.05);
    };

    // THE COMPANIES' DISTRICT =========================================================================================
    // To the bank's right and back, up the factory road: an office block with bands of windows, a factory with a
    // saw-tooth roof and two chimneys, a warehouse with a loading bay, and a container yard under a gantry crane.
    // Terracotta roofs and chimneys, grey concrete, charcoal glass.
    {
        // the office block, four storeys of glass bands, set back east of the factory so it never hides the factory road
        const k = T.at(27, 4);
        k.box(COL.concreteDark, 0, 0, 0, 6.3, 0.4, 6.7);
        k.box(COL.concrete, 0, 0.4, 0, 5.9, 9.3, 6.3);
        for (let s = 0; s < 4; s++) {
            const y = 0.4 + s * 2.3;
            k.box(GLASS, 0, y + (s ? 0.55 : 0.1), 0, 6.0, s ? 1.25 : 1.9, 6.4);
            for (let i = 0; i < 9; i++) { k.box(COL.concrete, -2.8 + i * 0.7, y + (s ? 0.55 : 0.1), 3.22, 0.08, s ? 1.25 : 1.9, 0.08); k.box(COL.concrete, 3.02, y + (s ? 0.55 : 0.1), -2.95 + i * 0.74, 0.08, s ? 1.25 : 1.9, 0.08); }
            k.box(COL.concreteDark, 0, y + 2.18, 0, 6.06, 0.12, 6.46);
        }
        k.box(COL.concreteDark, 0, 9.7, 0, 6.1, 0.55, 6.5); k.box(COL.concrete, 0, 9.7, 0, 5.7, 0.57, 6.1);
        k.box(COL.concreteDark, -1.2, 9.7, -1.2, 2.0, 1.4, 1.8);
        [ [ 1.2, 1.4 ], [ 2.1, 1.4 ], [ 1.2, 0.3 ] ].forEach(([ x, z ]) => { k.box(0xd9d6cf, x, 9.75, z, 0.7, 0.5, 0.7); k.cyl(0x7d7a74, x, 10.25, z, 0.22, 0.04); });
        k.cyl(0x2a2a2a, 1.6, 9.75, -1.6, 0.45, 0.85);
        k.box(COL.charcoal, 0, 2.35, 3.6, 2.6, 0.12, 1.0);
        [ -1.1, 1.1 ].forEach(x => k.cyl(COL.concreteDark, x, 0.4, 3.95, 0.06, 1.95, G.cyl6));
        gulmohar(T, 31.2, 1.0, 1.0);
        reserve(23.5, 0.3, 33.4, 10.4);
        // the companies' car park by the high road: low, so the road behind it stays in view
        GK.box(COL.asphalt, 16.5, 0, 6.2, 11, 0.045, 8.2);
        for (let x = 11.6; x < 22; x += 1.9) [ 3.6, 8.8 ].forEach(z => GK.box(COL.white, x, 0.05, z, 0.06, 0.01, 2.2));
        [ [ 12.55, 3.6, 0x2a2c31 ], [ 14.45, 3.6, 0xd9d6cf ], [ 18.25, 3.6, 0x8a8478 ], [ 14.45, 8.8, 0xf1efe8 ], [ 16.35, 8.8, 0x2a2c31 ], [ 20.15, 8.8, 0x3f5f9a ] ].forEach(([ x, z, c ]) => car(T.at(x, z, z < 6 ? 0 : Math.PI), c));
        T.box(0xe9e2d0, 21.4, 0, 6.2, 1.0, 2.0, 1.0); T.box(COL.charcoal, 21.4, 2.0, 6.2, 1.2, 0.1, 1.2); T.box(GLASS, 20.88, 1.1, 6.2, 0.04, 0.5, 0.6);
        reserve(10.6, 1.8, 23.5, 10.4);
    }
    {
        // the factory: brick base, concrete walls, a clerestory, a saw-tooth roof of terracotta with glazed north lights,
        // set back from the factory road behind a low yard so the lorries on the road stay in view
        const W = 11, D = 11;
        const k = T.at(22.5, -9.5);
        k.box(COL.brick, 0, 0, 0, W, 0.9, D);
        k.box(COL.concrete, 0, 0.9, 0, W - 0.1, 3.3, D - 0.1);
        k.box(GLASS, 0, 2.7, 0, W + 0.04, 0.9, D + 0.04);
        for (let i = 0; i <= W; i++) k.box(COL.concrete, -W / 2 + i, 2.7, D / 2 + 0.02, 0.12, 0.9, 0.06);
        for (let i = 0; i <= D; i++) k.box(COL.concrete, W / 2 + 0.02, 2.7, -D / 2 + i, 0.06, 0.9, 0.12);
        k.box(COL.concreteDark, 0, 4.0, 0, W + 0.2, 0.25, D + 0.2);
        for (let i = 0; i < 4; i++) {
            const w = W / 4, cx = -W / 2 + w * (i + 0.5);
            k.raw(G.tooth, COL.terracotta, tf(cx, 4.25, 0, w, 1.8, D));
            k.box(GLASS, cx + w / 2 - 0.04, 4.3, 0, 0.06, 1.6, D - 0.4);
            for (let j = 0; j < 6; j++) k.box(COL.tileDark, cx, 4.25, -D / 2 + 1 + j * 1.8, w * 0.98, 0.02, 0.05);
        }
        // a big shutter and a side door; pipes along the front
        k.box(COL.charcoal, -2.2, 0, D / 2, 3.2, 3.2, 0.1);
        for (let y = 0.3; y < 3.2; y += 0.3) k.box(0x4a4a4c, -2.2, y, D / 2 + 0.06, 3.2, 0.04, 0.02);
        k.box(COL.charcoal, W / 2, 0, 2.0, 0.1, 2.6, 2.2);
        k.raw(G.cyl, 0x8d97a1, tf(0, 3.0, D / 2 + 0.25, 0.22, W - 0.4, 0.22, 0, 0, Math.PI / 2));
        [ -4.5, 1.5, 4.5 ].forEach(x => k.cyl(0x8d97a1, x, 0, D / 2 + 0.25, 0.11, 3.0, G.cyl6));
        // two chimneys with white bands
        [ [ 3.5, -3.5, 13.5 ], [ 1.0, -4.3, 12 ] ].forEach(([ x, z, h ]) => {
            k.box(COL.brick, x, 0, z, 1.6, 1.4, 1.6);
            k.cyl(0xb2553d, x, 1.4, z, 0.72, h, G.taper);
            k.cyl(COL.white, x, h - 1.4, z, 0.58, 0.32); k.cyl(COL.white, x, h - 0.6, z, 0.56, 0.32);
            k.cyl(0x3a2a24, x, h + 1.3, z, 0.55, 0.18);
        });
        // a water tower on legs
        [ [ -0.6, -0.6 ], [ 0.6, -0.6 ], [ -0.6, 0.6 ], [ 0.6, 0.6 ] ].forEach(([ a, b ]) => k.cyl(0x7d7a74, -3.8 + a, 0, -3.8 + b, 0.06, 7.2, G.cyl6));
        k.cyl(COL.concreteDark, -3.8, 7.2, -3.8, 1.1, 1.6); k.cone(0x7d7a74, -3.8, 8.8, -3.8, 1.2, 0.5);
        // the yard between the road and the factory: pallets, drums, a forklift, all low; a fence on the road
        GK.box(0x9d988f, 14.0, 0, -8.5, 5.4, 0.045, 19);
        GK.box(0x9d988f, 22.5, 0, -2.2, 11, 0.045, 3.6);
        for (let i = 0; i < 6; i++) { const z = -15 + i * 1.3, h = 1 + (i % 2); for (let j = 0; j < h; j++) T.box(0xb88a55, 15.6, j * 0.45, z, 1.0, 0.4, 1.0); }
        for (let i = 0; i < 7; i++) T.cyl(i % 3 ? 0x3f6f9a : COL.ochre, 13.2 + (i % 2) * 0.55, 0, -4.0 + Math.floor(i / 2) * 0.55, 0.24, 0.8);
        const fl = T.at(14.2, -12.0, -0.6);
        fl.box(COL.ochre, 0, 0.3, 0, 1.0, 0.7, 1.5); fl.box(COL.charcoal, 0, 1.0, -0.2, 0.9, 0.06, 0.9);
        [ -0.4, 0.4 ].forEach(x => fl.cyl(COL.charcoal, x, 0.9, -0.2, 0.04, 1.2, G.cyl6));
        fl.box(0x5b5e63, 0, 0, 0.95, 0.9, 1.9, 0.08); fl.box(0x5b5e63, 0, 0.1, 1.3, 0.9, 0.05, 0.7);
        for (let z = -18.4; z < 1.2; z += 1.2) T.cyl(0x6f6a62, 11.3, 0, z, 0.06, 1.3, G.cyl6);
        T.box(0x8a857c, 11.3, 1.0, -8.6, 0.05, 0.06, 19.6); T.box(0x8a857c, 11.3, 0.5, -8.6, 0.05, 0.06, 19.6);
        reserve(10.6, -19, 28.6, 1.8);
    }
    {
        // the warehouse, corrugated walls under a terracotta gable, a loading bay on the back road with three shutters
        const k = T.at(1, -16.1);
        k.box(COL.corrugated, 0, 0, 0, 8, 4.4, 9.8);
        for (let z = -4.8; z < 4.9; z += 0.35) k.box(0xbdb4a2, 4.02, 0, z, 0.05, 4.4, 0.08);
        for (let x = -3.9; x < 4.0; x += 0.35) k.box(0xbdb4a2, x, 0, 4.92, 0.08, 4.4, 0.05);
        k.gable(COL.terracotta, 0, 4.4, 0, 8.8, 1.6, 10.4);
        for (let j = 0; j < 6; j++) k.raw(G.box, COL.tileDark, tf(2.2, 4.4 + 0.8, -4.5 + j * 1.8, 4.75, 0.03, 0.06, 0, 0, -0.35));
        k.box(COL.concreteDark, 0, 0, 5.3, 8.2, 1.0, 0.8);
        [ -2.6, 0, 2.6 ].forEach(x => {
            k.box(COL.charcoal, x, 1.0, 4.96, 2.0, 2.8, 0.06);
            for (let y = 1.2; y < 3.8; y += 0.28) k.box(0x4a4a4c, x, y, 5.0, 2.0, 0.04, 0.02);
            k.box(0x1d1d1f, x - 1.05, 0.5, 5.72, 0.16, 0.4, 0.14); k.box(0x1d1d1f, x + 1.05, 0.5, 5.72, 0.16, 0.4, 0.14);
        });
        k.raw(G.box, COL.concreteDark, tf(0, 4.1, 5.6, 8.4, 0.12, 1.6, 0, -0.18));
        for (let i = 0; i < 4; i++) { k.box(0xb88a55, 5.0, i * 0.42, 2.5 - (i % 2) * 0.3, 1.0, 0.38, 1.0); }
        lorry(T.at(1, -7.8), 0xc0654b, 0xc98a4b, COL.ochre);
        neem(T, -4.4, -11.5, 1.0); ashoka(T, 6.0, -20, 1.0); ashoka(T, 6.0, -17.5, 1.0); ashoka(T, 6.0, -15, 1.0);
        reserve(-4, -22, 6.4, -6.9);
    }
    {
        // the container yard: stacks in rows, ribbed sides, doors on the ends
        GK.box(0xa39d92, 22.5, 0, -29, 21, 0.045, 18);
        const CONT = [ COL.terracotta, 0x6b8e23, COL.warmGrey, COL.ochre, 0x3f7f86, COL.charcoal, 0xb05a40 ];
        const crand = seeded(23);
        [ 14.6, 19.3, 24.0, 28.7 ].forEach(x => [ -21.9, -23.7, -29.1, -30.9, -35.5, -37.3 ].forEach(z => {
            // the column nearest the factory road is one container high, so it never hides the road
            const h = x < 15 ? 1 : 1 + Math.floor(crand() * 3);
            for (let j = 0; j < h; j++) {
                const c = CONT[Math.floor(crand() * CONT.length)], y = j * 1.72;
                T.box(c, x, y, z, 4.3, 1.68, 1.68);
                for (let r = 0; r < 13; r++) T.box(c === COL.charcoal ? 0x45454a : 0x000000 | Math.floor(((c >> 16) & 255) * 0.85) << 16 | Math.floor(((c >> 8) & 255) * 0.85) << 8 | Math.floor((c & 255) * 0.85), x - 1.95 + r * 0.33, y + 0.1, z + 0.85, 0.06, 1.48, 0.03);
                T.box(0x2a2a2a, x + 2.16, y + 0.12, z - 0.38, 0.03, 1.44, 0.04); T.box(0x2a2a2a, x + 2.16, y + 0.12, z + 0.38, 0.03, 1.44, 0.04);
            }
        }));
        for (const x of [ 12.9, 32.1 ]) GK.box(0x6f6a62, x, 0.045, -29, 0.25, 0.02, 18);
        reserve(10.6, -38.5, 33.4, -19);
    }
    // the gantry crane over the yard: its trolley runs along the beam and lowers a container while the yard is busy
    const crane = new THREE.Group(); crane.position.set(0, 0, -26.4); scene.add(crane);
    const trolley = new THREE.Group(); crane.add(trolley);
    const hook = new THREE.Group(); trolley.add(hook);
    const cargo = new THREE.Group(); hook.add(cargo);
    {
        const b = new Batch(), k = kit(b);
        [ 12.9, 32.1 ].forEach(x => {
            [ -1.3, 1.3 ].forEach(z => k.box(COL.ochre, x, 0, z, 0.45, 8.4, 0.45));
            k.box(COL.ochre, x, 0, 0, 0.6, 0.5, 3.4); k.box(COL.ochre, x, 4.0, 0, 0.3, 0.3, 2.8);
            [ -1.3, 1.3 ].forEach(z => k.box(0x2a2a2a, x, 0, z, 0.7, 0.35, 0.7));
        });
        [ -1.3, 1.3 ].forEach(z => k.box(COL.ochre, 22.5, 8.4, z, 19.8, 0.7, 0.45));
        k.box(0xe9e2d0, 31.0, 6.6, 1.6, 1.4, 1.3, 1.1); k.box(GLASS, 31.0, 6.9, 2.16, 1.1, 0.6, 0.04);
        b.build(crane);
        const bt = new Batch(), kt = kit(bt);
        kt.box(COL.charcoal, 0, 8.3, 0, 1.5, 0.6, 3.0); kt.box(COL.ochre, 0, 8.9, 0, 1.2, 0.3, 2.2);
        bt.build(trolley);
        const bh = new Batch(), kh = kit(bh);
        kh.box(COL.charcoal, 0, -0.2, 0, 4.4, 0.22, 1.5);
        bh.build(hook);
        const bc = new Batch(), kc = kit(bc);
        kc.box(COL.terracotta, 0, -1.92, 0, 4.3, 1.68, 1.68);
        for (let r = 0; r < 13; r++) kc.box(COL.tileDark, -1.95 + r * 0.33, -1.82, 0.85, 0.06, 1.48, 0.03);
        bc.build(cargo);
    }
    const cables = new THREE.Mesh(G.box, flat(0x2a2a2a)); cables.castShadow = true; trolley.add(cables);
    const cables2 = new THREE.Mesh(G.box, flat(0x2a2a2a)); cables2.castShadow = true; trolley.add(cables2);
    // smoke from the chimneys: puffs rising and spreading, drawn as one instanced mesh
    const PUFFS = 9;
    const smokeMat = new THREE.MeshStandardMaterial({ color : 0xf2efe8, roughness : 1, flatShading : true, transparent : true, opacity : 0.92 });
    const smoke = new THREE.InstancedMesh(G.ico, smokeMat, PUFFS * 2); smoke.castShadow = false; scene.add(smoke);
    const STACKS = [ new THREE.Vector3(26.0, 15.0, -13.0), new THREE.Vector3(23.5, 13.5, -13.8) ];

    // THE GOVERNMENT OFFICE ===========================================================================================
    // At the back: a long secretariat in warm grey with an arcade, rows of windows under sunshades, a central tower
    // with a domed pavilion and the flag, a compound wall with a gate and a sentry box, a lawn with ashoka trees.
    const flag = new THREE.Group();
    {
        const k = T.at(-18, -21);
        k.box(COL.stone, 0, 0, -0.5, 19.6, 0.5, 6.6);
        k.box(COL.warmGrey, 0, 0.5, -0.5, 19, 7.2, 6);
        [ -8.6, 8.6 ].forEach(x => k.box(0xc2b6a2, x, 0.5, 0, 1.8, 7.6, 6.2));
        [ 2.7, 4.85, 7.45 ].forEach(y => k.box(COL.ivory, 0, y, -0.5, 19.2, 0.18, 6.2));
        for (let x = -7.2; x <= 7.2; x += 1.6) {
            if (Math.abs(x) < 2.4) continue;
            k.box(0x5e5548, x, 0.5, 2.52, 1.0, 1.55, 0.04);
            k.raw(G.disc, 0x5e5548, tf(x, 2.05, 2.52, 1.0, 0.04, 1.0, 0, Math.PI / 2));
            [ 3.25, 5.4 ].forEach(y => {
                k.box(COL.ivory, x, y - 0.1, 2.51, 0.9, 1.4, 0.04); k.box(GLASS, x, y, 2.54, 0.7, 1.2, 0.04);
                k.box(COL.ivory, x, y + 1.25, 2.75, 1.1, 0.06, 0.5);
            });
        }
        for (let z = -3.0; z <= 2.0; z += 1.25) [ 3.25, 5.4 ].forEach(y => { k.box(COL.ivory, 10.42, y - 0.1, z, 0.04, 1.4, 0.9); k.box(GLASS, 10.45, y, z, 0.04, 1.2, 0.7); });
        // the tower, its arch, the pavilion on top and the flag
        k.box(0xc2b6a2, 0, 0.5, 0.0, 4.6, 9.8, 7.0);
        k.box(COL.ivory, 0, 10.3, 0.0, 4.8, 0.3, 7.2);
        k.box(0x4c4439, 0, 0.5, 3.52, 1.8, 2.6, 0.04); k.raw(G.disc, 0x4c4439, tf(0, 3.1, 3.52, 1.8, 0.04, 1.8, 0, Math.PI / 2));
        [ 4.2, 6.2, 8.2 ].forEach(y => [ -1.2, 0, 1.2 ].forEach(x => { k.box(COL.ivory, x, y, 3.51, 0.75, 1.2, 0.04); k.box(GLASS, x, y + 0.1, 3.54, 0.55, 1.0, 0.04); }));
        [ [ -1.3, -1.3 ], [ 1.3, -1.3 ], [ -1.3, 1.3 ], [ 1.3, 1.3 ] ].forEach(([ x, z ]) => k.cyl(COL.ivory, x, 10.6, z, 0.14, 1.6, G.cyl6));
        k.box(COL.ivory, 0, 12.2, 0, 3.2, 0.2, 3.2); k.raw(G.dome, COL.sandal, tf(0, 12.4, 0, 2.8, 1.8, 2.8)); k.cone(COL.brass, 0, 13.25, 0, 0.1, 0.5);
        k.cyl(0xd9d6cf, 0, 13.7, 0, 0.04, 3.4, G.cyl6);
        flag.position.set(-18, 16.9, -21); scene.add(flag);
        // the compound wall, gate, sentry box, lawn and trees
        [ [ -29, -19.7 ], [ -16.3, -7 ] ].forEach(([ a, b ]) => {
            T.box(COL.ivory, (a + b) / 2, 0, -12.6, b - a, 1.0, 0.3);
            T.box(COL.warmGrey, (a + b) / 2, 1.0, -12.6, b - a + 0.1, 0.12, 0.4);
        });
        [ -19.8, -16.2 ].forEach(x => { T.box(COL.warmGrey, x, 0, -12.6, 0.6, 2.1, 0.6); T.box(COL.ivory, x, 2.1, -12.6, 0.75, 0.2, 0.75); T.ball(COL.ivory, x, 2.45, -12.6, 0.22, 1, G.ball); });
        for (let i = 0; i < 9; i++) T.box(COL.charcoal, -19.4 + i * 0.4, 0, -12.6 + (i < 4.5 ? 0 : 0.0) + Math.min(i, 8 - i) * 0.12, 0.04, 1.6, 0.04);
        T.box(0xe9e2d0, -15.2, 0, -12.0, 1.0, 2.0, 1.0); T.box(COL.charcoal, -15.2, 2.0, -12.0, 1.2, 0.1, 1.2); T.box(GLASS, -15.2, 1.1, -11.48, 0.6, 0.5, 0.04);
        GK.box(COL.lawn, -18, 0, -15.6, 21.6, 0.06, 5.6);
        GK.box(0xd8cdb5, -18, 0.065, -15.6, 3.2, 0.01, 5.6);
        for (let x = -28; x <= -8; x += 0.6) { if (Math.abs(x + 18) < 2) continue; T.ball(COL.leafB, x, 0.32, -13.3, 0.32, 0.9); }
        [ -27.5, -25, -11, -8.5 ].forEach(x => ashoka(T, x, -14.6, 1.3));
        palm(-22.5, -15.5, 0.9, 0.5); palm(-13.5, -15.8, 0.85, 2.4);
        car(T.at(-24.5, -16.7, Math.PI / 2), 0xf1efe8, true);
        reserve(-30, -27, -6.5, -12.2);
    }

    // THE HOUSEHOLDS' STREET ==========================================================================================
    // To the bank's left and front, along a lane: houses of sandal and pale terracotta with tiled roofs or flat roofs and
    // black water tanks, verandas, indivara doors, washing in the yards. Some plots are bare in March 2015; houses rise
    // on them storey by storey, others gain a storey, and their windows light as they are finished.
    interface Storey { g : THREE.Group; scaff : THREE.Group | null; glass : THREE.Mesh[]; grow : [ number, number ] | null }
    interface House { root : THREE.Group; storeys : Storey[]; roof : THREE.Group; roofGrow : [ number, number ] | null; pile : THREE.Group | null; door : THREE.Group | null; light : number; H : number }
    interface HouseSpec {
        x : number; z : number; ry : number; w : number; d : number; floors : number; grows ? : [ number, number ][];
        roof : "tile" | "flat"; wall : number; trim : number; door : number; veranda ? : boolean; light : number; yard ? : boolean;
    }
    const houses : House[] = [];
    const doors : { x : number; z : number; ry : number; house : House }[] = [];
    const washing : { x : number; z : number; ry : number; n : number }[] = [];
    const BAMBOO = 0xb08a4a;
    const house = (s : HouseSpec) : House => {
        const H = 2.3, PL = 0.25, root = new THREE.Group();
        root.position.set(s.x, 0, s.z); root.rotation.y = s.ry; scene.add(root);
        const base = new THREE.Matrix4().compose(root.position, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.ry, 0)), new THREE.Vector3(1, 1, 1));
        const sk = kit(STATIC, base);
        sk.box(COL.stone, 0, 0, 0, s.w + 0.25, PL, s.d + 0.25);
        const total = s.floors + (s.grows?.length ?? 0);
        const storeys : Storey[] = [];
        let door : THREE.Group | null = null;
        for (let i = 0; i < total; i++) {
            const g = new THREE.Group(); g.position.y = PL + i * H; root.add(g);
            const b = new Batch(), k = kit(b);
            k.box(s.wall, 0, 0, 0, s.w, H, s.d);
            k.box(s.trim, 0, H - 0.16, 0, s.w + 0.14, 0.16, s.d + 0.14);
            const win = (x : number, z : number, side : "front" | "side" | "back") => {
                const y = 0.75;
                if (side === "front" || side === "back") {
                    const zz = side === "front" ? s.d / 2 : -s.d / 2, sg = side === "front" ? 1 : -1;
                    k.box(s.trim, x, y - 0.08, zz + sg * 0.02, 0.92, 1.06, 0.04); k.box(GLASS, x, y, zz + sg * 0.045, 0.7, 0.86, 0.04);
                    k.box(s.trim, x, y + 1.1, zz + sg * 0.25, 1.1, 0.06, 0.5);
                    k.box(0x6a4428, x - 0.42, y, zz + sg * 0.07, 0.04, 0.86, 0.04); k.box(0x6a4428, x + 0.42, y, zz + sg * 0.07, 0.04, 0.86, 0.04);
                } else {
                    k.box(s.trim, s.w / 2 + 0.02, y - 0.08, z, 0.04, 1.06, 0.92); k.box(GLASS, s.w / 2 + 0.045, y, z, 0.04, 0.86, 0.7);
                    k.box(s.trim, s.w / 2 + 0.25, y + 1.1, z, 0.5, 0.06, 1.1);
                }
            };
            if (i === 0) {
                win(-s.w / 2 + 0.95, 0, "front"); win(s.w / 2 - 0.95, 0, "front");
                if (s.veranda) {
                    k.box(COL.stone, 0, 0, s.d / 2 + 0.7, s.w, 0.22, 1.4);
                    k.box(s.trim, 0, 2.05, s.d / 2 + 0.72, s.w + 0.1, 0.12, 1.5);
                    [ -1, 1 ].forEach(sd => k.box(s.trim, sd * (s.w / 2 - 0.15), 0.22, s.d / 2 + 1.3, 0.16, 1.83, 0.16));
                    k.box(s.trim, 0, 0.22, s.d / 2 + 1.38, s.w - 0.2, 0.5, 0.06);
                    k.box(COL.stone, 0, 0, s.d / 2 + 1.55, 1.1, 0.12, 0.4);
                    k.cyl(COL.terracotta, -s.w / 2 + 0.5, 0.22, s.d / 2 + 0.6, 0.18, 0.3); k.ball(COL.leafC, -s.w / 2 + 0.5, 0.68, s.d / 2 + 0.6, 0.24);
                }
                // the door: a dark doorway with an indivara leaf on a hinge, so it can open
                k.box(s.trim, 0, 0, s.d / 2 + 0.015, 1.05, 1.95, 0.03);
                k.box(0x241c16, 0, 0, s.d / 2 + 0.035, 0.84, 1.8, 0.02);
                door = new THREE.Group(); door.position.set(-0.42, 0, s.d / 2 + 0.06); g.add(door);
                const db = new Batch(); kit(db).box(s.door, 0.42, 0, 0, 0.84, 1.8, 0.05); kit(db).box(COL.brass, 0.72, 0.9, 0.04, 0.05, 0.08, 0.04); db.build(door);
                win(0, -s.d / 2 + 1.1, "side"); win(-s.w / 2 + 1.1, 0, "back");
                // a back door for the houses that face away from the camera
                k.box(s.door, s.w / 2 - 1.0, 0, -s.d / 2 - 0.03, 0.75, 1.7, 0.04);
            } else {
                win(-s.w / 4 - 0.1, 0, "front"); win(s.w / 4 + 0.1, 0, "front"); win(0, 0, "side"); win(0, 0, "back");
                k.box(s.trim, 0, 0, s.d / 2 + 0.45, s.w * 0.7, 0.1, 0.9);
                for (let x = -s.w * 0.35; x <= s.w * 0.35 + 0.01; x += s.w * 0.7 / 8) k.box(0x4a4a4c, x, 0.1, s.d / 2 + 0.88, 0.04, 0.75, 0.04);
                k.box(0x4a4a4c, 0, 0.85, s.d / 2 + 0.88, s.w * 0.7, 0.05, 0.05);
            }
            const meshes = b.build(g);
            const grow = i >= s.floors ? s.grows![i - s.floors] : null;
            let scaff : THREE.Group | null = null;
            if (grow) {
                scaff = new THREE.Group(); scaff.position.y = PL + i * H; root.add(scaff);
                const sb = new Batch(), sc = kit(sb);
                [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ], [ 0, 1 ], [ 1, 0 ] ].forEach(([ a, c ]) => sc.cyl(BAMBOO, a * (s.w / 2 + 0.3), 0, c * (s.d / 2 + 0.3), 0.04, H + 0.6, G.cyl6));
                [ 0.9, 1.9 ].forEach(y => { sc.box(BAMBOO, 0, y, s.d / 2 + 0.3, s.w + 0.7, 0.06, 0.06); sc.box(BAMBOO, s.w / 2 + 0.3, y, 0, 0.06, 0.06, s.d + 0.7); });
                sc.box(0xc9a46a, 0, 0.95, s.d / 2 + 0.5, s.w + 0.4, 0.05, 0.4);
                sb.build(scaff);
            }
            storeys.push({ g, scaff, glass : meshes.filter(m => m.material === GLASS), grow });
        }
        // the roof: tiles in courses with a ridge, or a flat roof with a parapet and a black water tank
        const roof = new THREE.Group(); root.add(roof);
        const rb = new Batch(), rk = kit(rb);
        if (s.roof === "tile") {
            const D = s.d + 0.7, W = s.w + 0.6, hR = 1.3, a = Math.atan2(hR, D / 2);
            rk.raw(G.gable, COL.tile, tf(0, 0, 0, D, hR, W, Math.PI / 2));
            for (let f = 0.12; f < 0.95; f += 0.16) [ -1, 1 ].forEach(sd => rk.raw(G.box, COL.tileDark, tf(0, hR * f + 0.03, sd * (D / 2) * (1 - f), W + 0.02, 0.05, 0.1, 0, sd * a)));
            rk.raw(G.cyl, COL.tileDark, tf(0, hR, 0, 0.18, W + 0.1, 0.18, 0, 0, Math.PI / 2));
        } else {
            rk.box(s.trim, 0, 0, s.d / 2 - 0.08, s.w + 0.14, 0.55, 0.16); rk.box(s.trim, 0, 0, -s.d / 2 + 0.08, s.w + 0.14, 0.55, 0.16);
            rk.box(s.trim, s.w / 2 - 0.08, 0, 0, 0.16, 0.55, s.d); rk.box(s.trim, -s.w / 2 + 0.08, 0, 0, 0.16, 0.55, s.d);
            rk.cyl(0x2a2a2a, -s.w / 2 + 0.8, 0, -s.d / 2 + 0.8, 0.42, 0.85); rk.cyl(0x2a2a2a, -s.w / 2 + 0.8, 0.85, -s.d / 2 + 0.8, 0.16, 0.1);
            rk.box(s.wall, s.w / 2 - 0.9, 0, -s.d / 2 + 0.8, 1.2, 1.2, 1.2);
        }
        rb.build(roof);
        // a bare plot waits with a pile of bricks and a heap of sand
        let pile : THREE.Group | null = null;
        if (s.floors === 0) {
            pile = new THREE.Group(); pile.position.set(s.w / 2 - 0.2, 0, s.d / 2 + 0.9); root.add(pile);
            const pb = new Batch(), pk = kit(pb);
            for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) pk.box(COL.brick, -0.9 + c * 0.42 + r * 0.21, PL + r * 0.2, 0, 0.4, 0.19, 0.6);
            pk.cone(0xdcc38f, -2.2, 0, 0.1, 0.55, 0.55);
            pb.build(pile);
            sk.box(COL.earth, 0, PL, 0, s.w - 0.2, 0.03, s.d - 0.2);
        }
        // a yard at the back, walled, with a washing line
        if (s.yard) {
            const yk = sk;
            const Y0 = -s.d / 2 - 0.2, Y1 = -s.d / 2 - 2.7;
            yk.box(s.wall, -s.w / 2 + 0.05, 0, (Y0 + Y1) / 2, 0.14, 0.85, Y0 - Y1);
            yk.box(s.wall, 0.3, 0, Y1, s.w - 0.6, 0.85, 0.14);
            yk.box(s.trim, 0.3, 0.85, Y1, s.w - 0.5, 0.06, 0.2);
            [ -1, 1 ].forEach(sd => yk.cyl(0x6a4428, sd * (s.w / 2 - 0.6), 0, -s.d / 2 - 1.4, 0.04, 1.9, G.cyl6));
            yk.box(0xdedad0, 0, 1.85, -s.d / 2 - 1.4, s.w - 1.2, 0.02, 0.02);
            yk.cyl(COL.terracotta, s.w / 2 - 0.6, 0, Y1 + 0.5, 0.25, 0.6); yk.ball(0x3e7f3a, s.w / 2 - 0.6, 0.85, Y1 + 0.5, 0.25);
            const cx = Math.cos(s.ry), sx = Math.sin(s.ry);
            const lx = 0, lz = -s.d / 2 - 1.4;
            washing.push({ x : s.x + lx * cx + lz * sx, z : s.z - lx * sx + lz * cx, ry : s.ry, n : Math.max(3, Math.floor((s.w - 1.4) / 0.55)) });
        }
        const h : House = { root, storeys, roof, roofGrow : s.floors === 0 && s.grows ? [ s.grows[0][1], s.grows[0][1] + 0.05 ] : null, pile, door, light : s.light, H };
        houses.push(h);
        if (s.ry === 0 && door) doors.push({ x : s.x, z : s.z + s.d / 2 + 0.55, ry : 0, house : h });
        return h;
    };
    const SANDAL_WALLS = [ 0xeadab8, 0xe9cdb6, 0xe6dcc0, 0xdcd7bf, 0xefdcb4, 0xe8c9a8 ];
    const TRIMS = [ 0xf6eedc, 0xd2bf98, 0xf3e7cf ];
    const IND = COL.indivara;
    // the far side of the lane: fronts to the lane, verandas, women at the doors at the end
    house({ x : -10.5, z : 17.6, ry : 0, w : 4.4, d : 4.0, floors : 1, grows : [ [ 0.6, 0.68 ] ], roof : "tile", wall : SANDAL_WALLS[0], trim : TRIMS[0], door : IND, veranda : true, light : 0.66 });
    house({ x : -16, z : 17.6, ry : 0, w : 4.4, d : 4.0, floors : 0, grows : [ [ 0.355, 0.43 ], [ 0.63, 0.71 ] ], roof : "flat", wall : SANDAL_WALLS[1], trim : TRIMS[1], door : IND, veranda : true, light : 0.5 });
    house({ x : -21.5, z : 17.6, ry : 0, w : 4.4, d : 4.0, floors : 2, roof : "flat", wall : SANDAL_WALLS[2], trim : TRIMS[0], door : 0x6a4428, veranda : true, light : 0.72 });
    house({ x : -27, z : 17.6, ry : 0, w : 4.4, d : 4.0, floors : 0, grows : [ [ 0.58, 0.66 ] ], roof : "tile", wall : SANDAL_WALLS[3], trim : TRIMS[2], door : IND, veranda : true, light : 0.7 });
    house({ x : -32.5, z : 17.6, ry : 0, w : 4.4, d : 4.0, floors : 1, roof : "tile", wall : SANDAL_WALLS[4], trim : TRIMS[0], door : 0x6a4428, veranda : true, light : 0.78 });
    // the near side: backs and yards to the camera, washing on the lines
    house({ x : -6.9, z : 26.7, ry : Math.PI, w : 4.0, d : 4.0, floors : 1, roof : "flat", wall : SANDAL_WALLS[5], trim : TRIMS[0], door : IND, light : 0.7, yard : true });
    house({ x : -12.1, z : 26.7, ry : Math.PI, w : 4.4, d : 4.0, floors : 0, grows : [ [ 0.56, 0.64 ] ], roof : "tile", wall : SANDAL_WALLS[0], trim : TRIMS[2], door : IND, light : 0.64, yard : true });
    house({ x : -17.6, z : 26.7, ry : Math.PI, w : 4.4, d : 4.0, floors : 1, roof : "tile", wall : SANDAL_WALLS[2], trim : TRIMS[1], door : 0x6a4428, light : 0.74, yard : true });
    house({ x : -23.1, z : 26.7, ry : Math.PI, w : 4.4, d : 4.0, floors : 0, grows : [ [ 0.66, 0.74 ] ], roof : "tile", wall : SANDAL_WALLS[4], trim : TRIMS[0], door : IND, light : 0.8, yard : true });
    house({ x : -28.6, z : 26.7, ry : Math.PI, w : 4.4, d : 4.0, floors : 1, roof : "tile", wall : SANDAL_WALLS[1], trim : TRIMS[0], door : 0x6a4428, light : 0.8, yard : true });
    house({ x : -34.1, z : 26.7, ry : Math.PI, w : 4.4, d : 4.0, floors : 1, roof : "flat", wall : SANDAL_WALLS[3], trim : TRIMS[2], door : 0x6a4428, light : 0.84, yard : true });
    reserve(-36.8, 15.1, -8.2, 21.5); reserve(-36.8, 24.0, -4.6, 31.2);
    // street lamps along the lane, one of them flickering
    for (let x = -34; x <= 4; x += 8) lampPost(x, 21.3, Math.PI);
    for (let x = -30; x <= 30; x += 10) { if (Math.abs(x) < 7) continue; lampPost(x, 15.0, Math.PI / 2); }
    const flickerLamp = new THREE.Mesh(G.box, LAMP_FLICKER);
    { const k = T.at(1.6, 24.4, 0); k.cyl(COL.charcoal, 0, 0, 0, 0.12, 0.3); k.cyl(COL.charcoal, 0, 0.3, 0, 0.055, 3.0, G.cyl6); k.box(COL.charcoal, 0.3, 3.18, 0, 0.62, 0.06, 0.06); k.box(COL.charcoal, 0.58, 3.0, 0, 0.3, 0.06, 0.3); }
    flickerLamp.position.set(2.18, 2.92, 24.4); flickerLamp.scale.set(0.22, 0.2, 0.22); scene.add(flickerLamp);

    // THE CORNER: TEA STALL, CO-OPERATIVE HALL, SELF-HELP GROUP, SCHOOL ==============================================
    {
        // the tea stall where the connecting lane meets the high road: a wooden counter, an indivara awning, a kettle on
        // the stove, jars of biscuits, a bench
        const k = T.at(-6.2, 16.6);
        k.box(0x8b6a48, 0, 0, -0.3, 2.4, 2.1, 1.4);
        k.box(0x9c7a52, 0.9, 0, 0.0, 0.6, 1.0, 2.0);
        k.box(COL.sandal, 0.9, 1.0, 0.0, 0.7, 0.06, 2.1);
        k.raw(G.box, COL.indivara, tf(0.3, 2.35, 0.1, 3.0, 0.07, 2.6, 0, 0, -0.18));
        k.raw(G.box, 0x6f45c0, tf(1.75, 2.08, 0.1, 0.06, 0.28, 2.6));
        k.cyl(0x3a3a3c, 0.9, 1.06, -0.55, 0.16, 0.12); k.cyl(0xb9c0c6, 0.9, 1.18, -0.55, 0.13, 0.22); k.cone(0xb9c0c6, 0.9, 1.4, -0.55, 0.08, 0.08);
        [ -0.1, 0.2, 0.5 ].forEach((z, j) => { k.cyl(GLASS, 0.95, 1.06, z, 0.1, 0.24); k.cyl([ 0xe3a33c, 0xc0654b, 0xf1ead6 ][j], 0.95, 1.08, z, 0.085, 0.14); });
        for (let j = 0; j < 4; j++) k.cyl(0xf4f2ec, 1.0, 1.06, 0.75 + j * 0.1, 0.035, 0.09, G.cyl6);
        k.box(0x7a5634, -0.2, 0, 2.05, 1.9, 0.45, 0.4);
        [ -0.9, 0.5 ].forEach(x => k.box(0x5c4024, x, 0, 2.05, 0.08, 0.42, 0.36));
        reserve(-8.0, 15.1, -4.2, 21.5);
    }
    {
        // the co-operative hall: one long room under tiles, a deep veranda on four columns, a board and a notice board
        const k = T.at(2.3, 17.8);
        k.box(COL.stone, 0, 0, 0, 6.6, 0.35, 4.6);
        k.box(0xe9d6b0, 0, 0.35, -0.3, 6.2, 2.8, 3.4);
        k.box(COL.stone, 0, 0.35, 1.75, 6.2, 0.06, 1.2);
        [ -2.8, -0.95, 0.95, 2.8 ].forEach(x => k.cyl(COL.ivory, x, 0.35, 2.15, 0.13, 2.65, G.cyl6));
        k.box(COL.ivory, 0, 2.95, 1.3, 6.4, 0.25, 2.1);
        const D = 5.2, hR = 1.5, a = Math.atan2(hR, D / 2);
        k.raw(G.gable, COL.tile, tf(0, 3.2, 0.05, D, hR, 7.0, Math.PI / 2));
        for (let f = 0.12; f < 0.95; f += 0.16) [ -1, 1 ].forEach(sd => k.raw(G.box, COL.tileDark, tf(0, 3.2 + hR * f + 0.03, 0.05 + sd * (D / 2) * (1 - f), 7.02, 0.05, 0.1, 0, sd * a)));
        k.box(0x6a4428, 0, 0.35, 1.42, 1.1, 2.0, 0.06);
        [ -2.0, 2.0 ].forEach(x => { k.box(COL.ivory, x, 1.1, 1.41, 0.95, 1.1, 0.04); k.box(GLASS, x, 1.2, 1.44, 0.75, 0.9, 0.04); });
        k.box(0x2f5e3a, 1.0, 1.0, 1.43, 0.6, 0.8, 0.04);
        for (let j = 0; j < 4; j++) k.box([ 0xf4f2ec, 0xf2c443, 0xf4f2ec, 0xe9cdb6 ][j], 0.85 + (j % 2) * 0.28, 1.15 + Math.floor(j / 2) * 0.32, 1.46, 0.2, 0.24, 0.01);
        board("CO-OPERATIVE SOCIETY", "#e1d5bc", "#3a3a3c", "700 40px Arial, Helvetica, sans-serif", 3.2, 0.4, tf(2.3, 3.0, 20.27), 640);
        neem(T, 6.4, 16.4, 1.1);
        reserve(-1.5, 15.1, 7.2, 21.5);
    }
    {
        // the self-help group's ground across the lane: a striped durrie in a circle, a pipal behind on a platform
        const k = T.at(-0.3, 27.0);
        [ [ 2.15, 0xb0563f ], [ 1.95, 0xe1d5bc ], [ 1.55, COL.indivara ], [ 1.35, 0xe9cdb6 ], [ 0.75, 0xb0563f ], [ 0.55, 0xe1d5bc ] ].forEach(([ r, c ], j) => GK.at(-0.3, 27.0).raw(G.disc, c, tf(0, 0.03 + j * 0.006, 0, r * 2, 0.012, r * 2)));
        k.cyl(COL.white, 0, 0, 0, 0.18, 0.02);
        const t = T.at(-3.0, 24.95);
        t.cyl(COL.stone, 0, 0, 0, 1.0, 0.45); t.cyl(0xd2bf98, 0, 0.45, 0, 1.05, 0.06);
        t.cyl(0x6e5232, 0, 0, 0, 0.32, 3.2, G.taper);
        for (let i = 0; i < 5; i++) { const a = i * 1.25; t.cyl(0x7f6040, Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9, 0.04, 3.3, G.cyl6); }
        for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; t.ball(LEAVES[i % 3], Math.cos(a) * 1.3, 3.6 + (i % 3) * 0.3, Math.sin(a) * 1.3, 0.85); }
        t.ball(COL.leafB, 0, 4.3, 0, 1.1);
        // a pail and a register lie on the durrie
        k.box(0xf4f2ec, 0.1, 0.06, -0.15, 0.35, 0.04, 0.25);
        reserve(-4.3, 24.0, 2.4, 29.6);
    }
    {
        // the school: two storeys round a dusty playground, a gate on the lane with children at it, a swing
        const k = T.at(16.5, 26.7);
        k.box(COL.stone, 0, 0, 0, 9.4, 0.3, 3.6);
        k.box(0xf0d9a0, 0, 0.3, -0.2, 9.0, 5.0, 3.0);
        [ 2.5, 5.2 ].forEach(y => k.box(COL.terracotta, 0, y - 0.15, -0.2, 9.1, 0.18, 3.1));
        k.box(0xf0d9a0, 0, 5.3, -0.2, 9.1, 0.5, 3.1);
        for (let x = -3.6; x <= 3.6; x += 1.2) [ 0.8, 3.1 ].forEach(y => { k.box(COL.white, x, y, 1.31, 0.8, 1.1, 0.04); k.box(GLASS, x, y + 0.1, 1.34, 0.6, 0.9, 0.04); });
        k.box(0x2e5e8c, -4.0, 0.3, 1.31, 0.9, 1.9, 0.04);
        GK.box(0xd9c49a, 16.5, 0, 30.6, 9.6, 0.04, 4.6);
        [ 24.4, 33.2 ].forEach(z => T.box(COL.ivory, 16.5, 0, z, 9.6, 0.9, 0.2));
        T.box(COL.ivory, 21.2, 0, 28.8, 0.2, 0.9, 8.8);
        T.box(COL.ivory, 11.8, 0, 31.0, 0.2, 0.9, 4.4);
        // the gate on the lane: two pillars, a beam over them, the grilles open
        [ 9.4, 11.6 ].forEach(x => { T.box(0xc2b6a2, x, 0, 24.5, 0.5, 2.6, 0.5); T.ball(COL.ivory, x, 2.75, 24.5, 0.2, 1, G.ball); });
        T.box(COL.terracotta, 10.5, 2.3, 24.5, 2.6, 0.45, 0.25);
        [ 9.65, 11.35 ].forEach((x, j) => { for (let i = 0; i < 5; i++) T.box(COL.charcoal, x + (j ? -1 : 1) * 0.08 * i, 0, 24.75 + i * 0.12, 0.04, 1.6, 0.04); });
        // a swing and a slide
        [ 14.0, 16.0 ].forEach(x => { T.cyl(COL.charcoal, x, 0, 30.2, 0.05, 2.2, G.cyl6); T.cyl(COL.charcoal, x, 0, 31.4, 0.05, 2.2, G.cyl6); });
        T.raw(G.cyl, COL.charcoal, tf(15.0, 2.2, 30.8, 0.08, 2.1, 0.08, 0, 0, Math.PI / 2));
        T.box(COL.terracotta, 15.0, 0.55, 30.8, 0.7, 0.06, 0.35);
        T.box(COL.ochre, 19.3, 0, 31.6, 0.6, 1.4, 0.6); T.raw(G.box, COL.ochre, tf(19.3, 0.8, 30.6, 0.6, 0.06, 2.0, 0, -0.65));
        gulmohar(T, 12.6, 32.2, 1.0);
        reserve(7.4, 24.0, 22.6, 33.6);
    }

    // spots kept for the palms that sway, planted after the filler
    const SWAY_PALMS : [ number, number, number, number ][] = [ [ -7.6, 3.4, 1.0, 1.2 ], [ -4.4, 32.8, 0.95, 0.4 ], [ -36.3, 21.2, 0.9, 2.0 ], [ 5.9, -6.0, 0.85, 3.8 ] ];
    SWAY_PALMS.forEach(([ x, z ]) => reserve(x - 0.8, z - 0.8, x + 0.8, z + 0.8));

    // THE REST OF THE TOWN ============================================================================================
    // The land round the named places is filled, plot by plot, with buildings of the same make: houses towards the
    // households' side and the front, sheds and works towards the companies' side, shops with flats over them between.
    // A share of their windows light at dusk.
    const DUSK_GLASS = GLASS.clone();
    const DUSKWIN = new Batch();
    {
        const frand = seeded(41);
        const pick = <V>(a : V[]) => a[Math.floor(frand() * a.length)];
        const winAt = (k : Kit, x : number, y : number, z : number, face : "z" | "x") => {
            const lit = frand() < 0.45, g = lit ? DUSK_GLASS : GLASS;
            if (face === "z") { k.box(0xf3e7cf, x, y - 0.06, z, 0.86, 1.0, 0.04); (lit ? kit(DUSKWIN, k.m) : k).box(g, x, y, z + 0.03, 0.66, 0.84, 0.04); }
            else { k.box(0xf3e7cf, z, y - 0.06, x, 0.04, 1.0, 0.86); (lit ? kit(DUSKWIN, k.m) : k).box(g, z + 0.03, y, x, 0.04, 0.84, 0.66); }
        };
        const fillHouse = (k : Kit, w : number, d : number) => {
            const floors = 1 + Math.floor(frand() * 2.3), H = 2.3, wall = pick(SANDAL_WALLS), trim = pick(TRIMS);
            if (frand() < 0.6) { kit(GROUND_B, k.m).box(COL.lawn, 0, 0, 0.5, w + 1.2, 0.03, d + 2.0); for (let i = 0; i < 3; i++) k.ball(pick(LEAVES), -w / 2 + 0.3 + frand() * (w - 0.6), 0.3, d / 2 + 1.2, 0.3 + frand() * 0.15, 0.8); }
            k.box(COL.stone, 0, 0, 0, w + 0.2, 0.22, d + 0.2);
            k.box(wall, 0, 0.22, 0, w, floors * H, d);
            for (let f = 0; f < floors; f++) {
                const y = 0.22 + f * H + 0.8;
                k.box(trim, 0, 0.22 + (f + 1) * H - 0.14, 0, w + 0.12, 0.14, d + 0.12);
                for (let x = -w / 2 + 0.9; x < w / 2 - 0.5; x += 1.5) { if (f === 0 && Math.abs(x) < 0.6) continue; winAt(k, x, y, d / 2 + 0.02, "z"); }
                for (let z = -d / 2 + 0.9; z < d / 2 - 0.5; z += 1.6) winAt(k, z, y, w / 2 + 0.02, "x");
            }
            k.box(trim, 0, 0.22, d / 2 + 0.01, 0.95, 1.85, 0.03); k.box(frand() < 0.35 ? IND : 0x6a4428, 0, 0.22, d / 2 + 0.03, 0.75, 1.72, 0.03);
            const top = 0.22 + floors * H;
            if (frand() < 0.5) {
                const D = d + 0.6, hR = 1.2, a = Math.atan2(hR, D / 2);
                k.raw(G.gable, frand() < 0.5 ? COL.tile : 0xc8714f, tf(0, top, 0, D, hR, w + 0.5, Math.PI / 2));
                for (let f = 0.15; f < 0.95; f += 0.2) [ -1, 1 ].forEach(sd => k.raw(G.box, COL.tileDark, tf(0, top + hR * f + 0.03, sd * (D / 2) * (1 - f), w + 0.52, 0.05, 0.1, 0, sd * a)));
            } else {
                k.box(trim, 0, top, d / 2 - 0.07, w + 0.1, 0.45, 0.14); k.box(trim, 0, top, -d / 2 + 0.07, w + 0.1, 0.45, 0.14);
                k.box(trim, w / 2 - 0.07, top, 0, 0.14, 0.45, d); k.box(trim, -w / 2 + 0.07, top, 0, 0.14, 0.45, d);
                k.cyl(0x2a2a2a, -w / 2 + 0.75, top, -d / 2 + 0.75, 0.4, 0.8);
                if (frand() < 0.5) k.box(wall, w / 2 - 0.8, top, -d / 2 + 0.8, 1.1, 1.1, 1.1);
            }
            if (frand() < 0.5) { k.box(COL.stone, 0, 0, d / 2 + 0.65, w, 0.2, 1.2); k.box(trim, 0, 2.1, d / 2 + 0.65, w + 0.1, 0.1, 1.3); [ -1, 1 ].forEach(sd => k.box(trim, sd * (w / 2 - 0.12), 0.2, d / 2 + 1.15, 0.12, 1.9, 0.12)); }
        };
        const fillShop = (k : Kit, w : number, d : number) => {
            const floors = 2 + Math.floor(frand() * 2), H = 2.4, wall = pick(SANDAL_WALLS);
            k.box(wall, 0, 0, 0, w, floors * H, d);
            const shutters = Math.max(1, Math.floor(w / 1.9));
            for (let i = 0; i < shutters; i++) {
                const x = -w / 2 + (i + 0.5) * (w / shutters);
                k.box(pick([ 0x4b3d32, 0x5b5e63, 0x3a3a3c ]), x, 0, d / 2 + 0.02, w / shutters - 0.3, 2.0, 0.04);
                k.box(pick([ COL.terracotta, COL.ochre, 0x2e8f5e, IND, 0x4f86b8, 0xd9457a ]), x, 2.05, d / 2 + 0.05, w / shutters - 0.2, 0.36, 0.06);
                k.raw(G.box, pick([ COL.ink, 0x2e8f5e, COL.terracotta, COL.sandalDeep ]), tf(x, 1.95, d / 2 + 0.5, w / shutters - 0.15, 0.05, 0.95, 0, 0.35));
            }
            for (let f = 1; f < floors; f++) {
                const y = f * H + 0.75;
                k.box(0xf3e7cf, 0, f * H - 0.12, 0, w + 0.12, 0.12, d + 0.12);
                for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 1.4) winAt(k, x, y, d / 2 + 0.02, "z");
                for (let z = -d / 2 + 0.8; z < d / 2 - 0.4; z += 1.5) winAt(k, z, y, w / 2 + 0.02, "x");
                if (frand() < 0.6) { k.box(0xf3e7cf, 0, f * H, d / 2 + 0.4, w * 0.8, 0.08, 0.8); k.box(0x4a4a4c, 0, f * H + 0.8, d / 2 + 0.78, w * 0.8, 0.05, 0.05); }
            }
            const top = floors * H;
            k.box(0xf3e7cf, 0, top, 0, w + 0.1, 0.4, d + 0.1); k.box(wall, 0, top, 0, w - 0.25, 0.42, d - 0.25);
            k.cyl(0x2a2a2a, w / 2 - 0.8, top, -d / 2 + 0.8, 0.42, 0.85);
            if (frand() < 0.4) k.cyl(0x2a2a2a, -w / 2 + 0.8, top, -d / 2 + 0.8, 0.42, 0.85);
        };
        const fillShed = (k : Kit, w : number, d : number) => {
            const wall = pick([ COL.concrete, COL.corrugated, 0xc9c2b2 ]), h = 3.2 + frand() * 1.2;
            k.box(COL.brick, 0, 0, 0, w + 0.05, 0.7, d + 0.05);
            k.box(wall, 0, 0.7, 0, w, h - 0.7, d);
            k.box(GLASS, 0, h - 1.2, 0, w + 0.04, 0.6, d + 0.04);
            for (let x = -w / 2; x <= w / 2; x += 0.9) k.box(wall, x, h - 1.2, d / 2 + 0.02, 0.1, 0.6, 0.04);
            if (frand() < 0.5) {
                const n = Math.max(2, Math.round(w / 2.6));
                for (let i = 0; i < n; i++) { const tw = w / n, cx = -w / 2 + tw * (i + 0.5); k.raw(G.tooth, COL.terracotta, tf(cx, h, 0, tw, 1.3, d)); k.box(GLASS, cx + tw / 2 - 0.04, h + 0.05, 0, 0.05, 1.1, d - 0.3); }
            } else {
                k.raw(G.gable, pick([ COL.terracotta, 0x9aa0a6, COL.tile ]), tf(0, h, 0, w + 0.5, 1.2, d + 0.4));
            }
            k.box(COL.charcoal, -w / 4, 0, d / 2 + 0.03, Math.min(2.6, w / 2), 2.6, 0.06);
            if (frand() < 0.35) { k.cyl(0xb2553d, w / 2 - 0.8, 0, -d / 2 + 0.8, 0.4, h + 4, G.taper); k.cyl(COL.white, w / 2 - 0.8, h + 3.1, -d / 2 + 0.8, 0.32, 0.28); }
            if (frand() < 0.5) for (let i = 0; i < 4; i++) k.cyl(i % 2 ? 0x3f6f9a : COL.ochre, w / 2 + 0.6, 0, -d / 2 + 0.6 + i * 0.55, 0.22, 0.75);
        };
        const fillPark = (k : Kit, w : number, d : number) => {
            k.box(COL.lawn, 0, 0, 0, w + 1, 0.06, d + 1);
            k.box(0xd8cdb5, 0, 0.061, 0, 0.7, 0.01, d + 1);
            for (let i = 0; i < 3; i++) { const x = (frand() - 0.5) * w, z = (frand() - 0.5) * d; if (frand() < 0.5) neem(k, x, z, 0.8 + frand() * 0.4); else gulmohar(k, x, z, 0.8 + frand() * 0.3); }
            k.box(0x7a5634, w / 2 - 0.3, 0, 0, 0.4, 0.42, 1.4);
        };
        for (let cx = -88; cx <= 88; cx += 7) for (let cz = -88; cz <= 88; cz += 7) {
            const x = cx + (frand() - 0.5) * 1.2, z = cz + (frand() - 0.5) * 1.2;
            const w = 3.6 + frand() * 1.8, d = 3.6 + frand() * 1.6;
            if (!isFree(x - w / 2 - 0.9, z - d / 2 - 0.9, x + w / 2 + 0.9, z + d / 2 + 1.6)) continue;
            const ry = frand() < 0.82 ? 0 : Math.PI / 2;
            const k = kit(STATIC, tf(x, 0, z, 1, 1, 1, ry));
            const industry = (x > 11 && z < 1) || x > 37, housing = z > 15 || x < -30 || z > 2 && x < -6;
            const r = frand();
            if (r < 0.07) fillPark(k, w, d);
            else if (industry) { if (r < 0.75) fillShed(k, w + 0.8, d + 0.6); else fillShop(k, w, d); }
            else if (housing) { if (r < 0.8) fillHouse(k, w, d); else fillShop(k, w, d); }
            else { if (r < 0.55) fillShop(k, w, d); else fillHouse(k, w, d); }
            reserve(x - w / 2 - 0.4, z - d / 2 - 0.4, x + w / 2 + 0.4, z + d / 2 + 1.4);
            // a tree in the gap beside some plots
            if (frand() < 0.45) {
                const tx = x + w / 2 + 1.0, tz = z + (frand() - 0.5) * d;
                if (isFree(tx - 0.5, tz - 0.5, tx + 0.5, tz + 0.5)) { const t = frand(); if (t < 0.5) neem(T, tx, tz, 0.7 + frand() * 0.4); else if (t < 0.8) palm(tx, tz, 0.7 + frand() * 0.3, frand() * 6); else gulmohar(T, tx, tz, 0.8); reserve(tx - 0.6, tz - 0.6, tx + 0.6, tz + 0.6); }
            }
        }
        // avenue trees along the high road and the factory road
        for (let x = -86; x <= 86; x += 5.5) [ 10.0, 15.6 ].forEach(z => { if (isFree(x - 0.4, z - 0.4, x + 0.4, z + 0.4)) { if (frand() < 0.6) neem(T, x, z, 0.75); else gulmohar(T, x, z, 0.75); reserve(x - 0.5, z - 0.5, x + 0.5, z + 0.5); } });
        for (let z = -86; z <= 4; z += 5.5) [ 6.0 ].forEach(x => { if (isFree(x - 0.4, z - 0.4, x + 0.4, z + 0.4)) { neem(T, x, z, 0.75); reserve(x - 0.5, z - 0.5, x + 0.5, z + 0.5); } });
    }
    // a few palms that sway, round the bank and the lane
    SWAY_PALMS.forEach(([ x, z, sc, rot ]) => palm(x, z, sc, rot, true));

    // THE PEOPLE ======================================================================================================
    // Figures in the farm's proportions (head about one-seventh of the height); hips, knees, shoulders and elbows pivot.
    // Each pivot's parts are merged, so a figure draws in a dozen calls. The queue at the bank is instanced.
    const SKIN = [ 0xa86f45, 0x9a6440, 0xb57a4f, 0x8f5a36 ], HAIR = 0x1d140e;
    const dsCache = new Map<number, THREE.MeshStandardMaterial>();
    const softDS = (color : number) => {
        let m = dsCache.get(color);
        if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness : 0.7, side : THREE.DoubleSide }); dsCache.set(color, m); }
        return m;
    };
    const limbGeo = (len : number, r0 : number, r1 : number) => { const g = new THREE.CylinderGeometry(r1, r0, len, 7, 1); g.translate(0, -len / 2, 0); return g; };
    const LG = {
        thigh : limbGeo(0.44, 0.07, 0.055), shin : limbGeo(0.42, 0.05, 0.04), arm : limbGeo(0.3, 0.055, 0.045), fore : limbGeo(0.27, 0.04, 0.032),
        sari : (() => {
            const k = new THREE.CylinderGeometry(0.17, 0.3, 0.92, 18, 4), kp = k.attributes.position;
            for (let i = 0; i < kp.count; i++) { const a = Math.atan2(kp.getZ(i), kp.getX(i)), r = Math.hypot(kp.getX(i), kp.getZ(i)), f = 1 + 0.05 * Math.sin(a * 9); kp.setX(i, Math.cos(a) * r * f); kp.setZ(i, Math.sin(a) * r * f); }
            k.computeVertexNormals(); return k;
        })(),
        hem : new THREE.CylinderGeometry(0.305, 0.31, 0.07, 18),
        dhoti : (() => {
            const d = new THREE.CylinderGeometry(0.2, 0.23, 0.62, 12, 3), dp = d.attributes.position;
            for (let i = 0; i < dp.count; i++) { const yy = dp.getY(i); if (yy < 0) dp.setZ(i, dp.getZ(i) * (1 - (-yy / 0.31) * 0.3)); }
            d.computeVertexNormals(); return d;
        })(),
        skirt : new THREE.CylinderGeometry(0.17, 0.27, 0.42, 12),
        lap : new THREE.CylinderGeometry(0.3, 0.42, 0.26, 16), lapHem : new THREE.CylinderGeometry(0.425, 0.43, 0.05, 16),
        torso : new THREE.CylinderGeometry(0.19, 0.16, 0.5, 12), kurta : new THREE.CylinderGeometry(0.19, 0.24, 0.72, 12),
        shoulder : new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        midriff : new THREE.CylinderGeometry(0.168, 0.168, 0.05, 12),
        neck : new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8),
        head : new THREE.SphereGeometry(0.115, 14, 10),
        hairCap : new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
        veil : new THREE.SphereGeometry(0.14, 12, 10, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.72),
    };
    interface Spec {
        skin ? : number; leg : number; foot : number; shin ? : number; top : number; sleeve ? : number; forearm ? : number;
        sari ? : number; border ? : number; pallu ? : number; veil ? : number; dhoti ? : number; kurta ? : boolean; jacket ? : boolean; tie ? : number;
        skirt ? : number; hair ? : "long" | "short"; cap ? : number; hardhat ? : number; seated ? : boolean; book ? : boolean; bag ? : number; glass ? : boolean;
    }
    interface Person { root : THREE.Group; body : THREE.Group; upper : THREE.Group; legs : { hip : THREE.Group; knee : THREE.Group }[]; arms : { sh : THREE.Group; el : THREE.Group }[]; handR : THREE.Group; handL : THREE.Group }
    const figure = (s : Spec) : Person => {
        const skin = s.skin ?? SKIN[0], WAIST = 0.95;
        const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
        const upper = new THREE.Group(); upper.position.y = WAIST; body.add(upper);
        const P = (b : Batch, geo : THREE.BufferGeometry, c : number | THREE.Material, x : number, y : number, z : number, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) =>
            b.add(geo, typeof c === "number" ? soft(c) : c, tf(x, y, z, sx, sy, sz, ry, rx, rz));
        const legs = [ -0.095, 0.095 ].map(x => {
            const hip = new THREE.Group(); hip.position.set(x, 0.9, 0); body.add(hip);
            const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
            if (!s.seated) {
                const hb = new Batch(); P(hb, LG.thigh, s.leg, 0, 0, 0); hb.build(hip);
                const kb = new Batch(); P(kb, LG.shin, s.shin ?? s.leg, 0, 0, 0); P(kb, G.box, s.foot, 0, -0.44, 0.05, 0.09, 0.05, 0.22); kb.build(knee);
            }
            return { hip, knee };
        });
        const bb = new Batch();
        if (s.dhoti !== undefined) P(bb, LG.dhoti, s.dhoti, 0, 0.62, 0);
        if (s.sari !== undefined && !s.seated) { P(bb, LG.sari, s.sari, 0, 0.5, 0); P(bb, LG.hem, s.border ?? s.sari, 0, 0.075, 0); }
        if (s.skirt !== undefined) P(bb, LG.skirt, s.skirt, 0, 0.72, 0);
        if (s.seated) { P(bb, LG.lap, s.sari ?? s.leg, 0, 0.9, 0); P(bb, LG.lapHem, s.border ?? s.sari ?? s.leg, 0, 0.79, 0); }
        if (bb.parts.size) bb.build(body);
        const ub = new Batch();
        const U = (geo : THREE.BufferGeometry, c : number | THREE.Material, x : number, y : number, z : number, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) => P(ub, geo, c, x, y - WAIST, z, sx, sy, sz, ry, rx, rz);
        const torsoLen = s.kurta ? 0.72 : 0.5;
        U(s.kurta ? LG.kurta : LG.torso, s.top, 0, 1.45 - torsoLen / 2 + 0.02, 0, 1, 1, 0.72);
        U(LG.shoulder, s.top, 0, 1.44, 0, 1, 0.45, 0.72);
        if (s.jacket) { U(G.box, 0xf4f2ec, 0, 1.34, 0.128, 0.12, 0.2, 0.02, 0, -0.15); U(G.box, s.tie ?? COL.terracotta, 0, 1.27, 0.142, 0.045, 0.26, 0.02, 0, -0.15); }
        if (s.pallu !== undefined) {
            U(G.box, s.pallu, -0.02, 1.18, 0.12, 0.17, 0.66, 0.025, 0, 0, -0.6);
            U(G.box, s.pallu, -0.02, 1.16, -0.13, 0.3, 0.6, 0.03);
            U(LG.midriff, skin, 0, 0.97, 0, 1, 1, 0.72);
        }
        if (s.bag !== undefined) U(G.box, s.bag, 0, 1.15, -0.17, 0.26, 0.32, 0.12);
        U(LG.neck, skin, 0, 1.5, 0);
        U(LG.head, skin, 0, 1.64, 0, 0.92, 1.08, 1);
        if (s.hair === "long") { U(LG.hairCap, HAIR, 0, 1.652, -0.005, 0.95, 1.05, 1.02); U(G.ball, HAIR, 0, 1.62, -0.12, 0.12, 0.12, 0.12); }
        if (s.hair === "short") U(LG.hairCap, HAIR, 0, 1.662, -0.01, 0.98, 0.92, 1.04);
        if (s.cap !== undefined) U(G.cyl, s.cap, 0, 1.73, 0, 0.21, 0.09, 0.23);
        if (s.hardhat !== undefined) { U(G.dome, s.hardhat, 0, 1.685, 0, 0.26, 0.26, 0.26); U(G.cyl, s.hardhat, 0, 1.685, 0.02, 0.32, 0.015, 0.32); }
        if (s.veil !== undefined) U(LG.veil, softDS(s.veil), 0, 1.645, -0.02, 1, 1.05, 1.08, 0, -0.15);
        ub.build(upper);
        const arms = [ -1, 1 ].map(side => {
            const sh = new THREE.Group(); sh.position.set(side * 0.235, 1.4 - WAIST, 0); upper.add(sh);
            const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
            const ab = new Batch(); P(ab, LG.arm, s.sleeve ?? s.top, 0, 0, 0); ab.build(sh);
            const eb = new Batch(); P(eb, LG.fore, s.forearm ?? skin, 0, 0, 0); P(eb, G.ball, skin, 0, -0.3, 0, 0.072, 0.11, 0.054); eb.build(el);
            return { sh, el };
        });
        const handR = new THREE.Group(); handR.position.y = -0.3; arms[1].el.add(handR);
        const handL = new THREE.Group(); handL.position.y = -0.3; arms[0].el.add(handL);
        if (s.book) { const hb = new Batch(); P(hb, G.box, 0xf4f2ec, 0, 0, 0.1, 0.24, 0.02, 0.18); P(hb, G.box, 0x2e5e8c, 0, -0.014, 0.1, 0.25, 0.012, 0.19); hb.build(handR); }
        if (s.glass) { const hb = new Batch(); P(hb, G.cyl, 0xd9a35a, 0, 0.02, 0.03, 0.06, 0.09, 0.06); hb.build(handR); }
        scene.add(root);
        return { root, body, upper, legs, arms, handR, handL };
    };
    interface Pose { hip ? : number[]; knee ? : number[]; sh ? : number[]; el ? : number[]; shz ? : number[]; bob ? : number; lean ? : number }
    const pose = (p : Person, c : Pose) => {
        p.legs.forEach((l, i) => { l.hip.rotation.x = c.hip?.[i] ?? 0; l.knee.rotation.x = c.knee?.[i] ?? 0; });
        p.arms.forEach((a, i) => { a.sh.rotation.x = c.sh?.[i] ?? 0; a.el.rotation.x = c.el?.[i] ?? 0; a.sh.rotation.z = c.shz?.[i] ?? 0; });
        p.body.position.y = c.bob ?? 0; p.upper.rotation.x = c.lean ?? 0;
    };
    const stride = (ph : number, armsSwing = true) : Pose => {
        const s = Math.sin(ph);
        return { hip : [ s * 0.45, -s * 0.45 ], knee : [ Math.max(0, -s) * 0.7, Math.max(0, s) * 0.7 ], sh : armsSwing ? [ -s * 0.35, s * 0.35 ] : [ 0, 0 ], el : [ -0.2, -0.2 ], bob : Math.abs(Math.cos(ph)) * 0.03 };
    };
    const SEATED : Pose = { hip : [ -1.5, -1.5 ], knee : [ 1.45, 1.45 ], sh : [ -0.5, -0.5 ], el : [ -0.8, -0.8 ] };
    const STAND : Pose = { sh : [ 0, 0 ], el : [ -0.12, -0.12 ] };
    const SARI = [
        { sari : 0xe8642a, border : 0xf2c443, top : 0x2e8f5e, pallu : 0xd8521e },
        { sari : 0xe9b628, border : 0xc8402e, top : 0x7a3f8f, pallu : 0xd99a1c },
        { sari : 0xd9457a, border : 0x2e9e6a, top : 0x2e8f5e, pallu : 0xc23a6b },
        { sari : 0x8a55e6, border : 0xf2c443, top : 0xc8402e, pallu : 0x7546cf },
        { sari : 0x2f7fbf, border : 0xf2c443, top : 0xc8402e, pallu : 0x25689e },
        { sari : 0x2e9e8a, border : 0xe9b628, top : 0xd9457a, pallu : 0x23806f },
        { sari : 0xc0654b, border : 0xf4f2ec, top : 0x3f5f9a, pallu : 0xa8513a },
        { sari : 0xf2c443, border : 0x8a55e6, top : 0x2e8f5e, pallu : 0xe0b030 },
    ];
    const woman = (i : number, extra : Partial<Spec> = {}) => {
        const c = SARI[i % SARI.length];
        return figure({ skin : SKIN[i % 4], leg : SKIN[i % 4], foot : 0x5c3b22, sari : c.sari, border : c.border, top : c.top, sleeve : c.top, pallu : c.pallu, veil : i % 3 === 1 ? undefined : c.pallu, hair : "long", ...extra });
    };

    // The queue: simple instanced figures in one draw per part, posed by position only.
    const QN = 26;
    const crowdGeo = (() => {
        const m = (g : THREE.BufferGeometry, mat : THREE.Matrix4) => { const n = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal") n.deleteAttribute(k); n.clearGroups(); n.applyMatrix4(mat); return n; };
        const legs = mergeGeometries([ -0.09, 0.09 ].flatMap(x => [ m(G.cyl, tf(x, 0.46, 0, 0.13, 0.86, 0.13)), m(G.box, tf(x, 0.03, 0.05, 0.09, 0.05, 0.22)) ]));
        const skirt = mergeGeometries([ m(LG.sari, tf(0, 0.5, 0)), m(LG.hem, tf(0, 0.075, 0)) ]);
        const torso = mergeGeometries([ m(LG.torso, tf(0, 1.22, 0, 1, 1, 0.72)), m(LG.shoulder, tf(0, 1.44, 0, 1, 0.45, 0.72)), ...[ -1, 1 ].map(sd => m(G.cyl, tf(sd * 0.235, 1.12, 0, 0.1, 0.58, 0.1))) ]);
        const head = mergeGeometries([ m(LG.head, tf(0, 1.64, 0, 0.92, 1.08, 1)), m(LG.neck, tf(0, 1.5, 0)), ...[ -1, 1 ].map(sd => m(G.ball, tf(sd * 0.235, 0.8, 0, 0.08, 0.11, 0.06))) ]);
        const hair = m(LG.hairCap, tf(0, 1.652, -0.005, 0.95, 1.05, 1.02));
        const veil = m(LG.veil, tf(0, 1.645, -0.02, 1, 1.05, 1.08, 0, -0.15));
        return { legs, skirt, torso, head, hair, veil };
    })();
    const crowdMat = new THREE.MeshStandardMaterial({ color : 0xffffff, roughness : 0.7 });
    const crowdMatDS = new THREE.MeshStandardMaterial({ color : 0xffffff, roughness : 0.7, side : THREE.DoubleSide });
    const crowd = Object.fromEntries((Object.keys(crowdGeo) as (keyof typeof crowdGeo)[]).map(k => {
        const im = new THREE.InstancedMesh(crowdGeo[k], k === "veil" ? crowdMatDS : crowdMat, QN);
        im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
        return [ k, im ];
    })) as unknown as Record<keyof typeof crowdGeo, THREE.InstancedMesh>;
    interface QSpec { x : number; z : number; ry : number; s : number; woman : boolean; top : number; low : number; skin : number; veil : number | null }
    const queue : QSpec[] = [];
    {
        const qr = seeded(61);
        const spots : [ number, number, number ][] = [];
        for (let i = 0; i < 7; i++) spots.push([ -0.6 - i * 0.75, 6.3, i === 0 ? Math.PI : Math.PI / 2 ]);
        for (let i = 0; i < 12; i++) spots.push([ -5.4 + i * 0.75, 7.65, i === 0 ? Math.PI : -Math.PI / 2 ]);
        for (let i = 0; i < 7; i++) spots.push([ 2.85 - i * 0.75, 9.0, i === 0 ? Math.PI : Math.PI / 2 ]);
        spots.forEach(([ x, z, ry ], i) => {
            const w = qr() < 0.55, child = i % 4 === 3, c = SARI[Math.floor(qr() * SARI.length)];
            queue.push({
                x : x + (qr() - 0.5) * 0.12, z : z + (qr() - 0.5) * 0.12 + (child ? 0.28 : 0), ry : ry + (qr() - 0.5) * 0.5, s : child ? 0.62 : 0.95 + qr() * 0.08,
                woman : w, top : child ? 0xf4f2ec : w ? c.top : [ 0x5d7fa8, 0xf4f2ec, 0xb9ab95, 0x6b8e23, 0xc0654b, 0x8fa8c8 ][Math.floor(qr() * 6)],
                low : child ? 0x2e3f6b : w ? c.sari : [ 0x4a4a4c, 0x6b6257, 0x2e3f6b, 0x8a8478 ][Math.floor(qr() * 4)],
                skin : SKIN[Math.floor(qr() * 4)], veil : w && qr() < 0.6 ? c.pallu : null,
            });
        });
    }
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), _c = new THREE.Color();
    const placeQueue = (shown : number, time : number) => {
        queue.forEach((q, i) => {
            const k = smooth(i, i + 1, shown);
            const m = k > 0.001 ? tf(q.x, 0, q.z, q.s * k, q.s * k, q.s * k, q.ry + (opts.reduced ? 0 : Math.sin(time * 0.6 + i) * 0.08)) : ZERO;
            crowd.legs.setMatrixAt(i, m); crowd.torso.setMatrixAt(i, m); crowd.head.setMatrixAt(i, m); crowd.hair.setMatrixAt(i, m);
            crowd.skirt.setMatrixAt(i, q.woman ? m : ZERO); crowd.veil.setMatrixAt(i, q.veil !== null ? m : ZERO);
        });
        Object.values(crowd).forEach(im => { im.instanceMatrix.needsUpdate = true; });
    };
    queue.forEach((q, i) => {
        crowd.legs.setColorAt(i, _c.setHex(q.woman ? q.skin : q.low)); crowd.skirt.setColorAt(i, _c.setHex(q.low));
        crowd.torso.setColorAt(i, _c.setHex(q.top)); crowd.head.setColorAt(i, _c.setHex(q.skin));
        crowd.hair.setColorAt(i, _c.setHex(HAIR)); crowd.veil.setColorAt(i, _c.setHex(q.veil ?? HAIR));
    });

    // THE STORY'S PEOPLE AND VEHICLES =================================================================================
    const groupOf = (draw : (k : Kit) => void) => { const g = new THREE.Group(), b = new Batch(); draw(kit(b)); b.build(g); scene.add(g); return g; };
    const V = (x : number, z : number) => new THREE.Vector3(x, 0, z);
    const line = (a : [ number, number ], b : [ number, number ]) => new THREE.LineCurve3(V(...a), V(...b));
    const route = (pts : [ number, number ][]) => new THREE.CatmullRomCurve3(pts.map(([ x, z ]) => V(x, z)), false, "centripetal");
    interface Stage { a : number; b : number; curve : THREE.Curve<THREE.Vector3> }
    // poses a thing along the route of whichever stage the progress has reached, facing the way it goes
    const follow = (obj : THREE.Object3D, stages : Stage[], p : number) => {
        let curve = stages[0].curve, t = 0;
        stages.forEach(st => { if (p >= st.a) { curve = st.curve; t = ease(span(p, st.a, st.b)); } });
        const pos = curve.getPointAt(t), tan = curve.getTangentAt(Math.min(0.995, Math.max(0.005, t)));
        obj.position.set(pos.x, obj.position.y, pos.z); obj.rotation.y = Math.atan2(tan.x, tan.z);
        // a thing that has driven out of the town at the end of its last stage is gone
        const last = stages[stages.length - 1];
        obj.visible = !(p >= last.b && last.curve.getPointAt(1).distanceTo(stages[0].curve.getPointAt(0)) > 20);
    };
    // March 2015: three lorries on the factory road to the bank; by June 2017 one turns away along the high road and
    // the others turn back up the road; by June 2026 the road is empty but for the lorry at the warehouse
    const lorries : { g : THREE.Group; stages : Stage[] }[] = [
        { g : groupOf(k => lorry(k, 0xc0654b, 0xc98a4b, COL.ochre)), stages : [ { a : 0.12, b : 0.29, curve : line([ 9.2, -7 ], [ 9.2, 2 ]) }, { a : 0.34, b : 0.54, curve : route([ [ 9.2, 2 ], [ 9.2, 9.5 ], [ 10.0, 11.4 ], [ 11.8, 12.0 ], [ 20, 12.0 ], [ 36, 12.0 ] ]) } ] },
        { g : groupOf(k => lorry(k, 0x3f7f86, 0xb88a55, COL.terracotta)), stages : [ { a : 0.12, b : 0.29, curve : line([ 9.2, -18 ], [ 9.2, -9 ]) }, { a : 0.33, b : 0.52, curve : route([ [ 9.2, -9 ], [ 9.2, -7.4 ], [ 8.6, -6.2 ], [ 7.9, -7.2 ], [ 7.8, -10 ], [ 7.8, -30 ], [ 7.8, -64 ] ]) } ] },
        { g : groupOf(k => lorry(k, 0x6b8e23, 0xc98a4b, COL.ochre)), stages : [ { a : 0.12, b : 0.29, curve : line([ 9.2, -30 ], [ 9.2, -21 ]) }, { a : 0.35, b : 0.54, curve : route([ [ 9.2, -21 ], [ 9.2, -19.4 ], [ 8.6, -18.2 ], [ 7.9, -19.2 ], [ 7.8, -22 ], [ 7.8, -64 ] ]) } ] },
    ];
    // a company car at the bank's door with three men in suits; they get in and it drives off up the factory road
    const companyCar = { g : groupOf(k => car(k, 0x2a2c31)), stages : [ { a : 0.4, b : 0.54, curve : route([ [ 4.6, 7.2 ], [ 4.6, 10.4 ], [ 5.4, 11.8 ], [ 7.0, 12.1 ], [ 7.9, 11.0 ], [ 7.8, 4 ], [ 7.8, -64 ] ]) } ] as Stage[] };
    const SUIT = [ 0x2f3238, 0x3a3d45, 0x2a2c31 ];
    const suits = [ [ 1.3, 5.5, 0.9, 3.85, 6.7 ], [ 2.45, 5.25, -0.4, 3.85, 7.7 ], [ 2.1, 6.35, Math.PI - 0.3, 5.45, 7.6 ] ].map(([ x, z, ry, tx, tz ], i) => ({
        p : figure({ skin : SKIN[(i + 2) % 4], leg : SUIT[i], foot : 0x161616, top : SUIT[i], sleeve : SUIT[i], forearm : SUIT[i], jacket : true, tie : [ COL.terracotta, 0x7546cf, 0x2e5e8c ][i], hair : "short" }),
        from : V(x, z), to : V(tx, tz), ry,
    }));
    // a family walks out of their house, along the lane and across the road to the bank's door
    const FAMILY_ROUTE = route([ [ -10.5, 20.3 ], [ -10.0, 21.9 ], [ -6, 22.4 ], [ -3.5, 21.6 ], [ -3.1, 18 ], [ -3.0, 14.6 ], [ -2.4, 11.6 ], [ -1.2, 9.8 ], [ -0.6, 7.2 ], [ -0.6, 5.4 ] ]);
    const FAMILY_LEN = FAMILY_ROUTE.getLength();
    const family = [
        { p : figure({ skin : SKIN[1], leg : 0x6b6257, foot : 0x3e2c1e, top : 0x5d7fa8, sleeve : 0x5d7fa8, hair : "short" }), side : 0, lag : -0.012 },
        { p : woman(3), side : 0.55, lag : 0 },
        { p : figure({ skin : SKIN[1], leg : SKIN[1], shin : SKIN[1], foot : 0x2a2a2a, top : 0xf4f2ec, sleeve : 0xf4f2ec, skirt : 0x2e3f6b, hair : "long", bag : 0xc0654b }), side : 1.0, lag : 0.008 },
    ];
    family[2].p.root.scale.setScalar(0.62);
    // June 2026: scooters parked along the forecourt
    const scooters = [ [ 5.75, 5.3 ], [ 5.75, 6.1 ], [ 5.75, 6.9 ], [ 5.75, 7.7 ], [ 5.75, 8.5 ], [ 5.75, 9.3 ], [ -5.5, 9.7 ], [ -4.7, 9.9 ] ].map(([ x, z ], i) => {
        const g = groupOf(k => scooter(k, [ COL.indivara, 0xf4f2ec, COL.terracotta, 0x2f2f2f, 0x4f86b8, 0xe3a33c, 0xc8c8c8, COL.indivara ][i]));
        g.position.set(x, 0, z); g.rotation.y = i < 6 ? -1.25 : 0.4; return g;
    });
    const bankScooter = groupOf(k => scooter(k, COL.indivara)); bankScooter.position.set(6.0, 0, 3.6); bankScooter.rotation.y = 0.5;
    // at the end, women at their doors, and the self-help group gathering on the durrie
    const doorWomen = doors.slice(0, 4).map((d, i) => ({ d, p : woman(i + 4) }));
    const SHG_C = V(-0.3, 27.0);
    const shg = Array.from({ length : 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3, x = SHG_C.x + Math.cos(a) * 1.55, z = SHG_C.z + Math.sin(a) * 1.55;
        const p = woman(i, { seated : true, book : i === 0 });
        p.root.position.set(x, 0, z); p.root.rotation.y = Math.atan2(SHG_C.x - x, SHG_C.z - z);
        return p;
    });
    // the tea stall: the man who makes it and two at the bench with their glasses
    const chaiwala = figure({ skin : SKIN[3], leg : 0xf3efe4, foot : 0x3e2c1e, dhoti : 0xf3efe4, kurta : true, top : 0xf6f1e3, hair : "short" });
    chaiwala.root.position.set(-5.95, 0, 16.75); chaiwala.root.rotation.y = Math.PI / 2;
    const benchers = [ [ -6.95, 0x6f8fc0, 0x4a4a4c, 0xf4f2ec ], [ -5.95, 0xe9cdb6, 0x6b6257, -1 ] ].map(([ x, top, leg, cap ]) => {
        const p = figure({ skin : SKIN[2], leg, foot : 0x3e2c1e, top, sleeve : top, hair : "short", cap : cap >= 0 ? cap : undefined, glass : true });
        p.root.position.set(x, -0.43, 18.55); return p;
    });
    const keepers = shopkeepers.map((s, i) => {
        const p = i === 1 ? figure({ skin : SKIN[i], leg : 0x4a4a4c, foot : 0x222222, top : 0xf4f2ec, sleeve : 0xf4f2ec, forearm : 0xf4f2ec, hair : "short" })
            : i === 2 ? figure({ skin : SKIN[i], leg : 0xf3efe4, foot : 0x3e2c1e, dhoti : 0xf3efe4, kurta : true, top : 0xe9c04a, sleeve : 0xe9c04a, hair : "short", cap : 0xf4f2ec })
            : figure({ skin : SKIN[i], leg : 0x2e3f6b, foot : 0x222222, top : [ 0x2e8f8f, 0, 0, COL.terracotta ][i], sleeve : [ 0x2e8f8f, 0, 0, COL.terracotta ][i], hair : "short" });
        p.root.position.set(s.x, 0.12, s.z); return p;
    });
    // a man pushing his cycle along the lane, children at the school gate and in the playground, a guard, two workers
    const cyclist = figure({ skin : SKIN[1], leg : 0x6b6257, foot : 0x3e2c1e, top : 0xf4f2ec, sleeve : 0xf4f2ec, hair : "short", cap : 0xf4f2ec });
    const cycle = groupOf(k => {
        [ -0.48, 0.48 ].forEach(z => k.raw(G.torus, 0x2a2a2a, tf(0, 0.34, z, 0.66, 0.66, 0.66, Math.PI / 2)));
        k.raw(G.cyl, 0x2e5e8c, tf(0, 0.55, 0, 0.05, 0.95, 0.05, 0, Math.PI / 2 - 0.25));
        k.raw(G.cyl, 0x2e5e8c, tf(0, 0.5, -0.2, 0.05, 0.6, 0.05, 0, -0.5));
        k.cyl(0x2a2a2a, 0, 0.62, 0.42, 0.025, 0.5, G.cyl6); k.box(0x2a2a2a, 0, 1.1, 0.42, 0.55, 0.04, 0.04);
        k.box(0x2a2a2a, 0, 0.82, -0.25, 0.14, 0.06, 0.26); k.box(0x7a5634, 0, 0.62, -0.5, 0.32, 0.05, 0.3);
    });
    const kids = [ [ 10.1, 23.7, 0x2e3f6b, false ], [ 10.75, 23.9, 0x2e3f6b, true ] ].map(([ x, z, c, girl ]) => {
        const p = figure(girl ? { skin : SKIN[2], leg : SKIN[2], foot : 0x222222, top : 0xf4f2ec, sleeve : 0xf4f2ec, skirt : c as number, hair : "long", bag : COL.indivara }
            : { skin : SKIN[0], leg : c as number, shin : SKIN[0], foot : 0x222222, top : 0xf4f2ec, sleeve : 0xf4f2ec, hair : "short", bag : COL.terracotta });
        p.root.scale.setScalar(0.62); p.root.position.set(x as number, 0, z as number); p.root.rotation.y = girl ? -2.2 : 2.4; return p;
    });
    const runner = figure({ skin : SKIN[3], leg : 0x2e3f6b, shin : SKIN[3], foot : 0x222222, top : 0xf4f2ec, sleeve : 0xf4f2ec, hair : "short" }); runner.root.scale.setScalar(0.6);
    const swing = new THREE.Group(); swing.position.set(15, 2.2, 30.8); scene.add(swing);
    { const b = new Batch(), k = kit(b); [ -0.3, 0.3 ].forEach(x => k.box(0x4a4a4c, x, -1.65, 0, 0.02, 1.65, 0.02)); k.box(COL.terracotta, 0, -1.7, 0, 0.7, 0.06, 0.35); b.build(swing); }
    const swinger = figure({ skin : SKIN[0], leg : SKIN[0], shin : SKIN[0], foot : 0x222222, top : 0xf4f2ec, sleeve : 0xf4f2ec, skirt : 0x2e3f6b, hair : "long" });
    swing.add(swinger.root); swinger.root.scale.setScalar(0.6); swinger.root.position.set(0, -1.67 - 0.29, 0); pose(swinger, { hip : [ -1.5, -1.5 ], knee : [ 1.2, 1.2 ], sh : [ -2.7, -2.7 ], el : [ 0, 0 ] });
    const guard = figure({ skin : SKIN[3], leg : 0xb59a63, foot : 0x222222, top : 0xb59a63, sleeve : 0xb59a63, hair : "short", cap : 0x6b5a3a });
    guard.root.position.set(-16.6, 0, -11.6); guard.root.rotation.y = 0.2;
    const workers = [ [ 16.2, -2.2, 0.4 ], [ 17.3, -1.9, -0.8 ] ].map(([ x, z, ry ]) => {
        const p = figure({ skin : SKIN[1], leg : 0x3f5f9a, foot : 0x222222, top : 0x3f5f9a, sleeve : 0x3f5f9a, hardhat : COL.ochre });
        p.root.position.set(x, 0, z); p.root.rotation.y = ry; return p;
    });
    // traffic on the high road: autos, a bus, a car
    const autos = [ groupOf(auto), groupOf(auto) ];
    const bus = groupOf(k => {
        k.box(0xf1ead6, 0, 0.45, 0, 2.2, 2.3, 8.6); k.box(COL.terracotta, 0, 0.45, 0, 2.22, 0.75, 8.62);
        k.box(GLASS, 0, 1.45, 0, 2.24, 0.85, 8.2); k.box(GLASS, 0, 1.3, 4.3, 1.9, 1.1, 0.04);
        k.box(0xf1ead6, 0, 2.75, 0, 2.0, 0.12, 8.2);
        [ -1, 1 ].forEach(sx => [ 2.8, -2.6 ].forEach(z => wheel(k, sx * 1.02, 0.45, z, 0.45, 0.28)));
    });
    const trafficCar = groupOf(k => car(k, 0xf1efe8));
    // animals: a cow by the tea stall, a dog on the lane
    const cow = new THREE.Group(); cow.position.set(-4.75, 0, 19.7); cow.rotation.y = 0.6; scene.add(cow);
    const cowHead = new THREE.Group(), cowTail = new THREE.Group();
    {
        const hide = 0xeee8dc, shade = 0xd9d0c0, horn = 0x3a2f26;
        const b = new Batch(), k = kit(b);
        k.raw(new THREE.CapsuleGeometry(0.3, 1.0, 4, 10), hide, tf(0, 0.95, 0, 1, 1, 1, 0, Math.PI / 2));
        k.ball(hide, 0, 1.25, 0.38, 0.24, 1, G.ball); k.box(shade, 0, 0.62, 0.62, 0.08, 0.32, 0.35);
        [ [ -0.16, -0.42 ], [ 0.16, -0.42 ], [ -0.16, 0.42 ], [ 0.16, 0.42 ] ].forEach(([ x, z ]) => { k.cyl(hide, x, 0, z, 0.065, 0.8); k.cyl(horn, x, 0, z, 0.06, 0.06); });
        b.build(cow);
        cowHead.position.set(0, 1.1, 0.85); cow.add(cowHead);
        const hb = new Batch(), hk = kit(hb);
        hk.raw(G.box, hide, tf(0, -0.05, 0.13, 0.22, 0.24, 0.44, 0, 0.5)); hk.box(0x8a7d70, 0, -0.32, 0.33, 0.17, 0.13, 0.13);
        [ -1, 1 ].forEach(sd => { hk.raw(G.cone, horn, tf(sd * 0.1, 0.22, 0, 0.07, 0.32, 0.07, 0, -0.3, sd * -0.5)); hk.raw(G.box, shade, tf(sd * 0.16, 0.05, 0.02, 0.17, 0.05, 0.09, 0, 0, sd * 0.3)); });
        hb.build(cowHead);
        cowTail.position.set(0, 1.0, -0.72); cow.add(cowTail);
        const tb = new Batch(); kit(tb).raw(G.cyl, shade, tf(0, -0.32, 0, 0.04, 0.65, 0.04)); tb.build(cowTail);
    }
    const dog = new THREE.Group(); scene.add(dog);
    const dogLegs : THREE.Group[] = [], dogTail = new THREE.Group();
    {
        const fur = 0xc89a5e, dark = 0x8a6440;
        const b = new Batch(), k = kit(b);
        k.raw(new THREE.CapsuleGeometry(0.12, 0.42, 4, 8), fur, tf(0, 0.42, 0, 1, 1, 1, 0, Math.PI / 2));
        k.ball(fur, 0, 0.6, 0.32, 0.12, 1, G.ball); k.box(fur, 0, 0.55, 0.45, 0.1, 0.08, 0.14); k.box(0x222222, 0, 0.57, 0.52, 0.04, 0.04, 0.03);
        [ -1, 1 ].forEach(sd => k.raw(G.cone4, dark, tf(sd * 0.07, 0.72, 0.3, 0.06, 0.1, 0.04)));
        b.build(dog);
        [ [ -0.07, 0.2 ], [ 0.07, 0.2 ], [ -0.07, -0.2 ], [ 0.07, -0.2 ] ].forEach(([ x, z ]) => {
            const leg = new THREE.Group(); leg.position.set(x, 0.36, z); dog.add(leg); dogLegs.push(leg);
            const lb = new Batch(); kit(lb).raw(G.cyl, fur, tf(0, -0.18, 0, 0.05, 0.36, 0.05)); lb.build(leg);
        });
        dogTail.position.set(0, 0.48, -0.28); dog.add(dogTail);
        const tb = new Batch(); kit(tb).raw(G.cyl, fur, tf(0, 0.12, -0.05, 0.035, 0.26, 0.035, 0, -0.5)); tb.build(dogTail);
    }
    // birds wheeling over the lane: two wings each, flapping
    const BIRDS = 14;
    const wingGeo = (sd : number) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([ 0, 0, 0.12, sd * 0.45, 0, -0.02, 0, 0, -0.1 ], 3)); g.computeVertexNormals(); return g; };
    const birdMat = new THREE.MeshStandardMaterial({ color : 0x2f2f2f, roughness : 0.8, side : THREE.DoubleSide });
    const wings = [ new THREE.InstancedMesh(wingGeo(-1), birdMat, BIRDS), new THREE.InstancedMesh(wingGeo(1), birdMat, BIRDS) ];
    wings.forEach(w => { w.frustumCulled = false; scene.add(w); });
    // washing on the lines in the yards
    const clothCount = washing.reduce((a, l) => a + l.n, 0);
    const cloth = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({ color : 0xffffff, roughness : 0.85, side : THREE.DoubleSide }), clothCount);
    cloth.castShadow = true; cloth.frustumCulled = false; scene.add(cloth);
    const CLOTH = [ 0xd9457a, 0xf2c443, 0xf4f2ec, 0x2f7fbf, 0x8a55e6, 0xe8642a, 0x2e9e8a, 0xf4f2ec ];
    for (let i = 0; i < clothCount; i++) cloth.setColorAt(i, _c.setHex(CLOTH[i % CLOTH.length]));
    // the flag over the government office: saffron, white and green
    { const b = new Batch(), k = kit(b); [ 0xff9933, 0xf7f7f2, 0x138808 ].forEach((c, i) => k.box(c, 0.65, -0.27 * (i + 1), 0, 1.3, 0.27, 0.03)); k.raw(G.torus, 0x1f2a6b, tf(0.65, -0.405, 0.02, 0.18, 0.18, 0.18)); b.build(flag); }

    // Everything that never moves is merged and added now.
    STATIC.build(scene); GROUND_B.build(scene, false);
    const lampMeshes = LAMPS.build(scene), duskWindows = DUSKWIN.build(scene);

    // THE STORY, BY SCROLL ============================================================================================
    const _r = new THREE.Vector3();
    const story = (p : number, time : number) => {
        // houses rise storey by storey; their windows light once they are finished and the beat has come
        houses.forEach(h => {
            let top = 0;
            h.storeys.forEach(s => {
                const e = s.grow ? ease(span(p, s.grow[0], s.grow[1])) : 1;
                s.g.visible = e > 0.001; s.g.scale.y = Math.max(0.001, e); s.g.position.y = 0.25 + top;
                if (s.scaff) { s.scaff.visible = !!s.grow && p > s.grow[0] - 0.01 && p < s.grow[1] + 0.02; s.scaff.position.y = 0.25 + top; }
                top += e * h.H;
                const lit = p >= h.light && e >= 0.999;
                s.glass.forEach(m => { m.material = lit ? GLASS_LIT : GLASS; });
            });
            const r = h.roofGrow ? ease(span(p, h.roofGrow[0], h.roofGrow[1])) : 1;
            h.roof.visible = top > 0.01 && r > 0.001; h.roof.position.y = 0.25 + top; h.roof.scale.set(1, Math.max(0.001, r), 1);
            if (h.pile) {
                const g0 = h.storeys[0].grow, k = g0 ? 1 - span(p, g0[0], h.roofGrow ? h.roofGrow[1] : g0[1]) : 0;
                h.pile.visible = k > 0.01; h.pile.scale.setScalar(Math.max(0.01, k));
            }
        });
        const doorOpen = new Map<House, number>();
        doorOpen.set(doors[0].house, smooth(0.29, 0.31, p) * (1 - smooth(0.36, 0.38, p)));

        // March 2015: the lorries come down the factory road; the suits talk at the bank's door by their car
        lorries.forEach(l => follow(l.g, l.stages, p));
        follow(companyCar.g, companyCar.stages, p);
        suits.forEach((s, i) => {
            const k = ease(span(p, 0.3, 0.4)), d = s.from.distanceTo(s.to);
            s.p.root.position.lerpVectors(s.from, s.to, k);
            s.p.root.visible = k < 0.98;
            if (k > 0 && k < 1) { s.p.root.rotation.y = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z); pose(s.p, stride(k * d * 3.4)); }
            else { s.p.root.rotation.y = s.ry; pose(s.p, i === 1 ? { sh : [ 0, -0.9 + (opts.reduced ? 0 : 0.25 * Math.sin(time * 1.8)) ], el : [ -0.1, -1.1 ] } : { sh : [ 0.05, 0.05 ], el : [ -0.15, -0.15 ] }); }
        });

        // June 2017: a family walks from their house to the bank
        const t = ease(span(p, 0.31, 0.53));
        family.forEach(f => {
            const tm = clamp01(t - f.lag), pos = FAMILY_ROUTE.getPointAt(tm), tan = FAMILY_ROUTE.getTangentAt(Math.min(0.995, Math.max(0.005, tm)));
            const ry = Math.atan2(tan.x, tan.z);
            _r.set(-Math.cos(ry), 0, Math.sin(ry)).multiplyScalar(f.side);
            f.p.root.position.set(pos.x + _r.x, 0, pos.z + _r.z);
            if (f.p.root.position.z < 21.0 && Math.abs(f.p.root.position.x + 10.5) < 2.2) f.p.root.position.y = f.p.root.position.z < 19.6 ? 0.25 : 0.47;
            f.p.root.rotation.y = ry;
            f.p.root.visible = p > 0.305;
            pose(f.p, tm > 0.001 && tm < 0.999 ? stride(tm * FAMILY_LEN * 3.2) : STAND);
        });

        // June 2026: the queue at the bank, scooters along the forecourt
        placeQueue((QN + 1) * span(p, 0.56, 0.8), time);
        scooters.forEach((g, i) => { const a = 0.58 + i * 0.028, k = ease(span(p, a, a + 0.03)); g.visible = k > 0.01; g.scale.setScalar(Math.max(0.01, k)); });
        shg.forEach((w, i) => {
            const a = 0.56 + (i - 3) * 0.04, k = i < 3 ? 1 : ease(span(p, a, a + 0.04));
            w.root.visible = k > 0.01; w.root.scale.setScalar(Math.max(0.01, k));
            const talk = opts.reduced ? 0 : Math.sin(time * 2.1 + i * 1.7);
            pose(w, i === 0 ? { sh : [ -0.75, -0.95 ], el : [ -0.8, -0.9 ], bob : -0.78 }
                : i === 5 ? { sh : [ -0.45, -1.1 - 0.25 * talk ], el : [ -0.9, -1.3 ], bob : -0.78 }
                : { sh : [ -0.45, -0.45 ], el : [ -0.95, -0.95 ], bob : -0.78, lean : 0.06 * talk });
        });

        // the close: women step out of their doors
        doorWomen.forEach(({ d, p : w }, i) => {
            const a = 0.86 + i * 0.022, k = ease(span(p, a, a + 0.04));
            doorOpen.set(d.house, Math.max(doorOpen.get(d.house) ?? 0, smooth(a - 0.015, a + 0.005, p)));
            w.root.visible = k > 0.001;
            w.root.position.set(d.x + (i % 2 ? 0.2 : -0.05), lerp(0.25, 0.47, smooth(0.5, 0.65, k)), d.z - 1.25 + 1.25 * k);
            w.root.rotation.y = 0;
            pose(w, k > 0.001 && k < 0.999 ? stride(k * 5) : { sh : [ 0, i % 2 ? -0.35 : 0 ], el : [ -0.15, i % 2 ? -1.6 : -0.15 ] });
        });
        houses.forEach(h => { if (h.door) h.door.rotation.y = -1.4 * (doorOpen.get(h) ?? 0); });
    };

    // THE LIFE OF THE TOWN, BY TIME ===================================================================================
    const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
    const life = (time : number, p : number) => {
        const t = opts.reduced ? 0 : time;
        crowns.forEach((c, i) => { c.rotation.z = Math.sin(t * 0.8 + i) * 0.05; });
        flag.rotation.y = Math.sin(t * 1.1) * 0.3;
        // the crane works while the yard is busy and stands idle by June 2026
        const busy = 1 - span(p, 0.5, 0.62);
        trolley.position.x = lerp(30.4, 22.5 + 7.5 * Math.sin(t * 0.22), busy);
        const hookY = 7.9 - busy * (2.2 + 1.6 * Math.sin(t * 0.37));
        hook.position.y = hookY; cargo.visible = busy > 0.5;
        [ cables, cables2 ].forEach((c, i) => { const L = 8.3 - hookY; c.scale.set(0.04, Math.max(0.01, L), 0.04); c.position.set(i ? 1.0 : -1.0, hookY + L / 2, 0); });
        // smoke from the chimneys
        STACKS.forEach((s, j) => {
            for (let i = 0; i < PUFFS; i++) {
                const ph = ((t * 0.09 + i / PUFFS + j * 0.37) % 1), sc = 0.8 + ph * 2.0;
                _m.compose(_p.set(s.x + ph * 3.2 + Math.sin(ph * 6 + i) * 0.2, s.y + ph * 5.5, s.z - ph * 1.2), _q.identity(), _s.set(sc, sc * 0.8, sc));
                smoke.setMatrixAt(j * PUFFS + i, _m);
            }
        });
        smoke.instanceMatrix.needsUpdate = true;
        // the tea stall, the shops, the gate, the guard, the workers
        pose(chaiwala, { sh : [ -0.4, -1.0 + 0.3 * Math.sin(t * 1.5) ], el : [ -0.9, -0.9 ] });
        benchers.forEach((b, i) => pose(b, { ...SEATED, sh : [ -0.4, -0.9 - 0.35 * Math.max(0, Math.sin(t * 0.7 + i * 2)) ], el : [ -0.9, -1.4 ] }));
        keepers.forEach((k, i) => pose(k, { sh : [ -0.5, -0.5 - 0.15 * Math.sin(t * 0.9 + i) ], el : [ -1.0, -1.0 ] }));
        kids.forEach((k, i) => pose(k, { ...STAND, shz : [ -0.1, 0.1 ], lean : 0.04 * Math.sin(t * 2 + i) }));
        pose(guard, STAND);
        workers.forEach((w, i) => pose(w, { sh : [ -1.0 - 0.2 * Math.sin(t * 1.3 + i), -1.0 - 0.2 * Math.sin(t * 1.3 + i) ], el : [ -0.6, -0.6 ], lean : 0.15 }));
        // the man with the cycle along the lane, a child running round the playground, the swing
        const cx = -38 + ((t * 0.9 + 20) % 46);
        cyclist.root.position.set(cx, 0, 22.1); cyclist.root.rotation.y = Math.PI / 2;
        pose(cyclist, { ...stride(t * 4.2, false), sh : [ -0.9, -0.9 ], el : [ -0.4, -0.4 ] });
        cycle.position.set(cx + 0.35, 0, 22.6); cycle.rotation.y = Math.PI / 2;
        const ra = t * 1.4;
        runner.root.position.set(17.6 + Math.cos(ra) * 1.4, 0, 31.0 + Math.sin(ra) * 1.0); runner.root.rotation.y = Math.atan2(-Math.sin(ra), Math.cos(ra) * 0.7);
        pose(runner, stride(t * 9));
        swing.rotation.x = Math.sin(t * 2.2) * 0.45;
        // traffic on the high road, each lane at one speed so nothing passes through anything
        autos[0].position.set(-64 + ((t * 3.0) % 128), 0, 11.9); autos[0].rotation.y = Math.PI / 2;
        trafficCar.position.set(-64 + ((t * 3.0 + 64) % 128), 0, 11.9); trafficCar.rotation.y = Math.PI / 2;
        autos[1].position.set(64 - ((t * 2.4 + 30) % 128), 0, 13.6); autos[1].rotation.y = -Math.PI / 2;
        bus.position.set(64 - ((t * 2.4 + 92) % 128), 0, 13.6); bus.rotation.y = -Math.PI / 2;
        // the cow chews, the dog trots up and down the lane
        cowHead.rotation.x = 0.35 + 0.12 * Math.sin(t * 2.4); cowTail.rotation.z = 0.3 * Math.sin(t * 1.3);
        const dp = t * 0.35;
        dog.position.set(-6 + 3.2 * Math.sin(dp), 0, 23.3); dog.rotation.y = Math.cos(dp) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        dogLegs.forEach((l, i) => { l.rotation.x = opts.reduced ? 0 : Math.sin(t * 9 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.5; });
        dogTail.rotation.z = 0.5 * Math.sin(t * 12);
        // birds over the lane
        for (let i = 0; i < BIRDS; i++) {
            const a = t * 0.22 + i * 0.45, r = 9 + (i % 4) * 1.6;
            _p.set(-6 + Math.cos(a) * r, 15 + (i % 3) * 0.9 + Math.sin(t * 0.5 + i) * 0.5, 14 + Math.sin(a) * r);
            _m.compose(_p, _q.setFromEuler(_e.set(0, Math.atan2(-Math.sin(a), Math.cos(a)), 0)), _s.set(1.4, 1.4, 1.4));
            const f = Math.sin(t * 9 + i) * 0.6;
            wings[0].setMatrixAt(i, _m2.copy(_m).multiply(new THREE.Matrix4().makeRotationZ(-f)));
            wings[1].setMatrixAt(i, _m2.copy(_m).multiply(new THREE.Matrix4().makeRotationZ(f)));
        }
        wings.forEach(w => { w.instanceMatrix.needsUpdate = true; });
        // washing swaying on the lines
        let n = 0;
        washing.forEach(l => {
            const ux = Math.cos(l.ry), uz = -Math.sin(l.ry);
            for (let j = 0; j < l.n; j++) {
                const o = (j - (l.n - 1) / 2) * 0.55, sway = 0.18 * Math.sin(t * 1.7 + j * 0.8 + l.x);
                const long = j % 3 === 1;
                _m.compose(_p.set(l.x + ux * o, 1.85, l.z + uz * o), _q.setFromEuler(_e.set(sway, l.ry, 0)), _s.set(1, 1, 1));
                _m.multiply(_m2.compose(_p.set(0, long ? -0.36 : -0.26, 0), _q.identity(), _s.set(0.42, long ? 0.72 : 0.5, 0.02)));
                cloth.setMatrixAt(n++, _m);
            }
        });
        cloth.instanceMatrix.needsUpdate = true;
    };

    // LIGHT, BY PROGRESS AND THEME ====================================================================================
    // Dawn on the title, day through the beats, a warmer late light by June 2026. The dark theme sees the town at dusk,
    // its lamps and lit windows glowing.
    interface Sky { sky : number; gnd : number; hemi : number; sun : number; sunI : number; dir : THREE.Vector3; exp : number }
    const DAWN : Sky = { sky : 0xf7e8ee, gnd : 0xcaa98a, hemi : 1.2, sun : 0xffcfa6, sunI : 2.4, dir : new THREE.Vector3(14, 14, 10).normalize(), exp : 1.12 };
    const DAY : Sky = { sky : 0xeef3ff, gnd : 0xc9b48a, hemi : 1.3, sun : 0xfff0d8, sunI : 2.7, dir : new THREE.Vector3(14, 24, 8).normalize(), exp : 1.15 };
    const GOLD : Sky = { sky : 0xf5ecdc, gnd : 0xcdb084, hemi : 1.25, sun : 0xffdcb0, sunI : 2.65, dir : new THREE.Vector3(16, 19, 5).normalize(), exp : 1.15 };
    const DUSK : Sky = { sky : 0x6470b4, gnd : 0x2c2a40, hemi : 1.15, sun : 0xff9a5c, sunI : 1.05, dir : new THREE.Vector3(16, 10, 8).normalize(), exp : 1.0 };
    const _ca = new THREE.Color(), _cb = new THREE.Color(), dir = new THREE.Vector3();
    let dusk = opts.dusk;
    const mixSky = (a : Sky, b : Sky, k : number) => {
        hemi.color.copy(_ca.setHex(a.sky)).lerp(_cb.setHex(b.sky), k);
        hemi.groundColor.copy(_ca.setHex(a.gnd)).lerp(_cb.setHex(b.gnd), k);
        hemi.intensity = lerp(a.hemi, b.hemi, k);
        sun.color.copy(_ca.setHex(a.sun)).lerp(_cb.setHex(b.sun), k);
        sun.intensity = lerp(a.sunI, b.sunI, k);
        dir.copy(a.dir).lerp(b.dir, k).normalize();
        renderer.toneMappingExposure = lerp(a.exp, b.exp, k);
    };
    const light = (p : number, time : number) => {
        if (dusk) mixSky(DUSK, DUSK, 0);
        else if (p < 0.3) mixSky(DAWN, DAY, smooth(0.02, 0.16, p));
        else mixSky(DAY, GOLD, smooth(0.55, 0.72, p));
        const lampsOn = dusk || p > 0.62;
        lampMeshes.forEach(m => { m.material = lampsOn ? LAMP_ON : LAMP_OFF; });
        flickerLamp.material = lampsOn ? LAMP_FLICKER : LAMP_OFF;
        const t = opts.reduced ? 0 : time;
        LAMP_FLICKER.emissiveIntensity = 1.6 * (0.55 + 0.45 * Math.max(Math.sin(t * 13), Math.sin(t * 7.3 + 1), Math.sin(t * 3.1)) * (Math.sin(t * 0.9) > -0.6 ? 1 : 0.2));
        duskWindows.forEach(m => { m.material = dusk ? GLASS_LIT : GLASS; });
    };

    // FRAMING =========================================================================================================
    // The camera rests on the whole town for the title, settles on the companies' side for March 2015, pans along the
    // street to the houses for June 2017, takes in the bank and the street for June 2026 and rests on the households'
    // street at the end.
    const SHOTS = [
        { p : 0,    x : -2.5, z : 0.5,   v : 34, fy : 0.6 },
        { p : 0.07, x : -2.5, z : 0.5,   v : 34, fy : 0.6 },
        { p : 0.17, x : 11.3, z : -12.7, v : 34, fy : 0.6 },
        { p : 0.28, x : 11.3, z : -12.7, v : 34, fy : 0.6 },
        { p : 0.38, x : -4.6, z : 13.1,  v : 30, fy : 0.6 },
        { p : 0.52, x : -4.6, z : 13.1,  v : 30, fy : 0.6 },
        { p : 0.6,  x : -2.3, z : -0.85, v : 31, fy : 0.6 },
        { p : 0.83, x : -2.3, z : -0.85, v : 31, fy : 0.6 },
        { p : 0.91, x : -6.5, z : 22.5,  v : 26, fy : 0.58 },
        { p : 1,    x : -6.5, z : 22.5,  v : 26, fy : 0.58 },
    ];
    let W = 1, H = 1;
    const focus = new THREE.Vector3();
    const frame = (p : number) => {
        let i = 0; while (i < SHOTS.length - 2 && p > SHOTS[i + 1].p) i++;
        const a = SHOTS[i], b = SHOTS[i + 1], k = ease(span(p, a.p, b.p));
        focus.set(lerp(a.x, b.x, k), 0, lerp(a.z, b.z, k));
        const narrow = W < 700, aspect = W / H;
        const v = lerp(a.v, b.v, k) * (narrow ? 1.6 : 1), fy = narrow ? 0.42 : lerp(a.fy, b.fy, k);
        camera.left = -v * aspect / 2; camera.right = v * aspect / 2; camera.top = v * fy; camera.bottom = -v * (1 - fy);
        camera.position.copy(ISO).add(focus); camera.lookAt(focus);
        camera.updateProjectionMatrix();
        sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(dir, 90);
    };

    return {
        render : (progress, time) => {
            const p = clamp01(progress);
            story(p, opts.reduced ? 0 : time);
            life(time, p);
            light(p, time);
            frame(p);
            renderer.render(scene, camera);
        },
        resize : (width, height) => { W = width; H = height; renderer.setSize(width, height, false); },
        setDusk : (d) => { dusk = d; },
        dispose : () => {
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            [ GLASS, GLASS_LIT, LAMP_OFF, LAMP_ON, LAMP_FLICKER, DUSK_GLASS ].forEach(m => m.dispose());
            Object.values(G).forEach(g => g.dispose()); Object.values(LG).forEach(g => g.dispose());
            textures.forEach(t => t.dispose());
            renderer.dispose();
        },
    };
};
