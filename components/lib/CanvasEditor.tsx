"use client";
import {useEffect, useRef, useState} from "react";
import {Asset, AssetObject, Point} from "@/src/types/assets";
import {Draw} from "@/src/utils/math";


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
        if (currentPoint) {
            console.log('Add item', items);
            const target = {...reference, ...currentPoint} as Asset;
            setItems([...items, target])
        }
    }

    return (
        <canvas
        ref={canvasRef}
        className="w-full h-full border-black rounded-none p-0 m-0"
        onClick={(e) => onClick(e as unknown as MouseEvent)}
        width={width}
        height={height}
        >

        </canvas>
    )
}