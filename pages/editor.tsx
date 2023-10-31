"use client";
import Layout from "@/components/layout";
import {useEffect, useRef, useState} from "react";
import {
    BsFillGrid1X2Fill,
    BsBadge3DFill,
    BsFillMapFill,
    BsFillSquareFill, BsFillCircleFill, BsSlashLg, BsPaintBucket
} from "react-icons/bs";
import CanvasEditor from "@/components/lib/CanvasEditor";
import {AssetObject} from "@/src/types/assets";
import {degToRad} from "@/src/utils/math";
import ThreeComponent from "@/components/lib/ThreeComponent";
import {LayoutType} from "@/src/types/general";


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
    const [items, setItems] = useState<AssetObject[]>([]);
    const [layout, setLayout] = useState<LayoutType>("normal");
    const [editorDimensions, setEditorDimensions] =
        useState([0, 0]);
    const [reference, setReference] = useState(assets[3]);
    const colorRef = useRef(null);


    const padding = {
        top: 100,
        left: 10,
        right: 10,
    }
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setEditorDimensions([
                (layout === "normal" ? window.innerWidth / 2 - padding.left - padding.right  :
                    window.innerWidth - padding.left - padding.right),
                (layout === "normal" ? window.innerHeight / 1.5 - padding.top :
                    window.innerHeight - padding.top)
            ])
        }
    }, []);

    const switchUI = () => {
        switch (layout) {
            case "normal":
                setLayout("canvas");
                break;
            case "canvas":
                setLayout("three");
                break;
            case "three":
                setLayout("normal");
                break;
        }
    };

    const setReferenceType = (type: string) => {
        const asset = assets.find(a=>a.type === type);
        setReference(Object.assign({}, asset));
    }

    return (
        <Layout>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <button onClick={()=>switchUI()} type="button"
                        className="p-2 text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100
                        hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white
                        dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white mr-1">

                    {layout === "normal" ? (<BsFillGrid1X2Fill />) : layout === "three" ? (<BsBadge3DFill />) :
                        (<BsFillMapFill />)}
                </button>
                <button type="button" onClick={()=>colorRef.current && (colorRef.current as HTMLInputElement).click()}
                    className="p-2 text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100
                    hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600
                    dark:focus:ring-blue-500 dark:focus:text-white mr-1"
                style={{backgroundColor: reference.color || '#000000'}}>
                    <input ref={colorRef} type="color" className="hidden" value={reference.color || '#000000'}
                           onChange={(e) => setReference({...reference, color: e.target.value})}/>
                    <BsPaintBucket />
                </button>
            </div>
            <div className="flex flex-row justify-around">
                {
                    (layout === "normal" || layout === "canvas") && <div className="relative overflow-x-auto shadow-md
                    max-w-screen-xl m-auto w-full mt-2 p-0">
                        <CanvasEditor reference={reference}
                                      items={items}
                                      width={editorDimensions[0]}
                                      height={editorDimensions[1]}
                                      setItems={setItems}/>
                    </div>
                }
                {
                    (layout === "normal" || layout === "three") && <div className="relative overflow-x-auto shadow-md
                    max-w-screen-xl m-auto w-full mt-2 border-2 p-0">
                        <ThreeComponent items={items}
                                        width={editorDimensions[0]}
                                        height={editorDimensions[1]} />
                    </div>
                }

            </div>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">

                <button onClick={()=>setReferenceType("rect")}
                        style={{borderColor: reference.type === "rect" ? 'white' : "gray"}}
                    className="p-2 text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-100
                    hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600
                    dark:focus:ring-blue-500 dark:focus:text-white mr-1">
                    <BsFillSquareFill />
                </button>

                <button onClick={()=>setReferenceType("circle")}
                        style={{borderColor: reference.type === "circle" ? 'white' : "gray"}}
                    className="p-2 text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-100
                    hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600
                    dark:focus:ring-blue-500 dark:focus:text-white mr-1">
                    <BsFillCircleFill />
                </button>
                <button onClick={()=>setReferenceType("line")}
                         style={{borderColor: reference.type === "line" ? 'white' : "gray"}}
                    className="p-2 text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-100
                    hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600
                    dark:focus:ring-blue-500 dark:focus:text-white mr-1">
                    <BsSlashLg />
                </button>

                {
                    (layout === "normal" || layout === "canvas") && <div className="flex flex-row flex-wrap mt-4 overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full">
                        {assets.filter(assets=>assets.type === "model").map((asset) =>
                            <a href="#" key={asset.type} onClick={()=>setReference(asset)} className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 mr-2">
                                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{asset.type}</h5>
                                <p className="font-normal text-gray-700 dark:text-gray-400">Click Here to activate asset</p>
                            </a>
                        )}
                    </div>
                }
            </div>


        </Layout>
    )
}