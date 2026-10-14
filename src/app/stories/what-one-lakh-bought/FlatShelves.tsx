"use client";

// The shelves on a phone, where the isometric rack is too small to read: a flat grid of five cards, one a thing, each
// with its name, unit and the year's count on top and its units laid flat beneath, the year's units solid and the
// rest of the first year's pile as faint ghosts, the part unit filled to its fraction. It takes the same shelves
// ShelvesStage takes.

// REACT CORE ==========================================================================================================
import type { CSSProperties } from "react";

// LOCAL ===============================================================================================================
import type { StageShelf } from "./ShelvesStage";

export const FlatShelves = ({ shelves } : { shelves : StageShelf[] }) => (
    <div className="flat-shelves" aria-hidden="true">
        {shelves.map(s => (
            <div key={s.key} className={`flat-shelf is-${s.key}`}>
                <div className="flat-shelf-head">
                    <span className="flat-shelf-name">{s.name}</span>
                    <span className="flat-shelf-unit">{s.unit}</span>
                </div>
                <div className={`flat-shelf-count ${s.missing ? "is-missing" : ""}`}>{s.count}</div>
                <div className="flat-units">
                    {Array.from({ length : Math.max(1, s.max) }, (_, i) => {
                        const part = Math.max(0, Math.min(1, s.have - i));          // 1 a whole unit, a fraction the last
                        return <span key={i} className="flat-unit" style={{ "--fill" : `${part * 100}%` } as CSSProperties} />;
                    })}
                </div>
            </div>
        ))}
    </div>
);
