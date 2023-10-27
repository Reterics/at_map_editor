import {DrawInterface} from "@/src/types/canvas";
import {Asset, Circle, Line, Point, Rectangle} from "@/src/types/assets";

export const degToRad = (degrees: number) => (Math.PI / 180) * degrees;


export class Draw implements DrawInterface{
    private context: CanvasRenderingContext2D | undefined;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.updateCanvas();
    }

    updateCanvas () {
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                this.context = ctx;
            }
            if (this.context) {
                this.context.fillStyle = 'white';
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.fillStyle = 'black';
            }
        }
    }

    circle (
        x: number,
        y: number,
        radius: number,
        startAngle: number|undefined,
        endAngle: number|undefined,
        anticlockwise: boolean|undefined): void {

        if (startAngle === undefined) {
            startAngle = degToRad(0);
        }
        if (endAngle === undefined) {
            endAngle = degToRad(360);
        }
        if (this.context) {
            this.context.beginPath();
            this.context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
            this.context.stroke();
        }
    }

    line (
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) {
        if (this.context) {
            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x2, y2);
            this.context.closePath();
        }
    }

    lines (lines: Point[]) {
        if (lines.length > 1 && this.context) {
            const move = lines.shift();
            if (move) {
                this.context.beginPath();
                this.context.moveTo(move.x, move.y);

                let line;
                while (line = lines.shift()) {
                    this.context.lineTo(line.x, line.y);
                }
                this.context.closePath();
            }
        }
    }

    rect (
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        if (this.context) {
            this.context.beginPath();
            this.context.fillRect(x, y, w, h);
        }
    }

    render(assets: Asset[]) {
        assets.forEach(asset => {
            switch (asset.type) {
                case "circle":
                    const c = asset as Circle;
                    this.circle(c.x, c.y, c.radius, c.startAngle, c.endAngle, c.anticlockwise);
                    break;
                case "line":
                    const l = asset as Line;
                    this.line(l.x1, l.y1, l.x2, l.y2);
                    break;
                case "point":
                    const p = asset as Point;
                    this.circle(p.x, p.y, 1, undefined, undefined, undefined);
                    break;
                case "rect":
                    const r = asset as Rectangle;
                    this.rect(r.x, r.y, r.w, r.h);
                    break;
            }
        });
    }
}

