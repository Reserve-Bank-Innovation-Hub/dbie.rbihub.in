// The instruments the story shows, drawn once as standalone SVG: a cheque, a demand draft, the RTGS / NEFT form, the
// NEFT batch board, an IMPS transfer on a bank app, credit and debit cards, a prepaid card, a FASTag on a windscreen, a
// card terminal, a QR code, a ₹500 bundle and S2's phone after a UPI payment. Each is a string so the page can show it
// as an image and the 3D scenes can paint it on a card's face. Colours are written out (an image cannot read the
// page's tokens): they are the RBIH Kosh palette and its tints, and the objects look the same in both themes. The bank
// is a made-up "National Bank", never a real one, and the currency is the rupee.

import { cardSvg, fastagCardSvg } from "./objects";

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif", MONO = "Menlo, Consolas, monospace", DEVA = "Kohinoor Devanagari, Noto Sans Devanagari, Mangal, sans-serif";

// The MICR band's symbols (E-13B's on-us and transit marks) as blocks, so no special font is needed.
const ON_US = (x : number, y : number, c : string) => `<g fill="${c}" transform="translate(${x} ${y})"><rect y="-8" width="2.4" height="8"/><rect x="3.6" y="-8" width="2.4" height="3"/><rect x="3.6" y="-3" width="2.4" height="3"/></g>`;
const TRANSIT = (x : number, y : number, c : string) => `<g fill="${c}" transform="translate(${x} ${y})"><rect y="-8" width="2" height="3"/><rect y="-3.4" width="2" height="3.4"/><rect x="3.2" y="-8" width="2.4" height="8"/></g>`;
const micr = (y : number, c : string, a : string, b : string, cc : string, d : string) => [
    ON_US(96, y, c), `<text x="104" y="${y}" font-family="${MONO}" font-size="10" fill="${c}" letter-spacing="1.6">${a}</text>`, ON_US(148, y, c),
    TRANSIT(162, y, c), `<text x="170" y="${y}" font-family="${MONO}" font-size="10" fill="${c}" letter-spacing="1.6">${b}</text>`, TRANSIT(242, y, c),
    `<text x="252" y="${y}" font-family="${MONO}" font-size="10" fill="${c}" letter-spacing="1.6">${cc}</text>`, ON_US(306, y, c),
    `<text x="316" y="${y}" font-family="${MONO}" font-size="10" fill="${c}" letter-spacing="1.6">${d}</text>`,
].join("");
const boxes = (x : number, y : number, n : number, w : number, h : number, c : string) =>
    `<rect x="${x}" y="${y}" width="${n * w}" height="${h}" fill="none" stroke="${c}" stroke-width="0.7"/>` +
    Array.from({ length : n - 1 }, (_, i) => `<line x1="${x + (i + 1) * w}" y1="${y}" x2="${x + (i + 1) * w}" y2="${y + h}" stroke="${c}" stroke-width="0.7"/>`).join("");
const wrap = (w : number, h : number, body : string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export interface ChequeFill { date? : string; payee? : string; words? : [ string, string ]; figure? : string }

// Guilloche: fine, interleaved curves of the kind security printers lay under a cheque. A ribbon is a bundle of
// sinusoids whose phase steps from curve to curve; a rosette is a hypotrochoid. Points are rounded to keep the string short.
const pts = (p : [ number, number ][]) => "M" + p.map(([ x, y ]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
const ribbon = (x0 : number, x1 : number, n : number, at : (x : number, i : number) => number) =>
    Array.from({ length : n }, (_, i) => pts(Array.from({ length : Math.ceil((x1 - x0) / 2.5) + 1 }, (_, j) => { const x = x0 + j * 2.5; return [ x, at(x, i) ]; })));
const rosette = (cx : number, cy : number, R : number, r : number, d : number, turns : number) => {
    const n = turns * 120;
    return pts(Array.from({ length : n + 1 }, (_, j) => { const t = j / n * turns * 2 * Math.PI;
        return [ cx + (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t), cy + (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t) ]; }));
};

// A cheque leaf as Indian banks print them under CTS-2010: a white header with the bank, its branch and IFSC; a pale
// blue security tint of fine diamonds under the payee, amount and signature; guilloche ribbons rising from the lower
// left and a rosette behind the amount; the account box, "payable at par", bilingual labels, a microprinted signature
// line and the MICR band on white. The chequebook writes its own ink over a blank leaf, so its fields keep fixed places.
// The serial is the leaf's cheque number, which opens its MICR band; a book's leaves run in sequence. The fill (date,
// payee, amount) is optional.
export const chequeLeafSvg = (serial = 1, f : ChequeFill = {}) => {
    const hand = "Bradley Hand, Snell Roundhand, Segoe Script, cursive";
    const ink = "#23466e", soft = "#5d7a99", tint = "#dcebf3", guil = "#9cc2d8";
    // the ribbon swells from the lower left and pinches to a point at either end
    const wave = ribbon(0, 260, 26, (x, i) => 138 - 26 * Math.exp(-(((x - 80) / 80) ** 2)) + Math.sin(Math.PI * x / 260) * (6 * Math.sin(x / 19 + i * 0.24) + 3 * Math.sin(x / 7.5 - i * 0.5) + (i - 13) * 0.6));
    const lace = ribbon(0, 400, 6, (x, i) => 40.5 + 1.6 * Math.sin(x / 3.2 + i * 1.05));
    const micro = "NATIONALBANK".repeat(14);
    return wrap(400, 180, [
        `<defs><pattern id="tint" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${tint}"/><rect x="0.6" y="0.6" width="3.8" height="3.8" fill="none" stroke="#c4dcea" stroke-width="0.45"/><circle cx="2.5" cy="2.5" r="0.45" fill="#b7d3e4"/></pattern>`,
        `<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.35"/></linearGradient></defs>`,
        `<rect x="0.5" y="0.5" width="399" height="179" rx="3" fill="#ffffff" stroke="#cfd9e2"/>`,
        // the security tint, the guilloche over it, and a lace border along its top
        `<rect x="1" y="41" width="398" height="104" fill="url(#tint)"/><rect x="1" y="41" width="398" height="104" fill="url(#fade)"/>`,
        `<clipPath id="field"><rect x="1" y="41" width="398" height="104"/></clipPath>`,
        `<g fill="none" stroke="${guil}" stroke-width="0.35" opacity="0.9" clip-path="url(#field)">${wave.map(d => `<path d="${d}"/>`).join("")}</g>`,
        `<path d="${rosette(333, 84, 40, 15, 31, 3)}" fill="none" stroke="#c0d8e7" stroke-width="0.3"/>`,
        `<path d="${rosette(120, 70, 30, 7, 22, 7)}" fill="none" stroke="#cfe2ee" stroke-width="0.25"/>`,
        `<g fill="none" stroke="#a7c8dc" stroke-width="0.3">${lace.map(d => `<path d="${d}"/>`).join("")}</g>`,
        // the printer's imprint up the left edge
        `<text transform="translate(6 132) rotate(-90)" font-family="${SANS}" font-size="2.6" fill="${soft}" letter-spacing="0.2">CTS-2010 · SECURITY PRINTER (I) PVT LTD · 0425</text>`,
        // the header: the bank, its branch, the IFSC; the date boxes
        `<rect x="16" y="6" width="13" height="13" rx="2" fill="#ba644f"/><text x="22.5" y="16.3" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="700" fill="#fff">₹</text>`,
        `<text x="33" y="16.4" font-family="${SANS}" font-size="11" font-weight="800" fill="${ink}" letter-spacing="0.6">NATIONAL BANK</text>`,
        `<text x="16" y="25" font-family="${SANS}" font-size="4" fill="${soft}">GROUND FLOOR, STATION ROAD, NEAR BUS STAND, ANDHERI (EAST), MUMBAI - 400 069, MAHARASHTRA</text>`,
        `<text x="16" y="34.5" font-family="${SANS}" font-size="6.5" font-weight="700" fill="${ink}">RTGS / NEFT IFSC : NATB0001234</text>`,
        boxes(282, 9, 8, 13, 14, ink),
        `<text x="334" y="30" text-anchor="middle" font-family="${SANS}" font-size="5.5" font-weight="700" fill="${ink}" letter-spacing="7.6">DDMMYYYY</text>`,
        `<text x="386" y="37" text-anchor="end" font-family="${SANS}" font-size="4.2" fill="${soft}">Valid for 3 months only</text>`,
        // pay, rupees and the amount box, in English and Hindi
        `<text x="16" y="56" font-family="${SANS}" font-size="8.5" font-weight="700" fill="${ink}">Pay</text><line x1="36" y1="57.5" x2="350" y2="57.5" stroke="${soft}" stroke-width="0.4" stroke-dasharray="1 0.6"/>`,
        `<text x="386" y="52" text-anchor="end" font-family="${SANS}" font-size="7" font-weight="700" fill="${ink}">Or Bearer</text><text x="386" y="61" text-anchor="end" font-family="${DEVA}" font-size="6" fill="${soft}">या धारक को</text>`,
        `<text x="16" y="78" font-family="${SANS}" font-size="8.5" font-weight="700" fill="${ink}">Rupees</text><text x="16" y="86" font-family="${DEVA}" font-size="5.5" fill="${soft}">रुपये</text>`,
        `<line x1="50" y1="79.5" x2="270" y2="79.5" stroke="${soft}" stroke-width="0.4" stroke-dasharray="1 0.6"/><line x1="16" y1="99.5" x2="246" y2="99.5" stroke="${soft}" stroke-width="0.4" stroke-dasharray="1 0.6"/>`,
        `<text x="250" y="98" font-family="${DEVA}" font-size="5.5" fill="${soft}">अदा करें</text>`,
        `<rect x="280" y="72" width="106" height="24" fill="#ffffff" fill-opacity="0.8" stroke="${ink}" stroke-width="0.8"/><line x1="296" y1="72" x2="296" y2="96" stroke="${ink}" stroke-width="0.8"/>`,
        `<text x="288" y="89" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="700" fill="${ink}">₹</text>`,
        // the account
        `<rect x="16" y="107" width="34" height="16" fill="#ffffff" fill-opacity="0.7" stroke="${ink}" stroke-width="0.7"/><text x="19" y="114" font-family="${SANS}" font-size="5.5" font-weight="700" fill="${ink}">A/c No.</text><text x="19" y="120.5" font-family="${DEVA}" font-size="4" fill="${soft}">खाता सं.</text>`,
        `<rect x="50" y="107" width="88" height="16" fill="#ffffff" fill-opacity="0.85" stroke="${ink}" stroke-width="0.7"/><text x="54" y="119" font-family="${SANS}" font-size="9.5" font-weight="700" fill="#16263a" letter-spacing="0.4">50100012345678</text>`,
        `<text x="143" y="113" font-family="${SANS}" font-size="5" fill="${ink}">Brn: 0123  Pdt: 100</text><text x="143" y="120" font-family="${SANS}" font-size="5" fill="${ink}">SB A/C</text>`,
        `<text x="56" y="131" font-family="${SANS}" font-size="4.4" fill="${soft}">Payable at par through clearing / transfer at all branches of National Bank</text>`,
        // the signature line, microprinted
        `<text x="270" y="126.6" font-family="${SANS}" font-size="1.55" fill="${soft}" textLength="116" lengthAdjust="spacingAndGlyphs">${micro}</text>`,
        `<text x="386" y="137" text-anchor="end" font-family="${SANS}" font-size="4.4" fill="${soft}">Please sign above / <tspan font-family="${DEVA}">कृपया यहाँ हस्ताक्षर करें</tspan></text>`,
        f.date ? `<text font-family="${hand}" font-size="12" font-weight="700" fill="#1c2e4a" text-anchor="middle">${[ ...f.date ].map((c, i) => `<tspan x="${288.5 + i * 13}" y="21">${c}</tspan>`).join("")}</text>` : "",
        f.payee ? `<text x="44" y="54" font-family="${hand}" font-size="13" font-weight="700" fill="#1c2e4a">${f.payee}</text>` : "",
        f.words ? `<text font-family="${hand}" font-size="11.5" fill="#1c2e4a"><tspan x="56" y="76">${f.words[0]}</tspan><tspan x="20" y="96">${f.words[1]}</tspan></text>` : "",
        f.figure ? `<text x="302" y="89.5" font-family="${hand}" font-size="13" font-weight="700" fill="#1c2e4a">${f.figure}/-</text>` : "",
        micr(168, "#1d1d1d", String(serial).padStart(6, "0"), "400002345", "001234", "31"),
    ].join(""));
};

// A chequebook's cover, after the blue covers Indian banks issue: a stitched spine band down the left, the bank's
// mark in a white-ruled box at the top right, a faint grid of squares, an outlined motif in the lower right, a
// courier's address label with a barcode, and CHEQUE BOOK in white. The motif and the mark are our own; the label
// names no one.
export const chequeCoverSvg = () => {
    const sq = (x : number, y : number, s : number, o = 1, w = 1.4) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="#ffffff" stroke-opacity="${o}" stroke-width="${w}"/>`;
    // the motif: a diamond of nested squares, turned 45°, with smaller ones trailing off
    const motif = (cx : number, cy : number, s : number, o : number) =>
        `<g transform="translate(${cx} ${cy}) rotate(45)">${[ 1, 0.72, 0.44 ].map(f => sq(-s * f / 2, -s * f / 2, s * f, o)).join("")}<rect x="${-s * 0.12}" y="${-s * 0.12}" width="${s * 0.24}" height="${s * 0.24}" fill="#ffffff" fill-opacity="${o}"/></g>`;
    const bars = Array.from({ length : 46 }, (_, i) => { const w = [ 0.8, 1.6, 0.8, 2.4, 0.8 ][(i * 7) % 5]; return `<rect x="${86 + i * 2.75}" y="56" width="${w}" height="13" fill="#1e1e1e"/>`; }).join("");
    return wrap(540, 200, [
        `<defs><linearGradient id="cv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a86c8"/><stop offset="0.55" stop-color="#2c74b6"/><stop offset="1" stop-color="#215f9c"/></linearGradient>`,
        `<pattern id="grid" width="7" height="7" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="5" height="5" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="0.6"/></pattern>`,
        `<radialGradient id="sheen" cx="0.62" cy="0.3" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`,
        `<rect width="540" height="200" rx="9" fill="url(#cv)"/><rect width="540" height="200" rx="9" fill="url(#grid)"/><rect width="540" height="200" rx="9" fill="url(#sheen)"/>`,
        // the spine: a darker band, two ruled lines, the staples
        `<path d="M9 0 H40 V200 H9 Q0 200 0 191 V9 Q0 0 9 0 Z" fill="#1f5c98"/><rect x="40" y="0" width="1.4" height="200" fill="#ffffff" fill-opacity="0.85"/><rect x="47" y="0" width="0.8" height="200" fill="#ffffff" fill-opacity="0.45"/>`,
        [ 36, 100, 164 ].map(y => `<rect x="24" y="${y - 6}" width="2" height="12" rx="1" fill="#cfe0ef" fill-opacity="0.8"/>`).join(""),
        // faint motifs: one behind the label, one in the middle, the bold one in the lower right with its trail
        motif(250, 64, 52, 0.12), motif(52, 30, 18, 0.25),
        motif(474, 146, 62, 0.9), motif(418, 150, 34, 0.55), motif(456, 188, 22, 0.45), motif(400, 182, 14, 0.3),
        // the bank's mark, in a white-ruled box
        `<rect x="352" y="22" width="172" height="26" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-width="1.1"/>`,
        `<rect x="357" y="26" width="18" height="18" rx="2" fill="#ba644f"/><text x="366" y="39.6" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="#ffffff">₹</text>`,
        `<text x="381" y="40" font-family="${SANS}" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="0.6">NATIONAL BANK</text>`,
        `<text x="438" y="62" text-anchor="middle" font-family="${SANS}" font-size="8.5" fill="#e6f0f9">Banking for every Indian</text>`,
        // the courier's label: rounded, a little lifted, with a barcode and a return address
        `<g transform="rotate(-1.2 140 90)"><rect x="76" y="36" width="160" height="106" rx="12" fill="#f6f7f4" stroke="#dfe3e2"/>`,
        `<text x="86" y="51" font-family="${SANS}" font-size="6" fill="#333">NBE0405214709</text>${bars}`,
        `<g font-family="${SANS}" font-size="6.6" fill="#2a2a2a"><text x="86" y="81">SB A/C ····5678</text><text x="86" y="90">Station Road, Andheri (East)</text><text x="86" y="99">Mumbai - 400 069</text><text x="86" y="108">Maharashtra, INDIA</text></g>`,
        `<rect x="84" y="114" width="146" height="22" fill="none" stroke="#555" stroke-width="0.6"/><text font-family="${SANS}" font-size="4.6" fill="#333"><tspan x="87" y="121">If undelivered, please return to NATIONAL BANK LTD.</tspan><tspan x="87" y="127">Ground Floor, Station Road, Andheri (East),</tspan><tspan x="87" y="133">Mumbai - 400 069, Maharashtra</tspan></text></g>`,
        `<text x="76" y="178" font-family="${SANS}" font-size="17" font-weight="700" fill="#ffffff" letter-spacing="0.4">CHEQUE BOOK</text>`,
        `<text x="78" y="190" font-family="${SANS}" font-size="6.5" fill="#d6e6f4" letter-spacing="1">25 LEAVES</text>`,
        `<rect x="0.5" y="0.5" width="539" height="199" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>`,
    ].join(""));
};

// A demand draft: bilingual, on a green security tint, with the amount-guard column down its right edge.
export const draftSvg = (figure? : string) => {
    const ink = "#3d5a3d";
    const wave = (y : number) => `<path d="M0 ${y} Q50 ${y - 20} 100 ${y} T200 ${y} T300 ${y} T400 ${y}"/>`;
    return wrap(400, 180, [
        `<rect x="0.5" y="0.5" width="399" height="179" rx="4" fill="#dcebdc" stroke="#a9c4a9"/>`,
        `<g fill="none" stroke="#c4dcc4" stroke-width="0.7">${[ 40, 60, 80, 100, 120 ].map(wave).join("")}</g>`,
        `<text x="14" y="16" font-family="${SANS}" font-size="6.5" fill="${ink}">Issuing branch · Code 01234</text>`,
        `<text x="190" y="15" text-anchor="middle" font-family="${DEVA}" font-size="9" fill="${ink}">माँग ड्राफ्ट</text>`,
        `<text x="190" y="27" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="700" letter-spacing="1.5" fill="${ink}">DEMAND DRAFT</text>`,
        boxes(262, 9, 8, 13, 14, ink),
        `<text x="14" y="50" font-family="${DEVA}" font-size="7" fill="${ink}">माँगे जाने पर</text><text x="14" y="60" font-family="${SANS}" font-size="7" fill="${ink}">ON DEMAND PAY</text>`,
        `<line x1="78" y1="58" x2="320" y2="58" stroke="${ink}" stroke-width="0.5"/><text x="362" y="60" text-anchor="end" font-family="${SANS}" font-size="6.5" fill="${ink}">OR ORDER</text>`,
        `<text x="14" y="80" font-family="${DEVA}" font-size="7" fill="${ink}">रुपये</text><text x="40" y="80" font-family="${SANS}" font-size="7" fill="${ink}">RUPEES</text>`,
        `<line x1="72" y1="80" x2="250" y2="80" stroke="${ink}" stroke-width="0.5"/><line x1="14" y1="98" x2="250" y2="98" stroke="${ink}" stroke-width="0.5"/>`,
        `<rect x="262" y="72" width="100" height="22" fill="#eef6ee" stroke="${ink}" stroke-width="0.7"/><text x="270" y="87" font-family="${SANS}" font-size="10" fill="${ink}">₹</text>`,
        figure ? `<text x="282" y="88" font-family="${MONO}" font-size="10.5" font-weight="700" fill="#1f3a1f">${figure}</text>` : "",
        `<text x="14" y="116" font-family="${SANS}" font-size="6.5" fill="${ink}">Sr. No. 000123</text>`,
        `<text x="300" y="112" text-anchor="middle" font-family="${DEVA}" font-size="6.5" fill="${ink}">मूल्य प्राप्त</text><text x="300" y="121" text-anchor="middle" font-family="${SANS}" font-size="6.5" fill="${ink}">VALUE RECEIVED</text>`,
        `<line x1="250" y1="136" x2="352" y2="136" stroke="${ink}" stroke-width="0.5"/><text x="300" y="144" text-anchor="middle" font-family="${SANS}" font-size="6" fill="${ink}">Authorised signatory</text>`,
        `<rect x="372" y="8" width="20" height="136" fill="#eef6ee" stroke="${ink}" stroke-width="0.5"/>`,
        [ 8, 7, 6, 5, 4, 3, 2, 1 ].map((n, i) => `<text x="382" y="${22 + i * 17}" text-anchor="middle" font-family="${SANS}" font-size="6.5" fill="${ink}">${n}</text>`).join(""),
        `<rect x="0.5" y="150" width="399" height="29.5" fill="#f4faf4"/>`,
        micr(169, "#2e3b2e", "156386", "000002000", "000569", "16"),
    ].join(""));
};

// The RTGS / NEFT application a branch hands over the counter, with the RTGS box ticked.
export const formSvg = (figure = "₹65,00,000", words = "Sixty-five lakh only") => wrap(300, 190, [
    `<rect x="0.5" y="0.5" width="299" height="189" rx="3" fill="#fdfbf7" stroke="#cfc4b4"/><rect x="0.5" y="0.5" width="299" height="24" rx="3" fill="#864fe3"/>`,
    `<text x="12" y="16.5" font-family="${SANS}" font-size="9.5" font-weight="700" fill="#fff" letter-spacing="0.8">RTGS APPLICATION</text>`,
    `<g font-family="${SANS}" font-size="8" fill="#4b4339"><text x="12" y="44">Beneficiary name</text><text x="12" y="64">Account no.</text><text x="12" y="84">IFSC</text><text x="12" y="108">Amount</text><text x="12" y="128">In words</text><text x="239" y="180" text-anchor="middle" font-size="7">Signature of remitter</text></g>`,
    `<line x1="92" y1="45" x2="288" y2="45" stroke="#cfc4b4"/><line x1="56" y1="129" x2="288" y2="129" stroke="#cfc4b4"/><line x1="190" y1="170" x2="288" y2="170" stroke="#cfc4b4"/>`,
    `<text x="60" y="126" font-family="Snell Roundhand, Segoe Script, cursive" font-size="10" fill="#23324f">${words}</text>`,
    boxes(92, 54, 14, 14, 14, "#b9ad9b"), boxes(92, 74, 11, 14, 14, "#b9ad9b"),
    `<text x="96" y="85" font-family="${MONO}" font-size="9" letter-spacing="5.6" fill="#2b2723">BANK0001234</text>`,
    `<rect x="92" y="96" width="120" height="18" fill="#e4dcf7" stroke="#864fe3" stroke-width="0.8"/><text x="100" y="109" font-family="${MONO}" font-size="10" fill="#2b2723">${figure}</text>`,
].join(""));

// NEFT: a departures board of half-hourly batches.
export const neftSvg = () => wrap(300, 160, [
    `<rect width="300" height="160" rx="6" fill="#23211f"/><text x="14" y="20" font-family="${SANS}" font-size="9" font-weight="700" fill="#eaaa3a" letter-spacing="1.5">NEFT · BATCHES</text>`,
    [ [ "10:30", "21", "SETTLED", "#eaaa3a" ], [ "11:00", "22", "SETTLED", "#eaaa3a" ], [ "11:30", "23", "FILLING", "#f3eee4" ], [ "12:00", "24", "NEXT", "#8b847b" ] ].map(([ t, n, st, c ], i) =>
        `<g transform="translate(14 ${34 + i * 28})"><rect width="272" height="22" rx="2" fill="#2f2c29"/><line x1="0" y1="11" x2="272" y2="11" stroke="#23211f"/><text x="8" y="15" font-family="${MONO}" font-size="10" fill="#f3eee4">${t}</text><text x="64" y="15" font-family="${MONO}" font-size="10" fill="#f3eee4">BATCH ${n}</text><text x="264" y="15" text-anchor="end" font-family="${MONO}" font-size="10" fill="${c}">${st}</text></g>`).join(""),
].join(""));

// A phone: S2's after a UPI payment, or a bank app sending by IMPS.
const phoneBody = (screen : string, inner : string) => wrap(130, 250, `<rect x="2" y="2" width="126" height="246" rx="18" fill="#2a2724"/><rect x="8" y="8" width="114" height="234" rx="13" fill="${screen}"/><rect x="50" y="13" width="30" height="7" rx="3.5" fill="#2a2724"/>${inner}`);
export const upiPhoneSvg = (amount = "₹1,301") => phoneBody("#1e1c1a", [
    `<circle cx="65" cy="110" r="26" fill="#6b8e23"/><path d="M53 110 l8 8 l15 -16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    `<text x="65" y="164" text-anchor="middle" font-family="${SANS}" font-size="18" font-weight="700" fill="#f3eee4">${amount}</text>`,
    `<text x="65" y="180" text-anchor="middle" font-family="${SANS}" font-size="8" fill="#a89f93">Paid by UPI</text>`,
].join(""));
export const impsSvg = (amount = "₹15,516") => phoneBody("#fbf8f2", [
    `<text x="16" y="40" font-family="${SANS}" font-size="8" fill="#6c645b">Fund transfer</text><text x="16" y="54" font-family="${SANS}" font-size="11" font-weight="700" fill="#2b2723">IMPS</text>`,
    `<rect x="16" y="64" width="98" height="40" rx="6" fill="#f1e9dc"/><text x="22" y="78" font-family="${SANS}" font-size="7" fill="#6c645b">To A/c ••••2345</text><text x="22" y="92" font-family="${SANS}" font-size="7" fill="#6c645b">IFSC BANK0001234</text>`,
    `<text x="65" y="138" text-anchor="middle" font-family="${SANS}" font-size="18" font-weight="700" fill="#2b2723">${amount}</text>`,
    `<circle cx="65" cy="172" r="14" fill="#c98a1e"/><path d="M58 172 l5 5 l9 -10" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
    `<text x="65" y="200" text-anchor="middle" font-family="${SANS}" font-size="8" fill="#2b2723">Credited instantly</text>`,
].join(""));

// Cards: chip, contactless mark and a rupee roundel in place of any network's logo.
const card = (from : string, to : string, label : string, last4 : string, sub = "") => wrap(240, 150, [
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`,
    `<rect x="1" y="1" width="238" height="148" rx="12" fill="url(#g)"/><path d="M120 150 Q170 60 240 70 V138 Q240 150 228 150 Z" fill="#fff" opacity="0.08"/>`,
    `<text x="18" y="30" font-family="${SANS}" font-size="12" font-weight="700" fill="#fff" letter-spacing="2">${label}</text>`,
    sub ? `<text x="18" y="44" font-family="${SANS}" font-size="7.5" fill="#fff" opacity="0.85">${sub}</text>` : "",
    `<rect x="22" y="52" width="40" height="30" rx="5" fill="#d4b45c" stroke="#b59336"/><path d="M22 62h13M22 72h13M49 62h13M49 72h13M35 52v30M49 52v30" stroke="#b59336" stroke-width="0.8" fill="none"/>`,
    `<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.9"><path d="M78 58 q6 9 0 18"/><path d="M85 54 q9 13 0 26"/><path d="M92 50 q12 17 0 34"/></g>`,
    `<text x="22" y="110" font-family="${MONO}" font-size="13" fill="#fff" letter-spacing="2">•••• •••• •••• ${last4}</text>`,
    `<circle cx="206" cy="124" r="13" fill="#fff" opacity="0.9"/><text x="206" y="129" text-anchor="middle" font-family="${SANS}" font-size="14" font-weight="700" fill="${to}">₹</text>`,
].join(""));
export const creditSvg = () => card("#eab54a", "#b9821f", "CREDIT", "4721");
export const debitSvg = () => card("#93ad68", "#5f7d35", "DEBIT", "0318");
export const prepaidSvg = () => card("#d8c49e", "#a98c5c", "PREPAID", "8810", "Gift, metro and toll wallets");

// A FASTag on a windscreen.
export const fastagSvg = () => wrap(220, 120, [
    `<path d="M10 110 Q20 20 110 12 Q200 20 210 110 Z" fill="#c7d7df" opacity="0.7" stroke="#9fb3bd"/>`,
    `<g transform="translate(120 26)"><rect width="70" height="40" rx="4" fill="#fff" stroke="#cfc4b4"/><rect width="70" height="10" rx="3" fill="#94836c"/>`,
    `<text x="35" y="8" text-anchor="middle" font-family="${SANS}" font-size="6.5" font-weight="700" fill="#fff" letter-spacing="0.8">FASTag</text>`,
    [ [ 6, 1.5 ], [ 9, 3 ], [ 14, 1 ], [ 17, 2.5 ], [ 21, 1 ], [ 24, 3 ], [ 29, 1.5 ], [ 32, 1 ], [ 35, 3 ] ].map(([ x, w ]) => `<rect x="${x}" y="15" width="${w}" height="16" fill="#2b2723"/>`).join(""),
    `<text x="44" y="26" font-family="${SANS}" font-size="6" fill="#2b2723">₹133</text><text x="44" y="34" font-family="${SANS}" font-size="5" fill="#6c645b">a toll</text></g>`,
].join(""));

// A card terminal with its slip.
export const posSvg = (amount = "₹3,922") => wrap(120, 200, [
    `<path d="M30 4 h60 v40 h-60 z" fill="#fff" stroke="#cfc4b4"/><path d="M38 14h44M38 22h30M38 30h40" stroke="#cfc4b4"/>`,
    `<rect x="10" y="36" width="100" height="160" rx="16" fill="#3a3632"/><rect x="20" y="50" width="80" height="48" rx="4" fill="#cfe0b3"/>`,
    `<text x="60" y="72" text-anchor="middle" font-family="${MONO}" font-size="9" fill="#2f3a22">${amount}</text><text x="60" y="86" text-anchor="middle" font-family="${SANS}" font-size="6.5" fill="#2f3a22">TAP OR INSERT</text>`,
    [ 0, 1, 2 ].flatMap(r => [ 0, 1, 2 ].map(c => `<rect x="${24 + c * 26}" y="${108 + r * 19}" width="20" height="13" rx="3" fill="#5a544e"/>`)).join(""),
    `<rect x="24" y="168" width="72" height="16" rx="3" fill="#6b8e23"/>`,
].join(""));

// A fixed QR pattern (no real link), the same on every standee.
export const QR_PATH = (() => {
    let d = "", s = 7;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const finder = (x : number, y : number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
    d += finder(0, 0) + finder(14, 0) + finder(0, 14);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
        if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
        if (rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
    return d;
})();
export const qrSvg = () => wrap(60, 72, `<rect width="60" height="72" rx="5" fill="#fff" stroke="#cfc4b4"/><g transform="translate(9 8) scale(2)"><path d="${QR_PATH}" fill="#2b2723" fill-rule="evenodd"/></g><text x="30" y="65" text-anchor="middle" font-family="${SANS}" font-size="6" fill="#6c645b">Scan to pay</text>`);

// A ₹500 bundle: 100 notes on edge under a paper band.
export const bundleSvg = () => wrap(160, 70, [
    `<rect x="4" y="18" width="152" height="46" rx="3" fill="#9aae7a"/><path d="M6 24h148M6 30h148M6 36h148M6 42h148M6 48h148M6 54h148M6 60h148" stroke="#c9d6b3" stroke-width="0.8"/>`,
    `<rect x="4" y="8" width="152" height="14" rx="3" fill="#b7c69a" stroke="#8ea06c" stroke-width="0.6"/><circle cx="138" cy="15" r="4.5" fill="none" stroke="#6f8450" stroke-width="0.8"/>`,
    `<text x="16" y="18.5" font-family="${SANS}" font-size="8" font-weight="700" fill="#4d5f32">₹500</text>`,
    `<rect x="64" y="6" width="32" height="60" fill="#f2ead7" stroke="#cdbf9e" stroke-width="0.6"/>`,
    `<text x="80" y="34" text-anchor="middle" font-family="${SANS}" font-size="6.5" font-weight="700" fill="#6c5a3a">100 ×</text><text x="80" y="44" text-anchor="middle" font-family="${SANS}" font-size="6.5" font-weight="700" fill="#6c5a3a">₹500</text>`,
].join(""));

// As an image source.
export const dataUri = (svg : string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// NEFT, in plain terms: a net-banking transfer in a browser window, by account number and IFSC, its status that the
// money is on its way (NEFT settles in batches, so it is not instant)
export const neftNetSvg = (amount = "₹49,731") => wrap(300, 190, [
    `<rect x="0.5" y="0.5" width="299" height="189" rx="8" fill="#ffffff" stroke="#d6cfc2"/>`,
    `<path d="M0.5 8.5 Q0.5 0.5 8.5 0.5 H291.5 Q299.5 0.5 299.5 8.5 V24 H0.5 Z" fill="#efe9de"/>`,
    `<circle cx="13" cy="12.5" r="3.5" fill="#de4635"/><circle cx="24" cy="12.5" r="3.5" fill="#eaaa3a"/><circle cx="35" cy="12.5" r="3.5" fill="#6b8e23"/>`,
    `<rect x="52" y="6" width="200" height="13" rx="6.5" fill="#ffffff" stroke="#d6cfc2"/><text x="62" y="15.5" font-family="${SANS}" font-size="7.5" fill="#6c645b">netbanking.nationalbank</text>`,
    `<rect x="0.5" y="24" width="299" height="24" fill="#eaaa3a"/><text x="14" y="40" font-family="${SANS}" font-size="10" font-weight="800" fill="#ffffff" letter-spacing="0.6">FUND TRANSFER · NEFT</text>`,
    `<g font-family="${SANS}" font-size="8" fill="#6c645b"><text x="14" y="68">To</text><text x="14" y="84">IFSC</text><text x="14" y="106">Amount</text></g>`,
    `<g font-family="${SANS}" font-size="9" fill="#2b2723"><text x="70" y="68">A/c ••••2345 · Ravi Kumar</text><text x="70" y="84">NATB0001234</text></g>`,
    `<text x="70" y="110" font-family="${SANS}" font-size="17" font-weight="800" fill="#2b2723">${amount}</text>`,
    `<rect x="14" y="128" width="272" height="26" rx="6" fill="#fdf3dc"/><circle cx="30" cy="141" r="7" fill="#eaaa3a"/><path d="M26.5 141 l2.5 2.5 l5 -5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
    `<text x="44" y="144.5" font-family="${SANS}" font-size="8.5" fill="#6a4204">Transfer submitted · settles in the next batch</text>`,
    `<rect x="190" y="164" width="96" height="16" rx="8" fill="#eaaa3a"/><text x="238" y="175" text-anchor="middle" font-family="${SANS}" font-size="8" font-weight="700" fill="#ffffff">Done</text>`,
].join(""));

// The instrument that stands for each method on the ladder, with its drawing's size; the cards and the FASTag are the
// realistic ones of objects.ts.
export type MethodKey = "rtgs" | "paper" | "neft" | "imps" | "credit" | "debit" | "upi" | "ppi" | "netc";
export const FACE : Record<MethodKey, { svg : () => string; w : number; h : number }> = {
    rtgs   : { svg : () => formSvg(), w : 300, h : 190 },
    paper  : { svg : () => chequeLeafSvg(111, { figure : "1,27,909" }), w : 400, h : 180 },
    neft   : { svg : () => neftNetSvg(), w : 300, h : 190 },
    imps   : { svg : () => impsSvg(), w : 130, h : 250 },
    credit : { svg : () => cardSvg("credit").svg, w : 240, h : 150 },
    debit  : { svg : () => cardSvg("debit").svg, w : 240, h : 150 },
    upi    : { svg : () => upiPhoneSvg(), w : 130, h : 250 },
    ppi    : { svg : () => cardSvg("prepaid").svg, w : 240, h : 150 },
    netc   : { svg : () => fastagCardSvg().svg, w : 330, h : 180 },
};
