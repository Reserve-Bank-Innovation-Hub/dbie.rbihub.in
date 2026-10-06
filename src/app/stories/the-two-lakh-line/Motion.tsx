"use client";

// The page's motion kit: numbers that count or glide to a new value, blocks that rise into view, a title whose
// letters rise, and a line whose words light as it scrolls past. All of it respects prefers-reduced-motion: the
// numbers land on their value and the blocks simply appear.

// REACT CORE ==========================================================================================================
import { ReactNode, useEffect, useRef, useState } from "react";

// ANIMATION ===========================================================================================================
import { animate, motion, MotionValue, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";

const EASE_OUT = [ 0.16, 1, 0.3, 1 ] as const;

// A number that glides from its last value to its new one whenever `value` changes.
export const AnimatedNumber = ({ value, format, duration = 0.9 } : { value : number; format : (v : number) => string; duration ? : number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const last = useRef(value);
    const reduced = useReducedMotion();
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (reduced || last.current === value) { el.textContent = format(value); last.current = value; return; }
        const controls = animate(last.current, value, { duration, ease : EASE_OUT, onUpdate : v => { el.textContent = format(v); } });
        last.current = value;
        return () => controls.stop();
    }, [ value, format, duration, reduced ]);
    return <span ref={ref}>{format(value)}</span>;
};

// A number that counts up from `from` the first time it starts: when `start` turns true, or on scrolling into view
// when `start` is left out. Screen readers get the final value.
export const CountUp = ({ to, from = 0, format, start, duration = 1.4, className } : {
    to : number; from ? : number; format : (v : number) => string; start ? : boolean; duration ? : number; className ? : string;
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once : true, amount : 0.6 });
    const reduced = useReducedMotion();
    const [ done, setDone ] = useState(false);
    const go = start ?? inView;
    // With reduced motion the number is simply there, from the first paint after hydration.
    useEffect(() => {
        if (reduced && ref.current) { ref.current.textContent = format(to); setDone(true); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ reduced ]);
    useEffect(() => {
        const el = ref.current;
        if (!el || done || !go || reduced) return;
        setDone(true);
        const controls = animate(from, to, { duration, ease : EASE_OUT, onUpdate : v => { el.textContent = format(v); } });
        return () => controls.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ go ]);
    return (
        <span className={className}>
            <span className="sr-only">{format(to)}</span>
            <span ref={ref} aria-hidden="true">{format(from)}</span>
        </span>
    );
};

// A block that rises into place as it scrolls into view.
export const Reveal = ({ children, delay = 0, y = 28, className, amount = 0.25 } : { children : ReactNode; delay ? : number; y ? : number; className ? : string; amount ? : number }) => (
    <motion.div
        className={className}
        initial={{ opacity : 0, y }}
        whileInView={{ opacity : 1, y : 0 }}
        viewport={{ once : true, amount }}
        transition={{ duration : 0.8, ease : EASE_OUT, delay }}
    >
        {children}
    </motion.div>
);

// A title whose letters rise one after another.
export const LetterRise = ({ text, className } : { text : string; className ? : string }) => (
    <motion.span
        className={className}
        initial="hidden" whileInView="shown" viewport={{ once : true, amount : 0.6 }}
        transition={{ staggerChildren : 0.045 }}
        aria-label={text} role="text"
    >
        {[ ...text ].map((ch, i) => (
            <motion.span
                key={i} aria-hidden="true" style={{ display : "inline-block", whiteSpace : "pre" }}
                variants={{ hidden : { opacity : 0, y : "0.6em", rotate : 6 }, shown : { opacity : 1, y : 0, rotate : 0 } }}
                transition={{ duration : 0.7, ease : EASE_OUT }}
            >
                {ch}
            </motion.span>
        ))}
    </motion.span>
);

// A sentence whose words brighten one by one as it scrolls up the screen. The server and the first client render
// are the same either way; with reduced motion the words are simply lit once the page has hydrated.
const Word = ({ word, progress, range, lit } : { word : string; progress : MotionValue<number>; range : [ number, number ]; lit : boolean }) => {
    const opacity = useTransform(progress, range, [ 0.16, 1 ]);
    return <motion.span style={{ opacity : lit ? 1 : opacity }}>{word} </motion.span>;
};
export const WordReveal = ({ text, className } : { text : string; className ? : string }) => {
    const ref = useRef<HTMLParagraphElement>(null);
    const { scrollYProgress } = useScroll({ target : ref, offset : [ "start 0.9", "end 0.45" ] });
    const reduced = useReducedMotion();
    const [ lit, setLit ] = useState(false);
    useEffect(() => { setLit(!!reduced); }, [ reduced ]);
    const words = text.split(" ");
    return (
        <p ref={ref} className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((w, i) => <Word key={i} word={w} progress={scrollYProgress} range={[ i / words.length, (i + 1) / words.length ]} lit={lit} />)}
            </span>
        </p>
    );
};
