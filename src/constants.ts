import { AssetObject, PlaneConfig, WaterConfig } from "@/src/types/assets";
import { ATMap } from "@/src/types/map";
import { degToRad } from "@/src/utils/math";

export const Constants = {
    plane: {
        size: 1000,
        waterLevel: 35
    },
    helperNames: [
        "sky",
        "light",
        "ambientLight",
        "grass",
        "arrows",
        "plane",
        "shadowObject",
        "hud-2d"
    ],
    grass: {
        instances: 1000000
    },
    grid: {
        x: 10,
        y: 10,
        z: 1
    }
}

export const defaultWater: WaterConfig = {
    type: "water",
    flowMap: "/assets/water/height.png",
    normalMap0: "/assets/water/normal0.jpg",
    normalMap1: "/assets/water/normal1.jpg"
};

export const defaultPlane: PlaneConfig = {
    type: "plane",
    texture: "/assets/textures/green-grass-textures.jpg",
    size: 1000
};

export const emptyATMap: ATMap = {
    created: new Date().getTime(),
    author: "",
    name: "",
    items: [
        defaultPlane,
        defaultWater
    ]
}

export const defaultAssets: AssetObject[] = [
    {
        "type": "cursor"
    },
    {
        "type": "point"
    },{
        "type": "circle",
        "radius": 2,
        "startAngle": degToRad(0),
        "endAngle": degToRad(360)
    },{
        "type": "rect",
        "w": 3,
        "h": 3
    },{
        "type": "line"
    },
];

