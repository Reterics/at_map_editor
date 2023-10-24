
export type AssetType = 'point'|'circle'|'rect'|'line'

export interface Asset {
    type: AssetType
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
    startAngle: number|undefined,
    endAngle: number|undefined,
    anticlockwise: boolean|undefined
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