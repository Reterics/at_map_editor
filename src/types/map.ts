import { AssetObject } from "@/src/types/assets";

export interface ATMap {
    created: number;
    author: string;
    name: string;
    id?: string;
    items: AssetObject[]
    texture?: string,
    spawn?: boolean
}


export interface Coordinates {
    x: number;
    y: number;
}