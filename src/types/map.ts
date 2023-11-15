import { AssetObject } from "@/src/types/assets";

export interface ATMap {
    created: number;
    author: string;
    name: string;
    id?: string;
    items?: AssetObject[]
}

