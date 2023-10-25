import Layout from "@/components/layout";
import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {
    BsPencilSquare,
    BsFillTrashFill
} from "react-icons/bs";
import {ATMap} from "@/src/types/map";
import CanvasEditor from "@/components/lib/CanvasEditor";
import {Asset, AssetObject, AssetType, Rectangle} from "@/src/types/assets";
import {degToRad} from "@/src/utils/math";


export default function Editor() {
    const assets: AssetObject[] = [
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
    ]; // TODO: Make dynamic
    const [reference, setReference] = useState(assets[0]);


    return (
        <Layout>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <CanvasEditor reference={reference} />
            </div>
            <div className="flex flex-row flex-wrap mt-4 overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full">

                {assets.map((asset) =>
                    <a href="#" key={asset.type} onClick={()=>setReference(asset)} className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 mr-2">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{asset.type}</h5>
                        <p className="font-normal text-gray-700 dark:text-gray-400">Click Here to activate asset</p>
                    </a>
                )}

            </div>
        </Layout>
    )
}