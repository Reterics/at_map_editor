import Layout from "@/app/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BsArrowLeft,
    BsArrowRight,
    BsArrowUpLeft,
    BsArrowUp,
    BsArrowUpRight,
    BsArrowDownLeft,
    BsArrowDown,
    BsArrowDownRight
} from "react-icons/bs";
import { ATMap, Coordinates } from "@/src/types/map";
import { db, firebaseCollections, getCollection } from "@/src/firebase/config";
import { doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { Constants } from "@/src/constants";
import { TableViewActions, TableViewComponent } from "uic-pack";

export const useGridProperties = (coordinates: Coordinates, projection2D: ATMap[][]) => {
    const gridTemplateColumns: string[] = [];
    const gridNodes: React.ReactNode[] = [];

    for (let i = coordinates.x; i < Constants.grid.x + coordinates.x; i++) {
        for (let j = coordinates.y; j < Constants.grid.y + coordinates.y; j++) {
            const x = i > 10000 ? 10000 - i : i < 0 ? 10000 - i : i;
            const y = j > 10000 ? 10000 - j : j < 0 ? 10000 - j : j;
            if (projection2D[x]?.[y]) {
                const map  = projection2D[x][y];
                gridNodes.push((<Link
                    style={{
                        background: map.texture ? "url('"+map.texture+"')" : '#004900'
                    }}
                    id={map.id}
                    key={map.id}
                    className='map-grid ready' href={'/editor?id=' + map.id}> </Link>))

            } else {
                const name = x.toString().padStart(4, '0') + '-' + y.toString().padStart(4, '0')
                gridNodes.push((<Link
                    key={name}
                    className='map-grid'
                    href={'/editor?name=' + name}> </Link>))
            }
        }
        gridTemplateColumns.push('1fr');
    }

    return { gridNodes, gridTemplateColumns }
}
export default function Home() {
    const router = useRouter();
    const [maps, setMaps] = useState<ATMap[]>([]);
    const [coordinates, setCoordinates] = useState<Coordinates>({ x: 0, y: 0 });

    const projection2D: ATMap[][] = Array.from(Array(Constants.grid.x)).map(_=>[]);

    maps.forEach(map => {
        if (!map.name) {
            return;
        }
        const coords = map.name.split('-').map(a=>Number(a));
        const eligible = coords.length >= 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1]);

        if (eligible) {
            const x = coords.shift() as number;
            const y = coords.shift() as number
            if (projection2D[x]) {
                projection2D[x][y] = map;
            }
        }
    });

    const { gridNodes, gridTemplateColumns } = useGridProperties(coordinates, projection2D);

    const deleteMap = async (id: string|undefined) => {
        if (id && window.confirm('Are you sure you wish to delete this Map?')) {
            await deleteDoc(doc(db, firebaseCollections.maps, id));
        }
    };

    const openMap = (map: ATMap) => {
        router.push('/editor?id=' + map.id);
    };

    const refreshMaps = async () => {
        getCollection(firebaseCollections.maps).then((maps) => setMaps(maps as ATMap[]));
    };
    useEffect(() => {
        void refreshMaps();
    }, []);

    const moveMap = (deltaX: number, deltaY: number) => {
        setCoordinates({
            x: coordinates.x + deltaX,
            y: coordinates.y + deltaY
        });
    };

    const tableLines = maps.map((map: ATMap) => [
        map.id,
        map.name || "No name defined",
        map.author || "You",
        map.created ? new Date(map.created).toISOString().replace(/[TZ]/g, ' ').split('.')[0] : '',
        TableViewActions({
            onEdit: () => {
                openMap(map);
            },
            onRemove: () => {
                void deleteMap(map.id)
            }
        })
    ])
    const cssPointer = { cursor: "pointer" };
    return (
        <Layout>

            <div className="grid-outer max-w-[720px] m-auto">
                <div className="flex w-full flex-row justify-between">
                    <BsArrowUpLeft style={cssPointer} onClick={()=> moveMap(-1, -1)}/>
                    <BsArrowUp style={cssPointer} onClick={()=> moveMap(-1, 0)}/>
                    <BsArrowUpRight  style={cssPointer} onClick={()=> moveMap(-1, 1)}/>
                </div>

                <div className="flex w-full flex-row justify-between">
                    <div className="flex align-middle items-center">
                        <BsArrowLeft style={cssPointer} onClick={()=> moveMap(0, -1)}/>
                    </div>

                    <div className="grid-container grid w-fit m-auto mt-2 mb-2" style={{
                        gridTemplateColumns: gridTemplateColumns.join(' ')
                    }}>
                        {gridNodes}
                    </div>

                    <div className="flex align-middle items-center">
                        <BsArrowRight style={cssPointer} onClick={()=> moveMap(0, 1)}/>
                    </div>
                </div>
                <div className="flex w-full flex-row justify-between">
                    <BsArrowDownLeft style={cssPointer} onClick={()=> moveMap(1, -1)}/>
                    <BsArrowDown style={cssPointer} onClick={()=> moveMap(1, 0)}/>
                    <BsArrowDownRight style={cssPointer} onClick={()=> moveMap(1, 1)}/>
                </div>
            </div>


            <div className="relative overflow-x-auto shadow-md  max-w-screen-xl m-auto w-full mt-2">
                <TableViewComponent lines={tableLines} header={['ID', 'Name', 'Author', 'Created At', 'Action']}/>
            </div>
        </Layout>
    )
}
