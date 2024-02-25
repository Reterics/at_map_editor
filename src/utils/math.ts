import { Point, Rectangle } from "@/src/types/assets";

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


export const randomNum = (max: number, min = 0): number => {
    return Math.random() * (max - min) + min
}

export const randomInt = (max: number, min = 0): number => {
    return Math.round(randomNum(max, min));
}

export const roundToPrecision = (value: number, precision: number) => {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}