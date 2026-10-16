// Small line drawings for the story's panels: one for each crop DBIE gives state by state, and one well-known heritage
// landmark for each state that leads a crop in the "biggest grower" cards. Plain SVG strings drawn in currentColor, so
// the panels colour them; decoration only, never data. A state without a drawing here simply shows no landmark.

const svg = (w : number, body : string, label : string) =>
    `<svg viewBox="0 0 ${w} 40" width="${w}" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;

// CROPS ===============================================================================================================
export const CROP_ICONS : Record<string, string> = {
    // a paddy stalk bending under its grains
    rice : svg(40, `<path d="M17 37 C17 27 19 17 27 8"/><path d="M17 37 C15 30 11 26 7 24"/>
        ${[ [ 21, 22 ], [ 23, 17 ], [ 25.5, 12.5 ], [ 28, 9 ], [ 19.5, 27 ] ].map(([ x, y ], i) => `<ellipse cx="${x + 3}" cy="${y + 1}" rx="2.6" ry="1.4" transform="rotate(${30 + i * 8} ${x + 3} ${y + 1})" fill="currentColor" stroke="none"/>`).join("")}`, "Rice"),
    // an ear of wheat with its awns
    wheat : svg(40, `<path d="M20 37 V12"/>
        ${[ 26, 21, 16, 11 ].map(y => `<path d="M20 ${y} C16 ${y - 1} 14.5 ${y - 4} 15 ${y - 6} C18 ${y - 5} 20 ${y - 3} 20 ${y}Z M20 ${y} C24 ${y - 1} 25.5 ${y - 4} 25 ${y - 6} C22 ${y - 5} 20 ${y - 3} 20 ${y}Z" fill="currentColor" stroke="none"/>`).join("")}
        <path d="M20 6 V2 M16 7 L13 2 M24 7 L27 2"/>`, "Wheat"),
    // a pod, split open on its seeds
    pulses : svg(40, `<path d="M6 26 C10 12 26 8 34 12 C30 24 16 30 6 26Z"/><circle cx="13" cy="22" r="2.6" fill="currentColor"/><circle cx="19.5" cy="19" r="2.8" fill="currentColor"/><circle cx="26" cy="16" r="2.6" fill="currentColor"/><path d="M34 12 L37 8"/>`, "Pulses"),
    // a drop of oil and the seeds it is pressed from
    oilseeds : svg(40, `<path d="M18 5 C12 15 9 20 9 25 a9 9 0 0 0 18 0 C27 20 24 15 18 5Z"/><path d="M14 26 a4 4 0 0 0 4 4"/><circle cx="32" cy="27" r="2" fill="currentColor"/><circle cx="34" cy="33" r="2" fill="currentColor"/><circle cx="29" cy="34" r="2" fill="currentColor"/>`, "Oilseeds"),
    // a maize cob in its husk
    coarse : svg(40, `<ellipse cx="20" cy="18" rx="6" ry="12"/><path d="M14.6 13 H25.4 M14 18 H26 M14.6 23 H25.4 M20 6 V30 M16.5 8 V28 M23.5 8 V28"/><path d="M20 30 C14 32 11 35 9 38 M20 30 C26 32 29 35 31 38"/>`, "Millets and maize"),
    // two canes with their joints and a leaf
    sugarcane : svg(40, `<path d="M15 38 V4 M24 38 V8"/><path d="M12.5 12 H17.5 M12.5 21 H17.5 M12.5 30 H17.5 M21.5 16 H26.5 M21.5 25 H26.5"/><path d="M24 8 C28 4 32 4 35 5 M15 4 C11 2 8 3 6 5"/>`, "Sugarcane"),
    // an open cotton boll
    cotton : svg(40, `<circle cx="14" cy="17" r="6"/><circle cx="26" cy="17" r="6"/><circle cx="20" cy="11" r="6"/><circle cx="20" cy="22" r="6"/><path d="M12 28 L20 34 L28 28 M20 34 V38"/>`, "Cotton"),
    // a bundle of jute fibre, tied
    jute : svg(40, `<path d="M14 4 C15 15 13 26 15 37 M18 3 C19 15 18 26 19 37 M22 3 C21 15 22 26 21 37 M26 4 C25 15 27 26 25 37"/><path d="M12 19 H28 M12 22 H28"/>`, "Jute"),
};

// TRADE ITEMS =========================================================================================================
// The farm goods DBIE lists in its trade tables that are not already crops above.
export const ITEM_ICONS : Record<string, string> = {
    marine : svg(40, `<path d="M5 20 C11 11 22 10 29 20 C22 30 11 29 5 20Z"/><path d="M29 20 L36 13 V27 Z"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/><path d="M17 15 C19 18 19 22 17 25"/>`, "Fish and seafood"),
    meat : svg(40, `<path d="M20 6 C13 6 9 15 9 23 a11 11 0 0 0 22 0 C31 15 27 6 20 6Z"/><path d="M14 24 a6 6 0 0 0 6 6"/>`, "Meat, milk and eggs"),
    spices : svg(40, `<path d="M9 31 C14 33 24 30 30 21 C33 16 32 11 30 9 C27 14 22 19 9 26 C7 27 7 30 9 31Z"/><path d="M30 9 C31 6 33 5 35 5"/>`, "Spices"),
    fruitveg : svg(40, `<path d="M20 13 C15 9 7 11 7 20 C7 29 14 35 20 32 C26 35 33 29 33 20 C33 11 25 9 20 13Z"/><path d="M20 13 C20 9 21 6 23 4"/><path d="M22 8 C26 5 30 6 31 8 C28 10 25 10 22 8Z" fill="currentColor"/>`, "Fruit and vegetables"),
    processed : svg(40, `<path d="M10 9 H30 L28 35 H12 Z"/><path d="M10 9 L13 5 H27 L30 9"/><path d="M14 18 H26 M14 23 H26"/>`, "Processed foods"),
    coffee : svg(40, `<path d="M8 15 H28 V25 a8 8 0 0 1 -8 8 H16 a8 8 0 0 1 -8 -8Z"/><path d="M28 18 H31 a3 3 0 0 1 0 6 H28"/><path d="M14 10 C13 8 15 7 14 5 M20 10 C19 8 21 7 20 5"/>`, "Coffee"),
    tea : svg(40, `<path d="M8 32 C8 18 18 8 33 7 C33 22 23 32 8 32Z"/><path d="M8 32 C15 24 21 19 28 12"/>`, "Tea"),
    tobacco : svg(40, `<path d="M20 36 C10 30 8 18 20 4 C32 18 30 30 20 36Z"/><path d="M20 36 V10 M20 20 L14 15 M20 26 L26 20"/>`, "Tobacco"),
    cashew : svg(40, `<path d="M30 10 C22 6 10 10 10 21 C10 30 18 34 24 31 C21 28 21 23 26 21 C32 19 34 13 30 10Z"/>`, "Cashew"),
    oilmeals : svg(40, `<path d="M11 12 C9 20 9 30 12 34 H28 C31 30 31 20 29 12 Z"/><path d="M13 12 C15 8 25 8 27 12"/><path d="M15 22 H25"/>`, "Oil cake"),
};

// LANDMARKS ===========================================================================================================
// One heritage landmark per state, drawn simply; the label names it and its town.
export const STATE_ICONS : Record<string, { label : string; svg : string }> = {
    "Uttar Pradesh" : { label : "Taj Mahal, Agra", svg : svg(48, `<path d="M3 37 H45"/><path d="M14 37 V22 H34 V37"/><path d="M21 37 V29 a3 3 0 0 1 6 0 V37"/>
        <path d="M17 22 C17 15 20 12 24 9 C28 12 31 15 31 22"/><path d="M24 9 V4"/><path d="M8 37 V18 M40 37 V18"/><path d="M7 18 H9 M39 18 H41"/>`, "Taj Mahal, Agra") },
    "West Bengal" : { label : "Howrah Bridge, Kolkata", svg : svg(48, `<path d="M2 30 H46"/><path d="M12 36 V8 M36 36 V8"/><path d="M12 8 C18 16 30 16 36 8"/><path d="M2 22 L12 8 M46 22 L36 8"/>
        <path d="M17 13 V30 M24 15 V30 M31 13 V30"/><path d="M2 36 H46" stroke-dasharray="2 3"/>`, "Howrah Bridge, Kolkata") },
    "Madhya Pradesh" : { label : "Sanchi Stupa", svg : svg(48, `<path d="M3 37 H45"/><path d="M8 37 V33 H40 V37"/><path d="M11 33 C11 21 17 15 24 15 C31 15 37 21 37 33"/>
        <path d="M21 15 V11 H27 V15 M24 11 V5 M20 7 H28"/><path d="M3 37 V25 M8 25 V37 M1 27 H10 M1 25 H10"/>`, "Sanchi Stupa") },
    "Gujarat" : { label : "Rani ki Vav, Patan", svg : svg(48, `<path d="M2 12 H46"/><path d="M6 12 V18 H42 V12 M10 18 V24 H38 V18 M14 24 V30 H34 V24 M18 30 V36 H30 V30"/>
        <path d="M10 12 V18 M18 12 V18 M30 12 V18 M38 12 V18 M16 18 V24 M24 18 V24 M32 18 V24"/>`, "Rani ki Vav, Patan") },
    "Rajasthan" : { label : "Hawa Mahal, Jaipur", svg : svg(48, `<path d="M4 37 H44"/><path d="M8 37 V22 H14 V14 H20 V8 H28 V14 H34 V22 H40 V37"/>
        ${[ [ 11, 27 ], [ 17, 27 ], [ 23, 27 ], [ 29, 27 ], [ 35, 27 ], [ 17, 19 ], [ 23, 19 ], [ 29, 19 ], [ 23, 12 ], [ 11, 32 ], [ 17, 32 ], [ 29, 32 ], [ 35, 32 ] ].map(([ x, y ]) => `<path d="M${x} ${y + 2.5} V${y} a1 1 0 0 1 2 0 V${y + 2.5}"/>`).join("")}`, "Hawa Mahal, Jaipur") },
    "Maharashtra" : { label : "Gateway of India, Mumbai", svg : svg(48, `<path d="M3 37 H45"/><path d="M8 37 V15 H40 V37"/><path d="M18 37 V26 C18 21 21 18 24 18 C27 18 30 21 30 26 V37"/>
        <path d="M8 15 V9 H13 V15 M35 15 V9 H40 V15 M17 15 V11 H22 V15 M26 15 V11 H31 V15"/><path d="M11 22 V30 M37 22 V30"/>`, "Gateway of India, Mumbai") },
};
