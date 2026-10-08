"use client";

// Days of work, one row per good: ten day-squares for what the good took of a labourer's pay in the first year of the
// wage window, filled to what it took in the last. A good that takes fewer days leaves some of its ten squares empty;
// one that takes more fills all ten and runs on in the dearer colour. Each item's inWork is its wholesale price rise
// over the window divided by the wage rise, so the figure is ten times that.

// REACT CORE ==========================================================================================================
import type { CSSProperties } from "react";

// ANIMATION ===========================================================================================================
import { motion, type Variants } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE, Figure } from "./chartKit";
import { COUNTS, HEADLINE, YARDSTICK, itemOfFollowed } from "./data";
import { GLYPH_OF, Glyph } from "./glyphs";

// STYLES ==============================================================================================================
import "./days.css";

// The goods the chapter shows, by the story's names for them.
export const DAYS_NAMES = [
    "Anti-cancer drugs", "Solar power systems", "Blankets", "Colour TVs", "Cement", "Petrol", "Milk", "Eggs", "Rice", "Wheat",
    "Coconuts", "Tomatoes", "Silver", "Kerosene", "Jasmine",
];

const SLOTS = 10;
const FROM = HEADLINE.wageWindow.from, TO = HEADLINE.wageWindow.to;
const WAGE_RISE = COUNTS.inWork.wageRise;

// The days a good takes now for ten then, to one decimal as the row prints it ("29.0" for jasmine's 2.905). SplitBar
// reads its multiples off this figure, so the two figures agree.
export const daysOf = (inWork : number) => +(SLOTS * inWork).toFixed(1);

interface DayRow {
    name       : string;
    inWork     : number;
    days       : number;            // daysOf(inWork): the figure printed and the squares drawn
    priceRise  : number | null;
}

// A good's row, or null when the good has no days figure.
const rowOf = (name : string) : DayRow | null => {
    const it = itemOfFollowed(name);
    if (it.inWork === null) return null;
    return {
        name,
        inWork    : it.inWork,
        days      : daysOf(it.inWork),
        priceRise : it.fyA && it.fyB ? it.fyB / it.fyA : null,
    };
};

// The squares of one row: the ten slots, each filled to its share, then any squares past ten.
const squaresOf = (days : number) => {
    const slots = Array.from({ length : SLOTS }, (_, i) => Math.max(0, Math.min(1, days - i)));
    const over = Math.max(0, days - SLOTS);
    const extra = Array.from({ length : Math.ceil(over - 1e-9) }, (_, i) => Math.min(1, over - i));
    return { slots, extra };
};

// The strip's width in squares, its gaps counted at a third of a square: what the stylesheet divides the free width by.
const unitsOf = (rows : DayRow[]) => {
    const most = Math.max(SLOTS, ...rows.map(r => SLOTS + squaresOf(r.days).extra.length));
    return most + (most - 2) / 3;
};

// Each square fills from the left, 25ms after the one before it, each row 60ms after the row above.
const fill : Variants = {
    hidden : { scaleX : 0 },
    shown  : ({ to, delay } : { to : number; delay : number }) => ({ scaleX : to, transition : { duration : 0.3, ease : EASE, delay } }),
};

const Strip = ({ days, row } : { days : number; row : number }) => {
    const { slots, extra } = squaresOf(days);
    const delay = (i : number) => row * 0.06 + i * 0.025;
    return (
        <span className="dy-strip" aria-hidden="true">
            {slots.map((f, i) => (
                <span key={i} className="dy-sq is-slot">
                    {f > 0 && <motion.span className="dy-fill" variants={fill} custom={{ to : f, delay : delay(i) }} />}
                </span>
            ))}
            {extra.map((f, i) => (
                <span
                    key={`x${i}`} className={`dy-sq is-extra ${i === 0 ? "is-first-extra" : ""}`}
                    style={f < 1 ? { "--dy-part" : f } as CSSProperties : undefined}
                >
                    <motion.span className="dy-fill" variants={fill} custom={{ to : 1, delay : delay(SLOTS + i) }} />
                </span>
            ))}
        </span>
    );
};

export const DaysRows = ({ names } : { names : string[] }) => {
    const rows = names.map(rowOf).filter((r) : r is DayRow => r !== null).sort((a, b) => a.inWork - b.inWork);
    const wageRisePct = Math.round(100 * (WAGE_RISE - 1));

    return (
        <Figure
            className="dy-figure"
            title={`If a good took ten days of a labourer’s pay in ${FROM}, this is what it took in ${TO}`}
            table={{
                head    : [ "Good", "Price rise", "Wage rise", "Days" ],
                numeric : [ false, true, true, true ],
                rows    : rows.map(r => [ r.name, r.priceRise === null ? "–" : `${r.priceRise.toFixed(2)}×`, `${WAGE_RISE.toFixed(2)}×`, r.days.toFixed(1) ]),
            }}
            note={`A non-agricultural labourer’s day, which includes porters and loaders, paid ₹${YARDSTICK.nonFarm.from.toFixed(0)} in ${FROM}
                and ₹${YARDSTICK.nonFarm.to.toFixed(0)} in ${TO}, a rise of ${wageRisePct}%. Each row divides the good’s wholesale price rise
                over the same years by that. The index gives no price in days, so the ten-day start is an assumption that every row
                shares. Labour Bureau, rural wages, men.`.replace(/\s+/g, " ")}
        >
            <div className="dy-frame">
                <motion.div
                    className="dy-rows" style={{ "--dy-units" : unitsOf(rows) } as CSSProperties}
                    initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.3 }}
                >
                    {rows.map((r, i) => (
                        <div key={r.name} className={`dy-row ${r.days > SLOTS ? "is-more" : ""}`}>
                            <span className="dy-label">
                                {GLYPH_OF[r.name] ? <Glyph name={GLYPH_OF[r.name]} size={20} /> : <span className="dy-no-glyph" />}
                                <span className="dy-name">{r.name}</span>
                            </span>
                            <Strip days={r.days} row={i} />
                            <span className="dy-days">{`${r.days.toFixed(1)} days`}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </Figure>
    );
};
