"use client";
import {useEffect, useRef, useState} from "react";
import {Asset, AssetObject, Point, Line, Rectangle, Circle} from "@/src/types/assets";
import {Draw, getDistance, isPointInRectangle, isPointInsideCircle, isPointOnLine} from "@/src/utils/math";

let isDrawing = false; // Track if the mouse is being held down
let startX: number,
    startY: number;

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
            const updatedItems = items.map(item => {
                switch (item.type) {
                    case "rect":
                        item.selected = isPointInRectangle(currentPoint, item as Rectangle);
                        break;
                    case "line":
                        const line = item as Line;
                        item.selected = isPointOnLine(currentPoint.x, currentPoint.y, line.x1, line.y1, line.x2,
                            line.y2);
                        break;
                    case "circle":
                        const circle = item as Circle;
                        item.selected = isPointInsideCircle(currentPoint.x, currentPoint.y, circle.x, circle.y,
                            circle.radius);
                        break;
                    default:
                        item.selected = false;
                }

                return item;
            });
            setItems(updatedItems)
        }
    }

    const getCurrentAsset = (mousePoint: Point): Asset|null => {
        const endX = mousePoint.x;
        const endY = mousePoint.y;
        let distance;
        switch (reference.type) {
            case "rect":
                // distance = getDistance(startX, startY, endX, endY);
                return {
                    ...reference,
                    x: startX,
                    y: startY,
                    w: mousePoint.x - startX,
                    h: mousePoint.y - startY
                } as Rectangle;
            case "line":
                return {
                    ...reference,
                    x1: startX,
                    x2: endX,
                    y1: startY,
                    y2: endY
                } as Line;
            case "circle":
                distance = getDistance(startX, startY, endX, endY);
                return {
                    ...reference,
                    x: mousePoint.x,
                    y: mousePoint.y,
                    radius: distance || 1
                } as Circle
        }
        return null;
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!isDrawing) return;

        const mousePoint = getPointInCanvas(e);
        if (canvasRef.current && mousePoint) {
            render();
            if (drawer) {
                const asset = getCurrentAsset(mousePoint);
                if (asset) {
                    drawer.renderAsset(asset, false);
                }
            }
        }

    };

    const onMouseDown = (e: MouseEvent) => {
        const mousePoint = getPointInCanvas(e);
        if (reference.type !== "cursor" && mousePoint && canvasRef.current) {
            isDrawing = true;
            startX = mousePoint.x;
            startY = mousePoint.y;
        }
    };

    const onMouseUp = (e: MouseEvent) => {
        if (startX && startY ) {
            const mousePoint = getPointInCanvas(e);
            if (canvasRef.current && mousePoint) {
                const asset = getCurrentAsset(mousePoint);

                if (asset) {
                    console.log('Add Asset');
                    setItems([...items, asset])
                }
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