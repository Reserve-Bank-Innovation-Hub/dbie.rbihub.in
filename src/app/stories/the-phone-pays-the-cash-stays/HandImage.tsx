"use client";

// The UPI wall's hand and phone as a picture (rainScene.ts, handImage), rendered once in the browser and shared by
// every copy on the page. three.js loads only when the first copy mounts.

// REACT CORE ==========================================================================================================
import { useEffect, useState } from "react";

let pending : Promise<string> | null = null;
const load = () => (pending ??= import("./rainScene").then(m => m.handImage(360)).catch(() => ""));

export const HandImage = ({ width, className } : { width : number; className? : string }) => {
    const [ src, setSrc ] = useState("");
    useEffect(() => { let on = true; load().then(u => { if (on) setSrc(u); }); return () => { on = false; }; }, []);
    const height = width / 0.6;
    return src
        ? <img className={`hand-icon ${className ?? ""}`} src={src} width={width} height={height} style={{ width, height, maxWidth : "none" }} alt="" aria-hidden="true" />
        : <span className={`hand-icon ${className ?? ""}`} style={{ display : "inline-block", width, height }} aria-hidden="true" />;
};
