import {useEffect, useRef, useState} from "react";
import {Asset, AssetObject, Point} from "@/src/types/assets";
import {Draw} from "@/src/utils/math";


export default function CanvasEditor({
    reference
}: {
    reference: AssetObject
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawer, setDrawer] = useState<Draw|null>(null);
    const [items, setItems] = useState([] as Asset[]);


    const render = () => {
        if (drawer) {
            console.log('Render')
            drawer.render(items);
        }
    }

    useEffect(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                setDrawer(new Draw(context, canvasRef.current))
            }
        }
    }, [canvasRef]);

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
        className="w-full h-full border-black"
        onClick={(e) => onClick(e as unknown as MouseEvent)}
        >

        </canvas>
    )
}