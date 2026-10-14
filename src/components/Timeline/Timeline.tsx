"use client";

// A scrubber for a run of years (or any whole-number steps): a play button, a hairline track filled to the value with
// a round knob, a tick beneath for each named step with its label, and the value in mono at the end. The story owns
// the state: it passes the value and takes the change, and if it gives onPlay it gets the play button too. Styled
// from the page's --accent, --ink and --paper where the page sets them, the theme's own colours where it does not.
//
// <Timeline min={2001} max={2026} value={year} onChange={setYear} playing={playing} onPlay={setPlaying} />

// REACT CORE ==========================================================================================================
import { CSSProperties, useId } from "react";

// STYLES ==============================================================================================================
import "./Timeline.css";

export interface TimelineProps {
    min       : number;
    max       : number;
    value     : number;
    onChange  : (value : number) => void;
    step ?    : number;                          // default 1
    playing ? : boolean;                         // with onPlay: the play button's state
    onPlay ?  : (playing : boolean) => void;     // given, a play button leads the track
    named ?   : (value : number) => boolean;     // which steps get a tick and a label: by default the two ends and the
                                                 // multiples of five at least three steps from either end
    format ?  : (value : number) => string;      // how a value reads, in the labels and the readout
    label ?   : string;                          // the slider's accessible name, "Year" by default
    disabled ? : boolean;
    className ? : string;
}

const defaultNamed = (min : number, max : number) => (v : number) => v === min || v === max || (v % 5 === 0 && v - min >= 3 && max - v >= 3);

export const Timeline = ({ min, max, value, onChange, step = 1, playing = false, onPlay, named, format = String, label = "Year", disabled = false, className } : TimelineProps) => {
    const id = useId();
    const span = Math.max(1, max - min);
    const isNamed = named ?? defaultNamed(min, max);
    const steps : number[] = [];
    for (let v = min; v <= max; v += step) steps.push(v);
    const pct = (v : number) => `${(v - min) / span * 100}%`;

    return (
        <div className={`timeline-control ${onPlay ? "" : "no-play"} ${className ?? ""}`}>
            {onPlay && (
                <button type="button" className={`timeline-play ${playing ? "is-playing" : ""}`} aria-pressed={playing} aria-label={playing ? `Pause the ${label.toLowerCase()}s` : `Play the ${label.toLowerCase()}s`} onClick={() => onPlay(!playing)} disabled={disabled}>
                    {playing ? "❚❚" : "▶"}
                </button>
            )}
            <div className="timeline" style={{ "--pct" : pct(value) } as CSSProperties}>
                <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} aria-label={label} aria-valuetext={format(value)} disabled={disabled} />
                <div className="timeline-ticks" aria-hidden="true">
                    {steps.filter(isNamed).map(v => <span key={v} className="timeline-tick" style={{ left : pct(v) }}><i>{format(v)}</i></span>)}
                </div>
            </div>
            <output className="timeline-readout" htmlFor={id}>{format(value)}</output>
        </div>
    );
};
