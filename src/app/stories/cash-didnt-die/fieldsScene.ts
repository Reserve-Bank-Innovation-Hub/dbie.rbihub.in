// The machines: two fields seen from above, ATMs on one side and banking agents with micro-ATMs on the other, month
// by month from November 2019. One machine on screen is 10,000 machines; one small person in a queue is 10 withdrawals
// a day at a machine. So each field's machines are the month's count, and its people the month's withdrawals: the
// ATMs barely grow and their queues shorten; the agents multiply, each with at most a person or two waiting.
// The caller works the numbers out (CashStage.tsx); here they are drawn. New machines rise into place, scattered
// through the field; the person at the front of a queue is served every few seconds, walks off and someone joins at
// the back; when a month's queue changes, people join or leave until it matches.

// REACT CORE ==========================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// LOCAL ===============================================================================================================
import { JOURNEY, KOSH, fitToHost, loopWhileVisible, makeRenderer } from "./cashThree";
import { CLOTHES, mountPeople, personParts, type Kind } from "./people";

export interface FieldsScene {
    play     : () => void;
    pause    : () => void;
    setMonth : (m : number) => void;
    dispose  : () => void;
}
export interface FieldsOptions {
    reduced     : boolean;
    atmN        : number[];          // machines on screen each month
    microN      : number[];
    atmPeople   : number[];          // people in all the ATM queues each month
    microPeople : number[];
    onMonth     : (m : number) => void;
    onEnd       : () => void;
}

const CH = [ 0x2f2f2f, 0x444444, 0x595959, 0x6d6d6d, 0x828282 ];
const ATM_SLOTS = 30, MICRO_SLOTS = 144, PEOPLE = 420;

// GEOMETRY ============================================================================================================
function painted(g : THREE.BufferGeometry, color : number, x : number, y : number, z : number, rz = 0) {
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(1, 1, 1)));
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    const c = new THREE.Color(color), n = flat.getAttribute("position").count, rgb = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) rgb.set([ c.r, c.g, c.b ], k * 3);
    flat.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    return flat;
}
// a small ATM, facing +z
const atmGeometry = () => mergeGeometries([
    painted(new THREE.BoxGeometry(0.66, 1.78, 0.58), CH[2], 0, 0.89, 0),
    painted(new THREE.BoxGeometry(0.7, 0.07, 0.62), CH[1], 0, 1.8, 0),
    painted(new THREE.BoxGeometry(0.42, 0.3, 0.03), KOSH.indivara, 0, 1.47, 0.3),
    painted(new THREE.BoxGeometry(0.5, 0.14, 0.06), CH[4], 0, 1.17, 0.3),
    painted(new THREE.BoxGeometry(0.4, 0.06, 0.04), CH[0], 0, 0.98, 0.3),
]);
// a banking agent's table, the agent behind it, the micro-ATM on it, and a sign
const stationGeometry = () => {
    const agent = personParts("man");
    const behind = new THREE.Matrix4().makeTranslation(0, 0, -0.42);
    const tint = (gs : THREE.BufferGeometry[], c? : number) => gs.map(g => {
        g.applyMatrix4(behind);
        if (c !== undefined) { const col = new THREE.Color(c), a = g.getAttribute("color"); for (let k = 0; k < a.count; k++) a.setXYZ(k, col.r, col.g, col.b); }
        return g;
    });
    return mergeGeometries([
        ...tint(agent.rest), ...tint(agent.cloth, KOSH.indivara),
        painted(new THREE.BoxGeometry(0.9, 0.04, 0.5), KOSH.sandal4, 0, 0.74, 0),
        ...[ [ -0.4, -0.2 ], [ 0.4, -0.2 ], [ -0.4, 0.2 ], [ 0.4, 0.2 ] ].map(([ x, z ]) => painted(new THREE.BoxGeometry(0.04, 0.72, 0.04), KOSH.terracotta, x, 0.36, z)),
        painted(new THREE.BoxGeometry(0.12, 0.04, 0.18), CH[0], -0.1, 0.78, 0.08),
        painted(new THREE.BoxGeometry(0.08, 0.04, 0.02), KOSH.neem, -0.1, 0.8, 0.0),
        painted(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), CH[0], 0.52, 0.75, -0.15),
        painted(new THREE.BoxGeometry(0.36, 0.2, 0.02), KOSH.indivara, 0.52, 1.45, -0.15),
    ]);
};
// a label lying on the ground
function groundLabel(lines : string[], w : number) {
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 160;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = "#2f2f2f"; g.textAlign = "left";
    g.font = "700 64px system-ui, sans-serif"; g.fillText(lines[0], 8, 70);
    if (lines[1]) { g.font = "500 44px system-ui, sans-serif"; g.fillStyle = "#595959"; g.fillText(lines[1], 8, 135); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 1024), new THREE.MeshBasicMaterial({ map : t, transparent : true, depthWrite : false }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

// LAYOUT ==============================================================================================================
// Wide screens: the ATMs on the left in rows of nine, their queues running towards the reader; the agents on the
// right in a 12 × 12 field. Phones: the ATMs above in rows of five, the agents below.
interface Spot { x : number; z : number }
function layout(phone : boolean) {
    let s = 11;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const atm : Spot[] = [], micro : Spot[] = [];
    if (!phone) {
        for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) atm.push({ x : -13.4 + c * 1.3, z : -5.6 + r * 4.0 });
        for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) micro.push({ x : 1.9 + c * 0.95 + (rnd() - 0.5) * 0.24, z : -6 + r * 1.0 + (rnd() - 0.5) * 0.2 });
    } else {
        for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) atm.push({ x : -4 + c * 1.6, z : -22.5 + r * 3.7 });
        for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) micro.push({ x : -5.4 + c * 0.98 + (rnd() - 0.5) * 0.24, z : -2 + r * 1.0 + (rnd() - 0.5) * 0.2 });
    }
    // the order machines appear in: scattered, the same every time
    const shuffle = (n : number) => { const o = Array.from({ length : n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ o[i], o[j] ] = [ o[j], o[i] ]; } return o; };
    // labels in front of each field on a wide screen (the back is under the page's words), above each on a phone
    const atmLabel = phone ? { x : -4.3, z : -24.4, w : 8 } : { x : -13.8, z : 7.4, w : 9 };
    const microLabel = phone ? { x : -5.8, z : -3.6, w : 8 } : { x : 1.6, z : 7.4, w : 9 };
    return { atm : shuffle(ATM_SLOTS).map(i => atm[i]), micro : shuffle(MICRO_SLOTS).map(i => micro[i]), atmLabel, microLabel };
}

// QUEUES ==============================================================================================================
interface Person { x : number; z : number; yaw : number; show : number; leaving : boolean; dx : number; dz : number; kind : Kind; cloth : number; size : number; phase : number }
interface Line { at : Spot; step : number; leave : [ number, number ]; serve : number; clock : number; target : number; people : Person[] }

export function mountFieldsScene(canvas : HTMLCanvasElement, o : FieldsOptions) : FieldsScene {
    const host = canvas.parentElement as HTMLElement;
    const phone = host.clientWidth < 760;
    const renderer = makeRenderer(canvas, phone);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 120);
    scene.add(new THREE.HemisphereLight(0xffffff, KOSH.sandalwood, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(-8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, phone ? { left : -16, right : 16, top : 20, bottom : -20, near : 1, far : 60 } : { left : -18, right : 18, top : 14, bottom : -12, near : 1, far : 60 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0006;
    scene.add(sun);

    const own : { dispose : () => void }[] = [];
    const floorGeo = new THREE.PlaneGeometry(80, 80), floorMat = new THREE.ShadowMaterial({ opacity : 0.14 });
    own.push(floorGeo, floorMat);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);

    const L = layout(phone);
    const lab1 = groundLabel([ "ATMs", "each one here: 10,000 machines" ], L.atmLabel.w), lab2 = groundLabel([ "Micro-ATMs, with banking agents", "each one here: 10,000 machines" ], L.microLabel.w);
    lab1.position.set(L.atmLabel.x + L.atmLabel.w / 2, 0.01, L.atmLabel.z); lab2.position.set(L.microLabel.x + L.microLabel.w / 2, 0.01, L.microLabel.z);
    scene.add(lab1, lab2);
    for (const l of [ lab1, lab2 ]) { own.push(l.geometry, l.material as THREE.Material, (l.material as THREE.MeshBasicMaterial).map as THREE.Texture); }

    // MACHINES ========================================================================================================
    const vc = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.6, metalness : 0.1 });
    const atmGeo = atmGeometry(), stationGeo = stationGeometry();
    own.push(vc, atmGeo, stationGeo);
    const atms = new THREE.InstancedMesh(atmGeo, vc, ATM_SLOTS), stations = new THREE.InstancedMesh(stationGeo, vc, MICRO_SLOTS);
    for (const m of [ atms, stations ]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
    const atmShow = new Float32Array(ATM_SLOTS), microShow = new Float32Array(MICRO_SLOTS);
    let atmCount = 0, microCount = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const placeMachines = (dt : number) => {
        for (const [ mesh, show, spots, count ] of [ [ atms, atmShow, L.atm, atmCount ], [ stations, microShow, L.micro, microCount ] ] as const) {
            for (let i = 0; i < show.length; i++) {
                const want = i < count ? 1 : 0;
                show[i] = dt === Infinity ? want : want ? Math.min(1, show[i] + dt / 0.3) : Math.max(0, show[i] - dt / 0.3);
                const e = show[i] * show[i] * (3 - 2 * show[i]);
                m4.compose(v.set(spots[i].x, -(1 - e) * 0.6, spots[i].z), q.identity(), sc.setScalar(Math.max(0.0001, e)));
                mesh.setMatrixAt(i, m4);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    };

    // QUEUES ==========================================================================================================
    // one line in front of every machine slot, used when the machine is there
    let seed = 5;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const lines : Line[] = [
        ...L.atm.map(at => ({ at : { x : at.x, z : at.z + 0.62 }, step : 0.3, leave : [ 1, 0.5 ] as [ number, number ], serve : 2 + rnd() * 2, clock : rnd() * 2, target : 0, people : [] as Person[] })),
        ...L.micro.map(at => ({ at : { x : at.x, z : at.z + 0.5 }, step : 0.3, leave : [ -1, 0.6 ] as [ number, number ], serve : 4 + rnd() * 5, clock : rnd() * 4, target : 0, people : [] as Person[] })),
    ];
    const newPerson = (x : number, z : number, show : number) : Person => {
        const r = rnd();
        const kind : Kind = r < 0.42 ? "woman" : r < 0.62 ? "bag" : "man";
        return { x, z, yaw : Math.PI, show, leaving : false, dx : 0, dz : 0, kind, cloth : CLOTHES[Math.floor(rnd() * CLOTHES.length)], size : rnd() < 0.12 ? 0.62 : 0.92 + rnd() * 0.14, phase : rnd() * 10 };
    };
    const slot = (l : Line, j : number) => ({ x : l.at.x, z : l.at.z + j * l.step });
    const join = (l : Line, instant : boolean) => {
        const n = l.people.filter(p => !p.leaving).length, s = slot(l, instant ? n : n + 3);
        l.people.push(newPerson(s.x, s.z, instant ? 1 : 0));
    };
    const serve = (l : Line) => {
        const p = l.people.find(p => !p.leaving);
        if (!p) return;
        p.leaving = true;
        const d = Math.hypot(...l.leave);
        p.dx = l.leave[0] / d; p.dz = l.leave[1] / d;
        p.yaw = Math.atan2(p.dx, p.dz);
    };
    // the month's people shared out: evenly across the ATMs there are; one each at as many agents as there are people
    const setTargets = (m : number, instant : boolean) => {
        atmCount = Math.min(ATM_SLOTS, Math.round(o.atmN[m])); microCount = Math.min(MICRO_SLOTS, Math.round(o.microN[m]));
        const pa = Math.round(o.atmPeople[m]), pm = Math.round(o.microPeople[m]);
        lines.forEach((l, i) => {
            if (i < ATM_SLOTS) l.target = i < atmCount ? Math.floor(pa / atmCount) + (i < pa % atmCount ? 1 : 0) : 0;
            else { const k = i - ATM_SLOTS; l.target = k < microCount ? Math.floor(pm / microCount) + (((k * 37) % microCount) < pm % microCount ? 1 : 0) : 0; }
            if (instant) { l.people = []; for (let j = 0; j < l.target; j++) join(l, true); }
        });
        if (instant) placeMachines(Infinity);
    };

    let time = 0;
    const stepPeople = (dt : number) => {
        const people = mountedPeople;
        people.begin();
        for (const l of lines) {
            const waiting = l.people.filter(p => !p.leaving);
            l.clock += dt;
            const off = waiting.length - l.target;
            const every = off === 0 ? l.serve : 0.06;
            if (l.clock >= every) {
                l.clock = 0;
                if (off > 0) serve(l);
                else if (off < 0) join(l, false);
                else if (waiting.length) { serve(l); join(l, false); }
            }
            let j = 0;
            const k = 1 - Math.exp(-3 * dt);
            for (const p of l.people) {
                if (p.leaving) {
                    p.x += p.dx * 1.1 * dt; p.z += p.dz * 1.1 * dt;
                    p.show = Math.max(0, p.show - dt / 1.4);
                } else {
                    const s = slot(l, j++);
                    p.x += (s.x - p.x) * k; p.z += (s.z - p.z) * k;
                    p.yaw += (Math.PI - p.yaw) * k;
                    p.show = Math.min(1, p.show + dt / 0.5);
                }
                const e = p.show * p.show * (3 - 2 * p.show);
                q.setFromAxisAngle(up, p.yaw + Math.sin(time * 0.8 + p.phase) * 0.08);
                m4.compose(v.set(p.x, p.leaving ? Math.abs(Math.sin(time * 9 + p.phase)) * 0.03 : 0, p.z), q, sc.setScalar(Math.max(0.0001, e * p.size)));
                people.add(m4, p.kind, p.cloth);
            }
            l.people = l.people.filter(p => !(p.leaving && p.show <= 0));
        }
        people.end();
    };
    const mountedPeople = mountPeople(scene, PEOPLE);

    // THE CLOCK =======================================================================================================
    const last = o.atmN.length - 1;
    const MONTH = JOURNEY / o.atmN.length;              // seconds a month lasts
    let m = 0, inMonth = 0, playing = false;
    const step = (dt : number) => {
        time += dt;
        if (playing && (inMonth += dt) >= MONTH) {
            inMonth -= MONTH;
            if (m < last) { m++; setTargets(m, false); o.onMonth(m); }
            else { playing = false; o.onEnd(); }
        }
        placeMachines(dt);
        stepPeople(dt);
    };

    // CAMERA ==========================================================================================================
    // from high in front, like a model of a town seen from a hill
    const frame = (w : number, h : number) => {
        camera.aspect = w / h;
        if (w / h > 1.1) { camera.fov = 30; camera.position.set(-0.3, 30, 30); camera.lookAt(-0.3, 0, -3.6); }
        else { camera.fov = 40; camera.position.set(0, 44, 10); camera.lookAt(0, 0, -6.5); }
        camera.updateProjectionMatrix();
    };
    const unfit = fitToHost(canvas, renderer, frame);

    let unloop = () => {};
    if (o.reduced) { m = last; setTargets(m, true); stepPeople(0); renderer.render(scene, camera); }
    else { setTargets(0, true); unloop = loopWhileVisible(canvas, dt => { step(dt); renderer.render(scene, camera); }); }

    return {
        play : () => {
            if (o.reduced) return;
            if (m >= last) { m = 0; setTargets(0, true); o.onMonth(0); }
            playing = true; inMonth = 0;
        },
        pause : () => { playing = false; },
        setMonth : (i : number) => {
            m = Math.max(0, Math.min(last, i)); inMonth = 0; setTargets(m, true);
            if (o.reduced) { stepPeople(0); renderer.render(scene, camera); }
        },
        dispose : () => { unloop(); unfit(); mountedPeople.dispose(); own.forEach(x => x.dispose()); renderer.dispose(); },
    };
}
