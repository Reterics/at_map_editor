import {Point} from "@/src/types/assets";


export interface DrawCircleFunc {
    (x: number,
     y: number,
     radius: number,
     startAngle?: number,
     endAngle?: number,
     anticlockwise?: boolean): void
}

export interface DrawLineFunc {
    (x1: number,
     y1: number,
     x2: number,
     y2: number): void
}

export interface DrawRectFunc {
    (x: number,
     y: number,
     w: number,
     h: number): void
}


export interface DrawLinesFunc {
    (lines: Point[]): void
}

export interface DrawInterface {
    circle: DrawCircleFunc
    line: DrawLineFunc
    lines: DrawLinesFunc
    rect: DrawRectFunc
}

export interface DrawOptions {
    background?:string
    backgroundColor?:string,
    fillColor?:string
}