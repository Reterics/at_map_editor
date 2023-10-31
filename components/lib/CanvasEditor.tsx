"use client";
import {useEffect, useRef, useState} from "react";
import {Asset, AssetObject, Point, Line} from "@/src/types/assets";
import {Draw} from "@/src/utils/math";
import {Simulate} from "react-dom/test-utils";

let isDrawing = false; // Track if the mouse is being held down
let startX: number,
    startY: number,
    tmpCtx: CanvasRenderingContext2D;

export default function CanvasEditor({
    reference,
    items,
    height,
    width,
    setItems
}: {
    reference: AssetObject,
    items: AssetObject[],
    height: number,
    width: number,
    setItems:Function
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawer, setDrawer] = useState<Draw|null>(null);


    const render = () => {
        if (drawer) {
            console.log('Render')
            if (canvasRef.current) {
                drawer.updateCanvas();
                drawer.render(items);
            }
        }
    }

    useEffect(() => {
        if (canvasRef.current) {
            setDrawer(new Draw(canvasRef.current));
        }
    }, [canvasRef.current]);

    if (canvasRef && canvasRef.current && drawer) {
        void render();
    }

    const getPointInCanvas = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        return { x, y } as Point
    }

    const onClick = (e: MouseEvent) => {
        const currentPoint = getPointInCanvas(e)
        if (currentPoint && reference.type !== "line") {
            console.log('Add item', items);
            const target = {...reference, ...currentPoint} as Asset;
            setItems([...items, target])
        }
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!isDrawing) return;

        const mousePoint = getPointInCanvas(e);
        if (canvasRef.current && mousePoint) {
            const endX = mousePoint.x;
            const endY = mousePoint.y;


            render();
            const tmpCtx = drawer?.getContext();
            if (tmpCtx) {
                tmpCtx.beginPath();
                tmpCtx.moveTo(startX, startY);
                tmpCtx.lineTo(endX, endY);
                tmpCtx.stroke();
            }
        }

    };

    const onMouseDown = (e: MouseEvent) => {
        if (reference.type === "line") {
            const mousePoint = getPointInCanvas(e);
            if (mousePoint && canvasRef.current) {
                isDrawing = true;
                startX = mousePoint.x;
                startY = mousePoint.y;
            }
        }
    };

    const onMouseUp = (e: MouseEvent) => {
        if (startX && startY ) {
            const mousePoint = getPointInCanvas(e);
            if (canvasRef.current && mousePoint) {
                const endX = mousePoint.x;
                const endY = mousePoint.y;

                console.log('Add Line');
                const target = {
                    ...reference,
                    x1: startX,
                    y1: startY,
                    x2: endX,
                    y2: endY} as Line;
                setItems([...items, target])
            }
        }
        isDrawing = false;

    };

    return (
        <canvas
        ref={canvasRef}
        className="w-full h-full border-black rounded-none p-0 m-0"
        onClick={(e) => onClick(e as unknown as MouseEvent)}
        onMouseDown={(e)=>onMouseDown(e as unknown as MouseEvent)}
        onMouseUp={(e)=>onMouseUp(e as unknown as MouseEvent)}
        onMouseMove={(e)=>onMouseMove(e as unknown as MouseEvent)}
        width={width}
        height={height}
        >

        </canvas>
    )
}