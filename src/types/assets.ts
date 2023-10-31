
export type AssetType = 'point'|'circle'|'rect'|'line'|'model';

export interface Asset {
    id?: string,
    name?: string,
    image?: string,
    type: AssetType,
    x?: number,
    y?: number,
    color?: string
}

export interface Point extends Asset {
    type: 'point',
    x: number,
    y: number
}

export interface Circle extends Asset{
    type: 'circle',
    x: number,
    y: number,
    radius: number,
    startAngle?: number,
    endAngle?: number,
    anticlockwise?: boolean
}

export interface Rectangle extends Asset {
    type: 'rect',
    x: number,
    y: number,
    w: number,
    h: number
}

export interface Line extends Asset {
    type: 'line',
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

export type AssetObject = Asset|Rectangle|Circle|Line|Point;
