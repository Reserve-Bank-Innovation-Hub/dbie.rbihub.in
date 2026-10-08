"use client";

// The goods split in two by days of work: those that take fewer days of a labourer's pay than at the start of the wage
// window, and those that take more, one bar in proportion, with every one of the second named beneath it.

// ANIMATION ===========================================================================================================
import { motion } from "framer-motion";

// LOCAL ===============================================================================================================
import { EASE, Figure } from "./chartKit";
import { COUNTS, HEADLINE, IN_WORK, inr, list } from "./data";
import { daysOf } from "./DaysRows";

// STYLES ==============================================================================================================
import "./days.css";

const FROM = HEADLINE.wageWindow.from;

// DBIE labels that the plain rule below reads badly: a specification that is the point ("dry"), a comma that would
// break the list, a capital the lower-casing loses, or a spelling nobody uses.
const LABEL_FIX : Record<string, string> = {
    "Ginger(Dry)"                                  : "dry ginger",
    "Chillies(Dry)"                                : "dry chillies",
    "Fungicide, Liquid"                            : "liquid fungicide",
    "Flour of cereals other than rice, wheat etc." : "flour of other cereals",
    "Bread, buns & croissant"                      : "bread and buns",
    "Vaccine for hepatitis B"                      : "hepatitis B vaccine",
    "Non Mechanical Toys"                          : "non-mechanical toys",
    "Gram Powder (Besan)"                          : "besan",
    "Cummin"                                       : "cumin",
};

// A DBIE label as the sentence names it: lower case, without bracketed specifications, "&" as "and".
const plain = (label : string) => LABEL_FIX[label] ?? label
    .toLowerCase()
    .replace(/\s*[([][^)\]]*[)\]]/g, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s+/g, " ")
    .trim();

// The goods that take more days, the most first, each with how many times the days it takes. The multiple is read off
// the days figure the rows print (kerosene's 17.5 days is 1.8×), so the two figures never disagree in the last digit.
const DEARER = IN_WORK.filter(i => i.inWork > 1).sort((a, b) => b.inWork - a.inWork);
const times = (inWork : number) => `${(Math.round(daysOf(inWork)) / 10).toFixed(1)}×`;

export const SplitBar = () => {
    const { items, cheaper, dearer } = COUNTS.inWork;
    const ruralPct = Math.round(100 * (COUNTS.inWork.ruralCpiRise - 1));

    return (
        <Figure
            className="dy-figure"
            title={`${inr(cheaper)} of ${inr(items)} goods cost fewer days of a labourer’s pay than in ${FROM}`}
            note={`Against the prices rural labourers themselves pay, which rose ${ruralPct}% over the same years, the day buys about what it did.`}
        >
            <div className="dy-split">
                <div className="dy-split-labels" aria-hidden="true">
                    <span className="dy-split-left">{`${inr(cheaper)} goods take fewer days of work than in ${FROM}`}</span>
                    <span className="dy-split-right">{`${inr(dearer)} take more`}</span>
                </div>
                <motion.div
                    className="dy-split-bar" role="img"
                    aria-label={`Of ${inr(items)} goods, ${inr(cheaper)} take fewer days of a labourer’s pay than in ${FROM} and ${inr(dearer)} take more`}
                    initial={{ scaleX : 0 }} whileInView={{ scaleX : 1 }} viewport={{ once : true, amount : 0.3 }}
                    transition={{ duration : 0.6, ease : EASE }}
                >
                    <span className="dy-split-part is-cheaper" style={{ flexGrow : cheaper }} />
                    <span className="dy-split-part is-dearer" style={{ flexGrow : dearer }} />
                </motion.div>
                <p className="dy-split-list">
                    {`The ${inr(DEARER.length)} are ${list(DEARER.map(i => `${plain(i.label)} (${times(i.inWork)})`))}.`}
                </p>
            </div>
        </Figure>
    );
};
