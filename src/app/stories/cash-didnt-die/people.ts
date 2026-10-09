// Small people for the 3D scenes, in a few kinds so a crowd does not look cloned: a man in a shirt, a man with a
// shoulder bag, a woman in a sari, and children (either, drawn smaller). Each kind is two instanced meshes: its
// clothes, tinted per person from the Kosh palette, and the rest (skin, hair, trousers) in their own colours.
// All face +z and stand on y = 0; 1.6 m tall at scale 1.

// REACT CORE ==========================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// LOCAL ===============================================================================================================
import { KOSH } from "./cashThree";

export type Kind = "man" | "bag" | "woman";
export const KINDS : Kind[] = [ "man", "bag", "woman" ];
export const CLOTHES = [ KOSH.indivara, KOSH.turmeric, KOSH.neem, 0x24b6ff, KOSH.vermilion, KOSH.terracotta, KOSH.sandalwood, 0xa984ec, 0xf0c475, 0xf9f7f2 ];
const TROUSERS = 0x444444, HAIR = KOSH.charcoal, SKIN = KOSH.terracotta;

// a geometry moved into place and painted one colour, ready to merge
const part = (g : THREE.BufferGeometry, color : number, x : number, y : number, z : number, s : [ number, number, number ] = [ 1, 1, 1 ], rot : [ number, number, number ] = [ 0, 0, 0 ]) => {
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...s)));
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    const c = new THREE.Color(color), n = flat.getAttribute("position").count, rgb = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) rgb.set([ c.r, c.g, c.b ], k * 3);
    flat.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    return flat;
};
const caps = (r : number, l : number) => new THREE.CapsuleGeometry(r, l, 3, 8);
const ball = (r : number) => new THREE.SphereGeometry(r, 12, 9);

const head = () => [
    part(ball(0.11), SKIN, 0, 1.5, 0),
    part(new THREE.SphereGeometry(0.115, 12, 9, 0, Math.PI * 2, 0, Math.PI / 2), HAIR, 0, 1.53, -0.01),
];
const arms = () => [ part(caps(0.042, 0.46), SKIN, -0.2, 0.98, 0.02), part(caps(0.042, 0.46), SKIN, 0.2, 0.98, 0.02) ];

// rest: what keeps its own colour; cloth: what is tinted per person (painted white here)
export function personParts(kind : Kind) : { rest : THREE.BufferGeometry[]; cloth : THREE.BufferGeometry[] } {
    if (kind === "woman") return {
        rest : [
            ...head(), ...arms(),
            part(ball(0.07), HAIR, 0, 1.47, -0.11),                                        // a bun
            part(caps(0.045, 0.06), SKIN, -0.07, 0.05, 0.04), part(caps(0.045, 0.06), SKIN, 0.07, 0.05, 0.04),   // feet
        ],
        cloth : [
            part(new THREE.CylinderGeometry(0.15, 0.24, 0.85, 14), 0xffffff, 0, 0.5, 0),     // the sari's fall
            part(caps(0.135, 0.3), 0xffffff, 0, 1.12, 0, [ 1.05, 1, 0.72 ]),                  // blouse and drape
            part(new THREE.BoxGeometry(0.1, 0.62, 0.2), 0xffffff, 0.06, 1.05, 0.0, [ 1, 1, 1 ], [ 0, 0, -0.5 ]),   // the pallu over the shoulder
        ],
    };
    const legs = [ part(caps(0.06, 0.64), TROUSERS, -0.075, 0.4, 0), part(caps(0.06, 0.64), TROUSERS, 0.075, 0.4, 0) ];
    const shirt = part(caps(0.14, 0.42), 0xffffff, 0, 1.07, 0, [ 1.05, 1, 0.7 ]);
    if (kind === "bag") return {
        rest : [
            ...head(), ...arms(), ...legs,
            part(new THREE.BoxGeometry(0.08, 0.24, 0.26), KOSH.sandalwood, 0.24, 0.82, 0),   // the bag at the hip
            part(new THREE.BoxGeometry(0.03, 0.72, 0.03), KOSH.sandalwood, 0.04, 1.1, 0.12, [ 1, 1, 1 ], [ 0, 0, 0.62 ]),  // its strap
        ],
        cloth : [ shirt ],
    };
    return { rest : [ ...head(), ...arms(), ...legs ], cloth : [ shirt ] };
}

export interface People {
    // add one person this frame: where, which way, how big (1 grown, about 0.62 a child), what kind, clothes colour
    add   : (m : THREE.Matrix4, kind : Kind, cloth : number) => void;
    begin : () => void;
    end   : () => void;
    dispose : () => void;
}

export function mountPeople(scene : THREE.Scene, cap : number) : People {
    const restMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.8 });
    const clothMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.9 });
    const geos : THREE.BufferGeometry[] = [];
    const meshes = {} as Record<Kind, { r : THREE.InstancedMesh; c : THREE.InstancedMesh; n : number }>;
    for (const k of KINDS) {
        const p = personParts(k);
        const rest = mergeGeometries(p.rest), cloth = mergeGeometries(p.cloth);
        geos.push(rest, cloth, ...p.rest, ...p.cloth);
        const r = new THREE.InstancedMesh(rest, restMat, cap), c = new THREE.InstancedMesh(cloth, clothMat, cap);
        for (const m of [ r, c ]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.count = 0; scene.add(m); }
        meshes[k] = { r, c, n : 0 };
    }
    const col = new THREE.Color();
    return {
        begin : () => { for (const k of KINDS) meshes[k].n = 0; },
        add : (m, kind, cloth) => {
            const s = meshes[kind];
            if (s.n >= cap) return;
            s.r.setMatrixAt(s.n, m); s.c.setMatrixAt(s.n, m); s.c.setColorAt(s.n, col.set(cloth));
            s.n++;
        },
        end : () => {
            for (const k of KINDS) {
                const s = meshes[k];
                s.r.count = s.c.count = s.n;
                s.r.instanceMatrix.needsUpdate = true; s.c.instanceMatrix.needsUpdate = true;
                if (s.c.instanceColor) s.c.instanceColor.needsUpdate = true;
            }
        },
        dispose : () => { geos.forEach(g => g.dispose()); restMat.dispose(); clothMat.dispose(); },
    };
}
