import { Mesh } from "three";

export type AssetType = 'cursor'|'point'|'circle'|'rect'|'line'|'model'|'plane';

export interface Asset {
    id?: string,
    name?: string,
    image?: string,
    type: AssetType,
    x?: number,
    y?: number,
    z?: number,
    color?: string,
    selected?:boolean,
    texture?:string,
    path?:string,
    screenshot?:string
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
    h: number,
}

export interface Line extends Asset {
    type: 'line',
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

export type AssetObject = Asset|Rectangle|Circle|Line|Point|PlaneConfig;

export interface ShadowType extends Mesh {
    refType?: string
}

export interface RenderedPlane extends Mesh {
    isHeightMap?: boolean
}

export interface PlaneConfig extends Asset {
    heightmap?: string
    w: number
    h: number
}

export interface WaterConfig {
    normal?: string
    flow?: string
}