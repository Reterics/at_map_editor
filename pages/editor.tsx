"use client";
import Layout from "@/components/layout";
import {useEffect, useRef, useState} from "react";
import {
    BsFillGrid1X2Fill,
    BsBadge3DFill,
    BsFillMapFill,
    BsFillSquareFill,
    BsFillCircleFill,
    BsSlashLg,
    BsPaintBucket,
    BsFillCursorFill,
    BsEraserFill,
    BsDownload,
    BsFileEarmark,
    BsFolder2Open,
    BsGeoAlt,
    BsGlobeAmericas,
    BsArrowsFullscreen
} from "react-icons/bs";
import CanvasEditor from "@/components/lib/CanvasEditor";
import {AssetObject} from "@/src/types/assets";
import {degToRad} from "@/src/utils/math";
import ThreeComponent from "@/components/lib/ThreeComponent";
import {LayoutType, ThreeControlType} from "@/src/types/general";
import {downloadAsFile, readTextFile} from "@/src/utils/general";
import ToolbarButton from "@/components/form/ToolbarButton";


export default function Editor() {
    const assets: AssetObject[] = [
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
    ]; // TODO: Make dynamic
    const ground = '/assets/textures/green-grass-textures.jpg';
    const [items, setItems] = useState<AssetObject[]>([]);
    const [layout, setLayout] = useState<LayoutType>("normal");
    const [editorDimensions, setEditorDimensions] =
        useState([0, 0]);
    const [reference, setReference] = useState(assets[3]);
    const [threeControl, setThreeControl] = useState<ThreeControlType>("orbit");
    const colorRef = useRef(null);

    const selected = items.find(item=>item.selected);

    useEffect(() => {
        const padding = {
            top: 100,
            left: 10,
            right: 10,
        };
        if (typeof window !== 'undefined') {
            setEditorDimensions([
                (layout === "normal" ? window.innerWidth / 2 - padding.left - padding.right  :
                    window.innerWidth - padding.left - padding.right),
                (layout === "normal" ? window.innerHeight / 1.5 - padding.top :
                    window.innerHeight - padding.top)
            ])
        }
    }, [layout]);

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

    const deleteSelected = (): void => {
        setItems([...items.filter((item) => !item.selected)]);
    };

    const exportData = () => {
        const name = "map-" + new Date().toISOString() + ".json";
        downloadAsFile(name, JSON.stringify(items), 'application/json');
    }

    const importData = async function () {
        const file = await readTextFile();
        if (file && typeof file.value === "string") {
            const json = JSON.parse(file.value);

            if (Array.isArray(json)) {
                setItems(json);
            }
        }
    }

    const reset = async function () {
        if (window.confirm('Are you sure you wish to reset this project?')) {
            setItems([])
        }
    }

    return (
        <Layout>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <ToolbarButton onClick={()=>reset()}>
                    <BsFileEarmark />
                </ToolbarButton>

                <ToolbarButton onClick={()=>importData()}>
                    <BsFolder2Open />
                </ToolbarButton>

                <ToolbarButton onClick={()=>exportData()}>
                    <BsDownload />
                </ToolbarButton>

                <ToolbarButton onClick={()=>switchUI()}>
                    {layout === "normal" ? (<BsFillGrid1X2Fill />) : layout === "three" ? (<BsBadge3DFill />) :
                        (<BsFillMapFill />)}
                </ToolbarButton>

                <ToolbarButton onClick={()=>colorRef.current && (colorRef.current as HTMLInputElement).click()}
                                style={{backgroundColor: reference.color || '#000000'}}>
                    <input ref={colorRef} type="color" className="hidden" value={reference.color || '#000000'}
                           onChange={(e) => setReference({...reference, color: e.target.value})}/>
                    <BsPaintBucket />
                </ToolbarButton>

                {selected && <ToolbarButton onClick={()=>deleteSelected()}>
                                <BsEraserFill />
                            </ToolbarButton>
                }

                <ToolbarButton
                    style={{float:"right"}}
                    onClick={() => setThreeControl("orbit")}
                    active={threeControl === "orbit"}>
                    <BsGlobeAmericas />
                </ToolbarButton>
                <ToolbarButton
                    style={{float:"right"}}
                    onClick={() => setThreeControl("object")}
                    active={threeControl === "object"}>
                    <BsGeoAlt />
                </ToolbarButton>
                <ToolbarButton
                    style={{float:"right"}}
                    onClick={() => setThreeControl("trackball")}
                    active={threeControl === "trackball"}>
                    <BsArrowsFullscreen />
                </ToolbarButton>
            </div>
            <div className="flex flex-row justify-around">
                {
                    (layout === "normal" || layout === "canvas") && <div className="relative overflow-x-auto shadow-md
                    max-w-screen-xl m-auto w-full mt-2 p-0">
                        <CanvasEditor reference={reference}
                                      items={items}
                                      width={editorDimensions[0]}
                                      height={editorDimensions[1]}
                                      setItems={setItems}
                                      ground={ground}
                        />
                    </div>
                }
                {
                    (layout === "normal" || layout === "three") && <div className="relative overflow-x-auto shadow-md
                    max-w-screen-xl m-auto w-full mt-2 border-2 p-0">
                        <ThreeComponent items={items}
                                        selected={selected}
                                        width={editorDimensions[0]}
                                        height={editorDimensions[1]}
                                        setItems={setItems}
                                        reference={reference}
                                        threeControl={threeControl}
                                        ground={ground}
                        />
                    </div>
                }

            </div>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">

                <ToolbarButton onClick={()=>setReferenceType("cursor")}
                                active={reference.type === "cursor"}>
                    <BsFillCursorFill />
                </ToolbarButton>

                <ToolbarButton onClick={()=>setReferenceType("rect")}
                                active={reference.type === "rect"}>
                    <BsFillSquareFill />
                </ToolbarButton>

                <ToolbarButton onClick={()=>setReferenceType("circle")}
                                active={reference.type === "circle"}
                    >
                    <BsFillCircleFill />
                </ToolbarButton>

                <ToolbarButton onClick={()=>setReferenceType("line")}
                                active={reference.type === "line"}>
                    <BsSlashLg />
                </ToolbarButton>

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