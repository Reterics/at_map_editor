import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BsPencilSquare,
    BsFillTrashFill,
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
import { doc } from "firebase/firestore";
import { deleteDoc } from "@firebase/firestore";
import Link from "next/link";
import { Constants } from "@/src/constants";

export default function Home() {
    const [maps, setMaps] = useState([] as ATMap[]);
    const router = useRouter();
    const projection2D : ATMap[][] = Array.from(Array(Constants.grid.x)).map(_=>[]);
    const gridTemplateColumns: string[] = [];
    const gridNodes = [];

    const [coordinates, setCoordinates] = useState<Coordinates>({ x: 0, y: 0 });

    maps.forEach(map=>{
        if (!map.name) {
            return;
        }
        const coordinates = map.name.split('-').map(a=>Number(a));
        const eligible = coordinates.length >= 2 && !Number.isNaN(coordinates[0]) && !Number.isNaN(coordinates[1]);

        if (eligible) {
            const x = coordinates.shift() as number;
            const y = coordinates.shift() as number
            if (projection2D[x]) {
                projection2D[x][y] = map;
            }
        }
    });

    for (let i = coordinates.x; i < Constants.grid.x + coordinates.x; i++) {
        for (let j = coordinates.y; j < Constants.grid.y + coordinates.y; j++) {
            const x = i > 10000 ? 10000 - i : i < 0 ? 10000 - i : i;
            const y = j > 10000 ? 10000 - j : j < 0 ? 10000 - j : j;
            if (projection2D[x] && projection2D[x][y]) {
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

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            ID
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Author
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Created At
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Action
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {maps.map((map) =>
                        <tr key={map.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">

                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.id}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.name || "No name defined"}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.author || "You"}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.created ? new Date(map.created).toISOString().replace(/[TZ]/g, ' ').split('.')[0] : ''}
                            </th>
                            <td className="px-6 py-4 flex flex-row text-lg">
                                <BsPencilSquare className="cursor-pointer ml-2" onClick={() => openMap(map)}/>
                                <BsFillTrashFill className="cursor-pointer ml-2" onClick={() =>
                                    deleteMap(map.id)}/>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

        </Layout>
    )
}