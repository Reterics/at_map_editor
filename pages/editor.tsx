"use client";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import {
    BsArrowsFullscreen,
    BsBadge3DFill,
    BsDownload,
    BsFileEarmark,
    BsFillCircleFill,
    BsFillCursorFill,
    BsFillGrid1X2Fill,
    BsFillMapFill,
    BsFillPinMapFill,
    BsFillSquareFill,
    BsFloppy,
    BsFolder2Open,
    BsGeoAlt,
    BsGlobeAmericas, BsMap,
    BsSlashLg, BsTree, BsTreeFill, BsWater
} from "react-icons/bs";
import CanvasEditor from "@/components/lib/CanvasEditor";
import { AssetObject, PlaneConfig, WaterConfig  } from "@/src/types/assets";
import { degToRad } from "@/src/utils/math";
import ThreeComponent from "@/components/lib/ThreeComponent";
import { LayoutType, ThreeControlType } from "@/src/types/general";
import { downloadAsFile, readFileAsURL, readTextFile } from "@/src/utils/general";
import ToolbarButton from "@/components/form/ToolbarButton";
import { useSearchParams } from 'next/navigation';
import { db, firebaseCollections, getById } from "@/src/firebase/config";
import { ATMap } from "@/src/types/map";
import StyledInput from "@/components/form/StyledInput";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import StyledSelect from "@/components/form/StyledSelect";
import { StyledSelectOption } from "@/src/types/inputs";
import CustomizeTools from "@/components/lib/CustomizeTools";
import { getTypedAsset, refreshAssets } from "@/src/utils/assets";
import { debounce } from "@/src/utils/react";

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

export default function Editor() {
    const [ assets, setAssets ] = useState<AssetObject[]>(defaultAssets);

    const searchParams = useSearchParams()
    const id = searchParams && searchParams.get('id') ?  searchParams.get('id') : undefined;
    const name = searchParams && searchParams.get('name') ? searchParams.get('name') : "";

    const [grassEnabled, setGrassEnabled] = useState<boolean>(true);
    const [map, setMap] = useState<ATMap>({ ...emptyATMap });

    const setItems = (items: AssetObject[]) => setMap({ ...map, items: items });

    const [layout, setLayout] = useState<LayoutType>("three");
    const [editorDimensions, setEditorDimensions] =
        useState([0, 0]);
    const [reference, setReference] = useState(assets[3]);
    const [threeControl, setThreeControl] = useState<ThreeControlType>("orbit");

    const selected = map.items.find(item=>item.selected);

    const updateMapFromCloud = async (id: string) => {
        const map = await getById(id, firebaseCollections.maps);
        if (map) {
            setMap({ id: id, ...map } as ATMap);
        }
    };
    useEffect(() => {
        if (id) {
            void updateMapFromCloud(id);
        }
    }, [id]);

    useEffect(() => {
        if (name) {
            setMap((m)=> {
                return { ...m, name: name }
            });
        }
    }, [name]);

    const saveMap = async () => {
        const now = new Date().getTime();
        if (map.id) {
            if (layout === "canvas") {
                const canvasEditor = document.getElementById('canvasEditor') as HTMLCanvasElement;
                if (canvasEditor) {
                    map.texture = canvasEditor.toDataURL("image/png");
                }
            }
            const useRef = doc(db, firebaseCollections.maps, map.id);
            await updateDoc(useRef, {
                ...map,
                modified: now
            });
            alert("Map saved.");
        } else if (map.name) {
            const useRef = doc(collection(db, firebaseCollections.maps));
            await setDoc(useRef, {
                id: useRef.id,
                ...map,
                created: now
            });
            setMap({ ...map, id: useRef.id });
            alert("Map saved.");
        } else {
            alert("Name must be given");
        }
    }

    useEffect(() => {
        const padding = {
            top: 100,
            left: 20,
            right: 20,
            bottom: 100
        };
        if (typeof window !== 'undefined') {
            setEditorDimensions([
                (layout === "normal" ? window.innerWidth / 2 - padding.left - padding.right  :
                    window.innerWidth - padding.left - padding.right),
                (layout === "normal" ? window.innerHeight / 1.5 - padding.top :
                    window.innerHeight - padding.top - padding.bottom)
            ])
        }
    }, [layout]);

    useEffect(() => {
        void refreshAssets((externalAssets: AssetObject[]) => setAssets(defaultAssets.concat(externalAssets)));
    }, []);

    useEffect(() => {

        const debouncedResize = debounce(function () {
            // TODO: Remove code duplication
            const padding = {
                top: 100,
                left: 20,
                right: 20,
                bottom: 100
            };
            if (typeof window !== 'undefined') {
                setEditorDimensions([
                    (layout === "normal" ? window.innerWidth / 2 - padding.left - padding.right  :
                        window.innerWidth - padding.left - padding.right),
                    (layout === "normal" ? window.innerHeight / 1.5 - padding.top :
                        window.innerHeight - padding.top - padding.bottom)
                ])
            }
        }, 1000)
        window.addEventListener('resize', debouncedResize)

        return () => {
            window.removeEventListener('resize', debouncedResize)
        };
    });

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
        if (asset) {
            selectedModel(asset);
        }
    }

    const selectedModel = (asset: AssetObject) => {
        setReference(Object.assign({}, asset));
        if (asset.type !== "cursor" && selected) {
            setItems([...map.items.map(i=> {
                i.selected = false; return i;
            })]);
        }
    }

    const exportData = () => {
        const name = "map-" + new Date().toISOString() + ".json";
        downloadAsFile(name, JSON.stringify(map.items), 'application/json');
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

    const uploadHeightMap = async (): Promise<void> => {
        const data = await readFileAsURL();
        if (data && typeof data.value === "string" && data.value) {
            const plane = getTypedAsset(assets, 'plane') as PlaneConfig || defaultPlane;
            plane.heightMap = data.value;
            setItems([plane, ...map.items.filter(item=>item.type !== 'plane')]);
        }
    };
    const uploadFlowMap = async (): Promise<void> => {
        const flowMap = await readFileAsURL();
        if (flowMap && typeof flowMap.value === 'string' && flowMap.value) {
            const water = getTypedAsset(assets, 'water') as WaterConfig|| defaultWater;
            water.flowMap = flowMap.value;
            setItems([water, ...map.items.filter(item=>item.type !== 'water')]);
        }
    };

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


                <ToolbarButton onClick={()=>saveMap()}>
                    <BsFloppy />
                </ToolbarButton>
                <div className="w-[150px] inline-block">
                    <StyledInput
                        className={"relative z-0 w-full group m-1"}
                        placeholder={"Map Name"}
                        value={map.name}
                        onChange={(e)=>setMap({ ...map, name: e.target.value })} />
                </div>

                <CustomizeTools
                    reference={reference}
                    setItems={setItems}
                    selected={selected}
                    items={map.items}
                    setReference={setReference}
                />

                <ToolbarButton onClick={()=>uploadHeightMap()}>
                    <BsMap />
                </ToolbarButton>


                <ToolbarButton onClick={()=>uploadFlowMap()}>
                    <BsWater />
                </ToolbarButton>


                <ToolbarButton onClick={()=>setGrassEnabled(!grassEnabled)}>
                    {grassEnabled ? <BsTree /> : <BsTreeFill />}
                </ToolbarButton>


                <ToolbarButton
                    style={{ float:"right" }}
                    onClick={() => setThreeControl("fps")}
                    active={threeControl === "fps"}>
                    <BsFillPinMapFill />
                </ToolbarButton>
                <ToolbarButton
                    style={{ float:"right" }}
                    onClick={() => setThreeControl("orbit")}
                    active={threeControl === "orbit"}>
                    <BsGlobeAmericas />
                </ToolbarButton>
                <ToolbarButton
                    style={{ float:"right" }}
                    onClick={() => setThreeControl("object")}
                    active={threeControl === "object"}>
                    <BsGeoAlt />
                </ToolbarButton>
                <ToolbarButton
                    style={{ float:"right" }}
                    onClick={() => setThreeControl("trackball")}
                    active={threeControl === "trackball"}>
                    <BsArrowsFullscreen />
                </ToolbarButton>
            </div>
            <div className="flex flex-row justify-around">
                {
                    (layout === "normal" || layout === "canvas") && editorDimensions[0] && <div className="relative overflow-x-auto shadow-md
                    m-auto w-full mt-2 p-0">
                        <CanvasEditor reference={reference}
                                      items={map.items}
                                      width={editorDimensions[0]}
                                      height={editorDimensions[1]}
                                      setItems={setItems}
                        />
                    </div>
                }
                {
                    (layout === "normal" || layout === "three") && editorDimensions[0] && <div className="relative overflow-x-auto shadow-md
                   m-auto w-full mt-2 border-2 p-0">
                        <ThreeComponent items={map.items}
                                        selected={selected}
                                        width={editorDimensions[0]}
                                        height={editorDimensions[1]}
                                        setItems={setItems}
                                        reference={reference}
                                        threeControl={threeControl}
                                        grassEnabled={grassEnabled}
                                        skyEnabled={true}
                                        assets={assets}
                                        selectAsset={()=>console.log('TODO')/*TODO*/}
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

                <div className="w-[115px] inline-block">
                    <StyledSelect
                        style={{ borderColor: reference.type === "model" ? "white" : "gray" }}
                        className={"relative z-0 w-full group m-1 pr-3"}
                        type="text" name="texture"
                        options={assets
                            .filter(a=>a.id)
                            .map((a, index)=> {
                            return {
                                name: a.name || a.id,
                                value: a.id
                            } as StyledSelectOption
                        })}
                        value={reference.id || ''}
                        onSelect={(event) => {
                            const node = event.target as HTMLSelectElement;
                            const id = node.value;
                            const asset = assets.find(a => a.id === id);
                            if (asset) {
                                selectedModel(asset);
                            }
                        }}
                        label=""
                    />
                </div>

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