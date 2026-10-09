// The title's ATM: a plain cash machine (no bank's name or maker's mark) paying out ₹500 notes that flutter forward
// and fall out of the bottom of the frame in a stream that never stops. No numbers and no heap: the title says only
// that cash keeps coming; the numbers come later, in the 2D steps on the stock and the tide.
// The opening plays once, in three beats, each one move, eased: a close shot of the cash slot as a single note slides
// slowly out and drops; one continuous pull-back to the whole machine as the stream begins; and the settle, the
// screen turning from PLEASE TAKE YOUR CASH to the story's title.
// The setting: the machine stands in a kiosk on a glossy tiled floor under a warm pool of light, a green ATM sign on
// the frosted back glass above it, a red plastic stool beside it; beyond the glass a huge faint ₹ turns slowly, and a
// few notes drift at the edges of the frame, close to the lens and out of focus. All of it comes in as the camera
// pulls back. `onReveal` tells the page when to bring in its words,
// as the machine comes to rest. Reduced motion starts on the settled shot.

// REACT CORE ==========================================================================================================
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// LOCAL ===============================================================================================================
import { KOSH, NOTE_H, NOTE_W, fitToHost, loopWhileVisible, makeRenderer, noteTexture } from "./cashThree";

export interface AtmScene { dispose : () => void }
export interface AtmOptions { reduced : boolean; onReveal : () => void }


// Charcoal and its tints, 10% steps towards white, as the Kosh scale makes them.
const CH = [ 0x2f2f2f, 0x444444, 0x595959, 0x6d6d6d, 0x828282, 0x979797, 0xacacac ];

// Sizes in metres. A note is drawn 1.4 times its size so it reads beside the machine.
const NS = 1.4, NW = NOTE_W / 10 * NS, NH = NOTE_H / 10 * NS, NT = 0.0018;
const SLOT_Y = 0.99, FRONT = 0.3;
const FLY = 220;                        // notes in the air at most
// The opening's clock, in seconds: the note slides out over the first beat; the camera moves from MOVE_AT to SETTLE_AT;
// the stream starts at STREAM_AT; the page's words come in at REVEAL_AT; the screen turns to the title from SCREEN_AT.
const SLIDE_OUT = 1.5, MOVE_AT = 1.3, SETTLE_AT = 5.2, STREAM_AT = 2.2, REVEAL_AT = 4.0, SCREEN_AT = 3.6;

// THE MACHINE'S FACES =================================================================================================
function canvasTex(w : number, h : number, draw : (g : CanvasRenderingContext2D) => void, renderer : THREE.WebGLRenderer) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    draw(cv.getContext("2d") as CanvasRenderingContext2D);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
}
const hex = (c : number) => `#${c.toString(16).padStart(6, "0")}`;
const rr = (g : CanvasRenderingContext2D, x : number, y : number, w : number, h : number, r : number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// The screen: Indivara, white type, the words a machine shows while it pays out.
const screenFace = (g : CanvasRenderingContext2D) => {
    const W = 760, H = 560;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, hex(KOSH.indivara)); grad.addColorStop(1, "#7444cc");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = "#ffffff"; g.textAlign = "center";
    g.font = "600 46px ui-monospace, Menlo, monospace";
    g.fillText("PLEASE TAKE YOUR CASH", W / 2, 190);
    g.font = "600 44px 'Kohinoor Devanagari', 'Noto Sans Devanagari', sans-serif";
    g.fillText("कृपया अपनी नकदी लें", W / 2, 268);
    g.globalAlpha = 0.6; g.fillRect(150, 318, W - 300, 3); g.globalAlpha = 1;
    g.font = "700 120px system-ui, sans-serif";
    g.fillText("₹", W / 2, 470);
};

// The screen once the machine is in view: the story's title, in the page's heading font, "die" in turmeric.
const titleFace = (font : string) => (g : CanvasRenderingContext2D) => {
    const W = 760, H = 560;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, hex(KOSH.indivara)); grad.addColorStop(1, "#7444cc");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.textAlign = "center";
    g.font = `700 112px ${font}`;
    g.fillStyle = "#ffffff"; g.fillText("Cash didn’t", W / 2, 250);
    g.fillStyle = hex(KOSH.turmeric); g.fillText("die", W / 2, 380);
    g.globalAlpha = 0.6; g.fillStyle = "#ffffff"; g.fillRect(250, 440, W - 500, 3); g.globalAlpha = 1;
};

// The counter's face: the receipt slot, the keypad, the card slot, and their labels.
const counterFace = (g : CanvasRenderingContext2D) => {
    const W = 1320, H = 520;
    g.fillStyle = hex(CH[3]); g.fillRect(0, 0, W, H);
    // a recessed panel
    g.fillStyle = hex(CH[4]); rr(g, 30, 30, W - 60, H - 60, 18); g.fill();
    g.font = "600 22px system-ui, sans-serif"; g.textAlign = "center";
    // receipt
    g.fillStyle = hex(CH[2]); rr(g, 70, 50, 250, 44, 8); g.fill();
    g.fillStyle = "#f0f0f0"; g.fillText("RECEIPT", 195, 80);
    g.fillStyle = hex(CH[0]); rr(g, 70, 130, 250, 26, 6); g.fill();
    g.fillStyle = hex(CH[5]); rr(g, 90, 220, 140, 140, 10); g.fill();
    // keypad: a hood, twelve keys and four function keys
    g.fillStyle = hex(CH[0]); rr(g, 430, 50, 460, 420, 24); g.fill();
    g.fillStyle = hex(CH[1]); rr(g, 460, 70, 400, 120, 14); g.fill();
    const keys = [ "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#" ];
    g.font = "700 30px system-ui, sans-serif";
    keys.forEach((k, i) => {
        const x = 478 + (i % 3) * 92, y = 214 + Math.floor(i / 3) * 62;
        g.fillStyle = hex(CH[5]); rr(g, x, y, 80, 50, 8); g.fill();
        g.fillStyle = hex(CH[0]); g.fillText(k, x + 40, y + 36);
    });
    [ KOSH.vermilion, KOSH.turmeric, CH[5], KOSH.neem ].forEach((c, i) => {
        g.fillStyle = hex(c); rr(g, 768, 214 + i * 62, 86, 50, 8); g.fill();
    });
    // card
    g.fillStyle = hex(CH[2]); rr(g, 1000, 50, 250, 44, 8); g.fill();
    g.fillStyle = "#f0f0f0"; g.font = "600 22px system-ui, sans-serif"; g.fillText("CARD", 1125, 80);
    g.fillStyle = hex(KOSH.neem); rr(g, 990, 128, 270, 140, 16); g.fill();
    g.fillStyle = hex(CH[0]); rr(g, 1030, 186, 190, 18, 6); g.fill();
    g.fillStyle = hex(CH[5]); rr(g, 1050, 310, 150, 130, 10); g.fill();
};

// The cash slot's plate: CASH OUT over a shutter, with a grip on the left.
const slotFace = (g : CanvasRenderingContext2D) => {
    const W = 1000, H = 240;
    g.fillStyle = hex(CH[3]); g.fillRect(0, 0, W, H);
    g.fillStyle = hex(CH[2]); rr(g, 330, 8, 340, 50, 8); g.fill();
    g.fillStyle = "#f0f0f0"; g.font = "600 26px system-ui, sans-serif"; g.textAlign = "center"; g.fillText("CASH OUT", 500, 42);
    g.fillStyle = hex(CH[4]); rr(g, 40, 80, 920, 130, 18); g.fill();
    g.fillStyle = hex(CH[1]); rr(g, 60, 92, 120, 106, 14); g.fill();
    g.fillStyle = hex(CH[0]); rr(g, 210, 128, 720, 34, 10); g.fill();
    g.strokeStyle = hex(CH[5]); g.lineWidth = 3;
    for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(210 + k * 120, 128); g.lineTo(210 + k * 120, 162); g.stroke(); }
};

export function mountAtmScene(canvas : HTMLCanvasElement, o : AtmOptions) : AtmScene {
    const host = canvas.parentElement as HTMLElement;
    const phone = host.clientWidth < 760;
    const renderer = makeRenderer(canvas, phone);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
    scene.add(new THREE.HemisphereLight(0xffffff, KOSH.sandalwood, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(-1.6, 3.4, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left : -1.6, right : 1.6, top : 2.2, bottom : -1.2, near : 0.5, far : 8 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
    sun.shadow.radius = 3;
    scene.add(sun);

    const disposables : { dispose : () => void }[] = [];
    const keep = <T extends { dispose : () => void }>(x : T) => { disposables.push(x); return x; };

    // the floor shows only shadows, on the page's own ivory
    const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(12, 12)), keep(new THREE.ShadowMaterial({ opacity : 0.16 })));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // THE MACHINE =====================================================================================================
    const atm = new THREE.Group();
    scene.add(atm);
    const metal = (c : number) => keep(new THREE.MeshStandardMaterial({ color : c, roughness : 0.45, metalness : 0.35 }));
    const body = metal(CH[2]), dark = metal(CH[0]), door = metal(CH[3]), trim = metal(CH[1]);
    const box = (w : number, h : number, d : number, m : THREE.Material | THREE.Material[], x : number, y : number, z : number) => {
        const mesh = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true; mesh.receiveShadow = true;
        atm.add(mesh);
        return mesh;
    };
    const faced = (tex : THREE.Texture, base : THREE.Material) => {
        const f = keep(new THREE.MeshStandardMaterial({ map : tex, roughness : 0.5, metalness : 0.2 }));
        return [ base, base, base, base, f, base ];                    // the texture on the front (+z) face
    };

    box(0.62, 0.06, 0.54, dark, 0, 0.03, -0.01);                                       // plinth
    box(0.66, 1.0, 0.58, body, 0, 0.06 + 0.5, 0);                                      // safe
    box(0.56, 0.74, 0.012, door, 0, 0.47, FRONT - 0.004);                              // safe door
    const lock = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 20)), trim);
    lock.rotation.x = Math.PI / 2; lock.position.set(0.2, 0.7, FRONT + 0.008); atm.add(lock);
    // the cash slot's plate, proud of the front; notes come out of its shutter
    const slotTex = keep(canvasTex(1000, 240, slotFace, renderer));
    box(0.56, 0.135, 0.03, faced(slotTex, door), 0, SLOT_Y - 0.01, FRONT + 0.012);
    // the counter: receipt, keypad, card
    const counterTex = keep(canvasTex(1320, 520, counterFace, renderer));
    box(0.66, 0.26, 0.6, faced(counterTex, body), 0, 1.06 + 0.13, 0.01);
    box(0.68, 0.02, 0.62, trim, 0, 1.06, 0.01);
    // the screen housing, its face leaning back
    const shape = new THREE.Shape();
    shape.moveTo(-0.29, 0); shape.lineTo(0.31, 0); shape.lineTo(0.26, 0.4); shape.lineTo(-0.29, 0.4); shape.closePath();
    const housingGeo = keep(new THREE.ExtrudeGeometry(shape, { depth : 0.66, bevelEnabled : false }));
    housingGeo.rotateY(-Math.PI / 2); housingGeo.translate(0.33, 0, 0);               // the profile in (z, y), across x
    const housing = new THREE.Mesh(housingGeo, body);
    housing.position.set(0, 1.32, 0); housing.castShadow = true; housing.receiveShadow = true;
    atm.add(housing);
    // the screen and its bezel, on the leaning face
    const lean = Math.atan2(0.05, 0.4);
    const face = new THREE.Group();
    face.position.set(0, 1.32 + 0.2, 0.285); face.rotation.x = -lean;
    atm.add(face);
    const bezel = new THREE.Mesh(keep(new THREE.BoxGeometry(0.5, 0.33, 0.02)), dark);
    face.add(bezel);
    const screenTex = keep(canvasTex(760, 560, screenFace, renderer));
    const screen = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.36, 0.265)), keep(new THREE.MeshBasicMaterial({ map : screenTex })));
    screen.position.z = 0.0105; face.add(screen);
    // the title, a plane just in front of the screen that fades in as the machine comes to rest; drawn again when the
    // page's fonts have loaded
    const heading = getComputedStyle(document.querySelector(".hero-title") ?? document.body).fontFamily || "Georgia, serif";
    const titleTex = keep(canvasTex(760, 560, titleFace(heading), renderer));
    document.fonts?.ready.then(() => {
        const g = (titleTex.image as HTMLCanvasElement).getContext("2d");
        if (g) { titleFace(heading)(g); titleTex.needsUpdate = true; }
    });
    const titleMat = keep(new THREE.MeshBasicMaterial({ map : titleTex, transparent : true, opacity : 0 }));
    const titleScreen = new THREE.Mesh(screen.geometry, titleMat);
    titleScreen.position.z = 0.011; face.add(titleScreen);
    const keyGeo = keep(new THREE.BoxGeometry(0.03, 0.02, 0.012)), keyMat = keep(new THREE.MeshStandardMaterial({ color : CH[6], roughness : 0.5 }));
    for (let k = 0; k < 4; k++) for (const s of [ -1, 1 ]) {
        const key = new THREE.Mesh(keyGeo, keyMat);
        key.position.set(s * 0.215, 0.09 - k * 0.055, 0.012); face.add(key);
    }
    box(0.68, 0.06, 0.6, trim, 0, 1.75, -0.01);                                        // the cap
    for (const s of [ -1, 1 ]) box(0.06, 0.03, 0.02, dark, s * 0.24, 1.705, 0.27);     // the cameras either side

    const faceTex = keep(noteTexture(renderer));

    // THE SETTING =====================================================================================================
    // A kiosk 2.4 m wide and 2.0 m deep around the machine: the floor and the frosted back glass, no side walls, so
    // nothing stands between the camera and the words. Everything here fades in over the pull-back (`dress`, 0 to 1),
    // so the close shot of the slot stays clean.
    const fades : { m : THREE.Material & { opacity : number }; to : number }[] = [];
    const fading = <T extends THREE.Material & { opacity : number }>(m : T, to = 1) => { m.transparent = true; m.opacity = 0; fades.push({ m, to }); return keep(m); };
    const KX = 1.2, KZ0 = -0.62, KH = 2.55;
    // soft edges for the glass, so it does not end in a line: opaque in the middle, fading over the outer fifth on
    // every side
    const softEdges = keep(canvasTex(256, 256, g => {
        g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256);
        for (let k = 0; k < 52; k++) {
            const c = Math.round(255 * Math.pow((k + 1) / 52, 1.6));
            g.fillStyle = `rgb(${c},${c},${c})`;
            g.fillRect(k, k, 256 - 2 * k, 256 - 2 * k);
        }
    }, renderer));
    softEdges.colorSpace = THREE.NoColorSpace;

    // the floor: a mirror under the machine, beneath a wider layer of tiles (ivory squares, sandalwood grout) that also
    // takes the shadows. The tiles let the mirror through in the middle, are solid over the mirror's edges so they
    // never show, and fade out beyond. On a phone, tiles only.
    const FW = 3.6, FD = 2.6, FZ = 0.45, MW = 1.9, MD = 1.3, MZ = 0.45;
    if (!phone) {
        const mirror = new Reflector(keep(new THREE.PlaneGeometry(MW, MD)), {
            color : 0xc9c6bd, textureWidth : 1024, textureHeight : 1024, clipBias : 0.003,
        });
        mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, 0.0005, MZ);
        scene.add(mirror);
        disposables.push({ dispose : () => { mirror.getRenderTarget().dispose(); (mirror.material as THREE.Material).dispose(); } });
    }
    const floorAlpha = keep(canvasTex(256, 256, g => {
        const img = g.createImageData(256, 256);
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
            const x = (i / 255 - 0.5) * FW, z = FZ + (j / 255 - 0.5) * FD;
            // how far outside the mirror's rectangle, in metres (negative inside)
            const out = Math.max(Math.abs(x) - MW / 2, Math.abs(z - MZ) - MD / 2);
            const edge = Math.min((FW / 2 - Math.abs(x)) / 0.6, (FD / 2 - Math.abs(z - FZ)) / 0.5, 1);
            const a = phone ? Math.max(0, edge) : out < -0.12 ? 0.62 : out < 0.02 ? 1 : Math.max(0, edge);
            const c = Math.round(255 * Math.min(1, a));
            img.data.set([ c, c, c, 255 ], (j * 256 + i) * 4);
        }
        g.putImageData(img, 0, 0);
    }, renderer));
    floorAlpha.colorSpace = THREE.NoColorSpace;
    const tileTex = keep(canvasTex(512, 512, g => {
        g.fillStyle = hex(KOSH.sandal8); g.fillRect(0, 0, 512, 512);
        g.fillStyle = hex(KOSH.sandalwood);
        for (let k = 0; k <= 4; k++) { g.fillRect(k * 128 - 3, 0, 6, 512); g.fillRect(0, k * 128 - 3, 512, 6); }
    }, renderer));
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(FW / 1.2, FD / 1.2);                                             // 30 cm tiles
    const tiles = new THREE.Mesh(keep(new THREE.PlaneGeometry(FW, FD)),
        fading(new THREE.MeshStandardMaterial({ map : tileTex, alphaMap : floorAlpha, roughness : 0.35, metalness : 0 }), 0.95));
    tiles.rotation.x = -Math.PI / 2; tiles.position.set(0, 0.001, FZ); tiles.receiveShadow = true;
    scene.add(tiles);

    // the frosted back glass, frameless, its edges fading out
    const frostMat = fading(new THREE.MeshStandardMaterial({ color : KOSH.sandal8, alphaMap : softEdges, roughness : 0.9, depthWrite : false }), 0.7);
    const frameMat = fading(new THREE.MeshStandardMaterial({ color : CH[1], roughness : 0.5, metalness : 0.4 }));
    const pane = (w : number, h : number, m : THREE.Material, x : number, y : number, z : number) => {
        const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), m);
        mesh.position.set(x, y, z); scene.add(mesh);
        return mesh;
    };
    pane(2 * KX + 0.6, KH + 0.6, frostMat, 0, KH / 2, KZ0);

    // the sign on the back glass above the machine: a Neem lightbox with ATM in white, no bank's name
    const signTex = keep(canvasTex(1024, 192, g => {
        g.fillStyle = hex(KOSH.neem); g.fillRect(0, 0, 1024, 192);
        g.fillStyle = "#ffffff"; g.font = "800 128px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("ATM", 512, 102);
    }, renderer));
    const sign = new THREE.Mesh(keep(new THREE.BoxGeometry(0.9, 0.17, 0.06)),
        [ frameMat, frameMat, frameMat, frameMat, fading(new THREE.MeshBasicMaterial({ map : signTex })), frameMat ]);
    sign.position.set(0, 1.97, KZ0 + 0.04); scene.add(sign);

    // a red plastic stool beside the machine, as kiosks have for the guard
    const stoolMat = fading(new THREE.MeshStandardMaterial({ color : KOSH.vermilion, roughness : 0.45 }));
    const stool = new THREE.Group();
    const seat = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 28)), stoolMat);
    seat.position.y = 0.45; stool.add(seat);
    for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        const leg = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.018, 0.026, 0.45, 10)), stoolMat);
        leg.position.set(Math.cos(a) * 0.12, 0.225, Math.sin(a) * 0.12);
        leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
        stool.add(leg);
    }
    stool.traverse(c => { c.castShadow = true; });
    stool.position.set(-0.72, 0, 0.1); scene.add(stool);

    // a warm pool of light on the kiosk floor, and the screen's Indivara glow on the counter
    const pool = new THREE.SpotLight(0xfff1dc, 0, 7, 0.55, 0.85, 1.2);
    pool.position.set(0.2, 3.6, 1.6); pool.target.position.set(0, 0, 0.5);
    scene.add(pool, pool.target);
    const glow = new THREE.PointLight(KOSH.indivara, 0, 1.2, 1.6);
    glow.position.set(0, 1.5, 0.55); scene.add(glow);

    // beyond the back glass, a huge ₹ in sandalwood, turning slowly
    const rupeeTex = keep(canvasTex(1024, 1024, g => {
        g.fillStyle = hex(KOSH.sandalwood); g.font = "700 900px system-ui, sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("₹", 512, 560);
    }, renderer));
    const rupee = pane(3.4, 3.4, fading(new THREE.MeshBasicMaterial({ map : rupeeTex, side : THREE.DoubleSide, depthWrite : false }), 0.9), 0, 1.3, -2.2);

    // close to the lens, a few notes out of focus: the note's face drawn blurred, on planes that ride with the camera
    const blurTex = keep(canvasTex(600, 264, g => {
        const src = faceTex.image as HTMLCanvasElement;
        g.filter = "blur(14px)"; g.drawImage(src, 20, 20, 560, 224);
    }, renderer));
    scene.add(camera);
    // in camera space, a metre or so ahead; x and y as shares of the frame's half-size, kept to the right-hand edge
    // on a wide screen (the words are on the left) and to the lower sides on a phone (the words are above)
    const SPOTS = phone ? [ [ -0.85, -0.55, 1.0 ], [ 0.9, -0.9, 1.2 ] ] : [ [ 0.93, 0.35, 1.0 ], [ 0.88, -0.75, 1.2 ] ];
    const bokeh = SPOTS.map(([ fx, fy, d ], k) => {
        const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.15, 0.066)), fading(new THREE.MeshBasicMaterial({ map : blurTex, depthWrite : false }), 0.7));
        camera.add(mesh);
        return { mesh, fx, fy, d, phase : k * 1.7, spin : (k % 2 ? 1 : -1) * (0.12 + k * 0.05) };
    });
    const drift = (t : number) => {
        const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        for (const b of bokeh) {
            const fy = b.fy + Math.sin(t * 0.22 + b.phase) * 0.12;                  // bobs slowly where it is
            b.mesh.position.set((b.fx + Math.sin(t * 0.4 + b.phase) * 0.05) * half * camera.aspect * b.d, fy * half * b.d, -b.d);
            b.mesh.rotation.set(0.5 + Math.sin(t * 0.3 + b.phase) * 0.3, 0, t * b.spin);
        }
        rupee.rotation.y = Math.sin(t * 0.25) * 0.5;
    };
    const dress = (d : number) => {
        for (const f of fades) { f.m.opacity = f.to * d; f.m.transparent = f.m.opacity < 1; }
        pool.intensity = 26 * d; glow.intensity = 1.6 * d;
    };

    // THE NOTES =======================================================================================================
    const edge = keep(new THREE.MeshStandardMaterial({ color : KOSH.sandal4, roughness : 0.9 }));
    const paper = keep(new THREE.MeshStandardMaterial({ map : faceTex, roughness : 0.8 }));
    const noteGeo = keep(new THREE.BoxGeometry(NW, NT, NH));
    const notes = new THREE.InstancedMesh(noteGeo, [ edge, edge, paper, paper, edge, edge ], FLY);
    notes.castShadow = true; notes.receiveShadow = true;
    notes.frustumCulled = false;
    scene.add(notes);
    const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < FLY; i++) notes.setMatrixAt(i, HIDE);
    const q = new THREE.Quaternion(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), m4 = new THREE.Matrix4();

    // A note slides flat out of the slot over `slide` seconds, easing to a stop as it clears it, then drops: it
    // drifts forward and down at paper's slow fall, sways and turns, and is taken away once it is out of view.
    type Fly = { on : boolean; t : number; slide : number; p : THREE.Vector3; v : THREE.Vector3; rot : THREE.Euler; w : THREE.Vector3; sway : number; fall : number };
    const fly : Fly[] = Array.from({ length : FLY }, () => ({ on : false, t : 0, slide : 0, p : new THREE.Vector3(), v : new THREE.Vector3(), rot : new THREE.Euler(), w : new THREE.Vector3(), sway : 0, fall : 0 }));
    const OUT = NH * 0.85;                              // how far a note comes out before it drops
    const launch = (slide = 0.14) => {
        const f = fly.find(f => !f.on);
        if (!f) return null;
        Object.assign(f, { on : true, t : 0, slide, sway : Math.random() * 6.3, fall : 0.8 + Math.random() * 0.5 });
        f.p.set((Math.random() - 0.5) * 0.1, SLOT_Y, FRONT + 0.02);
        f.v.set((Math.random() - 0.5) * 0.9, 0.15 + Math.random() * 0.2, 1.3 + Math.random() * 0.8);
        f.rot.set(0, 0, 0);
        f.w.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 5);
        return f;
    };
    const easeOut = (x : number) => 1 - Math.pow(1 - x, 3);
    const stepFly = (dt : number) => {
        for (let k = 0; k < FLY; k++) {
            const f = fly[k];
            if (!f.on) continue;
            f.t += dt;
            if (f.t < f.slide) {
                m4.compose(v3.set(f.p.x, f.p.y, FRONT + 0.02 + easeOut(f.t / f.slide) * OUT), q.identity(), one);
                notes.setMatrixAt(k, m4);
                continue;
            }
            if (f.p.z < FRONT + 0.02 + OUT) f.p.z = FRONT + 0.02 + OUT;
            // the fall eases to its own slow speed; the push forward and sideways dies away gently
            f.v.y += (-f.fall - f.v.y) * Math.min(1, 2.2 * dt);
            f.v.x *= Math.exp(-0.7 * dt); f.v.z *= Math.exp(-0.45 * dt);
            f.p.addScaledVector(f.v, dt);
            f.p.x += Math.sin(f.t * 2.6 + f.sway) * 0.25 * dt;
            f.rot.x += f.w.x * dt; f.rot.y += f.w.y * dt; f.rot.z += f.w.z * dt;
            if (f.p.y < -0.3 || f.p.z > 6) { f.on = false; notes.setMatrixAt(k, HIDE); continue; }
            notes.setMatrixAt(k, m4.compose(f.p, q.setFromEuler(f.rot), one));
        }
        notes.instanceMatrix.needsUpdate = true;
    };
    // the air as it would be after `secs` of the steady stream, for the still frame
    const prefill = (secs : number, rate : number) => {
        for (let t = 0; t < secs; t += 1 / 30) {
            for (let n = Math.floor(t * rate) - Math.floor((t - 1 / 30) * rate); n > 0; n--) launch();
            stepFly(1 / 30);
        }
    };

    // CAMERA ==========================================================================================================
    // Three framings joined by one smooth path: CLOSE, on the cash slot from a little above and to the right; WHOLE,
    // the machine centred; and REST, the settled shot (the machine right of the words on a wide screen, low under them
    // on a phone). Notes going forward drop out of the bottom of the frame before they would reach the floor.
    const CLOSE = { pos : new THREE.Vector3(0.16, SLOT_Y + 0.16, FRONT + 0.62), look : new THREE.Vector3(0.02, SLOT_Y - 0.02, FRONT + 0.06) };
    const WHOLE = { pos : new THREE.Vector3(0.25, 1.15, 3.2), look : new THREE.Vector3(0, 0.95, 0.3) };
    const REST = { pos : new THREE.Vector3(), look : new THREE.Vector3() };
    let posPath : THREE.CatmullRomCurve3, lookPath : THREE.CatmullRomCurve3, fov = { from : 24, to : 30 };
    let u = 0;                                          // how far along the move, 0 to 1
    const aim = () => {
        camera.position.copy(posPath.getPoint(u));
        camera.lookAt(lookPath.getPoint(u));
        camera.fov = fov.from + (fov.to - fov.from) * u;
        camera.updateProjectionMatrix();
    };
    const frame = (w : number, h : number) => {
        camera.aspect = w / h;
        const wide = w / h > 1.1;
        fov = { from : wide ? 24 : 34, to : wide ? 30 : 40 };
        REST.pos.set(wide ? -1.7 : 0.05, wide ? 1.45 : 1.95, wide ? 4.6 : 5.9);
        REST.look.set(wide ? -0.95 : 0.05, wide ? 0.88 : 1.82, 0.3);
        WHOLE.pos.set(wide ? 0.25 : 0.1, 1.15, wide ? 3.2 : 4.4);
        // on a narrow screen the close shot stands back and straight on, so the whole note fits across
        CLOSE.pos.set(wide ? 0.16 : 0.03, SLOT_Y + (wide ? 0.16 : 0.2), FRONT + (wide ? 0.62 : 1.05));
        posPath = new THREE.CatmullRomCurve3([ CLOSE.pos, WHOLE.pos, REST.pos ], false, "centripetal");
        lookPath = new THREE.CatmullRomCurve3([ CLOSE.look, WHOLE.look, REST.look ], false, "centripetal");
        aim();
    };
    // ease in and out: slow away from the slot, slow into the rest
    const inOut = (x : number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    // THE CLOCK =======================================================================================================
    // after the first note, the stream swells in from STREAM_AT and settles at about RATE notes a second
    const RATE = 8;
    let owed = 0, time = 0, revealed = false;
    const reveal = () => { if (!revealed) { revealed = true; o.onReveal(); } };
    const step = (dt : number) => {
        time += dt;
        const on = Math.min(1, Math.max(0, (time - STREAM_AT) / 0.8));
        owed += RATE * on * (1 + 0.6 * Math.exp(-Math.max(0, time - STREAM_AT) / 2)) * dt;
        for (; owed >= 1; owed--) launch();
        stepFly(dt);
        if (u < 1) { u = inOut(Math.min(1, Math.max(0, (time - MOVE_AT) / (SETTLE_AT - MOVE_AT)))); aim(); }
        titleMat.opacity = Math.min(1, Math.max(0, (time - SCREEN_AT) / 0.8));
        dress(Math.min(1, Math.max(0, (time - MOVE_AT - 0.6) / 2.4)));
        drift(time);
        if (time >= REVEAL_AT) reveal();
    };

    const unfit = fitToHost(canvas, renderer, frame);

    let unloop = () => {};
    if (o.reduced) {
        u = 1; aim();
        prefill(3, RATE);
        titleMat.opacity = 1;
        dress(1); drift(0);
        reveal();
        renderer.render(scene, camera);
    } else {
        // the first note, alone and slow
        const first = launch(SLIDE_OUT);
        if (first) { first.p.x = 0; first.v.set(0.05, 0.05, 1.0); first.w.multiplyScalar(0.4); }
        unloop = loopWhileVisible(canvas, dt => { step(dt); renderer.render(scene, camera); });
    }

    return {
        dispose : () => {
            unloop(); unfit();
            disposables.forEach(d => d.dispose());
            renderer.dispose();
        },
    };
}
