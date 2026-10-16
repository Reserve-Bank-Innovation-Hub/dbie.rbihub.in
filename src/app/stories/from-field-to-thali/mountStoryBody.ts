// THE STORY BELOW THE OPENING =========================================================================================
// Fills StoryBody's skeleton: each chapter's words, charts and table views, In short, the closing line and the
// annexure. Every figure comes from data.ts, which reads data.gen.ts. The drawing is plain SVG strings, as in the
// other stories' hand-built figures; mountStoryBody returns its own clean-up.
//
// The words state what DBIE's figures show and nothing more: no view on whether a price, a purchase or a trade is
// right or enough. Wherever a term or a gap could confuse, a one-line note explains it.

import {
    BUY_CROPS, COSTS, CROP_NAMES, EXPORTS, FARM_EXPORTS, FARM_IMPORTS, FARM_WAGE, GROWTH, HEADLINE, IMPORTS, L0, L1,
    LAND, LAND_LAST, LAND_STATUS, LEST, LONG_TRADE, M0, M1, MSP_CROPS, MSP_VS_COSTS, P0, PDS, PDS_PART_YEAR, PLAST,
    PROC_SHARE, PROC_WORKING, SACK_KG, STATE_CROPS, STATE_LATEST, STATE_MISSING_LATEST, STATE_NOW, STATE_THEN,
    STATES_NOW, T0, T1, TRADE_PROVISIONAL, TRADE_SHORT, TRADE_YEARS, belowCosts, crossedCosts, exportsOf, fertOf,
    importsOf, inr, inr1, kgFor, moreLess, mspOf, sacks, shiftOf, topCropsOf, usd,
} from "./data";
import type { CropKey, StateCropKey } from "./data";
import { CROP_ICONS, ITEM_ICONS, STATE_ICONS } from "./icons";

const WORDS = [ "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten" ];
const cap = (s : string) => s[0].toUpperCase() + s.slice(1);
const x2 = (v : number) => `${v.toFixed(2)} times`;
// a share in per cent: whole numbers from 1%, one decimal below, and "less than 0.1%" for a trace
const sh = (v : number) => v <= 0 ? "0%" : v < 0.05 ? "less than 0.1%" : `${v < 1 ? v.toFixed(1) : Math.round(v)}%`;
// rupees: a whole number as it is, otherwise to one decimal (₹398, ₹224.6)
// the same, short, for a chart's value column
const shs = (v : number) => v > 0 && v < 0.05 ? "<0.1%" : sh(v);
const rs = (v : number) => `₹${Number.isInteger(v) ? inr(v) : inr1(v)}`;
const UT = (n : string) => n === "Union Territories" ? "Union territories (together)" : n;
const list = (xs : string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const bn = (m : number) => (m / 1000).toFixed(1);

export const mountStoryBody = (root : HTMLElement) : (() => void) => {
    const $ = <T extends HTMLElement = HTMLElement>(id : string) => root.querySelector<T>(`#${id}`)!;
    const cleanups : (() => void)[] = [];
    const on = (ev : string, fn : () => void) => { addEventListener(ev, fn, { passive : true }); cleanups.push(() => removeEventListener(ev, fn)); };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const para = (s : string) => `<p class="para">${s}</p>`;
    const tableHtml = (head : string[], rows : (string | number)[][]) => `<thead><tr>${head.map((h, i) => `<th class="${i ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? "n" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody>`;

    // A LINE CHART, shared by four figures: years along the bottom, one line per series, an end label on each line on a
    // wide screen, a hover crosshair that names every series' value for the year under the pointer. A series may mark
    // its last point as an estimate (dashed, hollow).
    interface Series { name : string; colour : string; values : (number | null)[]; estimateLast ? : boolean; }
    const lineChart = (id : string, years : string[], series : Series[], fmt : (v : number) => string, label : string, ticks = 5) => {
        const box = $(id), W = box.clientWidth; if (!W) return;
        const narrow = W < 560, H = narrow ? 260 : 300, pad = { l : 46, r : narrow ? 14 : 146, t : 12, b : 26 };
        const n = years.length, all = series.flatMap(s => s.values.filter((v) : v is number => v != null));
        const raw = Math.max(...all), step = Math.pow(10, Math.floor(Math.log10(raw / ticks))), unit = [ 1, 2, 2.5, 5, 10 ].map(k => k * step).find(k => raw / k <= ticks)!;
        const top = Math.ceil(raw / unit) * unit;
        const x = (i : number) => pad.l + i / (n - 1) * (W - pad.l - pad.r), y = (v : number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
        const path = (vs : (number | null)[], upto : number) => { let d = "", pen = false; vs.slice(0, upto).forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; }); return d; };
        const every = Math.ceil(n / (narrow ? 4 : 7));
        const ends = series.map(s => { const i = s.values.length - 1 - [ ...s.values ].reverse().findIndex(v => v != null); return { s, i, y : y(s.values[i] as number) }; }).sort((a, b) => a.y - b.y);
        for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 15);
        box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
            ${Array.from({ length : Math.round(top / unit) + 1 }, (_, k) => k * unit).map(v => `<line class="${v ? "grid" : "base"}" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"></line><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join("")}
            ${years.map((yr, i) => (i % every === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= every * 0.85) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${yr}</text>` : "").join("")}
            ${series.map(s => {
                const last = s.values.length - 1;
                const solid = path(s.values, s.estimateLast ? last : last + 1);
                const est = s.estimateLast && s.values[last] != null && s.values[last - 1] != null ? `<path class="ln" style="stroke:${s.colour};stroke-dasharray:3 4" d="M${x(last - 1)},${y(s.values[last - 1]!)}L${x(last)},${y(s.values[last]!)}"></path><circle cx="${x(last)}" cy="${y(s.values[last]!)}" r="4" fill="#ffffff" stroke="${s.colour}" stroke-width="2"></circle>` : "";
                return `<path class="ln" style="stroke:${s.colour}" d="${solid}"></path>${est}`;
            }).join("")}
            ${narrow ? "" : ends.map(e => `<text class="lbl-strong" x="${x(e.i) + 8}" y="${e.y + 4}">${e.s.name} ${fmt(e.s.values[e.i] as number)}</text>`).join("")}
            <line class="cross" y1="${pad.t}" y2="${H - pad.b}" style="display:none"></line>
            <rect class="hit" x="${pad.l}" y="${pad.t}" width="${W - pad.l - pad.r}" height="${H - pad.t - pad.b}" fill="transparent"></rect>
        </svg>`;
        const hit = box.querySelector<SVGRectElement>(".hit")!, cross = box.querySelector<SVGLineElement>(".cross")!;
        let tip : HTMLDivElement | null = null;
        const move = (e : PointerEvent) => {
            const b = hit.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - b.left) / b.width * (n - 1))));
            cross.style.display = ""; cross.setAttribute("x1", String(x(i))); cross.setAttribute("x2", String(x(i)));
            if (!tip) { tip = document.createElement("div"); tip.className = "tip"; box.appendChild(tip); }
            tip.style.left = `${Math.min(Math.max(x(i), 100), W - 100)}px`; tip.style.top = `${pad.t}px`;
            tip.innerHTML = `<strong>${years[i]}</strong>${series.map(s => `<span><i class="sw" style="background:${s.colour}"></i> ${s.name}: ${s.values[i] == null ? "no figure" : fmt(s.values[i]!)}${s.estimateLast && i === s.values.length - 1 ? " (estimate)" : ""}</span>`).join("")}`;
        };
        hit.addEventListener("pointermove", move); hit.addEventListener("pointerdown", move);
        hit.addEventListener("pointerleave", () => { cross.style.display = "none"; if (tip) { tip.remove(); tip = null; } });
    };

    // AT A GLANCE =====================================================================================================
    {
        const item = (icon : string, name : string, v : number, max : number, val : string) => `<li><span class="gl-icon">${icon}</span><span class="gl-name">${name}</span><span class="gl-bar"><i style="width:${(100 * v / max).toFixed(1)}%"></i></span><span class="gl-val">${val}</span></li>`;
        const GROW : CropKey[] = [ "sugarcane", "rice", "wheat", "coarse", "oilseeds", "pulses" ];
        const grown = GROW.map(k => ({ k, v : L1.output[k] })).sort((a, b) => b.v - a.v);
        $("gl-grow-units").textContent = `Output in ${L1.year}, lakh tonnes`;
        $("gl-grow").innerHTML = grown.map(g => item(CROP_ICONS[g.k] ?? "", CROP_NAMES[g.k], g.v, grown[0].v, inr(g.v))).join("");
        $("gl-grow-note").textContent = "By weight. Sugarcane is mostly water and fibre, so it outweighs every grain.";
        const e1 = exportsOf(T1.year), i1 = importsOf(T1.year);
        const TRADE_ICON : Record<string, string> = { ...ITEM_ICONS, rice : CROP_ICONS.rice, oil : CROP_ICONS.oilseeds, pulses : CROP_ICONS.pulses, cotton : CROP_ICONS.cotton, oilseeds : CROP_ICONS.oilseeds, cereals : CROP_ICONS.coarse };
        const sold = FARM_EXPORTS.map(it => ({ k : it.key, v : Number(e1[it.key] ?? 0) })).sort((a, b) => b.v - a.v).slice(0, 5);
        const bought = FARM_IMPORTS.map(it => ({ k : it.key, v : Number(i1[it.key] ?? 0) })).sort((a, b) => b.v - a.v);
        $("gl-sell-units").textContent = `${T1.year}, US$ billion: money coming in`;
        $("gl-buy-units").textContent = `${T1.year}, US$ billion: money going out`;
        $("gl-sell").innerHTML = sold.map(x => item(TRADE_ICON[x.k] ?? "", TRADE_SHORT[x.k], x.v, sold[0].v, `$${bn(x.v)} bn`)).join("");
        $("gl-buy").innerHTML = bought.map(x => item(TRADE_ICON[x.k] ?? "", TRADE_SHORT[x.k], x.v, bought[0].v, `$${bn(x.v)} bn`)).join("");
        const fert = fertOf(T1.year);
        $("gl-buy-note").textContent = fert ? `Also fertiliser, used to grow crops: $${bn(fert)} bn.` : "";
    }

    // 1. WHAT INDIA GROWS =============================================================================================
    const G = GROWTH;
    const fgTimes = L1.output.foodgrains / L0.output.foodgrains, landTimes = L1.area.foodgrains / L0.area.foodgrains, yieldTimes = L1.yield.foodgrains / L0.yield.foodgrains;
    $("grow-title").textContent = `${cap(WORDS[Math.round(fgTimes)] ?? String(Math.round(fgTimes)))} times the grain from ${landTimes.toFixed(1)} times the land`;
    $("grow-prose").innerHTML = para(`In ${L0.year}, India grew <b>${inr(L0.output.foodgrains)} lakh tonnes</b> of foodgrains: rice, wheat, millets, maize and pulses. In ${L1.year}, it grew <b>${inr(L1.output.foodgrains)} lakh tonnes</b>, about ${fgTimes.toFixed(1)} times as much.`)
        + para(`The land used for foodgrains grew far less, only ${landTimes.toFixed(1)} times. So most of the extra grain came from each hectare giving more: about ${yieldTimes.toFixed(1)} times as much as in ${L0.year}.`)
        + para(`Wheat grew the most, ${G.output.wheat.toFixed(1)} times. Rice grew ${G.output.rice.toFixed(1)} times, oilseeds ${G.output.oilseeds.toFixed(1)} times and pulses ${G.output.pulses.toFixed(1)} times.`)
        + para(`DBIE also gives a first figure for ${LEST.year}. It is an estimate (${LAND_STATUS?.status ?? "an advance estimate"}), so the chart shows it with a dashed line, and the comparisons stop at ${L1.year}.`);
    $("grow-lakh").textContent = "One lakh tonnes is 1,00,000 tonnes, or 10 crore kilograms.";
    $("grow-units").textContent = `Lakh tonnes, by crop year (July to June). The dashed end of each line is the ${LEST.year} estimate.`;
    $("grow-work").innerHTML = `<span class="work-head">How we worked it out</span>
        <span>Grain: ${inr(L1.output.foodgrains)} ÷ ${inr(L0.output.foodgrains)} = <b>${x2(fgTimes)}</b> (${moreLess(fgTimes)})</span>
        <span>Land: ${inr(L1.area.foodgrains)} ÷ ${inr(L0.area.foodgrains)} lakh hectares = <b>${x2(landTimes)}</b> (${moreLess(landTimes)})</span>
        <span>Grain from each hectare: ${inr(L1.yield.foodgrains)} ÷ ${inr(L0.yield.foodgrains)} kg = <b>${x2(yieldTimes)}</b></span>`;
    $("grow-table").innerHTML = tableHtml([ "Foodgrains", L0.year, L1.year, "How many times" ], [
        [ "Grain grown (lakh tonnes)", inr(L0.output.foodgrains), inr(L1.output.foodgrains), x2(fgTimes) ],
        [ "Land used (lakh hectares)", inr(L0.area.foodgrains), inr(L1.area.foodgrains), x2(landTimes) ],
        [ "Grain from each hectare (kg)", inr(L0.yield.foodgrains), inr(L1.yield.foodgrains), x2(yieldTimes) ],
    ]);
    $("grow-note").textContent = "DBIE, Handbook of Statistics: agricultural production, area under cultivation and yield per hectare (annexure A1 to A6).";
    const drawGrow = () => lineChart("grow-box", LAND.map(l => l.year), ([ [ "rice", "Rice", "var(--rice)" ], [ "wheat", "Wheat", "var(--wheat)" ], [ "pulses", "Pulses", "var(--pulses)" ], [ "oilseeds", "Oilseeds", "var(--oil)" ] ] as const)
        .map(([ k, name, colour ]) => ({ name, colour, values : LAND.map(l => l.output[k as CropKey]), estimateLast : true })), v => inr(v), `India's output of rice, wheat, pulses and oilseeds, ${L0.year} to ${LEST.year}, lakh tonnes`);

    // one hectare, then and now, in 50 kg sacks
    const ACRE_CROPS : [ CropKey, string ][] = [ [ "wheat", "Wheat" ], [ "rice", "Rice" ], [ "pulses", "Pulses (dal)" ] ];
    const w = ACRE_CROPS[0][0];
    $("acre-prose").innerHTML = para(`In ${L0.year}, one hectare of wheat gave about <b>${inr(L0.yield[w])} kg</b> of grain, about ${Math.round(sacks(L0.yield[w]))} sacks. In ${L1.year}, the same hectare gave about <b>${inr(L1.yield[w])} kg</b>, about ${Math.round(sacks(L1.yield[w]))} sacks.`)
        + para(`Rice went from about ${Math.round(sacks(L0.yield.rice))} sacks a hectare to ${Math.round(sacks(L1.yield.rice))}. Pulses went from about ${Math.round(sacks(L0.yield.pulses))} to ${Math.round(sacks(L1.yield.pulses))}.`);
    $("acre-units").textContent = `Average harvest from one hectare, ${L0.year} and ${L1.year}. Each sack is ${SACK_KG} kg.`;
    const sackIcon = `<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M2 3 Q1 11 2 11.5 H8 Q9 11 8 3 Q5 4 2 3 Z" fill="currentColor"/><path d="M3 1.2 Q5 3 7 1.2 L7.3 2.8 Q5 3.6 2.7 2.8 Z" fill="currentColor"/></svg>`;
    $("acre-box").innerHTML = ACRE_CROPS.map(([ k, name ]) => `<div class="acre-crop"><div class="acre-name">${name}</div>
        ${[ L0, L1 ].map(l => { const n = Math.round(sacks(l.yield[k])); return `<div class="acre-row"><span class="acre-year">${l.year}</span><span class="acre-sacks ${l === L0 ? "is-then" : "is-now"}" role="img" aria-label="${name}, ${l.year}: about ${n} sacks of ${SACK_KG} kg from one hectare">${sackIcon.repeat(n)}</span><span class="acre-val">${n} sacks <i>(${inr(l.yield[k])} kg)</i></span></div>`; }).join("")}</div>`).join("");

    // why some dal and oil come from abroad
    const WHY : [ CropKey, string ][] = [ [ "wheat", "Wheat" ], [ "rice", "Rice" ], [ "coarse", "Millets and maize" ], [ "oilseeds", "Oilseeds" ], [ "pulses", "Pulses (dal)" ] ];
    const whyRows = WHY.map(([ k, name ]) => ({ k, name, t : L1.yield[k] / L0.yield[k] })).sort((a, b) => b.t - a.t);
    $("why-prose").innerHTML = para(`Each hectare of wheat now gives ${G.yield.wheat.toFixed(1)} times as much as in ${L0.year}, and each hectare of rice ${G.yield.rice.toFixed(1)} times. For pulses it is ${G.yield.pulses.toFixed(1)} times, and for oilseeds ${G.yield.oilseeds.toFixed(1)} times.`)
        + para(`Oilseed output still grew ${G.output.oilseeds.toFixed(1)} times, mostly because much more land was sown with them: ${G.area.oilseeds.toFixed(1)} times as much. India also buys dal and cooking oil from abroad: in ${HEADLINE.tradeYear}, ${usd(HEADLINE.oilImports)} of cooking oil and ${usd(HEADLINE.pulsesImports)} of pulses (see <a href="#trade">Money out, money in</a>).`);
    $("why-units").textContent = `Harvest from one hectare in ${L1.year}, as a multiple of ${L0.year}`;
    const whyMax = Math.max(...whyRows.map(r => r.t));
    $("why-bars").innerHTML = whyRows.map(r => `<div class="st-row ${r.k === "pulses" || r.k === "oilseeds" ? "is-picked" : ""}"><span class="st-name">${r.name}</span><span class="st-bar"><i style="width:${(100 * r.t / whyMax).toFixed(1)}%"></i></span><span class="st-val">${r.t.toFixed(1)}×</span></div>`).join("");
    $("why-table").innerHTML = tableHtml([ "Crop", `${L0.year} (kg a hectare)`, `${L1.year} (kg a hectare)`, "How many times" ], whyRows.map(r => [ r.name, inr(L0.yield[r.k]), inr(L1.yield[r.k]), x2(r.t) ]));

    // 2. WHICH STATE GROWS WHAT =======================================================================================
    {
        const fg = shiftOf("foodgrains"), top3 = fg.rows.slice(0, 3);
        const rise = (k : StateCropKey) => [ ...shiftOf(k).rows ].sort((a, b) => (b.nowShare - b.thenShare) - (a.nowShare - a.thenShare))[0];
        const fall = (k : StateCropKey) => [ ...shiftOf(k).rows ].sort((a, b) => (a.nowShare - a.thenShare) - (b.nowShare - b.thenShare))[0];
        const bigFall = ([ "rice", "wheat", "pulses", "oilseeds" ] as StateCropKey[]).map(k => ({ k, r : fall(k) })).sort((a, b) => (a.r.nowShare - a.r.thenShare) - (b.r.nowShare - b.r.thenShare))[0];
        const nameOf = (k : StateCropKey) => STATE_CROPS.find(c => c.key === k)!.name.toLowerCase();
        $("sg-title").textContent = `Each state has its crops, and the picture has changed since ${STATE_THEN}`;
        $("sg-prose").innerHTML = para(`DBIE gives every state’s output of nine crops. In ${STATE_NOW}, ${top3[0].name} grew <b>${sh(top3[0].nowShare)}</b> of India’s foodgrains, the most of any state, followed by ${top3[1].name} (${sh(top3[1].nowShare)}) and ${top3[2].name} (${sh(top3[2].nowShare)}).`)
            + para(`Some states now grow much more of a crop than before. ${([ "oilseeds", "wheat", "pulses", "rice" ] as StateCropKey[]).map(k => { const r = rise(k); return `${r.name}’s share of India’s ${nameOf(k)} went from ${sh(r.thenShare)} to ${sh(r.nowShare)}`; }).join(". ")}. Over the same years, ${bigFall.r.name}’s share of ${nameOf(bigFall.k)} went down from ${sh(bigFall.r.thenShare)} to ${sh(bigFall.r.nowShare)}.`)
            + para(`Pick a crop to see every state, and find your own state alongside.`);
        const missing = STATE_MISSING_LATEST.filter(n => n !== "Union Territories");
        $("sg-why-year").textContent = `${STATE_NOW} is the latest year for which DBIE has figures from every state. Its table runs to ${STATE_LATEST}, but that year has no figures yet for ${list(missing)}${STATE_MISSING_LATEST.includes("Union Territories") ? ", or for the union territories" : ""}.`;
        const merged = fg.rows.filter(r => r.note).map(r => `${r.note!.replace(/^with /, "")} with ${r.name}`);
        $("sg-merged").textContent = `For the comparison with ${STATE_THEN}, states formed since then are counted with the states they were part of: ${list(merged)}.`;
        $("sg-note").textContent = `DBIE, Handbook of Statistics: state-wise production of foodgrains and major non-foodgrain crops (annexure A7). DBIE groups the union territories together. Cotton and jute are counted in bales, the other crops in tonnes.`;

        let crop : StateCropKey = "rice", picked = top3[0].name;
        $("sg-legend").innerHTML = `<span><i class="sw dot-then"></i>${STATE_THEN}</span><span><i class="sw dot-now"></i>${STATE_NOW}</span>`;
        const drawStates = () => {
            root.querySelectorAll<HTMLElement>(".tg-card").forEach(c => c.classList.toggle("is-on", c.dataset.crop === crop));
            const s = shiftOf(crop), c = STATE_CROPS.find(x => x.key === crop)!;
            const max = Math.max(...s.rows.flatMap(r => [ r.thenShare, r.nowShare ]));
            $("sg-figtitle").textContent = `Each state’s share of India’s ${c.name.toLowerCase()}`;
            $("sg-units").textContent = `Per cent of India’s output, ${STATE_THEN} and ${STATE_NOW}, every state.${crop === "cotton" || crop === "jute" ? ` DBIE counts ${c.name.toLowerCase()} in ${c.unit.replace(/^thousand /, "")}.` : ""}`;
            $("sg-crops").innerHTML = STATE_CROPS.map(x => `<button type="button" class="${x.key === crop ? "is-on" : ""}" data-crop="${x.key}" aria-pressed="${x.key === crop}">${x.name}</button>`).join("");
            const px = (v : number) => `${(100 * v / max).toFixed(2)}%`;
            $("sg-bars").innerHTML = s.rows.map(r => `<div class="dumb-row ${r.name === picked ? "is-picked" : ""}" data-name="${r.name}" title="${r.name}${r.note ? ` (${r.note})` : ""}: ${sh(r.thenShare)} in ${STATE_THEN}, ${sh(r.nowShare)} in ${STATE_NOW}">
                <span class="st-name">${UT(r.name)}${r.note ? ` <small>${r.note}</small>` : ""}</span>
                <span class="dumb-track"><b style="left:${px(Math.min(r.thenShare, r.nowShare))};width:calc(${px(Math.abs(r.nowShare - r.thenShare))})" class="${r.nowShare >= r.thenShare ? "up" : "down"}"></b><i class="then" style="left:${px(r.thenShare)}"></i><i class="now" style="left:${px(r.nowShare)}"></i></span>
                <span class="st-val">${shs(r.thenShare)} → ${shs(r.nowShare)}</span></div>`).join("");
            $("sg-table").innerHTML = tableHtml([ "State", `${STATE_THEN} share`, `${STATE_NOW} share`, "Up or down" ], s.rows.map(r => [ UT(r.name) + (r.note ? ` (${r.note})` : ""), shs(r.thenShare), shs(r.nowShare), r.nowShare > r.thenShare + 0.05 ? "Up" : r.nowShare < r.thenShare - 0.05 ? "Down" : "About the same" ]));
        };
        // the biggest grower of each crop: in 1980-81 among the states as they were then (undivided), in the latest
        // year among the states as they are now; a card switches the chart below to its crop
        {
            const leaders = STATE_CROPS.map(c => {
                const then = [ ...shiftOf(c.key).rows ].sort((a, b) => b.thenShare - a.thenShare)[0];
                const now = STATES_NOW.map(x => ({ name : x.name, share : (x.shares as Record<string, number>)[c.key] ?? 0 })).sort((a, b) => b.share - a.share)[0];
                return { ...c, then, now, same : then.name === now.name };
            });
            const kept = leaders.filter(l => l.same).length;
            $("tg-title").textContent = `The biggest grower of each crop, ${STATE_THEN} and ${STATE_NOW}`;
            $("tg-units").textContent = `${kept} of ${leaders.length} crops have the same leading state as in ${STATE_THEN}. Share of India’s output; pick a card to see every state for that crop. ${STATE_NOW} counts the states as they are now, so Telangana, for example, is apart from Andhra Pradesh here, while the chart below adds the newer states back to the ones they were part of in ${STATE_THEN}.`;
            // a state's landmark, drawn small beside its name (decoration; the label names it)
            const mark = (name : string) => `<span class="tg-mark">${STATE_ICONS[name]?.svg ?? ""}</span>`;
            const landmark = (name : string) => STATE_ICONS[name] ? `<small class="tg-lm">${STATE_ICONS[name].label}</small>` : "";
            const undivided = (note : string | null) => note ? ` <small>(then ${note.replace(/^with /, "including ")})</small>` : "";
            $("tg-grid").innerHTML = leaders.map(l => `<button type="button" class="tg-card ${l.same ? "is-same" : "is-new"}" data-crop="${l.key}" role="listitem" aria-label="${l.name}: ${l.then.name} in ${STATE_THEN}, ${l.now.name} in ${STATE_NOW}">
                <span class="tg-crop"><span class="tg-cropicon">${CROP_ICONS[l.key] ?? ""}</span>${l.name}</span>
                <span class="tg-row"><i>${STATE_THEN}</i>${mark(l.then.name)}<b>${UT(l.then.name)}${undivided(l.then.note)}${landmark(l.then.name)}</b><em>${sh(l.then.thenShare)}</em></span>
                <span class="tg-bar"><span style="width:${Math.min(100, l.then.thenShare).toFixed(1)}%"></span></span>
                <span class="tg-row"><i>${STATE_NOW}</i>${mark(l.now.name)}<b>${UT(l.now.name)}${landmark(l.now.name)}</b><em>${sh(l.now.share)}</em></span>
                <span class="tg-bar is-now"><span style="width:${Math.min(100, l.now.share).toFixed(1)}%"></span></span>
                <span class="tg-tag">${l.same ? "Same leader" : "New leader"}</span>
            </button>`).join("");
            $("tg-grid").addEventListener("click", e => {
                const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".tg-card"); if (!b) return;
                crop = b.dataset.crop as StateCropKey; drawStates();
                $("sg-chart").scrollIntoView({ behavior : reduced ? "auto" : "smooth", block : "start" });
            });
        }
        $("sg-crops").addEventListener("click", e => { const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-crop]"); if (b) { crop = b.dataset.crop as StateCropKey; drawStates(); } });
        drawStates();
        // find your state: what it grows most of, as a share of India, and how that has changed
        const sel = $<HTMLSelectElement>("sg-select");
        const names = STATES_NOW.map(s => s.name).filter(n => n !== "Union Territories").concat(STATES_NOW.some(s => s.name === "Union Territories") ? [ "Union Territories" ] : []);
        sel.innerHTML = names.map(n => `<option value="${n}">${n === "Union Territories" ? "Union territories (together)" : n}</option>`).join("");
        sel.value = picked;
        const parentOf = (name : string) => shiftOf("foodgrains").rows.find(r => r.note === `with ${name}`)?.name ?? null;
        const drawCard = () => {
            const name = sel.value, crops = topCropsOf(name), first = crops[0], parent = parentOf(name);
            const rows = crops.map(c => `<div class="st-row"><span class="st-name">${c.name}</span><span class="st-bar"><i style="width:${Math.min(100, c.share * 2).toFixed(1)}%"></i></span><span class="st-val">${shs(c.share)}</span></div>`).join("");
            const then = (k : StateCropKey) => shiftOf(k).rows.find(r => r.name === name);
            const change = parent ? `<p class="st-line">${name} was part of ${parent} in ${STATE_THEN}, so its own change since then is not shown.</p>`
                : (() => { const r = first ? then(first.key) : null; return r ? `<p class="st-line">Its share of India’s ${first.name.toLowerCase()} was <b>${sh(r.thenShare)}</b> in ${STATE_THEN}${r.note ? ` (${r.note})` : ""}, and <b>${sh(r.nowShare)}</b> in ${STATE_NOW}.</p>` : ""; })();
            $("sg-card").innerHTML = first
                ? `<p class="st-line">In ${STATE_NOW}, ${name === "Union Territories" ? "the union territories" : name} grew <b>${sh(first.share)}</b> of India’s ${first.name.toLowerCase()}, its biggest share of any crop.</p>${change}
                   <div class="st-pick-head" style="margin-top:12px">Share of India’s output, ${STATE_NOW}</div><div class="st-bars">${rows}</div>
                   <p class="st-explain">A share is the state’s output as a part of India’s total for that crop. A small state can grow a lot of food and still have a small share.</p>`
                : `<p class="st-line">DBIE has no output for ${name} in ${STATE_NOW}.</p>`;
            picked = name; root.querySelectorAll<HTMLElement>("#sg-bars .dumb-row").forEach(r => r.classList.toggle("is-picked", r.dataset.name === picked));
        };
        sel.addEventListener("change", drawCard);
        $("sg-bars").addEventListener("click", e => { const r = (e.target as HTMLElement).closest<HTMLElement>(".dumb-row"); if (r?.dataset.name && names.includes(r.dataset.name)) { sel.value = r.dataset.name; drawCard(); } });
        drawCard();
    }

    // 3. WHAT THE GOVERNMENT BUYS =====================================================================================
    $("buy-title").textContent = `The government buys about ${Math.round(PROC_SHARE.rice)}% of the rice harvest and ${Math.round(PROC_SHARE.wheat)}% of the wheat`;
    $("buy-prose").innerHTML = para(`The government announces a minimum support price for ${MSP_CROPS.length} crops. DBIE’s figures on what it buys cover two of them: rice and wheat.`)
        + para(`In ${PLAST.year}, it bought <b>${inr1(PLAST.proc)} lakh tonnes</b> of rice and wheat from farmers, gave out <b>${inr1(PLAST.off)} lakh tonnes</b>, mostly through ration shops, and had <b>${inr1(PLAST.stock)} lakh tonnes</b> in stock.`)
        + para(`Over ${PROC_SHARE.from} to ${PROC_SHARE.to}, what it bought came to about ${Math.round(PROC_SHARE.rice)}% of India’s rice harvest and ${Math.round(PROC_SHARE.wheat)}% of its wheat. The rest is kept by farm families or sold to traders and mills.`)
        + para(`DBIE has no table of what households eat. The grain given out through ration shops is the closest figure it has.`);
    $("msp-list").innerHTML = `<span class="fact-kicker">Crops with a support price (${MSP_CROPS.length})</span>
        <span class="fact-text">${MSP_CROPS.map(c => c.name).join(", ")}.</span>
        <span class="fact-text"><b>DBIE shows the government buying:</b> rice and wheat.</span>`;
    $("pds-units").textContent = `Lakh tonnes, ${P0.year} to ${PLAST.year}.`;
    $("pds-line").innerHTML = `In ${P0.year}, the government bought ${inr1(P0.proc)} lakh tonnes and gave out ${inr1(P0.off)}: more given out than bought. In ${PLAST.year}, it bought ${inr1(PLAST.proc)} and gave out ${inr1(PLAST.off)}.`;
    $("proc-work").innerHTML = `<span class="work-head">How we worked it out: grain bought ÷ harvest, each year from ${PROC_SHARE.from} to ${PROC_SHARE.to}</span>
        <span>Rice: ${PROC_WORKING.map(r => `${Math.round(r.riceShare)}%`).join(", ")}. Average: <b>about ${Math.round(PROC_SHARE.rice)}%</b></span>
        <span>Wheat: ${PROC_WORKING.map(r => `${Math.round(r.wheatShare)}%`).join(", ")}. Average: <b>about ${Math.round(PROC_SHARE.wheat)}%</b></span>
        <span class="work-note">For example, in ${PROC_WORKING.at(-1)!.year}: ${inr1(PROC_WORKING.at(-1)!.procRice)} ÷ ${inr(PROC_WORKING.at(-1)!.rice)} lakh tonnes of rice. Wheat bought in a year is set against the previous year’s wheat harvest, as wheat is sown in winter and bought in spring. That is why the words say “about”.</span>`;
    $("pds-note").textContent = `DBIE, Handbook of Statistics: public distribution system, procurement, off-take and stocks (annexure A8). Rice and wheat only.${PDS_PART_YEAR ? ` ${PDS_PART_YEAR} is left out, as its figures cover only part of the year.` : ""}`;
    const drawPds = () => lineChart("pds-box", PDS.map(p => p.year), [
        { name : "Bought", colour : "var(--buy)", values : PDS.map(p => p.proc) },
        { name : "Given out", colour : "var(--give)", values : PDS.map(p => p.off) },
        { name : "In stock", colour : "var(--stock)", values : PDS.map(p => p.stock) },
    ], v => inr(v), `Rice and wheat bought, given out and in stock, ${P0.year} to ${PLAST.year}, lakh tonnes`);

    // 4. SUPPORT PRICES AND EVERYDAY COSTS ============================================================================
    const V = MSP_VS_COSTS, crops = V.crops, hi = crops[0], lo = crops[crops.length - 1];
    const paddy = crops.find(c => c.key === "paddy")!, wheat = crops.find(c => c.key === "wheat")!;
    $("msp-title").textContent = `Between ${M0} and ${M1}, ${WORDS[crossedCosts.length] ?? crossedCosts.length} of ${crops.length} support prices rose more than everyday costs`;
    $("msp-prose").innerHTML = para(`Over these ten years, the everyday things a farm worker’s family buys came to cost <b>${x2(V.costs)}</b> as much (${moreLess(V.costs)}). A day’s farm wage went from ${rs(V.wageFrom)} to ${rs(V.wageTo)}: <b>${x2(V.wage)}</b> as much (${moreLess(V.wage)}).`)
        + para(`Support prices rose between ${x2(lo.times)} (${lo.name.toLowerCase()}) and ${x2(hi.times)} (${hi.name.toLowerCase()}). Paddy’s price rose ${x2(paddy.times)} and wheat’s ${x2(wheat.times)}, a little more than everyday costs.${belowCosts.length ? ` ${list(belowCosts.map(c => c.name))}’s price rose ${belowCosts.length > 1 ? "less" : `${x2(belowCosts[0].times)}, a little less`}.` : ""}`)
        + para(`These figures compare prices only. DBIE does not publish what farmers spend on seed, fertiliser or labour, so they cannot show a farmer’s earnings.`);
    $("msp-figtitle").textContent = `How many times each support price rose, ${M0} to ${M1}`;
    $("msp-units").textContent = `${M1} price as a multiple of ${M0}. The lines mark everyday costs (${x2(V.costs)}) and a day’s farm wage (${x2(V.wage)}).`;
    {
        const lo1 = 1, hi1 = Math.ceil(hi.times * 10) / 10 + 0.1, frac = (v : number) => ((v - lo1) / (hi1 - lo1)).toFixed(4), pos = (v : number) => `${(100 * +frac(v)).toFixed(2)}%`;
        $("msp-bars").innerHTML = `<div class="msp-grid">${crops.map(c => `<div class="st-row ${c.times < V.costs ? "is-below" : ""}"><span class="st-name">${c.name}</span><span class="st-bar"><i style="width:${pos(c.times)}"></i></span><span class="st-val">${c.times.toFixed(2)}×</span></div>`).join("")}
            <div class="msp-ref" style="--at:${frac(V.costs)}"><span>Costs ${V.costs.toFixed(2)}×</span></div>
            <div class="msp-ref is-wage" style="--at:${frac(V.wage)}"><span>Wage ${V.wage.toFixed(2)}×</span></div></div>`;
    }
    $("msp-table").innerHTML = tableHtml([ "", M0, M1, "How many times" ], [
        [ "Everyday costs (index)", inr1(V.costsFrom), inr1(V.costsTo), x2(V.costs) ],
        [ "A day’s farm wage (₹)", rs(V.wageFrom), rs(V.wageTo), x2(V.wage) ],
        ...crops.map(c => [ `${c.name} (₹ a quintal)`, `₹${inr(c.from!)}`, `₹${inr(c.to!)}`, x2(c.times) ]),
    ]);
    $("msp-note").textContent = "DBIE, Handbook of Statistics: minimum support prices (annexure A9 and A10); DBIE wage rates and consumer price index for agricultural labourers (annexure A13 and A14), financial-year averages.";
    $("msp-work").innerHTML = [
        [ "A day’s farm wage", `${rs(V.wageTo)} ÷ ${rs(V.wageFrom)}`, V.wage, "" ],
        [ "Everyday costs", `${inr1(V.costsTo)} ÷ ${inr1(V.costsFrom)}`, V.costs, "These are index numbers, not rupees: they only show how much prices went up. 799.5 is a starting point to compare against, not a price." ],
        [ "Paddy’s support price", `₹${inr(paddy.to!)} ÷ ₹${inr(paddy.from!)}`, paddy.times, "" ],
    ].map(([ t, sum, r, note ]) => `<div class="work-card"><span class="work-head">${t}, ${M0} to ${M1}</span><span class="work-sum">${sum} = <b>${(r as number).toFixed(2)} times</b></span><span class="work-pct">${cap(moreLess(r as number))}</span>${note ? `<span class="work-note">${note}</span>` : ""}</div>`).join("");
    // what one day of farm work buys at the support price
    {
        const cards = BUY_CROPS.map(({ key, name }) => {
            const a = kgFor(V.wageFrom, mspOf(M0, key)!), b = kgFor(V.wageTo, mspOf(M1, key)!);
            return { key, name, a, b };
        });
        const wh = cards.find(c => c.key === "wheat")!;
        $("buy-day-prose").innerHTML = para(`At the support price, one day’s farm wage would buy about <b>${wh.b.toFixed(1)} kg of wheat</b> in ${M1}, against ${wh.a.toFixed(1)} kg in ${M0}. Wages and support prices rose by similar amounts, so a day’s work buys about the same amount of grain at these prices.`);
        $("buy-day").innerHTML = cards.map(c => `<div class="fact"><span class="fact-kicker">${cap(c.name)}</span><span class="fact-big">${c.a.toFixed(1)} → ${c.b.toFixed(1)} kg</span><span class="fact-text">${M0} → ${M1}. ${rs(V.wageTo)} ÷ (₹${inr(mspOf(M1, c.key)!)} ÷ 100) = ${c.b.toFixed(1)} kg</span></div>`).join("");
    }

    // 5. MONEY OUT, MONEY IN ==========================================================================================
    {
        const e1 = exportsOf(T1.year), i1 = importsOf(T1.year), e0 = exportsOf(T0.year), i0 = importsOf(T0.year);
        const val = (row : Record<string, number | string>, k : string) => Number(row[k] ?? 0);
        const exItems = FARM_EXPORTS.map(it => ({ ...it, v1 : val(e1, it.key), v0 : val(e0, it.key) })).sort((a, b) => b.v1 - a.v1);
        const imItems = FARM_IMPORTS.map(it => ({ ...it, v1 : val(i1, it.key), v0 : val(i0, it.key) })).sort((a, b) => b.v1 - a.v1);
        const more = T1.farmExports >= T1.farmImports;
        $("trade-title").textContent = more ? `India earns more from selling farm goods abroad than it spends buying them` : `India spends more buying farm goods from abroad than it earns selling them`;
        $("trade-prose").innerHTML = para(`In ${T1.year}, India sold farm goods worth <b>${usd(T1.farmExports)}</b> abroad: that is money coming in. It bought farm goods worth <b>${usd(T1.farmImports)}</b> from abroad: money going out. Both have grown since ${T0.year}, when sales were ${usd(T0.farmExports)} and purchases ${usd(T0.farmImports)}.`)
            + para(`The biggest earner is ${TRADE_SHORT[exItems[0].key].toLowerCase()}, at ${usd(exItems[0].v1)}, followed by ${TRADE_SHORT[exItems[1].key].toLowerCase()} (${usd(exItems[1].v1)}). The biggest purchase is ${TRADE_SHORT[imItems[0].key].toLowerCase()}, at ${usd(imItems[0].v1)}${imItems[0].key === "oil" && imItems[0].v1 > val(e1, "rice") ? `: more than India earned from selling rice` : ""}.`);
        $("trade-provisional").textContent = TRADE_PROVISIONAL ? `Figures for ${TRADE_PROVISIONAL} are provisional: DBIE may revise them.` : "";
        $("trade-note").textContent = `DBIE, Handbook of Statistics: exports and imports of major commodities in US dollars (annexure A11 and A12). Farm goods are the items DBIE lists under agriculture; fertiliser is shown on its own.`;
        $("ex-title").textContent = `What India sold abroad, ${T1.year}`;
        $("im-title").textContent = `What India bought from abroad, ${T1.year}`;
        const bars = (items : typeof exItems) => { const m = Math.max(...items.map(i => i.v1)); return items.map(i => `<div class="st-row"><span class="st-name">${TRADE_SHORT[i.key]}</span><span class="st-bar"><i style="width:${(100 * i.v1 / m).toFixed(1)}%"></i></span><span class="st-val">${bn(i.v1)}</span></div>`).join(""); };
        $("ex-bars").innerHTML = bars(exItems); $("im-bars").innerHTML = bars(imItems);
        const fert = fertOf(T1.year);
        $("fert-fact").innerHTML = fert ? `<span class="fact-kicker">Also bought: fertiliser</span><span class="fact-big">${usd(fert)}</span><span class="fact-text">Fertiliser is listed separately because it is used to grow crops, not eaten. In ${T0.year} it cost ${usd(fertOf(T0.year) ?? 0)}.</span>` : "";
        const tr = (items : typeof exItems, side : string) => items.map(i => [ `${side}: ${TRADE_SHORT[i.key]}`, bn(i.v0), bn(i.v1), i.v0 ? x2(i.v1 / i.v0) : "—" ]);
        $("trade-table").innerHTML = tableHtml([ "Item (US$ billion)", T0.year, T1.year, "How many times" ], [
            [ "Sold abroad: all farm goods", bn(T0.farmExports), bn(T1.farmExports), x2(T1.farmExports / T0.farmExports) ], ...tr(exItems, "Sold"),
            [ "Bought from abroad: all farm goods", bn(T0.farmImports), bn(T1.farmImports), x2(T1.farmImports / T0.farmImports) ], ...tr(imItems, "Bought"),
            ...(fert ? [ [ "Bought: fertiliser", bn(fertOf(T0.year) ?? 0), bn(fert), x2(fert / (fertOf(T0.year) ?? fert)) ] ] : []),
        ]);
        const first = LONG_TRADE[0], y90 = LONG_TRADE.find(t => t.year === "1990-91");
        $("long-prose").innerHTML = para(`DBIE’s figures for rice sold, and cooking oil and pulses bought, go back to ${first.year}.${y90 ? ` In ${y90.year}, India sold rice worth ${usd(y90.rice!)} and bought cooking oil worth ${usd(y90.oil!)}.` : ""}`)
            + para(`Since ${HEADLINE.oilAheadSince}, cooking oil bought from abroad has cost more than rice sold abroad in every year. In ${HEADLINE.tradeYear}, India sold rice worth ${usd(HEADLINE.riceExports)} and bought cooking oil worth ${usd(HEADLINE.oilImports)}.`);
        $("long-clarify").textContent = "Before 2009-10, DBIE lists cooking oil as “edible oils”; from 2009-10, as “vegetable oil”. The two are close but not exactly the same.";
    }
    const drawTrade = () => lineChart("trade-box", TRADE_YEARS.map(t => t.year), [
        { name : "Sold", colour : "var(--money-in)", values : TRADE_YEARS.map(t => t.farmExports / 1000) },
        { name : "Bought", colour : "var(--money-out)", values : TRADE_YEARS.map(t => t.farmImports / 1000) },
    ], v => `$${v.toFixed(v >= 10 || v === 0 ? 0 : 1)}bn`, `Farm goods sold abroad and bought from abroad, ${T0.year} to ${T1.year}, US$ billion`);
    const drawLong = () => lineChart("long-box", LONG_TRADE.map(t => t.year), [
        { name : "Rice", colour : "var(--rice)", values : LONG_TRADE.map(t => t.rice == null ? null : t.rice / 1000) },
        { name : "Oil", colour : "var(--oil)", values : LONG_TRADE.map(t => t.oil == null ? null : t.oil / 1000) },
        { name : "Pulses", colour : "var(--pulses)", values : LONG_TRADE.map(t => t.pulses == null ? null : t.pulses / 1000) },
    ], v => `$${v.toFixed(v >= 10 || v === 0 ? 0 : 1)}bn`, `Rice sold abroad against cooking oil and pulses bought, ${LONG_TRADE[0].year} to ${LONG_TRADE.at(-1)!.year}, US$ billion`);

    // IN SHORT, THE CLOSING LINE ======================================================================================
    $("so-grid").innerHTML = [
        [ "Grows", `${fgTimes.toFixed(1)} times the grain from ${landTimes.toFixed(1)} times the land`, `Between ${L0.year} and ${L1.year}, each hectare came to give about ${yieldTimes.toFixed(1)} times as much grain. Wheat and rice grew fastest; pulses and oilseeds more slowly. ${shiftOf("foodgrains").rows[0].name} grows the most grain, ${sh(shiftOf("foodgrains").rows[0].nowShare)} of India’s in ${STATE_NOW}.` ],
        [ "Buys", `About ${Math.round(PROC_SHARE.rice)}% of the rice and ${Math.round(PROC_SHARE.wheat)}% of the wheat`, `The government announces support prices for ${MSP_CROPS.length} crops; DBIE shows it buying rice and wheat. From ${M0} to ${M1}, ${crossedCosts.length} of the ${crops.length} support prices rose more than a farm family’s everyday costs (${x2(V.costs)}).` ],
        [ "Trades", `${usd(T1.farmExports)} sold, ${usd(T1.farmImports)} bought`, `In ${T1.year}, India’s biggest farm sale abroad was rice, and its biggest farm purchase was cooking oil, at ${usd(HEADLINE.oilImports)}. It also bought ${usd(HEADLINE.fertiliser ?? 0)} of fertiliser.` ],
    ].map(([ k, h, p ]) => `<div><div class="so-kicker">${k}</div><h3>${h}</h3><p class="para">${p}</p></div>`).join("");
    const closing = $("closing");
    closing.innerHTML = `Since ${L0.year}, each hectare of India’s fields has come to give about ${yieldTimes.toFixed(0)} times as much grain. The government buys a large part of the rice and wheat, and India sells rice to the world, while it spends more on cooking oil from abroad than it earns from rice.`
        .split(" ").map(x => `<span>${x} </span>`).join("");
    const closingWords = [ ...closing.children ] as HTMLElement[];
    const lightClosing = () => {
        if (reduced) return;
        const b = closing.getBoundingClientRect(), vh = innerHeight;
        if (b.top > vh) { closingWords.forEach(s => { s.style.opacity = "1"; }); return; }
        const p = Math.max(0, Math.min(1, (vh * 0.95 - b.top) / (vh * 0.55)));
        closingWords.forEach((s, i) => { s.style.opacity = String(Math.max(0.2, Math.min(1, p * closingWords.length - i))); });
    };
    on("scroll", lightClosing);

    // THE ANNEXURE ====================================================================================================
    // Each table links to its page on this site (dbie.rbihub.in), relative, so dev, staging and the live site each open
    // their own: the Handbook tables open in place in the Publications menu; the wage and price series have pages.
    const PUB = (t : string) => `/publications?table=${t}`;
    const figures = (head : string[], rows : (string | number)[][]) => `<details class="table-view"><summary>The figures used</summary><div class="table-scroll"><table>${tableHtml(head, rows)}</table></div></details>`;
    const yrs = [ L0.year, L1.year, LEST.year ];
    const landRows = (k : "output" | "area" | "yield", crops : CropKey[]) => crops.map(c => [ CROP_NAMES[c], ...yrs.map(y => inr(LAND.find(l => l.year === y)![k][c])) ]);
    const landHead = [ "Crop", ...yrs.map(y => y === LEST.year ? `${y} (estimate)` : y) ];
    const FOOD : CropKey[] = [ "rice", "wheat", "coarse", "pulses", "foodgrains" ], COMM : CropKey[] = [ "oilseeds", "sugarcane" ];
    const fgS = shiftOf("foodgrains");
    const ANNEX = [
        { title : "Agricultural production: foodgrains", meta : "Handbook of Statistics on the Indian Economy, DBIE report 189. Lakh tonnes, by crop year.", link : PUB("real_sector.r189_agricultural_production_foodgrains"), data : figures(landHead, landRows("output", FOOD)) },
        { title : "Agricultural production: major commercial crops", meta : "DBIE report 166. Lakh tonnes, by crop year; oilseeds are nine oilseeds together.", link : PUB("real_sector.r166_agricultural_production_major_commercial_crops"), data : figures(landHead, landRows("output", COMM)) },
        { title : "Area under cultivation: foodgrains", meta : "DBIE report 167. Lakh hectares.", link : PUB("real_sector.r167_area_under_cultivation_foodgrains"), data : figures(landHead, landRows("area", FOOD)) },
        { title : "Area under cultivation: major commercial crops", meta : "DBIE report 190. Lakh hectares.", link : PUB("real_sector.r190_area_under_cultivation_major_commercial_crops"), data : figures(landHead, landRows("area", COMM)) },
        { title : "Yield per hectare: foodgrains", meta : "DBIE report 191. Kg a hectare.", link : PUB("real_sector.r191_yield_per_hectare_foodgrains"), data : figures(landHead, landRows("yield", FOOD)) },
        { title : "Yield per hectare: major commercial crops", meta : "DBIE report 192. Kg a hectare.", link : PUB("real_sector.r192_yield_per_hectare_major_commercial_crops"), data : figures(landHead, landRows("yield", COMM)) },
        { title : "State-wise production of foodgrains and major non-foodgrain crops", meta : `DBIE report 193. Thousand tonnes (cotton and jute in bales), ${STATE_THEN} to ${STATE_LATEST}. Shown here: each state’s share of India’s foodgrains; every crop is in the downloads below.`, link : PUB("real_sector.r193_state_wise_production_of_foodgrains_and_major_non_foodgrai"), data : figures([ "State", `${STATE_THEN} share`, `${STATE_NOW} share` ], fgS.rows.map(r => [ r.name + (r.note ? ` (${r.note})` : ""), sh(r.thenShare), sh(r.nowShare) ])) },
        { title : "Public distribution system: procurement, off-take and stocks", meta : "DBIE report 169. Rice and wheat, lakh tonnes.", link : PUB("real_sector.r169_public_distribution_system_procurement_off_take_and_stocks"), data : figures([ "Year", "Bought", "Given out", "In stock" ], [ P0, ...PROC_WORKING.map(r => PDS.find(p => p.year === r.year)!), PLAST ].filter((p, i, a) => a.indexOf(p) === i).map(p => [ p.year, inr1(p.proc), inr1(p.off), inr1(p.stock) ])) },
        { title : "Minimum support price for foodgrains", meta : "DBIE report 194. ₹ a quintal, by crop year, fair average quality.", link : PUB("real_sector.r194_minimum_support_price_for_foodgrains_according_to_crop_yea"), data : figures([ "Crop", M0, M1 ], crops.filter(c => [ "paddy", "wheat", "maize", "gram", "arhar", "moong", "urad" ].includes(c.key)).map(c => [ c.name, `₹${inr(c.from!)}`, `₹${inr(c.to!)}` ])) },
        { title : "Minimum support price for non-foodgrains", meta : "DBIE report 195. ₹ a quintal, by crop year; for sugarcane, the fair and remunerative price.", link : PUB("real_sector.r195_minimum_support_price_for_non_foodgrains_according_to_crop"), data : figures([ "Crop", M0, M1 ], crops.filter(c => ![ "paddy", "wheat", "maize", "gram", "arhar", "moong", "urad" ].includes(c.key)).map(c => [ c.name, `₹${inr(c.from!)}`, `₹${inr(c.to!)}` ])) },
        { title : "Exports of major commodities", meta : `DBIE report 207. US$ million; DBIE’s current list of items from ${T0.year}, its earlier list from 1987-88.${TRADE_PROVISIONAL ? ` ${TRADE_PROVISIONAL} is provisional.` : ""}`, link : PUB("external_sector.r207_exports_of_major_commodities_us_dollar"), data : figures([ "Item", T0.year, T1.year ], FARM_EXPORTS.map(it => [ TRADE_SHORT[it.key], inr(Number(exportsOf(T0.year)[it.key])), inr(Number(exportsOf(T1.year)[it.key])) ])) },
        { title : "Imports of major commodities", meta : `DBIE report 297. US$ million, as for exports.`, link : PUB("external_sector.r297_imports_of_major_commodities_us_dollar"), data : figures([ "Item", T0.year, T1.year ], [ ...FARM_IMPORTS.map(it => [ TRADE_SHORT[it.key], inr(Number(importsOf(T0.year)[it.key])), inr(Number(importsOf(T1.year)[it.key])) ]), [ "Fertiliser", inr(fertOf(T0.year) ?? 0), inr(fertOf(T1.year) ?? 0) ] ]) },
        { title : "Average daily wage rates in rural India for men (WAGE_RATES_RN)", meta : "DBIE data query: Real Sector, Prices & Wages, Wage Rates. General farm labourer, all-India, monthly, averaged over each financial year. The same figures as in “The women who stayed”.", link : "/tables/wage-rates", data : figures([ "Financial year", "₹ a day" ], Object.entries(FARM_WAGE).map(([ y, v ]) => [ y, rs(v) ])) },
        { title : "Consumer price index for agricultural labourers (CPI-AL)", meta : "DBIE data query: Real Sector, Prices & Wages. General index, base 1986-87, monthly, averaged over each financial year. The same figures as in “The women who stayed”.", link : "/tables/cpi-agricultural-labourer", data : figures([ "Financial year", "Index" ], COSTS.map(c => [ c.year, inr1(c.index) ])) },
    ];
    $("annex-list").innerHTML = ANNEX.map((a, i) => `<div class="annex-item"><h3 class="annex-title">A${i + 1}. ${a.title}</h3><div class="annex-meta">${a.meta}</div><div class="annex-meta"><a href="${a.link}">See the full table ↗</a></div>${a.data}</div>`).join("");
    const CSVS = [ [ "production-area-yield.csv", "Production, area and yield, every year" ], [ "state-crops-then-and-now.csv", "Every state and crop, then and now" ], [ "procurement-offtake-stocks.csv", "Rice and wheat bought, given out and in stock" ], [ "minimum-support-prices.csv", "Support prices for all 15 crops" ], [ "farm-trade-usd.csv", "Farm trade by item" ] ];
    $("downloads").innerHTML = `<b>Download the full series:</b> ${CSVS.map(([ f, t ]) => `<a href="/stories/from-field-to-thali/${f}" download>${t}</a>`).join(" · ")}`;

    // THE CHARTS: drawn now, and again when the width changes ========================================================
    const drawCharts = () => { drawGrow(); drawPds(); drawTrade(); drawLong(); };
    drawCharts();
    let rz = 0, lastW = innerWidth;
    on("resize", () => {
        cancelAnimationFrame(rz);
        rz = requestAnimationFrame(() => { if (innerWidth !== lastW) { lastW = innerWidth; drawCharts(); } });
    });
    cleanups.push(() => cancelAnimationFrame(rz));

    return () => cleanups.forEach(fn => fn());
};
