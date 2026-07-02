// REACT CORE ==========================================================================================================
import React, { useRef, useEffect, useState, useCallback } from "react";

// UI ==================================================================================================================
import { Div } from "fictoan-react";

interface Config {
        gridGap           : number;
        arrowSize         : number;
        lensRadius        : number;
        lensMagnification : number;
        damping           : number;
}

interface DataPoint {
        x     : number;
        y     : number;
        id    : string;
        price : string;
        trend : number;
        // -1 (Bearish) to 1 (Bullish)
        volatility : number;
        // 0 to 1
        baseAngle : number;
        // The original angle derived from trend
        currentAngle : number;
        // The animated angle
        currentScale : number;
        // The animated scale
}

interface MouseState {
        x      : number;
        y      : number;
        active : boolean;
}

export const FieldLines : React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // Configuration State
    const [ config, setConfig ] = useState<Config>({
        gridGap           : 40,
        arrowSize         : 12,
        lensRadius        : 200,
        lensMagnification : 2,
        damping           : 0.15,
    });

    const mouseRef = useRef<MouseState>({x : -1000, y : -1000, active : false});
    const dataGridRef = useRef<DataPoint[]>([]);

    // Generate Mock Data
    const generateData = useCallback((width : number, height : number) => {
        const cols = Math.ceil(width / config.gridGap);
        const rows = Math.ceil(height / config.gridGap);
        const newData : DataPoint[] = [];

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * config.gridGap + config.gridGap / 2;
                const y = j * config.gridGap + config.gridGap / 2;

                // Generate random "Market Data"
                const trend = (Math.random() * 2 - 1); // -1 to 1
                const volatility = Math.random();
                const price = (Math.random() * 1000).toFixed(2);

                // Map trend to angle: -1 (Down) = PI/2, 1 (Up) = -PI/2
                const baseAngle = -trend * (Math.PI / 2);

                newData.push({
                    x, y,
                    id           : `${i}-${j}`,
                    price,
                    trend,
                    volatility,
                    baseAngle,
                    currentAngle : baseAngle,
                    currentScale : 1,
                });
            }
        }
        dataGridRef.current = newData;
    }, [ config.gridGap ]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const {width, height} = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                canvasRef.current.width = width * dpr;
                canvasRef.current.height = height * dpr;
                canvasRef.current.style.width = `${width}px`;
                canvasRef.current.style.height = `${height}px`;

                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    generateData(width, height);
                }
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [ generateData ]);

    // Helper: Draw Arrow
    const drawArrow = (
        ctx : CanvasRenderingContext2D,
        x : number,
        y : number,
        angle : number,
        size : number,
        color : string,
        alpha : number,
    ) => {
        ctx.save();
        ctx.translate(x, y);

        // Rotate by +45deg (PI/4) to normalize the SVG's naturally -45deg orientation
        ctx.rotate(angle + Math.PI / 4);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const s = size / 12; // Scale factor based on approx 12x12 grid

        // Bracket shape (Polyline)
        ctx.beginPath();
        ctx.moveTo((3 - 6.5) * s, (1 - 5.5) * s);   // 3,1
        ctx.lineTo((11 - 6.5) * s, (1 - 5.5) * s);  // 11,1
        ctx.lineTo((11 - 6.5) * s, (9 - 5.5) * s);  // 11,9
        ctx.stroke();

        // Shaft (Line)
        ctx.beginPath();
        ctx.moveTo((2 - 6.5) * s, (10 - 5.5) * s);  // 2,10
        ctx.lineTo((11 - 6.5) * s, (1 - 5.5) * s);  // 11,1
        ctx.stroke();

        ctx.restore();
    };

    // Main Animation Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const {width, height} = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);

        // 1. Update Physics/State
        dataGridRef.current.forEach(point => {
            const dx = mouseRef.current.x - point.x;
            const dy = mouseRef.current.y - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetScale = 1;
            let targetAngle = point.baseAngle;

            if (mouseRef.current.active && dist < config.lensRadius) {
                // Smooth cosine falloff
                const normDist = dist / config.lensRadius;
                const influence = (Math.cos(normDist * Math.PI) + 1) / 2;

                targetScale = 1 + (config.lensMagnification - 1) * influence;

                // Angle to mouse
                const angleToMouse = Math.atan2(dy, dx);

                let angleDiff = angleToMouse - point.baseAngle;
                // Normalize to shortest path
                while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                targetAngle = point.baseAngle + angleDiff * influence;
            }

            // Smooth interpolation for scale
            point.currentScale += (targetScale - point.currentScale) * config.damping;

            // Smooth interpolation for angle
            let angleDiff = targetAngle - point.currentAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            point.currentAngle += angleDiff * config.damping;
        });

        // 2. Render Loop
        dataGridRef.current.forEach(point => {
            const isTrendUp = point.trend > 0;
            const baseColor = isTrendUp ? "74, 222, 128" : "248, 113, 113"; // Tailwind Green-400 : Red-400

            let alpha = 0.4;
            if (point.currentScale > 1.1) alpha = 1;
            else if (mouseRef.current.active) alpha = 0.2;

            const size = config.arrowSize * point.currentScale;

            drawArrow(ctx, point.x, point.y, point.currentAngle, size, `rgb(${baseColor})`, alpha);
        });

        // Draw Lens Ring
        if (mouseRef.current.active) {
            ctx.beginPath();
            ctx.arc(mouseRef.current.x, mouseRef.current.y, config.lensRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [ config ]);

    // Event Handlers
    const handleMouseMove = useCallback((e : React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current = {
            x      : e.clientX - rect.left,
            y      : e.clientY - rect.top,
            active : true,
        };
    }, []);

    const handleMouseLeave = useCallback(() => {
        mouseRef.current.active = false;
    }, []);

    // Initialisation
    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [ animate ]);

    return (
        <Div
            id="field-lines"
            ref={containerRef}
            className="absolute inset-0 z-0 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas ref={canvasRef} className="block" />
        </Div>
    );
};