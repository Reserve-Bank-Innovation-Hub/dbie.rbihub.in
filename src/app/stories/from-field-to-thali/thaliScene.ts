// The opening's 3D scene: a dark, lamp-lit table with an everyday steel thali in the middle (rice, rotis, a katori of
// dal and a katori of sabzi), and round it, on wooden boards, three small clay scenes of where that food comes from: a
// wheat field at harvest, a mill with its chimney, and a kirana shop where the shopkeeper weighs out dal and hands over
// the dal, a bag of rice and a bottle of cooking oil. The camera travels round the table from scene to scene as the
// reader scrolls, and ends on the thali. Scrolling back reverses it. The scene is decoration and carries no number
// (docs/story-slate.html, "The 3D layer").
//
// createThaliScene builds everything once; render(progress, time) poses the scene for a scroll progress from 0 to 1 and
// draws a frame. Time only moves the wheat, the harvesters, the smoke, the steam and the lamp's flicker, never the
// story. The people are built as in "The women who stayed" (farmScene.ts), so the two stories' figures match; the rest
// of the look is this story's own: soft clay, a perspective camera, warm light on a dark table.

// LIB =================================================================================================================
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface ThaliScene {
    render  : (progress : number, time : number) => void;
    resize  : (width : number, height : number) => void;
    dispose : () => void;
}

// The story's beats along the scroll, shared with the page's captions.
export const BEATS = { mill : 0.22, shop : 0.46, weigh : 0.52, give : 0.6, home : 0.8 };

const ease = (t : number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (v : number) => Math.max(0, Math.min(1, v));
const span = (p : number, a : number, b : number) => clamp01((p - a) / (b - a));
const seeded = (seed : number) => { let q = seed; return () => (q = (q * 16807) % 2147483647) / 2147483647; };
const DEG = Math.PI / 180;

export const createThaliScene = (canvas : HTMLCanvasElement, opts : { narrow : boolean; reduced : boolean }) : ThaliScene => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.narrow ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // a dark, warm room: the table fades into it at the edges
    const ROOM = 0x1d130e;
    scene.fog = new THREE.Fog(ROOM, 90, 190);
    renderer.setClearColor(ROOM, 1);
    const rand = seeded(9);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
    // a soft studio reflection, so the steel of the thali and the katoris reads as steel and not as dark glass
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap; scene.environmentIntensity = 0.55;

    // LIGHT ===========================================================================================================
    // a warm lamp from above and to the left, a soft fill, and a cool rim from behind that picks out the edges
    scene.add(new THREE.HemisphereLight(0xffe7cc, 0x3a2418, 0.85));
    const lamp = new THREE.DirectionalLight(0xffd29a, 2.9);
    lamp.position.set(-34, 62, 26); lamp.castShadow = true;
    lamp.shadow.mapSize.set(opts.narrow ? 2048 : 3072, opts.narrow ? 2048 : 3072);
    Object.assign(lamp.shadow.camera, { left : -44, right : 44, top : 44, bottom : -44, near : 10, far : 180 });
    lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.03; lamp.shadow.radius = 4;
    scene.add(lamp);
    const rim = new THREE.DirectionalLight(0xa9c8ff, 0.7); rim.position.set(30, 24, -50); scene.add(rim);

    // clay: smooth, matt, a little warm; steel and brass catch the lamp
    const clay = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.93, metalness : 0, ...extra });
    const soft = (color : number, extra : THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness : 0.7, metalness : 0, ...extra });
    const metal = (color : number) => new THREE.MeshStandardMaterial({ color, metalness : 0.9, roughness : 0.22 });
    const flat = clay;
    const add = (geo : THREE.BufferGeometry, m : THREE.Material, x : number, y : number, z : number, parent : THREE.Object3D) => {
        const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
    };
    // a box with softened edges, so the clay pieces read as modelled rather than cut
    const rbox = (w : number, h : number, d : number, r = 0.08) => {
        const shape = new THREE.Shape(), x = -w / 2, y = -h / 2, rr = Math.min(r, w / 2, h / 2);
        shape.moveTo(x + rr, y); shape.lineTo(x + w - rr, y); shape.quadraticCurveTo(x + w, y, x + w, y + rr); shape.lineTo(x + w, y + h - rr);
        shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h); shape.lineTo(x + rr, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - rr); shape.lineTo(x, y + rr); shape.quadraticCurveTo(x, y, x + rr, y);
        const g = new THREE.ExtrudeGeometry(shape, { depth : Math.max(0.01, d - 2 * rr), bevelEnabled : true, bevelThickness : rr, bevelSize : 0, bevelSegments : 3, curveSegments : 4 });
        g.translate(0, 0, -(d - 2 * rr) / 2); return g;
    };

    // a painted signboard: a name in large letters and a line beneath, on a coloured board with a thin border
    const sign = (name : string, line : string, w : number, h : number, bg : string, fg : string) => {
        const c = document.createElement("canvas"), px = 160; c.width = Math.round(w * px); c.height = Math.round(h * px);
        const x = c.getContext("2d")!;
        x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
        x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(10, 10, c.width - 20, c.height - 20);
        x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
        x.font = `700 ${Math.round(c.height * 0.4)}px Georgia, "Times New Roman", serif`;
        x.fillText(name, c.width / 2, c.height * (line ? 0.4 : 0.52), c.width - 60);
        if (line) { x.font = `600 ${Math.round(c.height * 0.17)}px Helvetica, Arial, sans-serif`; x.fillText(line, c.width / 2, c.height * 0.77, c.width - 60); }
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map : tex, roughness : 0.8 }));
        m.receiveShadow = true; return m;
    };

    // THE TABLE AND THE THALI =========================================================================================
    // A steel thali on a woven mat in the middle of the table; the field, the mill and the shop stand round it on
    // wooden boards, so the journey ends at the plate.
    const table = add(new THREE.CircleGeometry(200, 64), clay(0x4a2a1b), 0, 0, 0, scene); table.rotation.x = -Math.PI / 2; table.castShadow = false;
    for (let k = 0; k < 5; k++) {
        const ring = add(new THREE.RingGeometry(15 + k * 1.3, 16.1 + k * 1.3, 96), clay(k % 2 ? 0xb4553a : 0xd9a441), 0, 0.02 + k * 0.001, 0, scene);
        ring.rotation.x = -Math.PI / 2; ring.castShadow = false;
    }
    add(new THREE.CircleGeometry(15, 96), clay(0xd9a441), 0, 0.015, 0, scene).rotation.x = -Math.PI / 2;
    const THALI_R = 13;
    const steel = metal(0xd9dde0);
    add(new THREE.CylinderGeometry(THALI_R, THALI_R - 0.4, 0.6, 128), steel, 0, 0.3, 0, scene);
    add(new THREE.TorusGeometry(THALI_R, 0.4, 12, 160), steel, 0, 0.65, 0, scene).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(THALI_R - 1.8, 0.05, 6, 160), metal(0xbfc4c8), 0, 0.61, 0, scene).rotation.x = Math.PI / 2;
    const FLOOR = 0.6;

    // where things stand round the table: an angle and a distance from the plate's centre, the front facing outwards
    const STATION_R = 30;
    const at = (deg : number, r : number) => new THREE.Vector3(Math.cos(deg * DEG) * r, 0, Math.sin(deg * DEG) * r);
    const facing = (deg : number) => Math.atan2(Math.cos(deg * DEG), Math.sin(deg * DEG));
    // a round wooden board with a layer of soil, sand or paving on it, for one of the three scenes
    const board = (deg : number, radius : number, fill : number) => {
        const g = new THREE.Group(); g.position.copy(at(deg, STATION_R)); g.rotation.y = facing(deg); scene.add(g);
        add(new THREE.CylinderGeometry(radius + 0.6, radius + 0.7, 0.9, 96), clay(0x8a5a33), 0, 0.45, 0, g);
        add(new THREE.TorusGeometry(radius + 0.6, 0.12, 8, 96), clay(0xa8723f), 0, 0.9, 0, g).rotation.x = Math.PI / 2;
        add(new THREE.CylinderGeometry(radius, radius, 0.3, 96), clay(fill), 0, 1.05, 0, g);
        const top = new THREE.Group(); top.position.y = 1.2; g.add(top);
        return top;
    };
    // a steel katori on the thali, filled with food
    const katori = (deg : number, r : number, radius : number, fill : number, depth = 1.4) => {
        const g = new THREE.Group(); g.position.copy(at(deg, r)); g.position.y = FLOOR; scene.add(g);
        const wall = add(new THREE.CylinderGeometry(radius + 0.4, radius - 0.2, depth, 72, 1, true), metal(0xcfd4d8), 0, depth / 2, 0, g);
        (wall.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
        add(new THREE.TorusGeometry(radius + 0.4, 0.14, 10, 72), steel, 0, depth, 0, g).rotation.x = Math.PI / 2;
        add(new THREE.CylinderGeometry(radius + 0.25, radius - 0.2, depth - 0.25, 72), clay(fill), 0, (depth - 0.25) / 2, 0, g);
        const top = new THREE.Group(); top.position.y = depth - 0.25; g.add(top);
        return top;
    };
    // the three scenes, and the angles the camera visits them at
    const A_FIELD = 205, A_MILL = 270, A_SHOP = 335;
    const field = board(A_FIELD, 8.6, 0xb48a55);
    const millK = board(A_MILL, 7.8, 0xe2cfa6);
    const shopK = board(A_SHOP, 8.6, 0xd6c8ae);

    // THE FIELD =======================================================================================================
    // Golden wheat filling the back of the katori; the front is cut, with sheaves on the stubble and a stack of sacks.
    const wind = { value : 0 };
    const stalkGeo = (() => {
        // the straw, a leaf, and the ear: two rows of plump spikelets climbing the top of the stalk, each with a long
        // whisker (awn), in a deeper gold than the straw so the grain heads stand out
        const stem = new THREE.CylinderGeometry(0.008, 0.012, 0.95, 3, 4); stem.translate(0, 0.475, 0);
        const leaf = new THREE.PlaneGeometry(0.035, 0.38, 1, 2); leaf.translate(0.02, 0.4, 0); leaf.rotateZ(-0.5);
        const parts : THREE.BufferGeometry[] = [ stem, leaf ], cols : number[][] = [ [ 0.86, 0.78, 0.5 ], [ 0.72, 0.7, 0.36 ] ];
        for (let j = 0; j < 7; j++) {
            const sd = j % 2 ? 1 : -1, y = 0.98 + j * 0.042;
            const sp = new THREE.SphereGeometry(0.03, 6, 4); sp.scale(1, 1.5, 0.8); sp.translate(sd * 0.02, y, 0);
            const awn = new THREE.ConeGeometry(0.005, 0.2, 3); awn.translate(0, 0.1, 0); awn.rotateZ(-sd * 0.35); awn.translate(sd * 0.03, y + 0.03, 0);
            parts.push(sp, awn); cols.push([ 0.82, 0.55, 0.18 ], [ 0.9, 0.72, 0.38 ]);
        }
        const tip = new THREE.SphereGeometry(0.024, 6, 4); tip.scale(1, 1.6, 0.8); tip.translate(0, 1.29, 0); parts.push(tip); cols.push([ 0.82, 0.55, 0.18 ]);
        parts.forEach((g, i) => { parts[i] = g.index ? g.toNonIndexed() : g; });
        let count = 0; parts.forEach(g => { count += g.attributes.position.count; });
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        let o = 0;
        parts.forEach((g, k) => { pos.set(g.attributes.position.array as Float32Array, o * 3); for (let i = 0; i < g.attributes.position.count; i++) col.set(cols[k], (o + i) * 3); o += g.attributes.position.count; });
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
        return geo;
    })();
    const wheatMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.8, side : THREE.DoubleSide });
    wheatMat.onBeforeCompile = sh => {
        sh.uniforms.uWind = wind;
        sh.vertexShader = "uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
            vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float bend = pow(max(position.y, 0.0), 1.6) * (0.1 + 0.08 * sin(uWind * 1.6 + wp.x * 0.5 + wp.z * 0.3));
            transformed.x += bend * 0.8; transformed.z += bend * 0.5;`);
    };
    const N = opts.narrow ? 3400 : 5600;
    const wheat = new THREE.InstancedMesh(stalkGeo, wheatMat, N);
    const dummy = new THREE.Object3D(), tint = new THREE.Color();
    let wn = 0;
    for (let i = 0; i < N * 4 && wn < N; i++) {
        const x = (rand() - 0.5) * 16, z = -8 + rand() * 9.6;
        if (Math.hypot(x, z) > 7.9) continue;
        dummy.position.set(x, 0, z); dummy.rotation.set((rand() - 0.5) * 0.1, rand() * Math.PI * 2, (rand() - 0.5) * 0.1);
        const s = 0.9 + rand() * 0.35; dummy.scale.set(s, s, s); dummy.updateMatrix(); wheat.setMatrixAt(wn, dummy.matrix);
        tint.setHSL(0.11 + rand() * 0.03, 0.2 + rand() * 0.2, 0.86 + rand() * 0.12); wheat.setColorAt(wn, tint); wn++;
    }
    wheat.count = wn; wheat.receiveShadow = true; field.add(wheat);
    for (let i = 0; i < 7; i++) {
        const sh = new THREE.Group(); sh.position.set(-4.8 + i * 1.4 + rand() * 0.4, 0.12, 2.4 + rand() * 1.2); sh.rotation.set(0, rand() * 3, Math.PI / 2); field.add(sh);
        add(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 10), clay(0xd9b45a), 0, 0, 0, sh);
        add(new THREE.CylinderGeometry(0.14, 0.1, 0.22, 10), clay(0xe8c25e), 0, 0.38, 0, sh);
    }
    // a jute sack: a rounded block, gathered and tied at the top
    const sackGeo = (() => {
        const g = new THREE.CylinderGeometry(0.26, 0.3, 0.7, 16, 4); const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.2) { const k = 1 - (y - 0.2) * 1.1; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
        g.computeVertexNormals(); return g;
    })();
    const sackMat = clay(0xd8c69a), sackBand = clay(0x2e7d4f);
    const sack = (x : number, y : number, z : number, parent : THREE.Object3D, lying = false) => {
        const s = add(sackGeo, sackMat, x, y + (lying ? 0.28 : 0.35), z, parent);
        if (lying) s.rotation.z = Math.PI / 2;
        add(new THREE.CylinderGeometry(0.305, 0.305, 0.08, 16), sackBand, 0, -0.05, 0, s);
        return s;
    };
    [ [ 0, 0, 0 ], [ 0.62, 0, 0 ], [ 1.24, 0, 0 ], [ 0.31, 0.56, 0, 1 ], [ 0.93, 0.56, 0, 1 ] ].forEach(([ dx, dy, dz, l ]) => sack(3.0 + dx, dy, 4.4 + dz, field, !!l));
    // a neem tree at the back of the field, round and soft
    const neem = new THREE.Group(); neem.position.set(-5.2, 0, -4.4); field.add(neem);
    add(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 10), clay(0x7a5634), 0, 1.1, 0, neem);
    ([ [ 0, 3.0, 0, 1.5 ], [ -0.9, 2.6, 0.4, 1.1 ], [ 0.95, 2.7, -0.2, 1.15 ], [ 0.2, 3.7, 0.3, 1.0 ] ] as const).forEach(([ a, b, c, r ], i) => add(new THREE.SphereGeometry(r, 18, 14), clay(i % 2 ? 0x4b9143 : 0x3e7f3a), a, b, c, neem));
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
        // the shoulders: a rounded cap on each side of the torso that slopes from the neck down to the arm, so the arm
        // grows out of the body rather than hanging beside it
        [ -1, 1 ].forEach(side => {
            const cap = put(new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), soft(spec.sleeve ?? spec.top)), side * 0.17, 1.39, 0);
            cap.scale.set(1.3, 0.55, 0.78); cap.rotation.z = side * -0.4;
        });
        const arms = [ -1, 1 ].map(side => {
            const sh = put(new THREE.Group(), side * 0.225, 1.385, 0);
            // a ball at the shoulder and one at the elbow keep the joints closed whichever way the arm swings
            put(new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 9), soft(spec.sleeve ?? spec.top)), 0, 0, 0, sh);
            put(limb(0.3, 0.06, 0.046, spec.sleeve ?? spec.top), 0, 0, 0, sh);
            const el = put(new THREE.Group(), 0, -0.3, 0, sh);
            put(new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), soft(spec.forearm ?? SKIN)), 0, 0, 0, el);
            put(limb(0.27, 0.043, 0.032, spec.forearm ?? SKIN), 0, 0, 0, el);
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

    // THE MILL ========================================================================================================
    // A tin-roofed mill shed with a tall chimney; filled sacks waiting at the front, clean bags and tins of oil out at
    // the side, and the mini truck that brings the harvest in and takes the bags on to town.
    const mill = new THREE.Group(); mill.position.set(0.4, 0, -1.8); millK.add(mill);
    const wallMat = clay(0xeadcc0), tin = clay(0x98a6ad), rust = clay(0xb5643a);
    add(rbox(6.0, 3.0, 3.8, 0.1), wallMat, 0, 1.5, 0, mill);
    [ -1, 1 ].forEach(sd => { const r = add(rbox(6.5, 0.1, 2.3, 0.04), tin, 0, 3.45, sd * 0.95, mill); r.rotation.x = sd * 0.42; });
    add(new THREE.BoxGeometry(2.0, 2.1, 0.06), clay(0x3b3430), -1.2, 1.05, 1.92, mill);
    add(rbox(1.0, 0.75, 0.08, 0.03), clay(0x5e6e74), 1.8, 1.9, 1.92, mill);
    const millSign = sign("KISAN ATTA & OIL MILL", "", 4.2, 0.55, "#2e7d4f", "#fff6e0"); millSign.position.set(-0.1, 2.63, 1.94); mill.add(millSign);
    add(new THREE.CylinderGeometry(0.3, 0.4, 6.4, 18), rust, 2.3, 3.2, -1.2, mill);
    add(new THREE.TorusGeometry(0.33, 0.08, 8, 18), clay(0x8a4a2b), 2.3, 6.4, -1.2, mill).rotation.x = Math.PI / 2;
    const puffs : THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) { const pf = add(new THREE.SphereGeometry(0.4, 14, 10), clay(0xf2efe8, { transparent : true, opacity : 0.7 }), 2.3, 6.8, -1.2, mill); pf.castShadow = false; puffs.push(pf); }
    [ [ -2.0, 2.9 ], [ -1.3, 3.2 ], [ -2.6, 3.4 ] ].forEach(([ x, z ]) => sack(x, 0, z, mill));
    const bagMat = clay(0xf3efe6), bagBand = clay(0xc8402e);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3 - r; c++) {
        const b = add(rbox(0.7, 0.24, 0.46, 0.06), bagMat, 1.7 + c * 0.72 + r * 0.36, 0.12 + r * 0.25, 2.8, mill);
        add(new THREE.BoxGeometry(0.18, 0.245, 0.465), bagBand, 0, 0, 0, b);
    }
    const tinMat = metal(0xd9b13a), tinTop = clay(0x2f6fbf);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const t = add(rbox(0.42, 0.55, 0.42, 0.04), tinMat, 3.5 + c * 0.46, 0.28 + r * 0.56, 1.6, mill);
        add(new THREE.BoxGeometry(0.43, 0.14, 0.43), tinTop, 0, 0.05, 0, t);
    }
    // the mini truck, parked in front of the mill: a blue cab, a green tray, and a load that changes from sacks to bags
    const truck = new THREE.Group(); truck.position.set(-2.6, 0, 4.4); truck.rotation.y = -0.35; truck.scale.setScalar(0.8); millK.add(truck);
    add(rbox(1.5, 1.2, 1.5, 0.18), clay(0x2f6fbf), 1.55, 0.95, 0, truck);
    add(new THREE.BoxGeometry(0.05, 0.6, 1.2), soft(0xbfe0ef, { roughness : 0.2 }), 2.31, 1.2, 0, truck);
    add(rbox(2.6, 0.12, 1.6, 0.04), clay(0x5c6a73), -0.6, 0.55, 0, truck);
    [ -1, 1 ].forEach(sd => add(rbox(2.6, 0.4, 0.06, 0.02), clay(0x3f8f5c), -0.6, 0.81, sd * 0.78, truck));
    add(rbox(0.06, 0.4, 1.6, 0.02), clay(0x3f8f5c), -1.88, 0.81, 0, truck);
    [ [ 1.5, -0.8 ], [ 1.5, 0.8 ], [ -1.2, -0.8 ], [ -1.2, 0.8 ] ].forEach(([ x, z ]) => { const wh = add(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 18), clay(0x2a2a2a), x, 0.32, z, truck); wh.rotation.x = Math.PI / 2; });
    const loadSacks = new THREE.Group(), loadBags = new THREE.Group(); truck.add(loadSacks); truck.add(loadBags);
    [ [ -1.3, -0.35 ], [ -1.3, 0.35 ], [ -0.6, -0.35 ], [ -0.6, 0.35 ], [ 0.1, 0 ] ].forEach(([ x, z ]) => sack(x, 0.6, z, loadSacks, true));
    for (let i = 0; i < 6; i++) { const b = add(rbox(0.7, 0.24, 0.46, 0.06), bagMat, -1.3 + (i % 3) * 0.72, 0.74 + Math.floor(i / 3) * 0.25, (i % 2 ? 0.25 : -0.25), loadBags); add(new THREE.BoxGeometry(0.18, 0.245, 0.465), bagBand, 0, 0, 0, b); }

    // THE KIRANA SHOP =================================================================================================
    // A two-storey shop on a small-town street between two painted houses, open to the front: shelves of tins and
    // bottles, open sacks of dal and rice, a counter with a brass balance, the shopkeeper behind it, a customer in front,
    // a scooter at the kerb and an electric pole.
    const house = (x : number, ry : number, w : number, h : number, colour : number, trim : number) => {
        const g = new THREE.Group(); g.position.set(x, 0, -2.6); g.rotation.y = ry; shopK.add(g);
        add(rbox(w, h, 3.4, 0.12), clay(colour), 0, h / 2, 0, g);
        add(rbox(w + 0.2, 0.18, 3.6, 0.05), clay(trim), 0, h + 0.09, 0, g);
        add(rbox(w + 0.1, 0.12, 0.6, 0.04), clay(trim), 0, h * 0.52, 1.95, g);
        add(rbox(0.8, 0.8, 0.08, 0.05), clay(0x4f6670), 0, h * 0.76, 1.71, g);
        add(rbox(0.9, 1.7, 0.08, 0.05), clay(0x6b4a2e), 0, 0.85, 1.71, g);
        add(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 18), clay(0x8fb4c9), 0.4, h + 0.48, -0.8, g);   // a water tank on the roof
    };
    house(-5.0, 0.38, 2.6, 4.8, 0xf2c96b, 0xf4efe6); house(5.0, -0.38, 2.6, 5.2, 0x9fd0c7, 0xf4efe6);
    const shop = new THREE.Group(); shop.position.set(0, 0, -2.1); shopK.add(shop);
    const shopW = 6.4, shopH = 6.2;
    add(new THREE.BoxGeometry(shopW, shopH, 0.2), clay(0xf4efe6), 0, shopH / 2, -2.0, shop);
    [ -1, 1 ].forEach(sd => add(rbox(0.24, shopH, 4.2, 0.08), clay(0xe9a3b6), sd * shopW / 2, shopH / 2, 0, shop));
    add(rbox(shopW, shopH - 3.4, 4.2, 0.12), clay(0xe9a3b6), 0, 3.4 + (shopH - 3.4) / 2, 0, shop);
    add(rbox(shopW + 0.2, 0.18, 4.4, 0.05), clay(0xf4efe6), 0, shopH + 0.09, 0, shop);
    for (let k = 0; k < 3; k++) add(rbox(0.9, 0.8, 0.08, 0.05), clay(0x4f6670), -2 + k * 2, 5.3, 2.11, shop);
    add(new THREE.BoxGeometry(shopW, 0.08, 4.0), clay(0xcfc6b4), 0, 0.04, 0.1, shop);
    const shopSign = sign("APNA KIRANA STORE", "Rice · Dal · Atta · Oil", 5.4, 0.85, "#c8402e", "#fff6e0"); shopSign.position.set(0, 3.95, 2.13); shop.add(shopSign);
    for (let k = 0; k < 8; k++) {
        const a = add(rbox(shopW / 8, 0.05, 0.8, 0.02), clay(k % 2 ? 0xf4efe6 : 0xe0a100), -shopW / 2 + shopW / 16 + k * shopW / 8, 3.2, 2.45, shop);
        a.rotation.x = 0.3;
    }
    const shelfMat = clay(0x8a5a33);
    for (let r = 0; r < 4; r++) add(rbox(shopW - 0.6, 0.06, 0.6, 0.02), shelfMat, 0, 0.75 + r * 0.6, -1.6, shop);
    const bottleMat = soft(0xf2c230, { transparent : true, opacity : 0.85, roughness : 0.2 }), capMat = clay(0xc8402e);
    const SHELF_GOODS = [ 0xd9b13a, 0xc8402e, 0x2f6fbf, 0x2e8f5e, 0xe9a03b, 0xf3efe6 ];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
        const x = -2.7 + c * 0.48, y = 0.78 + r * 0.6;
        if (r === 1) {
            add(new THREE.CylinderGeometry(0.09, 0.1, 0.36, 14), bottleMat, x, y + 0.18, -1.55, shop);
            add(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), capMat, x, y + 0.39, -1.55, shop);
        } else if (r === 3) add(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 14), soft(0xf3efe6, { transparent : true, opacity : 0.6 }), x, y + 0.16, -1.55, shop);
        else add(rbox(0.34, 0.4, 0.3, 0.04), clay(SHELF_GOODS[(c + r) % SHELF_GOODS.length]), x, y + 0.2, -1.55, shop);
    }
    add(rbox(3.6, 1.0, 0.9, 0.06), clay(0x9b6a3c), 0, 0.5, 0.7, shop);
    add(rbox(3.8, 0.06, 1.0, 0.02), clay(0xd9c7a2), 0, 1.03, 0.7, shop);
    const brass = metal(0xc9a33a);
    const scale = new THREE.Group(); scale.position.set(-0.6, 1.06, 0.7); shop.add(scale);
    add(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 16), brass, 0, 0.03, 0, scale);
    add(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 10), brass, 0, 0.48, 0, scale);
    const beam = new THREE.Group(); beam.position.set(0, 0.92, 0); scale.add(beam);
    add(new THREE.BoxGeometry(0.9, 0.035, 0.035), brass, 0, 0, 0, beam);
    const pans = [ -1, 1 ].map(sd => {
        const hang = new THREE.Group(); hang.position.set(sd * 0.42, 0, 0); beam.add(hang);
        add(new THREE.CylinderGeometry(0.004, 0.004, 0.42, 4), brass, 0, -0.21, 0, hang);
        const pan = add(new THREE.CylinderGeometry(0.17, 0.12, 0.05, 18), brass, 0, -0.44, 0, hang);
        return { hang, pan };
    });
    add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), clay(0x3a3a3a), 0, 0.06, 0, pans[0].pan);
    const panDal = add(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xe8b33a), 0, 0.02, 0, pans[1].pan);
    const openSack = (x : number, z : number, grain : number) => {
        add(new THREE.CylinderGeometry(0.34, 0.36, 0.55, 18, 1, true), clay(0xd8c69a, { side : THREE.DoubleSide }), x, 0.28, z, shop);
        add(new THREE.TorusGeometry(0.35, 0.06, 8, 18), clay(0xc9b383), x, 0.55, z, shop).rotation.x = Math.PI / 2;
        add(new THREE.SphereGeometry(0.33, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(grain), x, 0.46, z, shop).scale.y = 0.45;
    };
    openSack(-2.6, 1.5, 0xe8b33a); openSack(-1.85, 1.75, 0xf6f1e3); openSack(2.95, 1.0, 0xc98a3a); openSack(-2.95, 0.9, 0x7aa33a);
    // what the customer takes home: the dal just weighed, poured into a paper packet; a bag of rice; a bottle of oil
    const dalPacket = new THREE.Group(); shop.add(dalPacket);
    add(rbox(0.26, 0.3, 0.18, 0.04), clay(0xe9d3a0), 0, 0.15, 0, dalPacket);
    add(rbox(0.27, 0.06, 0.19, 0.02), clay(0xe8b33a), 0, 0.28, 0, dalPacket);
    const riceBag = new THREE.Group(); shop.add(riceBag);
    add(rbox(0.36, 0.5, 0.26, 0.06), clay(0xf6f2e8), 0, 0.25, 0, riceBag);
    add(rbox(0.37, 0.1, 0.27, 0.02), clay(0xc8402e), 0, 0.3, 0, riceBag);
    const oil = new THREE.Group(); shop.add(oil);
    // a little larger than life, so the three can be told apart from the street
    [ dalPacket, riceBag, oil ].forEach(o => o.scale.setScalar(1.3));
    add(new THREE.CylinderGeometry(0.1, 0.11, 0.4, 16), bottleMat, 0, 0.2, 0, oil);
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 10), capMat, 0, 0.43, 0, oil);
    add(new THREE.CylinderGeometry(0.07, 0.09, 5.6, 10), clay(0x9a9a92), 4.6, 2.8, 2.4, shopK);
    add(rbox(1.2, 0.08, 0.08, 0.02), clay(0x9a9a92), 4.6, 5.4, 2.4, shopK);
    const scooter = new THREE.Group(); scooter.position.set(-3.8, 0, 3.2); scooter.rotation.y = 0.5; shopK.add(scooter);
    add(rbox(1.2, 0.28, 0.4, 0.1), clay(0xc8402e), 0, 0.5, 0, scooter);
    add(rbox(0.5, 0.12, 0.38, 0.05), clay(0x2a2a2a), -0.25, 0.72, 0, scooter);
    add(rbox(0.08, 0.8, 0.12, 0.03), clay(0xc8402e), 0.55, 0.85, 0, scooter);
    add(rbox(0.06, 0.06, 0.6, 0.02), clay(0x2a2a2a), 0.55, 1.25, 0, scooter);
    [ -0.45, 0.5 ].forEach(x => { const wh = add(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 18), clay(0x2a2a2a), x, 0.22, 0, scooter); wh.rotation.x = Math.PI / 2; });

    // THE FOOD ========================================================================================================
    // An everyday thali and nothing more: a mound of rice, a stack of rotis, a katori of dal and a katori of sabzi.
    // Steam rises from the dal.
    const dalK = katori(215, 6.0, 3.2, 0xe8a83a, 1.6);
    const sabziK = katori(300, 6.4, 3.0, 0x7a9a35, 1.5);
    for (let i = 0; i < 7; i++) add(new THREE.SphereGeometry(0.28 + rand() * 0.15, 12, 8), clay(0xd99a2b), (rand() - 0.5) * 4, 0, (rand() - 0.5) * 4, dalK).scale.y = 0.3;
    for (let i = 0; i < 16; i++) {   // pieces of vegetable in the sabzi
        const pc = add(rbox(0.5, 0.3, 0.5, 0.1), clay([ 0x5f8a2a, 0xe0a13a, 0x8fae3e, 0xc8662a ][i % 4]), (rand() - 0.5) * 3.8, 0.05, (rand() - 0.5) * 3.8, sabziK);
        pc.rotation.y = rand() * 3; pc.castShadow = false;
    }
    const RICE = at(110, 5.2);
    const rice = add(new THREE.SphereGeometry(3.6, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xfaf6ec), RICE.x, FLOOR, RICE.z, scene); rice.scale.y = 0.5;
    for (let i = 0; i < 140; i++) {   // grains on the mound
        const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 3.4, h = Math.sqrt(Math.max(0, 1 - (r / 3.6) ** 2)) * 3.6 * 0.5;
        const g = add(new THREE.CapsuleGeometry(0.045, 0.14, 2, 6), clay(0xffffff), RICE.x + Math.cos(a) * r, FLOOR + h, RICE.z + Math.sin(a) * r, scene); g.rotation.set(rand() * 3, rand() * 3, rand() * 3); g.castShadow = false;
    }
    // the roti's surface: golden in the middle, deeper at the edge, with soft browned spots and a dusting of flour
    const rotiTex = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d")!;
        const g = x.createRadialGradient(256, 256, 20, 256, 256, 256);
        g.addColorStop(0, "#f2dcaa"); g.addColorStop(0.7, "#e7c186"); g.addColorStop(1, "#c9955a");
        x.fillStyle = g; x.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 70; i++) {
            const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 220, cx = 256 + Math.cos(a) * r, cy = 256 + Math.sin(a) * r, sz = 5 + rand() * 18;
            const sp = x.createRadialGradient(cx, cy, 0, cx, cy, sz);
            sp.addColorStop(0, `rgba(${100 + rand() * 40 | 0}, ${55 + rand() * 25 | 0}, 22, ${0.45 + rand() * 0.4})`); sp.addColorStop(1, "rgba(120, 70, 25, 0)");
            x.fillStyle = sp; x.beginPath(); x.ellipse(cx, cy, sz, sz * (0.6 + rand() * 0.4), rand() * 3, 0, Math.PI * 2); x.fill();
        }
        for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255, 249, 232, ${0.25 + rand() * 0.35})`; x.beginPath(); x.arc(rand() * 512, rand() * 512, 1 + rand() * 1.8, 0, Math.PI * 2); x.fill(); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const rotiMat = new THREE.MeshStandardMaterial({ map : rotiTex, roughness : 0.9 });
    // a thin lens, a little out of round, puffed a touch on top, mapped flat from above; folded over itself if asked
    const rotiGeo = (r : number, folded : boolean) => {
        const g = new THREE.SphereGeometry(1, 72, 18), pos = g.attributes.position, uv = g.attributes.uv, ph = rand() * 6;
        for (let i = 0; i < pos.count; i++) {
            const x0 = pos.getX(i), y0 = pos.getY(i), z0 = pos.getZ(i), a = Math.atan2(z0, x0);
            const k = r * (1 + 0.035 * Math.sin(3 * a + ph) + 0.018 * Math.sin(7 * a + ph * 2));
            let x = x0 * k, y = y0 * (y0 > 0 ? 0.11 : 0.04), z = z0 * k;
            uv.setXY(i, x / (2.2 * r) + 0.5, z / (2.2 * r) + 0.5);
            if (folded && z > 0) {   // fold the far half over the near one, along the line z = 0, leaving a little air
                const al = Math.PI - 0.1, yy = y * Math.cos(al) + z * Math.sin(al), zz = -y * Math.sin(al) + z * Math.cos(al);
                y = yy + 0.1; z = zz;
            }
            pos.setXYZ(i, x, y, z);
        }
        g.computeVertexNormals(); return g;
    };
    const ROTI = at(20, 6.2);
    [ [ 2.7, 0.06, 0, 0 ], [ 2.6, 0.17, 0.25, -0.2 ] ].forEach(([ r, y, dx, dz ]) => {
        const roti = add(rotiGeo(r, false), rotiMat, ROTI.x + dx, FLOOR + y, ROTI.z + dz, scene); roti.rotation.y = rand() * 6;
    });
    const folded = add(rotiGeo(2.5, true), rotiMat, ROTI.x + 0.3, FLOOR + 0.3, ROTI.z + 0.9, scene); folded.rotation.y = 2.4;
    const steam : THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) { const s = add(new THREE.SphereGeometry(0.5, 14, 10), clay(0xffffff, { transparent : true, opacity : 0.4 }), 0, 0.5, 0, dalK); s.castShadow = false; steam.push(s); }

    // THE PEOPLE IN PLACE =============================================================================================
    const harvester = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0xe8642a, border : 0xf2c443, top : 0x2e8f5e, sleeve : 0x2e8f5e, pallu : 0xd8521e, veil : 0xd8521e, hair : true, bindi : true, nosering : true, bangles : true, sickle : true, sheaf : true });
    const harvester2 = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0xe9b628, border : 0xc8402e, top : 0x7a3f8f, sleeve : 0x7a3f8f, pallu : 0xd99a1c, veil : 0xd99a1c, hair : true, bindi : true, bangles : true, sickle : true, sheaf : true });
    const farmer = figure({ leg : SKIN, foot : 0x5c3b22, dhoti : 0xf3efe4, kurta : true, top : 0xf6f1e3, sleeve : 0xf6f1e3, forearm : 0xf6f1e3, gamcha : 0xc8402e, moustache : true, pagdi : 0xf2a12e });
    const worker = figure({ leg : 0x59626c, foot : 0x3e2c1e, top : 0x4f7fb8, sleeve : 0x4f7fb8, forearm : SKIN, moustache : true, gamcha : 0xf2c443 });
    const shopkeeper = figure({ leg : 0xf3efe4, foot : 0x5c3b22, kurta : true, top : 0xf6f1e3, sleeve : 0xf6f1e3, forearm : 0xf6f1e3, vest : 0x6b4a2e, moustache : true });
    const customer = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0x2f7fbf, border : 0xf2c443, top : 0xc8402e, sleeve : 0xc8402e, pallu : 0x25689e, veil : 0x25689e, hair : true, bindi : true, bangles : true });
    const placePerson = (p : Person, parent : THREE.Object3D, x : number, y : number, z : number, ry : number) => { p.root.scale.setScalar(1.35); p.root.position.set(x, y, z); p.root.rotation.y = ry; parent.add(p.root); };
    placePerson(harvester, field, -2.2, 0, 2.2, Math.PI * 0.9);
    placePerson(harvester2, field, 0.9, 0, 1.9, Math.PI * 0.8);
    placePerson(farmer, field, 1.3, 0, 5.0, 0);
    placePerson(worker, millK, -1.7, 0, 3.4, 0);
    placePerson(shopkeeper, shop, 0.1, 0.08, -0.35, Math.PI * 0.3);
    placePerson(customer, shop, 2.3, 0.08, 1.75, -Math.PI * 0.62);
    const onShoulder = (p : Person, o : THREE.Object3D) => { o.position.set(0.12, 1.5 - 0.95, -0.05); o.rotation.set(0, Math.PI / 2, Math.PI / 2 - 0.2); return o; };
    const farmerSack = onShoulder(farmer, sack(0, 0, 0, farmer.upper, true)); farmerSack.scale.setScalar(0.8);
    farmer.arms[1].sh.rotation.set(-2.6, 0, -0.3); farmer.arms[1].el.rotation.x = -0.6;
    // his round: from beside the winnowing sack to the stack of filled sacks and back
    const FARM_A = new THREE.Vector3(1.25, 0, 5.05), FARM_B = new THREE.Vector3(2.55, 0, 5.15);
    const carriedSack = onShoulder(worker, sack(0, 0, 0, worker.upper, true)); carriedSack.scale.setScalar(0.8);
    const carriedBag = new THREE.Group(); worker.upper.add(carriedBag); onShoulder(worker, carriedBag);
    add(rbox(0.7, 0.24, 0.46, 0.06), bagMat, 0, 0, 0, carriedBag); add(new THREE.BoxGeometry(0.18, 0.245, 0.465), bagBand, 0, 0, 0, carriedBag);
    carriedBag.rotation.set(0, 0, -0.2);
    add(rbox(0.34, 0.4, 0.12, 0.05), clay(0xf2c443), 0, -0.25, 0.04, customer.arms[0].el);
    // a third woman winnowing at the edge of the cut wheat: she tosses the threshed wheat on a soop (a flat bamboo
    // winnowing basket); the light husk blows away to one side and the heavy grain falls into a jute sack
    const filler = figure({ leg : SKIN, foot : 0x5c3b22, sari : 0x2e9e6a, border : 0xf2c443, top : 0xd9457a, sleeve : 0xd9457a, pallu : 0x23845a, veil : 0x23845a, hair : true, bindi : true, bangles : true });
    const SACK_AT = new THREE.Vector3(0.55, 0, 4.55), FILLER_AT = new THREE.Vector3(-0.3, 0, 4.2);
    const fillerHeading = Math.atan2(SACK_AT.x - FILLER_AT.x, SACK_AT.z - FILLER_AT.z);
    placePerson(filler, field, FILLER_AT.x, 0, FILLER_AT.z, fillerHeading);
    // the jute sack: soft, bulging sides, a woven look, a rolled rim, filled almost to the top with grain
    const juteTex = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d")!;
        x.fillStyle = "#cdb27a"; x.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 128; i += 4) { x.fillStyle = i % 8 ? "rgba(120, 90, 40, 0.18)" : "rgba(255, 240, 200, 0.18)"; x.fillRect(i, 0, 2, 128); x.fillRect(0, i, 128, 2); }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const sackProfile = [ [ 0.01, 0 ], [ 0.3, 0 ], [ 0.39, 0.08 ], [ 0.43, 0.3 ], [ 0.42, 0.55 ], [ 0.38, 0.74 ], [ 0.36, 0.84 ] ].map(([ r, y ]) => new THREE.Vector2(r, y));
    const juteGeo = new THREE.LatheGeometry(sackProfile, 32);
    { const p = juteGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = 1 + 0.045 * Math.sin(3 * a + y * 5) + 0.02 * Math.sin(7 * a); p.setX(i, x * k); p.setZ(i, z * k); } juteGeo.computeVertexNormals(); }
    const jute = add(juteGeo, new THREE.MeshStandardMaterial({ map : juteTex, roughness : 0.95, side : THREE.DoubleSide }), SACK_AT.x, 0, SACK_AT.z, field);
    add(new THREE.TorusGeometry(0.37, 0.06, 8, 32), clay(0xc2a46c), 0, 0.84, 0, jute).rotation.x = Math.PI / 2;
    add(new THREE.SphereGeometry(0.35, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xd39a3a), 0, 0.7, 0, jute).scale.y = 0.35;
    // the grain: plump golden-brown grains, larger than life so they read from the camera
    const grainGeo = new THREE.CapsuleGeometry(0.034, 0.06, 3, 8), grainMat = soft(0xc98a2e, { roughness : 0.45 });
    for (let i = 0; i < 26; i++) {
        const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.3;
        const g = add(grainGeo, grainMat, Math.cos(a) * r, 0.74 + rand() * 0.04, Math.sin(a) * r, jute); g.rotation.set(Math.PI / 2, rand() * 3, rand() * 3); g.castShadow = false;
    }
    // the soop: a flat bamboo tray, open at the front, raised at the back and sides, with threshed wheat on it
    const soop = new THREE.Group(); soop.position.set(0, 1.2 - 0.95, 0.42); filler.upper.add(soop);
    const bamboo = clay(0xc9a560);
    add(rbox(0.66, 0.025, 0.5, 0.01), bamboo, 0, 0, 0, soop);
    add(rbox(0.66, 0.14, 0.025, 0.01), bamboo, 0, 0.06, -0.24, soop);
    [ -1, 1 ].forEach(sd => { const w = add(rbox(0.025, 0.1, 0.48, 0.01), bamboo, sd * 0.32, 0.04, 0, soop); w.scale.y = 1; w.rotation.x = 0.18; });
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.66, 0.004, 0.01), clay(0xa98545), 0, 0.015, -0.2 + i * 0.08, soop).castShadow = false;
    const heap = add(new THREE.SphereGeometry(0.2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xd9a441), 0, 0.01, -0.06, soop); heap.scale.y = 0.35;
    for (let i = 0; i < 10; i++) add(new THREE.PlaneGeometry(0.06, 0.035), clay(0xf1e3b8, { side : THREE.DoubleSide }), (rand() - 0.5) * 0.3, 0.05, -0.06 + (rand() - 0.5) * 0.25, soop).rotation.x = -Math.PI / 2;
    const lip = new THREE.Object3D(); lip.position.set(0, 0.03, 0.26); soop.add(lip);
    filler.upper.rotation.x = 0.35;
    filler.arms.forEach(a => { a.sh.rotation.set(-1.2, 0, 0); a.el.rotation.x = -0.55; });
    filler.legs.forEach(l => { l.hip.rotation.x = -0.15; l.knee.rotation.x = 0.25; });
    // what flies off the soop: grains falling into the sack, and flakes of husk blown sideways onto a small pile
    const falling = Array.from({ length : 30 }, (_, i) => { const g = add(grainGeo, grainMat, 0, 0, 0, field); g.castShadow = false; g.scale.setScalar(1.25); return { g, ph : i / 30, dx : (rand() - 0.5) * 0.4, dz : (rand() - 0.5) * 0.4 }; });
    const huskMat = new THREE.MeshStandardMaterial({ color : 0xf1e3b8, roughness : 0.9, side : THREE.DoubleSide, transparent : true });
    const husk = Array.from({ length : 40 }, (_, i) => { const m = add(new THREE.PlaneGeometry(0.13, 0.07), huskMat.clone(), 0, 0, 0, field); m.castShadow = false; return { m, ph : i / 40, spread : (rand() - 0.5) * 0.9, spin : rand() * 6 }; });
    // the wind blows across her, towards the reader's side: the husk drifts that way and settles on a pile
    const WIND = new THREE.Vector3(-Math.cos(fillerHeading), 0, Math.sin(fillerHeading));
    const chaffPile = FILLER_AT.clone().addScaledVector(WIND, 1.7);
    for (let i = 0; i < 30; i++) {
        const fl = add(new THREE.PlaneGeometry(0.08, 0.05), clay(0xeedcaa, { side : THREE.DoubleSide }), chaffPile.x + (rand() - 0.5) * 0.7, 0.01 + rand() * 0.04, chaffPile.z + (rand() - 0.5) * 0.5, field);
        fl.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.4, 0, rand() * 6); fl.castShadow = false;
    }
    const lipAt = new THREE.Vector3(), sackMouth = new THREE.Vector3(SACK_AT.x, 0.8, SACK_AT.z);

    // Harvesting, as in "The women who stayed": reach down and gather, draw the sickle across, lift and straighten.
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

    // THE STORY, BY SCROLL ============================================================================================
    const keyed = (p : number, keys : [ number, number ][]) => {
        if (p <= keys[0][0]) return keys[0][1];
        for (let i = 1; i < keys.length; i++) if (p <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * ease(span(p, keys[i - 1][0], keys[i][0]));
        return keys[keys.length - 1][1];
    };
    // The camera, by scroll: the angle round the plate it looks from, how far out from what it looks at and how high,
    // and what it looks at (an angle's distance from the plate's centre, and a height). It visits the field, the mill
    // and the shop, coming down low at the shop to see in under the floor above, then rises over the whole thali.
    const ANGLE : [ number, number ][] = [ [ 0, A_FIELD - 12 ], [ 0.12, A_FIELD ], [ 0.24, A_MILL ], [ 0.38, A_MILL ], [ 0.48, A_SHOP ], [ 0.79, A_SHOP ], [ 0.95, 390 ] ];
    const OUT : [ number, number ][] = [ [ 0, 34 ], [ 0.12, 19 ], [ 0.24, 26 ], [ 0.38, 26 ], [ 0.48, 21 ], [ 0.79, 21 ], [ 0.95, 30 ] ];
    const HIGH : [ number, number ][] = [ [ 0, 22 ], [ 0.12, 10 ], [ 0.24, 15 ], [ 0.38, 15 ], [ 0.48, 5.6 ], [ 0.79, 5.6 ], [ 0.95, 34 ] ];
    const AIM_R : [ number, number ][] = [ [ 0, STATION_R ], [ 0.38, STATION_R ], [ 0.48, STATION_R - 1.6 ], [ 0.79, STATION_R - 1.6 ], [ 0.95, 0 ] ];
    const AIM_Y : [ number, number ][] = [ [ 0, 3.8 ], [ 0.12, 2.6 ], [ 0.38, 3.4 ], [ 0.48, 4.2 ], [ 0.79, 4.2 ], [ 0.95, 0.4 ] ];
    // the three things handed over, one after another: where each starts on the counter and where it ends, in front of
    // the customer or (the oil, last) in her hand, and its part of the hand-over
    const V3 = (x : number, y : number, z : number) => new THREE.Vector3(x, y, z);
    const HANDOVER = [
        { item : dalPacket, from : V3(-0.15, 1.06, 0.75), to : V3(1.2, 1.06, 0.95), a : 0, b : 0.32 },
        { item : riceBag, from : V3(0.35, 1.06, 0.45), to : V3(1.55, 1.06, 0.7), a : 0.33, b : 0.65 },
        { item : oil, from : V3(0.75, 1.06, 0.55), to : V3(1.95, 1.2, 1.5), a : 0.66, b : 1 },
    ];
    // the truck's way in to its place by the mill, and the three spots the worker walks between (on the mill's board)
    const TRUCK_IN : [ number, number ][] = [ [ 0.14, -5.0 ], [ 0.24, -2.6 ] ];
    const TRUCK_PT = new THREE.Vector3(-1.7, 0, 3.4), DOOR_PT = new THREE.Vector3(-0.8, 0, 0.6), BAGS_PT = new THREE.Vector3(1.9, 0, 1.8);
    // a run of n trips between A and B for a progress u: carrying on the way out to B (carryOut) or on the way back,
    // with where the worker is, which way they face and how far along their stride is
    const trip = (u : number, n : number, A : THREE.Vector3, B : THREE.Vector3, carryOut : boolean) => {
        if (u <= 0 || u >= 1) return { pos : A.clone(), carrying : false, moving : false, heading : 0, stride : 0 };
        const k = u * n, f = k - Math.floor(k), out = f < 0.5, seg = out ? f / 0.5 : (f - 0.5) / 0.5;
        const from = out ? A : B, to = out ? B : A;
        return { pos : from.clone().lerp(to, seg), carrying : out === carryOut, moving : true, heading : Math.atan2(to.x - from.x, to.z - from.z), stride : seg * Math.PI * 6 };
    };
    const story = (p : number) => {
        // the truck drives in with raw wheat; the worker carries the sacks into the mill, then loads the packed bags
        truck.position.x = keyed(p, TRUCK_IN);
        const un = span(p, 0.25, 0.31), ld = span(p, 0.31, 0.38);
        const raw = Math.round(5 * (1 - un)), packed = Math.round(6 * ld);
        loadSacks.children.forEach((c, i) => { c.visible = i < raw; });
        loadBags.children.forEach((c, i) => { c.visible = i < packed; });
        const t = p < 0.31 ? trip(un, 3, TRUCK_PT, DOOR_PT, true) : trip(ld, 3, TRUCK_PT, BAGS_PT, false);
        worker.root.position.copy(t.pos); if (t.moving) worker.root.rotation.y = t.heading;
        carriedSack.visible = t.carrying && p < 0.31; carriedBag.visible = t.carrying && p >= 0.31;
        const st = t.moving ? Math.sin(t.stride) : 0;
        worker.legs[0].hip.rotation.x = st * 0.4; worker.legs[1].hip.rotation.x = -st * 0.4;
        worker.legs[0].knee.rotation.x = Math.max(0, -st) * 0.6; worker.legs[1].knee.rotation.x = Math.max(0, st) * 0.6;
        if (t.carrying) { worker.arms[1].sh.rotation.set(-2.6, 0, -0.3); worker.arms[1].el.rotation.x = -0.6; }
        else { worker.arms[1].sh.rotation.set(st * 0.3, 0, 0); worker.arms[1].el.rotation.x = -0.2; }
        worker.arms[0].sh.rotation.set(-st * 0.3, 0, 0);
        // the shopkeeper weighs the dal: the pan fills as the scoop goes in, and the beam comes level
        const wk = span(p, BEATS.weigh, BEATS.give - 0.02);
        panDal.scale.setScalar(0.25 + 0.75 * wk);
        beam.rotation.z = 0.24 * (1 - ease(wk));
        pans.forEach(pn => { pn.hang.rotation.z = -beam.rotation.z; });
        const scoop = p >= BEATS.weigh && p < BEATS.give ? (Math.sin(wk * Math.PI * 6) + 1) / 2 : 0;
        shopkeeper.arms[0].sh.rotation.set(-0.9 - 0.4 * scoop, 0, 0.25); shopkeeper.arms[0].el.rotation.x = -0.9;
        // the weighed dal goes into a paper packet; then he hands over the dal, a bag of rice and a bottle of oil, one
        // after another, reaching out for each; the customer takes the oil last, and it stays in her hand
        const g = span(p, BEATS.give, BEATS.home - 0.02);
        panDal.visible = p < BEATS.give;
        dalPacket.visible = p >= BEATS.give;
        let reach = 0;
        HANDOVER.forEach(h => {
            const u = span(g, h.a, h.b);
            h.item.position.lerpVectors(h.from, h.to, ease(u)); h.item.position.y += Math.sin(u * Math.PI) * 0.35;
            reach = Math.max(reach, Math.sin(u * Math.PI));
        });
        shopkeeper.arms[1].sh.rotation.set(-0.3 - 1.0 * reach, 0, -0.1); shopkeeper.arms[1].el.rotation.x = -0.4 - 0.3 * (1 - reach);
        customer.arms[1].sh.rotation.set(-0.2 - 0.9 * ease(span(g, 0.72, 0.95)), 0, 0); customer.arms[1].el.rotation.x = -0.5;
        return { angle : keyed(p, ANGLE), out : keyed(p, OUT), high : keyed(p, HIGH), aimR : keyed(p, AIM_R), aimY : keyed(p, AIM_Y), top : span(p, 0.79, 0.95) };
    };

    // FRAMING =========================================================================================================
    let W = 1, H = 1;
    const aim = new THREE.Vector3();
    const frame = (f : ReturnType<typeof story>) => {
        const aspect = W / H, a = f.angle * DEG, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        camera.aspect = aspect;
        // a narrow screen sees less across, so the camera stands further back; most of all for the whole plate
        const back = aspect >= 1.15 ? 1 : Math.min(2.4, 1.15 / aspect) * (1 - 0.25 * (1 - f.top));
        aim.copy(dir).multiplyScalar(f.aimR); aim.y = f.aimY;
        camera.position.copy(aim).addScaledVector(dir, f.out * back); camera.position.y += f.high * back;
        camera.up.set(0, 1, 0);
        camera.lookAt(aim);
        camera.updateProjectionMatrix();
        const dist = camera.position.distanceTo(aim);
        (scene.fog as THREE.Fog).near = dist * 1.1; (scene.fog as THREE.Fog).far = dist * 2.6;
    };
    const resize = (width : number, height : number) => { W = width; H = height; renderer.setSize(width, height, false); };

    return {
        render : (progress, time) => {
            const t = opts.reduced ? 0 : time;
            wind.value = t;
            lamp.intensity = 2.9 + (opts.reduced ? 0 : Math.sin(time * 7.3) * 0.04 + Math.sin(time * 3.1) * 0.05);
            harvestPose(harvester, opts.reduced ? 0.3 : (time % 3) / 3);
            harvestPose(harvester2, opts.reduced ? 0.55 : ((time + 1.4) % 3.4) / 3.4);
            // the farmer's round, in a loop: carry a filled sack to the stack, set it down, walk back, lift the next
            {
                const k = opts.reduced ? 0.2 : (time / 7) % 1, out = k < 0.42, back = k >= 0.5 && k < 0.92;
                const seg = out ? k / 0.42 : back ? (k - 0.5) / 0.42 : 0;
                const from = out ? FARM_A : FARM_B, to = out ? FARM_B : FARM_A;
                farmer.root.position.copy(out || back ? from.clone().lerp(to, seg) : k < 0.5 ? FARM_B : FARM_A);
                if (out || back) farmer.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
                const st = out || back ? Math.sin(seg * Math.PI * 6) : 0;
                farmer.legs[0].hip.rotation.x = st * 0.4; farmer.legs[1].hip.rotation.x = -st * 0.4;
                farmer.legs[0].knee.rotation.x = Math.max(0, -st) * 0.6; farmer.legs[1].knee.rotation.x = Math.max(0, st) * 0.6;
                // he bends to set the sack down at the stack and to lift the next one
                const bend = !out && !back ? Math.sin(((k < 0.5 ? (k - 0.42) / 0.08 : (k - 0.92) / 0.08)) * Math.PI) : 0;
                farmer.upper.rotation.x = 0.5 * bend;
                const carrying = out || (k >= 0.92) || (k >= 0.42 && k < 0.46);
                farmerSack.visible = carrying;
                if (carrying) { farmer.arms[1].sh.rotation.set(-2.6, 0, -0.3); farmer.arms[1].el.rotation.x = -0.6; }
                else { farmer.arms[1].sh.rotation.set(-st * 0.35, 0, 0); farmer.arms[1].el.rotation.x = -0.2; }
                farmer.arms[0].sh.rotation.set(st * 0.35, 0, 0);
            }
            // winnowing: she jerks the soop up and forward again and again; the husk lifts off and blows away, and the
            // heavier grain drops from the front of the soop into the sack
            const jerk = opts.reduced ? 0 : Math.max(0, Math.sin(time * 9)) ** 2;
            soop.rotation.x = 0.28 + 0.16 * jerk; soop.position.y = 1.2 - 0.95 + 0.05 * jerk;
            filler.arms.forEach(a => { a.sh.rotation.x = -1.2 - 0.12 * jerk; });
            lip.getWorldPosition(lipAt); field.worldToLocal(lipAt);
            falling.forEach(f => {
                const k = opts.reduced ? f.ph : (t * 1.1 + f.ph) % 1;
                f.g.position.set(lipAt.x + (sackMouth.x - lipAt.x + f.dx * 0.5) * k, lipAt.y + (sackMouth.y - lipAt.y) * k * k, lipAt.z + (sackMouth.z - lipAt.z + f.dz * 0.5) * k);
                f.g.rotation.set(k * 6, f.ph * 9, 0);
            });
            husk.forEach(h => {
                const k = opts.reduced ? h.ph : (t * 0.32 + h.ph) % 1;
                h.m.position.set(lipAt.x, lipAt.y, lipAt.z).addScaledVector(WIND, 1.8 * k);
                h.m.position.x += h.spread * k * Math.cos(fillerHeading) * 0.5; h.m.position.z -= h.spread * k * Math.sin(fillerHeading) * 0.5;
                h.m.position.y = lipAt.y + 0.35 * Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k) - (lipAt.y - 0.03) * k * k;
                h.m.rotation.set(h.spin + t * 3, h.spin * 2 + t * 2, 0);
                (h.m.material as THREE.MeshStandardMaterial).opacity = k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15;
            });
            puffs.forEach((pf, i) => {
                const k = opts.reduced ? i / puffs.length : ((t * 0.18 + i / puffs.length) % 1);
                pf.position.set(2.3 + k * 1.4, 6.7 + k * 3.0, -1.2 - k * 0.5); pf.scale.setScalar(0.6 + k * 1.8);
                (pf.material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - k);
            });
            steam.forEach((s, i) => {
                const k = opts.reduced ? i / steam.length : ((t * 0.3 + i / steam.length) % 1);
                s.position.set(Math.sin(k * 6 + i) * 0.6 + (i - 3) * 0.5, 0.4 + k * 5.0, Math.cos(i * 2) * 1.2); s.scale.setScalar(0.6 + k * 2.2);
                (s.material as THREE.MeshStandardMaterial).opacity = 0.35 * (1 - k);
            });
            frame(story(clamp01(progress)));
            renderer.render(scene, camera);
        },
        resize,
        dispose : () => {
            scene.traverse(o => {
                const m = o as THREE.Mesh;
                if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [ m.material ]).forEach(x => x.dispose()); }
            });
            envMap.dispose(); pmrem.dispose(); renderer.dispose();
        },
    };
};
