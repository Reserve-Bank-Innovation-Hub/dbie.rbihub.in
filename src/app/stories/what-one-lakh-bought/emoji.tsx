// A name that opens with an emoji, the emoji set a little larger than the words beside it. One helper for HTML text
// and one for SVG text, since an SVG label cannot hold a span.
const LEAD = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s+(.*)$/u;

export const emo = (s : string) => {
    const m = s.match(LEAD);
    return m ? <span className="named"><span className="emo" aria-hidden="true">{m[1]}</span> {m[2]}</span> : s;
};
export const emoSvg = (s : string) => {
    const m = s.match(LEAD);
    return m ? <><tspan className="emo">{m[1]}</tspan> {m[2]}</> : s;
};
