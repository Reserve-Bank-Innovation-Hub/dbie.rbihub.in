// THE STORY BELOW THE OPENING =========================================================================================
// Mounts everything after the 3D opening into StoryBody's skeleton: the plots scrolly (100 rural men and 100 rural women
// who work, standing in their field, the factory yard or the shop front for each survey), the chapters' words and charts,
// In short, the closing line and the annexure. Every figure comes from data.ts, which reads data.gen.ts. The
// drawing is plain SVG strings, as in the other stories' hand-built figures; mountStoryBody returns its own clean-up.

import {
    CPI_AL, DIP, FIRST, I_DIP, I_TOP, JOBS, LAST, RURAL,
    TOP, URBAN_WOMEN_FARM, W0, W1, WAGES, WAGE_RANGE, WIDEST, hundred, pc, prem, pts, realGrowth, shortOf,
} from "./data";
import type { JobKey, Survey } from "./data";
import type { PlotsScene } from "./plotsScene";

const NS = "http://www.w3.org/2000/svg";
const FIGS = 100;
const MONTH_NAMES = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const monthOf = (ym : string) => `${MONTH_NAMES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const inr = (v : number) => v.toLocaleString("en-IN");
const JOB_COLOURS : Record<JobKey, string> = { farm : "var(--agri)", nonfarm : "var(--serv)", constr : "#7f74b3", carp : "var(--ind)", mason : "#2d2366" };
const WAGE_JOBS = JOBS.map(([ k, name ]) => [ k, name, JOB_COLOURS[k] ] as const);

// THE FIGURES AND THE SCENERY, as SVG symbols ==========================================================================
const DEFS = `
<defs>
    <g id="fig-man">
        <ellipse cx="0" cy="0" rx="7" ry="1.7" fill="#000" opacity="0.13"></ellipse>
        <path d="M-4.6 -10 L4.6 -10 L5.6 0 L1.4 0 L0 -5 L-1.4 0 L-5.6 0 Z" fill="#f7f3ea" stroke="#d6cdbb" stroke-width="0.6"></path>
        <path d="M-6 -18.8 Q-6 -21 -3.8 -21 L3.8 -21 Q6 -21 6 -18.8 L6.6 -9.4 L-6.6 -9.4 Z" fill="var(--men)"></path>
        <path d="M-3.6 -21 L5.6 -12" stroke="#f3ead7" stroke-width="1.6" stroke-linecap="round"></path>
        <circle cx="0" cy="-28.2" r="7.9" fill="#c98a55" stroke="#a96f3f" stroke-width="0.6"></circle>
        <circle cx="-4.9" cy="-26" r="1.3" fill="#e2836b" opacity="0.45"></circle><circle cx="4.9" cy="-26" r="1.3" fill="#e2836b" opacity="0.45"></circle>
        <ellipse cx="-2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse><ellipse cx="2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse>
        <path d="M-3.8 -24.9 Q-1.9 -26.4 0 -25.2 Q1.9 -26.4 3.8 -24.9 Q1.9 -24.1 0 -24.6 Q-1.9 -24.1 -3.8 -24.9 Z" fill="#2b1d14"></path>
        <path d="M-1.5 -23.2 Q0 -22.3 1.5 -23.2" fill="none" stroke="#7a3f2a" stroke-width="0.6" stroke-linecap="round"></path>
        <path d="M-8.6 -29.6 Q-9.3 -38.9 0 -39.4 Q9.3 -38.9 8.6 -29.6 Q4.2 -32.9 0 -32.7 Q-4.2 -32.9 -8.6 -29.6 Z" fill="#f2a93b"></path>
        <path d="M-7.8 -33.2 Q0 -37.4 7.8 -33.2 M-6.2 -36.6 Q1 -38.9 7.6 -35.2" fill="none" stroke="#d1861c" stroke-width="0.8" stroke-linecap="round"></path>
    </g>
    <g id="fig-woman">
        <ellipse cx="0" cy="0" rx="7.4" ry="1.7" fill="#000" opacity="0.13"></ellipse>
        <path d="M-5.6 -11 L5.6 -11 L7.4 0 L-7.4 0 Z" fill="var(--women)"></path>
        <rect x="-7.2" y="-1.7" width="14.4" height="1.7" fill="#f2c443"></rect>
        <path d="M-5.6 -18.8 Q-5.6 -21 -3.8 -21 L3.8 -21 Q5.6 -21 5.6 -18.8 L5.8 -10.4 L-5.8 -10.4 Z" fill="var(--women)"></path>
        <path d="M-5.6 -20.4 L5.8 -12 L5.8 -10.4 L3 -10.4 L-5.7 -17.5 Z" fill="#b84a22"></path>
        <circle cx="0" cy="-27.8" r="7.6" fill="#c98a55" stroke="#a96f3f" stroke-width="0.6"></circle>
        <path d="M-6.9 -27.4 Q-7.1 -34.8 0 -35.1 Q7.1 -34.8 6.9 -27.4 Q5 -31.9 0 -32 Q-5 -31.9 -6.9 -27.4 Z" fill="#2b1d14"></path>
        <path d="M-8.7 -24.6 Q-9.5 -37.9 0 -38.5 Q9.5 -37.9 8.7 -24.6 Q8.4 -31 7.2 -30.4 Q6.2 -34.5 0 -34.7 Q-6.2 -34.5 -7.2 -30.4 Q-8.4 -31 -8.7 -24.6 Z" fill="#b84a22"></path>
        <circle cx="0" cy="-30.4" r="0.95" fill="#d4202c"></circle>
        <circle cx="-4.7" cy="-25.8" r="1.25" fill="#e2836b" opacity="0.45"></circle><circle cx="4.7" cy="-25.8" r="1.25" fill="#e2836b" opacity="0.45"></circle>
        <ellipse cx="-2.6" cy="-28.2" rx="0.85" ry="1.05" fill="#2b1d14"></ellipse><ellipse cx="2.6" cy="-28.2" rx="0.85" ry="1.05" fill="#2b1d14"></ellipse>
        <path d="M-1.8 -24.4 Q0 -23 1.8 -24.4" fill="none" stroke="#7a3f2a" stroke-width="0.7" stroke-linecap="round"></path>
        <circle cx="-7.3" cy="-25.6" r="0.8" fill="#f2c443"></circle><circle cx="7.3" cy="-25.6" r="0.8" fill="#f2c443"></circle>
    </g>
    <g id="fig-man-modern">
        <ellipse cx="0" cy="0" rx="7" ry="1.7" fill="#000" opacity="0.13"></ellipse>
        <path d="M-4.6 -10 L4.6 -10 L5.6 0 L1.4 0 L0 -5 L-1.4 0 L-5.6 0 Z" fill="#f7f3ea" stroke="#d6cdbb" stroke-width="0.6"></path>
        <path d="M-6 -18.8 Q-6 -21 -3.8 -21 L3.8 -21 Q6 -21 6 -18.8 L6.6 -9.4 L-6.6 -9.4 Z" fill="var(--men)"></path>
        <path d="M-3.6 -21 L5.6 -12" stroke="#f3ead7" stroke-width="1.6" stroke-linecap="round"></path>
        <circle cx="0" cy="-28.2" r="7.9" fill="#c98a55" stroke="#a96f3f" stroke-width="0.6"></circle>
        <circle cx="-4.9" cy="-26" r="1.3" fill="#e2836b" opacity="0.45"></circle><circle cx="4.9" cy="-26" r="1.3" fill="#e2836b" opacity="0.45"></circle>
        <ellipse cx="-2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse><ellipse cx="2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse>
        <path d="M-3.8 -24.9 Q-1.9 -26.4 0 -25.2 Q1.9 -26.4 3.8 -24.9 Q1.9 -24.1 0 -24.6 Q-1.9 -24.1 -3.8 -24.9 Z" fill="#2b1d14"></path>
        <path d="M-1.5 -23.2 Q0 -22.3 1.5 -23.2" fill="none" stroke="#7a3f2a" stroke-width="0.6" stroke-linecap="round"></path>
        <path d="M-14 -31.4 Q-15.6 -34.8 -12.4 -34.2 Q0 -31.2 12.4 -34.2 Q15.6 -34.8 14 -31.4 Q0 -27.4 -14 -31.4 Z" fill="#c8954f"></path>
        <path d="M-7.4 -33.2 Q-8.2 -40.6 -4.2 -42 Q0 -39.8 4.2 -42 Q8.2 -40.6 7.4 -33.2 Q0 -31.6 -7.4 -33.2 Z" fill="#d8a95f"></path>
        <path d="M-7.4 -34.6 Q0 -33 7.4 -34.6" fill="none" stroke="#7a4a22" stroke-width="1.4"></path>
    </g>
    <g id="fig-worker">
        <ellipse cx="0" cy="0" rx="7" ry="1.7" fill="#000" opacity="0.13"></ellipse>
        <path d="M-4.8 -10 L4.8 -10 L4.6 -0.6 L1.1 -0.6 L0 -6 L-1.1 -0.6 L-4.6 -0.6 Z" fill="#59626c"></path>
        <path d="M-5.6 -1 h4.8 v1 h-4.8 Z M0.8 -1 h4.8 v1 h-4.8 Z" fill="#3e2c1e"></path>
        <path d="M-6 -18.8 Q-6 -21 -3.8 -21 L3.8 -21 Q6 -21 6 -18.8 L6.4 -9.4 L-6.4 -9.4 Z" fill="var(--men)"></path>
        <path d="M-6.2 -19.6 L-2.2 -21 L-1.6 -9.4 L-6.4 -9.4 Z M6.2 -19.6 L2.2 -21 L1.6 -9.4 L6.4 -9.4 Z" fill="#f28c28"></path>
        <path d="M-6.3 -13.4 H-1.8 M1.8 -13.4 H6.3" stroke="#f4f1e6" stroke-width="1.3"></path>
        <circle cx="0" cy="-28.2" r="7.9" fill="#c98a55" stroke="#a96f3f" stroke-width="0.6"></circle>
        <ellipse cx="-2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse><ellipse cx="2.8" cy="-28.6" rx="0.9" ry="1.1" fill="#2b1d14"></ellipse>
        <path d="M-3.8 -24.9 Q-1.9 -26.4 0 -25.2 Q1.9 -26.4 3.8 -24.9 Q1.9 -24.1 0 -24.6 Q-1.9 -24.1 -3.8 -24.9 Z" fill="#2b1d14"></path>
        <path d="M-8.6 -31 Q-8.6 -38.8 0 -39 Q8.6 -38.8 8.6 -31 Z" fill="#f2c21b"></path>
        <path d="M-10.4 -31 H10.4 Q10.4 -29.4 8.6 -29.4 H-8.6 Q-10.4 -29.4 -10.4 -31 Z" fill="#e0ae0c"></path>
        <path d="M0 -39 V-31" stroke="#e0ae0c" stroke-width="1.4"></path>
    </g>
    <g id="bag"><path d="M-5 0 Q-5.6 -3 -4.6 -3.6 H4.6 Q5.6 -3 5 0 Z" fill="#c9c7c0" stroke="#a9a69e" stroke-width="0.4"></path><rect x="-1.1" y="-3.6" width="2.2" height="3.6" fill="#2f6fbf"></rect></g>
    <g id="t-palm">
        <path d="M0 0 Q7 -42 -2 -82" fill="none" stroke="#8a6a44" stroke-width="4.2" stroke-linecap="round"></path>
        <path d="M0 0 Q7 -42 -2 -82" fill="none" stroke="#6b5132" stroke-width="4.2" stroke-dasharray="1.4 5"></path>
        <g class="crown">
            <path d="M-2 -82 Q-22 -95 -40 -76 M-2 -82 Q-18 -104 -34 -104 M-2 -82 Q4 -106 20 -108 M-2 -82 Q18 -96 38 -80 M-2 -82 Q16 -86 30 -66 M-2 -82 Q-14 -84 -26 -64" fill="none" stroke="#3d8a3a" stroke-width="4" stroke-linecap="round"></path>
            <path d="M-2 -82 Q-20 -92 -34 -80 M-2 -82 Q10 -100 30 -96 M-2 -82 Q-8 -100 -22 -104" fill="none" stroke="#5aa64a" stroke-width="2.4" stroke-linecap="round"></path>
            <circle cx="-4" cy="-78" r="2.8" fill="#7a5a2b"></circle><circle cx="1" cy="-77" r="2.8" fill="#6b4e24"></circle><circle cx="-1.5" cy="-74" r="2.6" fill="#7a5a2b"></circle>
        </g>
    </g>
    <g id="t-mango">
        <path d="M-3.4 0 L-2 -30 Q-8 -38 -12 -42 M-2 -30 L2 -30 Q8 -38 12 -44 M2 -30 L3.4 0 Z" fill="#7a5634" stroke="#7a5634" stroke-width="2" stroke-linejoin="round"></path>
        <circle cx="-14" cy="-46" r="15" fill="#3e7f3a"></circle><circle cx="14" cy="-48" r="16" fill="#3e7f3a"></circle>
        <circle cx="0" cy="-60" r="19" fill="#4b9143"></circle><circle cx="-8" cy="-52" r="13" fill="#56a04c"></circle><circle cx="10" cy="-58" r="11" fill="#5fa84f"></circle>
        <g fill="#f2b33d"><ellipse cx="-12" cy="-40" rx="2.4" ry="3.2"></ellipse><ellipse cx="9" cy="-42" rx="2.4" ry="3.2"></ellipse><ellipse cx="-2" cy="-50" rx="2.4" ry="3.2"></ellipse><ellipse cx="16" cy="-54" rx="2.4" ry="3.2"></ellipse><ellipse cx="-16" cy="-56" rx="2.4" ry="3.2"></ellipse></g>
    </g>
    <g id="t-chilli">
        <circle cx="-6" cy="-7" r="7" fill="#4f9a3c"></circle><circle cx="6" cy="-8" r="7.5" fill="#438d36"></circle><circle cx="0" cy="-13" r="7" fill="#5aa64a"></circle>
        <g fill="none" stroke="#d6342b" stroke-width="2.2" stroke-linecap="round"><path d="M-7 -9 q-1 4 1 7"></path><path d="M3 -12 q2 4 0 7"></path><path d="M8 -6 q1 4 -1 6"></path><path d="M-2 -15 q-2 3 -1 6"></path></g>
    </g>
    <g id="bull">
        <path d="M-11 -11 V0 M-6.5 -10 V0 M6 -10 V0 M10 -11 V0" stroke="#d6cdbb" stroke-width="2.6" stroke-linecap="round"></path>
        <path d="M-11 -0.6 h1.6 M-6.5 -0.6 h1.6 M6 -0.6 h1.6 M10 -0.6 h1.6" stroke="#3a2f26" stroke-width="1.4" stroke-linecap="round"></path>
        <path d="M-13 -16 Q-17 -11 -15.5 -5" fill="none" stroke="#c9bfae" stroke-width="1.1" stroke-linecap="round"></path>
        <ellipse cx="-1" cy="-15.5" rx="12.5" ry="6.2" fill="#f0eadf" stroke="#c9bfae" stroke-width="0.8"></ellipse>
        <path d="M3 -20.5 Q7 -28 11 -20 Z" fill="#f0eadf" stroke="#c9bfae" stroke-width="0.8"></path>
        <path d="M9.5 -13.5 Q12.5 -7.5 9.5 -5.5 Q7.5 -9 7.5 -13 Z" fill="#e2dacb"></path>
        <path d="M10 -20 L18 -19.5 L20.2 -14.5 L17.5 -12.5 L11 -14 Z" fill="#f0eadf" stroke="#c9bfae" stroke-width="0.8" stroke-linejoin="round"></path>
        <path d="M18.6 -15.4 L20.4 -14.4 L18.4 -12.8 Z" fill="#8a7d70"></path>
        <path d="M13 -20 Q11.6 -25.5 14.6 -27 M16 -19.8 Q17 -25 20 -26" fill="none" stroke="#3a2f26" stroke-width="1.4" stroke-linecap="round"></path>
        <path d="M12 -18.6 L8.6 -17.4" stroke="#c9bfae" stroke-width="1.8" stroke-linecap="round"></path>
        <circle cx="16.4" cy="-17" r="0.75" fill="#2b1d14"></circle>
    </g>
    <g id="v-plough">
        <g transform="translate(4 0) scale(0.55)"><use href="#fig-man"></use></g>
        <path d="M12 -2 L20 -1 L16 -10 Z" fill="#6b4423"></path>
        <path d="M16 -9 L52 -20" stroke="#6b4423" stroke-width="2" stroke-linecap="round"></path>
        <g transform="translate(70 3)" opacity="0.92"><use href="#bull"></use></g><g transform="translate(62 0)"><use href="#bull"></use></g>
        <path d="M52 -27 L60 -28" stroke="#6b4423" stroke-width="2.4"></path>
    </g>
    <g id="v-harvester">
        <path d="M18 -38 H74 V-12 H18 Z" fill="#3c8d3a"></path>
        <path d="M54 -52 H74 V-38 H54 Z" fill="#bfe0ef" stroke="#2f6e2d" stroke-width="2"></path>
        <path d="M22 -38 L14 -50 L10 -48 L16 -38 Z" fill="#2f6e2d"></path>
        <rect x="74" y="-24" width="30" height="16" rx="2" fill="#e3b23c"></rect>
        <g class="wheel"><circle cx="96" cy="-24" r="8" fill="none" stroke="#c99a26" stroke-width="2"></circle><path d="M88 -24 H104 M96 -32 V-16" stroke="#c99a26" stroke-width="1.6"></path></g>
        <g class="wheel"><circle cx="62" cy="-11" r="11" fill="#2f2f2f"></circle><circle cx="62" cy="-11" r="4" fill="#e3b23c"></circle></g>
        <g class="wheel"><circle cx="28" cy="-7" r="7" fill="#2f2f2f"></circle><circle cx="28" cy="-7" r="2.6" fill="#e3b23c"></circle></g>
        <path d="M74 -8 H106" stroke="#c99a26" stroke-width="1.6" stroke-dasharray="2 2"></path>
    </g>
    <g id="v-tractor">
        <path d="M40 -32 H72 Q76 -32 76 -28 V-14 H40 Z" fill="#d9362d"></path>
        <rect x="46" y="-38" width="3" height="8" fill="#555"></rect>
        <path d="M10 -26 Q26 -46 42 -26 Z" fill="#c02c24"></path>
        <rect x="26" y="-46" width="2" height="16" fill="#444"></rect><path d="M22 -47 H40" stroke="#444" stroke-width="2"></path>
        <g transform="translate(30 -27) scale(0.5)"><use href="#fig-man-modern"></use></g>
        <g class="wheel"><circle cx="26" cy="-16" r="16" fill="#2f2f2f"></circle><circle cx="26" cy="-16" r="7" fill="#e3b23c"></circle><path d="M26 -30 V-2 M12 -16 H40" stroke="#4a4a4a" stroke-width="2.4"></path></g>
        <g class="wheel"><circle cx="66" cy="-8" r="8" fill="#2f2f2f"></circle><circle cx="66" cy="-8" r="3.5" fill="#e3b23c"></circle></g>
        <circle cx="75" cy="-24" r="2" fill="#ffe28a"></circle>
    </g>
    <g id="v-seeddrill">
        <path d="M2 -20 H34 V-10 H2 Z" fill="#2f6fbf"></path>
        <path d="M5 -10 V-3 M11 -10 V-3 M17 -10 V-3 M23 -10 V-3 M29 -10 V-3" stroke="#555" stroke-width="1.2"></path>
        <g fill="#777"><circle cx="5" cy="-2" r="2.2"></circle><circle cx="11" cy="-2" r="2.2"></circle><circle cx="17" cy="-2" r="2.2"></circle><circle cx="23" cy="-2" r="2.2"></circle><circle cx="29" cy="-2" r="2.2"></circle></g>
        <path d="M34 -14 L46 -14" stroke="#444" stroke-width="2"></path>
        <g transform="translate(36 0)"><use href="#v-tractor"></use></g>
    </g>
    <g id="v-cart">
        <path d="M8 -27 L46 -27 L46 -22 L8 -22 Z" fill="#8a5a2b"></path>
        <path d="M10 -27 Q27 -44 44 -27 Z" fill="#e3c15a"></path><path d="M14 -29 Q27 -40 40 -29" fill="none" stroke="#c9a23e" stroke-width="1"></path>
        <path d="M44 -24 L74 -27" stroke="#6b4423" stroke-width="2.2" stroke-linecap="round"></path>
        <g class="wheel"><circle cx="24" cy="-11" r="11" fill="none" stroke="#6b4423" stroke-width="2.6"></circle><path d="M24 -22 V0 M13 -11 H35 M16.2 -18.8 L31.8 -3.2 M31.8 -18.8 L16.2 -3.2" stroke="#6b4423" stroke-width="1.3"></path></g>
        <g transform="translate(30 -27) scale(0.5)"><use href="#fig-woman"></use></g>
        <g transform="translate(86 3)" opacity="0.92"><use href="#bull"></use></g><g transform="translate(78 0)"><use href="#bull"></use></g>
    </g>
    <g id="bird"><path class="wing" d="M-9 1 Q-5 -6 0 0 Q5 -6 9 1" fill="none" stroke="#3f444b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></g>
    <g id="g-sprout"><path d="M0 0 V-6.2" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></path>
        <path d="M0 -3.6 C-0.6 -6 -3.4 -7.2 -5 -6.4 C-4.2 -4.4 -2.2 -3.2 0 -3.6 Z" fill="currentColor"></path>
        <path d="M0 -5.6 C0.8 -8.2 3.6 -9.6 5 -8.6 C4.2 -6.6 2.2 -5.2 0 -5.6 Z" fill="currentColor"></path></g>
    <pattern id="hazard" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="#f2c21b"></rect><rect x="4" width="4" height="8" fill="#2f2f2f"></rect></pattern>
</defs>
<g id="wws-birds"></g><g id="wws-scenery"></g><g id="wws-plots"></g><g id="wws-buildings"></g><g id="wws-figures"></g>`;

// The decoration on the stage: trees on the horizon, as fractions of the width, with their scale.
const TREES : [ number, string, number ][] = [ [ 0.015, "palm", 1.05 ], [ 0.055, "palm", 0.8 ], [ 0.11, "mango", 0.95 ], [ 0.19, "chilli", 1.1 ], [ 0.29, "palm", 0.7 ], [ 0.45, "mango", 0.7 ], [ 0.58, "chilli", 1 ], [ 0.66, "palm", 0.8 ], [ 0.8, "mango", 0.95 ], [ 0.885, "chilli", 1.1 ], [ 0.93, "palm", 1.1 ], [ 0.975, "palm", 0.85 ] ];

type Scene = "meet" | "then" | "guess" | "years" | "now" | "gap" | "sectors" | "turn" | "latest";
type Place = "agri" | "ind" | "serv";
type Sex = "m" | "w";
interface Fig { el : SVGGElement; body : SVGGElement; place : Place | null; timer : number; }
interface Rect { x : number; w : number; h : number; d : number; }
interface Geo {
    W : number; H : number; phone : boolean; horizon : number; A : { l : number; r : number; t : number; b : number }; Aw : number; Ah : number;
    gy : number; factory : Rect; shops : Rect; yards : Record<"ind" | "serv", { x0 : number; x1 : number; y0 : number; y1 : number }>;
    plotTop : number; plotBottom : number; plots : Record<Sex, { x0 : number; x1 : number }>; figScale : number;
}

const LAST_I = RURAL.length - 1;
const ROUND_OF : Record<Scene, number> = { meet : 0, then : 0, guess : 0, years : LAST_I, now : LAST_I, gap : LAST_I, sectors : LAST_I, turn : I_DIP, latest : LAST_I };

export const mountStoryBody = (root : HTMLElement) => {
    const $ = <T extends Element = HTMLElement>(id : string) => root.querySelector<T>(`#${id}`)!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups : (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(type : K, fn : (e : WindowEventMap[K]) => void) => {
        addEventListener(type, fn, { passive : true }); cleanups.push(() => removeEventListener(type, fn));
    };

    // THE STEP CARDS ==================================================================================================
    const card = (id : string, kicker : string, big : string, title : string, body : string) => {
        $(id).innerHTML = `<div class="step-kicker">${kicker}</div>${big ? `<div class="step-big">${big}</div>` : ""}<div class="step-title">${title}</div>${body}`;
    };
    const say = (s : string) => `<p class="say">${s}</p>`;
    card("card-meet", "100 men, 100 women", "", "Now think of 100 rural men and 100 rural women who work",
        say(`The farmer and the woman above are two of them. Each figure here is one. DBIE gives its figures for every 1,000 workers; here we show the same shares for 100, so every figure is 1%.`));
    card("card-then", shortOf(FIRST), `<span class="m">${pc(FIRST.m[0])}</span><span class="w">${pc(FIRST.w[0])}</span>`, "of rural working men and women were in agriculture",
        say(`Those still in the fields work in agriculture. Those by the factory work in industry, and those by the shops in services. In ${shortOf(FIRST)}, ${Math.round(FIRST.m[0] / 10)} of the 100 men and ${Math.round(FIRST.w[0] / 10)} of the 100 women worked in agriculture.`));
    $("card-guess").innerHTML = `
        <div class="step-kicker">Before the answer</div>
        <div class="step-title">Twenty-five years on, of every ten rural women who work, how many do you think work in agriculture?</div>
        <div class="guess-row" id="guess-row" role="group" aria-label="Your guess, out of ten">${Array.from({ length : 10 }, (_, k) => `<button type="button" data-v="${k + 1}" aria-label="${k + 1} out of 10">${k + 1}</button>`).join("")}</div>
        <button class="btn" id="lock" type="button" disabled>Lock in my guess ↓</button>`;
    // the survey-by-survey card: in 3D its figures follow the scroll; without WebGL it shows the latest survey
    const yearsCard = (i : number) => card("card-years", "Survey by survey", `<span class="m">${pc(RURAL[i].m[0])}</span><span class="w">${pc(RURAL[i].w[0])}</span>`,
        `of rural working men and women in agriculture, ${RURAL[i].period}`,
        say(`Keep scrolling to move through all ${RURAL.length} surveys, from ${shortOf(FIRST)} to ${shortOf(LAST)}. Watch the men walk off to the building site and the shops. Scroll back to rewind.`));
    yearsCard(LAST_I);
    const tens = (v : number, colour : string) => Array.from({ length : 10 }, (_, k) => `<i><b style="height:${Math.max(0, Math.min(1, v - k)) * 100}%;background:var(${colour})"></b></i>`).join("");
    const inTen = (v : number) => Math.round(v / 100);
    const nowCard = (guess : number | null) => card("card-now", `The answer · ${shortOf(LAST)}`, `<span class="w">${pc(LAST.w[0])}</span>`, "of rural working women are still in agriculture",
        (guess ? `<p class="verdict">${Math.abs(guess - LAST.w[0] / 100) < 0.5 ? `Your guess of ${guess} was right.` : guess < LAST.w[0] / 100 ? `Your guess of ${guess} was low.` : `Your guess of ${guess} was high.`}</p>` : "")
        + `<div class="tens"><div class="ten"><span>Women</span>${tens(LAST.w[0] / 100, "--women")}</div><div class="ten"><span>Men</span>${tens(LAST.m[0] / 100, "--men")}</div></div>`
        + say(`About ${inTen(LAST.w[0])} in ten. For rural men it is under ${Math.ceil(LAST.m[0] / 100)} in ten: ${pc(LAST.m[0])}, down from ${pc(FIRST.m[0])}. The women’s share fell by ${pts(FIRST.w[0] - LAST.w[0])}; the men’s by ${pts(FIRST.m[0] - LAST.m[0])}.`));
    nowCard(null);
    const underHalf = RURAL.find(r => r.m[0] < 500 && RURAL.slice(RURAL.indexOf(r)).every(q => q.m[0] < 500));
    card("card-gap", "The gap", `${(FIRST.w[0] - FIRST.m[0]) / 10} <small>→</small> ${(LAST.w[0] - LAST.m[0]) / 10}<small>points</small>`, "The gap between women and men on farms has nearly doubled",
        say(`In ${shortOf(FIRST)}, the women’s share in agriculture was ${pts(FIRST.w[0] - FIRST.m[0])} above the men’s. In ${shortOf(LAST)} it is ${pts(LAST.w[0] - LAST.m[0])} above.${underHalf ? ` Since ${shortOf(underHalf)}, fewer than half of rural working men have worked on farms.` : ""}`));
    card("card-sectors", "Where the men went", `<span class="m">${pc(FIRST.m[1])}</span><small>→</small><span class="m">${pc(LAST.m[1])}</span>`, `of rural working men are in industry, twice the ${shortOf(FIRST)} share`,
        say(`The factory stands for industry, which in this table includes construction along with mining, factories and utilities; the shops stand for services. Rural women in industry barely moved, from ${pc(FIRST.w[1])} to ${pc(LAST.w[1])}. Those who left the farm went into services, which rose from ${pc(FIRST.w[2])} to ${pc(LAST.w[2])}.`));
    card("card-turn", `${shortOf(DIP)} to ${shortOf(TOP)}`, `<span class="w">${pc(DIP.w[0])}</span><small>→</small><span class="w">${pc(TOP.w[0])}</span>`, "The women went back to the farm",
        say(`For five years the women’s share in agriculture rose, while the men’s kept falling, from ${pc(DIP.m[0])} to ${pc(TOP.m[0])}. By ${shortOf(WIDEST)} the gap reached ${pts(WIDEST.w[0] - WIDEST.m[0])}, the widest in the series.`));
    card("card-latest", `The latest survey · ${shortOf(LAST)}`, `<span class="w">${pc(LAST.w[0])}</span>`, "Most rural women who work are still on farms",
        say(`The calendar year ${shortOf(LAST)} brought the women’s share back down to ${pc(LAST.w[0])}, close to the ${pc(DIP.w[0])} of ${shortOf(DIP)}. Whether the turn back has ended, the next survey will show.`));

    // THE STAGE =======================================================================================================
    // Two plots, the men's and the women's, with a factory and a row of shops beyond them. Each figure is one in every
    // hundred rural workers. Between surveys the figures walk from the fields to the factory (industry) or the shops
    // (services), and back.
    const stage = $("wws-stage"), svg = $<SVGSVGElement>("wws-world");
    svg.innerHTML = DEFS;
    const figs : Record<Sex, Fig[]> = { m : [], w : [] };
    for (const sex of [ "m", "w" ] as Sex[]) for (let k = 0; k < FIGS; k++) {
        const g = document.createElementNS(NS, "g"), b = document.createElementNS(NS, "g"), u = document.createElementNS(NS, "use");
        g.setAttribute("class", "fig"); b.setAttribute("class", "body"); u.setAttribute("href", sex === "m" ? "#fig-man" : "#fig-woman");
        b.appendChild(u); g.appendChild(b); $("wws-figures").appendChild(g);
        figs[sex].push({ el : g, body : b, place : null, timer : 0 });
    }

    let geo : Geo;
    const layout = () => {
        const W = stage.clientWidth, H = stage.clientHeight, phone = W < 900;
        // the area left of the cards (above them on a phone), its horizon high up
        const A = phone ? { l : 12, r : W - 12, t : H * 0.1, b : H * 0.57 } : { l : W * 0.04, r : W - Math.min(430, W * 0.36) - W * 0.07, t : H * 0.13, b : H * 0.95 };
        const Aw = A.r - A.l, Ah = A.b - A.t;
        const gy = A.t + 0.37 * Ah;
        const factory = { x : A.l + 0.03 * Aw, w : 0.34 * Aw, h : 0.17 * Ah, d : 0.05 * Aw };
        const shops = { x : A.l + 0.56 * Aw, w : 0.36 * Aw, h : 0.12 * Ah, d : 0.05 * Aw };
        const yard = (b : Rect, y0 : number, y1 : number) => ({ x0 : b.x, x1 : b.x + b.w + b.d * 0.5, y0, y1 });
        const plotTop = A.t + 0.57 * Ah, plotBottom = A.b - (phone ? 2 : 6);
        const plots = { m : { x0 : A.l, x1 : A.l + 0.47 * Aw }, w : { x0 : A.l + 0.53 * Aw, x1 : A.r } };
        // figure height: about one and a half plot rows, so the crowd overlaps a little, as people in a field do
        const rowGap = (plotBottom - plotTop) / 10, colGap = (plots.m.x1 - plots.m.x0) / 10;
        geo = {
            W, H, phone, horizon : A.t + 0.2 * Ah, A, Aw, Ah, gy, factory, shops,
            yards : { ind : yard(factory, gy + 0.03 * Ah, gy + 0.17 * Ah), serv : yard(shops, gy + 0.03 * Ah, gy + 0.17 * Ah) },
            plotTop, plotBottom, plots, figScale : Math.min(rowGap * 1.6, colGap * 2.5) / 39,
        };
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        drawLand(); drawPlots(); drawBuildings(); drawScenery();
    };

    // The landscape behind everything: a sky, two lines of hills, and crop strips running to the horizon.
    const drawLand = () => {
        const cv = $<HTMLCanvasElement>("wws-land"), dpr = Math.min(2, devicePixelRatio || 1), { W, H, horizon : y0 } = geo;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        const c = cv.getContext("2d"); if (!c) return;
        c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
        const sky = c.createLinearGradient(0, 0, 0, y0);
        sky.addColorStop(0, "#e9f0ea"); sky.addColorStop(1, "#eef1e2");
        c.fillStyle = sky; c.fillRect(0, 0, W, y0 + 2);
        const hill = (amp : number, colour : string, phase : number) => {
            c.beginPath(); c.moveTo(0, y0 + 2);
            for (let x = 0; x <= W; x += 8) c.lineTo(x, y0 - amp * (0.55 + 0.45 * Math.sin(x / W * 5.2 + phase)) - amp * 0.35 * Math.sin(x / W * 13 + phase * 2));
            c.lineTo(W, y0 + 2); c.closePath(); c.fillStyle = colour; c.fill();
        };
        // far tree lines melting into the haze, as the 3D land does under its fog
        hill(H * 0.035, "#d3e0cc", 0.6);
        hill(H * 0.02, "#bfd2b0", 2.1);
        const vx = W * 0.5, vy = y0 - H * 0.35, strips = [ "#d9c35a", "#8fbf5c", "#c9a978", "#b5d07a", "#e4cf6a", "#9ac46a", "#bf9f6c", "#a7c573" ];
        c.save(); c.beginPath(); c.rect(0, y0, W, H - y0); c.clip();
        const n = 16;
        for (let k = -n / 2; k < n / 2; k++) {
            const xa = vx + (k / (n / 2)) * W * 2.2, xb = vx + ((k + 1) / (n / 2)) * W * 2.2;
            c.beginPath(); c.moveTo(vx, vy); c.lineTo(xa, H * 1.6); c.lineTo(xb, H * 1.6); c.closePath();
            c.fillStyle = strips[(k + n) % strips.length]; c.fill();
        }
        const front = c.createLinearGradient(0, y0 + H * 0.04, 0, H);
        front.addColorStop(0, "rgba(167, 197, 115, 0)"); front.addColorStop(0.18, "rgba(167, 197, 115, 0.9)"); front.addColorStop(1, "#a7c573");
        c.fillStyle = front; c.fillRect(0, y0 + H * 0.04, W, H);
        const haze = c.createLinearGradient(0, y0 - H * 0.03, 0, y0 + H * 0.05);
        haze.addColorStop(0, "rgba(233, 240, 234, 0)"); haze.addColorStop(0.5, "rgba(233, 240, 234, 0.7)"); haze.addColorStop(1, "rgba(233, 240, 234, 0)");
        c.fillStyle = haze; c.fillRect(0, y0 - H * 0.03, W, H * 0.08);
        // a dirt track just below the horizon, where the cart and the tractor run
        c.fillStyle = "#dcc69c"; c.fillRect(0, y0 + H * 0.008, W, H * 0.014);
        c.fillStyle = "rgba(160, 128, 84, 0.25)"; c.fillRect(0, y0 + H * 0.012, W, 1.2);
        c.restore();
        $("wws-scenery").setAttribute("transform", `translate(0 ${y0.toFixed(1)})`);
    };

    // Decoration, not data: trees on the horizon, birds, and on the track a bullock cart and plough in the early surveys
    // and a tractor with a seed drill and a harvester in the recent ones, with a skyline behind them.
    const drawScenery = () => {
        const k = Math.min(1.25, geo.H / 860) * (geo.phone ? 0.75 : 1);
        const bx = geo.W * (geo.phone ? 0.3 : 0.27);
        const blocks = [ [ 0, 34, 70, "#c9d3dc" ], [ 36, 26, 96, "#b7c4d0" ], [ 64, 30, 122, "#9fc3d6" ], [ 96, 24, 84, "#ced7df" ], [ 122, 34, 58, "#bfcad4" ] ] as const;
        const sky = blocks.map(([ x, w, h, c ]) => `<rect x="${x}" y="${-h}" width="${w}" height="${h}" fill="${c}"></rect>${Array.from({ length : Math.floor(h / 10) - 1 }, (_, r) => Array.from({ length : Math.floor(w / 8) }, (_, q) => `<rect x="${x + 3 + q * 8}" y="${-h + 6 + r * 10}" width="4" height="5" fill="#eef4f8" opacity="0.8"></rect>`).join("")).join("")}`).join("");
        const tower = `<g transform="translate(176 0)"><path d="M-7 0 L0 -120 L7 0 M-5 -40 L5 -40 M-3.5 -75 L3.5 -75 M-6 -20 L4 -55 M6 -20 L-4 -55" fill="none" stroke="#8d97a1" stroke-width="1.4"></path><rect x="-5" y="-112" width="4" height="8" fill="#8d97a1"></rect><rect x="1" y="-104" width="4" height="8" fill="#8d97a1"></rect><circle cx="0" cy="-122" r="2" fill="#d9362d"></circle></g>`;
        const turbine = (x : number) => `<g transform="translate(${x} 0)"><line x1="0" y1="0" x2="0" y2="-96" stroke="#e8ecef" stroke-width="3"></line><g transform="translate(0 -96)"><g class="spin">${[ 0, 120, 240 ].map(a => `<path d="M0 0 L-2.4 -36 L0 -40 L2.4 -36 Z" fill="#f4f6f8" stroke="#c9d1d8" stroke-width="0.6" transform="rotate(${a})"></path>`).join("")}<circle r="3" fill="#dfe5ea"></circle></g></g></g>`;
        const solar = Array.from({ length : 6 }, (_, i) => `<polygon points="${226 + i * 15},-2 ${238 + i * 15},-2 ${236 + i * 15},-10 ${224 + i * 15},-10" fill="#2d4f86" stroke="#9fb6d6" stroke-width="0.5"></polygon>`).join("");
        const pylons = [ -60, 300 ].map(x => `<path d="M${x - 6} 0 L${x} -70 L${x + 6} 0 M${x - 10} -58 H${x + 10} M${x - 8} -46 H${x + 8}" fill="none" stroke="#9aa3ab" stroke-width="1.2"></path>`).join("") + `<path d="M-50 -58 Q120 -40 290 -58 M-50 -46 Q120 -30 290 -46" fill="none" stroke="#9aa3ab" stroke-width="0.7"></path>`;
        const modernBg = `<g id="modern-bg" class="modern-bg is-off" transform="translate(${bx.toFixed(1)} 2) scale(${(0.75 * k).toFixed(3)})" opacity="0.92">${pylons}${sky}${tower}${turbine(214)}${turbine(262)}${solar}</g>`;
        const trees = TREES.map(([ fx, kind, sc ]) => `<g class="tree" transform="translate(${(fx * geo.W).toFixed(1)} 1) scale(${(sc * k).toFixed(3)})"><use href="#t-${kind}"></use></g>`).join("");
        const road = geo.H * 0.016;
        const drive = (id : string, dur : number, delay = 0) => `<g class="vehicle" id="${id}" transform="translate(0 ${road.toFixed(1)}) scale(${(0.9 * k).toFixed(3)})"><g class="drive" style="--dur:${dur}s;animation-delay:${delay}s;--drive-end:${(geo.W / (0.9 * k) + 40).toFixed(0)}px"><use href="#v-${id.slice(4)}"></use></g></g>`;
        $("wws-scenery").innerHTML = modernBg + trees + drive("veh-cart", 46) + drive("veh-plough", 64, -30) + drive("veh-seeddrill", 26) + drive("veh-harvester", 34, -15);
        const flock = (y : number, dur : number, delay : number, n : number, sc : number) => `<g class="flock" style="--dur:${dur}s;--delay:${delay}s;--fly-end:${geo.W + 120}px">${Array.from({ length : n }, (_, i) => `<g transform="translate(${i * 16 * sc} ${y + (i % 2) * 8 * sc + Math.abs(i - n / 2) * 4 * sc}) scale(${sc})"><use href="#bird" style="animation-delay:${(i * 0.13).toFixed(2)}s"></use></g>`).join("")}</g>`;
        $("wws-birds").innerHTML = flock(geo.H * 0.06, 38, 0, 5, 1.7) + flock(geo.H * 0.12, 52, -20, 3, 1.3);
    };

    // The two plots, as the opening's wheat field: tilled earth inside a raised bank, narrowing a little towards the back,
    // a row of golden wheat between the rows of figures.
    const plotRowY = (r : number) => geo.plotTop + (r + 0.85) / 10 * (geo.plotBottom - geo.plotTop) * 0.97;
    const plotEdge = (p : { x0 : number; x1 : number }, y : number) => {
        const t = (y - geo.plotTop) / (geo.plotBottom - geo.plotTop), inset = (p.x1 - p.x0) * 0.07 * (1 - t);
        return [ p.x0 + inset, p.x1 - inset ];
    };
    const drawPlots = () => {
        const { plots, plotTop : t, plotBottom : b } = geo;
        const quad = (p : { x0 : number; x1 : number }) => { const [ a0, a1 ] = plotEdge(p, t - 8), [ b0, b1 ] = plotEdge(p, b); return `${a0},${t - 8} ${a1},${t - 8} ${b1},${b} ${b0},${b}`; };
        $("wws-plots").innerHTML = ([ "m", "w" ] as Sex[]).map(s => `
            <g class="plot">
                <polygon points="${quad(plots[s])}" fill="#b08e5c" stroke="#c9ab77" stroke-width="5" stroke-linejoin="round"></polygon>
                ${Array.from({ length : 10 }, (_, r) => { const y = plotRowY(r) - (plotRowY(1) - plotRowY(0)) * 0.45, [ x0, x1 ] = plotEdge(plots[s], y); return `<line x1="${x0 + 6}" x2="${x1 - 6}" y1="${y}" y2="${y}" stroke="#e4c467" stroke-width="${2.4 + r * 0.25}" stroke-linecap="round" stroke-dasharray="1.5 2.5" opacity="0.9"></line>`; }).join("")}
                ${Array.from({ length : 10 }, (_, r) => { const y = plotRowY(r) + 1.5, [ x0, x1 ] = plotEdge(plots[s], y); return `<line x1="${x0 + 4}" x2="${x1 - 4}" y1="${y}" y2="${y}" stroke="#8a6c44" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round"></line>`; }).join("")}
            </g>`).join("");
    };

    // A box in simple oblique 3D: the front face, the side face to the right and the top, from a base line at y.
    const box = (x : number, y : number, w : number, h : number, d : number, front : string, side : string, top : string) => {
        const dy = d * 0.55;
        return `<polygon points="${x + w},${y} ${x + w + d},${y - dy} ${x + w + d},${y - h - dy} ${x + w},${y - h}" fill="${side}"></polygon>
            <polygon points="${x},${y - h} ${x + d},${y - h - dy} ${x + w + d},${y - h - dy} ${x + w},${y - h}" fill="${top}"></polygon>
            <rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${front}"></rect>`;
    };
    const drawBuildings = () => {
        const { factory : F, shops : s, gy } = geo;
        // the building site from the opening takes the left of the industry plot; the factory shed stands to its right
        const f = { x : F.x + F.w * 0.44, w : F.w * 0.56, h : F.h * 0.82, d : F.d };
        const top = gy - f.h;
        const sx0 = F.x, sw0 = F.w * 0.4, sh0 = F.h * 1.05, conc = "#d3cdc1", brk = "#b9573a";
        const cols = [ 0, 0.5, 1 ].map(k => `<rect x="${sx0 + k * (sw0 - 5)}" y="${gy - sh0}" width="5" height="${sh0}" fill="${conc}" stroke="#bdb6a8" stroke-width="0.5"></rect>`).join("");
        const slab = `<rect x="${sx0 - 2}" y="${gy - sh0 * 0.52}" width="${sw0 + 4}" height="4" fill="${conc}" stroke="#bdb6a8" stroke-width="0.5"></rect>`;
        const bw = sw0 / 9, bh = sh0 * 0.06;
        const wall = Array.from({ length : 7 }, (_, r) => Array.from({ length : 9 }, (_, c) => (r > 4 && c > 5) || (r > 2 && c > 7) ? "" : `<rect x="${sx0 + c * bw + (r % 2) * bw / 2 - (r % 2 && c === 8 ? bw / 2 : 0)}" y="${gy - (r + 1) * bh}" width="${bw - 0.8}" height="${bh - 0.8}" fill="${brk}"></rect>`).join("")).join("");
        const scaffold = `<g stroke="#8d97a1" stroke-width="1.2">${[ -6, -1 ].map(dx => `<line x1="${sx0 + dx}" x2="${sx0 + dx}" y1="${gy}" y2="${gy - sh0 * 1.08}"></line>`).join("")}${[ 0.3, 0.6, 0.9 ].map(k => `<line x1="${sx0 - 8}" x2="${sx0 + 1}" y1="${gy - sh0 * k}" y2="${gy - sh0 * k}"></line>`).join("")}</g>`;
        const bags = [ [ 0, 0 ], [ 11, 0 ], [ 22, 0 ], [ 5.5, -3.6 ], [ 16.5, -3.6 ], [ 11, -7.2 ] ].map(([ dx, dy ]) => `<g transform="translate(${sx0 + sw0 + 8 + dx * sh0 / 70} ${gy + 2 + dy * sh0 / 70}) scale(${sh0 / 70})"><use href="#bag"></use></g>`).join("");
        const pile = Array.from({ length : 6 }, (_, i) => `<rect x="${sx0 - 14 + (i % 3) * 5 + Math.floor(i / 3) * 2.5}" y="${gy - 3 - Math.floor(i / 3) * 3}" width="4.6" height="2.6" fill="${brk}"></rect>`).join("");
        const site = `<ellipse cx="${sx0 + sw0 / 2}" cy="${gy + 1}" rx="${sw0 * 0.75}" ry="${sh0 * 0.08}" fill="#9c7b52" opacity="0.55"></ellipse>${wall}${cols}${slab}${scaffold}${pile}${bags}`;
        // the factory: a shed on a brick plinth, a saw-tooth roof with glazing, ribbon windows, a loading bay, a striped
        // chimney with smoke, a water tank, pipes and a fence; solar panels on the roof in the recent surveys
        const teeth = 5, tw = f.w / teeth;
        const sawtooth = Array.from({ length : teeth }, (_, i) => `<polygon points="${f.x + i * tw},${top} ${f.x + i * tw + tw * 0.22},${top - f.h * 0.3} ${f.x + (i + 1) * tw},${top}" fill="#d6cfe8"></polygon><polygon points="${f.x + i * tw},${top} ${f.x + i * tw + tw * 0.22},${top - f.h * 0.3} ${f.x + i * tw + tw * 0.22},${top}" fill="#8fc0de"></polygon>`).join("");
        const ribbon = [ 0.2, 0.46 ].map(r => `<rect x="${f.x + f.w * 0.05}" y="${top + f.h * r}" width="${f.w * 0.9}" height="${f.h * 0.15}" rx="1.5" fill="#bfdcef" stroke="#6f659f" stroke-width="1.2"></rect>${Array.from({ length : 11 }, (_, c) => `<line x1="${f.x + f.w * (0.05 + (c + 1) * 0.9 / 12)}" x2="${f.x + f.w * (0.05 + (c + 1) * 0.9 / 12)}" y1="${top + f.h * r}" y2="${top + f.h * (r + 0.15)}" stroke="#6f659f" stroke-width="0.8"></line>`).join("")}`).join("");
        const bay = `<rect x="${f.x + f.w * 0.38}" y="${gy - f.h * 0.34}" width="${f.w * 0.24}" height="${f.h * 0.34}" fill="#8a80b8"></rect>${Array.from({ length : 6 }, (_, i) => `<line x1="${f.x + f.w * 0.38}" x2="${f.x + f.w * 0.62}" y1="${gy - f.h * 0.34 + (i + 1) * f.h * 0.05}" y2="${gy - f.h * 0.34 + (i + 1) * f.h * 0.05}" stroke="#6f659f" stroke-width="0.8"></line>`).join("")}<rect x="${f.x + f.w * 0.36}" y="${gy - f.h * 0.38}" width="${f.w * 0.28}" height="${f.h * 0.04}" fill="url(#hazard)"></rect>`;
        const plinth = `<rect x="${f.x}" y="${gy - f.h * 0.12}" width="${f.w}" height="${f.h * 0.12}" fill="#b9573a"></rect>${Array.from({ length : 14 }, (_, i) => `<line x1="${f.x + i * f.w / 14}" x2="${f.x + i * f.w / 14}" y1="${gy - f.h * 0.12}" y2="${gy}" stroke="#d98b6d" stroke-width="0.6"></line>`).join("")}`;
        const cx = f.x + f.w * 0.82, cw = f.w * 0.065, ch = f.h * 1.1;
        const chimney = box(cx, top - f.h * 0.02, cw, ch, cw * 0.6, "#ece8f4", "#c9c1de", "#f5f2fa") + [ 0.12, 0.36 ].map(k => `<rect x="${cx}" y="${top - ch * (1 - k)}" width="${cw}" height="${ch * 0.1}" fill="#d9362d"></rect>`).join("");
        const smoke = [ 0, 1, 2 ].map(i => `<circle class="smoke" style="animation-delay:${i * 1.3}s" cx="${cx + cw * 0.8}" cy="${top - ch - f.h * 0.05}" r="${cw * 0.7}" fill="#e6e3ec"></circle>`).join("");
        const pipes = `<path d="M${f.x + f.w} ${gy - f.h * 0.55} h${f.d * 0.6} v${f.h * 0.4}" fill="none" stroke="#9aa3ab" stroke-width="2.4"></path>`;
        const solar = `<g class="modern-only">${Array.from({ length : teeth }, (_, i) => `<polygon points="${f.x + i * tw + tw * 0.3},${top - f.h * 0.02} ${f.x + i * tw + tw * 0.25},${top - f.h * 0.22} ${f.x + (i + 1) * tw - tw * 0.12},${top - f.h * 0.06} ${f.x + (i + 1) * tw - tw * 0.06},${top - f.h * 0.0}" fill="#2d4f86" stroke="#9fb6d6" stroke-width="0.6"></polygon>`).join("")}</g>`;
        const fence = `<g stroke="#b7ab95" stroke-width="1">${Array.from({ length : 18 }, (_, i) => `<line x1="${f.x - f.w * 0.04 + i * f.w * 0.065}" x2="${f.x - f.w * 0.04 + i * f.w * 0.065}" y1="${gy + 4}" y2="${gy - 4}"></line>`).join("")}<line x1="${f.x - f.w * 0.04}" x2="${f.x + f.w * 1.07}" y1="${gy - 1}" y2="${gy - 1}"></line></g>`;
        const tree = (x : number, y : number, sc : number) => `<g transform="translate(${x} ${y}) scale(${sc})"><use href="#t-mango"></use></g>`;
        // the shops: a two-storey market row; three shopfronts with awnings and signs (a tea stall, a chemist, a mobile
        // shop), a balcony above, a street lamp and a parked scooter
        const unit = s.w / 3, h1 = s.h * 0.62, h2 = s.h;
        const AWN = [ "#e4572e", "#2e9e6a", "#2f6fbf" ];
        const SIGN = [
            (x : number, y : number, w : number) => `<path d="M${x + w * 0.42} ${y + 3} h${w * 0.16} v${w * 0.1} q0 ${w * 0.05} -${w * 0.08} ${w * 0.05} q-${w * 0.08} 0 -${w * 0.08} -${w * 0.05} Z" fill="#ffffff"></path><path d="M${x + w * 0.58} ${y + 5} q${w * 0.06} 0 ${w * 0.04} ${w * 0.05}" fill="none" stroke="#ffffff" stroke-width="1"></path>`,
            (x : number, y : number, w : number) => `<path d="M${x + w * 0.46} ${y + 2.5} h${w * 0.08} v${w * 0.05} h${w * 0.05} v${w * 0.06} h-${w * 0.05} v${w * 0.05} h-${w * 0.08} v-${w * 0.05} h-${w * 0.05} v-${w * 0.06} h${w * 0.05} Z" fill="#ffffff"></path>`,
            (x : number, y : number, w : number) => `<rect x="${x + w * 0.45}" y="${y + 2.5}" width="${w * 0.1}" height="${w * 0.16}" rx="1.5" fill="#ffffff"></rect><rect x="${x + w * 0.465}" y="${y + 4}" width="${w * 0.07}" height="${w * 0.1}" fill="#2f6fbf"></rect>`,
        ];
        const fronts = Array.from({ length : 3 }, (_, i) => {
            const x = s.x + i * unit, stripes = 6, sw = unit / stripes, ay = gy - h1 * 0.72, signY = gy - h1 * 0.98, sh = h1 * 0.2;
            const awning = Array.from({ length : stripes }, (_, k) => `<polygon points="${x + k * sw},${ay} ${x + (k + 1) * sw},${ay} ${x + (k + 1) * sw + sw * 0.15},${ay + h1 * 0.18} ${x + k * sw + sw * 0.15},${ay + h1 * 0.18}" fill="${k % 2 ? "#ffffff" : AWN[i]}"></polygon>`).join("");
            const goods = Array.from({ length : 7 }, (_, k) => `<circle cx="${x + unit * (0.16 + k * 0.1)}" cy="${gy - h1 * 0.2}" r="${unit * 0.035}" fill="${[ "#f2b33d", "#d6342b", "#6aa846", "#e98a2e" ][k % 4]}"></circle>`).join("");
            return `<rect x="${x + unit * 0.06}" y="${gy - h1 * 0.52}" width="${unit * 0.88}" height="${h1 * 0.52}" fill="#5c4a35"></rect>
                ${Array.from({ length : 3 }, (_, k) => `<line x1="${x + unit * 0.06}" x2="${x + unit * 0.94}" y1="${gy - h1 * (0.52 - k * 0.04)}" y2="${gy - h1 * (0.52 - k * 0.04)}" stroke="#8d7a60" stroke-width="0.8"></line>`).join("")}
                <rect x="${x + unit * 0.1}" y="${gy - h1 * 0.3}" width="${unit * 0.8}" height="${h1 * 0.3}" fill="#c9a77a"></rect>${goods}
                ${awning}
                <rect x="${x + unit * 0.1}" y="${signY}" width="${unit * 0.8}" height="${sh}" rx="2" fill="${AWN[i]}"></rect>${SIGN[i](x + unit * 0.1, signY, unit * 0.8)}`;
        }).join("");
        const upper = `${Array.from({ length : 6 }, (_, k) => `<rect x="${s.x + s.w * (0.04 + k * 0.16)}" y="${gy - h2 * 0.92}" width="${s.w * 0.1}" height="${h2 * 0.18}" rx="1" fill="#cfe3ec" stroke="#b8a982" stroke-width="0.8"></rect>`).join("")}
            <line x1="${s.x}" x2="${s.x + s.w}" y1="${gy - h2 * 0.7}" y2="${gy - h2 * 0.7}" stroke="#a89878" stroke-width="1.6"></line>
            ${Array.from({ length : 24 }, (_, k) => `<line x1="${s.x + k * s.w / 24}" x2="${s.x + k * s.w / 24}" y1="${gy - h2 * 0.7}" y2="${gy - h2 * 0.64}" stroke="#a89878" stroke-width="0.8"></line>`).join("")}`;
        const lx = s.x + s.w + s.d * 1.2;
        const lamp = `<line x1="${lx}" x2="${lx}" y1="${gy}" y2="${gy - s.h * 1.05}" stroke="#4b4f56" stroke-width="1.6"></line><path d="M${lx} ${gy - s.h * 1.05} q${s.w * 0.04} 0 ${s.w * 0.05} ${s.h * 0.06}" fill="none" stroke="#4b4f56" stroke-width="1.6"></path><circle cx="${lx + s.w * 0.05}" cy="${gy - s.h * 0.97}" r="${s.h * 0.04}" fill="#ffe28a"></circle>`;
        const sx = s.x - s.w * 0.1, sc = s.h / 60;
        const scooter = `<g transform="translate(${sx} ${gy}) scale(${sc})"><circle cx="-8" cy="-4" r="4" fill="#2f2f2f"></circle><circle cx="10" cy="-4" r="4" fill="#2f2f2f"></circle><path d="M-12 -6 Q-10 -14 0 -13 L8 -13 L12 -6 Z" fill="#d9362d"></path><path d="M8 -13 L10 -22 L14 -22" fill="none" stroke="#4b4f56" stroke-width="1.6"></path><rect x="-6" y="-16" width="8" height="2.4" rx="1" fill="#2f2f2f"></rect></g>`;
        $("wws-buildings").innerHTML = `
            <g class="bld">
                <ellipse cx="${f.x + f.w / 2 + f.d / 2}" cy="${gy + 2}" rx="${f.w * 0.66}" ry="${f.h * 0.13}" fill="#000" opacity="0.07"></ellipse>
                ${chimney}${smoke}
                ${box(f.x, gy, f.w, f.h, f.d, "#e7e2f2", "#bdb4d9", "#f1eef8")}${sawtooth}${solar}${ribbon}${plinth}${bay}${pipes}
                ${fence}${tree(f.x + f.w + f.d + f.w * 0.06, gy + 2, f.h / 110)}${site}
            </g>
            <g class="bld">
                <ellipse cx="${s.x + s.w / 2 + s.d / 2}" cy="${gy + 2}" rx="${s.w * 0.64}" ry="${s.h * 0.15}" fill="#000" opacity="0.07"></ellipse>
                ${box(s.x, gy, s.w, s.h, s.d, "#f6efde", "#e1d3b3", "#fbf6ea")}${upper}${fronts}${lamp}${scooter}
            </g>`;
    };

    // Where figure k of a sex stands: its slot in the field, or in front of the factory or the shops. In a yard the men
    // stand on the left half and the women on the right, six to a row.
    const placeOf = (sex : Sex, place : Place, slot : number) => {
        if (place === "agri") {
            const r = Math.floor(slot / 10), c = slot % 10, y = plotRowY(r), [ x0, x1 ] = plotEdge(geo.plots[sex], y);
            return { x : x0 + (c + 0.5) / 10 * (x1 - x0), y, s : geo.figScale * (0.82 + 0.18 * r / 9) };
        }
        const yd = geo.yards[place], half = (yd.x1 - yd.x0) / 2, x0 = yd.x0 + (sex === "m" ? 0 : half), cols = 6;
        const r = Math.floor(slot / cols), c = slot % cols, rows = 5;
        return { x : x0 + (c + 0.5) / cols * half, y : yd.y0 + (r + 0.9) / rows * (yd.y1 - yd.y0), s : geo.figScale * 0.62 };
    };

    const render = (scene : Scene, round : number) => {
        // the old ways up to the NSS rounds (to 2011-12), the new for the PLFS years
        const modern = scene !== "meet" && RURAL[round].t > 2015;
        [ "cart", "plough" ].forEach(v => $(`veh-${v}`).classList.toggle("is-off", modern));
        [ "seeddrill", "harvester" ].forEach(v => $(`veh-${v}`).classList.toggle("is-off", !modern));
        $("modern-bg").classList.toggle("is-off", !modern);
        $("wws-buildings").classList.toggle("is-modern", modern);
        const r = RURAL[round];
        for (const sex of [ "m", "w" ] as Sex[]) {
            // Each figure keeps its own cell in the field, back rows first. Those who leave are the back rows, nearest the
            // factory and the shops: figure k goes to industry while k is below the industry count, then to services.
            const [ , nInd, nServ ] = scene === "meet" ? [ FIGS, 0, 0 ] : hundred(r[sex]);
            for (let k = 0; k < FIGS; k++) {
                const pl : Place = k < nInd ? "ind" : k < nInd + nServ ? "serv" : "agri";
                const slot = pl === "serv" ? k - nInd : k;
                const f = figs[sex][k], pos = placeOf(sex, pl, slot);
                (f.body.firstChild as SVGUseElement).setAttribute("href", sex === "w" ? "#fig-woman" : pl === "ind" ? "#fig-worker" : modern ? "#fig-man-modern" : "#fig-man");
                f.el.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) scale(${pos.s.toFixed(3)})`;
                f.el.style.transitionDelay = `${(k % 25) * 14}ms`;
                if (f.place !== null && f.place !== pl && !reduced) {
                    f.body.classList.add("walk");
                    clearTimeout(f.timer); f.timer = window.setTimeout(() => f.body.classList.remove("walk"), 1900);
                }
                f.place = pl;
            }
        }
        stage.classList.toggle("is-dim", scene === "guess");
        const meet = scene === "meet";
        $("year-badge").classList.toggle("is-hidden", meet);
        $("year-badge").textContent = r.period;
        const { factory : f, shops : s, gy, plots, plotTop, phone } = geo;
        // a label centred over its place, kept inside the screen
        const put = (id : string, x : number, y : number, html : string) => {
            const el = $(id); el.innerHTML = html;
            const half = el.offsetWidth / 2, cx = Math.max(half + 6, Math.min(geo.W - half - 6, x));
            el.style.transform = `translate(${cx - half}px, ${y - el.offsetHeight}px)`;
        };
        put("lab-factory", f.x + f.w / 2, gy - f.h * 1.45, `<b style="color:var(--ind)">Industry</b>${meet ? "" : `<span><i class="m">men ${pc(r.m[1])}</i> · <i class="w">women ${pc(r.w[1])}</i></span>`}`);
        put("lab-shops", s.x + s.w / 2, gy - s.h * 1.3, `<b style="color:#8a5d00">Services</b>${meet ? "" : `<span><i class="m">men ${pc(r.m[2])}</i> · <i class="w">women ${pc(r.w[2])}</i></span>`}`);
        put("lab-men", (plots.m.x0 + plots.m.x1) / 2, plotTop - 12, `<b class="m">${meet ? "100 rural men who work" : `Men on the farm ${pc(r.m[0])}`}</b>`);
        put("lab-women", (plots.w.x0 + plots.w.x1) / 2, plotTop - 12, `<b class="w">${meet ? "100 rural women who work" : `Women on the farm ${pc(r.w[0])}`}</b>`);
        $("year-badge").style.transform = `translate(${geo.A.l + geo.Aw / 2}px, ${geo.A.b + (phone ? 10 : 6)}px) translateX(-50%)`;
        $("stage-caption").style.transform = `translate(${geo.A.l}px, ${phone ? 12 : 26}px)`;
        const fig = (id : string, w : number) => `<svg width="${w}" height="${w * 2}" viewBox="-10 -40 20 41" aria-hidden="true"><use href="#${id}"></use></svg>`;
        $("caption-keys").innerHTML = `<span class="key">${fig(modern ? "fig-man-modern" : "fig-man", 15)}a rural man who works</span><span class="key">${fig("fig-woman", 15)}a rural woman who works</span>${meet ? "" : `<span class="key">${fig("fig-worker", 15)}a man in industry, as the mason above</span>`}`;
    };

    // The survey each scene shows; the turn scene steps through 2018-19 to 2023-24 while its card is in view. (This is
    // the 2D stage, used until the 3D one has loaded and wherever WebGL is missing.)
    let current : Scene | null = null, turnTimer = 0;
    let plots3d : PlotsScene | null = null;
    const setScene = (scene : Scene, force = false) => {
        if (current === scene && !force) return;
        current = scene;
        clearInterval(turnTimer); turnTimer = 0;
        root.querySelectorAll<HTMLElement>(".step-card").forEach(c => c.classList.toggle("is-active", c.parentElement?.dataset.scene === scene));
        let round = ROUND_OF[scene];
        if (plots3d) return;
        render(scene, round);
        if (scene === "turn") {
            turnTimer = window.setInterval(() => {
                round += 1;
                render("turn", round);
                if (round >= I_TOP) { clearInterval(turnTimer); turnTimer = 0; }
            }, reduced ? 1200 : 850);
        }
    };
    layout(); setScene("meet");
    const io = new IntersectionObserver(entries => { for (const e of entries) if (e.isIntersecting) setScene((e.target as HTMLElement).dataset.scene as Scene); }, { rootMargin : "-45% 0px -45% 0px", threshold : 0 });
    root.querySelectorAll(".step").forEach(s => io.observe(s));
    cleanups.push(() => { io.disconnect(); clearInterval(turnTimer); figs.m.concat(figs.w).forEach(f => clearTimeout(f.timer)); });

    // THE 3D STAGE ====================================================================================================
    // Where WebGL works, the plots are the opening's 3D farmland (plotsScene.ts) and the scroll drives a timeline of
    // surveys: x is a round index (-1 everyone in the field), held while a card is centred and scrubbed between cards,
    // so between the guess and the answer the figures walk through every survey, and scrolling back rewinds them.
    const SCENE_ORDER : Scene[] = [ "meet", "then", "guess", "years", "now", "gap", "sectors", "turn", "latest" ];
    const KEYS : [ number, number ][] = [
        [ 0.35, -1 ], [ 0.65, -1 ], [ 1.35, 0 ], [ 2.65, 0 ], [ 3.12, 0 ], [ 3.9, LAST_I ], [ 6.65, LAST_I ],
        [ 7.2, I_DIP ], [ 7.8, I_TOP ], [ 8.35, LAST_I ],
    ];
    const timeline = (s : number) => {
        if (s <= KEYS[0][0]) return KEYS[0][1];
        for (let i = 1; i < KEYS.length; i++) {
            const [ s1, x1 ] = KEYS[i], [ s0, x0 ] = KEYS[i - 1];
            if (s <= s1) return x0 + (x1 - x0) * (s - s0) / (s1 - s0);
        }
        return KEYS[KEYS.length - 1][1];
    };
    // the reader's place in step units: i + 0.5 when step i's middle is at the middle of the screen
    const steps = SCENE_ORDER.map(sc => root.querySelector<HTMLElement>(`[data-scene="${sc}"]`)!);
    const stepPos = () => {
        const mid = innerHeight / 2;
        for (let i = 0; i < steps.length; i++) {
            const r = steps[i].getBoundingClientRect();
            if (mid < r.bottom || i === steps.length - 1) return i + (mid - r.top) / r.height;
        }
        return 0;
    };
    const frameOf = (W : number, H : number) => W < 900
        ? { l : 8, r : W - 8, t : H * 0.11, b : H * 0.58 }
        : { l : W * 0.03, r : W - Math.min(430, W * 0.36) - W * 0.06, t : H * 0.12, b : H * 0.96 };
    let lastRound = -2, lastModern : boolean | null = null, raf3 = 0;
    const draw3d = () => {
        if (!plots3d) return;
        const s = stepPos(), x = timeline(s), zoomT = smoothT(Math.max(0, Math.min(1, s / 0.5)));
        plots3d.render({ x, zoom : 2.3 - 1.3 * zoomT, dim : Math.abs(s - 2.5) < 0.5 });
        // the plots rise out of the same haze the opening fades into
        stage.style.setProperty("--veil", String(1 - smoothT(Math.max(0, Math.min(1, (s + 0.1) / 0.5)))));
        const meet = x < -0.5, i = Math.max(0, Math.min(LAST_I, Math.round(x))), r = RURAL[i], a = plots3d.anchors();
        // a label centred above its anchor, hanging just below it, or ending just left of it, kept inside the screen
        const put = (id : string, ax : number, ay : number, html : string, at : "above" | "below" | "left" = "above") => {
            const el = $(id); if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
            const w = el.offsetWidth, h = el.offsetHeight, edge = stage.clientWidth < 900 ? 6 : 56;
            const cx = Math.max(edge, Math.min(stage.clientWidth - w - 6, at === "left" ? ax - w - 6 : ax - w / 2));
            el.style.transform = `translate(${cx}px, ${at === "below" ? ay : at === "left" ? ay - h / 2 : ay - h}px)`;
        };
        const phone = stage.clientWidth < 900;
        put("lab-factory", a.ind.x, a.ind.y, `<b style="color:var(--ind)">Industry</b>${meet ? "" : `<span><i class="m">men ${pc(r.m[1])}</i> · <i class="w">women ${pc(r.w[1])}</i></span>`}`);
        put("lab-shops", a.serv.x, a.serv.y, `<b style="color:#8a5d00">Services</b>${meet ? "" : `<span><i class="m">men ${pc(r.m[2])}</i> · <i class="w">women ${pc(r.w[2])}</i></span>`}`);
        // each field's label just below its front bank; on a phone, beside the field's left corner
        const men = phone ? a.menSide : a.men, women = phone ? a.womenSide : a.women;
        put("lab-men", men.x, men.y, `<b class="m">${meet ? "100 rural men who work" : `Men on the farm ${pc(r.m[0])}`}</b>`, phone ? "left" : "below");
        put("lab-women", women.x, women.y, `<b class="w">${meet ? "100 rural women who work" : `Women on the farm ${pc(r.w[0])}`}</b>`, phone ? "left" : "below");
        const badge = $("year-badge");
        badge.classList.toggle("is-hidden", meet);
        badge.textContent = r.period;
        // on a phone the card below already names the survey, and there is no free corner for the dates
        badge.style.display = stage.clientWidth < 900 ? "none" : "";
        // on a wide screen the dates sit in the bottom-left corner, with the key just above them
        const left = frameOf(stage.clientWidth, stage.clientHeight).l + 8;
        badge.style.transform = `translate(${left}px, ${stage.clientHeight - badge.offsetHeight - 22}px)`;
        if (i !== lastRound) { lastRound = i; yearsCard(i); }
        const modern = !meet && r.round.startsWith("PLFS");
        if (modern !== lastModern) {
            lastModern = modern;
            const fr = frameOf(stage.clientWidth, stage.clientHeight);
            const fig = (id : string, w : number) => `<svg width="${w}" height="${w * 2}" viewBox="-10 -40 20 41" aria-hidden="true"><use href="#${id}"></use></svg>`;
            $("caption-keys").innerHTML = `<span class="key">${fig(modern ? "fig-man-modern" : "fig-man", 15)}a man</span><span class="key">${fig("fig-woman", 15)}a woman</span><span class="key">${fig("fig-worker", 15)}a man in industry</span>`;
            if (stage.clientWidth < 900) $("stage-caption").style.transform = `translate(${fr.l + 8}px, 12px)`;
        }
        // on a wide screen the key sits in the bottom-left corner, just above the dates; on a phone, where the cards fill
        // the bottom, it stays at the top
        if (!phone) {
            const cap = $("stage-caption");
            cap.style.transform = `translate(${left}px, ${stage.clientHeight - badge.offsetHeight - 22 - cap.offsetHeight - 8}px)`;
        }
    };
    const smoothT = (t : number) => t * t * (3 - 2 * t);
    const schedule3d = () => { cancelAnimationFrame(raf3); raf3 = requestAnimationFrame(draw3d); };
    const size3d = () => {
        if (!plots3d) return;
        const W = stage.clientWidth, H = stage.clientHeight;
        plots3d.resize(W, H, frameOf(W, H)); lastModern = null; draw3d();
    };
    const webgl = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } })();
    let gone = false;
    if (webgl) {
        import("./plotsScene").then(({ createPlotsScene }) => {
            if (gone) return;
            plots3d = createPlotsScene($<HTMLCanvasElement>("wws-gl"), { narrow : stage.clientWidth < 700, reduced });
            // the wind, the birds and the vehicles move only while the plots are on screen
            const act = stage.parentElement!;
            const vis = new IntersectionObserver(([ en ]) => plots3d?.run(en.isIntersecting));
            vis.observe(act); cleanups.push(() => vis.disconnect());
            clearInterval(turnTimer); figs.m.concat(figs.w).forEach(f => clearTimeout(f.timer));
            stage.classList.add("is-3d");
            size3d();
        }).catch(() => { /* the 2D stage stays */ });
    }
    on("scroll", () => { if (plots3d) schedule3d(); });
    cleanups.push(() => { gone = true; cancelAnimationFrame(raf3); plots3d?.dispose(); plots3d = null; });

    // The guess.
    let picked = 0;
    const guessRow = $("guess-row"), lock = $<HTMLButtonElement>("lock");
    guessRow.addEventListener("click", e => {
        const b = (e.target as HTMLElement).closest("button"); if (!b) return;
        picked = +(b.dataset.v ?? 0);
        [ ...guessRow.children ].forEach(x => x.classList.toggle("is-pick", x === b));
        lock.disabled = false;
    });
    lock.addEventListener("click", () => {
        if (!picked) return;
        nowCard(picked);
        root.querySelector('[data-scene="now"]')?.scrollIntoView({ behavior : reduced ? "auto" : "smooth", block : "center" });
    });

    // THE CHAPTERS' WORDS =============================================================================================
    const para = (s : string) => `<p class="para">${s}</p>`;
    const gapsFrom = RURAL.filter(r => r.t > 2019);
    $("long-prose").innerHTML = para(`In ${shortOf(FIRST)}, <b class="m">${pc(FIRST.m[0])}</b> of rural working men and <b class="w">${pc(FIRST.w[0])}</b> of rural working women were in agriculture. By ${shortOf(LAST)}, the men’s share had fallen by ${pts(FIRST.m[0] - LAST.m[0])}, to <b class="m">${pc(LAST.m[0])}</b>. The women’s had fallen by ${pts(FIRST.w[0] - LAST.w[0])}, to <b class="w">${pc(LAST.w[0])}</b>.`)
        + para(`Both lines fall, but the men’s falls more than twice as far. The shaded area between them is the gap. From ${shortOf(gapsFrom[0])} on, it is wider in every survey than in any survey before, and it was widest in ${shortOf(WIDEST)}, at ${pts(WIDEST.w[0] - WIDEST.m[0])}.`);
    $("went-prose").innerHTML = para(`The men who left farm work mostly went into industry: <b class="m">${pc(FIRST.m[1])}</b> of rural working men in ${shortOf(FIRST)}, <b class="m">${pc(LAST.m[1])}</b> in ${shortOf(LAST)}. The table counts construction as industry and does not split it out. Services took ${pts(LAST.m[2] - FIRST.m[2])} more.`)
        + para(`Women barely moved into industry: ${pc(FIRST.w[1])} then, ${pc(LAST.w[1])} now. The ones who left the farm went into services, which rose from <b class="w">${pc(FIRST.w[2])}</b> to <b class="w">${pc(LAST.w[2])}</b>. That is a big rise from a small base, and still only about one rural working woman in ${Math.round(1000 / LAST.w[2])}.`);
    $("wage-prose").innerHTML = para(`DBIE cannot record why anyone moves. It does record what each kind of work pays a rural man, every month, and the gap is plain. In ${W1.year} a general farm labourer earned <b>₹${W1.farm.toFixed(0)}</b> a day on average. A construction worker earned <b>₹${W1.constr.toFixed(0)}</b>, a carpenter <b>₹${W1.carp.toFixed(0)}</b> and a mason <b>₹${W1.mason.toFixed(0)}</b>, ${prem(W1, "mason").toFixed(0)}% more than the farm labourer. Construction is counted as industry in the employment table, and industry is where the men went.`)
        + para(`The gap has narrowed. A construction worker earned ${prem(W0, "constr").toFixed(0)}% more than a farm labourer in ${W0.year} and ${prem(W1, "constr").toFixed(0)}% more in ${W1.year}, because farm wages rose faster: ${(100 * (W1.farm / W0.farm - 1)).toFixed(0)}% over the decade, against ${(100 * (W1.constr / W0.constr - 1)).toFixed(0)}%. After the rise in farm workers’ prices, a farm labourer’s daily wage bought ${realGrowth("farm").toFixed(0)}% more in ${W1.year} than in ${W0.year}; a construction worker’s bought ${Math.abs(realGrowth("constr")).toFixed(0)}% ${realGrowth("constr") < 0 ? "less" : "more"}. The pull of the building site is the higher day rate, especially for skilled work, more than a gap that keeps widening.`)
        + para(`These are men’s wages. DBIE publishes no wage for women in any of the rural jobs it tracks, so it cannot show whether women would gain the same by leaving the farm.`);
    $("turn-prose").innerHTML = para(`The fall was not steady. Between ${shortOf(DIP)} and ${shortOf(TOP)}, the share of rural working women in agriculture rose from <b class="w">${pc(DIP.w[0])}</b> to <b class="w">${pc(TOP.w[0])}</b>. Over the same years the men’s share kept falling, from <b class="m">${pc(DIP.m[0])}</b> to <b class="m">${pc(TOP.m[0])}</b>.`)
        + para(`It happened in the towns too: ${pc(URBAN_WOMEN_FARM[DIP.round])} of urban working women were in agriculture in ${shortOf(DIP)}, and ${pc(URBAN_WOMEN_FARM[LAST.round])} in ${shortOf(LAST)}. The table shows the movement, not its cause.`)
        + para(`The latest survey, for the calendar year ${shortOf(LAST)}, brings rural women back down to ${pc(LAST.w[0])}. One survey is not yet a trend.`);
    $("turn-facts").innerHTML = [
        [ `${pc(DIP.w[0])} → ${pc(TOP.w[0])}`, `Rural working women in agriculture, ${shortOf(DIP)} to ${shortOf(TOP)}`, "w" ],
        [ `${pc(DIP.m[0])} → ${pc(TOP.m[0])}`, `Rural working men in agriculture, same years`, "m" ],
        [ pts(WIDEST.w[0] - WIDEST.m[0]), `The gap in ${shortOf(WIDEST)}, the widest in the series`, "" ],
        [ `${pc(URBAN_WOMEN_FARM[DIP.round])} → ${pc(URBAN_WOMEN_FARM[LAST.round])}`, `Urban working women in agriculture, ${shortOf(DIP)} to ${shortOf(LAST)}`, "w" ],
    ].map(([ big, text, cls ]) => `<div class="fact"><span class="fact-big ${cls}">${big}</span><span class="fact-text">${text}</span></div>`).join("");

    // IN SHORT, THE CLOSING LINE ==========================================================
    $("so-grid").innerHTML = [
        [ "Who left", `Rural men left farm work, from ${pc(FIRST.m[0])} to ${pc(LAST.m[0])}`, `Since ${shortOf(FIRST)} the men’s share in agriculture has fallen by ${pts(FIRST.m[0] - LAST.m[0])}, and the share in industry, construction included, has doubled. A day’s construction work paid ${prem(W1, "constr").toFixed(0)}% more than a day’s farm work in ${W1.year}, and a mason’s ${prem(W1, "mason").toFixed(0)}% more.` ],
        [ "Who stayed", `Rural women stayed, at ${pc(LAST.w[0])}`, `The women’s share fell by only ${pts(FIRST.w[0] - LAST.w[0])}, rose again between ${shortOf(DIP)} and ${shortOf(TOP)}, and the gap with men nearly doubled, from ${pts(FIRST.w[0] - FIRST.m[0])} to ${pts(LAST.w[0] - LAST.m[0])}.` ],
    ].map(([ k, h, p ]) => `<div><div class="so-kicker">${k}</div><h3>${h}</h3><p class="para">${p}</p></div>`).join("");
    const closing = $("closing");
    closing.innerHTML = `Since ${shortOf(FIRST)}, rural men have moved off the farm into building sites, factories and shops. ${[ "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" ][inTen(LAST.w[0])]} in ten rural women who work are still in agriculture.`
        .split(" ").map(w => `<span>${w} </span>`).join("");
    // The closing line's words brighten as it rises up the screen; until then, and with reduced motion, it is fully lit.
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
    const DBIE = (path : string) => `https://data.rbi.org.in/DBIE/#/dbie/reports/${path.split("/").map(encodeURIComponent).join("/")}`;
    const HB = DBIE("Publication/Time-Series Publications/Handbook of Statistics on the Indian Economy");
    const QUERY = "https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced";
    const table = (head : string[], rows : (string | number)[][]) => `<details class="table-view"><summary>The figures used</summary><div class="table-scroll"><table><thead><tr>${head.map((h, i) => `<th class="${i ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? "n" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
    const ANNEX = [
        { title : "Employment situation in India: per 1000 distribution of usually employed by broad groups of industry", meta : `Handbook of Statistics on the Indian Economy, Table 154 (DBIE report 134), part I, socio-economic indicators. Rural; usual status, principal and subsidiary. NSS rounds 56 to 68 and PLFS ${shortOf(RURAL.find(r => /^PLFS/.test(r.round))!)} to ${shortOf(LAST)}.`, link : HB,
          data : table([ "Survey", "Men: agriculture", "Men: industry", "Men: services", "Women: agriculture", "Women: industry", "Women: services" ], RURAL.map(r => [ `${r.round} (${r.period})`, ...r.m, ...r.w ])) },
        { title : "Average daily wage rates in rural India for men (WAGE_RATES_RN)", meta : `DBIE data query: Real Sector, Prices & Wages, Wage Rates. All-India, monthly from ${monthOf(WAGE_RANGE.first.month)}, averaged here over each financial year: general agricultural labourers, non-agricultural labourers, construction workers, carpenters and masons. The series has one gender, male.`, link : QUERY,
          data : table([ "Financial year", ...WAGE_JOBS.map(j => j[1]) ], WAGES.map(r => [ r.year, ...WAGE_JOBS.map(([ k ]) => `₹${r[k].toFixed(1)}`) ])) },
        { title : "Consumer price index for agricultural labourers (CPI-AL)", meta : "DBIE data query: Real Sector, Prices & Wages. General index, base 1986-87, monthly, averaged over each financial year.", link : QUERY,
          data : table([ "Financial year", "Index" ], Object.entries(CPI_AL)) },
    ];
    $("annex-list").innerHTML = ANNEX.map((a, i) => `<div class="annex-item"><h3 class="annex-title">A${i + 1}. ${a.title}</h3><div class="annex-meta">${a.meta}</div><div class="annex-meta"><a href="${a.link}" target="_blank" rel="noopener noreferrer">Open on DBIE</a></div>${a.data}</div>`).join("");

    // THE CHARTS ======================================================================================================
    const before = RURAL.filter(r => r.t < 2015), after = RURAL.filter(r => r.t > 2015);

    // Per cent in agriculture, men and women, on a real time axis so the years with no survey show.
    const drawLines = () => {
        const box = $("line-box"), W = box.clientWidth; if (!W) return;
        const narrow = W < 560, H = narrow ? 300 : 340;
        const pad = { l : 40, r : narrow ? 14 : 100, t : 14, b : 28 };
        const t0 = 2000, t1 = 2026, y0 = 40, y1 = 90;
        const x = (t : number) => pad.l + (t - t0) / (t1 - t0) * (W - pad.l - pad.r);
        const y = (v : number) => pad.t + (1 - (v / 10 - y0) / (y1 - y0)) * (H - pad.t - pad.b);
        const path = (rs : Survey[], k : Sex) => rs.map((r, i) => `${i ? "L" : "M"}${x(r.t).toFixed(1)},${y(r[k][0]).toFixed(1)}`).join("");
        const area = (rs : Survey[]) => path(rs, "w") + [ ...rs ].reverse().map(r => `L${x(r.t).toFixed(1)},${y(r.m[0]).toFixed(1)}`).join("") + "Z";
        const lb = before[before.length - 1], fa = after[0];
        box.innerHTML = `
            <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Per cent of rural working women and men in agriculture, ${shortOf(FIRST)} to ${shortOf(LAST)}">
                <rect class="break-band" x="${x(lb.t) + 6}" y="${pad.t}" width="${Math.max(0, x(fa.t) - x(lb.t) - 12)}" height="${H - pad.t - pad.b}"></rect>
                <text x="${(x(lb.t) + x(fa.t)) / 2}" y="${pad.t + 14}" text-anchor="middle">no survey</text>
                ${[ 40, 50, 60, 70, 80, 90 ].map(v => `<line class="${v === 40 ? "base" : "grid"}" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v * 10)}" y2="${y(v * 10)}"></line><text x="${pad.l - 6}" y="${y(v * 10) + 4}" text-anchor="end">${v}%</text>`).join("")}
                ${[ 2001, 2005, 2010, 2015, 2020, 2025 ].map(t => `<text x="${x(t)}" y="${H - 8}" text-anchor="middle">${t}</text>`).join("")}
                <path class="gap-area" d="${area(before)}"></path><path class="gap-area" d="${area(after)}"></path>
                <path class="ln" style="stroke:var(--women)" d="${path(before, "w")}${path(after, "w")}"></path>
                <path class="ln" style="stroke:var(--men)" d="${path(before, "m")}${path(after, "m")}"></path>
                ${RURAL.map(r => `<circle cx="${x(r.t)}" cy="${y(r.w[0])}" r="3.4" fill="var(--women)" stroke="#ffffff" stroke-width="2"></circle><circle cx="${x(r.t)}" cy="${y(r.m[0])}" r="3.4" fill="var(--men)" stroke="#ffffff" stroke-width="2"></circle>`).join("")}
                ${narrow ? "" : `<text class="lbl-strong" x="${x(LAST.t) + 10}" y="${y(LAST.w[0]) + 4}">Women ${pc(LAST.w[0])}</text>
                    <text class="lbl-strong" x="${x(LAST.t) + 10}" y="${y(LAST.m[0]) + 4}">Men ${pc(LAST.m[0])}</text>
                    <text class="lbl" x="${x(FIRST.t)}" y="${y(FIRST.w[0]) - 10}">${pc(FIRST.w[0])}</text>
                    <text class="lbl" x="${x(FIRST.t)}" y="${y(FIRST.m[0]) + 20}">${pc(FIRST.m[0])}</text>`}
                <line class="cross" y1="${pad.t}" y2="${H - pad.b}" style="display:none"></line>
                <rect class="hit" x="${pad.l}" y="${pad.t}" width="${W - pad.l - pad.r}" height="${H - pad.t - pad.b}" fill="transparent"></rect>
            </svg>`;
        const hit = box.querySelector<SVGRectElement>(".hit")!, cross = box.querySelector<SVGLineElement>(".cross")!;
        let tip : HTMLDivElement | null = null;
        const move = (e : PointerEvent) => {
            const b = hit.getBoundingClientRect();
            const t = t0 + (e.clientX - b.left) / b.width * (t1 - t0);
            const r = RURAL.reduce((best, q) => Math.abs(q.t - t) < Math.abs(best.t - t) ? q : best, RURAL[0]);
            cross.style.display = ""; cross.setAttribute("x1", String(x(r.t))); cross.setAttribute("x2", String(x(r.t)));
            if (!tip) { tip = document.createElement("div"); tip.className = "tip"; box.appendChild(tip); }
            tip.style.left = `${Math.min(Math.max(x(r.t), 95), W - 95)}px`; tip.style.top = `${pad.t}px`;
            tip.innerHTML = `<strong>${r.period}</strong><span class="w">Women ${pc(r.w[0])}</span><span class="m">Men ${pc(r.m[0])}</span><span>Gap ${pts(r.w[0] - r.m[0])}</span>`;
        };
        hit.addEventListener("pointermove", move); hit.addEventListener("pointerdown", move);
        hit.addEventListener("pointerleave", () => { cross.style.display = "none"; if (tip) { tip.remove(); tip = null; } });
    };
    $("table-all").innerHTML = `<thead><tr><th>Survey</th><th>Period</th><th class="n">Men: agri.</th><th class="n">Men: industry</th><th class="n">Men: services</th><th class="n">Women: agri.</th><th class="n">Women: industry</th><th class="n">Women: services</th></tr></thead>
        <tbody>${RURAL.map(r => `<tr><td>${/^PLFS/.test(r.round) ? r.round : `NSS ${r.round}`}</td><td>${r.period}</td>${[ ...r.m, ...r.w ].map(v => `<td class="n">${pc(v)}</td>`).join("")}</tr>`).join("")}</tbody>`;

    // Stacked bars: each sex then and now, the three sectors as per cent.
    const drawBars = () => {
        const box = $("bars-box"), W = box.clientWidth; if (!W) return;
        const narrow = W < 560;
        const rows = [ [ "Men", FIRST, "m" ], [ "Men", LAST, "m" ], [ "Women", FIRST, "w" ], [ "Women", LAST, "w" ] ] as const;
        const lw = narrow ? 104 : 130, rowH = 36, gapH = 18, plotW = W - lw - 4;
        const H = 4 + rows.length * rowH + gapH + 4;
        let yAt = 4;
        const svgRows = rows.map(([ who, r, k ], i) => {
            if (i === 2) yAt += gapH;
            const y = yAt; yAt += rowH;
            const t = r[k], total = t[0] + t[1] + t[2];
            let x0 = lw;
            const segs = t.map((v, j) => {
                const w = v / total * plotW;
                const fill = [ "var(--agri)", "var(--ind)", "var(--serv)" ][j];
                const txt = w > 46 ? `<text x="${x0 + w / 2}" y="${y + rowH / 2 + 3}" text-anchor="middle" style="fill:${j === 1 ? "#ffffff" : "#26282c"};font-size:12px">${pc(v)}</text>` : "";
                const out = `<rect x="${x0 + (j ? 1 : 0)}" y="${y + 5}" width="${Math.max(0, w - (j ? 2 : 1))}" height="${rowH - 12}" rx="3" fill="${fill}"><title>${who}, ${shortOf(r)}: ${[ "agriculture", "industry", "services" ][j]} ${pc(v)}</title></rect>${txt}`;
                x0 += w; return out;
            }).join("");
            return `<text class="${i % 2 ? "lbl-strong" : "lbl"}" x="${lw - 10}" y="${y + rowH / 2 + 3}" text-anchor="end"><tspan style="fill:var(--${k === "m" ? "men" : "women"})">${who}</tspan> ${shortOf(r)}</text>${segs}`;
        }).join("");
        box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rural men and women by sector, ${shortOf(FIRST)} and ${shortOf(LAST)}">${svgRows}</svg>`;
    };

    // What a day's work pays a rural man, and the premium over farm work, then and now.
    const sgn = (v : number) => { const r = Math.round(v); return r === 0 ? "0%" : `${r > 0 ? "+" : "−"}${Math.abs(r)}%`; };
    const drawWages = () => {
        const box = $("wage-box"), W = box.clientWidth; if (!W) return;
        const narrow = W < 560, H = narrow ? 260 : 290;
        const pad = { l : 44, r : narrow ? 14 : 132, t : 12, b : 26 };
        const n = WAGES.length, max = Math.ceil(W1.mason / 100) * 100;
        const x = (i : number) => pad.l + i / (n - 1) * (W - pad.l - pad.r), y = (v : number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
        $("wage-legend").innerHTML = WAGE_JOBS.map(([ , name, c ]) => `<span><i class="sw" style="background:${c}"></i>${name}</span>`).join("");
        const SHORT : Record<JobKey, string> = { farm : "Farm", nonfarm : "Non-farm", constr : "Construction", carp : "Carpenter", mason : "Mason" };
        const ends = WAGE_JOBS.map(([ k ]) => ({ k, y : y(W1[k]) })).sort((a, b) => a.y - b.y);
        for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 14);
        box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Average daily wages of rural men by job, ${W0.year} to ${W1.year}">
            ${Array.from({ length : max / 100 + 1 }, (_, i) => i * 100).map(v => `<line class="${v ? "grid" : "base"}" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"></line><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">₹${v}</text>`).join("")}
            ${WAGES.map((r, i) => (i % (narrow ? 5 : 2) === 0 || i === n - 1) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${r.year}</text>` : "").join("")}
            ${WAGE_JOBS.map(([ k, , c ]) => `<path class="ln" style="stroke:${c};stroke-width:${k === "farm" ? 3 : 2.1}" d="${WAGES.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r[k]).toFixed(1)}`).join("")}"></path>`).join("")}
            ${narrow ? "" : ends.map(e => `<text class="${e.k === "farm" ? "lbl-strong" : "lbl"}" x="${x(n - 1) + 8}" y="${e.y + 4}">${SHORT[e.k]} ₹${W1[e.k].toFixed(0)}</text>`).join("")}
        </svg>`;
        const pb = $("premium-box"), PW = pb.clientWidth;
        const rows = WAGE_JOBS.filter(([ k ]) => k !== "farm"), lw = narrow ? 128 : 160, rowH = 34, plotW = PW - lw - 60;
        const top = Math.ceil(Math.max(...rows.flatMap(([ k ]) => [ prem(W0, k), prem(W1, k) ])) / 20) * 20;
        const px = (v : number) => lw + Math.max(0, v) / top * plotW;
        pb.innerHTML = `<div class="legend"><span><i class="sw" style="background:#ffffff;box-shadow:inset 0 0 0 2px #6b7078;border-radius:50%"></i>${W0.year}</span><span><i class="sw" style="background:#6b7078;border-radius:50%"></i>${W1.year}</span></div>
            <svg width="${PW}" height="${rows.length * rowH + 22}" viewBox="0 0 ${PW} ${rows.length * rowH + 22}" role="img" aria-label="Premium of non-farm jobs over farm work, ${W0.year} and ${W1.year}">
            ${rows.map(([ k, name, c ], i) => { const yy = 12 + i * rowH, a = prem(W0, k), b = prem(W1, k);
                return `<text class="lbl" x="${lw - 12}" y="${yy + 4}" text-anchor="end">${name}</text>
                    <line x1="${px(Math.min(a, b))}" x2="${px(Math.max(a, b))}" y1="${yy}" y2="${yy}" stroke="#d4d7dc" stroke-width="3" stroke-linecap="round"></line>
                    <circle cx="${px(a)}" cy="${yy}" r="6" fill="#ffffff" stroke="${c}" stroke-width="2"></circle>
                    <circle cx="${px(b)}" cy="${yy}" r="7" fill="${c}" stroke="#ffffff" stroke-width="2"></circle>
                    <text x="${px(Math.max(a, b)) + 12}" y="${yy + 4}" style="fill:#26282c">${sgn(a)} → ${sgn(b)}</text>`; }).join("")}
            ${Array.from({ length : top / 20 + 1 }, (_, i) => i * 20).map(v => `<text x="${px(v)}" y="${rows.length * rowH + 18}" text-anchor="middle">${v}%</text>`).join("")}
            </svg>`;
    };

    const drawCharts = () => { drawLines(); drawBars(); drawWages(); };
    drawCharts();
    let rz = 0, lastW = innerWidth;
    on("resize", () => {
        cancelAnimationFrame(rz);
        rz = requestAnimationFrame(() => {
            layout(); if (current) setScene(current, true); size3d();
            // a phone's address bar changes the height on scroll; the charts only care about the width
            if (innerWidth !== lastW) { lastW = innerWidth; drawCharts(); }
        });
    });
    cleanups.push(() => cancelAnimationFrame(rz));

    return () => cleanups.forEach(fn => fn());
};
