// The taps: a wall of hands holding phones, face-on in an invisible grid, and every UPI payment as a phone's screen
// turning green with a rupee sign, from November 2019 (the first month of RBI's new payment-system format) to the latest.
// How many hands show each month is the caller's (`hands`, from the unique UPI users); they fill the grid from the
// bottom-left corner towards the top-right along a straight diagonal, so growth reads as a spreading wave. The order
// is only a fill order: the grid is no map. One payment flash is `unit` crore payments; the months play in JOURNEY
// seconds, the first ones slower and the pace settling by about 3.5 s, and exactly each month's count flashes in its
// time, so as payments per user grow, each hand flashes faster and the wall shimmers. Hands come in four skin tones
// (terracotta and its 10, 20 and 30% tints) and cuffs in the palette's colours.
// When the journey ends, the flashes pause, every screen dims, and `marquee` scrolls across the wall from the right,
// the screens as the pixels of an LED sign (plain green, no rupee sign, so it is never read as payments); then the flashes
// go on, and CAPTION_AFTER seconds later `onCaption` gets the band of the grid's middle two rows, in the canvas's CSS
// pixels, for the page to lay the message over in plain type (null when it should go).

// REACT CORE ==========================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// LOCAL ===============================================================================================================
import { JOURNEY, KOSH, fitToHost, loopWhileVisible, makeRenderer } from "./cashThree";
import { LED_ROWS, ledColumns } from "./ledFont";

export interface RainScene {
    play     : () => void;
    pause    : () => void;
    setMonth : (m : number) => void;
    dispose  : () => void;
}
export interface Band { left : number; top : number; width : number; height : number }
export interface RainOptions {
    reduced : boolean;
    upi     : number[];                 // crore payments a month
    unit    : number;                   // crore payments per flash
    hands   : number[];                 // hands showing each month, at most the grid's cells
    onMonth : (m : number) => void;     // when the month changes
    onEnd   : () => void;               // when the last month has played
    marquee : string;                   // scrolled across the wall when the journey ends, like an LED sign
    onCaption : (band : Band | null) => void;   // where to show the message in plain type, or null
}

const HAND_DIM = 0.2;                   // the hands' and cuffs' opacity while the LED sign is up
const CAPTION_AFTER = 1.5;              // seconds of flashing between the sign and the caption
const FLASH = 0.5;                      // seconds a screen stays lit, fading
const CELL_W = 0.5, CELL_H = 1.0, HAND = 1.2;          // a hand is drawn 1.2 times its modelled size

// The grid: 28 × 22 on a phone; on a wider screen, shaped to the stage (a cell is twice as tall as it is wide), with an
// even number of rows and about 620 cells, never fewer than the most hands any month shows.
export const gridOf = (phone : boolean, aspect = 19 / 16, most = 0) => {
    if (phone) return { cols : 28, rows : 22 };
    let rows = Math.max(8, 2 * Math.round(Math.sqrt(310 / aspect) / 2));
    let cols = Math.max(20, Math.round(2 * aspect * rows));
    while (cols * rows < most + 20) cols++;
    return { cols, rows };
};
const SKINS = [ 0xba644f, 0xc17361, 0xc88372, 0xcf9284 ];
const CUFFS = [ KOSH.indivara, KOSH.turmeric, KOSH.neem, 0x24b6ff, KOSH.vermilion, KOSH.sandalwood, 0xa984ec, 0x2f2f2f ];

// How long each month lasts: the first months slower, settling to an even pace, the whole run JOURNEY seconds.
const monthTimes = (n : number) => {
    const w = Array.from({ length : n }, (_, i) => 1 + 1.6 * Math.exp(-i / 7));
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map(x => JOURNEY * x / sum);
};

// One hand holding a phone upright, screen facing +z: fingertips round the left edge, the thumb across the right,
// the wrist and a cuff below. Three parts, each its own instanced mesh: the phone (its own colour), the skin and the
// cuff (white here, tinted per hand). The screen is drawn apart so it can light up.
function handGeometry() : { phone : THREE.BufferGeometry; skin : THREE.BufferGeometry; cuff : THREE.BufferGeometry } {
    const paint = (g : THREE.BufferGeometry, color : number, x : number, y : number, z : number, rz = 0) => {
        g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(1, 1, 1)));
        const flat = g.index ? g.toNonIndexed() : g;
        if (flat !== g) g.dispose();
        const c = new THREE.Color(color), n = flat.getAttribute("position").count, rgb = new Float32Array(n * 3);
        for (let k = 0; k < n; k++) rgb.set([ c.r, c.g, c.b ], k * 3);
        flat.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
        return flat;
    };
    const merge = (parts : THREE.BufferGeometry[]) => { const m = mergeGeometries(parts); parts.forEach(g => g.dispose()); return m; };
    return {
        phone : merge([ paint(new THREE.BoxGeometry(0.3, 0.58, 0.04), KOSH.charcoal, 0, 0.06, 0) ]),
        skin  : merge([
            paint(new THREE.BoxGeometry(0.28, 0.24, 0.09), 0xffffff, 0, -0.13, -0.065),                  // the palm, behind
            ...[ 0, 1, 2, 3 ].map(k => paint(new THREE.SphereGeometry(0.036, 10, 8), 0xffffff, -0.155, 0.02 - k * 0.06, 0)),   // fingertips
            paint(new THREE.CapsuleGeometry(0.038, 0.1, 4, 10), 0xffffff, 0.14, -0.12, 0.03, 0.55),       // the thumb
            paint(new THREE.CylinderGeometry(0.075, 0.08, 0.16, 12), 0xffffff, 0, -0.3, -0.05),           // the wrist
        ]),
        cuff  : merge([ paint(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12), 0xffffff, 0, -0.4, -0.05) ]),
    };
}

// The rupee sign drawn on a lit screen: the page's own font's ₹ glyph, white on transparent, drawn large and centred
// on its ink so it stays crisp when the texture is scaled down to a few pixels.
function checkTexture(renderer : THREE.WebGLRenderer) : THREE.CanvasTexture {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = "#ffffff"; g.font = `600 210px ${getComputedStyle(document.body).fontFamily}`;
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    const ink = g.measureText("₹");
    g.fillText("₹", 128, 128 + (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
}

export function mountRainScene(canvas : HTMLCanvasElement, o : RainOptions) : RainScene {
    const host = canvas.parentElement as HTMLElement;
    const phone = host.clientWidth < 760;
    const MONTH = monthTimes(o.upi.length);             // seconds each month lasts
    const renderer = makeRenderer(canvas, phone);
    const scene = new THREE.Scene();
    // face-on, no perspective: every hand the same size, like a pictogram chart
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    camera.position.set(0, 0, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, KOSH.sandalwood, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(-3, 5, 8);
    scene.add(sun);

    // THE GRID ========================================================================================================
    const { cols, rows } = gridOf(phone, host.clientWidth / Math.max(1, host.clientHeight), Math.max(...o.hands));
    const P = cols * rows;
    const W = cols * CELL_W, H = rows * CELL_H;
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // cell at column c, row r from the bottom; the fill order is the distance from the bottom-left corner along the
    // diagonal, ties going to the lower row
    const cells = Array.from({ length : P }, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        return { c, r, x : -W / 2 + (c + 0.5) * CELL_W, y : -H / 2 + (r + 0.5) * CELL_H, d : c / cols + r / rows + r * 1e-6 };
    }).sort((a, b) => a.d - b.d);

    const handGeo = handGeometry();
    const handMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.7 });
    // the hands and cuffs have their own material so they can fade while the LED sign is up, leaving the lit screens
    // to read
    const fadeMat = new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.7, transparent : true });
    const parts = [ handGeo.phone, handGeo.skin, handGeo.cuff ].map((g, k) => new THREE.InstancedMesh(g, k ? fadeMat : handMat, P));
    const [ , skins, cuffs ] = parts;
    const tone = new THREE.Color();
    for (let i = 0; i < P; i++) {
        skins.setColorAt(i, tone.set(SKINS[Math.floor(rnd() * SKINS.length)]));
        cuffs.setColorAt(i, tone.set(CUFFS[Math.floor(rnd() * CUFFS.length)]));
    }
    const screenGeo = new THREE.PlaneGeometry(0.26, 0.5);
    screenGeo.translate(0, 0.07, 0.021);
    const screenMat = new THREE.MeshBasicMaterial({ color : 0xffffff });
    const screens = new THREE.InstancedMesh(screenGeo, screenMat, P);
    const checkTex = checkTexture(renderer);
    const checkGeo = new THREE.PlaneGeometry(0.27, 0.27);
    checkGeo.translate(0, 0.07, 0.023);
    const checkMat = new THREE.MeshBasicMaterial({ map : checkTex, transparent : true, depthWrite : false });
    const checks = new THREE.InstancedMesh(checkGeo, checkMat, P);
    const IDLE = new THREE.Color(KOSH.sandal4), LIT = new THREE.Color(KOSH.neem), col = new THREE.Color();
    for (let i = 0; i < P; i++) screens.setColorAt(i, IDLE);
    scene.add(...parts, screens, checks);

    // HANDS AND FLASHES ===============================================================================================
    // show[i] eases to 1 when cell i is within the month's count: the hand grows into its cell
    const show = new Float32Array(P);
    const lit = new Float32Array(P).fill(9);             // seconds since each phone last paid
    let shown = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    // THE LED SIGN ====================================================================================================
    // `scroll` is how many wall columns the text has moved in from the right edge, or -1 when the sign is off. Each
    // font column spans two wall columns (a cell is twice as tall as it is wide), and its five rows sit on the grid's
    // rows 3 to 7 from the bottom, which hands fill by the end.
    const led = ledColumns(o.marquee), LED_W = 2 * led.length;
    const LED_SPEED = 40, LED_ROW = 3;                   // wall columns a second; the sign's bottom row
    let scroll = -1;
    // seconds since the sign finished, until the caption shows; -1 when not counting. `band` is the caption's place,
    // kept up to date by the camera, and `captioned` whether the page has it.
    let since = -1, captioned = false, band : Band | null = null;
    const caption = (on : boolean) => {
        if (on === captioned && !on) return;
        captioned = on;
        o.onCaption(on ? band : null);
    };
    const ledOn = (c : number, r : number) => {
        const x = Math.floor((Math.floor(c + scroll) - cols) / 2), y = LED_ROW + LED_ROWS - 1 - r;
        return x >= 0 && x < led.length && y >= 0 && y < LED_ROWS && led[x][y];
    };

    const lay = (dt : number) => {
        if (scroll >= 0 && dt !== Infinity && (scroll += dt * LED_SPEED) > cols + LED_W) { scroll = -1; lit.fill(9); since = 0; }
        if (since >= 0 && dt !== Infinity && (since += dt) >= CAPTION_AFTER) { since = -1; caption(true); }
        // hands and cuffs fade to HAND_DIM in a quarter of a second while the sign is up, and back after
        const fadeTo = scroll >= 0 ? HAND_DIM : 1;
        fadeMat.opacity = dt === Infinity ? fadeTo : fadeTo < fadeMat.opacity ? Math.max(fadeTo, fadeMat.opacity - dt * 4) : Math.min(fadeTo, fadeMat.opacity + dt * 4);
        let nChecks = 0;
        for (let i = 0; i < P; i++) {
            const want = i < shown ? 1 : 0;
            if (show[i] !== want) show[i] = dt === Infinity ? want : want ? Math.min(1, show[i] + dt / 0.25) : Math.max(0, show[i] - dt / 0.25);
            const e = show[i] * show[i] * (3 - 2 * show[i]);
            m4.compose(v.set(cells[i].x, cells[i].y + 0.05 - (1 - e) * 0.2, 0), q, sc.setScalar(Math.max(0.0001, e * HAND)));
            for (const h of parts) h.setMatrixAt(i, m4);
            screens.setMatrixAt(i, m4);
            if (dt !== Infinity) lit[i] += dt;
            if (scroll >= 0) { screens.setColorAt(i, e > 0 && ledOn(cells[i].c, cells[i].r) ? LIT : IDLE); continue; }
            const u = lit[i] / FLASH;
            screens.setColorAt(i, u >= 1 ? IDLE : col.copy(LIT).lerp(IDLE, Math.max(0, u * u)));
            if (u < 1 && e > 0) {
                // the rupee sign pops a touch past full size, settles, and shrinks away as the screen fades
                const s = e * (u < 0.2 ? 1.2 * Math.sin(u / 0.2 * Math.PI / 2) : 1.2 - 0.2 * Math.min(1, (u - 0.2) / 0.2)) * (u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1);
                m4.compose(v.set(cells[i].x, cells[i].y + 0.05, 0), q, sc.setScalar(Math.max(0.0001, s * HAND)));
                checks.setMatrixAt(nChecks++, m4);
            }
        }
        checks.count = nChecks;
        for (const h of parts) h.instanceMatrix.needsUpdate = true;
        screens.instanceMatrix.needsUpdate = true; checks.instanceMatrix.needsUpdate = true;
        if (screens.instanceColor) screens.instanceColor.needsUpdate = true;
    };

    // a payment: a phone among those showing, at random, one not lit already if one turns up
    const pay = () => {
        if (!shown) return;
        for (let t = 0; t < 6; t++) {
            const i = Math.floor(Math.random() * shown);
            if (lit[i] >= FLASH || t === 5) { lit[i] = 0; return; }
        }
    };
    const fillMonth = (m : number) => {
        shown = Math.min(P, Math.max(0, Math.round(o.hands[m])));
        lit.fill(9);
        const live = Math.round(o.upi[m] / o.unit / MONTH[m] * FLASH);
        for (let k = 0; k < live && shown; k++) lit[Math.floor(Math.random() * shown)] = Math.random() * FLASH;
        lay(Infinity);
    };

    // THE CLOCK =======================================================================================================
    const last = o.upi.length - 1;
    let m = 0, inMonth = 0, playing = false, owed = 0;
    const step = (dt : number) => {
        // exactly the month's count flashes in its MONTH[m] seconds; paused, the month keeps going as it is
        owed += o.upi[m] / o.unit * dt / MONTH[m];
        if (playing && (inMonth += dt) >= MONTH[m]) {
            inMonth -= MONTH[m];
            if (m < last) { m++; shown = Math.min(P, Math.round(o.hands[m])); o.onMonth(m); }
            else { playing = false; scroll = 0; o.onEnd(); }
        }
        if (scroll >= 0) owed = 0;                         // the sign is on: no flashes
        for (; owed >= 1; owed--) pay();
        lay(dt);
    };

    // CAMERA ==========================================================================================================
    // the whole grid in view with a small margin, whatever the canvas's shape; any spare width goes to the right, so
    // the grid starts at the stage's left edge
    const frame = (w : number, h : number) => {
        const pad = 1.03, aspect = w / h;
        let halfW = W / 2 * pad, halfH = H / 2 * pad;
        if (halfW / halfH > aspect) halfH = halfW / aspect; else halfW = halfH * aspect;
        const shift = halfW - W / 2 * pad;
        Object.assign(camera, { left : -halfW + shift, right : halfW + shift, top : halfH, bottom : -halfH });
        camera.updateProjectionMatrix();
        // the middle two rows, y from -1 to 1 in the scene, in CSS pixels
        const px = w / (2 * halfW);
        band = { left : (-W / 2 + halfW - shift) * px, top : (halfH - CELL_H) * px, width : W * px, height : 2 * CELL_H * px };
        if (captioned) o.onCaption(band);
    };
    const unfit = fitToHost(canvas, renderer, frame);

    let unloop = () => {};
    if (o.reduced) { m = last; fillMonth(m); renderer.render(scene, camera); caption(true); }
    else { fillMonth(0); unloop = loopWhileVisible(canvas, dt => { step(dt); renderer.render(scene, camera); }); }

    return {
        play : () => {
            if (o.reduced) return;
            scroll = -1; since = -1; caption(false);
            if (m >= last) { m = 0; fillMonth(0); o.onMonth(0); }
            playing = true; inMonth = 0;
        },
        pause : () => { playing = false; },
        setMonth : (i : number) => {
            m = Math.max(0, Math.min(last, i)); inMonth = 0; owed = 0; scroll = -1; since = -1; caption(false); fillMonth(m);
            if (o.reduced) renderer.render(scene, camera);
        },
        dispose : () => {
            unloop(); unfit();
            [ handGeo.phone, handGeo.skin, handGeo.cuff, screenGeo, checkGeo ].forEach(g => g.dispose());
            [ handMat, fadeMat, screenMat, checkMat ].forEach(x => x.dispose());
            checkTex.dispose();
            renderer.dispose();
        },
    };
}

// One of the wall's hands on its own, as an image (a PNG data URL `px` tall): the same geometry, materials and light,
// the screen lit with the rupee sign as a payment shows it. Rendered once, offscreen, for the close's pictures.
export function handImage(px : number) : string {
    const canvas = document.createElement("canvas");
    const W = Math.round(px * 0.6), H = px;
    canvas.width = W; canvas.height = H;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias : true, alpha : true, preserveDrawingBuffer : true });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const half = 0.47, camera = new THREE.OrthographicCamera(-half * 0.6, half * 0.6, 0.39, -0.55, 0.1, 50);
    camera.position.set(0, 0, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, KOSH.sandalwood, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(-3, 5, 8);
    scene.add(sun);
    const geo = handGeometry();
    const mats = [
        new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.7 }),
        new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.7, color : SKINS[1] }),
        new THREE.MeshStandardMaterial({ vertexColors : true, roughness : 0.7, color : KOSH.indivara }),
    ];
    [ geo.phone, geo.skin, geo.cuff ].forEach((g, k) => scene.add(new THREE.Mesh(g, mats[k])));
    const screenGeo = new THREE.PlaneGeometry(0.26, 0.5); screenGeo.translate(0, 0.07, 0.021);
    const screenMat = new THREE.MeshBasicMaterial({ color : KOSH.neem });
    scene.add(new THREE.Mesh(screenGeo, screenMat));
    const tex = checkTexture(renderer);
    const checkGeo = new THREE.PlaneGeometry(0.27, 0.27); checkGeo.translate(0, 0.07, 0.023);
    const checkMat = new THREE.MeshBasicMaterial({ map : tex, transparent : true, depthWrite : false });
    scene.add(new THREE.Mesh(checkGeo, checkMat));
    renderer.render(scene, camera);
    const url = canvas.toDataURL("image/png");
    [ geo.phone, geo.skin, geo.cuff, screenGeo, checkGeo ].forEach(g => g.dispose());
    [ ...mats, screenMat, checkMat ].forEach(m => m.dispose());
    tex.dispose(); renderer.dispose();
    return url;
}
