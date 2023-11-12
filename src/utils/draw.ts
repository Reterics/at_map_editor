import {DrawInterface, DrawOptions} from "@/src/types/canvas";
import {Asset, Circle, Line, Point, Rectangle} from "@/src/types/assets";
import {getContrastToHEX, interpolateColor} from "@/src/utils/general";
import {degToRad} from "@/src/utils/math";

export class Draw implements DrawInterface{
    private context?: CanvasRenderingContext2D | null;
    private readonly canvas: HTMLCanvasElement;

    private backgroundColor: string;
    private fillColor: string;
    private background?: HTMLImageElement;

    private queue: ((resolve: Function) => {})[] = [];
    private _execution?: boolean;

    constructor(canvas: HTMLCanvasElement, options?: DrawOptions) {
        const opt = options || {};
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        if (opt.background) {
            this.background = new Image();
            this.background.src = opt.background;
            void this.pipeline((resolve: Function) => {
                if (this.background) {
                    this.background.onload = function () {
                        resolve();
                    };
                } else {
                    resolve();
                }
            });
        }
        this.backgroundColor = opt.backgroundColor || "#ffffff";
        this.fillColor = opt.fillColor || "#000000";
        void this.pipeline((resolve: Function) => {
            this.updateCanvas();
            resolve();
        });
    }

    protected async pipeline(method?: (resolve: Function) => any) {
        if (method) {
            this.queue.push(method);
        }
        if (this._execution !== true) {
            this._execution = true;
        } else {
            return;
        }

        while (this.queue.length) {
            const current = this.queue.shift();
            if (current) {
                await (new Promise(current)).catch((e) => console.error(e));
            }
        }
        this._execution = false;
    }

    getContext() {
        return this.context;
    }

    updateCanvas() {
        if (this.canvas) {
            if(!this.context) {
                this.context = this.canvas.getContext('2d');
            }
            const ctx = this.context;
            if (this.context) {
                if (this.background) {
                    const pattern = this.context.createPattern(this.background, 'repeat');
                    if (pattern) {
                        this.context.fillStyle = pattern;
                        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    } else {
                        this.context.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
                    }
                } else {
                    this.context.fillStyle = this.backgroundColor;
                    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
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

    refresh(assets: Asset[]) {
        void this.pipeline((resolve) => {
            this.updateCanvas();
            this.render(assets);
            resolve();
        });
    }
}

