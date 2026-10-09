// The opening's 3D scene: an isometric stretch of Indian farmland running off every edge of the screen. A man farmer
// in a pagdi and dhoti stands at the edge of a wheat field beside a woman farmer in a sari; as the reader scrolls he
// turns, walks along the bank to a building site and becomes a mason laying bricks, and scrolling back reverses it.
// The woman stays. The scene is decoration and carries no number (docs/story-slate.html, "The 3D layer").
//
// createFarmScene builds everything once; render(progress, time) poses the people for a scroll progress from 0 to 1
// and draws a frame. Time only moves the wind in the wheat and the palms, never the story.

// LIB =================================================================================================================
import * as THREE from "three";

export interface TagAnchor { x : number; y : number; shown : boolean; }
export interface FarmScene {
    render  : (progress : number, time : number) => void;
    resize  : (width : number, height : number) => void;
    anchors : () => { man : TagAnchor; woman : TagAnchor };
    dispose : () => void;
}

// The story's beats along the scroll, shared with the page's captions and tags.
export const BEATS = { turn : 0.14, walk : 0.22, arrive : 0.6, mason : 0.64, brick : 0.8 };

const ease = (t : number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
const span = (p : number, a : number, b : number) => clamp01((p - a) / (b - a));

// A repeatable random sequence, so the fields and trees fall in the same places on every visit.
const seeded = (seed : number) => { let q = seed; return () => (q = (q * 16807) % 2147483647) / 2147483647; };

export const createFarmScene = (canvas : HTMLCanvasElement, opts : { narrow : boolean; reduced : boolean }) : FarmScene => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.narrow ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    // the land fades into a pale haze with distance, so the top of the screen reads as sky behind the title
    const HAZE = 0xe9f0ea;
    scene.fog = new THREE.Fog(HAZE, 62, 112);
    renderer.setClearColor(HAZE, 1);
    const rand = seeded(5);

    // The isometric camera: orthographic, looking down the diagonal.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    const ISO = new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(60);

    // LIGHT ===========================================================================================================
    scene.add(new THREE.HemisphereLight(0xeaf3ff, 0xc2ad80, 1.3));
    const sun = new THREE.DirectionalLight(0xffecc8, 2.6);
    sun.position.set(-16, 26, -6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(opts.narrow ? 1536 : 2048, opts.narrow ? 1536 : 2048);
    Object.assign(sun.shadow.camera, { left : -22, right : 22, top : 22, bottom : -22, near : 1, far : 90 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const flat = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.85, metalness : 0, flatShading : true, ...extra });
    const soft = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.7, metalness : 0, ...extra });
    const add = (geo : THREE.BufferGeometry, m : THREE.Material, x : number, y : number, z : number, parent : THREE.Object3D = scene) => {
        const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
    };

    // THE LAND ========================================================================================================
    // The grass, a patchwork of fields with raised edges around the scene's own land, and a village road.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), flat(0xa7c573));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const PATCH = [ 0xd9c35a, 0x8fbf5c, 0xc9a978, 0xb5d07a, 0xe4cf6a, 0x9ac46a, 0xbf9f6c ];
    for (let gx = -6; gx <= 6; gx++) for (let gz = -6; gz <= 6; gz++) {
        const cx = gx * 13, cz = gz * 11;
        if (Math.abs(cx) < 13 && Math.abs(cz) < 12) continue;
        if (Math.abs(cx - 9.5) < 2) continue;
        const w = 10 + rand() * 2, d = 8.5 + rand() * 1.6;
        const f = add(new THREE.BoxGeometry(w, 0.05, d), flat(PATCH[Math.floor(rand() * PATCH.length)]), cx + (rand() - 0.5) * 1.5, 0.025, cz + (rand() - 0.5) * 1.2);
        f.castShadow = false;
        add(new THREE.BoxGeometry(w + 0.5, 0.04, d + 0.5), flat(0xc9ab77), f.position.x, 0.01, f.position.z).castShadow = false;
    }
    add(new THREE.BoxGeometry(2.4, 0.04, 400), flat(0xd6c49c), 9.5, 0.02, 0).castShadow = false;
    // the wheat field's tilled earth, the earth bank across its front, a footpath to the site, an irrigation channel
    add(new THREE.BoxGeometry(12.6, 0.06, 7.4), flat(0xb08e5c), -1.6, 0.03, -2.4);
    add(new THREE.BoxGeometry(14, 0.16, 1.5), flat(0xc9ab77), -1, 0.08, 2.2);
    // a footpath along the far side of the field, where the woman with the basket walks, clear of the man's way to the site
    add(new THREE.BoxGeometry(12.9, 0.05, 0.9), flat(0xd9c39a), -1.55, 0.03, -6.9).castShadow = false;   // ends at the canal's bank
    // the irrigation channel runs the length of the land, off both edges of the screen
    add(new THREE.BoxGeometry(0.7, 0.05, 400), soft(0x6fb3d6, { roughness : 0.2 }), 5.6, 0.03, 0).castShadow = false;
    add(new THREE.BoxGeometry(0.9, 0.12, 400), flat(0xa88a5c), 5.6, -0.02, 0).castShadow = false;

    // THE WHEAT =======================================================================================================
    // Thin stalks with long golden ears and awns, instanced; a vertex-shader wind bends each stalk by its height.
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
    const N = opts.narrow ? 8000 : 13000;
    const wheat = new THREE.InstancedMesh(stalkGeo, wheatMat, N);
    const dummy = new THREE.Object3D(), tint = new THREE.Color();
    let w = 0;
    for (let i = 0; i < N * 3 && w < N; i++) {
        dummy.position.set(-7.8 + rand() * 12.4, 0.05, -6 + rand() * 7.2);
        dummy.rotation.set((rand() - 0.5) * 0.1, rand() * Math.PI * 2, (rand() - 0.5) * 0.1);
        const s = 0.85 + rand() * 0.35; dummy.scale.set(s, s * (0.9 + rand() * 0.2), s);
        dummy.updateMatrix(); wheat.setMatrixAt(w, dummy.matrix);
        tint.setHSL(0.11 + rand() * 0.025, 0.45 + rand() * 0.2, 0.74 + rand() * 0.18); wheat.setColorAt(w, tint);
        w++;
    }
    wheat.count = w; wheat.receiveShadow = true; scene.add(wheat);

    // TREES AND A HUT =================================================================================================
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
    const crowns : THREE.Group[] = [];
    const palm = (x : number, z : number, s = 1, lean = 1, rot = 0) => {
        const g = new THREE.Group();
        const curve = new THREE.CatmullRomCurve3([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2 * lean, 1.8, 0), new THREE.Vector3(0.6 * lean, 3.6, 0), new THREE.Vector3(1.1 * lean, 5.2, 0) ]);
        const tube = new THREE.TubeGeometry(curve, 20, 0.14, 7, false);
        const tp = tube.attributes.position;
        for (let i = 0; i < tp.count; i++) {
            const yy = clamp01(tp.getY(i) / 5.2), c = curve.getPoint(yy), k = 1 - yy * 0.35;
            tp.setX(i, c.x + (tp.getX(i) - c.x) * k); tp.setZ(i, c.z + (tp.getZ(i) - c.z) * k);
        }
        tube.computeVertexNormals();
        add(tube, flat(0x8a6c48), 0, 0, 0, g);
        const crown = new THREE.Group(); crown.position.copy(curve.getPoint(1)); g.add(crown);
        for (let k = 0; k < 11; k++) {
            const f = add(frondGeo, flat(k % 2 ? 0x3f8d3b : 0x56a447, { side : THREE.DoubleSide }), 0, 0, 0, crown);
            f.rotation.set(0, (k / 11) * Math.PI * 2, (rand() - 0.5) * 0.3);
        }
        for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.12, 8, 6), flat(0x6f8a3a), Math.cos(i * 1.6) * 0.17, -0.18, Math.sin(i * 1.6) * 0.17, crown);
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
    palm(8.9, -7.4, 1.05, -1, 0.4); palm(9.0, 1.5, 0.95, -0.8, -0.5); palm(-8.2, -1.2, 0.68, 0.8, 1.2);
    mango(9.4, 6.6, 1.05); mango(2.2, 7.4, 0.85);
    for (let i = 0; i < 46; i++) {
        const x = (rand() - 0.5) * 120, z = (rand() - 0.5) * 110;
        if (Math.abs(x) < 12 && Math.abs(z) < 11) continue;
        if (Math.abs(x - 7.15) < 2.5) continue;                     // keep the cart track clear
        if (rand() < 0.55) palm(x, z, 0.8 + rand() * 0.4, rand() < 0.5 ? 1 : -1, rand() * 6); else mango(x, z, 0.8 + rand() * 0.5);
    }
    for (let z = -60; z <= 60; z += 9) if (Math.abs(z) > 10) palm(11.4, z + rand() * 2, 0.85, -0.7, rand() * 6);
    // a mud hut with a thatched roof, a stack of sheaves and a charpoy
    const hut = new THREE.Group(); hut.position.set(3.4, 0, 5.2); scene.add(hut);
    add(new THREE.CylinderGeometry(1.0, 1.05, 1.3, 10), flat(0xc79a68), 0, 0.65, 0, hut);
    add(new THREE.ConeGeometry(1.45, 1.2, 10), flat(0xd9b45e), 0, 1.85, 0, hut);
    add(new THREE.BoxGeometry(0.42, 0.8, 0.06), flat(0x5c4024), 0, 0.42, 1.02, hut);
    add(new THREE.ConeGeometry(0.45, 0.9, 7), flat(0xe2c065), 1.9, 0.45, 6.4);
    const charpoy = new THREE.Group(); charpoy.position.set(4.9, 0, 6.6); charpoy.rotation.y = 0.5; scene.add(charpoy);
    add(new THREE.BoxGeometry(1.2, 0.06, 0.6), flat(0xd8c49a), 0, 0.42, 0, charpoy);
    ([ [ -0.55, -0.26 ], [ 0.55, -0.26 ], [ -0.55, 0.26 ], [ 0.55, 0.26 ] ] as const).forEach(([ a, b ]) => add(new THREE.BoxGeometry(0.06, 0.42, 0.06), flat(0x7a5634), a, 0.21, b, charpoy));

    // THE BUILDING SITE ===============================================================================================
    // in the left corner: a half-built house with columns, part-built brick walls, scaffolding, bricks, sand, a mixer
    const site = new THREE.Group(); site.position.set(-6.4, 0, 6.6); scene.add(site);
    const concrete = flat(0xd3cdc1), brick = flat(0xb9573a), steel = flat(0x8d97a1);
    add(new THREE.BoxGeometry(3.8, 0.2, 3.2), concrete, 0, 0.1, 0, site);
    ([ [ -1.7, -1.4 ], [ 1.7, -1.4 ], [ -1.7, 1.4 ], [ 1.7, 1.4 ] ] as const).forEach(([ a, b ]) => add(new THREE.BoxGeometry(0.25, 2.6, 0.25), concrete, a, 1.4, b, site));
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) { if (r > 3 && c > 3) continue; add(new THREE.BoxGeometry(0.44, 0.2, 0.2), brick, -1.4 + c * 0.46 + (r % 2) * 0.23, 0.31 + r * 0.21, -1.4, site); }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) add(new THREE.BoxGeometry(0.2, 0.2, 0.44), brick, -1.7, 0.31 + r * 0.21, -1.0 + c * 0.46 + (r % 2) * 0.23, site);
    for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 4), steel, -2.05, 1.7, -1.4 + i * 0.95, site);
    for (let j = 0; j < 3; j++) add(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 4), steel, -2.05, 0.7 + j * 1.1, 0, site).rotation.x = Math.PI / 2;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) add(new THREE.BoxGeometry(0.44, 0.2, 0.9), brick, 1.0 + c * 0.46 + r * 0.23, 0.3 + r * 0.21, 2.3, site);
    add(new THREE.ConeGeometry(0.6, 0.55, 8), flat(0xdcc38f), -1.0, 0.27, 2.2, site);
    // the brick the mason lays on the top course
    const newBrick = add(new THREE.BoxGeometry(0.2, 0.2, 0.44), brick, -4.75, 0.74, 5.0); newBrick.visible = false;

    // the mess of a working site: patches of dug earth, mounds of dirt, cement bags, bricks lying about
    const siteRand = seeded(11);
    const dirt = flat(0x9c7b52), dirtLight = flat(0xb89668);
    ([ [ -4.6, 4.2, 1.4 ], [ -7.4, 4.6, 1.1 ], [ -4.2, 8.0, 1.2 ], [ -8.3, 8.4, 0.9 ] ] as const).forEach(([ x, z, r ], i) => {
        const patch = add(new THREE.CylinderGeometry(r, r * 1.1, 0.04, 9), i % 2 ? dirtLight : dirt, x, 0.02, z); patch.scale.z = 0.7; patch.castShadow = false;
    });
    ([ [ -3.4, 6.8, 0.5 ], [ -8.6, 5.6, 0.42 ], [ -5.0, 8.7, 0.36 ] ] as const).forEach(([ x, z, r ]) => add(new THREE.SphereGeometry(r, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), dirt, x, 0, z).scale.y = 0.55);
    // cement bags: grey sacks, a band printed across each, stacked in two layers and a few lying loose
    const bagGeo = new THREE.BoxGeometry(0.55, 0.16, 0.36, 2, 1, 2);
    const bp = bagGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i), y = bp.getY(i); if (y > 0) bp.setY(i, y * (1 - Math.abs(x) * 0.6 - Math.abs(z) * 0.5)); }
    bagGeo.computeVertexNormals();
    const bagMat = flat(0xc9c7c0), bandMat = flat(0x2f6fbf);
    const bag = (x : number, y : number, z : number, rot : number) => {
        const b = add(bagGeo, bagMat, x, y, z); b.rotation.y = rot;
        add(new THREE.BoxGeometry(0.12, 0.165, 0.37), bandMat, 0, 0, 0, b);
    };
    [ [ 0, 0, 0 ], [ 0.58, 0, 0 ], [ 0, 0, 0.4 ], [ 0.58, 0, 0.4 ], [ 0.29, 0.16, 0.2 ], [ 0.29, 0.16, 0.6 ] ].forEach(([ dx, dy, dz ]) => bag(-6.6 + dx, 0.08 + dy, 8.6 + dz, 0.05));
    bag(-3.3, 0.08, 6.0, 0.6); bag(-3.6, 0.08, 7.7, -0.4);
    // a second pile where the mixer stood: three, two, one
    [ [ 0, 0, 0 ], [ 0.58, 0, 0 ], [ 0, 0, 0.4 ], [ 0.29, 0.16, 0 ], [ 0.29, 0.16, 0.4 ], [ 0.15, 0.32, 0.2 ] ].forEach(([ dx, dy, dz ]) => bag(-8.6 + dx, 0.08 + dy, 8.9 + dz, -0.08));
    // loose bricks scattered round the site, some on edge
    for (let i = 0; i < 26; i++) {
        const x = -9 + siteRand() * 6.2, z = 3.6 + siteRand() * 5.4;
        if (x > -8.3 && x < -4.5 && z > 5.2 && z < 8.0) continue;           // inside the house
        if (Math.abs(x + 3.9) < 0.5 && Math.abs(z - 5.0) < 0.5) continue;    // where the mason stands
        const b = add(new THREE.BoxGeometry(0.44, 0.2, 0.2), brick, x, 0.1, z);
        b.rotation.set(siteRand() < 0.25 ? Math.PI / 2 : 0, siteRand() * Math.PI, 0);
    }
    // a shovel stuck in the dirt mound
    const shovel = new THREE.Group(); shovel.position.set(-3.4, 0.2, 6.8); shovel.rotation.set(0.25, 0.4, 0.15); scene.add(shovel);
    add(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), flat(0x7a5634), 0, 0.5, 0, shovel);
    add(new THREE.BoxGeometry(0.22, 0.26, 0.02), flat(0x8d97a1, { metalness : 0.5 }), 0, -0.05, 0, shovel);

    // THE BULLOCK CART =================================================================================================
    // On a track down the right of the farm: a pair of white zebu bullocks with humps and horns, yoked to a two-wheeled wooden cart
    // piled with wheat sheaves, a woman driving from the front. It rolls down the track past the farm and round again.
    const cart = new THREE.Group(); scene.add(cart);
    const wood = flat(0x7a5634), woodDark = flat(0x5c4024), hide = flat(0xeee8dc), hideShade = flat(0xd9d0c0), horn = flat(0x3a2f26);
    // the cart: bed, side rails with posts, the shaft to the yoke, two big spoked wheels
    add(new THREE.BoxGeometry(1.4, 0.08, 2.2), wood, 0, 1.0, 0, cart);
    [ -0.68, 0.68 ].forEach(x => {
        add(new THREE.BoxGeometry(0.05, 0.05, 2.2), woodDark, x, 1.35, 0, cart);
        for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(0.04, 0.35, 0.04), woodDark, x, 1.18, -1.0 + k * 0.4, cart);
    });
    add(new THREE.BoxGeometry(0.1, 0.08, 2.4), wood, 0, 0.95, 2.2, cart);
    const wheels : THREE.Group[] = [];
    [ -0.82, 0.82 ].forEach(x => {
        const wh = new THREE.Group(); wh.position.set(x, 0.62, -0.1); cart.add(wh); wheels.push(wh);
        add(new THREE.TorusGeometry(0.6, 0.05, 6, 20), woodDark, 0, 0, 0, wh).rotation.y = Math.PI / 2;
        for (let k = 0; k < 8; k++) { const sp = add(new THREE.BoxGeometry(0.03, 1.15, 0.04), wood, 0, 0, 0, wh); sp.rotation.x = (k / 8) * Math.PI; }
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 10), woodDark, 0, 0, 0, wh).rotation.z = Math.PI / 2;
    });
    add(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), woodDark, 0, 0.62, -0.1, cart).rotation.z = Math.PI / 2;
    // the load: sheaves of wheat stacked in a rounded heap
    for (let i = 0; i < 26; i++) {
        const a = siteRand(), b = siteRand(), layer = Math.floor(i / 9);
        const sh = add(new THREE.CylinderGeometry(0.11, 0.09, 0.6, 7), flat(i % 3 ? 0xd9b45a : 0xe4c467), (a - 0.5) * (1.1 - layer * 0.3), 1.2 + layer * 0.2, (b - 0.5) * (1.8 - layer * 0.4), cart);
        sh.rotation.set(Math.PI / 2, 0, (siteRand() - 0.5) * 0.8);
    }
    // the yoke across the bullocks' necks
    add(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 6), woodDark, 0, 1.08, 3.35, cart).rotation.z = Math.PI / 2;
    // a zebu bullock: body, hump, dewlap, head with horns and ears, four legs on hip pivots, a tail
    const bullLegs : THREE.Group[] = [];
    const bullock = (x : number) => {
        const g = new THREE.Group(); g.position.set(x, 0, 3.7); g.rotation.y = Math.PI; cart.add(g);
        const body = add(new THREE.CapsuleGeometry(0.28, 1.0, 4, 10), hide, 0, 0.92, 0, g); body.rotation.x = Math.PI / 2;
        add(new THREE.SphereGeometry(0.22, 10, 8), hide, 0, 1.22, -0.38, g).scale.set(0.9, 1.0, 1.1);
        add(new THREE.BoxGeometry(0.08, 0.3, 0.35), hideShade, 0, 0.72, -0.62, g);
        const head = new THREE.Group(); head.position.set(0, 1.08, -0.82); g.add(head);
        add(new THREE.BoxGeometry(0.2, 0.22, 0.42), hide, 0, -0.04, -0.12, head).rotation.x = 0.5;
        add(new THREE.BoxGeometry(0.16, 0.12, 0.12), flat(0x8a7d70), 0, -0.2, -0.33, head);
        [ -1, 1 ].forEach(sd => {
            const hn = add(new THREE.ConeGeometry(0.035, 0.32, 6), horn, sd * 0.1, 0.18, 0.04, head); hn.rotation.set(-0.3, 0, sd * -0.5);
            add(new THREE.BoxGeometry(0.16, 0.05, 0.08), hideShade, sd * 0.15, 0.04, 0.05, head).rotation.z = sd * 0.3;
        });
        [ [ -0.15, -0.42 ], [ 0.15, -0.42 ], [ -0.15, 0.42 ], [ 0.15, 0.42 ] ].forEach(([ lx, lz ]) => {
            const hip = new THREE.Group(); hip.position.set(lx, 0.78, lz); g.add(hip); bullLegs.push(hip);
            add(new THREE.CylinderGeometry(0.07, 0.05, 0.74, 6), hide, 0, -0.37, 0, hip);
            add(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 6), horn, 0, -0.75, 0, hip);
        });
        const tail = add(new THREE.CylinderGeometry(0.02, 0.012, 0.6, 5), hideShade, 0, 0.7, 0.68, g); tail.rotation.x = 0.25;
    };
    bullock(-0.42); bullock(0.42);
    cart.rotation.y = 0;            // facing down the track, towards the reader
    const track = add(new THREE.BoxGeometry(2.1, 0.045, 80), flat(0xd6c49c), 7.15, 0.022, 0); track.castShadow = false;
    cart.scale.setScalar(0.95);

    // THE PEOPLE ======================================================================================================
    // Figures with real proportions (head about one-seventh of the height); hips, knees, shoulders and elbows pivot.
    const SKIN = 0xa86f45, SKIN_D = 0x8f5a36, HAIR = 0x1d140e;
    interface Spec {
        leg : number; foot : number; shin ? : number; top : number; sleeve ? : number; forearm ? : number;
        dhoti ? : number; kurta ? : boolean; sari ? : number; border ? : number; vest ? : number; gamcha ? : number; pallu ? : number;
        pagdi ? : number; hardhat ? : number; veil ? : number; hair ? : boolean; moustache ? : boolean; bindi ? : boolean; nosering ? : boolean; bangles ? : boolean;
        axe ? : boolean; trowel ? : boolean; sickle ? : boolean; sheaf ? : boolean;
    }
    interface Person { root : THREE.Group; body : THREE.Group; upper : THREE.Group; legs : { hip : THREE.Group; knee : THREE.Group }[]; arms : { sh : THREE.Group; el : THREE.Group }[]; }
    const limb = (len : number, r0 : number, r1 : number, color : number) => { const g = new THREE.CylinderGeometry(r1, r0, len, 7, 1); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, soft(color)); };
    const figure = (spec : Spec) : Person => {
        const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
        const WAIST = 0.95;
        const upper = new THREE.Group(); upper.position.set(0, WAIST, 0); body.add(upper);
        // parts go on the body until the lower garments are done, then on the upper body; y is given from the feet
        let into : THREE.Object3D = body;
        const put = <T extends THREE.Object3D>(o : T, x : number, y : number, z : number, parent ? : THREE.Object3D) : T => {
            const pa = parent ?? into; o.position.set(x, pa === upper ? y - WAIST : y, z); pa.add(o); return o;
        };
        const legs = [ -0.095, 0.095 ].map(x => {
            const hip = put(new THREE.Group(), x, 0.9, 0);
            put(limb(0.44, 0.07, 0.055, spec.leg), 0, 0, 0, hip);
            const knee = put(new THREE.Group(), 0, -0.44, 0, hip);
            put(limb(0.42, 0.05, 0.04, spec.shin ?? spec.leg), 0, 0, 0, knee);
            put(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.22), soft(spec.foot)), 0, -0.44, 0.05, knee);
            return { hip, knee };
        });
        if (spec.dhoti !== undefined) {
            // a dhoti: white cloth wrapped to below the knee and drawn in between the legs, with a front pleat
            const d = new THREE.CylinderGeometry(0.2, 0.23, 0.62, 12, 3); const dp = d.attributes.position;
            for (let i = 0; i < dp.count; i++) { const yy = dp.getY(i); if (yy < 0) dp.setZ(i, dp.getZ(i) * (1 - (-yy / 0.31) * 0.3)); }
            d.computeVertexNormals();
            put(new THREE.Mesh(d, soft(spec.dhoti)), 0, 0.62, 0);
            put(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.02), soft(0xe6dfcf)), 0.02, 0.62, 0.19);
        }
        if (spec.sari !== undefined) {
            // a sari skirt: pleated, to the ankle, with a coloured border at the hem
            const k = new THREE.CylinderGeometry(0.17, 0.3, 0.92, 18, 4); const kp = k.attributes.position;
            for (let i = 0; i < kp.count; i++) { const a = Math.atan2(kp.getZ(i), kp.getX(i)), r = Math.hypot(kp.getX(i), kp.getZ(i)), f = 1 + 0.05 * Math.sin(a * 9); kp.setX(i, Math.cos(a) * r * f); kp.setZ(i, Math.sin(a) * r * f); }
            k.computeVertexNormals();
            put(new THREE.Mesh(k, soft(spec.sari)), 0, 0.5, 0);
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.31, 0.07, 18), soft(spec.border ?? spec.sari)), 0, 0.075, 0);
        }
        into = upper;
        // the torso: a long kurta, a shirt under a vest, or a blouse
        const torsoLen = spec.kurta ? 0.72 : 0.5;
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.19, spec.kurta ? 0.24 : 0.16, torsoLen, 12), soft(spec.top)), 0, 1.45 - torsoLen / 2 + 0.02, 0).scale.z = 0.72;
        put(new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), soft(spec.top)), 0, 1.44, 0).scale.set(1, 0.45, 0.72);
        if (spec.vest !== undefined) {
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.5, 12, 1, true), soft(spec.vest, { side : THREE.DoubleSide })), 0, 1.2, 0).scale.z = 0.76;
            [ 1.08, 1.28 ].forEach(y => { put(new THREE.Mesh(new THREE.CylinderGeometry(0.203, 0.203, 0.035, 12, 1, true), soft(0xf4f1e6, { side : THREE.DoubleSide })), 0, y, 0).scale.z = 0.77; });
        }
        if (spec.gamcha !== undefined) {
            // a red cotton towel over the left shoulder
            put(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.025), soft(spec.gamcha)), -0.06, 1.17, 0.15).rotation.z = -0.55;
            put(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.025), soft(spec.gamcha)), -0.17, 1.28, -0.14);
        }
        if (spec.pallu !== undefined) {
            // the pallu: the sari's loose end, across the chest to the left shoulder and down the back
            put(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.66, 0.025), soft(spec.pallu)), -0.02, 1.18, 0.12).rotation.z = -0.6;
            // down the back it is a curved drape that follows the torso, narrowing towards the hip
            const drape = put(new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.18, 0.62, 14, 1, true, Math.PI - 0.7, 1.15), soft(spec.pallu, { side : THREE.DoubleSide })), -0.02, 1.15, 0);
            drape.scale.z = 0.76;
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.05, 12), soft(SKIN)), 0, 0.97, 0).scale.z = 0.72;
        }
        const arms = [ -1, 1 ].map(side => {
            const sh = put(new THREE.Group(), side * 0.235, 1.4, 0);
            put(limb(0.3, 0.055, 0.045, spec.sleeve ?? spec.top), 0, 0, 0, sh);
            const el = put(new THREE.Group(), 0, -0.3, 0, sh);
            put(limb(0.27, 0.04, 0.032, spec.forearm ?? SKIN), 0, 0, 0, el);
            put(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), soft(SKIN)), 0, -0.3, 0, el).scale.set(0.8, 1.2, 0.6);
            if (spec.bangles) [ -0.22, -0.25 ].forEach(y => { put(new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 4, 10), soft(y < -0.23 ? 0xd4202c : 0x2e9e6a)), 0, y, 0, el).rotation.x = Math.PI / 2; });
            return { sh, el };
        });
        // neck and head: nose, eyes, eyebrows, ears, mouth
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), soft(SKIN)), 0, 1.5, 0);
        const head = put(new THREE.Group(), 0, 1.64, 0);
        put(new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), soft(SKIN)), 0, 0, 0, head).scale.set(0.92, 1.08, 1);
        put(new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 6), soft(SKIN_D)), 0, -0.01, 0.115, head).rotation.x = Math.PI / 2;
        [ -1, 1 ].forEach(sd => {
            put(new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), soft(0x140d08)), sd * 0.04, 0.02, 0.1, head);
            put(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), soft(HAIR)), sd * 0.042, 0.048, 0.104, head).rotation.z = -sd * 0.12;
            put(new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), soft(SKIN)), sd * 0.108, 0.0, 0, head).scale.set(0.5, 1, 0.8);
        });
        put(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.007, 0.01), soft(0x7a3f2a)), 0, -0.07, 0.102, head);
        if (spec.moustache) put(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 4, 8, Math.PI), soft(HAIR)), 0, -0.05, 0.103, head).rotation.z = Math.PI;
        if (spec.bindi) put(new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), soft(0xd4202c)), 0, 0.07, 0.108, head);
        if (spec.nosering) put(new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 4, 10), soft(0xe6b83e, { metalness : 0.6, roughness : 0.3 })), 0.016, -0.03, 0.118, head);
        if (spec.hair) {
            put(new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), soft(HAIR)), 0, 0.012, -0.005, head).scale.set(0.95, 1.05, 1.02);
            put(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), soft(HAIR)), 0, -0.02, -0.12, head);
        }
        // headwear: a pagdi wound in layers with a loose tail; a hard hat; or the pallu over the head, face open
        if (spec.pagdi !== undefined) {
            for (let i = 0; i < 4; i++) put(new THREE.Mesh(new THREE.TorusGeometry(0.105 - i * 0.012, 0.035, 8, 18), soft(spec.pagdi)), 0, 0.06 + i * 0.034, -0.005, head).rotation.x = Math.PI / 2 + (i % 2 ? 0.12 : -0.08);
            put(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), soft(spec.pagdi)), 0, 0.15, -0.005, head).scale.y = 0.6;
            put(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.02), soft(spec.pagdi)), 0.05, -0.04, -0.13, head).rotation.z = 0.15;
        }
        if (spec.hardhat !== undefined) {
            put(new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), soft(spec.hardhat, { roughness : 0.45 })), 0, 0.045, 0, head);
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 18), soft(spec.hardhat, { roughness : 0.45 })), 0, 0.045, 0.02, head);
        }
        if (spec.veil !== undefined) {
            const veil = put(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.72), soft(spec.veil, { side : THREE.DoubleSide })), 0, 0.005, -0.02, head);
            veil.scale.set(1.0, 1.05, 1.08); veil.rotation.x = -0.15;
        }
        // what each one holds
        const handR = new THREE.Group(); handR.position.set(0, -0.3, 0); arms[1].el.add(handR);
        const handL = new THREE.Group(); handL.position.set(0, -0.3, 0); arms[0].el.add(handL);
        const metal = (c : number) => soft(c, { metalness : 0.6, roughness : 0.35 });
        if (spec.axe) {
            const axe = new THREE.Group(); axe.rotation.x = -1.05; handR.add(axe);
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.85, 6), soft(0x7a5634)), 0, 0.3, 0, axe);
            put(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.17), metal(0xa9b1b8)), 0, 0.68, -0.08, axe);
        }
        if (spec.trowel) {
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), soft(0x7a5634)), 0, -0.02, 0.04, handR).rotation.x = Math.PI / 2;
            put(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.09, 0.16), metal(0xbac2c9)), 0, -0.05, 0.15, handR);
        }
        if (spec.sickle) {
            put(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.12, 6), soft(0x7a5634)), 0, -0.03, 0, handR);
            put(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 4, 14, Math.PI * 1.2), metal(0xb9c0c6)), 0, 0.08, 0.04, handR).rotation.set(0, Math.PI / 2, 0.4);
        }
        if (spec.sheaf) {
            const sh = new THREE.Group(); sh.position.set(0, 0.02, 0.03); sh.rotation.x = -0.4; handL.add(sh);
            for (let i = 0; i < 14; i++) {
                const st = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.5, 3), soft(0xd9b45a)); st.position.set((rand() - 0.5) * 0.06, 0.15, (rand() - 0.5) * 0.06); st.rotation.z = (rand() - 0.5) * 0.25; sh.add(st);
                const e = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, 0.1, 5), soft(0xe8c25e)); e.position.set(st.position.x * 2.4, 0.43, st.position.z * 2.4); sh.add(e);
            }
            const tie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 4, 10), soft(0x7a5634)); tie.rotation.x = Math.PI / 2; tie.position.y = 0.08; sh.add(tie);
        }
        root.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
        return { root, body, upper, legs, arms };
    };
    const farmer = figure({ leg : SKIN, foot : 0x5c3b22, dhoti : 0xf3efe4, kurta : true, top : 0xf6f1e3, sleeve : 0xf6f1e3, forearm : 0xf6f1e3, gamcha : 0xc8402e, moustache : true, pagdi : 0xf2a12e, axe : true });
    const carter = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0x2f7fbf, border : 0xf2c443, top : 0xc8402e, sleeve : 0xc8402e, pallu : 0x25689e, veil : 0x25689e, hair : true, bindi : true, bangles : true });
    carter.root.position.set(0, 0.32, 0.95); carter.root.rotation.y = 0; carter.root.scale.setScalar(0.9); cart.add(carter.root);
    carter.legs.forEach(l => { l.hip.rotation.x = -1.5; l.knee.rotation.x = 1.4; });
    carter.arms.forEach(a => { a.sh.rotation.x = -0.9; a.el.rotation.x = -0.6; });
    const mason = figure({ leg : 0x59626c, foot : 0x3e2c1e, top : 0x4f7fb8, sleeve : 0x4f7fb8, vest : 0xf28c28, moustache : true, hardhat : 0xf2c21b, trowel : true });
    const woman = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0xe8642a, border : 0xf2c443, top : 0x2e8f5e, sleeve : 0x2e8f5e, pallu : 0xd8521e, veil : 0xd8521e, hair : true, bindi : true, nosering : true, bangles : true, sickle : true, sheaf : true });
    [ farmer, mason, woman ].forEach(p => { p.root.scale.setScalar(1.35); scene.add(p.root); });
    woman.root.position.set(1.2, 0.16, 1.75); woman.root.rotation.y = 2.6;
    // the sheaves she has cut, lying on the bank behind her
    ([ [ 1.9, 2.4, 0.3 ], [ 2.5, 2.2, -0.4 ], [ 0.5, 2.6, 0.9 ] ] as const).forEach(([ x, z, r ]) => {
        const sh = new THREE.Group(); sh.position.set(x, 0.2, z); sh.rotation.set(0, r, Math.PI / 2); scene.add(sh);
        add(new THREE.CylinderGeometry(0.09, 0.07, 0.55, 8), flat(0xd9b45a), 0, 0, 0, sh);
        add(new THREE.CylinderGeometry(0.13, 0.09, 0.2, 8), flat(0xe8c25e), 0, 0.35, 0, sh);
        add(new THREE.TorusGeometry(0.085, 0.015, 4, 10), flat(0x7a5634), 0, 0.05, 0, sh).rotation.x = Math.PI / 2;
    });
    // a second woman harvesting further along the field's edge, in a yellow sari
    const woman2 = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0xe9b628, border : 0xc8402e, top : 0x7a3f8f, sleeve : 0x7a3f8f, pallu : 0xd99a1c, veil : 0xd99a1c, hair : true, bindi : true, bangles : true, sickle : true, sheaf : true });
    woman2.root.scale.setScalar(1.35); woman2.root.position.set(3.4, 0.16, 1.7); woman2.root.rotation.y = 2.75; scene.add(woman2.root);
    // a woman carrying a basket of cut wheat on her head, walking the footpath behind the field
    const porter = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0xd9457a, border : 0x2e9e6a, top : 0x2e8f5e, sleeve : 0x2e8f5e, pallu : 0xc23a6b, veil : 0xc23a6b, hair : true, bindi : true, bangles : true });
    porter.root.scale.setScalar(1.35); scene.add(porter.root);
    const basket = new THREE.Group(); basket.position.set(0, 1.86 - 0.95, 0); porter.upper.add(basket);
    add(new THREE.TorusGeometry(0.07, 0.025, 6, 12), soft(0xc8402e), 0, 0, 0, basket).rotation.x = Math.PI / 2;   // the head pad
    add(new THREE.CylinderGeometry(0.26, 0.15, 0.17, 12, 1, true), flat(0xb5874a, { side : THREE.DoubleSide }), 0, 0.1, 0, basket);
    add(new THREE.TorusGeometry(0.26, 0.018, 4, 16), flat(0x8d6430), 0, 0.185, 0, basket).rotation.x = Math.PI / 2;
    for (let i = 0; i < 9; i++) add(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 6), flat(i % 2 ? 0xd9b45a : 0xe4c467), Math.cos(i * 0.7) * 0.12, 0.25, Math.sin(i * 0.7) * 0.12, basket).rotation.set(Math.PI / 2, i * 0.7, 0.3);
    // her right arm steadies the basket, the left swings as she walks
    porter.arms[1].sh.rotation.set(-2.85, 0, -0.35); porter.arms[1].el.rotation.x = -0.35;

    // Harvesting, in three movements per stroke: reach down and gather the stalks with the left hand, draw the sickle
    // across with the right, then lift the cut handful and straighten a little. The bend is at the waist and knees;
    // the skirt stays upright.
    const smoothstep = (a : number, b : number, x : number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    const harvestPose = (p : Person, c : number) => {
        const reach = smoothstep(0, 0.35, c) * (1 - smoothstep(0.7, 1, c));
        const sweep = smoothstep(0.35, 0.62, c) * (1 - smoothstep(0.75, 1, c));
        p.upper.rotation.x = 0.35 + 0.4 * reach;
        p.legs.forEach(l => { l.hip.rotation.x = -0.18 * reach; l.knee.rotation.x = 0.3 * reach; });
        p.body.position.y = -0.04 * reach;
        p.arms[0].sh.rotation.x = -0.5 - 0.7 * reach; p.arms[0].el.rotation.x = -0.25 - 0.3 * (1 - reach);
        p.arms[1].sh.rotation.x = -0.45 - 0.5 * reach; p.arms[1].el.rotation.x = -0.6;
        p.arms[1].sh.rotation.z = 0.5 - 0.95 * sweep;
    };
    // she walks one way along the footpath on the far side of the field, towards the canal, and starts again from the far
    // end; the man's walk to the site is on the near side, so their paths never cross
    const PORTER_PATH = [ new THREE.Vector3(-7.4, 0.05, -6.9), new THREE.Vector3(4.7, 0.05, -6.9) ];
    const harvest = (time : number) => {
        harvestPose(woman, opts.reduced ? 0.3 : (time % 3) / 3);
        harvestPose(woman2, opts.reduced ? 0.55 : ((time + 1.4) % 3.4) / 3.4);
        const k = opts.reduced ? 0.35 : (time / 24) % 1, [ a0, b0 ] = PORTER_PATH;
        porter.root.position.lerpVectors(a0, b0, k);
        porter.root.rotation.y = Math.atan2(b0.x - a0.x, b0.z - a0.z);
        // she fades in at the start and out at the end, so the walk begins again without a jump
        porter.root.visible = k > 0.015 && k < 0.985;
        const ph = opts.reduced ? 0 : time * 6, sw = Math.sin(ph);
        porter.legs[0].hip.rotation.x = sw * 0.35; porter.legs[1].hip.rotation.x = -sw * 0.35;
        porter.legs[0].knee.rotation.x = Math.max(0, -sw) * 0.5; porter.legs[1].knee.rotation.x = Math.max(0, sw) * 0.5;
        porter.arms[0].sh.rotation.x = -sw * 0.3;
        porter.body.position.y = Math.abs(Math.cos(ph)) * 0.02;
    };

    // THE STORY, BY SCROLL ============================================================================================
    // he walks in a straight line from his place on the bank into the open side of the building, in full view
    const SPOT = new THREE.Vector3(-2.9, 0.16, 2.2);
    const WORK = new THREE.Vector3(-3.9, 0.02, 5.0);
    // the low wall he builds, just in front of the house, on the side that faces the reader
    const lowWall = new THREE.Group(); lowWall.position.set(-4.75, 0, 5.0); scene.add(lowWall);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) add(new THREE.BoxGeometry(0.2, 0.2, 0.44), brick, 0, 0.11 + r * 0.21, -0.7 + c * 0.46 + (r % 2) * 0.23, lowWall);
    const ROUTE = [ SPOT.clone(), WORK.clone() ];
    const trail = add(new THREE.BoxGeometry(0.9, 0.06, SPOT.distanceTo(WORK)), flat(0xd9c39a), (SPOT.x + WORK.x) / 2, 0.035, (SPOT.z + WORK.z) / 2);
    trail.rotation.y = Math.atan2(WORK.x - SPOT.x, WORK.z - SPOT.z); trail.castShadow = false;
    const along = (t : number) => {
        const L : number[] = []; let tot = 0;
        for (let i = 1; i < ROUTE.length; i++) { const d = ROUTE[i].distanceTo(ROUTE[i - 1]); L.push(d); tot += d; }
        let d = t * tot;
        for (let i = 0; i < L.length; i++) { if (d <= L[i]) return ROUTE[i].clone().lerp(ROUTE[i + 1], d / L[i]); d -= L[i]; }
        return ROUTE[ROUTE.length - 1].clone();
    };
    interface Pose { hip ? : number[]; knee ? : number[]; sh ? : number[]; el ? : number[]; shz ? : number[]; bob ? : number; }
    const pose = (p : Person, cfg : Pose) => {
        p.legs.forEach((l, i) => { l.hip.rotation.x = cfg.hip?.[i] ?? 0; l.knee.rotation.x = cfg.knee?.[i] ?? 0; });
        p.arms.forEach((a, i) => { a.sh.rotation.x = cfg.sh?.[i] ?? 0; a.el.rotation.x = cfg.el?.[i] ?? 0; a.sh.rotation.z = cfg.shz?.[i] ?? 0; });
        p.body.position.y = cfg.bob ?? 0;
    };
    // the farmer holds the axe at his right side, elbow bent; walking swings the left arm and both legs
    const AXE : Pose = { sh : [ 0, -0.35 ], el : [ 0, -1.35 ], shz : [ 0, 0.1 ] };
    const stride = (ph : number) : Pose => {
        const s = Math.sin(ph);
        return { hip : [ s * 0.45, -s * 0.45 ], knee : [ Math.max(0, -s) * 0.7, Math.max(0, s) * 0.7 ], sh : [ -s * 0.35, -0.35 ], el : [ -0.25, -1.35 ], shz : [ 0, 0.1 ], bob : Math.abs(Math.cos(ph)) * 0.03 };
    };
    const HEADING = Math.atan2(WORK.x - SPOT.x, WORK.z - SPOT.z);
    let manTag : THREE.Object3D = farmer.root, manShown = true;
    const story = (p : number) => {
        newBrick.visible = false;
        mason.body.rotation.x = 0;
        if (p < BEATS.mason) {
            mason.root.visible = false; farmer.root.visible = true; manTag = farmer.root;
            if (p < BEATS.walk) {
                farmer.root.position.copy(SPOT);
                // he turns from facing the reader to face the building site
                farmer.root.rotation.y = Math.PI / 4 + (HEADING - Math.PI / 4) * ease(span(p, BEATS.turn, BEATS.walk));
                pose(farmer, AXE);
            } else {
                const k = span(p, BEATS.walk, BEATS.arrive), pos = along(k), nxt = along(Math.min(1, k + 0.01));
                farmer.root.position.copy(pos);
                if (k < 1) farmer.root.rotation.y = Math.atan2(nxt.x - pos.x, nxt.z - pos.z);
                // the stride is tied to the distance walked, so the steps run backwards when the reader scrolls back
                pose(farmer, k < 1 ? stride(k * 28) : AXE);
            }
            manShown = true;
        } else {
            farmer.root.visible = false; mason.root.visible = true; manTag = mason.root;
            mason.root.position.copy(WORK); mason.root.rotation.y = -Math.PI / 2;
            // laying bricks, paced by the scroll: lean to the wall, reach with the trowel, straighten
            const r = (Math.sin(span(p, BEATS.mason, 1) * 18) + 1) / 2;
            pose(mason, { sh : [ -0.3, -1.1 - r * 0.5 ], el : [ -0.4, -0.6 - r * 0.4 ], hip : [ -0.1, 0.05 ], bob : -r * 0.02 });
            mason.body.rotation.x = r * 0.18;
            newBrick.visible = p >= BEATS.brick;
            manShown = true;
        }
    };

    // FRAMING =========================================================================================================
    let W = 1, H = 1;
    const resize = (width : number, height : number) => {
        W = width; H = height;
        renderer.setSize(width, height, false);
        const aspect = width / height, narrow = width < 700;
        const viewH = narrow ? 21 : 15.5;
        camera.left = -viewH * aspect / 2; camera.right = viewH * aspect / 2; camera.top = viewH / 2; camera.bottom = -viewH / 2;
        const focus = new THREE.Vector3(narrow ? -2.2 : -0.6, narrow ? 5.6 : 4.6, narrow ? 2.6 : 0.8);
        camera.position.copy(ISO).add(focus); camera.lookAt(focus);
        camera.updateProjectionMatrix();
    };
    const v = new THREE.Vector3();
    const anchorOf = (o : THREE.Object3D, shown : boolean) : TagAnchor => {
        v.set(o.position.x, o.position.y + 2.55, o.position.z).project(camera);
        return { x : (v.x + 1) / 2 * W, y : (1 - v.y) / 2 * H, shown };
    };

    return {
        render : (progress, time) => {
            wind.value = opts.reduced ? 0 : time;
            crowns.forEach((c, i) => { c.rotation.z = opts.reduced ? 0 : Math.sin(time * 0.8 + i) * 0.05; });
            story(clamp01(progress));
            harvest(time);
            // the cart rolls down the track past the farm, all the way off the bottom of the screen, and starts again
            const t = opts.reduced ? 0.45 : (time / 55) % 1;
            cart.position.set(7.15, 0, -30 + t * 58);
            const roll = opts.reduced ? 0 : time;
            wheels.forEach(wh => { wh.rotation.x = roll * 1.2; });   // rolling forward, the way the cart goes
            bullLegs.forEach((l, i) => { l.rotation.x = opts.reduced ? 0 : Math.sin(roll * 3.6 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.3; });
            renderer.render(scene, camera);
        },
        resize,
        anchors : () => ({ man : anchorOf(manTag, manShown), woman : anchorOf(woman.root, true) }),
        dispose : () => {
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            renderer.dispose();
        },
    };
};
