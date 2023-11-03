import {DrawInterface} from "@/src/types/canvas";
import {Asset, Circle, Line, Point, Rectangle} from "@/src/types/assets";
import {getContrastToHEX, interpolateColor} from "@/src/utils/general";

export const degToRad = (degrees: number) => (Math.PI / 180) * degrees;

export const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const y = x2 - x1, x = y2 - y1;

    return Math.sqrt(x * x + y * y);
};

export const isPointInRectangle = (point: Point, rectangle: Rectangle) => {
    // Check if the point is within the rectangle's bounds
    return point.x >= rectangle.x &&
        point.x <= rectangle.x + rectangle.w &&
        point.y >= rectangle.y &&
        point.y <= rectangle.y + rectangle.h;
};

export const isPointOnLine = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    // Check if the point is on the line
    return Math.abs(y - (m * x + b)) < 1e-6; // Use a small epsilon to account for floating-point precision issues
};

export const isPointInsideCircle = (x: number, y: number, centerX: number, centerY: number, radius: number) => {
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance < radius;
};


export class Draw implements DrawInterface{
    private context: CanvasRenderingContext2D | undefined;
    private canvas: HTMLCanvasElement;
    private backgroundColor: string;
    private fillColor: string;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.backgroundColor = "#ffffff";
        this.fillColor = "#000000";
        this.updateCanvas();
    }

    getContext() {
        return this.context;
    }

    updateCanvas () {
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                this.context = ctx;
            }
            if (this.context) {
                this.context.fillStyle = this.backgroundColor;
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.fillStyle = this.fillColor;
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
            this.context.fill();
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
            this.context.stroke();
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

    renderAsset(asset: Asset, internal: boolean|null|undefined) {
        let contrastedColor = getContrastToHEX(asset.color || "black");
        if (contrastedColor === this.backgroundColor) {
            contrastedColor = interpolateColor(this.backgroundColor, contrastedColor, 100);
        }
        if (asset.color && this.context) {
            this.context.fillStyle = asset.color;
            this.context.strokeStyle = asset.color;
        }
        switch (asset.type) {
            case "circle":
                const c = asset as Circle;

                this.circle(c.x, c.y, c.radius, c.startAngle, c.endAngle, c.anticlockwise);
                if (c.selected && this.context) {
                    this.context.strokeStyle = contrastedColor;
                    this.context.stroke();
                    this.context.strokeStyle = "black";
                }
                break;
            case "line":
                const l = asset as Line;
                if (l.selected && this.context) {
                    this.context.lineWidth *= 2;
                }
                this.line(l.x1, l.y1, l.x2, l.y2);
                if (l.selected && this.context) {
                    this.context.lineWidth /= 2;
                }
                break;
            case "point":
                const p = asset as Point;
                this.circle(p.x, p.y, 1, undefined, undefined, undefined);
                if (p.selected && this.context) {
                    this.context.strokeStyle = contrastedColor;
                    this.context.stroke();
                    this.context.strokeStyle = "black";
                }
                break;
            case "rect":
                const r = asset as Rectangle;
                this.rect(r.x, r.y, r.w, r.h);
                if (r.selected && this.context) {
                    this.context.strokeStyle = contrastedColor;
                    this.context.strokeRect(r.x, r.y, r.w, r.h);
                    this.context.strokeStyle = "black";
                }
                break;
        }
        if (!internal && this.context) {
            this.context.fillStyle = 'black';
        }
    }

    render(assets: Asset[]) {
        assets.forEach(asset => this.renderAsset(asset, true));
        if (this.context) {
            this.context.fillStyle = 'black';
        }
    }

}

